// 🛰️ sw.js v2 (انطبق 29/10/2026 من sw-v2.js بعد مراجعة مستقلة؛ القديم بـ sw.js.bak-20261029-perf).
// نفس اسم الملف sw.js (الصفحات تسجّل "sw.js"). site.write_sw() يبدّل 20261122163613 برقم البناء.
// الهدف: أول فتح سريع، وكل صفحة دراسة انفتحت مرة تشتغل بلا نت، وأي تعديل يوصل بسرعة.
//
// ⚠️ كل الكاشات تبدي بـ "anatomy-" (أو dars-/audio-v1 القديمة): mohammedalmusawy.github.io أصل مشترك ويّا مواقع ثانية
//    (نفس CacheStorage)، فما نمسح أبداً كاش ما يخصّنا.
//   anatomy-shell-<V>  الأساس الصغير: الخطوط (روابط ثابتة ?v=1) + offline.html + الرئيسية + سهولة التعلم. يتجدد مع كل نسخة.
//   anatomy-assets-v2  CSS/JS بالـ ?v= (من الكاش أول — الرابط يتغير إذا الملف تغيّر). ما ينمسح مع النسخ؛ يتقلّم لـ ASSETS_MAX.
//   anatomy-pages-v2   HTML بس: «الشبكة (navigationPreload) بمهلة 0.4 ث، وإلا المحفوظ» + تحديث بالخلفية. حد PAGES_MAX.
//   anatomy-data-v2    JSON: stale-while-revalidate، عدا quiz/bank.json (أجوبة) = الشبكة أول بمهلة.
//   anatomy-img-v1     صور: من الكاش أول، حد IMG_MAX.
//   anatomy-offline-v1 «احفظ المحاضرة بلا نت» (رسالة warm) — ما يتقلّم وحده.
//   anatomy-pdf-v1     (21/11) ملفات PDF اللي فتحها الطالب (المحاضرة، MCQ…): الشبكة أول بمهلة، وبلا نت المحفوظ. حد PDF_MAX.
//   audio-v1           الصوت (نفس اسم sw.js الحالي حتى ما يضيع المحفوظ عند الطلاب).
const VERSION = "20261122163613";
const P = "anatomy-";
const SHELL = P + "shell-" + VERSION, ASSETS = P + "assets-v2", PAGES = P + "pages-v2", DATA = P + "data-v2",
  IMG = P + "img-v1", OFFLINE = P + "offline-v1", FONTS = P + "fonts-v1", AUDIO = "audio-v1", PDFS = P + "pdf-v1", LIB = P + "lib-v1";
const KEEP = [SHELL, ASSETS, PAGES, DATA, IMG, OFFLINE, FONTS, AUDIO, PDFS, LIB];
const MINE_CACHE = (k) => k.startsWith(P) || k.startsWith("dars-");   // اللي نقدر نمسحه (audio-v1 ما ينمسح)
// M3 (29/10): الصفحة المحفوظة تنتظر الشبكة 1.2 ث بس (3G) — bank.json يبقى 2.5 ث (الأجوبة لازم أحدث)
// ⚡ 17/11: المهلة 0.4 ث: الشبكة السريعة تلحق (أحدث نسخة)، والبطيئة ← المحفوظ فوراً والتحديث يكمل بالخلفية (الزيارة الجاية أحدث)
const PDF_MAX = 40, PDF_TIMEOUT = 4000;   // 📄 (21/11) PDF: آخر 40 ملف (مراجع مستقل: حد أصغر يحمي مساحة الموبايل)
// مكتبة عارض الـ PDF (pdf.js من cdnjs، نسخة ثابتة والصفحة تفحص بصمتها SRI) ← تنحفظ حتى العارض يشتغل بلا نت
const LIB_URLS = ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];
const PAGES_MAX = 150, IMG_MAX = 1200, ASSETS_MAX = 120, NET_TIMEOUT = 2500, NAV_TIMEOUT = 400;
const BASE = new URL(self.registration.scope).pathname;
// الأساس: الرئيسية + ملفات الشكل والسكربت الأساسية (site.write_sw يحط قائمتها بـ ?v=<بصمة المحتوى>، فالملف اللي ما تغيّر
// ما ينزل من جديد) + الخطوط بكاش ثابت FONTS (ما ينمسح مع كل نسخة).
const CORE = ["assets/app.min.css?v=6487458c02", "assets/cloud-config.min.js?v=ca107254e4", "assets/net.min.js?v=b40858af4b", "assets/cloud.min.js?v=b9632e743b", "assets/tools.min.js?v=df325ecb91", "assets/voice.min.js?v=282e49686e", "assets/listen.min.js?v=c8584eefe9", "assets/pick.min.js?v=052375b7dc", "assets/nextexam.min.js?v=e71b31c7a6", "assets/quiz.min.js?v=d90b3fe92c", "assets/slides.min.js?v=ddc847cbc9", "assets/calm.min.css?v=ddcb40357a", "assets/calm.min.js?v=0715379cf3", "assets/lang.min.css?v=9746e9d285", "assets/lang.min.js?v=c3b1bb77b4", "assets/staffdoor.min.js?v=afb6219db8", "assets/install.min.js?v=5d8422662f", "lessons/", "learn/", "offline.html", "manifest.webmanifest", "assets/icon-192.png",
  "assets/fonts/cairo-600-800.woff2?v=1", "assets/fonts/plex-arabic-400.woff2?v=1", "assets/fonts/plex-arabic-500.woff2?v=1"];
const SECTIONS = ["lessons", "quiz", "learn", "atlas", "devices", "contrast", "terms", "search", "assistant", "exams", "study", "thanks",
  "offline.html", "دروس", "اختبار", "تعلم", "أطلس",
  "me", "login", "team", "about", "guide",
  "view", "review", "library", "game", "english", "rooms"];   // 📄 (21/11) عارض الـ PDF ومركز المراجعة والمكتبة واللعبة: تشتغل بلا نت بعد أول فتح   // 🌿 v3 حي (29/10): مساحتي والدخول والفريق وعن المنصة والدليل تنحفظ بلا نت هم
const DATA_FILES = ["quiz/bank.json", "assets/audio/terms/lex.json", "study/data.json", "assistant/index.json", "assets/thanks.json"];
const FRESH_DATA = ["quiz/bank.json"];                  // الأجوبة لازم أحدث نسخة إذا النت موجود

const rel = (url) => { try { return decodeURIComponent(url.pathname.slice(BASE.length)); } catch (e) { return url.pathname.slice(BASE.length); } };
function mine(url) {
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return false;
  const r = rel(url);
  return r === "" || r === "manifest.webmanifest" || r.startsWith("assets/") || SECTIONS.some((p) => r.startsWith(p));
}
const isAudio = (url) => url.pathname.includes("/assets/audio/") && url.pathname.endsWith(".mp3");
const isImg = (url) => /\.(jpe?g|png|webp|avif|svg|gif)$/i.test(url.pathname);
const isFont = (url) => /\.woff2$/i.test(url.pathname);
const isPdf = (url) => /\.pdf$/i.test(url.pathname);
const versioned = (url) => url.searchParams.has("v");
const okToCache = (res) => res && res.ok && res.status === 200 && res.type === "basic";
const isHtml = (res) => (res.headers.get("content-type") || "").includes("text/html");

// put آمن: الكوتا أو جسم ناقص ما يأثّر على الرد أبداً
const put = (name, req, res) => caches.open(name).then((c) => c.put(req, res)).catch(() => {});
const lastTrim = {};
function trim(name, max) {                                // مقيّد: مرة كل 30 ثانية لكل كاش
  const now = Date.now(); if (now - (lastTrim[name] || 0) < 30e3) return Promise.resolve(); lastTrim[name] = now;
  return caches.open(name).then(async (c) => { const keys = await c.keys(); for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]); }).catch(() => {});
}
function deferred() { let r; const p = new Promise((x) => (r = x)); return [p, r]; }

// ───────── التثبيت / التفعيل ─────────
self.addEventListener("install", (e) => {
  e.waitUntil(Promise.all([caches.open(SHELL), caches.open(FONTS)]).then(([c, f]) => Promise.allSettled(CORE.map(async (u) => {
    const req = new Request(u, { cache: "reload" });
    if (/\.woff2/.test(u)) { if (!(await f.match(req))) await f.add(req); return; }
    if (/[?&]v=/.test(u) && (await caches.match(req))) return c.put(req, await caches.match(req));   // نفس البصمة محفوظة ← بلا تنزيل
    await c.add(req);
  }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // ترحيل: كل محتوى sw.js القديم (dars-*) ينتقل قبل المسح — الصفحات والـ CSS/JS والصور — حتى الصفحات
    // المحفوظة قبل التحديث تبقى تشتغل بلا نت بشكلها الكامل (الصفحة القديمة تطلب ملفاتها القديمة بنفس الروابط)
    for (const k of keys.filter((k) => k.startsWith("dars-"))) {
      try {
        const old = await caches.open(k);
        for (const req of await old.keys()) {
          const res = await old.match(req); if (!res) continue;
          const u = new URL(req.url);
          const to = isAudio(u) ? AUDIO : isImg(u) ? IMG : isFont(u) ? FONTS : isHtml(res) ? PAGES : ASSETS;
          const c = await caches.open(to);
          if (!(await c.match(req))) await c.put(req, res);
        }
      } catch (x) {}
    }
    await Promise.all(keys.filter((k) => MINE_CACHE(k) && !KEEP.includes(k)).map((k) => caches.delete(k)));
    // M3: طلب الصفحة يبدي بالشبكة بنفس وقت تشغيل الـ SW (ما ينتظر إقلاعه)
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

// ───────── الاستراتيجيات ─────────
// الصفحات: سباق الشبكة مع مهلة. الشبكة تكسب ← أحدث نسخة (حتى 404 حقيقي يوصل). بطيئة/بلا نت ← المحفوظ، والتحديث يكمل بالخلفية.
function page(e) {
  const req = e.request;
  const [done, finish] = deferred(); e.waitUntil(done);   // waitUntil متزامن
  // navigationPreload (إذا موجود) = نفس الطلب بدري؛ وإلا fetch عادي. الرد ينحفظ ويّا التحديث بالخلفية مثل قبل.
  const net = Promise.resolve(e.preloadResponse).catch(() => null)
    .then((pre) => pre || fetch(req, { cache: "no-cache" })).then((res) => {
    if (okToCache(res) && isHtml(res)) put(PAGES, req, res.clone()).then(() => trim(PAGES, PAGES_MAX)).finally(finish); else finish();
    return res;
  }, (err) => { finish(); throw err; });
  return (async () => {
    const cached = (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true }));
    if (!cached) {
      try { return await net; } catch (x) { return (await caches.match("offline.html", { ignoreSearch: true })) || new Response("offline", { status: 503 }); }
    }
    const winner = await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(() => r(null), NAV_TIMEOUT))]);
    if (winner && (winner.ok || winner.status === 404 || winner.status === 410)) return winner;
    return cached;
  })();
}

// JSON: من الكاش فوراً + تحديث بالخلفية. bank.json: الشبكة أول بمهلة (الأجوبة).
function data(e) {
  const req = e.request, url = new URL(req.url);
  const [done, finish] = deferred(); e.waitUntil(done);
  const net = fetch(req, { cache: "no-cache" }).then(async (res) => {
    if (okToCache(res)) {
      const c = await caches.open(DATA).catch(() => null);
      if (c) { for (const k of await c.keys(req, { ignoreSearch: true })) await c.delete(k); await c.put(req, res.clone()).catch(() => {}); }
    }
    finish(); return res;
  }, (err) => { finish(); throw err; });
  return (async () => {
    const cached = await caches.match(req, { ignoreSearch: true, cacheName: DATA });
    if (!cached) return net.catch(() => new Response("{}", { status: 503, headers: { "content-type": "application/json" } }));
    if (FRESH_DATA.includes(rel(url))) {
      const w = await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(() => r(null), NET_TIMEOUT))]);
      return w && w.ok ? w : cached;
    }
    return cached;
  })();
}

// من الكاش أول (صور، خطوط، ملفات بـ ?v=)
// revalidate: الصور بنفس الرابط ممكن تتصلّح (تصحيح سلايد أو حالة) ← المحفوظ فوراً، وإذا عمره > يوم نتأكد بالخلفية
const DAY = 864e5;
async function cacheFirst(e, name, max, revalidate) {
  const req = e.request;
  const hit = await caches.match(req);
  if (hit) {
    const at = Date.parse(hit.headers.get("date") || "") || 0;
    if (revalidate && navigator.onLine !== false && Date.now() - at > DAY)
      e.waitUntil(fetch(req, { cache: "no-cache" }).then((res) => okToCache(res) ? put(name, req, res) : null).catch(() => {}));
    return hit;
  }
  try {
    const res = await fetch(req);
    if (okToCache(res)) e.waitUntil(put(name, req, res.clone()).then(() => max && trim(name, max)));
    return res;
  } catch (x) {
    const any = await caches.match(req, { ignoreSearch: true });
    if (any) return any;
    // <picture>: بلا نت والشاشة تطلب عرض WebP ثاني (تدوير الموبايل) ← أي عرض محفوظ لنفس الصورة
    const m = /^(.*)-\d+\.webp$/.exec(req.url.split("?")[0]);
    if (m) { const c = await caches.open(IMG); const k = (await c.keys()).find((r) => r.url.split("?")[0].replace(/-\d+\.webp$/, "") === m[1]); if (k) return c.match(k); }
    return Response.error();
  }
}

// 📄 PDF (21/11، «الطالب يطلع بلا نت»): أي ملف فتحه الطالب مرة ينحفظ بجهازه ويشتغل بلا نت.
// النت موجود ← أحدث نسخة (لو الأستاذ صحّح الملف) بمهلة 4 ث؛ بطيء أو بلا نت ← المحفوظ فوراً. مفتاح الكاش بلا ?query.
async function pdf(e) {
  const req = e.request, url = new URL(req.url); url.search = "";
  const key = new Request(url.href);
  // ملف محفوظ قبل هالتحديث (بكاش anatomy-assets) يبقى يشتغل بلا نت
  const cached = (await caches.match(key, { cacheName: PDFS })) || (await caches.match(key, { ignoreSearch: true }));
  // تنقّل (زر التحميل): نستعمل طلب navigationPreload نفسه حتى الملف ما ينزل مرتين
  const first = req.mode === "navigate" ? Promise.resolve(e.preloadResponse).catch(() => null) : Promise.resolve(null);
  const net = first.then((pre) => pre || fetch(key, { cache: "no-cache" })).then((res) => {
    if (okToCache(res)) e.waitUntil(put(PDFS, key, res.clone()).then(() => trim(PDFS, PDF_MAX)));
    return res;
  });
  if (!cached) return net.catch(async () => (req.mode === "navigate" && (await caches.match("offline.html", { ignoreSearch: true }))) || Response.error());
  e.waitUntil(net.catch(() => {}));
  const w = navigator.onLine === false ? null : await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(() => r(null), PDF_TIMEOUT))]);
  return w && w.ok ? w : cached;
}

// الصوت: من الكاش أول + Range (آيفون).
// M2 (29/10): ولا ملف ينزل مرتين. تنزيل كامل (listen.js يجيب الملف كله) ← نفس الرد ينحفظ؛ وطلبات Range بنفس الوقت
// تنتظر هذا التنزيل وتجاوب منه. Range بلا تنزيل كامل شغّال ← الشبكة بس (بلا تنزيل خلفي ثاني)، والكاش يتعبّى
// لما listen.js أو «احفظ بلا نت» يطلب الملف كامل.
const filling = new Map();
async function audio(e) {
  const req = e.request, key = new Request(req.url);
  let res = await caches.match(key, { cacheName: AUDIO });
  if (!res && req.headers.get("range") && filling.has(req.url)) {
    await filling.get(req.url).catch(() => {});
    res = await caches.match(key, { cacheName: AUDIO });
  }
  // 🔁 (18/11) ملف المصطلح بيه ?v=<نسخة> (listen.js): نسخة جديدة ← تنزيل وتبديل المحفوظ القديم بنفس المسار (الكاش ما يكبر)،
  //    وبلا نت أو فشل ← المحفوظ القديم (أي ?v= أو بلاها: اللي حفظه الطالب قبل هالتحديث) يبقى يشتغل، حتى ما يضيع صوت حفظه الطالب قبل.
  if (!res && !req.headers.get("range") && new URL(req.url).searchParams.has("v")) {
    try {
      const full = await fetch(key);
      if (full.ok) {
        if (okToCache(full)) {
          const copy = full.clone();
          e.waitUntil(caches.open(AUDIO).then(async (c) => {
            for (const k of await c.keys(key, { ignoreSearch: true })) if (k.url !== key.url && new URL(k.url).searchParams.has("v")) await c.delete(k);
            await c.put(key, copy);
          }).catch(() => {}));
        }
        return full;
      }
      return (await caches.match(key, { cacheName: AUDIO, ignoreSearch: true })) || full;
    } catch (x) {
      const old = await caches.match(key, { cacheName: AUDIO, ignoreSearch: true });
      if (old) return old;
      throw x;
    }
  }
  if (!res) {
    if (req.headers.get("range")) return fetch(req);
    const full = await fetch(key);
    if (okToCache(full)) {
      const p = put(AUDIO, key, full.clone()).finally(() => filling.delete(req.url));
      filling.set(req.url, p);
      e.waitUntil(p);
    }
    return full;
  }
  const range = req.headers.get("range");
  if (!range) return res;
  const buf = await res.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const size = buf.byteLength, start = m[1] ? +m[1] : Math.max(0, size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  if (!(start <= end && start < size)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    "Content-Type": "audio/mpeg", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (LIB_URLS.includes(url.href)) return e.respondWith(caches.match(req, { cacheName: LIB }).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.ok && (res.type === "cors" || res.type === "basic")) e.waitUntil(put(LIB, req, res.clone()));
    return res;
  })));
  if (mine(url) && isPdf(url) && !req.headers.get("range")) return e.respondWith(pdf(e));   // 📄 (21/11) الملف نفسه (العارض أو زر التحميل)
  // تنقّل ما نخزّنه (الخريطة، zip/mp4 الكبيرة): نستعمل نفس طلب navigationPreload حتى ما ينزل الملف مرتين
  if (req.mode === "navigate" && (!mine(url) || /\.(pdf|zip|mp4)$/i.test(url.pathname))) {
    if (url.origin === location.origin) e.respondWith(Promise.resolve(e.preloadResponse).catch(() => null).then((r) => r || fetch(req)));
    return;
  }
  if (!mine(url)) return;                                            // Supabase / CDN ← الشبكة عادي
  if (isAudio(url)) return e.respondWith(audio(e));
  if (req.mode === "navigate") return e.respondWith(page(e));
  if (DATA_FILES.includes(rel(url))) return e.respondWith(data(e));
  if (isImg(url)) return e.respondWith(cacheFirst(e, IMG, IMG_MAX, true));
  if (isFont(url)) return e.respondWith(cacheFirst(e, FONTS));
  if (versioned(url)) return e.respondWith(cacheFirst(e, ASSETS, ASSETS_MAX));
  // باقي assets بدون ?v= (quiz.js, slides.js…): الشبكة أول، والمحفوظ بلا نت
  e.respondWith(fetch(req, { cache: "no-cache" }).then((res) => { if (okToCache(res)) e.waitUntil(put(ASSETS, req, res.clone())); return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || Response.error())));
});

// 📥 «احفظ المحاضرة بلا نت»: الصفحة ترسل {type:"warm", urls:[…]} ← كاش offline منفصل ما يتقلّم.
//    {type:"unwarm", urls:[…]} يشيلها. الصوت يروح لـ audio-v1.
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "skip-waiting") self.skipWaiting();
  if ((d.type === "warm" || d.type === "unwarm") && Array.isArray(d.urls)) {
    e.waitUntil(Promise.allSettled(d.urls.slice(0, 300).map(async (u) => {
      const url = new URL(u, self.registration.scope);
      if (!mine(url)) return;
      const name = isAudio(url) ? AUDIO : OFFLINE, key = new Request(url.href);
      if (d.type === "unwarm") return caches.open(name).then((c) => c.delete(key));
      // (21/11) كل ضغطة تجيب أحدث نسخة (لو الملف انصلّح)؛ النت فشل والقديم محفوظ ← نخليه وينحسب ناجح
      let res = null;
      try { res = await fetch(key, { cache: "no-cache" }); } catch (x) {}
      if (!okToCache(res)) { if (await caches.match(key, { cacheName: name })) return; throw new Error("bad " + (res && res.status)); }
      await caches.open(name).then((c) => c.put(key, res));   // فشل الحفظ (المساحة) ← ينحسب فشل
    })).then((r) => {
      // 📥 (21/11) زر «احفظها بجهازك» ينتظر النتيجة: كم انحفظ وكم فشل
      if (d.id && e.source) e.source.postMessage({ type: d.type + "-done", id: d.id, ok: r.filter((x) => x.status === "fulfilled").length, fail: r.filter((x) => x.status === "rejected").length });
    }));
  }
});

// 🔔 (22/11) تنبيهات الموبايل: الرسالة مشفّرة من push-send بشكل {t, b, u}. الضغط ← يفتح الصفحة (أو يرجع لتبويب مفتوح).
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {}; }
  const title = String(d.t || "منصة تعلم الأشعة").slice(0, 80);
  const url = /^(?!\/)[a-z0-9\/_#?=.-]{0,120}$/.test(d.u || "") ? d.u : "lessons/";   // نسبي بس (ولا «//موقع-ثاني»)
  e.waitUntil(self.registration.showNotification(title, {
    body: String(d.b || "").slice(0, 200), dir: "rtl", lang: "ar", tag: "am-" + url,
    icon: "assets/icon-192.png", badge: "assets/icon-192.png", data: { url: new URL(url, self.registration.scope).href },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url === url && "focus" in w) return w.focus();
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
