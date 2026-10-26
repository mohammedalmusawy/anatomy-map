"""يحوّل مجسّمات BodyParts3D (OBJ) لملفات GLB، ملف لكل منطقة × (عظام | عضلات).

كل جزء عقدة (node) منفصلة باسم مفتاحه، حتى الصفحة تگدر تلوّنه وتأشّره لما ينضغط.
الاستعمال: python3 build_models.py <مجلد OBJ> <map.json> [مجلد STL 2009] [ids2009.json]
"""
import json, struct, sys
from pathlib import Path
import numpy as np
from parts import BONES, MUSCLES, CONTEXT

OBJ_DIR, MAP = Path(sys.argv[1]), json.load(open(sys.argv[2]))
# اختياري: مجلد STL نسخة 2009 (دقة 10%) وخريطة أسمائها، للعظام
STL_DIR = Path(sys.argv[3]) if len(sys.argv) > 3 else None
IDS2009 = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "models"


def load_obj(path):
    v, f = [], []
    for line in open(path, encoding="utf-8", errors="ignore"):
        if line.startswith("v "):
            v.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("f "):
            ids = [int(t.split("/")[0]) for t in line.split()[1:]]
            f += [[ids[0], ids[i], ids[i + 1]] for i in range(1, len(ids) - 1)]
    return np.array(v, np.float32), np.array(f, np.int64) - 1


def load_stl(path):
    v = np.array([l.split()[1:4] for l in open(path) if l.lstrip().startswith("vertex")], np.float32)
    return v, np.arange(len(v)).reshape(-1, 3)


def weld(v, f):
    """يدمج النقاط المكررة حتى يصير السطح متصل وينعّم صح."""
    u, inv = np.unique(v.round(4), axis=0, return_inverse=True)
    f = inv.ravel()[f]
    f = f[(f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2])]
    return u.astype(np.float32), f


def subdivide(v, f):
    """كل مثلث ينقسم لأربعة (نقاط منتصف الأضلاع)."""
    e = np.sort(np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]]), 1)
    ue, inv = np.unique(e, axis=0, return_inverse=True)
    mid = len(v) + inv.ravel().reshape(3, -1).T
    v = np.concatenate([v, (v[ue[:, 0]] + v[ue[:, 1]]) / 2])
    a, b, c = f.T; ab, bc, ca = mid.T
    return v, np.concatenate([np.stack(x, 1) for x in ((a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca))])


def taubin(v, f, it=12, lam=0.5, mu=-0.53):
    """تنعيم Taubin: يشيل التضرّس بدون ما يصغّر الشكل."""
    e = np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    deg = np.bincount(e[:, 0], minlength=len(v)).astype(np.float32)[:, None]
    for k in range(it * 2):
        s = np.zeros_like(v); np.add.at(s, e[:, 0], v[e[:, 1]])
        v = v + (lam if k % 2 == 0 else mu) * (s / np.maximum(deg, 1) - v)
    return v


def part_mesh(names, hi_res=False, refine=False):
    vs, fs, off = [], [], 0
    for n in names:
        # العظام بمشهد العظام من نسخة 2009 الأدق، والباقي من نسخة 4.0
        files = [(load_stl, STL_DIR / f"{IDS2009[n]}.stl")] if hi_res and n in IDS2009 else \
                [(load_obj, OBJ_DIR / f"{fj}.obj") for fj in MAP[n]]
        for loader, p in files:
            v, f = weld(*loader(p))
            vs.append(v); fs.append(f + off); off += len(v)
    v, f = np.concatenate(vs), np.concatenate(fs)
    if refine and len(f) < 12000:
        v, f = subdivide(v, f)
    v = taubin(v, f)
    # BodyParts3D: Z للأعلى، و-Y للأمام → three.js: Y للأعلى، و+Z نحو الكاميرا
    v = np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1)
    return v, f


def normals(v, f):
    n = np.zeros_like(v)
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    for k in range(3):
        np.add.at(n, f[:, k], fn)
    return (n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)).astype(np.float32)


def write_glb(path, parts, quantize=False):
    """parts: [(key, v, f)] — كل جزء mesh وnode بنفس الاسم.
    quantize: يخزّن النقاط int16 والاتجاهات int8 (KHR_mesh_quantization) حتى ينزل الحجم للنص تقريباً."""
    allv = np.concatenate([p[1] for p in parts])
    lo, hi = allv.min(0), allv.max(0)
    center, scale = (lo + hi) / 2, 2.0 / (hi - lo).max()  # المشهد يصير بحجم 2 وحدة ومتوسّط
    blob, views, accs, meshes, nodes = bytearray(), [], [], [], []

    def add(arr, target, comp, typ, minmax=None, stride=None, normalized=False):
        while len(blob) % 4:
            blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": arr.nbytes, "target": target})
        if stride:
            views[-1]["byteStride"] = stride
        blob.extend(arr.tobytes())
        a = {"bufferView": len(views) - 1, "componentType": comp, "count": len(arr), "type": typ}
        if normalized:
            a["normalized"] = True
        if minmax is not None:
            a["min"], a["max"] = minmax.min(0).tolist(), minmax.max(0).tolist()
        accs.append(a)
        return len(accs) - 1

    def pad4(a):  # VEC3 → 4 خانات حتى تصير خطوة القراءة من مضاعفات 4 بايت
        return np.concatenate([a, np.zeros((len(a), 1), a.dtype)], 1)

    for key, v, f in parts:
        v = ((v - center) * scale).astype(np.float32)
        nm = normals(v, f)
        if quantize:
            q = np.round(np.clip(v, -1, 1) * 32767).astype(np.int16)
            p = add(pad4(q), 34962, 5122, "VEC3", q[:, :3].astype(np.float32) / 32767, 8, True)
            # المواصفة: min/max للأعداد الصحيحة المطبّعة تنكتب بقيمها الخام، والمحمّل يقسمها بنفسه
            accs[-1]["min"] = q[:, :3].min(0).tolist(); accs[-1]["max"] = q[:, :3].max(0).tolist()
            n = add(pad4(np.round(nm * 127).astype(np.int8)), 34962, 5120, "VEC3", None, 4, True)
        else:
            p = add(v, 34962, 5126, "VEC3", v)
            n = add(nm, 34962, 5126, "VEC3")
        idx = f.astype(np.uint16 if len(v) < 65536 else np.uint32).ravel()
        i = add(idx, 34963, 5123 if idx.dtype == np.uint16 else 5125, "SCALAR")
        meshes.append({"name": key, "primitives": [{"attributes": {"POSITION": p, "NORMAL": n}, "indices": i}]})
        nodes.append({"name": key, "mesh": len(meshes) - 1})
    while len(blob) % 4:
        blob.append(0)
    gltf = {"asset": {"version": "2.0", "generator": "anatomy-map build_models.py",
                      "copyright": "BodyParts3D, (c) The Database Center for Life Science, CC BY-SA 2.1 Japan"},
            "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
            "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(blob)}]}
    if quantize:
        gltf["extensionsUsed"] = gltf["extensionsRequired"] = ["KHR_mesh_quantization"]
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
        fh.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        fh.write(struct.pack("<II", len(blob), 0x004E4942) + bytes(blob))
    return center, scale


def anchor(v, muscle=False):
    """نقطة على سطح الجزء لدبّوس التأشير: بأعرض مقطع (بطن العضلة مو وترها)، وبالجهة الأقرب للكاميرا.
    للعضلات ندوّر بس بالـ 60% الدانية، لأن الأوتار الطويلة تنزل للأصابع."""
    y = v[:, 1]; lo = y.max() - 0.6 * np.ptp(y) if muscle else y.min()
    edges = np.linspace(lo, y.max(), 13)
    best, area = v, -1
    for a, b in zip(edges[:-1], edges[1:]):
        s = v[(y >= a) & (y <= b)]
        if len(s) > 8:
            w = min(np.ptp(s[:, 0]), np.ptp(s[:, 2]))  # السُّمك، حتى مروحة الأوتار العريضة الرفيعة ما تغلب البطن
            if w > area:
                best, area = s, w
    return best[np.argmax(best[:, 2])]


OUT.mkdir(exist_ok=True)

# ───────────── الاستوديو: الطرف العلوي كله بملف واحد (عظام + عضلات بطبقات) ─────────────
import re
from parts import LAYER

def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")

parts, meta = [], []
for kind, D in (("bone", BONES), ("muscle", MUSCLES)):
    for region, items in D.items():
        for names, en, ar, grp in items:
            key = slug(en)
            v, f = part_mesh(names)  # نسخة 4.0 للكل حتى تتطابق الإحداثيات
            if len(f) < 2500:  # الأجزاء الصغيرة بس تنقسم، حتى يبقى الملف خفيف
                v, f = subdivide(v, f); v = taubin(v, f, it=4)
            parts.append((key, v, f))
            meta.append({"key": key, "en": en, "ar": ar, "kind": kind, "region": region, "grp": grp,
                         "layer": "bone" if kind == "bone" else LAYER[en]})
center, scale = write_glb(OUT / "upper-limb.glb", parts, quantize=True)
for m, (_, v, _f) in zip(meta, parts):
    m["pin"] = [round(float(x), 4) for x in (anchor(v, m["kind"] == "muscle") - center) * scale]
(OUT / "upper-limb.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
print("upper-limb.glb", f"{(OUT / 'upper-limb.glb').stat().st_size / 1e6:.2f} MB", len(meta), "parts")
