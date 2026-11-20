// 📲 «ثبّت المنصة» (قرار محمد 20/11/2026): أول ما الطالب يفتح المنصة ينعرض عليه شلون ينزّلها تطبيق على الشاشة الرئيسية أو سطح المكتب.
// شريط هادئ تحت (مو نافذة تسد الصفحة)، يطلع مرة وحدة، و«مو هسه» يخفيه 14 يوم (وبعد مرتين ما يرجع)، وما يطلع إذا المنصة مثبّتة أصلاً.
// أندرويد + كروم/إيدج الكمبيوتر: زر «ثبّت» مباشر (beforeinstallprompt). آيفون/آيباد: خطوات «مشاركة ← إضافة إلى الشاشة الرئيسية».
// سفاري الماك: «ملف ← إضافة إلى Dock». فايرفوكس الكمبيوتر ما يدعم التثبيت ← ما يطلع.
// ما يطلع بتليغرام ولا لوحة الإدارة ولا العارض ولا المعاينة، ولا بالاختبارات الآلية (am_test) إلا ويّا ?install=1.
// window.AMInstall.open() يفتحه بأي وقت (لزر «ثبّت المنصة» بالمستقبل).
(function () {
  "use strict";
  var KEY = "t:install", path = location.pathname, ua = navigator.userAgent || "";
  var forced = /[?&]install=1\b/.test(location.search);
  var ls; try { ls = window.localStorage; } catch (e) { ls = null; }
  var get = function () { try { return JSON.parse((ls && ls.getItem(KEY)) || "{}") || {}; } catch (e) { return {}; } };
  var put = function (o) { try { ls && ls.setItem(KEY, JSON.stringify(o)); } catch (e) { /* */ } };
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var test = false; try { test = !!ls && (ls.getItem("am_test") === "1" || /^00000000-/.test(ls.getItem("t:device") || "")); } catch (e) { /* */ }
  var skipPage = /\/(tg|admin|view|preview|audio-check|promo)\//.test(path) || /Telegram/i.test(ua) || !!window.TelegramWebviewProxy;
  var en = function () { return (document.documentElement.lang || "").slice(0, 2) === "en"; };

  var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var mobile = ios || android || /Mobi/i.test(ua);
  var macSafari = !mobile && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|Firefox/.test(ua);
  var firefoxDesk = !mobile && /Firefox\//.test(ua);
  var bip = null, shown = false;

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); bip = e; if (shown) render(); });
  window.addEventListener("appinstalled", function () { var s = get(); s.done = Date.now(); put(s); close(); });

  function T(ar, enT) { return en() ? enT : ar; }
  function steps() {
    if (bip) return "";
    if (ios) return T("اضغط زر المشاركة <b aria-hidden=\"true\">⬆️</b> ← «إضافة إلى الشاشة الرئيسية» ← «إضافة».",
                      "Tap Share <b aria-hidden=\"true\">⬆️</b> → “Add to Home Screen” → “Add”.");
    if (macSafari) return T("من القائمة فوق: «ملف» ← «إضافة إلى Dock».", "From the menu bar: File → Add to Dock.");
    if (android) return T("من قائمة المتصفح <b aria-hidden=\"true\">⋮</b> ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
                          "Open the browser menu <b aria-hidden=\"true\">⋮</b> → “Install app” or “Add to Home screen”.");
    return T("اضغط زر التثبيت <b aria-hidden=\"true\">⊕</b> بآخر شريط العنوان، أو من قائمة المتصفح ← «تثبيت».",
             "Click the install icon <b aria-hidden=\"true\">⊕</b> at the end of the address bar, or browser menu → “Install”.");
  }
  var css = ".amins{position:fixed;inset-inline:12px;bottom:calc(12px + var(--amins-b,0px) + env(safe-area-inset-bottom,0px));z-index:9000;max-width:560px;margin:0 auto;" +
    "background:var(--card,#fff);color:var(--ink,#1E2433);border:1px solid var(--line,#E3E6EF);border-radius:18px;box-shadow:0 10px 30px rgba(20,24,40,.18);" +
    "padding:14px 14px 12px;padding-inline-end:54px;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;font:inherit;animation:aminsIn .25s ease-out}" +
    ".amins img{width:44px;height:44px;border-radius:12px;grid-row:span 2}.amins h2{margin:0;font:700 var(--t-md,1.05rem)/1.4 var(--title-font,inherit)}" +
    ".amins p{margin:0;color:var(--muted,#5B6478);font-size:var(--t-sm,.92rem);line-height:1.6}.amins p b{font-weight:600;color:var(--brand,#3B4A8C)}" +
    ".amins .row{grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end;margin-top:8px}" +
    ".amins button{min-height:44px;min-width:44px;padding:0 16px;border-radius:12px;font:600 var(--t-sm,.95rem) var(--title-font,inherit);cursor:pointer}" +
    ".amins .go{background:var(--brand,#3B4A8C);color:var(--brand-ink,#fff);border:0}.amins .later{background:transparent;color:var(--muted,#5B6478);border:1px solid var(--line,#E3E6EF)}" +
    ".amins .x{position:absolute;top:4px;inset-inline-end:4px;background:transparent;border:0;color:var(--muted,#5B6478);font-size:22px;padding:0}" +
    ".amins button:focus-visible{outline:3px solid var(--brand,#3B4A8C);outline-offset:2px}" +
    "@media (max-width:360px),(max-height:700px){.amins{padding:10px 10px 8px;padding-inline-end:50px;gap:2px 10px}.amins img{width:32px;height:32px;border-radius:9px}.amins h2{font-size:var(--t-sm,.95rem)}.amins p{font-size:var(--t-xs,.85rem);line-height:1.5}.amins .row{margin-top:4px}}" +
    "@keyframes aminsIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}@media (prefers-reduced-motion:reduce){.amins{animation:none}}";
  var box = null, prevFocus = null;
  function root() { var s = document.querySelector('script[src*="assets/install"]'); return s ? s.src.replace(/assets\/install(\.min)?\.js.*$/, "") : "../"; }
  function render() {
    if (!box) {
      if (!document.getElementById("amins-css")) { var st = document.createElement("style"); st.id = "amins-css"; st.textContent = css; document.head.appendChild(st); }
      box = document.createElement("section"); box.className = "amins noterm"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "false");
      box.setAttribute("aria-labelledby", "amins-h"); box.setAttribute("dir", en() ? "ltr" : "rtl"); box.setAttribute("lang", en() ? "en" : "ar");
      document.body.appendChild(box);
      box.addEventListener("focusin", function (e) { if (!prevFocus && e.relatedTarget && !box.contains(e.relatedTarget)) prevFocus = e.relatedTarget; });
      box.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); later(); } });
    }
    place();
    var hadFocus = box.contains(document.activeElement) ? (document.activeElement.className || "") : "";
    body();
    var k = hadFocus.split(" ")[0], x = hadFocus ? ((/^[a-z]+$/.test(k) && box.querySelector("." + k)) || box.querySelector(".later")) : null;
    if (x) x.focus();
  }
  // فوق شريط التنقل اللاصق تحت (الموبايل) — ما نغطي «الرئيسية/المحاضرات/صفحتي»: أعلى عنصر ثابت عريض بالنص السفلي
  function place() {
    if (!box) return;
    try {
      var off = 0, h = innerHeight;
      Array.prototype.forEach.call(document.querySelectorAll("nav, header, footer, [class*=nav], [class*=bar]"), function (el) {
        if (el === box || box.contains(el)) return;
        var cs = getComputedStyle(el); if (cs.position !== "fixed" && cs.position !== "sticky") return;
        var r = el.getBoundingClientRect(); if (r.height > 0 && r.top > h / 2 && r.width > innerWidth / 2) off = Math.max(off, Math.round(h - r.top));
      });
      box.style.setProperty("--amins-b", off + "px");
    } catch (e) { /* */ }
  }
  function body() {
    var s = steps();
    box.innerHTML = '<img src="' + root() + 'assets/icon-192.png" alt="">' +
      '<h2 id="amins-h">' + T("ثبّت منصة تعلم الأشعة على جهازك", "Install the Radiology Learning Platform") + '</h2>' +
      '<p>' + (s || T("تنفتح مثل التطبيق بضغطة من الشاشة الرئيسية، وأسرع.", "Opens like an app from your home screen, faster.")) + '</p>' +
      '<div class="row">' + (bip ? '<button type="button" class="go">' + T("ثبّت", "Install") + '</button>' : "") +
      '<button type="button" class="later">' + T(s ? "تمام" : "مو هسه", s ? "Got it" : "Not now") + '</button></div>' +
      '<button type="button" class="x" aria-label="' + T("إغلاق", "Close") + '">×</button>';
    var go = box.querySelector(".go");
    if (go) go.onclick = function () {
      var p = bip; bip = null; if (!p) return;
      p.prompt(); (p.userChoice || Promise.resolve({})).then(function (c) { var st = get(); if (c && c.outcome === "accepted") st.done = Date.now(); else dismiss(st); put(st); close(); });
    };
    box.querySelector(".later").onclick = later;
    box.querySelector(".x").onclick = later;
  }
  function later() { var st = get(); dismiss(st); put(st); close(); }
  function dismiss(st) { st.later = Date.now(); st.n = (st.n || 0) + 1; }
  function close() {
    var inside = box && box.contains(document.activeElement);
    if (box) { box.remove(); box = null; } shown = false;
    // التركيز يرجع لمكانه بلا ما الصفحة تتمرّر (الفاحص المستقل): ماكو مكان قبله (ضغطة إصبع/ماوس) ← بس نشيله من الزر
    if (inside) { if (prevFocus && document.contains(prevFocus)) { try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* */ } } else if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
    prevFocus = null;
  }
  window.addEventListener("resize", function () { place(); });
  function open() { if (standalone) return false; shown = true; render(); return true; }
  window.AMInstall = { open: open, supported: function () { return !standalone && !firefoxDesk; } };

  var st = get(), DAY = 864e5;
  var due = !st.done && (!st.later || (st.n || 0) < 2 && Date.now() - st.later > 14 * DAY);
  if (standalone || skipPage || firefoxDesk || (test && !forced) || !(due || forced)) return;
  // يطلع بعد ما الصفحة ترتاح (ثانيتين) — وكروم ينطي beforeinstallprompt أحياناً متأخر، فالزر ينضاف وحده لما يجي
  var ss; try { ss = window.sessionStorage; } catch (e) { ss = null; }
  var seen = function () { try { return ss && ss.getItem("t:install-s") === "1"; } catch (e) { return false; } };
  if (seen() && !forced) return;   // مرة وحدة بالجلسة: إذا تجاهله الطالب ما يلاحقه بكل صفحة
  var obCard = function () { var c = document.getElementById("obw"); return !!c && !c.hidden && c.getBoundingClientRect().height > 0; };   // بطاقة «أول مرة هنا؟»
  var start = function () { setTimeout(function () {
    if (!document.body) return;
    // الشاشة الصغيرة (≤360 عرض أو ≤700 طول) ويّا بطاقة «أول مرة هنا؟» ظاهرة: ننتظر يسكّرها (ما نغطي الزر الرئيسي ولا البطاقة)
    var small = innerWidth <= 360 || innerHeight <= 700, n = 0;
    var go = function () { if (small && obCard() && !forced) { if (++n < 300) setTimeout(go, 1000); return; }
      try { ss && ss.setItem("t:install-s", "1"); } catch (e) { /* */ }
      open(); };
    go();
  }, 2000); };
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
