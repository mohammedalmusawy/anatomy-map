// 🎧 المحاضرة مسموعة — 3 مستويات (قرار محمد 28/10/2026):
// أ) مصطلح (.tm، خط منقّط): ضغطة = لفظه بس + معناه العربي واللفظ بحروف عربية + 🐢؛ تمرير الماوس يبيّن المعنى.
// ب) جملة (.ls): ضغطة = تنقرا هي بس وتتلوّن، من بدايتها لنهايتها: ملف واحد لكل قسم (data-src على .lsec)،
//    والجملة بتوقيتها داخله (data-s / data-e بالثانية) — نفس الصوت ما يتخزن مرتين.
// ج) قسم أو المحاضرة كاملة: جملة ورا جملة، الحالية تتلوّن والصفحة تنزل وياها؛ ⏸️ إيقاف/متابعة و🐢 أبطأ.
// الملفات تنزل بس وقت الضغط، والـ service worker يحفظها (تشتغل بلا نت بعدين). نص الأستاذ ما يتغير: كل هذا طبقة فوقه.
(function () {
  const box = document.getElementById("listen");
  if (!box) return;
  const T = JSON.parse((document.getElementById("lterms") || {}).textContent || "{}");
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  const main = new Audio(), word = new Audio();
  const pop = document.getElementById("tpop");
  const allBtn = document.getElementById("lall"), pauseBtn = document.getElementById("lpause"), slowBtn = document.getElementById("lslow");
  let queue = [], cur = null, mode = null, slow = false;
  try { slow = localStorage.getItem("t:slow") === "1"; } catch (e) {}
  const rate = () => (slow ? 0.75 : 1);
  // الملف ينزل كامل مرة وحدة (الـ service worker يحفظه ← يشتغل بلا نت)، وبعدين يشتغل من الذاكرة
  const blobs = new Map();
  const load = (u) => {
    if (!blobs.has(u)) blobs.set(u, fetch(u).then((r) => { if (!r.ok) throw r.status; return r.blob(); }).then((b) => URL.createObjectURL(b)));
    return blobs.get(u);
  };
  // الآيفون: أول ضغطة «تفتح» عناصر الصوت حتى يشتغل الملف بعد ما ينزل
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  let unlocked = false;
  const unlock = () => { if (unlocked) return; unlocked = true; [main, word].forEach((a) => { a.src = SILENT; a.play().catch(() => {}); }); file = null; };
  const esc = (x) => String(x || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function marks() {
    slowBtn.classList.toggle("on", slow); slowBtn.setAttribute("aria-pressed", slow);
    pauseBtn.disabled = !cur;
    pauseBtn.textContent = cur && main.paused ? "▶️ متابعة" : "⏸️ إيقاف";
    allBtn.classList.toggle("on", mode === "all");
    box.querySelectorAll(".lplay").forEach((b) => b.classList.toggle("on", mode === b.closest(".lsec")));
  }
  let file = null, raf = 0;
  const srcOf = (el) => new URL(el.closest(".lsec").dataset.src, location.href).href;
  function tick() {   // يوقف بنهاية الجملة بالضبط، أو يكمل للي بعدها بنفس الملف بدون قفزة
    raf = 0;
    if (!cur || main.paused) return;
    if (main.currentTime >= +cur.dataset.e - 0.03) { next(); return; }
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    main.pause(); queue = []; mode = null;
    if (cur) cur.classList.remove("on");
    cur = null; marks();
  }
  function next() {
    const prev = cur;
    if (cur) cur.classList.remove("on");
    cur = queue.shift() || null;
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
      // القسم الجاي جاهز (المحاضرة كاملة)
      const nx = queue.find((x) => srcOf(x) !== src);
      if (nx) load(srcOf(nx)).catch(() => {});
    }).catch(() => { if (cur === me) { cur.classList.add("err"); next(); } });
    marks();
  }
  main.onended = () => { if (!main.src.startsWith("data:")) next(); };
  main.onerror = () => { if (main.src.startsWith("data:")) return; file = null; if (cur) cur.classList.add("err"); next(); };
  main.onpause = marks;
  main.onplay = () => { marks(); if (cur && !raf) raf = requestAnimationFrame(tick); };
  function play(list, m) { word.pause(); hidePop(); stop(); queue = list; mode = m; next(); }

  // أ) المصطلح
  function showPop(el) {
    const d = T[el.dataset.k]; if (!d) return;
    pop.innerHTML = `<b dir="ltr">${esc(d.en)}</b><span class="ar">${esc(d.ar)}</span><span class="pr">${d.p} <bdi dir="ltr">${esc(d.i)}</bdi></span>` +
      `<span class="pb"><button type="button" class="say1" data-k="${el.dataset.k}">🔊</button><button type="button" class="say1 slow" data-k="${el.dataset.k}" data-r="0.75">🐢</button></span>`;
    pop.hidden = false;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    pop.style.top = r.bottom - b.top + 6 + "px";
    pop.style.left = Math.max(0, Math.min(r.left - b.left, b.width - pop.offsetWidth)) + "px";
  }
  function hidePop() { pop.hidden = true; }
  function sayTerm(k, r) {
    main.pause();
    load(root + "assets/audio/terms/" + k + ".mp3").then((b) => {
      word.src = b;
      word.playbackRate = word.defaultPlaybackRate = r || 1;
      word.play().catch(() => {});
    }).catch(() => {});
  }
  // ب) و ج) الأزرار والجمل
  function act(t) {
    const tm = t.closest(".tm"), k1 = t.closest(".say1[data-k]");
    if (k1) { sayTerm(k1.dataset.k, +(k1.dataset.r || 1)); return true; }
    if (tm && !tm.classList.contains("demo")) { showPop(tm); sayTerm(tm.dataset.k, 1); return true; }
    if (t === allBtn) { mode === "all" ? stop() : play([...box.querySelectorAll(".ls")], "all"); return true; }
    if (t === pauseBtn) { if (cur) main.paused ? main.play() : main.pause(); return true; }
    if (t === slowBtn) {
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
  box.addEventListener("click", (ev) => { unlock(); if (act(ev.target)) { ev.preventDefault(); ev.stopPropagation(); } });
  box.addEventListener("keydown", (ev) => {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches(".ls, .tm")) { ev.preventDefault(); unlock(); act(ev.target); }
    if (ev.key === "Escape") hidePop();
  });
  // تمرير الماوس على المصطلح (الكمبيوتر): يبيّن المعنى بس
  if (window.matchMedia("(hover: hover)").matches) {
    box.addEventListener("mouseover", (ev) => { const tm = ev.target.closest(".tm"); if (tm && !tm.classList.contains("demo")) showPop(tm); });
    box.addEventListener("mouseout", (ev) => { const tm = ev.target.closest(".tm"); if (tm && !pop.contains(ev.relatedTarget)) setTimeout(() => { if (!pop.matches(":hover")) hidePop(); }, 250); });
  }
  document.addEventListener("click", (ev) => { if (!box.contains(ev.target)) hidePop(); });
  marks();
  // رابط من الـ PDF (#s3) يفتح نفس القسم
  const open = () => { const d = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); if (d && d.tagName === "DETAILS") d.open = true; if (d) d.scrollIntoView({ block: "start" }); };
  window.addEventListener("hashchange", open); open();
})();
