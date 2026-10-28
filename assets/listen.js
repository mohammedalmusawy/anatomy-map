// 🎧 المشغّل الموحّد (قرار محمد 29/10/2026) — نفس الكود بكل الموقع وداخل التليغرام (/tg/listen/)، ويحل محل say.js وأزرار 🔊/🐢 القديمة:
// أ) مصطلح: أي مصطلح بالمعجم (assets/audio/terms/lex.json) بأي نص إنكليزي يتعلّم وحده بخط منقّط خفيف (.tm).
//    ضغطة أو Enter ← يسمع لفظه بس + بطاقة (المعنى، اللفظ بحروف عربية، IPA، 🔊، 🐢)؛ تمرير الماوس (الكمبيوتر) ← المعنى بس.
// ب) جملة (.ls داخل .listen): ضغطة ← تنقرا هي بس وتتلوّن، من ملف القسم (data-src على .lsec) بتوقيتها (data-s / data-e).
// ج) ▶️ القسم أو المحاضرة كاملة: جملة ورا جملة والصفحة تنزل وياها؛ ⏸️ إيقاف/متابعة و🐢 أبطأ.
// صوت واحد بنفس الوقت (أي ضغطة جديدة توقف السابق). الملفات تنزل وقت الضغط بس، والـ service worker يحفظها (بلا نت بعدين).
// نص الأستاذ ما يتغير: كل هذا طبقة فوقه (span حول الكلمة، بدون تغيير حرف). ما يعلّم داخل الأزرار والروابط والخيارات والحقول.
(function () {
  if (window.Listen) return;
  const root = new URL("../", document.currentScript.src).href;
  const esc = (x) => String(x || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = new Audio(), word = new Audio();
  let LEX = {}, ready = null;
  let slow = false;
  try { slow = localStorage.getItem("t:slow") === "1"; } catch (e) {}
  const rate = () => (slow ? 0.75 : 1);

  // الملف ينزل كامل مرة وحدة (يمر بالـ service worker ← ينحفظ)، وبعدين يشتغل من الذاكرة (بلا مشاكل range بالآيفون)
  const blobs = new Map();
  const load = (u) => {
    if (!blobs.has(u)) blobs.set(u, fetch(u).then((r) => { if (!r.ok) throw r.status; return r.blob(); }).then((b) => URL.createObjectURL(b)));
    return blobs.get(u);
  };
  // الآيفون: أول ضغطة «تفتح» عنصرين الصوت حتى يشتغل الملف بعد ما ينزل
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  let unlocked = false, file = null;
  const unlock = () => { if (unlocked) return; unlocked = true; [main, word].forEach((a) => { a.src = SILENT; a.play().catch(() => {}); }); file = null; };

  // ── أ) المصطلحات ──
  // «Alpha (α) / Beta (β)» = «alpha beta»؛ «Directly / Indirectly» و«X-ray» و«Subtalar (talocalcaneal) joint» تنطابق بنفس الطريقة
  const norm = (s) => s.toLowerCase().replace(/\([^a-zà-ÿ)]*\)/g, " ").replace(/[\s\u2010-\u2015\/()-]+/g, " ").trim();
  const GAP = /^[\s\u2010-\u2015\/()\u0370-\u03ff-]{1,8}$/;
  const CI = new Map(), CS = new Map();   // CI: حساس لا (كلمات)، CS: حساس للحروف (مختصرات مثل CT وkVp وmA)
  let MAXW = 1;
  function index(lex) {
    LEX = lex;
    const put = (form, k) => {
      form = form.replace(/[“”"]/g, "").trim();
      if (!/[A-Za-z]/.test(form)) return;
      const n = norm(form), w = n.split(" ").length;
      const abbr = /^[A-Za-z0-9]+$/.test(form) && /[A-Z]/.test(form.slice(1)) || /^[A-Z]{2,}$/.test(form);
      if (abbr) { if (!CS.has(form)) CS.set(form, k); }
      else if (n.replace(/ /g, "").length >= 3 && !CI.has(n)) CI.set(n, k);
      if (w > MAXW) MAXW = Math.min(w, 10);
    };
    for (const k in lex) {
      const en = lex[k][0];
      put(en, k);
      const bare = en.replace(/\s*\([^)]*\)/g, "").trim();
      if (bare !== en) put(bare, k);
      (en.match(/\(([A-Za-z0-9]{2,8})\)/g) || []).forEach((p) => put(p.slice(1, -1), k));
    }
  }
  const SKIP = "script,style,noscript,textarea,input,select,option,button,a,code,pre,svg,label,.tm,.tpop,.noterm,[contenteditable],.lctl";
  const TOK = /[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’]*/g;
  const mine = new WeakSet();   // اللي نضيفه إحنا ما يرجع يتفحص
  function markText(node) {
    const t = node.nodeValue;
    if (!/[A-Za-z]{2}/.test(t)) return;
    const toks = [];
    let m; TOK.lastIndex = 0;
    while ((m = TOK.exec(t))) toks.push([m.index, m.index + m[0].length]);
    const hits = [];
    for (let i = 0; i < toks.length; i++) {
      for (let n = Math.min(MAXW, toks.length - i); n >= 1; n--) {
        const a = toks[i][0], b = toks[i + n - 1][1];
        let ok = true;
        for (let j = i; j < i + n - 1; j++) if (!GAP.test(t.slice(toks[j][1], toks[j + 1][0]))) { ok = false; break; }
        if (!ok) continue;
        const raw = t.slice(a, b), k = (n === 1 && CS.get(raw)) || CI.get(norm(raw));
        if (k) { const e2 = (raw.split("(").length > raw.split(")").length && t[b] === ")") ? b + 1 : b; hits.push([a, e2, k]); i += n - 1; break; }
      }
    }
    if (!hits.length) return;
    const f = document.createDocumentFragment();
    let p = 0;
    for (const [a, b, k] of hits) {
      if (a > p) f.appendChild(document.createTextNode(t.slice(p, a)));
      const s = document.createElement("span");
      s.className = "tm"; s.tabIndex = 0; s.setAttribute("role", "button"); s.dataset.k = k; s.textContent = t.slice(a, b);
      f.appendChild(s); mine.add(s); p = b;
    }
    if (p < t.length) f.appendChild(document.createTextNode(t.slice(p)));
    f.childNodes.forEach((x) => mine.add(x));
    node.parentNode.replaceChild(f, node);
  }
  function pron(el) {   // اسم الحالة بالأطلس: اللفظ تحته (مثل قبل)
    const k = el.querySelector(".tm") && el.textContent.trim() === el.querySelector(".tm").textContent.trim() ? el.querySelector(".tm").dataset.k : null;
    if (!k || el.nextElementSibling?.classList.contains("pron")) return;
    el.insertAdjacentHTML("afterend", `<span class="pron"><span class="pa">${LEX[k][2]}</span> <bdi class="pi">${esc(LEX[k][3])}</bdi></span>`);
  }
  let marking = false;
  function mark(el) {
    if (!el || !CI.size || (el.closest && el.closest(SKIP))) return;
    marking = true;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (!/[A-Za-z]{2}/.test(n.nodeValue) || n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(markText);
    (el.querySelectorAll ? el.querySelectorAll("article.case h3 .en") : []).forEach(pron);
    marking = false;
  }
  // تعليم على دفعات بوقت الفراغ (ما يثقّل الصفحة) + أي محتوى يجي بعدين (المساعد، البحث، الاختبار، قائمة المصطلحات)
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 30));
  let pend = new Set(), sched = false;
  function queue(el) {
    pend.add(el);
    if (sched) return; sched = true;
    idle(() => { sched = false; const xs = [...pend]; pend = new Set(); xs.filter((x) => x.isConnected && !xs.some((y) => y !== x && y.contains(x))).forEach(mark); });
  }

  // البطاقة (وحدة بالصفحة)
  const SHEET = window.matchMedia("(max-width: 639px), (hover: none)");
  const pop = document.createElement("div");
  pop.className = "tpop"; pop.id = "tpop"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-live", "polite");
  let popFor = null;
  function showPop(el) {
    const d = LEX[el.dataset.k]; if (!d) return;
    if (!pop.isConnected) document.body.appendChild(pop);
    pop.innerHTML = `<b dir="ltr">${esc(d[0])}</b><span class="ar">${esc(d[1])}</span><span class="pr">${d[2]} <bdi dir="ltr">${esc(d[3])}</bdi></span>` +
      `<span class="pb"><button type="button" class="say1" data-k="${el.dataset.k}" aria-label="اسمع لفظ ${esc(d[0])}">🔊</button>` +
      `<button type="button" class="say1 slow" data-k="${el.dataset.k}" data-r="0.75" aria-label="لفظ بطيء ${esc(d[0])}">🐢</button></span>`;
    // الموبايل (29/10، ملاحظة محمد): ورقة صغيرة بأسفل الشاشة، ما تغطي العنوان ولا الأزرار؛ والكلمة تبقى ظاهرة فوقها
    const sheet = SHEET.matches;
    pop.classList.toggle("sheet", sheet);
    if (sheet) pop.insertAdjacentHTML("afterbegin", '<button type="button" class="tclose" aria-label="سد">✕</button>');
    pop.hidden = false; popFor = el;
    const r = el.getBoundingClientRect(), W = document.documentElement.clientWidth;
    if (sheet) {
      pop.style.top = pop.style.left = "";
      const cover = innerHeight - pop.offsetHeight - 16;   // الكلمة تحت مستوى الورقة ← تنزل الصفحة شوية
      if (r.bottom > cover) window.scrollBy({ top: r.bottom - cover + 12, behavior: "smooth" });
      return;
    }
    // الكمبيوتر: تحت الكلمة دائماً (مو فوقها)
    pop.style.top = r.bottom + window.scrollY + 6 + "px";
    pop.style.left = Math.max(8, Math.min(r.left + window.scrollX, W - pop.offsetWidth - 8 + window.scrollX)) + "px";
  }
  function hidePop() { pop.hidden = true; popFor = null; }
  function sayTerm(k, r, btn) {
    stop();
    word.pause();
    document.querySelectorAll(".say1.on,.tm.on").forEach((x) => x.classList.remove("on"));
    if (btn) btn.classList.add("on");
    load(root + "assets/audio/terms/" + k + ".mp3").then((b) => {
      word.src = b;
      word.playbackRate = word.defaultPlaybackRate = r || 1;
      word.play().catch(() => {});
    }).catch(() => { if (btn) btn.classList.remove("on"); });
  }
  word.onended = word.onpause = () => document.querySelectorAll(".say1.on,.tm.on").forEach((x) => x.classList.remove("on"));

  // ── ب) و ج) الجمل والأقسام (داخل .listen) ──
  let queueS = [], cur = null, mode = null, raf = 0, box = null;
  const ctl = (id) => box && box.querySelector("#" + id);
  function marks() {
    if (!box) return;
    const sb = ctl("lslow"), pb = ctl("lpause"), ab = ctl("lall");
    if (sb) { sb.classList.toggle("on", slow); sb.setAttribute("aria-pressed", slow); }
    if (pb) { pb.disabled = !cur; pb.textContent = cur && main.paused ? "▶️ متابعة" : "⏸️ إيقاف"; }
    if (ab) ab.classList.toggle("on", mode === "all");
    box.querySelectorAll(".lplay").forEach((b) => b.classList.toggle("on", mode === b.closest(".lsec")));
  }
  const srcOf = (el) => new URL(el.closest(".lsec").dataset.src, location.href).href;
  function tick() {   // يوقف بنهاية الجملة بالضبط، أو يكمل للي بعدها بنفس الملف بدون قفزة
    raf = 0;
    if (!cur || main.paused) return;
    if (main.currentTime >= +cur.dataset.e - 0.03) { next(); return; }
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    main.pause(); queueS = []; mode = null;
    if (cur) cur.classList.remove("on");
    cur = null; marks();
  }
  function next() {
    const prev = cur;
    if (cur) cur.classList.remove("on");
    cur = queueS.shift() || null;
    if (!cur) { main.pause(); mode = null; marks(); return; }
    const sec = cur.closest("details");
    if (sec && !sec.open) sec.open = true;
    cur.classList.add("on");
    if (mode) cur.scrollIntoView({ block: "center", behavior: "smooth" });
    const me = cur, src = srcOf(cur), s0 = +cur.dataset.s;
    const contiguous = prev && file === src && !main.paused && Math.abs(+prev.dataset.e - s0) < 0.05;
    if (contiguous) { marks(); if (!raf) raf = requestAnimationFrame(tick); return; }
    load(src).then((b) => {
      if (cur !== me) return;
      const go = () => {
        main.currentTime = s0;
        main.playbackRate = main.defaultPlaybackRate = rate();
        main.play().then(() => { if (!raf) raf = requestAnimationFrame(tick); }).catch(() => stop());
      };
      if (file === src && main.readyState >= 1) go();
      else { file = src; main.src = b; main.addEventListener("loadedmetadata", go, { once: true }); }
      const nx = queueS.find((x) => srcOf(x) !== src);   // القسم الجاي جاهز (المحاضرة كاملة)
      if (nx) load(srcOf(nx)).catch(() => {});
    }).catch(() => { if (cur === me) { cur.classList.add("err"); next(); } });
    marks();
  }
  main.onended = () => { if (!main.src.startsWith("data:")) next(); };
  main.onerror = () => { if (main.src.startsWith("data:")) return; file = null; if (cur) cur.classList.add("err"); next(); };
  main.onpause = marks;
  main.onplay = () => { marks(); if (cur && !raf) raf = requestAnimationFrame(tick); };
  function play(list, m) { word.pause(); hidePop(); stop(); queueS = list; mode = m; next(); }

  // ── الضغط (ماوس، لمس، كيبورد) ──
  function act(t) {
    if (t.closest(".tclose")) { hidePop(); return true; }
    const pb = t.closest(".perrb");   // ⚠️ احتمال خطأ: يفتح/يسد بطاقته (29/10)
    if (pb) { const c = document.getElementById(pb.dataset.for); if (c) { c.hidden = !c.hidden; pb.setAttribute("aria-expanded", !c.hidden); } return true; }
    const k1 = t.closest(".say1[data-k]");
    if (k1) { sayTerm(k1.dataset.k, +(k1.dataset.r || 1), k1); return true; }
    const tm = t.closest(".tm");
    if (tm && !tm.classList.contains("demo") && LEX[tm.dataset.k]) { showPop(tm); sayTerm(tm.dataset.k, 1, tm); return true; }
    if (!box || !box.contains(t)) return false;
    if (t === ctl("lall")) { mode === "all" ? stop() : play([...box.querySelectorAll(".ls")], "all"); return true; }
    if (t === ctl("lpause")) { if (cur) main.paused ? main.play() : main.pause(); return true; }
    if (t === ctl("lslow")) {
      slow = !slow; main.playbackRate = rate(); marks();
      try { localStorage.setItem("t:slow", slow ? "1" : "0"); } catch (e) {}
      return true;
    }
    const lp = t.closest(".lplay");
    if (lp) { const s = lp.closest(".lsec"); mode === s ? stop() : play([...s.querySelectorAll(".ls")], s); return true; }
    const lb = t.closest(".lbtn");
    if (lb) { play([...lb.closest(".lu").querySelectorAll(".ls")], null); return true; }
    const ls = t.closest(".ls");
    if (ls) { const again = ls === cur && !main.paused && !mode; again ? stop() : play([ls], null); hidePop(); return true; }
    return false;
  }
  // capture: الضغطة على مصطلح ما تفتح رابط ولا تختار جواب ولا تسد/تفتح قسم
  document.addEventListener("click", (ev) => {
    if (!(ev.target instanceof Element)) return;
    if (ev.target.closest(".tm,.say1,.ls,.lbtn,.lplay,#lall,#lpause,#lslow")) unlock();   // الآيفون: قبل أي تشغيل وبنفس الضغطة
    if (act(ev.target)) { ev.preventDefault(); ev.stopPropagation(); return; }
    if (!pop.contains(ev.target)) hidePop();
  }, true);
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { hidePop(); return; }
    if ((ev.key === "Enter" || ev.key === " ") && ev.target instanceof Element && ev.target.matches(".ls, .tm")) { ev.preventDefault(); unlock(); act(ev.target); }
  });
  if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mouseover", (ev) => { const tm = ev.target instanceof Element && ev.target.closest(".tm"); if (tm && tm !== popFor && !tm.classList.contains("demo") && !SHEET.matches) showPop(tm); });
    document.addEventListener("mouseout", (ev) => {
      const tm = ev.target instanceof Element && ev.target.closest(".tm");
      if (tm && !pop.contains(ev.relatedTarget)) setTimeout(() => { if (!pop.matches(":hover") && !(tm.matches(":hover"))) hidePop(); }, 300);
    });
  }
  window.addEventListener("resize", hidePop);

  // رابط من الـ PDF (#s3) يفتح نفس القسم
  function openHash() {
    const d = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (d && d.tagName === "DETAILS") d.open = true;
    if (d && d.closest(".listen")) d.scrollIntoView({ block: "start" });
  }

  // ── التشغيل ──
  function mount(el) { box = el || document.querySelector(".listen"); marks(); openHash(); if (el && CI.size) queue(el); }
  ready = fetch(root + "assets/audio/terms/lex.json").then((r) => (r.ok ? r.json() : {})).then((d) => {
    index(d);
    queue(document.body);
    new MutationObserver((ms) => {
      if (marking) return;
      ms.forEach((m) => m.addedNodes.forEach((n) => {
        if (n === pop || pop.contains(n) || mine.has(n)) return;
        const el = n.nodeType === 1 ? n : n.parentElement;
        if (el && !(el.classList && el.classList.contains("tm"))) queue(el);
      }));
    }).observe(document.body, { childList: true, subtree: true });
    document.dispatchEvent(new Event("listen:ready"));
  }).catch(() => {});
  window.addEventListener("hashchange", openHash);
  const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  window.Listen = { mount, mark: queue, info: (k) => LEX[k], find: (en) => LEX[slug(en)], ready: () => ready, stop: () => { stop(); word.pause(); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount()); else mount();
})();
