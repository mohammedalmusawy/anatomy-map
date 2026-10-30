// 🧠 تعلّم شخصي من كود الطالب (مسودة 30/10/2026، المرحلة 52 — بس بـ «صفحتي»؛ ما ينرفع لحد «وافقت»).
// كلشي بجهاز الطالب (localStorage «t:learn»)، ويتزامن بس ويّا حسابه هو (sync.js، النوع «learn»، والإدارة ما تقراه — هجرة 000052).
//  · 🧠 أخطائي المتكررة: tools.js يحفظ الغلط بيومه («m:<السؤال>» أو «m:term:<المصطلح>»، مرة وحدة باليوم لكل سؤال)؛ هنا نجمعها حسب المفهوم
//    (خريطة learn_map.py: السؤال ← المحاضرة + القسم + المفهوم، بمفتاح السؤال) ← «غلطت بيه 3 مرات، نراجعه دقيقتين؟» (3 مرات = 3 مناسبات مختلفة).
//    المراجعة القصيرة = بطاقة المصطلح (المعنى + اللفظ + الصوت) + أسئلته وحدة وحدة + رابط القسم. تنحسب «راجعه» بس إذا صح 2 من 3.
//  · 🌱 المادة الصعبة: من السلوك (وقت كل مادة آخر 14 يوم مقابل «الامتحان القادم») + سؤال اختياري مرة وحدة (خطوتين بنفس البطاقة).
//    اختياره ينتهي بعد 30 يوم أو لما يتقدّم بيها (60%)، و«غيّر» يعيد السؤال. التشجيع خطوات صغيرة («5 دقايق بس اليوم») وبلا لوم أبداً.
//  · ⭐ الملاحظات المهمة (نفس حقل pin بـ notes.js): الجدول يبدأ من أول مرة نشوفها (+1، +3، +7، +14، +30 يوم) — القديمة ما تطلع كلها سوا —
//    وقبل الامتحان (3 أيام)، و«مو هسه» هناك لباچر الصبح بالكثير (ولا بعد الامتحان).
//  · بطاقة اقتراح وحدة بس بالمرة (pick)، وكل شي ≤ 3 ضغطات.
// الدوال الصافية تشتغل بـ node (tests/learn.test.js).
(function (root, factory) {
  const T = factory();
  if (typeof module === "object" && module.exports) module.exports = T; else root.Learn = T;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:learn", DAY = 864e5;
  const GAP = [1, 3, 7, 14, 30];          // ⭐ ترجع بعد هالأيام
  const MIN_MISS = 3, MISS_DAYS = 60, KEEP_TD = 7, EXAM_STARS = 3, SAID_DAYS = 30, SAID_DONE = 60, PASS = 2;
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / DAY);   // أيام من a إلى b
  const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "x";
  const qkey = (q) => String((q && q.q_en) || "").slice(0, 120);   // نفس مفتاح tools.js
  const subjOf = (lec) => String(lec || "").split("/")[0];
  const dayOf = (t) => dayKey(new Date(t));
  const arDays = (n) => (n = Math.abs(Math.round(+n || 0))) === 1 ? "يوم" : n === 2 ? "يومين" : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يوم`;   // عبارة كاملة

  // ── الشكل: خريطة id ← قيمة (كل قيمة بيها t) — نفس شكل «المجموعات» بـ sync.js ──
  // m:<سؤال> {t,w:[أوقات الغلط]} · r:<مفهوم> {t} راجعه · x:<بطاقة> {t,until} «مو هسه» · ask {t,like,hard,skip,reask}
  // s:<ملاحظة> {t,n} ⭐ آخر مرة رجعت (أو أول مرة شفناها) · d:<يوم>:<بطاقة> {t,c,kind,ref,title,done} ➕ لليوم (c = وقت الإضافة)
  function shape(L, now = Date.now()) {
    const out = {}, lim = now + DAY;   // ساعة جهاز سابقة ما تزرع أوقات بالمستقبل
    if (!isObj(L)) return out;
    for (const k in L) {
      const v = L[k]; if (!isObj(v)) continue;
      if (k.startsWith("m:")) { const w = (Array.isArray(v.w) ? v.w : []).map(Number).filter((x) => x > 0 && x <= lim).slice(-12); if (w.length) out[k] = { t: Math.min(+v.t || w[w.length - 1], lim), w }; }
      else out[k] = Object.assign({}, v, { t: Math.min(+v.t || 0, lim) });
    }
    return out;
  }
  // نقلّم: غلط أقدم من 120 يوم، و«لليوم» أقدم من أسبوع (أو مفتاحه خربان)، و«مو هسه» الخالص
  function prune(L, now = Date.now()) {
    const td = dayKey(new Date(now));
    for (const k in L) {
      const v = L[k];
      if (k.startsWith("m:")) { v.w = v.w.filter((x) => now - x < 120 * DAY); if (!v.w.length) delete L[k]; }
      else if (k.startsWith("d:") && !(diff(k.slice(2, 12), td) <= KEEP_TD)) delete L[k];
      else if (k.startsWith("x:") && v.until && v.until < now - 30 * DAY) delete L[k];
    }
    return L;
  }

  // ── الفهرس: مفتاح السؤال ← {lec, sec, cids, q}، والمفهوم ← تفاصيله ──
  // lm = me/data.json «lm» من learn_map.py: { c:[[id, slug, en, ar, lec, sec, secEn, secAr]], q:{lec:{"<q_en[:120]>":[sec,[ci]]}} }
  function index(study, lm, lex = {}) {
    const byKey = new Map(), concepts = new Map(), C = (lm && lm.c) || [];
    C.forEach((r) => concepts.set(r[0], { id: r[0], slug: r[1], en: r[2], ar: r[3], lec: r[4], sec: r[5], secEn: r[6], secAr: r[7], keys: [] }));
    for (const s in study || {}) for (const l of study[s].lectures || []) {
      const lec = `${s}/${l.type}/${l.num}`, rows = ((lm && lm.q) || {})[lec];
      (l.questions || []).forEach((q) => {
        const k = qkey(q), r = rows && !Array.isArray(rows) ? rows[k] : null;
        if (!r) return;   // (مراجعة 30/10) بالمفتاح مو بالترتيب؛ سؤال ما بالخريطة ← ما نخمّن
        const cids = (r[1] || []).map((ci) => C[ci] && C[ci][0]).filter(Boolean);
        const rec = { lec, sec: r[0] || "", cids, q, learn: l.learn, quiz: l.quiz, title: l.title_ar, subject_ar: study[s].name };
        const old = byKey.get(k);   // نفس السؤال بمحاضرتين (نفس مفتاح tools.js) ← مفاهيم الاثنين سوا؛ القسم والخيارات من أول محاضرة (نفس النص)
        if (old) { cids.forEach((id) => { if (!old.cids.includes(id)) old.cids.push(id); }); } else byKey.set(k, rec);
        cids.forEach((id) => { const c = concepts.get(id); if (c && !c.keys.includes(k)) c.keys.push(k); });
      });
    }
    // مصطلح من «راجع اليوم» ما إله سؤال: مفهوم من المعجم
    const termConcept = (en) => {
      const id = "t:" + slug(en); if (concepts.has(id)) return concepts.get(id);
      const sl = lex[slug(en)] ? slug(en) : null, x = sl ? lex[sl] : null;
      const c = { id, slug: sl, en: x ? x[0] : en, ar: x ? x[1] : "", lec: null, sec: null, keys: [] };
      concepts.set(id, c); return c;
    };
    return { byKey, concepts, termConcept, lex };
  }

  // ── 🧠 كم مرة غلط بكل مفهوم: مناسبات مختلفة (يوم وحد لكل سؤال)، بعد آخر مراجعة إله، وآخر 60 يوم ──
  function misses(L, ix, now = Date.now()) {
    const acc = new Map();
    for (const k in L) {
      if (!k.startsWith("m:")) continue;
      const qk = k.slice(2), w = L[k].w || [];
      let cids, rec = null;
      const isTerm = qk.startsWith("term:");
      if (isTerm) cids = [ix.termConcept(qk.slice(5)).id];
      else { rec = ix.byKey.get(qk); if (!rec) continue; cids = rec.cids; }
      cids.forEach((id) => {
        const rv = (L["r:" + id] || {}).t || 0;
        const ts = w.filter((t) => t > rv && now - t < MISS_DAYS * DAY && t <= now + DAY);
        const days = new Set(ts.map(dayOf));   // (مراجعة 30/10) 3 مرات = 3 مناسبات، مو 3 ضغطات بنفس الجلسة
        if (!days.size) return;
        const a = acc.get(id) || { id, n: 0, last: 0, keys: [], terms: 0, lec: null, sec: null };
        a.n += days.size;
        if (isTerm) a.terms += days.size;
        const lt = Math.max(...ts);
        if (rec && !a.keys.includes(qk)) a.keys.push(qk);
        if (rec && lt >= a.last) { a.lec = rec.lec; a.sec = rec.sec; }   // القسم = آخر سؤال غلط بيه
        a.last = Math.max(a.last, lt);
        acc.set(id, a);
      });
    }
    return [...acc.values()].sort((a, b) => b.n - a.n || b.last - a.last);
  }
  // «✅ خلصت»: المفهوم + إخوانه اللي كل غلطهم المحسوب من نفس الأسئلة اللي راجعها (مو غيرها)
  function siblingsToReset(L, ix, id, now = Date.now()) {
    const all = misses(L, ix, now), me = all.find((x) => x.id === id), out = new Set([id]);
    if (!me) return [...out];
    const K = new Set(me.keys);
    all.forEach((x) => { if (x.id !== id && !x.terms && x.keys.length && x.keys.every((k) => K.has(k))) out.add(x.id); });
    return [...out];
  }

  // ── 🌱 المواد: النشاط آخر 14 يوم (دقائق) + المحبوبة والصعبة ──
  // st = Track.state()، cat = Plan.catalog، o = { ask, exam, lectures (Track.summarize().lectures), today, now }
  function subjects(st, cat, o = {}) {
    const today = o.today || dayKey(), now = o.now || parse(today).getTime(), ask = o.ask || null, exam = o.exam || null;
    const names = new Map((cat || []).map((l) => [l.subject, l.subject_ar])), act = {};
    names.forEach((_, s) => { act[s] = 0; });
    const days = (st && st.days) || {};
    for (const d in days) {
      if (diff(d, today) > 13 || diff(d, today) < 0) continue;
      for (const id in days[d].lec || {}) { const s = subjOf(id); if (s in act) act[s] += (+days[d].lec[id] || 0) / 60; }
      (days[d].quizzes || []).forEach((u) => { const m = /^quiz\/([^/]+)\//.exec(u); if (m && m[1] in act) act[m[1]] += 5; });
    }
    ((st && st.outside) || []).forEach((x) => { if (x.subject in act && x.d && diff(x.d, today) <= 13) act[x.subject] += +x.min || 0; });
    for (const s in act) act[s] = Math.round(act[s]);
    const pct = (s) => { const ls = (o.lectures || []).filter((l) => l.subject === s); return ls.length ? ls.reduce((a, l) => a + (+l.pct || 0), 0) / ls.length : 0; };
    const tot = Object.values(act).reduce((a, b) => a + b, 0);
    const ranked = Object.keys(act).sort((a, b) => act[b] - act[a]);
    const like = ask && ask.like && names.has(ask.like) ? ask.like : tot >= 30 && act[ranked[0]] > 0 ? ranked[0] : null;
    let hard = null, why = null;
    // «صعبة عليّ» تبقى 30 يوم بس، أو لحد ما يتقدّم بيها (60%) — بعدها نرجع للسلوك
    const said = ask && ask.hard && names.has(ask.hard) && !ask.reask && now - (+ask.t || 0) < SAID_DAYS * DAY && pct(ask.hard) < SAID_DONE;
    if (said) { hard = ask.hard; why = "said"; }
    else if (exam && exam.subject && names.has(exam.subject) && diff(today, exam.date) >= 0 && diff(today, exam.date) <= 14) {
      const others = Object.keys(act).filter((s) => s !== exam.subject && act[s] > 0);
      const avg = others.length ? others.reduce((a, s) => a + act[s], 0) / others.length : 0;
      if (act[exam.subject] < Math.max(10, avg * 0.5)) { hard = exam.subject; why = "exam"; }
    }
    if (!hard && tot >= 60) {   // بيانات كافية: مادة ساكتة والباقي شغال
      const quiet = ranked.filter((s) => s !== like && act[s] < tot * 0.05).pop();
      if (quiet) { hard = quiet; why = "quiet"; }
    }
    return { act, total: tot, like, hard, why, name: (s) => names.get(s) || s };
  }
  // أصغر خطوة: أول محاضرة ما خلصت (المشمولة بالامتحان أول) ← أول قسم ما انفتح (بحدود أقسامها الحقيقية) ← وإلا اختبارها
  function smallStep(subject, lectures = [], exam = null, st = null, cat = []) {
    let ls = lectures.filter((l) => l.subject === subject && !l.done);
    if (exam && exam.subject === subject && (exam.lectures || []).length) {
      const inEx = ls.filter((l) => exam.lectures.includes(`${l.type}/${l.num}`)); if (inEx.length) ls = inEx;
    }
    ls.sort((a, b) => (a.type !== b.type ? (a.type === "theory" ? -1 : 1) : a.num - b.num));
    const L = ls[0]; if (!L) return null;
    const C = (cat || []).find((x) => x.id === L.id) || {}, nsec = +C.sections || +((st && st.lec && st.lec[L.id]) || {}).nsec || 0;
    const opened = new Set(Object.keys(((st && st.lec && st.lec[L.id]) || {}).open || {}));
    const quiz = L.quizUrl || L.quiz || C.quiz || null;
    if (nsec) {
      let sec = 1; while (opened.has("s" + sec) && sec <= nsec) sec++;
      if (sec > nsec) return quiz ? { id: L.id, title: L.title, kind: "quiz", href: quiz, min: 5 } : null;   // قرا كل الأقسام ← اختبار قصير
      return { id: L.id, title: L.title, kind: "read", href: L.learn + "#r-s" + sec, sec: "s" + sec, min: 5 };
    }
    return { id: L.id, title: L.title, kind: "read", href: L.learn + (opened.size ? "" : "#r-s1"), sec: opened.size ? null : "s1", min: 5 };
  }

  // ── ⭐ الملاحظات المهمة ──
  // fresh = نجوم أول مرة نشوفها (ما إلها s:) — الجدول يبدأ منها، فالقديمة ما تطلع كلها سوا بيوم الإطلاق
  function stars(notes, L, o = {}) {
    const now = o.now || Date.now(), today = o.today || dayKey(new Date(now)), exam = o.exam || null;
    const st = (notes || []).filter((n) => n && n.pin && String(n.text || "").trim());
    const fresh = st.filter((n) => !L["s:" + n.id]).map((n) => n.id);
    if (!st.length) return null;
    if (exam && exam.date && diff(today, exam.date) >= 0 && diff(today, exam.date) <= EXAM_STARS) {
      const mine = st.filter((n) => n.ctx && String(n.ctx.url || "").includes("/" + exam.subject + "/"));
      return { mode: "exam", subject: exam.subject, date: exam.date, days: diff(today, exam.date), list: (mine.length ? mine : st).slice(0, 3), all: (mine.length ? mine : st).length, fresh };
    }
    const due = st.filter((n) => { const s = L["s:" + n.id]; if (!s) return false; const k = Math.min(+s.n || 0, GAP.length - 1); return now - (+s.t || 0) >= GAP[k] * DAY; })
      .sort((a, b) => (L["s:" + a.id].t || 0) - (L["s:" + b.id].t || 0));
    return { mode: "review", list: due.slice(0, 1), all: due.length, due, fresh };
  }

  // ── بطاقة وحدة بس بالمرة (الأولوية بالترتيب) ──
  // c = { L, ix, notes, exam, st, cat, lectures (Track.summarize().lectures), today, now }
  const snoozed = (L, id, now) => { const x = L["x:" + id]; return !!(x && x.until > now); };
  const inToday = (L, id, today) => !!L[`d:${today}:${id}`];
  function pick(c) {
    const L = c.L || {}, now = c.now || Date.now(), today = c.today || dayKey(new Date(now));
    const S = stars(c.notes, L, { now, today, exam: c.exam });
    if (S && S.mode === "exam" && !snoozed(L, "stars-exam", now) && !inToday(L, "stars-exam", today)) return Object.assign({ type: "stars", id: "stars-exam" }, S);
    if (L.ask && L.ask.reask && !snoozed(L, "ask", now)) return { type: "ask", id: "ask" };   // ضغط «غيّر»
    const M = misses(L, c.ix, now).filter((m) => m.n >= MIN_MISS && !snoozed(L, m.id, now) && !inToday(L, m.id, today));
    if (M[0]) return { type: "mistake", id: M[0].id, n: M[0].n, concept: c.ix.concepts.get(M[0].id), miss: M[0] };
    const sub = subjects(c.st, c.cat, { today, now, ask: L.ask, exam: c.exam, lectures: c.lectures });
    const active = Object.keys((c.st && c.st.days) || {}).filter((d) => ((c.st.days[d].s || 0) >= 300 || (c.st.days[d].quizzes || []).length)).length;
    if (!L.ask && !snoozed(L, "ask", now) && (active >= 2 || ((c.st && c.st.quiz) || []).length >= 1)) return { type: "ask", id: "ask" };
    if (sub.hard && !snoozed(L, "h:" + sub.hard, now) && !inToday(L, "h:" + sub.hard, today)) {
      const step = smallStep(sub.hard, c.lectures || [], c.exam, c.st, c.cat);
      if (step) return { type: "hard", id: "h:" + sub.hard, subject: sub.hard, name: sub.name(sub.hard), why: sub.why, step };
    }
    if (S && S.mode === "review") {
      const due = S.due.filter((n) => !snoozed(L, "s:" + n.id, now) && !inToday(L, "s:" + n.id, today));
      if (due[0]) return Object.assign({}, S, { type: "stars", id: "s:" + due[0].id, list: [due[0]], all: due.length });
    }
    return null;
  }

  // ── الأفعال (صافية: تعدّل L وترجعها) ──
  const act = {
    snooze(L, id, days = 2, now = Date.now(), until = null) { L["x:" + id] = { t: now, until: until || now + days * DAY }; return L; },
    // ⭐ قبل الامتحان: «مو هسه» لباچر 6 الصبح بالكثير، وأبداً مو بعد بداية يوم الامتحان
    snoozeExam(L, examDate, now = Date.now()) {
      const tm = new Date(now); tm.setDate(tm.getDate() + 1); tm.setHours(6, 0, 0, 0);
      let until = tm.getTime(); if (examDate) until = Math.min(until, parse(examDate).getTime());
      if (until <= now) until = now + 3 * 3600e3;
      return act.snooze(L, "stars-exam", 0, now, until);
    },
    reviewed(L, id, now = Date.now()) { L["r:" + id] = { t: now }; const td = `d:${dayKey(new Date(now))}:${id}`; if (L[td]) L[td] = Object.assign({}, L[td], { t: now, done: true }); return L; },
    addToday(L, card, now = Date.now()) {
      const td = dayKey(new Date(now)), x = { t: now, c: now, kind: card.type, done: false };
      if (card.type === "mistake") Object.assign(x, { ref: card.id, title: card.concept ? card.concept.en : card.id });
      else if (card.type === "hard") Object.assign(x, { ref: card.subject, title: card.name, href: card.step.href, lec: card.step.title });
      else if (card.type === "stars") Object.assign(x, { ref: card.id, title: "" });
      L[`d:${td}:${card.id}`] = x; return L;
    },
    toggleToday(L, k, now = Date.now()) { if (L[k]) L[k] = Object.assign({}, L[k], { t: now, c: L[k].c || L[k].t, done: !L[k].done }); return L; },
    ask(L, like, hard, now = Date.now()) { L.ask = { t: now, like: like || null, hard: hard || null, skip: !like && !hard }; delete L["x:ask"]; return L; },
    reask(L, now = Date.now()) { L.ask = Object.assign({}, L.ask || {}, { t: now, reask: true }); delete L["x:ask"]; return L; },
    starSeen(L, ids, now = Date.now()) { ids.forEach((id) => { const s = L["s:" + id]; L["s:" + id] = { t: now, n: Math.min((s ? +s.n || 0 : 0) + 1, GAP.length - 1) }; }); return L; },
    starsFresh(L, ids, now = Date.now()) { ids.forEach((id) => { if (!L["s:" + id]) L["s:" + id] = { t: now, n: 0 }; }); return L; },   // أول مرة ← ترجع بعد يوم
    // نتيجة المراجعة: صح 2 من 3 (أو كلها إذا أقل) ← تنحسب؛ غيرها ← نرجعله باچر بلطف
    finish(L, ix, id, right, total, now = Date.now()) {
      if (!total || right >= Math.min(PASS, total)) { siblingsToReset(L, ix, id, now).forEach((c) => act.reviewed(L, c, now)); return true; }
      act.snooze(L, id, 1, now); return false;
    },
  };
  const todayList = (L, today = dayKey()) => Object.keys(L).filter((k) => k.startsWith(`d:${today}:`))
    .sort((a, b) => (L[a].c || L[a].t) - (L[b].c || L[b].t)).map((k) => Object.assign({ key: k }, L[k]));   // بوقت الإضافة: ما تقفز لما تتأشّر

  // ── التخزين ──
  const load = () => shape(LS.get(KEY, {}));
  const emit = () => { if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("learn:change")); };
  // quiet: البطاقة ترسم نفسها (حتى التركيز ما يضيع)، بس المزامنة تنبلّغ بـ «learn:saved»
  const mutate = (f, quiet) => { const L = load(); f(L); LS.set(KEY, prune(L)); if (!quiet) emit(); else if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("learn:saved")); return L; };

  // ── العرض ──
  const pron = (h) => esc(h).replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>");   // اللفظ بالمعجم بيه <u> للمقطع المشدود بس
  const btn = (a, l, cls = "cbtn") => `<button type="button" class="${cls}" data-la="${a}">${l}</button>`;
  const later = () => btn("later", "مو هسه", "lxnot");
  function examWhen(d) { return d === 0 ? "الامتحان اليوم" : d === 1 ? "الامتحان باچر" : "الامتحان بعد " + arDays(d); }
  function cardHTML(k, o = {}) {
    if (k.type === "mistake") {
      const c = k.concept || {}, n = k.n;
      return `<div class="lxc" data-card="${esc(k.id)}"><p class="lxk">🧠 <span>يحتاج مراجعة صغيرة</span></p>` +
        `<p class="lxn"><b dir="ltr" lang="en">${esc(c.en || "")}</b>${c.ar ? `<small data-noen>${esc(c.ar)}</small>` : ""}</p>` +
        `<p class="lxm">${n > 10 ? `غلطت بيه ${n} مرة، نراجعه دقيقتين؟` : `غلطت بيه ${n} مرات، نراجعه دقيقتين؟`}</p>` +
        `<div class="lxb">${btn("review", "راجعه هسه")}${btn("add", "➕ ضيفه لليوم", "cbtn ghost")}${later()}</div></div>`;
    }
    if (k.type === "ask") {
      const step2 = !!(o.sel && o.sel.like);
      const ch = (g, v, l, on) => `<button type="button" class="chip2" data-g="${g}" data-v="${esc(v)}" aria-pressed="${!!on}">${esc(l)}</button>`;
      const subs = o.subjects || [];
      return `<div class="lxc" data-card="ask"><p class="lxk">💬 <span>سؤال صغير، نسألك مرة وحدة بس</span></p>` + (!step2
        ? `<p class="lxq" id="lq-l">أي مادة تحبها؟</p><div class="chips-row lxg" role="group" aria-labelledby="lq-l">${subs.map(([s, n]) => ch("like", s, n, false)).join("")}</div>` +
          `<div class="lxb">${btn("askskip", "تخطّى", "cbtn ghost")}</div>`
        : `<p class="lxs">✓ <span>المادة اللي تحبها:</span> <b>${esc((subs.find(([s]) => s === o.sel.like) || [0, ""])[1])}</b></p>` +
          `<p class="lxq" id="lq-h">وأي مادة تحس بيها صعبة شوية؟</p><div class="chips-row lxg" role="group" aria-labelledby="lq-h">${subs.filter(([s]) => s !== o.sel.like).map(([s, n]) => ch("hard", s, n, o.sel.hard === s)).join("")}</div>` +
          `<p class="lxsm">يبقى بجهازك وحسابك بس.</p><div class="lxb"><button type="button" class="cbtn" data-la="asksave"${o.sel.like || o.sel.hard ? "" : " disabled"}>احفظ اختياري</button>${btn("askskip", "تخطّى", "cbtn ghost")}</div>`) + `</div>`;
    }
    if (k.type === "hard") {
      const s = k.step, go = s.kind === "quiz" ? "📝 جرّب اختبار قصير من:" : "📖 اقرأ قسم واحد من:";
      return `<div class="lxc" data-card="${esc(k.id)}"><p class="lxk">🌱 <span>خطوة صغيرة</span></p>` +
        `<p class="lxn"><b>${esc(k.name)}</b>${k.why === "said" ? `<button type="button" class="lxch" data-la="reask" aria-label="غيّر المادة الصعبة">غيّر اختياري</button>` : ""}</p>` +
        `<p class="lxm">${k.why === "exam" ? "امتحانها قريب، و5 دقايق بس اليوم تفرق." : "5 دقايق بس اليوم، وخطوة خطوة توصل."}</p>` +
        `<p class="lxs"><span>${go}</span> <bdi>${esc(s.title)}</bdi></p>` +
        `<div class="lxb"><a class="cbtn" data-la="go" href="${esc((o.root || "") + s.href)}">ابدأ هسه ‹</a>${btn("add", "➕ ضيفه لليوم", "cbtn ghost")}${later()}</div></div>`;
    }
    if (k.type === "stars") {
      const head = k.mode === "exam"
        ? `<p class="lxk">⭐ <span>ملاحظاتك المهمة قبل الامتحان</span></p><p class="lxs2">${esc(o.subjectName ? o.subjectName(k.subject) : k.subject)} · ${examWhen(k.days)}</p>`
        : `<p class="lxk">⭐ <span>ملاحظة مهمة رجعتلك</span></p>`;
      return `<div class="lxc" data-card="${esc(k.id)}">${head}<ul class="lxnotes">${k.list.map((n) => `<li dir="auto" data-noen>${esc(String(n.text).slice(0, 220))}</li>`).join("")}</ul>` +
        (k.all > k.list.length ? `<p class="lxsm">+ ${k.all - k.list.length} بملاحظاتي</p>` : "") +
        `<div class="lxb">${btn("starsok", "✓ راجعتها")}${k.mode === "review" ? btn("add", "➕ ضيفه لليوم", "cbtn ghost") : ""}${later()}</div></div>`;
    }
    return "";
  }
  const reviewKeys = (c, miss) => [...new Set(((miss && miss.keys) || []).concat(c.keys || []))].filter((k) => k).slice(0, 3);
  // 🧠 المراجعة القصيرة: بطاقة المصطلح + أسئلته وحدة وحدة (3 بالكثير، اللي غلط بيها أول) + رابط القسم
  function reviewHTML(c, o, miss) {
    const lex = (o.ix && o.ix.lex) || {}, x = c.slug ? lex[c.slug] : null, root = o.root || "";
    const qs = reviewKeys(c, miss).map((k) => o.ix.byKey.get(k)).filter(Boolean);
    const lec = (miss && miss.lec) || c.lec, sec = (miss && miss.sec) || c.sec, R = qs[0] || [...o.ix.byKey.values()].find((r) => r.lec === lec);
    const href = R && R.learn ? root + R.learn + (sec ? "#r-" + sec : "") : "";
    const term = `<div class="lxt"><div class="lxth"><b dir="ltr" lang="en">${esc(x ? x[0] : c.en)}</b>` +
      (c.slug ? `<button type="button" class="ib lsay" data-la="say" data-src="${esc(root + "assets/audio/terms/" + c.slug + ".mp3")}" aria-label="اسمع لفظ المصطلح">🔊</button>` : "") + `</div>` +
      ((x && x[1]) || c.ar ? `<p class="lxmean" data-noen>${esc((x && x[1]) || c.ar)}</p>` : "") +
      (x && x[2] ? `<p class="lxpron" data-noen>${pron(x[2])}</p>` : "") + (x && x[3] ? `<p class="lxpron" data-noen><bdi dir="ltr" class="ipa">${esc(x[3])}</bdi></p>` : "") +
      (!c.slug && c.id.startsWith("s:") ? `<p class="lxmean" data-noen>${esc(c.secAr || "")}</p>` : "") + `</div>`;
    const qh = qs.map((r, j) => `<div class="lxqz" data-q="${j}"${j ? " hidden" : ""}><p class="qen" dir="ltr" lang="en">${esc(r.q.q_en)}</p><p class="qar" data-noen>${esc(r.q.q_ar || "")}</p>` +
      `<div class="qo">${(r.q.options || []).map((op, i) => `<button type="button" class="qopt" data-la="opt" data-i="${i}"><span dir="ltr" lang="en">${esc(op.en)}</span><small data-noen>${esc(op.ar || "")}</small></button>`).join("")}</div></div>`).join("");
    return `<div class="lxc lxrev" data-rev="${esc(c.id)}"><div class="bsh"><h3 class="lxh3" tabindex="-1">🧠 <span>مراجعة دقيقتين</span></h3><button type="button" class="ib" data-la="close" aria-label="سد المراجعة">✕</button></div>` + term +
      (qh ? `<p class="lxk"><span>جرّب نفسك (${qs.length})</span></p>${qh}<p class="qw" role="status" hidden></p>` : "") +
      (href ? `<a class="lxsec" href="${esc(href)}">📖 <span>اقرأ القسم بالمحاضرة</span> ‹</a>` : "") +
      `<div class="lxb"><button type="button" class="cbtn" data-la="done">✅ خلصت المراجعة</button></div></div>`;
  }
  function todayHTML(list, o) {
    if (!list.length) return "";
    return `<div class="lxtoday">` + list.map((t) => {
      const lab = t.kind === "mistake" ? ["🧠", "راجع هالمفهوم:", t.title, "مراجعة دقيقتين"] : t.kind === "hard" ? ["🌱", "5 دقايق بس:", t.lec || t.title, t.title] : ["⭐", "ملاحظاتك المهمة", "", ""];
      const go = t.kind === "mistake" ? `<button type="button" class="go" data-la="open" data-ref="${esc(t.ref)}">افتح ‹</button>`
        : t.kind === "hard" && t.href ? `<a class="go" href="${esc((o.root || "") + t.href)}">افتح ‹</a>` : `<button type="button" class="go" data-la="notes">افتح ‹</button>`;
      return `<div class="task${t.done ? " done" : ""}" data-ltask="${esc(t.key)}"><button type="button" class="ck" data-la="tick" aria-pressed="${!!t.done}" aria-label="خلصت هالخطوة">${t.done ? "✓" : ""}</button>` +
        `<span><b>${lab[0]} <span>${lab[1]}</span> ${lab[2] ? `<bdi${t.kind === "mistake" ? ' dir="ltr" lang="en"' : ""}>${esc(lab[2])}</bdi>` : ""}</b><small>${esc(lab[3])}</small></span>${go}</div>`;
    }).join("") + `</div>`;
  }
  // o = { root, ix, ctx(): {notes, exam, st, cat, lectures}, subjects:[[k,name]], subjectName(s), openNotes(), onToday(n), hint (عنصر سطر «كمّل»), planHead (عنوان «خطة اليوم») }
  function mount(el, tel, o) {
    let open = null, hold = null, sel = { like: null, hard: null }, score = { right: 0, n: 0 };
    const doc = typeof document !== "undefined" ? document : null;
    let sr = doc && doc.getElementById("lxsr");
    if (doc && !sr) { sr = doc.createElement("div"); sr.id = "lxsr"; sr.className = "sr-only"; sr.setAttribute("role", "status"); doc.body.appendChild(sr); }
    const say = (t) => { if (sr) { sr.textContent = ""; setTimeout(() => { sr.textContent = t; }, 50); } };
    const focusNext = () => setTimeout(() => {
      const b = el.querySelector(".lxc button:not([disabled]), .lxc a.cbtn"), h = o.planHead;
      if (b) b.focus({ preventScroll: false }); else if (h) { if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1"); h.focus(); }
    }, 30);
    const reviewing = (on) => { if (doc) doc.body.classList.toggle("lx-reviewing", !!on); };   // زر «اسأل» العائم ما يغطي الأزرار
    // رسالة قصيرة (عاشت إيدك / انضاف): تبقى ~4 ثواني أو لحد الضغطة الجاية
    const flash = (html, ms, then) => {
      clearTimeout(hold && hold.tm);
      el.innerHTML = `<div class="lxc lxok"><p class="lxm" tabindex="-1">${html}</p></div>`;
      const p = el.querySelector(".lxm"); el.scrollIntoView({ behavior: "smooth", block: "nearest" }); if (p) p.focus({ preventScroll: true });
      const end = () => { if (!hold) return; clearTimeout(hold.tm); hold = null; then(); };
      hold = { end, tm: setTimeout(end, ms) };
    };
    const paint = (force) => {
      if (hold || (open && force !== true)) { if (tel) renderToday(); return; }   // المراجعة المفتوحة ما تنمسح من أحداث ثانية (مزامنة، تقدّم…)
      const c = o.ctx(), L = load(), now = Date.now(), today = dayKey(new Date(now));
      const S = stars(c.notes, L, { now, today, exam: c.exam });
      if (S && S.fresh && S.fresh.length) { mutate((x) => act.starsFresh(x, S.fresh, now), true); }   // ⭐ تبدأ من هسه (+1 يوم)
      if (open) {
        const m = misses(L, o.ix, now).find((x) => x.id === open) || null, cc = o.ix.concepts.get(open);
        el.innerHTML = cc ? reviewHTML(cc, o, m) : ""; el._keys = cc ? reviewKeys(cc, m).filter((k) => o.ix.byKey.get(k)) : []; if (!cc) open = null;
        score = { right: 0, n: 0 }; reviewing(!!open); quiet();
      }
      if (!open) { reviewing(false); const k = pick(Object.assign({ L: load(), ix: o.ix, now, today }, c)); el._card = k; el.innerHTML = k ? cardHTML(k, Object.assign({ sel }, o)) : "";
        if (o.hint) { o.hint.hidden = !k; const t = o.hint.querySelector("span"); if (t) t.textContent = k && k.type === "mistake" ? "🧠 عندك مراجعة دقيقتين ↓" : "💡 عندك اقتراح صغير بخطة اليوم ↓"; } }
      if (tel) renderToday();
    };
    const renderToday = () => { const list = todayList(load(), dayKey()); tel.innerHTML = todayHTML(list, o); if (o.onToday) o.onToday(list.length); };
    // مصطلحات المعجم داخل المراجعة (listen.js يعلّمها) ما تاخذ تركيز الكيبورد — الأزرار أهم
    const quiet = () => { el.querySelectorAll(".lxrev [tabindex='0']:not(button):not(a):not(.lxh3)").forEach((x) => x.setAttribute("tabindex", "-1")); };
    if (doc && "MutationObserver" in (typeof window !== "undefined" ? window : {})) new MutationObserver(() => { if (open) quiet(); }).observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["tabindex"] });
    const onClick = (ev) => {
      if (hold && !ev.target.closest("[data-la='go']")) { hold.end(); return; }
      const b = ev.target.closest("[data-la], .chip2[data-g]"); if (!b || !(el.contains(b) || (tel && tel.contains(b)))) return;
      if (b.matches(".chip2[data-g]")) {
        const g = b.dataset.g; sel[g] = sel[g] === b.dataset.v ? null : b.dataset.v;
        if (g === "like") { el.innerHTML = cardHTML({ type: "ask", id: "ask" }, Object.assign({ sel }, o)); const f = el.querySelector(".chip2"); if (f) f.focus(); say("وأي مادة تحس بيها صعبة شوية؟"); return; }
        b.parentElement.querySelectorAll(".chip2").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === sel[g])));
        const sv = el.querySelector('[data-la="asksave"]'); if (sv) sv.disabled = !(sel.like || sel.hard); return;
      }
      const a = b.dataset.la, k = el._card;
      if (a === "go") return;   // رابط عادي
      if (a === "say") { try { doc.querySelectorAll("audio").forEach((x) => { try { x.pause(); } catch (e) {} }); if (!mount.au) mount.au = new Audio(); mount.au.pause(); mount.au.src = b.dataset.src; mount.au.play().catch(() => {}); } catch (e) {} return; }   // صوت واحد بالمرة
      if (a === "opt") {
        const box = b.closest(".lxqz"), r = o.ix.byKey.get((el._keys || [])[+box.dataset.q]);
        if (!r || box.dataset.ans) return; box.dataset.ans = "1";
        const ok = +b.dataset.i === r.q.answer, right = (r.q.options || [])[r.q.answer] || {};
        score.n++; if (ok) score.right++;
        const tc = el.querySelector(".lxt"); if (tc) tc.classList.add("mini");   // بطاقة المصطلح تصغر بعد أول جواب — المراجعة تبقى بحدود شاشة
        // السؤال يتطوى لسطر واحد، والشرح بسطره، والسؤال الجاي يطلع — المراجعة تبقى بحدود شاشة وحدة
        box.innerHTML = `<p class="lxans">${ok ? "✓" : "✗"} <bdi dir="ltr" lang="en">${esc(String(r.q.q_en).slice(0, 70))}${String(r.q.q_en).length > 70 ? "…" : ""}</bdi></p>`;
        const w = el.querySelector(".qw"); w.hidden = false;
        w.innerHTML = `<b>${ok ? "✓ صح." : "الجواب الصح:"}</b>${ok ? "" : ` <bdi dir="ltr" lang="en">${esc(right.en || "")}</bdi>`}<span class="lxwhy" data-noen>${esc(String(r.q.why || "").replace(/^المحاضرة:\s*/, ""))}</span>`;
        box.after(w);
        const nx = el.querySelector(`.lxqz[data-q="${+box.dataset.q + 1}"]`); if (nx) nx.hidden = false;
        w.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // ملاحظة: «صفحتي» ما بيها tools.js — الجواب هنا تمرين بس (ما ينحسب غلط ولا يمسح من أخطائي)
        return;
      }
      if (a === "close") { open = null; paint(true); focusNext(); return; }
      if (a === "done") {
        const id = open, n = (el._keys || []).length; open = null; reviewing(false);
        let ok = true; mutate((L) => { ok = act.finish(L, o.ix, id, score.right, n); }, true);
        say(ok ? "عاشت إيدك، راجعتها." : "عاشت إيدك، نرجعله باچر دقيقة.");
        flash(ok ? "👏 <span>عاشت إيدك، راجعتها.</span>" : "🙂 <span>عاشت إيدك، نرجعله باچر دقيقة.</span>", 4000, () => { paint(true); focusNext(); });
        return;
      }
      if (a === "review" && k) { open = k.id; paint(true); el.scrollIntoView({ behavior: "smooth", block: "start" }); const h = el.querySelector(".lxh3"); if (h) h.focus({ preventScroll: true }); return; }
      if (a === "open") { open = b.dataset.ref; paint(true); el.scrollIntoView({ behavior: "smooth", block: "start" }); const h = el.querySelector(".lxh3"); if (h) h.focus({ preventScroll: true }); return; }
      if (a === "add" && k) { mutate((L) => act.addToday(L, k), true); say("انضاف لخطة اليوم"); if (tel) renderToday(); flash("✓ <span>انضاف لخطة اليوم</span>", 2500, () => { paint(true); focusNext(); }); return; }
      if (a === "later" && k) {
        mutate((L) => { if (k.id === "stars-exam") act.snoozeExam(L, k.date); else act.snooze(L, k.id, k.type === "mistake" ? 1 : 2); }, true);
        paint(true); focusNext(); return;
      }
      if (a === "reask") { sel = { like: null, hard: null }; mutate((L) => act.reask(L), true); paint(true); focusNext(); return; }
      if (a === "asksave") { mutate((L) => act.ask(L, sel.like, sel.hard), true); sel = { like: null, hard: null }; say("انحفظ اختيارك"); paint(true); focusNext(); return; }
      if (a === "askskip") { mutate((L) => act.ask(L, null, null), true); sel = { like: null, hard: null }; paint(true); focusNext(); return; }
      if (a === "asklater") { mutate((L) => act.snooze(L, "ask", 2), true); sel = { like: null, hard: null }; paint(true); focusNext(); return; }
      if (a === "starsok" && k) { mutate((L) => { act.starSeen(L, k.list.map((n) => n.id)); if (k.mode === "exam") { act.addToday(L, k); L[`d:${dayKey()}:${k.id}`].done = true; } }, true); say("عاشت إيدك، راجعتها."); paint(true); focusNext(); return; }
      if (a === "tick") { mutate((L) => act.toggleToday(L, b.closest("[data-ltask]").dataset.ltask), true); const key = b.closest("[data-ltask]").dataset.ltask; renderToday(); const nb = tel.querySelector(`[data-ltask="${CSS.escape(key)}"] .ck`); if (nb) nb.focus(); return; }
      if (a === "notes" && o.openNotes) { o.openNotes(); return; }
    };
    if (doc) {
      doc.addEventListener("click", onClick);
      doc.addEventListener("learn:change", () => setTimeout(paint, 0));
      addEventListener("storage", (e) => { if (e.key === KEY || e.key === "t:notes") setTimeout(paint, 0); });   // تبويب ثاني
    }
    paint(true);
    return { paint };
  }

  return { KEY, GAP, MIN_MISS, dayKey, diff, slug, qkey, shape, prune, index, misses, siblingsToReset, subjects, smallStep, stars, pick, act, todayList,
    load, mutate, mount, cardHTML, reviewHTML, todayHTML,
    export: () => ({ learn: load() }), import: (d) => { if (d && isObj(d.learn)) { LS.set(KEY, shape(d.learn)); emit(); return true; } return false; } };
});
