// 🪺 «مساحتي الخاصة» — الواجهة (مسودة 77). تشتغل بـ /me/ بس، وبعد myplus.js (الدوال الصافية) + notes.js + myspace.js.
// MyPlusUI.init({ root, Notes, ix, subjectName, examFromCache }) — تقرا المفاتيح (settings.sections.myspace_plus) وتركّب الأجزاء المفتوحة بس؛ غير الجاهز يبقى مخفي.
// كل نص من الطالب يدخل الصفحة بـ textContent أو esc()؛ ماكو أي رفع شبكة غير استدعاء student_wipe_mine() (بعد تأكيد الطالب، ومفتاح wipe).
(function () {
  "use strict";
  const P = window.MyPlus, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = P.esc, LS = P.LS;
  const EN = () => document.documentElement.lang === "en";
  const T = (ar, en) => (EN() ? en : ar);
  const now = () => Date.now();
  const todayKey = () => P.ymd(new Date());
  const ICO = {
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s2-.5 3-.5A4 4 0 0 0 21 11c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', down: '<path d="M12 4v12M6 10l6 6 6-6M5 20h14"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    quote: '<path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4-4 4.5M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.5-1.5 4-4 4.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', check: '<path d="m5 12 4 4 10-10"/>',
  };
  const ico = (k) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  let F = { on: false }, O = {}, gap = 0, firstVisit = false, seenSet = false, inited = false;

  // ── المفاتيح ──
  const localhost = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  function readFlags() {
    let S = window.STUDY_SETTINGS;
    if (localhost()) { const o = LS.get("t:me-plus-flags", null); if (o && typeof o === "object") S = Object.assign({}, S || {}, { myspace_plus: o }); }   // تجربة محلية بس (localhost)
    return P.flags(S);
  }

  // ── ستايل ──
  const STYLE = `
.mp-hide[hidden], .mp [hidden] { display: none !important; }
.mhi { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px 14px; align-items: center; margin: 14px 0 12px; padding: 16px; border: 1px solid var(--line); border-radius: 20px; background: var(--card); overflow: hidden; }
.mhi::before { content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 34px; background: var(--brand-soft); opacity: .8; clip-path: polygon(0 55%, 18% 40%, 36% 55%, 54% 40%, 72% 55%, 100% 38%, 100% 100%, 0 100%); pointer-events: none; }
.mhi > * { position: relative; }
.mhi .mav { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 1px solid var(--line); display: block; flex: none; }
.mhi .mav svg { width: 100%; height: 100%; display: block; }
.mhi .mhw { min-width: 0; } .mhi h1 { margin: 0; font: 800 var(--t-lg)/1.5 var(--title-font); overflow-wrap: anywhere; }
.mhi .mhs { margin: 4px 0 0; font-size: var(--t-md); line-height: 1.7; color: var(--muted); overflow-wrap: anywhere; }
.mhi .mcb { align-self: start; min-width: 44px; min-height: 44px; border: 1px solid var(--line); background: var(--bg); color: var(--brand); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
.mhi .mcb .ico, .mcust .ico, .mtasks .ico, .mfocus .ico { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.mhi .mcb[aria-expanded="true"] { background: var(--brand-soft); border-color: var(--brand); }
.mcust { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 4px 16px 16px; margin: 0 0 14px; }
.mcust h2 { font: 800 var(--t-md) var(--title-font); margin: 18px 0 8px; }
.mcust .mcn { display: flex; gap: 14px; align-items: center; margin: 0 0 12px; }
.mcust .mcn .mav { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 1px solid var(--line); flex: none; } .mcust .mcn .mav svg { width: 100%; height: 100%; display: block; }
.mcust .mcn b { display: block; font-family: var(--title-font); overflow-wrap: anywhere; } .mcust .mcn small { color: var(--muted); font-size: var(--t-sm); line-height: 1.6; display: block; }
.mp-sw { display: grid; grid-template-columns: repeat(6, minmax(44px, 1fr)); gap: 8px; margin: 6px 0; padding: 0; }
.mp-sw button { aspect-ratio: 1; min-height: 44px; border-radius: 50%; border: 1px solid var(--line); background: none; padding: 0; cursor: pointer; overflow: hidden; }
.mp-sw button svg { width: 100%; height: 100%; display: block; } .mp-sw button[aria-pressed="true"] { outline: 2px solid var(--ink); outline-offset: 2px; }
.mp-sw.cols button { background: var(--c); }
.mp-th { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mp-th button { text-align: start; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); padding: 10px; cursor: pointer; min-height: 72px; color: var(--ink); font: 700 var(--t-sm) var(--title-font); }
.mp-th button[aria-pressed="true"] { outline: 2px solid var(--ink); outline-offset: 2px; }
.mp-th .mini { display: flex; flex-direction: column; gap: 5px; background: var(--c-card); border: 1px solid var(--line); border-radius: 10px; padding: 7px; margin-bottom: 6px; }
.mp-th .mini i { display: block; height: 6px; border-radius: 9px; background: var(--line); } .mp-th .mini i.b { height: 14px; background: var(--c-brand); }
.mp-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 52px; border-bottom: 1px solid var(--line); } .mp-row:last-child { border-bottom: 0; }
.mp-row small { display: block; color: var(--muted); font-size: var(--t-sm); }
.mp-tg { width: 52px; min-height: 44px; border: 0; background: none; padding: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.mp-tg i { width: 48px; height: 28px; border-radius: 99px; background: var(--line); position: relative; display: block; }
.mp-tg i::after { content: ""; position: absolute; top: 3px; inset-inline-start: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--card); box-shadow: 0 0 0 1px var(--line); transition: inset .15s; }
.mp-tg[aria-checked="true"] i { background: var(--ok); } .mp-tg[aria-checked="true"] i::after { inset-inline-start: 23px; }
.mp-tg:focus-visible, .mp-sw button:focus-visible, .mp-th button:focus-visible, .mhi .mcb:focus-visible, .mtk .ck:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
.mcust .cbtn.mp-danger { background: var(--bad-soft); color: var(--bad); border: 1.5px solid var(--bad); } .mcust #mp-wgo.mp-danger { background: var(--bad); color: var(--brand-ink); }
.mcust #mp-wgo:disabled { opacity: .5; cursor: default; }
.mtools .mp-inline { grid-column: 1 / -1; margin: 0; }
body.mp-art-open .fab { display: none !important; }
.mp-ph { margin: 0 0 8px; font: 800 var(--t-md) var(--title-font); } .mp-note { color: var(--muted); font-size: var(--t-sm); margin: 6px 0 0; line-height: 1.7; }
.mtasks .mtq { display: flex; gap: 8px; align-items: center; background: var(--card); border: 1px dashed var(--brand); border-radius: 14px; padding: 4px 6px 4px 4px; }
.mtasks .mtq input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; color: var(--ink); padding: 8px 10px; min-height: 44px; } .mtasks .mtq input:focus { outline: none; }
.mtasks .mtq:focus-within { border-style: solid; }
.mtasks .mtq button { min-width: 44px; min-height: 44px; border-radius: 12px; border: 0; background: var(--brand); color: var(--brand-ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.mtasks .mtu { color: var(--muted); font-size: var(--t-sm); margin: 6px 4px 8px; min-height: 1.6em; line-height: 1.7; overflow-wrap: anywhere; }
.mtasks .mtabs { display: flex; gap: 6px; margin: 8px 0 10px; } .mtasks .mtabs .chip2 { flex: 1; min-width: 0; padding: 0 6px; }
.mtk { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 8px 10px; margin: 0 0 8px; }
.mtk .ck { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--bg); color: var(--ok); font-size: var(--t-lg); cursor: pointer; padding: 0; }
.mtk.done .ck { background: var(--ok-soft); border-color: var(--ok); } .mtk.done b { text-decoration: line-through; color: var(--muted); }
.mtk b { display: block; font: 600 var(--t-sm)/1.55 var(--title-font); overflow-wrap: anywhere; } .mtk small { color: var(--muted); font-size: var(--t-sm); }
.mtk .del { width: 44px; height: 44px; border: 0; background: none; color: var(--muted); cursor: pointer; border-radius: 12px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
.mtasks .mte { color: var(--muted); text-align: center; border: 1px dashed var(--line); border-radius: 14px; padding: 16px 10px; font-size: var(--t-sm); margin: 0; }
.timer.mfocus { display: block; text-align: center; padding: 14px; }
.mfocus .mfl { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 4px 0 10px; }
.mfocus .mfc { font: 800 2.4rem/1.2 var(--title-font); direction: ltr; margin: 6px 0; font-variant-numeric: tabular-nums; }
.mfocus .mfs { color: var(--muted); font-size: var(--t-sm); margin: 0 0 8px; min-height: 1.6em; } .mfocus .mfb { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.mfocus input[type=number] { width: 84px; min-height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--ink); font: inherit; text-align: center; }
.mart { position: relative; margin: 0; border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: var(--ab); color: var(--ai); overflow-wrap: anywhere; }
.mart h3 { margin: 0 0 6px; font: 800 var(--t-md)/1.5 var(--title-font); color: var(--ar); } .mart p { margin: 0 0 8px; font-size: var(--t-sm); line-height: 1.9; } .mart p:last-child { margin-bottom: 0; }
.mart.paper { background-image: repeating-linear-gradient(transparent 0 33px, color-mix(in srgb, var(--ar) 22%, transparent) 33px 34px); background-color: var(--ab); } .mart.paper p { line-height: 34px; margin: 0; }
.mart.quote { text-align: center; padding-top: 28px; } .mart.quote .mq { position: absolute; top: -2px; inset-inline-start: 50%; transform: translateX(-50%); font: 800 3rem/1 var(--title-font); color: var(--ar); opacity: .5; }
.mart.quote h3 { font-size: var(--t-lg); }
.marte textarea, .marte input[type=text] { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--ink); font: inherit; padding: 10px; margin: 0 0 6px; }
.marte textarea { min-height: 140px; resize: vertical; } .marte .mpick { display: grid; gap: 6px; margin: 6px 0; } .marte .mpick button { text-align: start; min-height: 44px; }
.mp-cols { display: flex; gap: 10px; margin: 6px 0; } .mp-cols button { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); cursor: pointer; padding: 0; background: var(--c); } .mp-cols button[aria-pressed="true"] { outline: 2px solid var(--ink); outline-offset: 2px; }
@media (max-width: 719px) { .mtools .big4 > .big[data-panel="particle-sec"] { grid-column: 1 / -1; min-height: 72px; } }
.mpz { margin: 8px 0 0; } .mpz .tin { margin: 6px 0; }
@media (min-width: 720px) { .mp-sw { grid-template-columns: repeat(12, minmax(44px, 1fr)); } .mcust, .mhi { max-width: 720px; } }
`;
  function css() { if ($("#myplus-css")) return; const s = document.createElement("style"); s.id = "myplus-css"; s.textContent = P.themeCSS() + STYLE; document.head.appendChild(s); }

  // ── التخزين (قيم prefs: كل واحدة بيها t) ──
  const get = (k, d) => { const v = LS.get("t:me-" + k, d); return v && typeof v === "object" && !Array.isArray(v) ? v : d; };   // قيمة مخرّبة (مو كائن) ← الافتراضي
  const safe = (f) => { try { return f(); } catch (e) { return null; } };   // خطأ بجزء ما يوقف باقي الأجزاء
  function put(k, v) { LS.set("t:me-" + k, Object.assign({}, v, { t: now() })); document.dispatchEvent(new CustomEvent("notes:change")); }   // notes:change يحرّك المزامنة (الختم الفعلي من sync.js)
  const body = () => document.body;

  // ── الثيم ──
  function applyTheme() { const t = get("theme", null), k = F.theme && t && typeof t.v === "string" && P.has(P.THEMES, t.v) ? t.v : "paper"; if (k === "paper") body().removeAttribute("data-mt"); else body().setAttribute("data-mt", k); }

  // ── الاسم ──
  // الاسم من حالة الحساب الحالية (Account.state.student) — هي المرجع. المفتاح المشترك t:acct-name (الاسم الأول بس) احتياط وقت ما الحساب لسه ما حمّل،
  // وبس إذا في جلسة (logout يمسح الاثنين)؛ وإذا الحساب محمّل وما عنده اسم ← بلا اسم (ما نرجع لاسم طالب سابق)
  // الاحتياط كلمة وحدة: إذا مقدّمة مركّب (عبد/أبو/أم…) ← بلا اسم لحد ما يحمّل الحساب
  function fullName() {
    const A = window.Account;
    try { const u = A && A.state && A.state.student; if (u) return u.full_name ? P.cleanName(u.full_name) : ""; } catch (e) {}
    try { if (!localStorage.getItem("t:acct-session")) return ""; const w = P.cleanName(localStorage.getItem("t:acct-name") || ""); return P.isCompWord(w) ? "" : w; } catch (e) { return ""; }
  }
  const signed = () => { const Y = window.Sync; return !!(Y && Y.state && Y.state.mode === "cloud"); };
  const avatarPref = () => { const a = get("avatar", null); return { c: a && a.c >= 0 && a.c < 6 ? a.c : 0, m: a && P.MOTIFS.includes(a.m) ? a.m : "arcs" }; };

  // ── 👋 التحية ──
  function greetInput() {
    const c = get("call", null) || {}, last = LS.get("t:last", null), st = LS.get("t:strength", []), tk = $$("#ptoday .task"), ex = O.examFromCache ? O.examFromCache(LS.get("t:nextexam", null)) : null;
    let resume = null; if (last && last.title && last.t) { const d = Math.round((new Date(todayKey()) - new Date(P.ymd(new Date(last.t)))) / 864e5); if (d >= 1) resume = { title: String(last.title).slice(0, 60), daysAgo: d }; }
    const lastQ = Array.isArray(st) && st.length ? st[st.length - 1] : null;
    let exam = null; if (ex && ex.date && window.STUDY_SETTINGS && window.STUDY_SETTINGS.exams === true) { const days = Math.round((new Date(ex.date) - new Date(todayKey())) / 864e5); if (days >= 0 && days <= 3) exam = { days, name: O.subjectName ? O.subjectName(ex.subject) : ex.subject }; }
    return { now: now(), full: fullName(), call: c.n || "first", callSet: !!c.n, g: c.g || "", firstVisit, gapDays: gap, en: EN(), exam,
      plan: { total: tk.length, done: tk.filter((x) => x.classList.contains("done")).length }, resume, weak: !!(lastQ && lastQ.pct != null && lastQ.pct <= 50 && P.ymd(new Date(lastQ.t)) === todayKey()) };
  }
  function paintHi() {
    const el = $("#mhi"); if (!el || !F.greet) return;
    const g = P.greet(greetInput()), av = avatarPref(), nm = fullName();
    el.hidden = false; const old = $(".hi2"); if (old) old.hidden = true;
    el.innerHTML = `<span class="mav" data-noen>${F.avatar ? P.avatarSVG(av.c, av.m, nm) : P.avatarSVG(0, "arcs", nm)}</span><span class="mhw"><h1 class="noterm" data-noen></h1><p class="mhs" data-noen></p></span>` +
      `<button type="button" class="mcb" id="mcb" aria-label="${esc(T("رتّب صفحتي", "Customize my page"))}" aria-expanded="${!$("#mcust").hidden}" aria-controls="mcust">${ico("palette")}</button>`;
    const sp = P.splitGreet(g.text); $("h1", el).textContent = sp.head; const hp = $(".mhs", el); hp.textContent = sp.rest; hp.hidden = !sp.rest;
    if (!seenSet) { seenSet = true; LS.set("t:me-seen", { d: todayKey(), n: 1 }); }
  }

  // ── 🎨 رتّب صفحتي ──
  const SECS = [["today", "اليوم: خطتي ومهامي", "Today: plan & tasks"], ["subjects", "محاضراتي", "My lectures"], ["focus", "مؤقت التركيز", "Focus timer"], ["article", "مقالتي بأول الصفحة", "My article at the top"]];
  const DEFAULT_OFF = {};   // المقالة مخفية افتراضياً لأن article.top=false (مو لأن الخانة مطفية)
  const shown = (id) => { const l = get("layout", null), h = l && l.h && typeof l.h === "object" ? l.h : null; return h && P.has(h, id) ? !!h[id] : !DEFAULT_OFF[id]; };
  const artTop = () => { const a = get("article", null); return !!(a && a.top === true && shown("article")); };
  function applyLayout() {
    const on = F.layout;
    const set = (sel, v) => $$(sel).forEach((x) => { x.hidden = !v; });
    const sec = (id) => (on ? shown(id) : id !== "article");
    const today = $('section[aria-labelledby="h-plan"]'); if (today) today.hidden = !sec("today");
    const ts = $("#mtasks-sec"); if (ts) ts.hidden = !F.tasks || !sec("today");
    const sub = $('section[aria-labelledby="h-my"]'); if (sub) sub.hidden = !sec("subjects");
    const ft = $('[data-panel="ptimer"]'); if (ft) ft.hidden = !sec("focus"); const pt = $("#ptimer"); if (pt && !sec("focus")) pt.hidden = true;
    const top = $("#particle-top"); if (top) { const art = get("article", null); top.hidden = !(F.article && shown("article") && art && art.top === true && P.articleOf(art)); }
  }
  function paintCust() {
    const el = $("#mcust"); if (!el) return;
    const av = avatarPref(), nm = fullName(), th = get("theme", null), cl = get("call", null) || {}, tv = F.theme && th && typeof th.v === "string" && P.has(P.THEMES, th.v) ? th.v : "paper";
    const chip = (a, ar, en, on, v) => `<button type="button" class="chip2" data-${a}="${esc(v)}" aria-pressed="${on}">${esc(T(ar, en))}</button>`;
    const first = P.nameOf(nm, "first"), two = P.nameOf(nm, "two");
    let h = `<h2 id="mc-h" tabindex="-1">${esc(T("رتّب صفحتي", "Customize my page"))}</h2>`;
    if (F.avatar) h += `<h3 class="mp-h">${esc(T("صورتك", "Your picture"))}</h3><div class="mcn"><span class="mav" data-noen>${P.avatarSVG(av.c, av.m, nm)}</span><span><b data-noen></b><small>${esc(T("الحرف الأول من اسمك فوق نقش تختاره. ما نرفع صورتك لأي مكان.", "The first letter of your name over a pattern you pick. Your picture is never uploaded."))}</small></span></div>` +
      `<div class="mp-sw cols" role="group" aria-label="${esc(T("لون الصورة", "Picture colour"))}">${P.AV_COL.map((c, i) => `<button type="button" data-avc="${i}" style="--c:${c[1]}" aria-pressed="${i === av.c}" aria-label="${esc(T("لون", "Colour"))} ${i + 1}"></button>`).join("")}</div>` +
      `<div class="mp-sw" role="group" aria-label="${esc(T("نقش الصورة", "Picture pattern"))}">${P.MOTIFS.map((m, i) => `<button type="button" data-avm="${m}" aria-pressed="${m === av.m}" aria-label="${esc(T("نقش", "Pattern"))} ${i + 1}">${P.avatarSVG(av.c, m, nm)}</button>`).join("")}</div>`;
    if (F.theme) h += `<h3 class="mp-h">${esc(T("لون صفحتي", "Page colour"))}</h3><div class="mp-th" role="group" aria-label="${esc(T("لون صفحتي", "Page colour"))}">${Object.keys(P.THEMES).map((k) => { const t = P.THEMES[k]; return `<button type="button" data-th="${k}" aria-pressed="${k === tv}" style="--c-card:${t.L.card};--c-brand:${t.L.brand}"><span class="mini"><i class="b"></i><i></i><i style="width:60%"></i></span>${esc(T(t.ar, t.en))}${k === "paper" ? esc(T(" (الأصلي)", " (default)")) : ""}</button>`; }).join("")}</div>` +
      `<p class="mp-note">${esc(T("لصفحتي بس. المحاضرات والاختبارات تبقى بلون الموقع. الألوان كلها تباينها 4.5:1 أو أكثر بالفاتح والليلي.", "My page only. Lectures and quizzes keep the site colours. All colours have at least 4.5:1 contrast in light and dark."))}</p>`;
    if (F.layout) h += `<h3 class="mp-h">${esc(T("شنو يطلع بصفحتي", "What shows on my page"))}</h3><div role="group">` +
      `<div class="mp-row"><span>${esc(T("كمّل من وين وقفت", "Continue where you left off"))}<small>${esc(T("ثابت بالأول دائماً", "Always fixed at the top"))}</small></span>${ico("lock")}</div>` +
      SECS.filter((s) => s[0] !== "focus" || F.focus).filter((s) => s[0] !== "article" || F.article).map(([id, ar, en]) => `<div class="mp-row"><span id="mps-${id}">${esc(T(ar, en))}</span><button type="button" class="mp-tg" role="switch" data-sec="${id}" aria-checked="${id === "article" ? artTop() : shown(id)}" aria-labelledby="mps-${id}"><i></i></button></div>`).join("") + `</div>`;
    if (F.greet) h += `<h3 class="mp-h">${esc(T("خاطبني بـ", "Address me as"))}</h3><div class="chips-row" role="group" aria-label="${esc(T("خاطبني بـ", "Address me as"))}">${chip("call", "الاسم الأول", "First name", (cl.n || "first") === "first", "first")}${chip("call", "الاسم الأول والأب", "First two names", cl.n === "two", "two")}${chip("call", "بلا اسم", "No name", cl.n === "none", "none")}</div>` +
      `<div class="chips-row" role="group" aria-label="${esc(T("صيغة الخطاب", "Form of address"))}">${chip("g", "أنتَ (مذكر)", "Masculine", cl.g === "m", "m")}${chip("g", "أنتِ (مؤنث)", "Feminine", cl.g === "f", "f")}${chip("g", "بلا تحديد", "Neutral", !cl.g, "")}</div>`;
    if (F.export) { h += `<h3 class="mp-h">${esc(T("بياناتي", "My data"))}</h3><div class="chips-row"><button type="button" class="cbtn ghost" id="mp-exp">${ico("down")} ${esc(T("نزّل نسخة من بياناتي", "Download a copy of my data"))}</button>`;
      if (!signed() || F.wipe) h += `<button type="button" class="cbtn ghost mp-danger" id="mp-wipe" aria-expanded="false" aria-controls="mp-wz">${ico("trash")} ${esc(T("امسح بياناتي", "Delete my data"))}</button>`;
      h += `</div><div class="mpz" id="mp-wz" hidden><p class="mp-note">${esc(T("راح ننزّل نسخة أول، وبعدين نمسح ملاحظاتك ومهامك وتقدّمك وتفضيلاتك" + (signed() ? " من هالجهاز ومن حسابك" : " من هالجهاز") + ". ما ينرجع بعدها.", "We'll download a copy first, then delete your notes, tasks, progress and preferences" + (signed() ? " from this device and your account" : " from this device") + ". This can't be undone."))}</p>` +
        `<label for="mp-wt" class="mp-note">${esc(T("اكتب «امسح» للتأكيد", "Type “امسح” to confirm"))}</label><input id="mp-wt" class="tin" autocomplete="off" aria-describedby="mp-wm"><button type="button" class="cbtn mp-danger" id="mp-wgo" disabled>${esc(T("امسح كل شي", "Delete everything"))}</button></div>`;
      if (signed() && !F.wipe) h += `<p class="mp-note">${esc(T("لمسح بياناتك من الحساب راسلنا.", "To delete your account data, message us."))}</p>`;
      h += `<p class="mp-note" id="mp-wm" role="status" aria-live="polite"></p>`; }
    el.innerHTML = h; const b = $("b", el); if (b) b.textContent = nm || T("طالب", "Student");
  }

  // ── ☑️ مهامي ──
  const todos = () => (O.Notes ? O.Notes.all().filter((n) => n && n.kind === "todo") : []);
  let tab = "today", lastAdded = null; const PAGE = 30, pageN = { today: PAGE, evening: PAGE, later: PAGE };   // قائمة طويلة ← نعرض 30 ونزيد بزر
  const LIMIT_OPEN = 100, LIMIT_MSG = () => T("وصلت للحد (100). أنجز أو احذف مهمة.", "You've reached the limit (100). Finish or delete a task.");
  function cleanDone() { const N = O.Notes; if (!N) return; todos().filter((n) => n.done && n.doneAt && now() - n.doneAt > 14 * 864e5).forEach((n) => N.remove(n.id)); }
  function paintTasks() {
    const el = $("#mtasks"); if (!el || !F.tasks) return;
    const tk = todayKey(), all = todos(), open = all.filter((n) => !n.done), by = { today: [], evening: [], later: [] };
    all.forEach((n) => by[P.effSlot(n, tk)].push(n));
    const ord = (a, b) => (+!!a.done - +!!b.done) || String(a.due || "9").localeCompare(String(b.due || "9")) || String(a.time || "").localeCompare(String(b.time || "")) || a.t - b.t;
    Object.values(by).forEach((l) => l.sort(ord));
    const lab = { today: ["اليوم", "Today"], evening: ["المساء", "Evening"], later: ["لاحقاً", "Later"] };
    const keep = el.querySelector("[data-mtq]") ? el.querySelector("[data-mtq]").value : "";
    const html = `<div class="mtq"><input type="text" data-mtq maxlength="200" enterkeyhint="done" placeholder="${esc(T("أضف مهمة… مثل: «راجع الكسور باچر المسا»", "Add a task… e.g. “review fractures tomorrow evening”"))}" aria-label="${esc(T("أضف مهمة", "Add a task"))}" aria-describedby="mtu"><button type="button" data-mtadd aria-label="${esc(T("أضف", "Add"))}">${ico("plus")}</button></div>` +
      `<p class="mtu" id="mtu" role="status" aria-live="polite"></p>` +
      `<div class="mtabs" role="group" aria-label="${esc(T("مهامي", "My tasks"))}">${Object.keys(lab).map((k) => `<button type="button" class="chip2" data-mtab="${k}" aria-pressed="${tab === k}">${esc(T(lab[k][0], lab[k][1]))} · ${by[k].filter((n) => !n.done).length}</button>`).join("")}</div>` +
      `<div data-mtl>${by[tab].length ? by[tab].slice(0, pageN[tab]).map((n) => taskHTML(n, tk)).join("") + (by[tab].length > pageN[tab] ? `<button type="button" class="cbtn ghost" data-mtmore>${esc(T("اعرض المزيد", "Show more"))} (${by[tab].length - pageN[tab]})</button>` : "") : `<p class="mte">${esc(T(tab === "later" ? "ماكو مهام لاحقاً." : "ماكو مهام هنا. اكتب أول وحدة فوق.", tab === "later" ? "No later tasks." : "No tasks here. Type the first one above."))}</p>`}</div>`;
    if (el.__html === html) { if (lastAdded) { $("#mtu", el).textContent = lastAdded; lastAdded = null; } return; }   // نفس الرسم ← ما نبدّل الـ DOM (حتى ما يضيع ضغط الطالب بنص ما بين الضغط والرفع)
    el.__html = html; el.innerHTML = html;
    const inp = $("[data-mtq]", el); inp.value = keep; if (keep) $("#mtu", el).textContent = P.parseTask(keep).label.replace(/^فهمتها/, T("فهمتها", "Got it"));
    if (lastAdded) { $("#mtu", el).textContent = lastAdded; lastAdded = null; }
    if (open.length >= LIMIT_OPEN) $("#mtu", el).textContent = LIMIT_MSG();
  }
  function taskHTML(n, tk) {
    const d = n.due && n.due !== tk ? P.dueText(n.due, now(), EN()) : "", tm = P.timeText(n.time, EN()), meta = [d, tm].filter(Boolean).join(" · ");
    return `<div class="mtk${n.done ? " done" : ""}" data-mtid="${esc(n.id)}"><button type="button" class="ck" data-mtck aria-pressed="${!!n.done}" aria-label="${esc(T("خلصت: ", "Done: ") + n.text)}">${n.done ? "✓" : ""}</button><span><b>${esc(n.text)}</b>${meta ? `<small>${esc(meta)}</small>` : ""}</span><button type="button" class="del" data-mtdel aria-label="${esc(T("امسح: ", "Delete: ") + n.text)}">${ico("x")}</button></div>`;
  }
  function addTask(txt) {
    const N = O.Notes; if (!N) return false;
    if (todos().filter((n) => !n.done).length >= LIMIT_OPEN) return false;
    const p = P.parseTask(txt, now()); if (!p.text) return false;
    if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) p.time = null; if (p.due && !/^\d{4}-\d{2}-\d{2}$/.test(p.due)) p.due = null;
    const n = N.add({ text: p.text, kind: "todo", ix: O.ix }); if (!n) return false;
    N.update(n.id, (x) => { x.due = p.due; x.time = p.time; x.slot = p.slot; x.done = false; x.color = 0; x.tags = []; x.links = []; x.subject = null; });
    lastAdded = T("انضافت", "Added") + ": " + p.label.replace(/^[^:]*:\s*/, "");
    tab = P.effSlot({ due: p.due, time: p.time, slot: p.slot }, todayKey()); return true;
  }

  // ── ⏱️ المؤقت ──
  let focusIv = 0;
  const runGet = () => LS.get("t:me-focus-run", null);
  function focusLen() { const f = get("focus", null); return P.clampLen(f && f.len ? f.len : 25); }
  function paintFocus() {
    const el = $("#ptimer"); if (!el || !F.focus) return;
    let run = runGet(); const st = P.focusLeft(run), len = focusLen(); if (!st) run = null; const custom = ![15, 25, 50].includes(len);
    el.classList.add("mfocus", "mp");
    el.innerHTML = `<h3 class="mp-ph">${esc(T("مؤقت التركيز", "Focus timer"))}</h3><div class="mfl" role="group" aria-label="${esc(T("مدة الجلسة", "Session length"))}">${[25, 50, 15].map((m) => `<button type="button" class="chip2" data-flen="${m}" aria-pressed="${len === m}" ${run ? "disabled" : ""}>${m} ${esc(T("د", "min"))}</button>`).join("")}<button type="button" class="chip2" data-flen="x" aria-pressed="${custom}" ${run ? "disabled" : ""}>${esc(T("وقت ثاني", "Other"))}</button></div>` +
      `<div class="mfl" data-fcust ${custom && !run ? "" : "hidden"}><label for="mf-n" class="sub" style="margin:0">${esc(T("دقايق", "Minutes"))}</label><input id="mf-n" type="number" inputmode="numeric" min="1" max="180" value="${len}"></div>` +
      `<div class="mfc" data-fclock role="timer" aria-live="off">${P.clock(st ? st.left : len * 60)}</div><p class="mfs" data-fmsg role="status" aria-live="polite">${esc(st ? (st.paused ? T("متوقف مؤقتاً. كمّل وقت ما تريد.", "Paused. Resume whenever you like.") : T("ركّز، وإذا تعبت وقّف عادي.", "Focus. Stop anytime, no problem.")) : T("اختياري. ابدأ إذا تحب، وبلا صوت.", "Optional, silent. Start if you like."))}</p>` +
      `<div class="mfb">${!run ? `<button type="button" class="cbtn" data-fgo>${esc(T("ابدأ جلسة", "Start a session"))}</button>` : `<button type="button" class="cbtn" data-fpause>${esc(st && st.paused ? T("كمّل", "Resume") : T("وقّف شوية", "Pause"))}</button><button type="button" class="cbtn ghost" data-fstop>${esc(T("خلّصت", "Finish"))}</button>`}</div>`;
    clearInterval(focusIv); if (run && st && !st.paused) focusIv = setInterval(tickFocus, 500);
  }
  function tickFocus() {
    const run = runGet(), st = P.focusLeft(run), c = $("[data-fclock]"); if (!st) { clearInterval(focusIv); return; }
    if (c) c.textContent = P.clock(st.left);
    if (st.done) { clearInterval(focusIv); LS.del("t:me-focus-run"); paintFocus(); const m = $("[data-fmsg]"); if (m) m.textContent = T(`خلّصت جلسة ${run.len} دقيقة. استراحة قصيرة تستاهلها.`, `You finished a ${run.len}-minute session. You've earned a short break.`); }
  }

  // ── 📝 مقالتي ──
  let artDraft = null, artMode = "pick";
  const COLN = [["ورق", "Paper"], ["زيتون", "Olive"], ["خزامى", "Lavender"], ["طين", "Clay"]];
  function paintArticle() {
    const el = $("#particle-sec"); if (!el || !F.article) return;
    const cur = P.articleOf(get("article", null)); if (!artDraft) artDraft = cur ? Object.assign({}, get("article", {})) : { src: 1, shape: "paper", color: 0, top: false };
    const d = artDraft, prev = P.articleOf(d), opt = (a, ar, en, on, v) => `<button type="button" class="chip2" data-${a}="${esc(v)}" aria-pressed="${on}">${esc(T(ar, en))}</button>`;
    el.innerHTML = `<h3 class="mp-ph">${esc(T("مقالتي", "My article"))}</h3><div class="marte"><div class="mtabs chips-row" role="group" aria-label="${esc(T("مصدر المقالة", "Article source"))}">${opt("amode", "اختر من 10", "Pick one of 10", artMode === "pick", "pick")}${opt("amode", "اكتب", "Write", artMode === "write", "write")}${opt("amode", "الصق", "Paste", artMode === "paste", "paste")}</div>` +
      (artMode === "pick" ? `<div class="mpick" role="group">${P.ARTICLES.map((a, i) => `<button type="button" class="chip2" data-asrc="${i + 1}" aria-pressed="${d.src === i + 1}">${esc(a.title)}</button>`).join("")}</div>`
        : `<label for="ma-t" class="sub" style="margin:0">${esc(T("العنوان (اختياري، حتى 40 حرف)", "Title (optional, up to 40 chars)"))}</label><input id="ma-t" type="text" maxlength="40" data-atitle><label for="ma-x" class="sub" style="margin:6px 0 0">${esc(artMode === "paste" ? T("الصق النص هنا (نص عادي بس)", "Paste text here (plain text only)") : T("اكتب مقالتك (حتى 1200 حرف)", "Write your article (up to 1200 chars)"))}</label><textarea id="ma-x" maxlength="1200" data-atext dir="auto"></textarea><p class="mp-note" data-acount></p>`) +
      `<h3 class="mp-h" style="margin:10px 0 4px">${esc(T("الشكل", "Shape"))}</h3><div class="chips-row" role="group">${opt("ashape", "ورقة بسطور", "Ruled paper", d.shape !== "quote", "paper")}${opt("ashape", "بطاقة اقتباس", "Quote card", d.shape === "quote", "quote")}</div>` +
      `<h3 class="mp-h" style="margin:10px 0 4px">${esc(T("اللون", "Colour"))}</h3><div class="mp-cols" role="group">${COLN.map((c, i) => `<button type="button" data-acol="${i}" style="--c:${P.THEMES[["paper", "olive", "lavender", "clay"][i]].L.soft}" aria-pressed="${(d.color | 0) === i}" aria-label="${esc(T(c[0], c[1]))}"></button>`).join("")}</div>` +
      `<div class="mp-row"><span id="ma-top">${esc(T("اعرضها بأول صفحتي", "Show it at the top of my page"))}</span><button type="button" class="mp-tg" role="switch" data-atop aria-checked="${!!d.top}" aria-labelledby="ma-top"><i></i></button></div>` +
      `<div class="mp-prev" data-aprev>${prev ? P.articleHTML(prev) : `<p class="mp-note">${esc(T("المعاينة تطلع هنا.", "The preview appears here."))}</p>`}</div>` +
      `<div class="chips-row"><button type="button" class="cbtn" data-asave>${esc(T("احفظ مقالتي", "Save my article"))}</button>${cur ? `<button type="button" class="cbtn ghost" data-aclear>${esc(T("امسحها", "Remove it"))}</button>` : ""}</div><p class="mp-note" data-amsg role="status" aria-live="polite"></p></div>`;
    const ti = $("[data-atitle]", el), tx = $("[data-atext]", el); if (ti) ti.value = d.src === "own" ? d.title || "" : ""; if (tx) { tx.value = d.src === "own" ? d.text || "" : ""; cnt(); }
  }
  function cnt() { const tx = $("[data-atext]"), c = $("[data-acount]"); if (tx && c) c.textContent = `${tx.value.length} / ${P.LIM.text}`; }
  function artPreview() { const pv = $("[data-aprev]"), x = P.articleOf(artDraft); if (pv) pv.innerHTML = x ? P.articleHTML(x) : `<p class="mp-note">${esc(T("المعاينة تطلع هنا.", "The preview appears here."))}</p>`; }
  function paintArticleTop() { const el = $("#particle-top"); if (!el) return; const a = P.articleOf(get("article", null)); el.innerHTML = a ? P.articleHTML(a) : ""; applyLayout(); }

  // ── 📦 تصدير ومسح ──
  function download(name, text, type) { try { const u = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return true; } catch (e) { return false; } }
  function exportNow() {
    const j = P.exportJSON(), d = todayKey(), ok1 = download(`مساحتي-${d}.md`, P.exportMD(j, fullName()), "text/markdown;charset=utf-8"), ok2 = download(`مساحتي-${d}.json`, JSON.stringify(j, null, 1), "application/json");
    return ok1 && ok2;
  }
  async function wipeNow(msg) {
    const say = (s) => { msg.textContent = s; };
    if (!exportNow()) { say(T("ما گدرنا ننزّل النسخة، فما مسحنا شي.", "Couldn't download the copy, so nothing was deleted.")); return; }
    let at = now();
    const Y = window.Sync; if (signed() && Y && Y.pause) await Y.pause();   // نوقف المزامنة قبل ما نمسح (ماكو رفع بنص المسح)
    const back = () => { if (Y && Y.resume) Y.resume(); };
    if (signed()) {
      if (!F.wipe) { back(); say(T("لمسح بياناتك من الحساب راسلنا.", "To delete your account data, message us.")); return; }
      try {
        const C = window.STUDY_CLOUD || {}, tok = window.Account && window.Account.token && window.Account.token(); if (!tok || !C.url) throw new Error("auth");
        const r = await fetch(`${C.url}/rest/v1/rpc/student_wipe_mine`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: "{}" });
        const j = await r.json().catch(() => null); if (!r.ok || !j || j.ok !== true) throw new Error("rpc");
        const t = Date.parse(j.wiped_at); if (Number.isFinite(t)) at = t;
      } catch (e) { back(); say(T("ما گدرنا نمسح بالحساب هسه. ما انمسح شي، جرّب بعدين.", "Couldn't delete from your account right now. Nothing was deleted; try again later.")); return; }
    }
    const st = { keys: () => { try { return Object.keys(localStorage); } catch (e) { return []; } }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} }, set: (k, v) => LS.set(k, v) };
    P.wipeLocal(st, signed() ? at : 0);
    say(T("انمسحت بياناتك.", "Your data was deleted.")); setTimeout(() => location.reload(), 700);
  }

  // ── الأحداث ──
  function toggleCust(open) { const el = $("#mcust"), b = $("#mcb"); if (!el) return; el.hidden = open == null ? !el.hidden : !open; if (b) b.setAttribute("aria-expanded", String(!el.hidden)); if (!el.hidden) { paintCust(); const h = $("#mc-h"); if (h) h.focus({ preventScroll: true }); el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } }
  function onClick(ev) {
    const t = ev.target.closest("button"); if (!t) return;
    if (t.id === "mcb") { toggleCust(); return; }
    const inC = t.closest("#mcust"), inT = t.closest("#mtasks"), inF = t.closest("#ptimer"), inA = t.closest("#particle-sec");
    if (inC) {
      const d = t.dataset;
      if (d.avc != null) { put("avatar", Object.assign(avatarPref(), { c: +d.avc })); paintCust(); paintHi(); return; }
      if (d.avm) { put("avatar", Object.assign(avatarPref(), { m: d.avm })); paintCust(); paintHi(); return; }
      if (d.th) { put("theme", { v: d.th }); applyTheme(); paintCust(); return; }
      if (d.sec === "article") { const a = get("article", null); if (!a || !P.articleOf(a)) { toggleCust(false); const tb = $('[data-panel="particle-sec"]'); if (tb && tb.getAttribute("aria-expanded") !== "true") tb.click(); return; }
        const l = get("layout", null) || {}, h = Object.assign({}, l.h, { article: true }); put("layout", { h }); put("article", Object.assign({}, a, { top: !artTop() })); applyLayout(); paintCust(); paintArticleTop(); return; }
      if (d.sec) { const l = get("layout", null) || {}, h = Object.assign({}, l.h); h[d.sec] = !shown(d.sec); put("layout", { h }); applyLayout(); paintCust(); paintArticleTop(); return; }
      if (d.call) { put("call", Object.assign({}, get("call", null) || {}, { n: d.call })); paintCust(); paintHi(); return; }
      if (d.g != null) { put("call", Object.assign({}, get("call", null) || {}, { g: d.g })); paintCust(); paintHi(); return; }
      if (t.id === "mp-exp") { const m = $("#mp-wm"); m.textContent = exportNow() ? T("نزلت النسخة (ملف MD وملف JSON).", "Copy downloaded (an MD and a JSON file).") : T("ما گدرنا ننزّل.", "Couldn't download."); return; }
      if (t.id === "mp-wipe") { const z = $("#mp-wz"); z.hidden = !z.hidden; t.setAttribute("aria-expanded", String(!z.hidden)); if (!z.hidden) $("#mp-wt").focus(); return; }
      if (t.id === "mp-wgo") { t.disabled = true; wipeNow($("#mp-wm")).finally(() => { t.disabled = false; }); return; }
    }
    if (inT) {
      const row = t.closest("[data-mtid]"), N = O.Notes;
      if (t.hasAttribute("data-mtadd")) { const i = $("[data-mtq]"), v = i.value.trim(); if (!v) { i.focus(); return; } if (addTask(v)) { i.value = ""; paintTasks(); const ni = $("[data-mtq]"); ni.focus(); } else $("#mtu").textContent = todos().filter((n) => !n.done).length >= LIMIT_OPEN ? LIMIT_MSG() : T("ما گدرنا نضيف المهمة.", "Couldn't add the task."); return; }
      if (t.dataset.mtab) { tab = t.dataset.mtab; paintTasks(); return; }
      if (t.hasAttribute("data-mtmore")) { pageN[tab] += PAGE; paintTasks(); return; }
      if (row && t.hasAttribute("data-mtck")) { const id = row.dataset.mtid; N.update(id, (x) => { x.done = !x.done; x.doneAt = x.done ? now() : null; }); paintTasks(); const b = $(`[data-mtid="${CSS.escape(id)}"] [data-mtck]`); if (b) b.focus(); return; }
      if (row && t.hasAttribute("data-mtdel")) { const nx = row.nextElementSibling; N.remove(row.dataset.mtid); paintTasks(); const f = (nx && $(`[data-mtid="${CSS.escape(nx.dataset.mtid)}"] [data-mtdel]`)) || $("[data-mtq]"); if (f) f.focus(); return; }
    }
    if (inF) {
      const d = t.dataset;
      if (d.flen) { if (d.flen === "x") { const c = $("[data-fcust]"); c.hidden = false; $("#mf-n").focus(); $$("[data-flen]").forEach((x) => x.setAttribute("aria-pressed", x === t)); return; } put("focus", { len: +d.flen }); paintFocus(); return; }
      if (t.hasAttribute("data-fgo")) { const n = $("#mf-n"), len = !$("[data-fcust]").hidden && n ? P.clampLen(n.value) : focusLen(); put("focus", { len }); LS.set("t:me-focus-run", { end: now() + len * 60e3, len }); paintFocus(); return; }
      if (t.hasAttribute("data-fpause")) { const r = runGet(); if (!r) return; LS.set("t:me-focus-run", r.pausedLeft != null ? { end: now() + r.pausedLeft, len: r.len } : { pausedLeft: Math.max(0, r.end - now()), len: r.len }); paintFocus(); return; }
      if (t.hasAttribute("data-fstop")) { const r = runGet(); LS.del("t:me-focus-run"); paintFocus(); const m = $("[data-fmsg]"); if (m) m.textContent = T("عادي، تكمل وقت ثاني.", "That's fine. Continue another time."); return; }
    }
    if (inA) {
      const d = t.dataset;
      if (d.amode) { artMode = d.amode; if (artMode !== "pick" && artDraft.src !== "own") artDraft = Object.assign({}, artDraft, { src: "own", title: "", text: "" }); paintArticle(); return; }
      if (d.asrc) { artDraft = Object.assign({}, artDraft, { src: +d.asrc }); paintArticle(); return; }
      if (d.ashape) { artDraft.shape = d.ashape; paintArticle(); return; }
      if (d.acol != null) { artDraft.color = +d.acol; paintArticle(); return; }
      if (t.hasAttribute("data-atop")) { artDraft.top = !artDraft.top; paintArticle(); return; }
      if (t.hasAttribute("data-asave")) { const m = $("[data-amsg]"), x = P.articleOf(artDraft); if (!x) { m.textContent = T("اكتب نص أو اختر مقالة أول.", "Write some text or pick an article first."); return; }
        put("article", { src: x.src, title: x.src === "own" ? x.title : "", text: x.src === "own" ? x.text : "", shape: x.shape, color: x.color, top: !!artDraft.top }); artDraft = null; paintArticleTop(); paintArticle(); const mm = $("[data-amsg]"); if (mm) mm.textContent = T("انحفظت مقالتك.", "Your article was saved."); return; }
      if (t.hasAttribute("data-aclear")) { LS.del("t:me-article"); document.dispatchEvent(new CustomEvent("notes:change")); artDraft = null; paintArticleTop(); paintArticle(); return; }
    }
  }
  function onInput(ev) {
    const t = ev.target;
    if (t.matches("[data-mtq]")) { const v = t.value.trim(); $("#mtu").textContent = v ? P.parseTask(v, now()).label.replace(/^فهمتها/, T("فهمتها", "Got it")) : ""; return; }
    if (t.id === "mp-wt") { $("#mp-wgo").disabled = t.value.trim() !== "امسح"; return; }
    if (t.matches("[data-atitle], [data-atext]")) { artDraft = Object.assign({}, artDraft, { src: "own", title: ($("[data-atitle]") || {}).value || "", text: ($("[data-atext]") || {}).value || "" }); cnt(); artPreview(); return; }
    if (t.id === "mf-n") { const v = P.clampLen(t.value); put("focus", { len: v }); return; }
  }
  function onKey(ev) {
    if (ev.key === "Enter" && ev.target.matches("[data-mtq]")) { ev.preventDefault(); const b = $("[data-mtadd]"); b && b.click(); }
    if (ev.key === "Escape" && ev.target.closest("#mcust")) { toggleCust(false); const b = $("#mcb"); b && b.focus(); }
  }
  function onPaste(ev) {   // الصق = نص عادي بس (ما نخلي المتصفح يلصق HTML)
    const t = ev.target; if (!t.matches || !t.matches("[data-atext]")) return;
    const cd = ev.clipboardData; if (!cd) return; ev.preventDefault();
    const txt = P.cleanText(cd.getData("text/plain"), P.LIM.text);
    const s = t.selectionStart, e = t.selectionEnd; t.value = (t.value.slice(0, s) + txt + t.value.slice(e)).slice(0, P.LIM.text); t.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // ── الإقلاع ──
  function mountTiles() {
    const row = $(".mtools .big4"); if (!row || !F.article || $("[data-panel=\"particle-sec\"]", row)) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "big"; b.dataset.panel = "particle-sec"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", "particle-sec");
    b.innerHTML = `${ico("quote")}<b></b><small></small>`; $("b", b).textContent = T("مقالتي", "My article"); $("small", b).textContent = T("اكتب أو اختر", "Write or pick"); row.appendChild(b);
  }
  // (UX) «اليوم» و«مهامي» فوق «محاضراتي» مباشرة بعد «كمّل» (منفصلتين: plan.js يملك قائمة الخطة ويحسبها وحده، وما نخاطر بدمجها)
  function moveToday() {
    const mego = $("#mego-sec"), plan = $('section[aria-labelledby="h-plan"]'), tk = $("#mtasks-sec");
    if (!mego || !plan || plan.__moved) return; plan.__moved = true; mego.after(plan); if (tk) plan.after(tk);
  }
  // لوحات المؤقت ومقالتي تنفتح بشبكة الأدوات نفسها تحت صف زرها مباشرة (مو بعد كل البطاقات)
  function inlinePanels() {
    const row = $(".mtools .big4"); if (!row) return;
    ["ptimer", "particle-sec"].forEach((id) => { const pn = document.getElementById(id), tile = $(`[data-panel="${id}"]`, row); if (!pn || !tile || pn.__in) return; pn.__in = true; pn.classList.add("mp-inline"); tile.after(pn); });
  }
  // زر «اسأل» العائم يغطي معاينة المقالة ← يختفي وهي مفتوحة
  function watchFab() {
    const pa = $("#particle-sec"); if (!pa || pa.__w) return; pa.__w = true;
    const f = () => document.body.classList.toggle("mp-art-open", !pa.hidden);
    new MutationObserver(f).observe(pa, { attributes: true, attributeFilter: ["hidden"] }); f();
  }
  function build() {
    safe(css); safe(applyTheme);
    const pa = $("#particle-sec"); if (pa) pa.classList.add("mp");
    const mt = $("#mtasks-sec"); if (mt && F.tasks) { mt.hidden = false; mt.classList.add("mtasks", "mp"); safe(cleanDone); safe(paintTasks); }
    const cu = $("#mcust"); if (cu) cu.classList.add("mcust", "mp");
    const hi = $("#mhi"); if (hi) hi.classList.add("mp");
    if (F.greet || F.avatar) safe(paintHi);
    if (F.focus) safe(paintFocus);
    safe(mountTiles); if (F.article) { safe(paintArticle); safe(paintArticleTop); }
    safe(moveToday); safe(mountTiles); safe(inlinePanels); safe(watchFab); safe(applyLayout);
    if (!build.done) {
      build.done = true;
      document.addEventListener("click", onClick); document.addEventListener("input", onInput); document.addEventListener("keydown", onKey); document.addEventListener("paste", onPaste, true);
      ["plan:change", "track:change", "sync:applied"].forEach((e) => document.addEventListener(e, () => { setTimeout(() => safe(() => { paintHi(); if (F.tasks && e === "sync:applied" && !$("#mtasks :focus")) paintTasks(); applyTheme(); applyLayout(); paintArticleTop(); if (!$("#mcust").hidden && !$("#mcust :focus")) paintCust(); }), 0); }));
      document.addEventListener("notes:change", () => { if (F.tasks) setTimeout(() => { if (!$("#mtasks :focus")) paintTasks(); }, 0); });
      if (window.Account && window.Account.on) window.Account.on(() => { paintHi(); });
      let lastLang = document.documentElement.lang;
      new MutationObserver(() => { if (document.documentElement.lang === lastLang) return; lastLang = document.documentElement.lang;   // lang.js يعيد كتابة السمة بنفس القيمة ← بلا هالفحص نلف بحلقة
        paintHi(); if (F.tasks && !$("[data-mtq]:focus")) paintTasks(); paintFocus(); mountTiles(); if (F.article) paintArticle(); if (!$("#mcust").hidden) paintCust(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
  }
  function init(o) {
    if (inited) return; inited = true; O = o || {};
    let seen = LS.get("t:me-seen", null); if (!(seen && typeof seen === "object" && typeof seen.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(seen.d))) seen = null; firstVisit = !seen; gap = seen ? Math.max(0, Math.round((new Date(todayKey()) - new Date(seen.d)) / 864e5)) : 0;
    // المفتاح: ننتظر الإعدادات بحدث «study:settings» من cloud.js (مو عدّاد زمني)؛ إذا ما وصلت أبداً الصفحة تبقى مثل الأساس بلا خطأ
    let settled = false;
    const go = () => { settled = true; F = readFlags(); try { localStorage.setItem("t:me-on", F.on ? "1" : "0"); } catch (e) {}
      if (F.on) { document.body.classList.add("mp-on"); build(); window.__myplusReady = true; saveHeights(); requestAnimationFrame(() => { const r = document.documentElement; r.classList.remove("mp-pre", "mp-pre-art"); }); } else undoPre(); };
    const ov = localhost() && LS.get("t:me-plus-flags", null);
    setTimeout(() => { if (!settled) undoPre(); }, 8000);   // الإعدادات ما وصلت (شبكة ضعيفة/ما راح توصل) ← نشيل الحجز والصفحة تبقى مثل الأساس؛ إذا وصلت بعدين الميزة تشتغل عادي
    // الحدث إشارة بس: ما ننسخ منه شي (e.detail يتجاهل كلياً)؛ cloud.js يكتب STUDY_SETTINGS قبل الإرسال، وإذا لسه فارغة نعيد القراءة 5 مرات قصيرة ونكمّل نسمع
    if (window.STUDY_SETTINGS !== undefined || ov) { go(); return; }
    let tries = 0;
    const onEvt = () => { if (settled) return; const t = () => { if (window.STUDY_SETTINGS !== undefined) { document.removeEventListener("study:settings", onEvt); go(); } else if (++tries < 5) setTimeout(t, 200); else tries = 0; }; t(); };
    document.addEventListener("study:settings", onEvt);
  }
  // CLS: ارتفاعات آخر مرة تنحفظ، وصفحة preview_me.py تحجز بيها المكان قبل الرسم (t:me-on / t:me-h)
  function saveHeights() {
    const m = () => { const g = (s) => { const e = $(s); return e && !e.hidden ? Math.round(e.getBoundingClientRect().height) : 0; };
      const h = { hi: Math.min(g("#mhi"), 1500), tk: Math.min(g("#mtasks-sec"), 1500), art: Math.min(g("#particle-top"), 1500), pl: Math.min(g('section[aria-labelledby="h-plan"]'), 1500) }; try { localStorage.setItem("t:me-h", JSON.stringify(h)); } catch (e) {} };
    requestAnimationFrame(() => { m(); setTimeout(m, 1500); });
  }
  // كانت شغّالة (حجز مكان) وطلعت مطفية: نرجّع ترتيب الأصل وبطاقة التحية القديمة
  function undoPre() {
    const R0 = document.documentElement; if (!R0.classList.contains("mp-pre") && !R0.classList.contains("mp-fl")) return; R0.classList.remove("mp-pre", "mp-fl", "mp-pre-art");
    const hi = $("#mhi"), tk = $("#mtasks-sec"), old = $(".hi2"), plan = $('section[aria-labelledby="h-plan"]'), sub = $('section[aria-labelledby="h-my"]'), ta = $("#particle-top");
    if (hi) { hi.hidden = true; hi.style.minHeight = ""; } if (tk) { tk.hidden = true; tk.style.minHeight = ""; } if (ta) { ta.hidden = true; ta.style.minHeight = ""; } if (old) old.hidden = false; if (plan && sub) sub.after(plan);
  }
  // بعد ما تتحمّل بيانات المحاضرات: نكمّل الأجزاء اللي تحتاجها (فهرس الملاحظات، اسم المادة، الامتحان) وأزرار الأدوات اللي تنبني بعدها
  function update(o) { Object.assign(O, o || {}); if (!F.on) return; safe(paintHi); safe(mountTiles); safe(inlinePanels); safe(watchFab); safe(applyLayout); saveHeights(); }
  window.MyPlusUI = { init, update, get flags() { return F; } };
})();
