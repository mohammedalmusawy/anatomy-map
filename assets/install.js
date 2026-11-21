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
    ".amins .tabs{grid-column:1/-1;display:flex;gap:6px;margin:8px 0 2px;background:var(--bg,#F5F6FA);border-radius:12px;padding:4px}" +
    ".amins .tabs button{flex:1;background:transparent;border:0;color:var(--muted,#5B6478);border-radius:9px;min-height:44px}" +
    ".amins .tabs button[aria-selected=true]{background:var(--card,#fff);color:var(--ink,#1E2433);box-shadow:0 1px 4px rgba(20,24,40,.12)}" +
    ".amins ol{grid-column:1/-1;margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px}" +
    ".amins ol li{display:flex;gap:10px;align-items:flex-start;font-size:var(--t-sm,.95rem);line-height:1.55}" +
    ".amins ol li i{flex:none;font-style:normal;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--brand-soft,#EEF0F8);color:var(--brand,#3B4A8C);font-weight:700;font-size:.8rem}" +
    ".amins ol li b{color:var(--brand,#3B4A8C)}.amins .one{grid-column:1/-1;width:100%;margin-top:8px}" +
    "@media (max-width:360px),(max-height:700px){.amins .sub{display:none}.amins .tabs{margin:4px 0 0}.amins ol{gap:3px;margin-top:4px}.amins ol li{font-size:.82rem;line-height:1.45}.amins ol li i{width:20px;height:20px}.amins .row{margin-top:4px}.amins .one{margin-top:4px}}" +
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
  // 📲 (21/11، طلب محمد): أول فتح ← طريقة التنزيل بطريقتين بكل بساطة: «🤖 أندرويد» (أغلب الطلاب) و«🍎 آيفون»، 3 خطوات مرقّمة.
  //   أندرويد يدعم التثبيت المباشر ← زر «ثبّت بضغطة وحدة» فوق الخطوات. الكمبيوتر: سطر واحد مثل قبل.
  var tab = ios ? "ios" : "android";
  var STEPS = {
    android: [["افتح الموقع من <b>كروم</b>، واضغط <b>⋮</b> فوق", "Open the site in <b>Chrome</b> and tap <b>⋮</b> at the top"],
              ["اختار <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>", "Choose <b>“Install app”</b> or <b>“Add to Home screen”</b>"],
              ["اضغط <b>«تثبيت»</b> ✅ وتطلع أيقونة المنصة بشاشتك", "Tap <b>“Install”</b> ✅ and the icon appears on your screen"]],
    ios: [["افتح الموقع من <b>سفاري</b> 🧭 (مو من داخل التلگرام)", "Open the site in <b>Safari</b> 🧭 (not inside Telegram)"],
          ["اضغط زر المشاركة <b>⬆️</b> تحت بالنص", "Tap the Share button <b>⬆️</b> at the bottom"],
          ["اختار <b>«إضافة إلى الشاشة الرئيسية»</b> ➕ ثم <b>«إضافة»</b>", "Choose <b>“Add to Home Screen”</b> ➕ then <b>“Add”</b>"]]
  };
  function body() {
    var desk = !mobile, s = desk ? steps() : "";
    var head = '<img src="' + root() + 'assets/icon-192.png" alt="">' +
      '<h2 id="amins-h">' + (desk ? T("ثبّت منصة تعلم الأشعة على جهازك", "Install the Radiology Learning Platform") : T("ثبّت منصة تعلم الأشعة على موبايلك", "Install the Radiology Learning Platform on your phone")) + '</h2>' +
      '<p class="sub">' + T("تنفتح مثل التطبيق بضغطة، وأسرع، وتشتغل بلا نت. تاخذ 10 ثواني:", "Opens like an app, faster, and works offline. Takes 10 seconds:") + '</p>';
    var one = bip ? '<button type="button" class="go one">📲 ' + T("ثبّت بضغطة وحدة", "Install in one tap") + '</button>' : "";
    var mid = desk ? '<p style="grid-column:1/-1">' + (s || "") + '</p>' :
      '<div class="tabs" role="tablist" aria-label="' + T("نوع الموبايل", "Phone type") + '">' +
        '<button type="button" role="tab" data-tab="android" aria-selected="' + (tab === "android") + '">🤖 ' + T("أندرويد", "Android") + '</button>' +
        '<button type="button" role="tab" data-tab="ios" aria-selected="' + (tab === "ios") + '">🍎 ' + T("آيفون", "iPhone") + '</button></div>' +
      '<ol role="tabpanel">' + STEPS[tab].map(function (x, i) { return '<li><i aria-hidden="true">' + (i + 1) + '</i><span>' + T(x[0], x[1]) + '</span></li>'; }).join("") + '</ol>';
    box.innerHTML = head + (tab === "android" || desk ? one : "") + mid +
      '<div class="row"><button type="button" class="later">' + T("تمام", "Got it") + '</button></div>' +
      '<button type="button" class="x" aria-label="' + T("إغلاق", "Close") + '">×</button>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-tab]"), function (b) {
      b.onclick = function () { tab = b.getAttribute("data-tab"); body(); var n = box.querySelector('[data-tab="' + tab + '"]'); if (n) n.focus(); };
    });
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
