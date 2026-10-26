"""الحوض العظمي (27/10/2026): يبني models/pelvis.glb + models/pelvis.json من BodyParts3D (isa_BP3D_4.0_obj_99).

يستعمل نفس دوال build_models.py (التنعيم، الضغط، الدبابيس) بدون ما يعيد بناء الموديلات القديمة،
ويكتب ملفات جديدة بس. الحوض جهتين (يمين ويسار) لأنه بالنص، فكل جزء إله مفتاح صريح:
الجهة اليسرى تاخذ نفس مفتاح الطرف السفلي القديم (hip-bone، iliacus…) حتى تنعاد بطاقات info.json،
واليمنى تاخذ «-right».
الاستعمال: python3 build_pelvis.py <مجلد OBJ>
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
src = (HERE / "build_models.py").read_text(encoding="utf-8").split("OUT.mkdir(exist_ok=True)")[0]
sys.argv = [sys.argv[0], sys.argv[1], "/dev/null"] if len(sys.argv) > 1 else sys.argv
# نشغّل بس قسم الدوال من build_models.py (بدون بناء أي موديل قديم)، وخريطة الأسماء هنا
src = src.replace("OBJ_DIR, MAP = Path(sys.argv[1]), json.load(open(sys.argv[2]))", "OBJ_DIR, MAP = Path(sys.argv[1]), {}")
exec(compile(src, "build_models.py", "exec"))

# ملفات BodyParts3D مباشرة (FJ…): كل جزء (مفتاح، ملفات، الإنكليزي، العربي، المنطقة، المجموعة، الطبقة)
P = [
    # ── عظام الحوض
    ("hip-bone",       ["FJ3288"], "Hip bone (left)",  "عظم الورك الأيسر (الحرقفة + الإسك + العانة)", "pelvis", "bone", "bone"),
    ("hip-bone-right", ["FJ3152"], "Hip bone (right)", "عظم الورك الأيمن (الحرقفة + الإسك + العانة)", "pelvis", "bone", "bone"),
    ("sacrum",         ["FJ3393"], "Sacrum", "العجز", "pelvis", "sacral", "bone"),
    # ── سياق: الفقرات القطنية وأقراصها، وعظما الفخذ (تبين خافتة)
    ("l1-vertebra", ["FJ3157"], "L1 vertebra", "الفقرة القطنية الأولى", "spine", "lumbar", "bone"),
    ("l2-vertebra", ["FJ3159"], "L2 vertebra", "الفقرة القطنية الثانية", "spine", "lumbar", "bone"),
    ("l3-vertebra", ["FJ3162"], "L3 vertebra", "الفقرة القطنية الثالثة", "spine", "lumbar", "bone"),
    ("l4-vertebra", ["FJ3165"], "L4 vertebra", "الفقرة القطنية الرابعة", "spine", "lumbar", "bone"),
    ("l5-vertebra", ["FJ3168"], "L5 vertebra", "الفقرة القطنية الخامسة", "spine", "lumbar", "bone"),
    ("intervertebral-disc-l1-l2", ["FJ3212"], "Intervertebral disc L1–L2", "القرص بين الفقرات L1–L2", "spine", "disc", "bone"),
    ("intervertebral-disc-l2-l3", ["FJ3214"], "Intervertebral disc L2–L3", "القرص بين الفقرات L2–L3", "spine", "disc", "bone"),
    ("intervertebral-disc-l3-l4", ["FJ3215"], "Intervertebral disc L3–L4", "القرص بين الفقرات L3–L4", "spine", "disc", "bone"),
    ("intervertebral-disc-l4-l5", ["FJ3216"], "Intervertebral disc L4–L5", "القرص بين الفقرات L4–L5", "spine", "disc", "bone"),
    ("intervertebral-disc-l5-s1", ["FJ3217"], "Intervertebral disc L5–S1", "القرص بين الفقرات L5–S1", "spine", "disc", "bone"),
    ("femur",       ["FJ3259"], "Femur (left)",  "عظم الفخذ الأيسر", "thigh", "bone", "bone"),
    ("femur-right", ["FJ3365"], "Femur (right)", "عظم الفخذ الأيمن", "thigh", "bone", "bone"),
    # ── عضلات: جدار البطن الخلفي والحفرة الحرقفية (سطحية من گدّام)
    ("psoas-major",       ["FJ1431M"], "Psoas major (left)",  "القطنية الكبرى (يسار)", "pelvis", "iliopsoas", "sup"),
    ("psoas-major-right", ["FJ1431"],  "Psoas major (right)", "القطنية الكبرى (يمين)", "pelvis", "iliopsoas", "sup"),
    ("iliacus",           ["FJ1422M"], "Iliacus (left)",  "الحرقفية (يسار)", "pelvis", "iliopsoas", "sup"),
    ("iliacus-right",     ["FJ1422"],  "Iliacus (right)", "الحرقفية (يمين)", "pelvis", "iliopsoas", "sup"),
    # ── قاع الحوض (الحجاب الحوضي): الرافعة الشرجية بأجزائها الثلاثة + العصعصية
    ("pubococcygeus",        ["FJ2545"], "Pubococcygeus (left)",  "العانية العصعصية (يسار)", "pelvis", "pelvic-floor", "mid"),
    ("pubococcygeus-right",  ["FJ2550"], "Pubococcygeus (right)", "العانية العصعصية (يمين)", "pelvis", "pelvic-floor", "mid"),
    ("puborectalis",         ["FJ2546"], "Puborectalis (left)",  "العانية المستقيمية (يسار)", "pelvis", "pelvic-floor", "mid"),
    ("puborectalis-right",   ["FJ2551"], "Puborectalis (right)", "العانية المستقيمية (يمين)", "pelvis", "pelvic-floor", "mid"),
    ("iliococcygeus",        ["FJ2544"], "Iliococcygeus (left)",  "الحرقفية العصعصية (يسار)", "pelvis", "pelvic-floor", "mid"),
    ("iliococcygeus-right",  ["FJ2549"], "Iliococcygeus (right)", "الحرقفية العصعصية (يمين)", "pelvis", "pelvic-floor", "mid"),
    ("coccygeus",            ["FJ2542"], "Coccygeus (left)",  "العصعصية (يسار)", "pelvis", "pelvic-floor", "mid"),
    ("coccygeus-right",      ["FJ2547"], "Coccygeus (right)", "العصعصية (يمين)", "pelvis", "pelvic-floor", "mid"),
    ("external-anal-sphincter", ["FJ2543", "FJ2548"], "External anal sphincter", "المصرّة الشرجية الظاهرة", "pelvis", "pelvic-floor", "mid"),
    # ── جدار الحوض (عميقة)
    ("piriformis",               ["FJ1428M"], "Piriformis (left)",  "الكمثرية (يسار)", "pelvis", "pelvic-wall", "deep"),
    ("piriformis-right",         ["FJ1428"],  "Piriformis (right)", "الكمثرية (يمين)", "pelvis", "pelvic-wall", "deep"),
    ("obturator-internus",       ["FJ1426M"], "Obturator internus (left)",  "السدّادة الباطنة (يسار)", "pelvis", "pelvic-wall", "deep"),
    ("obturator-internus-right", ["FJ1426"],  "Obturator internus (right)", "السدّادة الباطنة (يمين)", "pelvis", "pelvic-wall", "deep"),
]

parts, meta = [], []
for key, files, en, ar, region, grp, layer in P:
    MAP[key] = files
    v, f = part_mesh([key])
    if len(f) < 2500:
        v, f = subdivide(v, f); v = taubin(v, f, it=4)
    parts.append((key, v, f))
    meta.append({"key": key, "en": en, "ar": ar, "kind": "bone" if layer == "bone" else "muscle",
                 "region": region, "grp": grp, "layer": layer})
assert len({m["key"] for m in meta}) == len(meta), "مفتاح مكرر"
center, scale = write_glb(OUT / "pelvis.glb", parts, quantize=True)
for m, (_, v, _f) in zip(meta, parts):
    m["pin"] = [round(float(x), 4) for x in (anchor(v, m["kind"] == "muscle") - center) * scale]
(OUT / "pelvis.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
print("pelvis.glb", f"{(OUT / 'pelvis.glb').stat().st_size / 1e6:.2f} MB", len(meta), "parts")
