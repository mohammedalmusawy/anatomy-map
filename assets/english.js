/* 🔤 إنكليزي الأشعة من الصفر (21/11/2026): 8 دروس قصيرة، كل درس: شرح + جدول أمثلة + 3 أسئلة تحقق.
   التقدّم بجهاز الطالب بس (localStorage «t:eng»). المصطلحات اللي بالمعجم يعلّمها listen.js وحده (صوت + معنى). */
(function () {
  "use strict";
  var root = document.getElementById("eng"), dataEl = document.getElementById("eng-data");
  if (!root || !dataEl) return;
  var D = JSON.parse(dataEl.textContent || "{}"), L = D.lessons || [];
  var KEY = "t:eng";
  function get() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) { return {}; } }
  function put(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_) {} }
  var S = get();
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function en(x, tag) { var b = el(tag || "bdi", "", x); b.setAttribute("dir", "ltr"); b.setAttribute("lang", "en"); return b; }
  var isEn = function (s) { return /^[\x20-\x7E→·’'\-\/()+=,.]+$/.test(s) && /[A-Za-z]/.test(s); };

  root.textContent = "";
  var prog = el("div", "eg-prog"); var bar = el("div", "eg-bar"); var fill = el("i"); bar.append(fill);
  var pt = el("p", "eg-pt"); prog.append(pt, bar); root.append(prog);
  function progress() {
    var n = L.filter(function (l) { return S[l.id]; }).length;
    pt.textContent = n === L.length ? "🎉 خلصت كل الدروس (" + n + " من " + L.length + ")" : "خلصت " + n + " من " + L.length + " دروس";
    fill.style.width = Math.round(100 * n / L.length) + "%";
  }

  L.forEach(function (l, i) {
    var d = el("details", "eg-l"); d.id = "l-" + l.id;
    var sm = el("summary", "noterm");
    var num = el("span", "eg-n", String(i + 1));
    var tt = el("span", "eg-t"); tt.append(el("b", "", l.t), en(l.en, "small"));
    var ck = el("span", "eg-ck", S[l.id] ? "✓" : ""); ck.setAttribute("aria-label", S[l.id] ? "خلصت" : "");
    sm.append(num, tt, ck); d.append(sm);
    var body = el("div", "eg-b");
    body.append(el("p", "eg-p", l.p));
    var tbl = el("div", "eg-rows");
    l.rows.forEach(function (r) {
      var row = el("div", "eg-r");
      r.forEach(function (c, k) { var cell = el("div", "eg-c" + k); cell.append(isEn(c) ? en(c) : document.createTextNode(c)); row.append(cell); });
      tbl.append(row);
    });
    body.append(tbl);
    // أسئلة التحقق: الخيارات تنخلط كل مرة
    var qb = el("div", "eg-q"); qb.append(el("p", "eg-qh", "✍️ تحقّق من فهمك"));
    var answered = 0;
    l.q.forEach(function (q) {
      var box = el("div", "eg-qq"); box.append(el("p", "eg-qt", q[0]));
      var opts = q[1].map(function (o, k) { return { o: o, ok: k === q[2] }; }).sort(function () { return Math.random() - 0.5; });
      var why = el("p", "eg-why"); why.setAttribute("role", "status");
      var btns = el("div", "eg-opts");
      opts.forEach(function (x) {
        var b = el("button", "eg-o"); b.type = "button";
        b.append(isEn(x.o) ? en(x.o) : document.createTextNode(x.o));
        b.addEventListener("click", function () {
          if (box.dataset.done) return;
          box.dataset.done = "1";
          btns.querySelectorAll("button").forEach(function (y, k) { y.disabled = true; if (opts[k].ok) y.classList.add("ok"); });
          if (!x.ok) b.classList.add("no");
          why.textContent = (x.ok ? "✅ صحيح. " : "❌ الجواب الصحيح معلَّم. ") + q[3];
          answered++;
          if (answered === l.q.length && !S[l.id]) { S[l.id] = Date.now(); put(S); ck.textContent = "✓"; ck.setAttribute("aria-label", "خلصت"); progress(); }
        });
        btns.append(b);
      });
      box.append(btns, why); qb.append(box);
    });
    body.append(qb);
    if (i < L.length - 1) {
      var nx = el("button", "btn plain eg-next", "الدرس الجاي ← " + L[i + 1].t); nx.type = "button";
      nx.addEventListener("click", function () { d.open = false; var n2 = document.getElementById("l-" + L[i + 1].id); n2.open = true; n2.scrollIntoView({ behavior: "smooth", block: "start" }); });
      body.append(nx);
    }
    d.append(body); root.append(d);
  });
  progress();
  // افتح أول درس ما خلص
  var first = L.filter(function (l) { return !S[l.id]; })[0];
  if (first && !location.hash) document.getElementById("l-" + first.id).open = true;
  if (location.hash) { var h = document.getElementById(location.hash.slice(1)); if (h && h.tagName === "DETAILS") h.open = true; }
})();
