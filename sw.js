// يخلّي الموقع يشتغل كتطبيق، ويفتح الاختبارات اللي انفتحت قبل حتى بدون إنترنت.
// يتعامل بس مع صفحات الدروس؛ خريطة التشريح (أول الموقع) وملفاتها الكبيرة تمشي عادي بدون كاش.
const VERSION = "20261026233011";
const CACHE = "dars-" + VERSION;
const CORE = ["دروس/", "assets/app.css", "assets/quiz.js", "manifest.webmanifest", "assets/icon-192.png"];
const BASE = new URL(self.registration.scope).pathname;

function mine(url) {
  if (!url.pathname.startsWith(BASE)) return false;
  const rel = decodeURIComponent(url.pathname.slice(BASE.length));
  return rel === "manifest.webmanifest" || rel.startsWith("assets/") ||
    rel.startsWith("دروس") || rel.startsWith("اختبار") || rel.startsWith("تعلم");
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
  // من الشبكة أول (حتى الأسئلة الجديدة توصل)، وإذا ماكو إنترنت من الكاش
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("دروس/")))
  );
});
