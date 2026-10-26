# توضيح صور الأشعة بدون ذكاء اصطناعي: قص الحواف الفارغة، تباين موضعي خفيف (CLAHE)،
# تكبير نظيف (Lanczos) للصور الصغيرة، وتصغير الكبيرة للويب.
# الاستعمال: python3 enhance.py jobs.json out_dir
# jobs.json = [{"id": "...", "src": "path"}]  ← يطلع out_dir/<id>.jpg و out_dir/log.json
# log.json يحفظ القص والمقياس حتى تتحول نقاط التأشير القديمة: x' = (x - cx) * s
import sys, json, os
import cv2, numpy as np

LONG_MIN, LONG_MAX = 1600, 2000

def content_box(g):
    """أصغر مستطيل يحتوي الصورة الفعلية (يشيل الأشرطة السوداء/البيضاء الموحدة على الأطراف)."""
    h, w = g.shape
    def flat(v):
        return v.std() < 4 and (v.mean() < 25 or v.mean() > 235)
    t, b, l, r = 0, h, 0, w
    while t < h // 4 and flat(g[t, :]): t += 1
    while b > h * 3 // 4 and flat(g[b - 1, :]): b -= 1
    while l < w // 4 and flat(g[:, l]): l += 1
    while r > w * 3 // 4 and flat(g[:, r - 1]): r -= 1
    return l, t, r, b

def enhance(path):
    g = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    l, t, r, b = content_box(g)
    g = g[t:b, l:r]
    long = max(g.shape)
    s = 1.0
    if long < LONG_MIN:
        s = min(LONG_MIN / long, 3.0)
    elif long > LONG_MAX:
        s = LONG_MAX / long
    if s != 1.0:
        interp = cv2.INTER_LANCZOS4 if s > 1 else cv2.INTER_AREA
        g = cv2.resize(g, None, fx=s, fy=s, interpolation=interp)
    # تباين موضعي خفيف ممزوج بالأصل حتى يبقى الشكل طبيعي (أخف للمكبّرة لأن تشويشها يبين)
    clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
    mix = 0.4 if s > 1.3 else 0.6
    g = cv2.addWeighted(clahe.apply(g), mix, g, 1 - mix, 0)
    # حدة خفيفة (unsharp) — ما ننعّم بفلتر تشويش لأنه يخلي العظم شكله مرسوم
    amt = 0.2 if s > 1.3 else 0.3
    blur = cv2.GaussianBlur(g, (0, 0), 1.2 * max(s, 1))
    g = cv2.addWeighted(g, 1 + amt, blur, -amt, 0)
    return g, dict(cx=l, cy=t, s=s, w=g.shape[1], h=g.shape[0])

if __name__ == "__main__":
    jobs, out = json.load(open(sys.argv[1])), sys.argv[2]
    os.makedirs(out, exist_ok=True)
    log = {}
    for j in jobs:
        img, info = enhance(j["src"])
        cv2.imwrite(os.path.join(out, j["id"] + ".jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 88, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
        log[j["id"]] = info
        print(j["id"], info)
    json.dump(log, open(os.path.join(out, "log.json"), "w"), indent=1)
