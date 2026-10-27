"""البطن (27/10/2026): يبني models/abdomen.glb + models/abdomen.json من BodyParts3D (isa_BP3D_4.0_obj_99).

البطن كان أشعة بس؛ هسه مجسّم بثلاث تبويبات: العظام (الفقرات القطنية، الأضلاع 10–12، الحوض)،
والعضلات (المائلة الظاهرة، القطنية الكبرى، الحرقفية، الحجاب الحاجز)، والأحشاء (kind = "organ")
بطبقتين: داخل الصفاق (organ) وخلف الصفاق (retro) — مثل ما يحتاجها طالب الأشعة لقراءة أشعة البطن.
مصدر BodyParts3D ما بيه المستقيمة البطنية ولا المائلة الباطنة ولا المستعرضة البطنية ولا المربعة القطنية
ولا القولون السيني ولا الأعور، فهذني بالبطاقات والرسوم بس.
نفس مفاتيح العظام والعضلات القديمة (l1-vertebra، 10th-rib-left، psoas-major…) حتى تنعاد بطاقاتها.
الاستعمال: python3 build_abdomen.py <مجلد OBJ>
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
    """نفس build_chest.py: تجميع النقاط على شبكة حتى ينزل عدد المثلثات لحدود target."""
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
    if len(f) < 2500:
        v, f = subdivide(v, f)
    v = taubin(v, f, it=8)
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1).astype(np.float32), f


EL = {}
for line in open(Path(sys.argv[1]).parent.parent / "isa_element_parts.txt", encoding="utf-8"):
    c, n, fj = line.rstrip("\n").split("\t"); EL.setdefault(n, []).append(fj)
def all_of(*names):
    out = []
    for n in names:
        out += [x for x in EL[n] if x not in out]
    return out

# الكبد = كل القطع الكبدية (هذا المصدر يقسمه لقطع) + الفص المذنّب
LIVER = ["FJ1858", "FJ2409", "FJ2816", "FJ2818", "FJ2819", "FJ2820", "FJ2821", "FJ2822", "FJ2823", "FJ2824"]
JEJUNUM = all_of("proximal part of jejunum", "middle part of jejunum", "distal part of jejunum")
ILEUM = all_of("proximal part of ileum", "middle part of ileum", "distal part of ileum")

ORD = {10: "tenth", 11: "eleventh", 12: "twelfth"}
AR = {10: "العاشر", 11: "الحادي عشر", 12: "الثاني عشر"}
LAR = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة"]
LF = ["FJ3157", "FJ3159", "FJ3162", "FJ3165", "FJ3168"]
DF = ["FJ3212", "FJ3214", "FJ3215", "FJ3216", "FJ3217"]

# (مفتاح، ملفات، الإنكليزي، العربي، المجموعة، الطبقة، حد المثلثات، اللون للأحشاء)
P = []
# ── العظام
for i in range(5):
    P.append((f"l{i+1}-vertebra", [LF[i]], f"L{i+1} vertebra", f"الفقرة القطنية {LAR[i]}", "lumbar", "bone", 5000, None))
for i, nxt in enumerate(["L2", "L3", "L4", "L5", "S1"]):
    P.append((f"intervertebral-disc-l{i+1}-{nxt.lower()}", [DF[i]], f"Intervertebral disc L{i+1}–{nxt}", f"القرص بين الفقرات L{i+1}–{nxt}", "disc", "bone", 2000, None))
for side, sar in (("left", "الأيسر"), ("right", "الأيمن")):
    for n in (10, 11, 12):
        P.append((f"{n}th-rib-{side}", EL[f"{side} {ORD[n]} rib"], f"{n}th rib ({side})", f"الضلع {AR[n]} {sar}",
                  "rib-false" if n == 10 else "rib-floating", "bone", 5000, None))
P += [
    ("hip-bone", ["FJ3288"], "Hip bone (left)", "عظم الورك الأيسر (الحرقفة + الإسك + العانة)", "bone", "bone", 20000, None),
    ("hip-bone-right", ["FJ3152"], "Hip bone (right)", "عظم الورك الأيمن (الحرقفة + الإسك + العانة)", "bone", "bone", 20000, None),
    ("sacrum", ["FJ3393"], "Sacrum", "العجز", "sacral", "bone", 12000, None),
]
# ── العضلات
P += [
    ("external-oblique-left", ["FJ1452M"], "External oblique (left)", "المائلة الظاهرة (يسار)", "abd-wall", "sup", 14000, None),
    ("external-oblique-right", ["FJ1452"], "External oblique (right)", "المائلة الظاهرة (يمين)", "abd-wall", "sup", 14000, None),
    ("diaphragm", ["FJ3131"], "Diaphragm", "الحجاب الحاجز", "respiratory", "deep", 40000, None),
    ("psoas-major", ["FJ1431M"], "Psoas major (left)", "القطنية الكبرى (يسار)", "iliopsoas", "deep", 8000, None),
    ("psoas-major-right", ["FJ1431"], "Psoas major (right)", "القطنية الكبرى (يمين)", "iliopsoas", "deep", 8000, None),
    ("iliacus", ["FJ1422M"], "Iliacus (left)", "الحرقفية (يسار)", "iliopsoas", "deep", 6000, None),
    ("iliacus-right", ["FJ1422"], "Iliacus (right)", "الحرقفية (يمين)", "iliopsoas", "deep", 6000, None),
]
# ── الأحشاء: داخل الصفاق (organ) وخلف الصفاق (retro)
P += [
    ("liver", LIVER, "Liver", "الكبد", "liver", "organ", 24000, "#9a4a3c"),
    ("gallbladder", ["FJ2817"], "Gallbladder", "المرارة", "biliary", "organ", 4000, "#5f9a55"),
    ("stomach", ["FJ2564"], "Stomach", "المعدة", "gi", "organ", 8000, "#df9c95"),
    ("spleen", ["FJ2561"], "Spleen", "الطحال", "spleen", "organ", 5000, "#8a3f5f"),
    ("jejunum", JEJUNUM, "Jejunum", "الصائم", "gi", "organ", 16000, "#eab7a6"),
    ("ileum", ILEUM, "Ileum", "اللفائفي", "gi", "organ", 16000, "#e3a88f"),
    ("ileocecal-junction", ["FJ2599"], "Ileocaecal junction (caecum region)", "الوصل اللفائفي الأعوري (منطقة الأعور)", "colon", "organ", 4000, "#cf9a72"),
    ("appendix", ["FJ2565"], "Vermiform appendix", "الزائدة الدودية", "colon", "organ", 2500, "#d9a77f"),
    ("transverse-colon", ["FJ2572"], "Transverse colon", "القولون المستعرض", "colon", "organ", 8000, "#c98f68"),
    ("duodenum", ["FJ2573"], "Duodenum", "الاثنا عشري", "gi", "retro", 6000, "#e7b09c"),
    ("pancreas", ["FJ1895"], "Pancreas", "البنكرياس", "pancreas", "retro", 8000, "#e8c47c"),
    ("ascending-colon", ["FJ2566"], "Ascending colon", "القولون الصاعد", "colon", "retro", 8000, "#c98f68"),
    ("descending-colon", ["FJ2567"], "Descending colon", "القولون النازل", "colon", "retro", 8000, "#c98f68"),
    ("rectum", ["FJ2571"], "Rectum", "المستقيم", "colon", "retro", 5000, "#b97c5d"),
    ("kidney-right", ["FJ3147"], "Right kidney", "الكلية اليمنى", "urinary", "retro", 6000, "#a2493c"),
    ("kidney-left", ["FJ3145"], "Left kidney", "الكلية اليسرى", "urinary", "retro", 6000, "#a2493c"),
    ("adrenal-right", ["FJ3130"], "Right suprarenal (adrenal) gland", "الغدة الكظرية اليمنى", "urinary", "retro", 3000, "#e0a54a"),
    ("adrenal-left", ["FJ3129"], "Left suprarenal (adrenal) gland", "الغدة الكظرية اليسرى", "urinary", "retro", 3000, "#e0a54a"),
    ("ureter-right", ["FJ3146"], "Right ureter", "الحالب الأيمن", "urinary", "retro", 3000, "#e9d58a"),
    ("ureter-left", ["FJ3144"], "Left ureter", "الحالب الأيسر", "urinary", "retro", 3000, "#e9d58a"),
    ("urinary-bladder", ["FJ3149"], "Urinary bladder", "المثانة البولية", "urinary", "retro", 3000, "#ebc77a"),
    ("abdominal-aorta", ["FJ1932"], "Abdominal aorta", "الأبهر البطني", "vessel", "retro", 5000, "#d0392b"),
    ("inferior-vena-cava", ["FJ3441", "FJ3659"], "Inferior vena cava", "الوريد الأجوف السفلي", "vessel", "retro", 5000, "#3c55a0"),
]

parts, meta = [], []
for key, files, en, ar, grp, layer, target, tint in P:
    v, f = mesh(files, target)
    parts.append((key, v, f))
    kind = "bone" if layer == "bone" else "organ" if layer in ("organ", "retro") else "muscle"
    m = {"key": key, "en": en, "ar": ar, "kind": kind, "region": "abdomen", "grp": grp, "layer": layer}
    if tint:
        m["tint"] = tint
    meta.append(m)
assert len({m["key"] for m in meta}) == len(meta), "مفتاح مكرر"
center, scale = write_glb(OUT / "abdomen.glb", parts, quantize=True)
for m, (_, v, _f) in zip(meta, parts):
    m["pin"] = [round(float(x), 4) for x in (anchor(v, m["kind"] == "muscle") - center) * scale]
(OUT / "abdomen.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
print("abdomen.glb", f"{(OUT / 'abdomen.glb').stat().st_size / 1e6:.2f} MB", len(meta), "parts",
      sum(len(p[1]) for p in parts), "verts", sum(len(p[2]) for p in parts), "faces")
