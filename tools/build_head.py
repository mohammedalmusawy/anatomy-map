"""الرأس (الجمجمة) (27/10/2026): يبني models/head.glb + models/head.json من BodyParts3D (isa_BP3D_4.0_obj_99).

نفس دوال build_models.py. عظام الجمجمة صفائح رقيقة فما نخففها. BodyParts3D 4.0 ما بيه عضلات الوجه
ولا عضلات المضغ، فالعضلات هنا بس القصية الترقوية الخشّائية والجلدية العنقية (Platysma).
الاستعمال: python3 build_head.py <مجلد OBJ>
"""
import json, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
src = (HERE / "build_models.py").read_text(encoding="utf-8").split("OUT.mkdir(exist_ok=True)")[0]
src = src.replace("OBJ_DIR, MAP = Path(sys.argv[1]), json.load(open(sys.argv[2]))", "OBJ_DIR, MAP = Path(sys.argv[1]), {}")
exec(compile(src, "build_models.py", "exec"))


def mesh(files):
    vs, fs, off = [], [], 0
    for fj in files:
        v, f = weld(*load_obj(OBJ_DIR / f"{fj}.obj"))
        vs.append(v); fs.append(f + off); off += len(v)
    v, f = np.concatenate(vs), np.concatenate(fs)
    if len(f) < 2500:
        v, f = subdivide(v, f)
    v = taubin(v, f, it=8)
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1).astype(np.float32), f


# (مفتاح، ملفات، الإنكليزي، العربي، المنطقة، المجموعة، الطبقة)
P = [
    ("frontal-bone",   ["FJ3200"], "Frontal bone", "العظم الجبهي", "head", "cranial", "bone"),
    ("parietal-bone-left",  ["FJ3274"], "Parietal bone (left)",  "العظم الجداري الأيسر", "head", "cranial", "bone"),
    ("parietal-bone-right", ["FJ3380"], "Parietal bone (right)", "العظم الجداري الأيمن", "head", "cranial", "bone"),
    ("occipital-bone", ["FJ3309"], "Occipital bone", "العظم القذالي", "head", "cranial", "bone"),
    ("temporal-bone-left",  ["FJ3281"], "Temporal bone (left)",  "العظم الصدغي الأيسر", "head", "cranial", "bone"),
    ("temporal-bone-right", ["FJ3386"], "Temporal bone (right)", "العظم الصدغي الأيمن", "head", "cranial", "bone"),
    ("sphenoid-bone",  ["FJ3394"], "Sphenoid bone", "العظم الوتدي", "head", "cranial", "bone"),
    ("ethmoid-bone",   ["FJ3199"], "Ethmoid bone", "العظم الغربالي", "head", "cranial", "bone"),
    ("maxilla-left",  ["FJ3269"], "Maxilla (left)",  "عظم الفك العلوي الأيسر", "head", "facial", "bone"),
    ("maxilla-right", ["FJ3375"], "Maxilla (right)", "عظم الفك العلوي الأيمن", "head", "facial", "bone"),
    ("mandible",      ["FJ3289"], "Mandible", "عظم الفك السفلي", "head", "facial", "bone"),
    ("zygomatic-bone-left",  ["FJ3287"], "Zygomatic bone (left)",  "العظم الوجني الأيسر", "head", "facial", "bone"),
    ("zygomatic-bone-right", ["FJ3392"], "Zygomatic bone (right)", "العظم الوجني الأيمن", "head", "facial", "bone"),
    ("nasal-bone-left",  ["FJ3272"], "Nasal bone (left)",  "العظم الأنفي الأيسر", "head", "facial", "bone"),
    ("nasal-bone-right", ["FJ3378"], "Nasal bone (right)", "العظم الأنفي الأيمن", "head", "facial", "bone"),
    ("lacrimal-bone-left",  ["FJ3265"], "Lacrimal bone (left)",  "العظم الدمعي الأيسر", "head", "facial", "bone"),
    ("lacrimal-bone-right", ["FJ3371"], "Lacrimal bone (right)", "العظم الدمعي الأيمن", "head", "facial", "bone"),
    ("palatine-bone-left",  ["FJ3273"], "Palatine bone (left)",  "العظم الحنكي الأيسر", "head", "facial", "bone"),
    ("palatine-bone-right", ["FJ3379"], "Palatine bone (right)", "العظم الحنكي الأيمن", "head", "facial", "bone"),
    ("inferior-nasal-concha-left",  ["FJ3263"], "Inferior nasal concha (left)",  "المحارة الأنفية السفلية اليسرى", "head", "facial", "bone"),
    ("inferior-nasal-concha-right", ["FJ3369"], "Inferior nasal concha (right)", "المحارة الأنفية السفلية اليمنى", "head", "facial", "bone"),
    ("vomer",      ["FJ3395"], "Vomer", "الميكعة", "head", "facial", "bone"),
    ("hyoid-bone", ["FJ3201"], "Hyoid bone", "العظم اللامي", "head", "hyoid", "bone"),
    ("sternocleidomastoid-left",  ["FJ1573"], "Sternocleidomastoid (left)",  "القصية الترقوية الخشّائية (يسار)", "head", "neck", "mid"),
    ("sternocleidomastoid-right", ["FJ1595"], "Sternocleidomastoid (right)", "القصية الترقوية الخشّائية (يمين)", "head", "neck", "mid"),
    ("platysma-left",  ["FJ1558"], "Platysma (left)",  "الجلدية العنقية (يسار)", "head", "neck", "sup"),
    ("platysma-right", ["FJ1587"], "Platysma (right)", "الجلدية العنقية (يمين)", "head", "neck", "sup"),
]

parts, meta = [], []
for key, files, en, ar, region, grp, layer in P:
    v, f = mesh(files)
    parts.append((key, v, f))
    meta.append({"key": key, "en": en, "ar": ar, "kind": "bone" if layer == "bone" else "muscle",
                 "region": region, "grp": grp, "layer": layer})
assert len({m["key"] for m in meta}) == len(meta), "مفتاح مكرر"
center, scale = write_glb(OUT / "head.glb", parts, quantize=True)
for m, (_, v, _f) in zip(meta, parts):
    m["pin"] = [round(float(x), 4) for x in (anchor(v, m["kind"] == "muscle") - center) * scale]
(OUT / "head.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
print("head.glb", f"{(OUT / 'head.glb').stat().st_size / 1e6:.2f} MB", len(meta), "parts", sum(len(p[1]) for p in parts), "verts")
