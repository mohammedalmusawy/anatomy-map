/* 🌐 نموذج زر اللغة «ع | ENG» — معاينة فقط. ?lang=en يفتح بالإنكليزي (للقطات). */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var titles = { ar: document.title, en: document.body.getAttribute("data-title-en") || document.title };

  function store(v) { try { localStorage.setItem("t:lang", v); } catch (e) {} }
  function saved() { try { return localStorage.getItem("t:lang"); } catch (e) { return null; } }

  // نص كل عنصر بالعربي ينحفظ أول مرة، والإنكليزي من data-en
  var nodes = [].slice.call(document.querySelectorAll("[data-en]"));
  nodes.forEach(function (n) { n.setAttribute("data-ar", n.innerHTML); });
  var attrs = [].slice.call(document.querySelectorAll("[data-en-label]"));
  attrs.forEach(function (n) { n.setAttribute("data-ar-label", n.getAttribute("aria-label") || ""); });

  function paint(lang) {
    root.lang = lang; root.dir = lang === "en" ? "ltr" : "rtl";
    document.title = titles[lang];
    nodes.forEach(function (n) { n.innerHTML = n.getAttribute(lang === "en" ? "data-en" : "data-ar"); });
    attrs.forEach(function (n) { n.setAttribute("aria-label", n.getAttribute(lang === "en" ? "data-en-label" : "data-ar-label")); });
    [].forEach.call(document.querySelectorAll(".lang"), function (g) {
      g.setAttribute("aria-label", lang === "en" ? "Language" : "اللغة");
      g.setAttribute("data-cur", lang === "en" ? "2" : "1");
      [].forEach.call(g.querySelectorAll("button"), function (b) {
        var on = b.getAttribute("lang") === lang;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;                      // roving tabindex: Tab يوصل للمختار بس
      });
    });
  }

  function setLang(lang, focusBtn) {
    if (lang === root.lang) return;
    // نحفظ القسم اللي تقرا بيه حتى ترجع لنفس المكان بعد قلب الاتجاه
    var anchor = null, offset = 0;
    var secs = document.querySelectorAll("[data-sec], .hgrid");
    for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.bottom > 80) { anchor = secs[i]; offset = r.top; break; } }
    var go = function () {
      paint(lang); store(lang);
      if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - offset);
      if (focusBtn) { var b = document.querySelector('.lang button[lang="' + lang + '"]'); if (b) b.focus(); }
      var t = document.getElementById("toast");
      if (t) { t.textContent = lang === "en" ? "Now in English — same place" : "صار بالعربي — نفس المكان"; t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 1800); }
      requestAnimationFrame(function () { root.classList.remove("swapping"); });
    };
    if (reduce) return go();
    root.classList.add("swapping"); setTimeout(go, 160);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".lang button"); if (b) setLang(b.getAttribute("lang"), false);
  });
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest(".lang button"); if (!b) return;
    var k = e.key;
    if (k === "Enter" || k === " ") { e.preventDefault(); setLang(b.getAttribute("lang"), true); return; }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].indexOf(k) > -1) {
      e.preventDefault();   // خيارين بس: أي سهم يروح للثاني ويختاره (نمط radiogroup) — ما يتأثر بقلب الاتجاه
      var other = b.getAttribute("lang") === "ar" ? "en" : "ar";
      if (k === "Home") other = "ar"; if (k === "End") other = "en";
      setLang(other, true);
    }
  });

  // الشريط اللاصق (الخيار D): خط رفيع يطلع بس لما تنزل
  var st = document.querySelector(".cbar.sticky");
  if (st) window.addEventListener("scroll", function () { st.classList.toggle("stuck", window.scrollY > 4); }, { passive: true });

  var q = /[?&]lang=(en|ar)/.exec(location.search);
  paint(q ? q[1] : (saved() === "en" ? "en" : "ar"));
})();
