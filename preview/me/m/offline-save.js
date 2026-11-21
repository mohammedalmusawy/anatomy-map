/* 📥 «احفظها بجهازك» (21/11/2026): زر صغير بأعلى صفحة المحاضرة يحفظ كل شي تحتاجه للقراءة بلا نت:
   الصفحة، ملف المحاضرة وملف الأسئلة (PDF) وعارضها، الصور، وصوت الأقسام. ينحفظ بكاش ما يتقلّم (anatomy-offline-v1)
   عن طريق رسالة «warm» للـ sw.js. ماكو أي إرسال لسيرفر غير الموقع نفسه. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator) || !window.caches) return;
  var kick = document.querySelector(".kick");
  if (!kick || !document.getElementById("ltabs")) return;          // صفحة محاضرة بس
  var OFF = "anatomy-offline-v1";
  var LIB = ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];

  // الترتيب حسب الأهمية (حد الـ SW 300): الصفحة ← الملفات وعارضها ← الشكل والسكربتات ← الصوت ← الصور بكل أحجامها
  function urls() {
    var out = {}, add = function (u) { try { var x = new URL(u, location.href); if (x.origin === location.origin) { x.hash = ""; out[x.href] = 1; } } catch (_) {} };
    var srcset = function (v) { (v || "").split(",").forEach(function (c) { var u = c.trim().split(/\s+/)[0]; if (u) add(u); }); };
    var page = new URL(location.href); page.search = ""; page.hash = ""; add(page.href);
    var root = null;
    document.querySelectorAll('a[href*="view/?f="]').forEach(function (a) {
      var v = new URL(a.getAttribute("href"), location.href);
      add(v.href);
      var f = v.searchParams.get("f");
      root = v.pathname.replace(/view\/$/, "");
      if (f && /\.pdf$/i.test(f) && f.indexOf("..") < 0) add(root + f.split("/").map(encodeURIComponent).join("/"));
    });
    document.querySelectorAll('a[href$=".pdf"]').forEach(function (a) { add(a.getAttribute("href")); });
    document.querySelectorAll('link[rel="stylesheet"][href], script[src]').forEach(function (x) { add(x.getAttribute("href") || x.getAttribute("src")); });
    var m, re = /["'(]((?:\.\.\/)*assets\/audio\/lectures\/[^"')\s]+\.mp3)/g, h = document.documentElement.innerHTML;
    while ((m = re.exec(h))) add(m[1]);
    document.querySelectorAll("img[src]").forEach(function (i) { add(i.getAttribute("src")); srcset(i.getAttribute("srcset")); });
    document.querySelectorAll("source[srcset]").forEach(function (x) { srcset(x.getAttribute("srcset")); });
    return Object.keys(out).slice(0, 300);
  }

  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "offsv";
  var st = document.createElement("style");
  st.textContent = ".offsv{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:8px 0 0;padding:0 14px;border-radius:999px;border:1px solid var(--line,#E3E6EE);background:var(--card,#fff);color:var(--ink,#1E2433);font-weight:600;font-size:14px;font-family:inherit;cursor:pointer}.offsv[disabled]{opacity:.85;cursor:default}.offsv.ok{border-color:var(--ok,#2E8B57);color:var(--ok,#2E8B57)}.offsv-w{display:block}";
  document.head.appendChild(st);
  var wrap = document.createElement("span"); wrap.className = "offsv-w"; wrap.setAttribute("aria-live", "polite"); wrap.appendChild(btn);
  kick.insertAdjacentElement("afterend", wrap);

  function set(t, cls, dis) { btn.textContent = t; btn.className = "offsv" + (cls ? " " + cls : ""); btn.disabled = !!dis; }
  set("📥 احفظها بجهازك للقراءة بلا نت");

  // محفوظة قبل كاملة؟ (علامة بالجهاز تنكتب بس إذا ولا شي فشل + الصفحة موجودة فعلاً بالكاش)
  var list = urls(), MK = "t:offsaved", key = location.pathname;
  function marks() { try { return JSON.parse(localStorage.getItem(MK) || "{}") || {}; } catch (_) { return {}; } }
  function mark(on) { try { var m = marks(); if (on) m[key] = Date.now(); else delete m[key]; localStorage.setItem(MK, JSON.stringify(m)); } catch (_) {} }
  if (marks()[key]) caches.open(OFF).then(function (c) { return c.match(list[0]); }).then(function (r) { if (r) set("✅ محفوظة بجهازك · تشتغل بلا نت", "ok"); }).catch(function () {});

  btn.addEventListener("click", function () {
    if (navigator.onLine === false) { set("📴 تحتاج نت حتى تنحفظ أول مرة"); setTimeout(function () { set("📥 احفظها بجهازك للقراءة بلا نت"); }, 3500); return; }
    set("⏳ دا ينحفظ…", "", true);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (_) {}   // يطلب من المتصفح ما يمسح المحفوظ
    var id = String(Date.now()), done = false;
    LIB.forEach(function (u) { fetch(u, { mode: "cors" }).catch(function () {}); });   // مكتبة العارض (الـ SW يحفظها)
    function onMsg(e) { var d = e.data || {}; if (d.type === "warm-done" && d.id === id) fin(d.ok || 0, d.fail || 0); }
    function fin(ok, fail) {
      if (done) return; done = true;
      navigator.serviceWorker.removeEventListener("message", onMsg);
      mark(!fail);
      if (!fail) set("✅ محفوظة بجهازك · تشتغل بلا نت", "ok");
      else if (ok) set("⚠️ انحفظ أغلبها (" + ok + " من " + (ok + fail) + "). اضغط مرة ثانية تكمل", "");
      else set("⚠️ ما انحفظت. تأكد من النت واضغط مرة ثانية", "");
    }
    navigator.serviceWorker.addEventListener("message", onMsg);
    navigator.serviceWorker.ready.then(function (reg) {
      (navigator.serviceWorker.controller || reg.active).postMessage({ type: "warm", id: id, urls: list });
    }).catch(function () { fin(0, 1); });
    setTimeout(function () { fin(0, 1); }, 90000);
  });
})();
