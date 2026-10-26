"""القفص الصدري (27/10/2026): يبني models/chest.glb + models/chest.json من BodyParts3D (isa_BP3D_4.0_obj_99).

نفس دوال build_models.py، بس الأضلاع والعضلات العريضة (المسننة، الحجاب الحاجز) ثقيلة، فنخففها
بتجميع النقاط على شبكة (vertex clustering) قبل التنعيم حتى يبقى الملف خفيف على الموبايل.
الجهة اليسرى واليمنى كل وحدة بمفتاح «-left» و«-right».
الاستعمال: python3 build_chest.py <مجلد OBJ>
"""
import json, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
src = (HERE / "build_models.py").read_text(encoding="utf-8").split("OUT.mkdir(exist_ok=True)")[0]
src = src.replace("OBJ_DIR, MAP = Path(sys.argv[1]), json.load(open(sys.argv[2]))", "OBJ_DIR, MAP = Path(sys.argv[1]), {}")
exec(compile(src, "build_models.py", "exec"))


def decimate(v, f, target):
    """يصغّر عدد المثلثات لحدود target بتجميع النقاط على شبكة، ويحافظ على اتجاه المثلثات."""
    if len(f) <= target:
        return v, f
    lo, hi = 1e-3, float(np.ptp(v, 0).max()) / 10
    best = (v, f)
    for _ in range(18):
        cell = (lo + hi) / 2
        q = np.floor(v / cell).astype(np.int64)
        _, inv, cnt = np.unique(q, axis=0, return_inverse=True, return_counts=True)
        inv = inv.ravel()
        nv = np.zeros((len(cnt), 3)); np.add.at(nv, inv, v); nv /= cnt[:, None]
        nf = inv[f]
        nf = nf[(nf[:, 0] != nf[:, 1]) & (nf[:, 1] != nf[:, 2]) & (nf[:, 0] != nf[:, 2])]
        _, keep = np.unique(np.sort(nf, 1), axis=0, return_index=True)
        nf = nf[np.sort(keep)]
        if len(nf) > target:
            lo = cell
        else:
            hi = cell; best = (nv.astype(np.float32), nf)
    return best


def mesh(files, target):
    vs, fs, off = [], [], 0
    for fj in files:
        v, f = weld(*load_obj(OBJ_DIR / f"{fj}.obj"))
        vs.append(v); fs.append(f + off); off += len(v)
    v, f = np.concatenate(vs), np.concatenate(fs)
    v, f = decimate(v, f, target)
    used = np.unique(f); remap = np.full(len(v), -1); remap[used] = np.arange(len(used))
    v, f = v[used], remap[f]
    v = taubin(v, f, it=8)
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1).astype(np.float32), f


ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"]
NUM = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"]
AR = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر"]
EL = {}
for line in open(Path(sys.argv[1]).parent.parent / "isa_element_parts.txt", encoding="utf-8"):
    c, n, fj = line.rstrip("\n").split("\t"); EL.setdefault(n, []).append(fj)
# خريطة الأسماء القديمة (map.json) أولاً، وإلا ملف العنصر الوحيد بالقائمة
BPMAP = json.load(open(Path(sys.argv[1]).parent.parent / "map.json"))
def one(n):
    if n in BPMAP: return BPMAP[n]
    assert len(EL[n]) == 1, (n, EL[n]); return EL[n]

# (مفتاح، ملفات، الإنكليزي، العربي، المنطقة، المجموعة، الطبقة، حد المثلثات)
P = [
    ("manubrium", one("manubrium"), "Manubrium of sternum", "قبضة القص", "chest", "sternum", "bone", 4000),
    ("body-of-sternum", one("body of sternum"), "Body of sternum", "جسم القص", "chest", "sternum", "bone", 4000),
    ("xiphoid-process", one("xiphoid process"), "Xiphoid process", "الناتئ الرهابي (الخنجري)", "chest", "sternum", "bone", 3000),
]
for side, sar in (("left", "الأيسر"), ("right", "الأيمن")):
    for i in range(12):
        grp = "rib-true" if i < 7 else "rib-false" if i < 10 else "rib-floating"
        P.append((f"{NUM[i]}-rib-{side}", one(f"{side} {ORD[i]} rib"), f"{NUM[i]} rib ({side})", f"الضلع {AR[i]} {sar}", "chest", grp, "bone", 6000))
    for i in range(7):
        P.append((f"{NUM[i]}-costal-cartilage-{side}", one(f"{side} {ORD[i]} costal cartilage"), f"{NUM[i]} costal cartilage ({side})",
                  f"الغضروف الضلعي {AR[i]} {sar}", "chest", "cartilage", "bone", 2000))
    P += [
        (f"clavicle-{side}", one(f"{side} clavicle"), f"Clavicle ({side})", f"الترقوة {'اليسرى' if side == 'left' else 'اليمنى'}", "chest", "girdle", "bone", 4000),
        (f"scapula-{side}", one(f"{side} scapula"), f"Scapula ({side})", f"لوح الكتف {sar}", "chest", "girdle", "bone", 30000),
    ]
# سياق: الفقرات الصدرية (خافتة)
TAR = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة", "الحادية عشرة", "الثانية عشرة"]
for i in range(12):
    P.append((f"t{i+1}-vertebra", one(f"{ORD[i]} thoracic vertebra"), f"T{i+1} vertebra", f"الفقرة الصدرية {TAR[i]}", "spine", "thoracic", "bone", 3000))
# العضلات
for side, s in (("left", "يسار"), ("right", "يمين")):
    P += [
        (f"pectoralis-major-clavicular-{side}", one(f"clavicular part of {side} pectoralis major"), f"Pectoralis major — clavicular part ({side})", f"الصدرية الكبرى — الجزء الترقوي ({s})", "chest", "pectoral", "sup", 5000),
        (f"pectoralis-major-sternocostal-{side}", one(f"sternocostal part of {side} pectoralis major"), f"Pectoralis major — sternocostal part ({side})", f"الصدرية الكبرى — الجزء القصي الضلعي ({s})", "chest", "pectoral", "sup", 6000),
        (f"pectoralis-major-abdominal-{side}", one(f"abdominal part of {side} pectoralis major"), f"Pectoralis major — abdominal part ({side})", f"الصدرية الكبرى — الجزء البطني ({s})", "chest", "pectoral", "sup", 3000),
        (f"pectoralis-minor-{side}", one(f"{side} pectoralis minor"), f"Pectoralis minor ({side})", f"الصدرية الصغرى ({s})", "chest", "pectoral", "mid", 6000),
        (f"subclavius-{side}", one(f"{side} subclavius"), f"Subclavius ({side})", f"تحت الترقوة ({s})", "chest", "pectoral", "mid", 2000),
        (f"serratus-anterior-{side}", one(f"{side} serratus anterior"), f"Serratus anterior ({side})", f"المسنّنة الأمامية ({s})", "chest", "thoracic-wall", "mid", 60000),
    ]
P.append(("diaphragm", one("diaphragm"), "Diaphragm", "الحجاب الحاجز", "chest", "respiratory", "deep", 80000))

parts, meta = [], []
for key, files, en, ar, region, grp, layer, target in P:
    v, f = mesh(files, target)
    parts.append((key, v, f))
    meta.append({"key": key, "en": en, "ar": ar, "kind": "bone" if layer == "bone" else "muscle",
                 "region": region, "grp": grp, "layer": layer})
assert len({m["key"] for m in meta}) == len(meta), "مفتاح مكرر"
center, scale = write_glb(OUT / "chest.glb", parts, quantize=True)
for m, (_, v, _f) in zip(meta, parts):
    m["pin"] = [round(float(x), 4) for x in (anchor(v, m["kind"] == "muscle") - center) * scale]
(OUT / "chest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
print("chest.glb", f"{(OUT / 'chest.glb').stat().st_size / 1e6:.2f} MB", len(meta), "parts",
      sum(len(p[1]) for p in parts), "verts")
