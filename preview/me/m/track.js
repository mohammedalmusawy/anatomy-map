// 📈 تقدّمي — تتبّع خفيف (29/10/2026 — نايم: ما ينحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// يسجّل بس اللي يفيد الطالب نفسه، بجهازه (localStorage «t:track»)، وما ينرسل لأي مكان:
//  · الأقسام اللي فتحها (ظهرت قدامه 3 ثواني، أو فتح القسم) · الجمل اللي سمعها (يراقب .ls.on من listen.js بدون أي تعديل عليه)
//  · الاختبارات اللي خلصها (حدث quiz:finish الموجود) · الحالات اللي شافها بالأطلس (ظهرت ثانيتين ونص)
//  · مراجعات المصطلحات (أزرار «عرفته/ما عرفته») · الغلط اللي تصلّح · الوقت الحقيقي: بس والصفحة ظاهرة وهو متفاعل خلال آخر 60 ثانية (أو يسمع)
//  · «➕ درست برّه الموقع» (النوع، الموضوع، الدقائق) ينحسب ويّا تقدّمه.
// المجاميع (Track.summarize) دوال صافية تشتغل بـ node للاختبارات (tests/track.test.js). Track.export()/import() جاهزة للمزامنة بعدين.
(function (root, factory) {
  const T = factory();
  if (typeof module === "object" && module.exports) module.exports = T; else root.Track = T;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:track";
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const KEEP_DAYS = 120, KEEP_LOG = 300;
  const OUT_TYPES = ["📗 كتاب", "🏫 محاضرة الكلية", "🏥 مستشفى/تدريب", "🩻 صور أشعة", "✏️ غيره"];

  // «محاضرة وحدة / محاضرتين / 3 محاضرات / 11 محاضرة»
  const arCount = (n, one = "محاضرة", two = "محاضرتين", many = "محاضرات") =>
    n === 1 ? `${one} وحدة` : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${many}` : `${n} ${one}`;

  const empty = () => ({ v: 1, days: {}, lec: {}, atlas: {}, quiz: [], fixed: 0, outside: [] });
  const day = (st, d = dayKey()) => (st.days[d] = st.days[d] || { s: 0, lec: {}, terms: 0, cases: [], quizzes: [], mistakes: 0 });
  // نقلّم القديم حتى التخزين يبقى صغير
  function prune(st, today = dayKey()) {
    const cut = addDays(today, -KEEP_DAYS);
    for (const d in st.days) if (d < cut) delete st.days[d];
    if (st.quiz.length > KEEP_LOG) st.quiz = st.quiz.slice(-KEEP_LOG);
    if (st.outside.length > KEEP_LOG) st.outside = st.outside.slice(-KEEP_LOG);
    return st;
  }

  // ── التسجيل (دوال صافية على st، حتى تنفحص بـ node) ──
  const rec = {
    open(st, id, sec, nsec, d = dayKey()) {
      const L = (st.lec[id] = st.lec[id] || { open: {}, heard: {}, tot: {}, nsec: 0 });
      if (nsec) L.nsec = Math.max(L.nsec || 0, nsec);
      if (!L.open[sec]) L.open[sec] = d;
    },
    heard(st, id, sec, idx, total) {
      const L = (st.lec[id] = st.lec[id] || { open: {}, heard: {}, tot: {}, nsec: 0 });
      if (total) L.tot[sec] = total;
      const h = (L.heard[sec] = L.heard[sec] || []);
      if (!h.includes(idx)) h.push(idx);
    },
    time(st, secs, id, d = dayKey()) { const D = day(st, d); D.s += secs; if (id) D.lec[id] = (D.lec[id] || 0) + secs; },
    quiz(st, url, ok, n, t = Date.now()) {
      const pct = n ? Math.round((ok / n) * 100) : 0;
      st.quiz.push({ u: url, p: pct, t });
      const D = day(st, dayKey(new Date(t)));
      if (!D.quizzes.includes(url)) D.quizzes.push(url);
      if (/^quiz\/mistakes\//.test(url)) D.mistakes += 1;
    },
    caseSeen(st, region, slug, d = dayKey()) {
      const A = (st.atlas[region] = st.atlas[region] || {});
      if (!A[slug]) A[slug] = d;
      const D = day(st, d), k = region + "#" + slug;
      if (!D.cases.includes(k)) D.cases.push(k);
    },
    term(st, d = dayKey()) { day(st, d).terms += 1; },
    fixed(st, d = dayKey()) { st.fixed += 1; day(st, d).mistakes += 1; },
    outside(st, x, t = Date.now()) {
      const min = Math.max(1, Math.min(600, Math.round(+x.min || 0)));
      const e = { id: t.toString(36), t, d: dayKey(new Date(t)), type: String(x.type || "✏️ غيره").slice(0, 40), topic: String(x.topic || "").slice(0, 120), subject: x.subject || null, min };
      st.outside.push(e);
      return e;
    },
  };

  // ── حقائق يوم واحد (لـ ✅ التلقائي بالخطة) ──
  function facts(st, d = dayKey(), progress = {}) {
    const D = st.days[d] || { lec: {}, terms: 0, cases: [], quizzes: [], mistakes: 0 };
    const quizzes = new Set(D.quizzes || []);
    for (const u in progress) if (progress[u] && progress[u].t && dayKey(new Date(progress[u].t)) === d) quizzes.add(u);   // من tools.js (t:progress)
    const read = {}, listen = {};
    for (const id in st.lec) { const r = ratios(st.lec[id]); read[id] = r.open; listen[id] = r.heard; }
    return { quizzes: [...quizzes], read, listen, terms: D.terms || 0, cases: (D.cases || []).length, mistakes: D.mistakes || 0, min: Math.round((D.s || 0) / 60) };
  }
  function ratios(L) {
    if (!L) return { open: 0, heard: 0, hasAudio: false };
    const open = L.nsec ? Math.min(1, Object.keys(L.open || {}).length / L.nsec) : 0;
    let h = 0, tot = 0;
    for (const s in L.tot || {}) { tot += L.tot[s]; h += Math.min(L.tot[s], ((L.heard || {})[s] || []).length); }
    return { open, heard: tot ? h / tot : 0, hasAudio: tot > 0 };
  }

  // ── 🔥 السلسلة: أيام نشطة ورا بعض (5 دقايق أو اختبار أو دراسة برّه). يوم الراحة بالخطة ما يكسرها. اليوم لسه ما خلص ← نبدأ من أمس ──
  function activeDays(st) {
    const a = new Set();
    for (const d in st.days) { const D = st.days[d]; if ((D.s || 0) >= 300 || (D.quizzes || []).length || (D.terms || 0) >= 5) a.add(d); }
    st.outside.forEach((x) => a.add(x.d));
    return a;
  }
  function streak(st, today = dayKey(), rest = new Set()) {
    const a = activeDays(st);
    let d = a.has(today) ? today : addDays(today, -1), n = 0;
    for (let i = 0; i < 366; i++, d = addDays(d, -1)) {
      if (a.has(d)) n++;
      else if (!rest.has(d)) break;
    }
    return n;
  }

  // ── المجاميع لـ «📈 تقدّمي» ──
  // o = { catalog (Plan.catalog), atlas:[{key:"xray/chest", name, total}], progress (t:progress), srs (t:srs), today, rest:Set }
  function summarize(st, o = {}) {
    const today = o.today || dayKey(), progress = o.progress || {}, cat = o.catalog || [];
    const lectures = cat.map((l) => {
      const r = ratios(st.lec[l.id]), q = progress[l.quiz] ? 1 : 0;
      const audio = r.hasAudio || +l.minutes > 0;
      const pct = Math.round((audio ? 0.4 * r.open + 0.3 * r.heard + 0.3 * q : 0.5 * r.open + 0.5 * q) * 100);
      return { id: l.id, subject: l.subject, title: l.title, open: r.open, heard: r.heard, quiz: !!q, best: q ? progress[l.quiz].best : null, pct, done: pct >= 80 };
    });
    const subjects = [];
    new Map(cat.map((l) => [l.subject, l.subject_ar])).forEach((name, s) => {
      const ls = lectures.filter((x) => x.subject === s), done = ls.filter((x) => x.done).length, left = ls.length - done;
      const outMin = st.outside.filter((x) => x.subject === s).reduce((a, x) => a + x.min, 0);
      subjects.push({ subject: s, name, total: ls.length, done, left, outMin,
        pct: ls.length ? Math.round(ls.reduce((a, x) => a + x.pct, 0) / ls.length) : 0,
        text: left ? `باقي لك ${arCount(left)} بـ ${name}` : `خلصت ${name} 👏` });
    });
    const atlas = (o.atlas || []).map((r) => {
      const seen = Object.keys(st.atlas[r.key] || {}).length;
      return { key: r.key, name: r.name, dev: r.dev || r.key.split("/")[0], seen: Math.min(seen, r.total), total: r.total, text: `${r.name} ${Math.min(seen, r.total)}/${r.total}` };
    });
    const srs = Object.values(o.srs || {});
    const terms = { reviewed: srs.length, saved: srs.filter((x) => (x.box || 0) >= 3).length, week: 0 };
    // الاختبارات: المعدل = آخر محاولة لكل اختبار؛ التحسّن = (آخر − أول) للي عادها مرتين أو أكثر
    const by = {};
    st.quiz.forEach((x) => { (by[x.u] = by[x.u] || []).push(x.p); });
    for (const u in progress) if (!by[u] && progress[u] && progress[u].last != null) by[u] = [progress[u].last];
    const lastP = Object.values(by).map((a) => a[a.length - 1]);
    const twice = Object.values(by).filter((a) => a.length >= 2);
    const quiz = { count: lastP.length, avg: lastP.length ? Math.round(lastP.reduce((a, b) => a + b, 0) / lastP.length) : null,
      up: twice.length ? Math.round(twice.reduce((a, x) => a + (x[x.length - 1] - x[0]), 0) / twice.length) : null };
    // الأسبوع: آخر 7 أيام (اليوم آخرها) — وقت الموقع + اللي درسه برّه
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6), D = st.days[d] || {};
      const out = st.outside.filter((x) => x.d === d).reduce((a, x) => a + x.min, 0);
      terms.week += D.terms || 0;
      return { date: d, label: DAYS[parse(d).getDay()], min: Math.round((D.s || 0) / 60) + out, today: d === today };
    });
    const weekMin = week.reduce((a, x) => a + x.min, 0);
    return { lectures, subjects, atlas, terms, quiz, fixed: st.fixed || 0, week, weekMin, streak: streak(st, today, o.rest || new Set()),
      outside: st.outside.slice(-20).reverse(), outsideMin: st.outside.reduce((a, x) => a + x.min, 0) };
  }
  const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} س${m % 60 ? ` ${m % 60} د` : ""}` : `${m} د`);

  // ── العرض (نفس كلاسات المعاينة: .bars .br .pbar .stat3 .wk .wkl) ──
  function renderProgress(el, S) {
    const bar = (lab, right, pct) => `<div class="br"><span>${esc(lab)}</span><span class="pct">${esc(right)}</span><span class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(lab)}"><i style="width:${pct}%"></i></span></div>`;
    const mx = Math.max(30, ...S.week.map((x) => x.min));
    const devName = { xray: "🩻 الأشعة السينية", ct: "🌀 المفراس", mri: "🧲 الرنين", ultrasound: "🔊 السونار" };
    const groups = {};
    S.atlas.forEach((a) => { (groups[a.dev] = groups[a.dev] || []).push(a); });
    el.innerHTML = `<div class="stat3"><div><b>🔥 ${S.streak}</b><small>${S.streak === 1 ? "يوم" : "أيام"} ورا بعض</small></div>` +
      `<div><b>${S.quiz.avg == null ? "—" : S.quiz.avg + "%"}</b><small>معدل الاختبارات${S.quiz.up ? ` · ${S.quiz.up > 0 ? "↑" : "↓"} ${Math.abs(S.quiz.up)}%` : ""}</small></div>` +
      `<div><b>${S.fixed}</b><small>غلط تصلّح</small></div></div>` +
      `<h2>المحاضرات</h2><div class="bars">${S.subjects.map((s) => bar(s.name, `${s.done}/${s.total} · ${s.left ? `باقي ${s.left}` : "✓"}`, s.pct)).join("")}</div>` +
      `<p class="sub">${esc(S.subjects.filter((s) => s.left).map((s) => s.text).slice(0, 2).join(" · ") || "خلصت كل المحاضرات 👏")}. النسبة من الأقسام اللي فتحتها وسمعتها واختبرتها.</p>` +
      Object.entries(groups).map(([dv, rs]) => `<h2>${esc(devName[dv] || dv)}</h2><div class="bars">${rs.filter((r) => r.total).map((r) => bar(r.name, `${r.seen}/${r.total}`, Math.round((r.seen / r.total) * 100))).join("")}</div>`).join("") +
      `<div class="stat3"><div><b>${S.terms.saved}</b><small>مصطلح محفوظ</small></div><div><b>${S.terms.reviewed}</b><small>مصطلح راجعته</small></div><div><b>${S.quiz.count}</b><small>اختبار خلصته</small></div></div>` +
      `<h2>وقت الدراسة هالأسبوع · ${hm(S.weekMin)}</h2>` +
      `<div class="wk" role="img" aria-label="وقت الدراسة آخر 7 أيام: ${esc(S.week.map((x) => `${x.label} ${x.min} دقيقة`).join("، "))}">${S.week.map((x) => `<i style="height:${Math.max(x.min ? 4 : 0, Math.round((x.min / mx) * 100))}%"${x.today ? ' class="today"' : ""}></i>`).join("")}</div>` +
      `<div class="wkl" aria-hidden="true">${S.week.map((x) => `<span>${x.label}</span>`).join("")}</div>`;
  }
  // ➕ درست برّه الموقع: o = { subjects:[[key,name]], onAdd(entry) }
  function renderOutside(el, o = {}) {
    const sel = { type: "", subject: null, min: 0 };
    const chip = (k, v, l) => `<button type="button" class="chip2" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${esc(l)}</button>`;
    el.innerHTML = `<details class="sheet"><summary>➕ درست برّه الموقع</summary>
      <p class="sub" id="ob-t">شنو؟</p><div class="chips-row" role="group" aria-labelledby="ob-t">${OUT_TYPES.map((t) => chip("type", t, t)).join("")}</div>
      <p class="sub" id="ob-s">المادة (اختياري)</p><div class="chips-row" role="group" aria-labelledby="ob-s">${(o.subjects || []).map(([k, n]) => chip("subject", k, n)).join("")}</div>
      <div class="row-in"><input data-voice data-ob-topic maxlength="120" placeholder="الموضوع (اختياري)" aria-label="الموضوع"></div>
      <p class="sub" id="ob-m">كم دقيقة؟</p><div class="chips-row" role="group" aria-labelledby="ob-m">${[[15, "15د"], [30, "30د"], [60, "ساعة"], [120, "ساعتين"]].map(([m, l]) => chip("min", m, l)).join("")}</div>
      <button type="button" class="cbtn" data-ob-add>احسبها بتقدّمي</button><p class="sub" data-ob-msg aria-live="polite"></p></details>`;
    el.addEventListener("click", (ev) => {
      const c = ev.target.closest(".chip2[data-k]");
      if (c) {
        const k = c.dataset.k, v = k === "min" ? +c.dataset.v : c.dataset.v;
        sel[k] = sel[k] === v && k !== "min" ? (k === "subject" ? null : "") : v;
        c.parentElement.querySelectorAll(".chip2").forEach((x) => x.setAttribute("aria-pressed", String(k === "min" ? +x.dataset.v : x.dataset.v) === String(sel[k])));
        return;
      }
      if (!ev.target.closest("[data-ob-add]")) return;
      const msg = el.querySelector("[data-ob-msg]");
      if (!sel.min) { msg.textContent = "اختار كم دقيقة درست."; return; }
      const e = add({ type: sel.type || "✏️ غيره", subject: sel.subject, topic: el.querySelector("[data-ob-topic]").value.trim(), min: sel.min });
      msg.textContent = `✓ انحسبت ${hm(e.min)}. عاشت إيدك!`;
      el.querySelector("[data-ob-topic]").value = "";
      if (o.onAdd) o.onAdd(e);
    });
  }

  // ── التخزين + الواجهة العامة ──
  const load = () => { const s = LS.get(KEY, null); return s && s.v === 1 ? Object.assign(empty(), s) : empty(); };
  let ST = null;
  const st = () => (ST = ST || load());
  const flush = () => { if (ST) LS.set(KEY, prune(ST)); };
  const add = (x) => { const e = rec.outside(st(), x); flush(); emit(); return e; };
  const emit = () => { if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("track:change")); };

  // ── المراقبة بالمتصفح (تشتغل بس إذا الصفحة طلبتها: Track.start()) ──
  function start(opts = {}) {
    if (typeof document === "undefined" || start.on) return; start.on = true;
    const man = document.querySelector('link[rel="manifest"]');
    const base = man ? new URL(".", man.href).href : location.origin + "/";
    const rel = location.href.split(/[?#]/)[0].replace(base, "").replace(/index\.html$/, "").replace(/^preview\//, "");
    const lm = rel.match(/^learn\/([^/]+)\/(theory|practical)\/(\d+)\/$/);
    let lecId = lm ? `${lm[1]}/${lm[2]}/${lm[3]}` : null;
    if (!lecId && document.body.dataset.lecture) try { const m = JSON.parse(document.body.dataset.lecture).url.match(/learn\/([^/]+)\/(theory|practical)\/(\d+)\//); if (m) lecId = `${m[1]}/${m[2]}/${m[3]}`; } catch (e) {}
    const am = rel.match(/^devices\/([^/]+)\/cases\/([^/]+)\/$/);
    const region = am ? `${am[1]}/${am[2]}` : null;

    // ⏱️ الوقت الحقيقي: كل 5 ثواني، بس إذا الصفحة ظاهرة وآخر تفاعل خلال 60 ثانية (أو صوت المحاضرة شغّال)
    let lastAct = Date.now(), lastSave = Date.now();
    const act = () => { lastAct = Date.now(); };
    ["pointerdown", "keydown", "scroll", "touchstart", "wheel"].forEach((e) => addEventListener(e, act, { passive: true, capture: true }));
    let mm = 0; addEventListener("mousemove", () => { const n = Date.now(); if (n - mm > 5000) { mm = n; act(); } }, { passive: true });
    setInterval(() => {
      const listening = !!document.querySelector(".listen .ls.on");
      if (document.visibilityState !== "visible" || (Date.now() - lastAct > 60e3 && !listening)) return;
      rec.time(st(), 5, lecId);
      if (Date.now() - lastSave > 30e3) { lastSave = Date.now(); flush(); }
    }, 5000);
    const bye = () => flush();
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") bye(); });
    addEventListener("pagehide", bye);

    // 📖 الأقسام: تنعد إذا ظهرت 3 ثواني (35% منها أو من الشاشة) أو انفتحت
    if (lecId) {
      const secs = [...document.querySelectorAll(".lsec[id], section[id^='r-s']")];
      const key = (el) => el.id.replace(/^r-/, "");
      const nsec = new Set(secs.map(key)).size;
      const timers = new Map();
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          const vis = e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= innerHeight * 0.35);
          if (vis && !timers.has(e.target)) timers.set(e.target, setTimeout(() => { if (document.visibilityState === "visible") { rec.open(st(), lecId, key(e.target), nsec); flush(); emit(); } }, 3000));
          else if (!vis && timers.has(e.target)) { clearTimeout(timers.get(e.target)); timers.delete(e.target); }
        }), { threshold: [0, 0.35, 0.6] });
        secs.forEach((s) => io.observe(s));
      }
      document.addEventListener("toggle", (ev) => { const d = ev.target; if (d.open && d.matches && d.matches(".lsec[id]")) { rec.open(st(), lecId, key(d), nsec); flush(); } }, true);
      // 🎧 السمع: listen.js يحط .on على الجملة اللي تنقرا — نراقب الكلاس بس (ما نلمس listen.js)
      const box = document.querySelector(".listen");
      if (box && "MutationObserver" in window) new MutationObserver((ms) => ms.forEach((m) => {
        const el = m.target;
        if (!el.classList || !el.classList.contains("ls") || !el.classList.contains("on")) return;
        const sec = el.closest(".lsec"); if (!sec) return;
        const all = [...sec.querySelectorAll(".ls")];
        rec.heard(st(), lecId, key(sec), all.indexOf(el), all.length); act();
      })).observe(box, { subtree: true, attributes: true, attributeFilter: ["class"] });
    }

    // 🩻 الأطلس: حالة تنعد إذا ظهرت ثانيتين ونص
    if (region && "IntersectionObserver" in window) {
      const tm = new Map();
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (!tm.has(e.target)) tm.set(e.target, setTimeout(() => { rec.caseSeen(st(), region, e.target.id.replace(/^c-/, "")); flush(); emit(); }, 2500)); }
        else if (tm.has(e.target)) { clearTimeout(tm.get(e.target)); tm.delete(e.target); }
      }), { threshold: [0, 0.5] });
      document.querySelectorAll("article.case[id]").forEach((a) => io.observe(a));
    }

    // 📝 الاختبارات + 📕 الغلط اللي تصلّح (tools.js يشيل السؤال بعد صح مرتين — نقارن قبل/بعد)
    const mk = () => { try { return new Set(Object.keys(JSON.parse(localStorage.getItem("t:mistakes") || "{}"))); } catch (e) { return new Set(); } };
    let known = mk();
    document.addEventListener("quiz:answer", (ev) => {
      const q = ev.detail && ev.detail.q, k = q && (q.q_en || "").slice(0, 120);
      setTimeout(() => { const now = mk(); if (ev.detail.ok && k && known.has(k) && !now.has(k)) { rec.fixed(st()); flush(); emit(); } known = now; }, 0);
    });
    document.addEventListener("quiz:finish", (ev) => {
      const d = ev.detail || {}; const u = /^quiz\/(mistakes\/|[^/]+\/[^/]+\/\d+\/)$/.test(rel) ? rel : null;
      if (u && d.n) { rec.quiz(st(), u, d.ok, d.n); flush(); emit(); }
    });
    // 🔁 مراجعة المصطلحات (أزرار tools.js «عرفته / ما عرفته»)
    document.addEventListener("click", (ev) => { if (ev.target.closest && ev.target.closest("#review-box [data-k]")) { rec.term(st()); flush(); } }, true);
    if (opts.debug) window.__track = st;
  }

  return { KEY, OUT_TYPES, dayKey, addDays, arCount, empty, rec, prune, facts, ratios, streak, summarize, hm,
    renderProgress, renderOutside, start, load, add,
    state: st, save: flush,
    facts_today: (progress) => facts(st(), dayKey(), progress),
    export: () => ({ track: st() }),
    import: (d) => { if (d && d.track && d.track.v === 1) { ST = Object.assign(empty(), d.track); flush(); emit(); return true; } return false; } };
});
