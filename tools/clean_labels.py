# تنظيف تأشير الأشعة للخريطة الجديدة (قرار محمد 27/10/2026):
# ما تبقى أي نقطة إلا إذا موضعها مؤكد 100% من المصدر نفسه. كل النقاط القديمة انحطت بالتقدير
# (بالعين)، فتنشال كلها، وتنحط بدالها بس النقاط اللي المصدر نفسه مأشّرها:
#   - chest-pa: حالة Radiopaedia 231508 بيها 9 تأشيرات (أسهم) بإحداثياتها
#     (https://radiopaedia.org/studies/177339/annotated_viewer_json) — الصورة 2828×2712،
#     صورتنا مصغّرة بدون قص بمقياس 0.70771 (img/xray/hd/log.json).
#   - shoulder-ap: ملف Hellerhoff بويكيميديا إله نسخة مؤشّرة
#     «Tuberositas deltoidea 71W - CR - 001 - Annotation.jpg» ملوّن بيها الحدبة الدالية بس؛
#     نفس أبعاد صورتنا 842×1742 (بدون قص ولا تكبير)، والنقطة = مركز المنطقة الملوّنة.
# كل نقطة من المصدر بيها عنصر سادس p[5] = اسم المصدر (الواجهة ما تستعمله).
#
# الاستعمال: python3 tools/clean_labels.py
#   يكتب data/xray-clean.json من data/xray.json (القديم ما يتغيّر أبداً)،
#   وينظّف data/xray-extra.json بمكانه (ملف المعاينة بس): يبقي النقاط اللي بيها p[5] بس.
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RP = "Radiopaedia 231508 (annotation)"
S = 0.7077140835102619  # مقياس صورة الصدر من log.json

def rp(x, y):
    return round(x * S), round(y * S)

SOURCE_PTS = {
    "chest-pa": [
        [*rp(1234, 644), "clavicle-right", "Medial end of right clavicle", "النهاية الإنسية للترقوة اليمنى", RP],
        [*rp(1530, 628), "clavicle-left", "Medial end of left clavicle", "النهاية الإنسية للترقوة اليسرى", RP],
        [*rp(1396, 601), None, "Spinous process", "الناتئ الشوكي", RP],
        [*rp(976, 677), "1st-costal-cartilage-right", "Ossified 1st costochondral junction (right)", "تعظّم الوصل الضلعي الغضروفي الأول (يمين)", RP],
        [*rp(1747, 732), "1st-costal-cartilage-left", "Ossified 1st costochondral junction (left)", "تعظّم الوصل الضلعي الغضروفي الأول (يسار)", RP],
        [*rp(269, 1443), None, "Right chest wall (soft tissue)", "جدار الصدر الأيمن (الأنسجة الرخوة)", RP],
        [*rp(2528, 1502), None, "Left chest wall (soft tissue)", "جدار الصدر الأيسر (الأنسجة الرخوة)", RP],
        [*rp(876, 1985), None, "Lung vessels in posterior costophrenic recess", "أوعية الرئة بالزاوية الضلعية الحجابية الخلفية", RP],
        [*rp(1890, 2243), None, "Gas in gastric fundus", "هواء بقاع المعدة", RP],
        [*rp(2175, 2363), None, "Gas in splenic flexure", "هواء بالثنية الطحالية للقولون", RP],
    ],
    "shoulder-ap": [
        [596, 1289, "humerus", "Deltoid tuberosity", "الحدبة الدالية",
         "Hellerhoff, Wikimedia «Tuberositas deltoidea 71W - CR - 001 - Annotation.jpg»"],
    ],
}

def clean(views):
    for v in views:
        v["pts"] = SOURCE_PTS.get(v["id"]) or [p for p in v["pts"] if len(p) > 5]
    return views

old = json.load(open(os.path.join(ROOT, "data/xray.json"), encoding="utf-8"))
old["views"] = clean(old["views"])
old["_note"] = ("Cleaned copy of data/xray.json for خريطة-جديدة.html (made by tools/clean_labels.py). "
                "Only labels whose position comes from the image's own source are kept (p[5] = source); "
                "all labels that were placed by eye were removed. data/xray.json (live map) is unchanged.")
json.dump(old, open(os.path.join(ROOT, "data/xray-clean.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

ex_path = os.path.join(ROOT, "data/xray-extra.json")
ex = json.load(open(ex_path, encoding="utf-8"))
ex["views"] = clean(ex["views"])
if "estimate" not in ex["_note"]:
    ex["_note"] += (" 27/10/2026: all points here were placed by estimate (none of these sources is annotated), "
                    "so they were removed by tools/clean_labels.py; the list is in تسميات-الخريطة-للمراجعة.md.")
json.dump(ex, open(ex_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

n = lambda vs: sum(len(v["pts"]) for v in vs)
print("xray-clean.json:", n(old["views"]), "points ·", "xray-extra.json:", n(ex["views"]), "points")
