# تأشير الأشعة من المصدر بس (قرار محمد 27/10/2026) — هذا الملف هو المكان الوحيد اللي تجي منه نقاط الأشعة.
#
# القاعدة: ما تبقى أي نقطة إلا إذا موضعها مأخوذ من تأشير المصدر نفسه. كل النقاط القديمة انحطت
# بالتقدير (بالعين)، فتنشال كلها. وكل صورة لازم تكون تشريح طبيعي (الحالات المرضية ما تدخل الخريطة).
#
# REPLACE: صور انبدلت بصورة طبيعية من مصدر مؤشّر (أو لأن القديمة مرضية). الصور الجديدة بـ img/xray/src/
#   وسجلها (المؤلف، الرخصة، الرابط، المقياس) بـ img/xray/src/credits.json.
# SOURCE_PTS: نقاط كل صورة، محسوبة من بيانات تأشير المصدر:
#   - Radiopaedia: ملف https://radiopaedia.org/studies/<studyId>/annotated_viewer_json (موضع رأس السهم
#     arrow_positions[key_arrow_idx]) بإحداثيات الصورة الأصلية × مقياس التصغير (بدون قص).
#   - Hellerhoff (ويكيميديا): الملف «… Annotation» نفس أبعاد الأصلي؛ النقطة = مركز المنطقة الملوّنة،
#     أو رأس السهم الأحمر (أبعد نقطة بالسهم من جهة الرأس) — محسوبة بفرق الصورتين (بكسل بكسل).
# كل نقطة: [x, y, مفتاح المجسم أو None, EN, AR, المصدر] بإحداثيات صورتنا.
#
# الاستعمال: python3 tools/clean_labels.py
#   يكتب data/xray-clean.json من data/xray.json (القديم ما يتغيّر أبداً)،
#   وينظّف data/xray-extra.json بمكانه (ملف الخريطة الجديدة بس).
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RP_CC = "CC BY-NC-SA 3.0"


def rp_scale(s):
    return lambda x, y: (round(x * s), round(y * s))


# ---------- صور انبدلت ----------
REPLACE = {
    # الصورة القديمة (Hellerhoff «Tuberositas deltoidea 71W») بيها كسر رأس العضد → انحفظت بالأطلس المرضي
    # (~/Desktop/المحاضرات/أطلس الحالات المرضية/كتف وعضد/كسر رأس العضد - Proximal humerus fracture/).
    # البديل كتف طبيعي من Radiopaedia (نفس صاحب صورتي Y والإبطي) — ما بيه تأشير، فبدون نقاط.
    "shoulder-ap": dict(
        img="img/xray/src/shoulder-ap-rp80413.jpg", w=1568, h=1226,
        en="Shoulder — AP", ar="الكتف — أمامي خلفي (AP)",
        credit=["Case courtesy of Dai Roberts, Radiopaedia.org, rID: 80413", RP_CC,
                "https://radiopaedia.org/cases/80413"]),
    "chest-lat": dict(
        img="img/xray/src/chest-lat-rp40794.jpg", w=1688, h=2000,
        credit=["Case courtesy of Craig Hacking, Radiopaedia.org, rID: 40794", RP_CC,
                "https://radiopaedia.org/cases/40794"]),
    "skull-pa": dict(
        img="img/xray/src/skull-frontal-hellerhoff.jpg", w=678, h=962,
        en="Skull — frontal (source image: AP)", ar="الجمجمة — أمامي (الصورة المصدر AP)",
        credit=["Hellerhoff", "CC BY-SA 3.0",
                "https://commons.wikimedia.org/wiki/File:NNH_im_Roentgen_frontal_Annotation.png"]),
    # الخريطة الجديدة بس (data/xray-extra.json). بدال صورة Häggström بدون تأشير.
    "chest-pa2": dict(
        img="img/xray/src/chest-pa-rp247006.jpg", w=2000, h=1609,
        en="Chest — frontal (second case, portable)", ar="الصدر — أمامي (حالة ثانية، جهاز متنقل)",
        credit=["Case courtesy of Stefan Tigges, Radiopaedia.org, rID: 247006", RP_CC,
                "https://radiopaedia.org/cases/247006"]),
    "facial-om": dict(
        img="img/xray/src/facial-om-rp220490.jpg", w=570, h=630,
        en="Paranasal sinuses — occipitomental (OM)", ar="الجيوب الأنفية — قذالي ذقني (OM)",
        credit=["Case courtesy of Dalia Ibrahim, Radiopaedia.org, rID: 220490", RP_CC,
                "https://radiopaedia.org/cases/220490"]),
    "knee-ap": dict(
        img="img/xray/src/knee-ap-hellerhoff-55w.jpg", w=886, h=934,
        credit=["Hellerhoff", "CC BY-SA 4.0",
                "https://commons.wikimedia.org/wiki/File:Tuberculum_adductorium_femoris_55W_-_CR_ap_-_001_-_Annotation.jpg"]),
}

# ---------- النقاط ----------
RP_CHEST = "Radiopaedia 231508 (annotation)"
rp = rp_scale(0.7077140835102619)  # صورة الصدر PA من log.json

RP_LAT = "Radiopaedia 40794 (annotation, Craig Hacking)"
lat = rp_scale(2000 / 2865)  # 2418×2865 → 1688×2000، بدون قص

RP_AJL = "Radiopaedia 247006 (annotation, Stefan Tigges)"
ajl = rp_scale(2000 / 3032)  # 3032×2440 → 2000×1609، بدون قص

RP_OM = "Radiopaedia 220490 (annotation, Dalia Ibrahim)"  # 570×630، نفس الحجم

NNH = "Hellerhoff, Wikimedia «NNH im Roentgen frontal Annotation.png» (colour region centre)"
ADD = "Hellerhoff, Wikimedia «Tuberculum adductorium femoris 55W - CR ap - 001 - Annotation.jpg» (arrow tip)"

SOURCE_PTS = {
    "chest-pa": [
        [*rp(1234, 644), "clavicle-right", "Medial end of right clavicle", "النهاية الإنسية للترقوة اليمنى", RP_CHEST],
        [*rp(1530, 628), "clavicle-left", "Medial end of left clavicle", "النهاية الإنسية للترقوة اليسرى", RP_CHEST],
        [*rp(1396, 601), None, "Spinous process", "الناتئ الشوكي", RP_CHEST],
        [*rp(976, 677), "1st-costal-cartilage-right", "Ossified 1st costochondral junction (right)", "تعظّم الوصل الضلعي الغضروفي الأول (يمين)", RP_CHEST],
        [*rp(1747, 732), "1st-costal-cartilage-left", "Ossified 1st costochondral junction (left)", "تعظّم الوصل الضلعي الغضروفي الأول (يسار)", RP_CHEST],
        [*rp(269, 1443), None, "Right chest wall (soft tissue)", "جدار الصدر الأيمن (الأنسجة الرخوة)", RP_CHEST],
        [*rp(2528, 1502), None, "Left chest wall (soft tissue)", "جدار الصدر الأيسر (الأنسجة الرخوة)", RP_CHEST],
        [*rp(876, 1985), None, "Lung vessels in posterior costophrenic recess", "أوعية الرئة بالزاوية الضلعية الحجابية الخلفية", RP_CHEST],
        [*rp(1890, 2243), None, "Gas in gastric fundus", "هواء بقاع المعدة", RP_CHEST],
        [*rp(2175, 2363), None, "Gas in splenic flexure", "هواء بالثنية الطحالية للقولون", RP_CHEST],
    ],
    # study 43455، series 225163 (Left lateral)، 17 تأشير؛ النقطة = السهم الرئيسي (key_arrow_idx = 0)
    "chest-lat": [
        [*lat(1421, 218), None, "Arm soft tissue", "الأنسجة الرخوة للذراع", RP_LAT],
        [*lat(1021, 609), None, "Scapula", "لوح الكتف", RP_LAT],
        [*lat(1556, 571), None, "Ascending aorta", "الأبهر الصاعد", RP_LAT],
        [*lat(988, 1290), None, "Descending aorta", "الأبهر النازل", RP_LAT],
        [*lat(1326, 426), None, "Trachea", "الرغامى (القصبة الهوائية)", RP_LAT],
        [*lat(1977, 869), "body-of-sternum", "Sternum", "عظم القص", RP_LAT],
        [*lat(1223, 1058), None, "Right upper lobe bronchus", "قصبة الفص العلوي الأيمن", RP_LAT],
        [*lat(1251, 1254), None, "Left upper lobe bronchus", "قصبة الفص العلوي الأيسر", RP_LAT],
        [*lat(1367, 1057), None, "Right pulmonary artery", "الشريان الرئوي الأيمن", RP_LAT],
        [*lat(1125, 881), None, "Left pulmonary artery", "الشريان الرئوي الأيسر", RP_LAT],
        [*lat(1149, 299), None, "Oesophagus", "المريء", RP_LAT],
        [*lat(656, 2448), "diaphragm", "Left hemidiaphragm", "الحجاب الحاجز الأيسر", RP_LAT],
        [*lat(1718, 1840), "diaphragm", "Right hemidiaphragm", "الحجاب الحاجز الأيمن", RP_LAT],
        [*lat(1253, 1546), None, "Left atrium", "الأذين الأيسر", RP_LAT],
        [*lat(1359, 1679), None, "Left ventricle", "البطين الأيسر", RP_LAT],
        [*lat(1528, 1798), None, "Inferior vena cava", "الوريد الأجوف السفلي", RP_LAT],
        [*lat(1972, 1704), None, "Right ventricle", "البطين الأيمن", RP_LAT],
    ],
    # study 185614 (Frontal)، 2 تأشير؛ «Normal» حسب نتائج الحالة. السهم الرئيسي key_arrow_idx = 0
    "chest-pa2": [
        [*ajl(1443, 716), None, "Anterior junction line", "خط الاتصال الأمامي (بين الرئتين)", RP_AJL],
        [*ajl(1394, 1317), None, "Azygo-oesophageal recess", "الرَّدب الأزيغوسي المريئي", RP_AJL],
    ],
    # study 170246، series 708167 (Frontal-Occipitomental)؛ كل تأشير إله سهمين (الجهتين) فكل سهم نقطة.
    # علامة R بيسار الصورة، فالسهم الأيسر بالصورة = يمين المريض.
    "facial-om": [
        [205, 153, "frontal-bone", "Frontal sinus (right)", "الجيب الجبهي (يمين)", RP_OM],
        [392, 172, "frontal-bone", "Frontal sinus (left)", "الجيب الجبهي (يسار)", RP_OM],
        [176, 324, "maxilla-right", "Maxillary sinus (right)", "الجيب الفكي (يمين)", RP_OM],
        [405, 328, "maxilla-left", "Maxillary sinus (left)", "الجيب الفكي (يسار)", RP_OM],
    ],
    # المناطق الملوّنة بجهة يمين المريض (يسار الصورة؛ علامة L بيمين الصورة). الصورة بنفس أبعاد المصدر 678×962.
    "skull-pa": [
        [287, 432, "frontal-bone", "Frontal sinus", "الجيب الجبهي", NNH],
        [270, 540, "ethmoid-bone", "Ethmoidal air cells", "الخلايا الغربالية (الجيوب الغربالية)", NNH],
        [344, 540, "sphenoid-bone", "Sphenoidal sinus", "الجيب الوتدي", NNH],
        [222, 658, "maxilla-right", "Maxillary sinus", "الجيب الفكي", NNH],
        [304, 648, None, "Nasal cavity", "التجويف الأنفي", NNH],
        [77, 588, "temporal-bone-right", "Mastoid air cells", "الخلايا الخشائية", NNH],
    ],
    # نفس أبعاد المصدر 886×934؛ «Keine Pathologie» حسب وصف المصدر.
    "knee-ap": [
        [124, 153, "femur", "Adductor tubercle of femur", "الحديبة المقرِّبة لعظم الفخذ", ADD],
    ],
}


HD_LOG = json.load(open(os.path.join(ROOT, "img/xray/hd/log.json"), encoding="utf-8"))


def no_upscale(v):
    """ممنوع أي تكبير (قرار محمد 28/10): صور img/xray/hd/ اللي انكبرت (s > 1 بـ log.json) ترجع لحجمها الأصلي
    بـ img/xray/orig/: الملف الأصلي img/xray/<id>.jpg إذا موجود، وإلا تصغير عادي للنسخة المكبّرة بنفس النسبة.
    النقاط (إذا بقت) تتحوّل: الأصلي = نقطة hd / s + القص (cx, cy)."""
    L = HD_LOG.get(v["id"])
    if not v["img"].startswith("img/xray/hd/") or not L or L.get("s", 1) <= 1.0001:
        return
    from PIL import Image
    s, cx, cy = L["s"], L.get("cx", 0), L.get("cy", 0)
    src, dst = os.path.join(ROOT, f'img/xray/{v["id"]}.jpg'), os.path.join(ROOT, f'img/xray/orig/{v["id"]}.jpg')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(src):
        im, off = Image.open(src), (cx, cy)
    else:
        hd = Image.open(os.path.join(ROOT, v["img"]))
        im, off = hd.resize((round(hd.width / s), round(hd.height / s)), Image.LANCZOS), (0, 0)
    im.convert("RGB").save(dst, "JPEG", quality=90)
    v["pts"] = [[round(p[0] / s + off[0]), round(p[1] / s + off[1])] + p[2:] for p in v["pts"]]
    v["img"], (v["w"], v["h"]) = f'img/xray/orig/{v["id"]}.jpg', im.size


def clean(views):
    for v in views:
        v.update(REPLACE.get(v["id"], {}))
        v["pts"] = SOURCE_PTS.get(v["id"]) or [p for p in v["pts"] if len(p) > 5 and v["id"] not in REPLACE]
        no_upscale(v)
    return views


if __name__ == "__main__":
    old = json.load(open(os.path.join(ROOT, "data/xray.json"), encoding="utf-8"))
    old["views"] = clean(old["views"])
    old["_note"] = ("Cleaned copy of data/xray.json (made by tools/clean_labels.py), read by map.html (old map) and new-map.html. "
                    "Only labels whose position comes from the image's own source annotation are kept (p[5] = source); "
                    "images that were abnormal or replaced by an annotated normal source are swapped (see REPLACE). "
                    "data/xray.json is the historical file and is not changed.")
    json.dump(old, open(os.path.join(ROOT, "data/xray-clean.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    ex_path = os.path.join(ROOT, "data/xray-extra.json")
    ex = json.load(open(ex_path, encoding="utf-8"))
    ex["views"] = clean(ex["views"])
    json.dump(ex, open(ex_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    for v in old["views"] + ex["views"]:
        for p in v["pts"]:
            assert 0 <= p[0] <= v["w"] and 0 <= p[1] <= v["h"], (v["id"], p)
    n = lambda vs: sum(len(v["pts"]) for v in vs)
    print("xray-clean.json:", n(old["views"]), "points ·", "xray-extra.json:", n(ex["views"]), "points")
