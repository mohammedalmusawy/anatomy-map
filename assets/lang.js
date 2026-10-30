/* 🌐 زر اللغة «ع | ENG» — الخيار D (قرار محمد 29/10/2026): كبسولة «العرض» (ع | ENG + 🌙)، عرض بس.
   ENG ← lang=en و dir=ltr، نص الأستاذ الإنكليزي يبقى والعربي (.pa / .ar) يختفي، والواجهة من assets/lang-en.json.
   أي نص عربي ما إله ترجمة يبقى عربي (اتجاهه rtl) ويّاه علامة صغيرة «EN soon». ما يغيّر أي رابط ولا بيانات.
   الحفظ: localStorage "t:lang". ?lang=en يفتح بالإنكليزي (للقطات). */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AR = /[؀-ۿ]/;
  var SKIP = ".pa, .ar, script, style, noscript, textarea, input, select, .lang, [data-noen], .tpop, .ta, .tod .m, .pp-av, .pp-mono, .tm-mono, .ap-av";   // دائرة أول حرف من الاسم: عربية عمداً
  var BLOCK = "p, li, h1, h2, h3, h4, summary, figcaption, td, th, label, dt, dd, .ccard, .hcard, .pcard, .meta, .sub, .bl, button, a";
  var DICT = null, orig = new Map(), elOrig = new Map(), marked = [];
  var titleAr = document.title, root_ = (function () { var l = document.querySelector('link[rel="manifest"]'); return l ? new URL(".", l.href).href : "/"; })();

  function store(v) { try { localStorage.setItem("t:lang", v); } catch (e) {} }
  function saved() { try { return localStorage.getItem("t:lang"); } catch (e) { return null; } }
  function dict() {
    if (DICT) return Promise.resolve(DICT);
    return fetch(root_ + "assets/lang-en.json").then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (d) { return (DICT = d); });
  }
  // «Fractures · كسور» ← الجزء الإنكليزي بس
  // قالب بالأرقام: «السلايدات (24)» ← مفتاح «السلايدات ({n})»
  function tpl(k) {
    var nums = k.match(/\d+(?:\.\d+)?/g); if (!nums) return null;
    var v = DICT[k.replace(/\d+(?:\.\d+)?/g, "{n}")]; if (!v) return null;
    var i = 0; return v.replace(/\{n\}/g, function () { return nums[i++]; });
  }
  function one(p) {
    if (!p) return p;
    if (DICT[p]) return DICT[p];
    var v = tpl(p); if (v) return v;
    var m;
    if ((m = /^م(\d+)$/.exec(p))) return "L" + m[1];
    if ((m = /^(.*?)\s*(نظري|عملي) م(\d+)$/.exec(p))) { var s1 = m[1] ? one(m[1]) : ""; if (s1 == null) return null; return (s1 ? s1 + " " : "") + (m[2] === "نظري" ? "Theory" : "Practical") + " L" + m[3]; }
    if ((m = /^(اقرأ|اسمع|اختبر): (.+)$/.exec(p))) { var t2 = one(m[2]); return t2 == null ? null : ({ "اقرأ": "Read", "اسمع": "Listen", "اختبر": "Test" })[m[1]] + ": " + t2; }
    return AR.test(p) ? null : p;
  }
  function tr(t) {
    var k = t.trim(); if (!k) return null;
    if (DICT[k]) return t.replace(k, DICT[k]);
    var v1 = one(k); if (v1 != null && v1 !== k) return t.replace(k, v1);
    var m = /^(.*[A-Za-z].*?)\s+·\s+[^A-Za-z]*[؀-ۿ][^A-Za-z]*$/.exec(k);
    if (m) return t.replace(k, m[1]);
    // «نظري · م01» ← «Theory · L01»
    var parts = k.split(/\s*·\s*/);
    if (parts.length > 1) {
      var ok = parts.map(function (p) { return p === "" ? "" : one(p); });
      if (ok.every(function (x) { return x != null; })) return t.replace(k, ok.join(" · "));
    }
    return null;
  }
  function texts(cb) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { var p = n.parentElement; return p && AR.test(n.nodeValue) && n.nodeValue.trim() !== "ع" && !p.closest(SKIP) ? 1 : 3; },
    });
    var list = []; while (w.nextNode()) list.push(w.currentNode); list.forEach(cb);
  }
  function toEn() {
    // عنوان البطاقة ويّا اسمه الإنكليزي الرسمي (.hen) ← الاسم الرسمي يصير العنوان
    [].forEach.call(document.querySelectorAll(".hen"), function (h) {
      var t = h.previousElementSibling; if (!t || !t.firstChild || t.firstChild.nodeType !== 3) return;
      orig.set(t.firstChild, t.firstChild.nodeValue); t.firstChild.nodeValue = h.textContent;
    });
    // عنصر نصّه الكامل بالقاموس بس مقسوم بمصطلح منقّط (.tm) — مثل «الأشعة الملونة للرحم (HSG)» ← نترجمه كله
    // (52c) وكذلك الصيغ W<sub>T</sub> (sub.fx من listen.js): المفتاح يرجع «W_T» مثل القاموس
    var isFx = function (c) { return c.tagName === "SUB" && c.classList.contains("fx"); };
    [].forEach.call(document.querySelectorAll("small, b, p, h1, h2, h3, li, span, a, figcaption, bdi, em, strong, label, div"), function (el) {
      if (el.closest(SKIP) || !el.firstElementChild || elOrig.has(el)) return;
      if ([].some.call(el.children, function (c) { return !c.classList.contains("tm") && !isFx(c); })) return;
      var k = el.textContent, fx = el.querySelector("sub.fx");
      if (fx) { var cl = el.cloneNode(true); [].forEach.call(cl.querySelectorAll("sub.fx"), function (x) { x.replaceWith("_" + (x.getAttribute("data-r") || x.textContent)); }); k = cl.textContent; }
      k = k.replace(/\s+/g, " ").trim(); if (!AR.test(k) || !DICT[k]) return;
      elOrig.set(el, el.innerHTML); el.textContent = DICT[k];
    });
    texts(function (n) {
      // عنصر بيه العربي ويّا نسخته الإنكليزية (.en / .h1en) ← نخفي العربي بس (قبل الترجمة، حتى ما يتكرر «IntroductionIntroduction»)
      var par = n.parentElement;
      if (par.querySelector(':scope > .en, :scope > .h1en')) { orig.set(n, n.nodeValue); n.nodeValue = ""; return; }
      var v = tr(n.nodeValue);
      if (v != null) { orig.set(n, n.nodeValue); n.nodeValue = v; if (window.SubFx && v.indexOf("_") > -1 && window.SubFx.test(v)) fxRep.push([window.SubFx.wrap(n), n]); return; }   // ₓ (52b) صيغة بالترجمة ← W<sub>T</sub>
      var b = par.closest(BLOCK) || par;          // ما إله ترجمة ← عربي + «EN soon»
      if (b.closest("[data-ensoon]") && b.closest("[data-ensoon]") !== b) return;
      if (!b.hasAttribute("data-ensoon")) { b.setAttribute("data-ensoon", ""); b.setAttribute("dir", "rtl"); b.setAttribute("lang", "ar"); marked.push(b); }
    });
    [].forEach.call(document.querySelectorAll("[aria-label]"), function (el) {
      var a = el.getAttribute("aria-label"); if (!AR.test(a) || el.closest(".lang")) return;
      var v = DICT[a.trim()]; if (v) { el.setAttribute("data-ar-label", a); el.setAttribute("aria-label", v); }
    });
    // عنوان (مثل مجموعات الأطلس h2.gh) بيه span إنكليزي فرعي (.gh-en وأمثاله): إذا العنوان المترجم صار نفسه أو يحتويه ← نخفي الفرعي
    [].forEach.call(document.querySelectorAll("h2 [class$='-en'], h3 [class$='-en'], h2 > [lang='en'], h3 > [lang='en']"), function (x) {
      if (x.hidden || x.classList.contains("en")) return;
      var h = x.closest("h2, h3"); if (!h) return;
      var own = h.textContent.replace(x.textContent, "").replace(/\s+/g, " ").trim().toLowerCase(), t = x.textContent.replace(/\s+/g, " ").trim().toLowerCase();
      if (t && own && (own === t || own.indexOf(t) > -1 || t.indexOf(own.replace(/^[^a-z]+/, "")) > -1)) { x.hidden = true; x.setAttribute("data-dup", ""); }
    });
    // سطر تحت العنوان بنفس النص الإنكليزي (العنوان صار إنكليزي) ← نخفيه حتى ما يتكرر
    [].forEach.call(document.querySelectorAll("h1 + .sub, h1 + p, h1 + .en"), function (x) {
      var h = x.previousElementSibling; if (h && h.textContent.trim() === x.textContent.trim()) { x.hidden = true; x.setAttribute("data-dup", ""); }
    });
    // 30/10: «🎯 Purpose الغرض» ← العنوان العربي الصغير (.gh-ar) صار نفس الإنكليزي اللي جنبه ← نخفيه حتى ما يطلع «Purpose Purpose»
    [].forEach.call(document.querySelectorAll(".gh-ar"), function (x) {
      var p = x.previousElementSibling, n = function (v) { return String(v || "").replace(/\s+/g, " ").trim().toLowerCase(); };
      if (p && n(p.textContent) === n(x.textContent)) { x.hidden = true; x.setAttribute("data-dup", ""); }
    });
    var t = DICT[titleAr.replace(/ · معاينة$/, "")]; document.title = t ? t + " · Preview" : titleAr;
  }
  var fxRep = [];
  function toAr() {
    fxRep.forEach(function (x) { if (x[0].parentNode) x[0].parentNode.replaceChild(x[1], x[0]); }); fxRep = [];   // نرجّع العقدة الأصلية قبل الاستعادة
    elOrig.forEach(function (h, el) { el.innerHTML = h; }); elOrig.clear();
    orig.forEach(function (v, n) { n.nodeValue = v; }); orig.clear();
    marked.forEach(function (b) { b.removeAttribute("data-ensoon"); b.removeAttribute("dir"); b.removeAttribute("lang"); }); marked = [];
    [].forEach.call(document.querySelectorAll("[data-ar-label]"), function (el) { el.setAttribute("aria-label", el.getAttribute("data-ar-label")); el.removeAttribute("data-ar-label"); });
    [].forEach.call(document.querySelectorAll("[data-dup]"), function (x) { x.hidden = false; x.removeAttribute("data-dup"); });
    document.title = titleAr;
  }
  var mo = null, busy = false;
  function watch(on) {
    if (mo) { mo.disconnect(); mo = null; }
    if (!on || !window.MutationObserver) return;
    var t = 0;
    mo = new MutationObserver(function () { if (busy) return; clearTimeout(t); t = setTimeout(function () { busy = true; toEn(); busy = false; }, 60); });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function seg(lang) {
    [].forEach.call(document.querySelectorAll(".lang"), function (g) {
      g.setAttribute("aria-label", lang === "en" ? "Language" : "اللغة"); g.setAttribute("data-cur", lang === "en" ? "2" : "1");
      [].forEach.call(g.querySelectorAll("button"), function (b) {
        var on = b.getAttribute("lang") === lang; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1;
      });
    });
    var d = document.querySelector(".disp"); if (d) d.setAttribute("aria-label", lang === "en" ? "Display" : "العرض");
  }
  function lexMarked() {
    if (!window.Listen || !window.Listen.ready) return null;
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 30); };
    return Promise.resolve(window.Listen.ready()).then(function () { return new Promise(function (r) { idle(function () { idle(r); }); }); });
  }
  function paint(lang) {
    root.lang = lang; root.dir = lang === "en" ? "ltr" : "rtl"; seg(lang);
    // ⚡ (30/10) الترجمة بعد ما يكمّل listen.js تعليم المصطلحات (المعجم صار ينزل بعد load) ← نفس الشكل القديم: مصطلحات النص تتنقّط، الواجهة المترجمة لا
    if (lang === "en") return Promise.all([dict(), lexMarked()]).then(function () { watch(false); toAr(); busy = true; toEn(); busy = false; watch(true); });
    watch(false); toAr(); return Promise.resolve();
  }
  function toast(lang) {
    var t = document.getElementById("ltoast");
    if (!t) { t = document.createElement("div"); t.id = "ltoast"; t.className = "ltoast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = lang === "en" ? "Now in English — same place" : "صار بالعربي — نفس المكان";
    t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 1800);
  }
  function setLang(lang, focusBtn) {
    if (lang === root.lang) return;
    var anchor = null, off = 0, secs = document.querySelectorAll("[data-sec], section, h2");   // يرجع لنفس المكان بعد قلب الاتجاه
    for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.bottom > 80) { anchor = secs[i]; off = r.top; break; } }
    var go = function () {
      paint(lang).then(function () {
        store(lang);
        if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - off);
        if (focusBtn) { var b = document.querySelector('.lang button[lang="' + lang + '"]'); if (b) b.focus(); }
        toast(lang); requestAnimationFrame(function () { root.classList.remove("swapping"); });
      });
    };
    if (reduce) return go();
    root.classList.add("swapping"); setTimeout(go, 160);
  }

  document.addEventListener("click", function (e) { var b = e.target.closest(".lang button"); if (b) setLang(b.getAttribute("lang"), false); });
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest(".lang button"); if (!b) return;
    var k = e.key;
    if (k === "Enter" || k === " ") { e.preventDefault(); setLang(b.getAttribute("lang"), true); return; }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].indexOf(k) > -1) {
      e.preventDefault();
      var other = b.getAttribute("lang") === "ar" ? "en" : "ar";
      if (k === "Home") other = "ar"; if (k === "End") other = "en";
      setLang(other, true);
    }
  });
  var st = document.querySelector(".cbar.sticky");
  if (st) window.addEventListener("scroll", function () { st.classList.toggle("stuck", window.scrollY > 4); }, { passive: true });
  // 30/10: ارتفاع الشريط الثابت الحقيقي ← scroll-padding-top (lang.css) حتى الروابط #… ما تنزل تحته
  if (st) { var cbh = function () { root.style.setProperty("--cbar-h", st.offsetHeight + "px"); }; cbh(); window.addEventListener("resize", cbh, { passive: true }); }

  var q = /[?&]lang=(en|ar)/.exec(location.search);
  var start = q ? q[1] : (saved() === "en" ? "en" : "ar");
  window.Lang = { set: setLang, get: function () { return root.lang; } };
  if (start === "en") { root.lang = "ar"; paint("en"); } else seg("ar");
})();
