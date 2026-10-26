"""يحوّل مجسّمات BodyParts3D (OBJ) لملفات GLB، ملف لكل منطقة × (عظام | عضلات).

كل جزء عقدة (node) منفصلة باسم مفتاحه، حتى الصفحة تگدر تلوّنه وتأشّره لما ينضغط.
الاستعمال: python3 build_models.py <مجلد OBJ> <map.json>
"""
import json, struct, sys
from pathlib import Path
import numpy as np
from parts import BONES, MUSCLES, CONTEXT

OBJ_DIR, MAP = Path(sys.argv[1]), json.load(open(sys.argv[2]))
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


def part_mesh(names):
    vs, fs, off = [], [], 0
    for n in names:
        for fj in MAP[n]:
            v, f = load_obj(OBJ_DIR / f"{fj}.obj")
            vs.append(v); fs.append(f + off); off += len(v)
    v = np.concatenate(vs)
    # BodyParts3D: Z للأعلى، و-Y للأمام → three.js: Y للأعلى، و+Z نحو الكاميرا
    v = np.stack([v[:, 0], v[:, 2], -v[:, 1]], 1)
    return v, np.concatenate(fs)


def normals(v, f):
    n = np.zeros_like(v)
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    for k in range(3):
        np.add.at(n, f[:, k], fn)
    return (n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)).astype(np.float32)


def write_glb(path, parts):
    """parts: [(key, v, f)] — كل جزء mesh وnode بنفس الاسم."""
    allv = np.concatenate([p[1] for p in parts])
    lo, hi = allv.min(0), allv.max(0)
    center, scale = (lo + hi) / 2, 2.0 / (hi - lo).max()  # المشهد يصير بحجم 2 وحدة ومتوسّط
    blob, views, accs, meshes, nodes = bytearray(), [], [], [], []

    def add(arr, target, comp, typ, minmax=False):
        while len(blob) % 4:
            blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": arr.nbytes, "target": target})
        blob.extend(arr.tobytes())
        a = {"bufferView": len(views) - 1, "componentType": comp, "count": len(arr), "type": typ}
        if minmax:
            a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
        accs.append(a)
        return len(accs) - 1

    for key, v, f in parts:
        v = ((v - center) * scale).astype(np.float32)
        p = add(v, 34962, 5126, "VEC3", True)
        n = add(normals(v, f), 34962, 5126, "VEC3")
        i = add(f.astype(np.uint32).ravel(), 34963, 5125, "SCALAR")
        meshes.append({"name": key, "primitives": [{"attributes": {"POSITION": p, "NORMAL": n}, "indices": i}]})
        nodes.append({"name": key, "mesh": len(meshes) - 1})
    while len(blob) % 4:
        blob.append(0)
    gltf = {"asset": {"version": "2.0", "generator": "anatomy-map build_models.py",
                      "copyright": "BodyParts3D, (c) The Database Center for Life Science, CC BY-SA 2.1 Japan"},
            "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
            "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(blob)}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
        fh.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        fh.write(struct.pack("<II", len(blob), 0x004E4942) + bytes(blob))


OUT.mkdir(exist_ok=True)
index = {}
for kind, D in (("bones", BONES), ("muscles", MUSCLES)):
    for region, items in D.items():
        parts, meta = [], []
        for k, (names, en, ar, grp) in enumerate(items):
            key = f"p{k}"
            parts.append((key, *part_mesh(names)))
            meta.append({"key": key, "en": en, "ar": ar, "grp": grp})
        if kind == "muscles":
            for k, n in enumerate(CONTEXT[region]):
                parts.append((f"ctx{k}", *part_mesh([n])))
        out = OUT / f"{region}-{kind}.glb"
        write_glb(out, parts)
        index[f"{region}-{kind}"] = meta
        print(out.name, f"{out.stat().st_size / 1e6:.2f} MB", len(meta), "parts")
(OUT / "parts.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
