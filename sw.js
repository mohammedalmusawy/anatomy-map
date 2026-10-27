// يخلّي الموقع يشتغل كتطبيق، ويفتح الاختبارات اللي انفتحت قبل حتى بدون إنترنت.
// يتعامل بس مع صفحات الدروس (lessons, quiz, learn, atlas + روابطها العربية القديمة)؛ خريطة التشريح وملفاتها الكبيرة تمشي عادي بدون كاش.
const VERSION = "20261027182602";
const CACHE = "dars-" + VERSION;
const CORE = ["lessons/", "assets/app.css", "assets/quiz.js", "manifest.webmanifest", "assets/icon-192.png"];
const BASE = new URL(self.registration.scope).pathname;

function mine(url) {
  if (!url.pathname.startsWith(BASE)) return false;
  const rel = decodeURIComponent(url.pathname.slice(BASE.length));
  return rel === "manifest.webmanifest" || rel.startsWith("assets/") ||
    ["lessons", "quiz", "learn", "atlas", "دروس", "اختبار", "تعلم", "أطلس"].some((p) => rel.startsWith(p));
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("dars-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || !mine(url)) return;
  // من الشبكة أول، ويسأل السيرفر كل مرة (no-cache) حتى أي تعديل يوصل فوراً؛ وإذا ماكو إنترنت من الكاش (آخر نسخة نزلت)
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("lessons/")))
  );
});
