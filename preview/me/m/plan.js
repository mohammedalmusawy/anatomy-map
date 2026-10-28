// 🗓️ خطتي (29/10/2026 — نايمة: ما تنحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// الطالب يختار بالأزرار بس (المادة، الامتحان من «الامتحان القادم»، الوقت اليومي، متى/وين، أو قالب) ← خطة يوم بيوم:
// المحاضرات تتوزّع حسب دقائقها (السمع + الاختبار)، مراجعة متباعدة +1/+3/+7، خلط المواد، يوم راحة بالأسبوع،
// وآخر يوم = مراجعة سريعة + أكثر الغلط + أخطائي. «اليوم» = 📖 اقرأ · 🎧 اسمع · 📝 اختبر · 🔁 المصطلحات · 📕 أخطائي · 🩻 حالتين،
// وكل مهمة تتعلّم ✅ وحدها (مثلاً خلص الاختبار ← ✅). فاتك يوم؟ تترتّب الباقية من جديد بدون لوم.
// كلشي بجهاز الطالب (localStorage «t:plan»)، وما ينرسل شي. Plan.export()/import() جاهزة للمزامنة ويّا الحساب بعدين.
// الدوال الصافية (generate/rebalance/autoDone/timerState) تشتغل بـ node للاختبارات (tests/plan.test.js).
(function (root, factory) {
  const P = factory();
  if (typeof module === "object" && module.exports) module.exports = P; else root.Plan = P;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:plan", TKEY = "t:timer";
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── التواريخ: «YYYY-MM-DD» بتوقيت الجهاز (منتصف الليل) ──
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);   // b − a بالأيام
  const wday = (k) => parse(k).getDay();                               // 0 = الأحد … 5 = الجمعة
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const arDate = (k) => { const d = parse(k); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

  // ── القوالب والإعدادات ──
  const TEMPLATES = {
    week: { label: "أسبوع قبل", days: 7, rest: true },
    "3d": { label: "3 أيام", days: 3, rest: false },
    rush: { label: "ما عندي وقت", days: 1, rest: false },
    course: { label: "من بداية الكورس", days: 56, rest: true },
  };
  const DAILY = { 30: "30د", 60: "ساعة", 120: "ساعتين" };
  const SLOTS = ["الصبح · البيت", "بعد الدوام · الكلية", "العصر · البيت", "بالليل · البيت"];
  const GAPS = [1, 3, 7];             // مراجعة متباعدة بعد يوم، 3 أيام، أسبوع
  const REVIEW_MIN = 5, EXTRA_MIN = 5, MIN_PART = 8, REST_WDAY = 5;   // الراحة الافتراضية: الجمعة
  const ICON = { read: "📖", listen: "🎧", quiz: "📝", review: "🔁", terms: "🔁", mistakes: "📕", cases: "🩻", recap: "🔁", focus: "🎯", missed: "🎯", rest: "😌", exam: "📅" };

  // ── المحاضرات: من study/data.json (+ دقائق الصوت وعدد الأقسام إذا متوفرة) ──
  // l = { id:"protection/theory/1", subject, subject_ar, type, num, title, minutes, sections, questions, learn, quiz }
  function catalog(study, extra = {}) {
    const out = [];
    for (const s in study || {}) for (const l of study[s].lectures || []) {
      const id = `${s}/${l.type}/${l.num}`, x = extra[id] || {};
      out.push({ id, subject: s, subject_ar: study[s].name, type: l.type, num: l.num, title: l.title_ar, title_en: l.title_en,
        minutes: x.minutes || 0, sections: x.sections || 0, questions: (l.questions || []).length, learn: l.learn, quiz: l.quiz });
    }
    return out;
  }
  const short = (l) => `${l.subject_ar} ${l.type === "practical" ? "عملي" : "نظري"} م${l.num}`;

  // التقدير بالدقائق: القراءة أبطأ شوية من السمع؛ بلا صوت ← من عدد الأقسام؛ الاختبار 10 أسئلة بالكثير
  function estimate(l) {
    const a = +l.minutes || 0;
    const read = Math.max(MIN_PART, Math.round((a || (l.sections || 5) * 2.5) * 1.3));
    const listen = a ? Math.max(3, Math.round(a)) : 0;
    const quiz = l.questions ? Math.max(4, Math.round(Math.min(10, l.questions) * 0.8)) : 0;
    return { read, listen, quiz, total: read + quiz };
  }

  // خلط المواد: وحدة من كل مادة بالدور (النظري قبل العملي، وبالترتيب)
  function interleave(list) {
    const by = new Map();
    list.forEach((l) => { if (!by.has(l.subject)) by.set(l.subject, []); by.get(l.subject).push(l); });
    by.forEach((a) => a.sort((x, y) => (x.type !== y.type ? (x.type === "theory" ? -1 : 1) : x.num - y.num)));
    const out = [];
    for (let more = true; more;) { more = false; by.forEach((a) => { if (a.length) { out.push(a.shift()); more = true; } }); }
    return out;
  }

  // أقرب امتحان من كاش «الامتحان القادم» (t:nextexam، نفس شكل nextexam.js): { subject, type, date, lectures:["theory/3",…] }
  function examFromCache(cache, today = dayKey()) {
    const rows = (cache && cache.rows) || [];
    const up = rows.map((x) => ({ subject: x.subject, type: x.type, date: x.postponed_to || x.exam_date, lectures: Array.isArray(x.lectures) ? x.lectures : [] }))
      .filter((x) => x.date && diff(today, x.date) >= 0).sort((a, b) => diff(b.date, a.date));
    return up[0] || null;
  }

  // أي المحاضرات تدخل بالخطة: المادة المختارة (أو كلها)، وإذا الامتحان محدّد مشموله ← المشمول بس
  function pick(cat, o) {
    let L = cat.filter((l) => !o.subjects || !o.subjects.length || o.subjects.includes(l.subject));
    const ex = o.exam;
    if (ex && ex.subject && (!o.subjects || !o.subjects.length || o.subjects.includes(ex.subject))) {
      if (ex.lectures && ex.lectures.length) {
        const inEx = L.filter((l) => l.subject === ex.subject && ex.lectures.includes(`${l.type}/${l.num}`));
        if (inEx.length) L = inEx.concat(L.filter((l) => l.subject !== ex.subject));
      } else if (ex.type) L = L.filter((l) => l.subject !== ex.subject || l.type === ex.type);
    }
    return L;
  }

  // ── المولّد ──
  // o = { template, daily(30|60|120), today, exam, subjects[], lectures (catalog), done[] (محاضرات خلصها), learned{id:date},
  //       restDay (0–6), slot, mistakes (عدد أخطائي), scores{id:%}, regions[] (مناطق الأطلس للحالتين) }
  function generate(o) {
    const tplKey = TEMPLATES[o.template] ? o.template : "week", tpl = TEMPLATES[tplKey];
    const today = o.today || dayKey();
    const daily = DAILY[o.daily] ? +o.daily : 60;
    const exam = o.exam && o.exam.date && diff(today, o.exam.date) >= 0 ? o.exam : null;
    const restDay = o.restDay == null ? REST_WDAY : +o.restDay;
    const all = o.lectures || [];
    const L = pick(all, Object.assign({}, o, { exam }));
    const doneSet = new Set(o.done || []);
    const learned = Object.assign({}, o.learned || {});
    const regions = o.regions && o.regions.length ? o.regions : ["devices/xray/cases/chest/"];

    // المدى: من أول يوم لآخر يوم دراسة (قبل الامتحان بيوم)
    let first = today, last;
    if (tplKey === "rush") last = today;
    else if (exam) {
      const left = diff(today, exam.date);
      last = left === 0 ? today : addDays(exam.date, -1);
      if (tplKey !== "course") { const s = addDays(exam.date, -Math.min(tpl.days, Math.max(1, left))); if (diff(today, s) > 0) first = s; }
    } else last = addDays(today, tpl.days - 1);
    const n = diff(first, last) + 1;
    const days = Array.from({ length: n }, (_, i) => ({ date: addDays(first, i), kind: "study", tasks: [] }));
    const lastI = n - 1;
    if (tplKey === "rush") days[0].kind = "rush";
    else if (n >= 2) days[lastI].kind = "recap";

    // يوم راحة بكل أسبوع (7 أيام) بيه 4 أيام دراسة أو أكثر: الجمعة إذا موجودة، لو لا نص الأسبوع
    if (tpl.rest) for (let w = 0; w * 7 < lastI; w++) {
      const idx = []; for (let i = w * 7; i < Math.min(w * 7 + 7, lastI); i++) idx.push(i);
      if (idx.length < 4) continue;
      const r = idx.find((i) => wday(days[i].date) === restDay);
      days[r != null ? r : idx[Math.floor(idx.length / 2)]].kind = "rest";
    }
    const isStudy = (i) => i >= 0 && i < n && days[i].kind === "study";
    const at = (date) => diff(first, date);

    // المراجعات المتباعدة: بيوم راحة ← تنزاح لليوم اللي بعده؛ اللي توصل لآخر يوم ← «المراجعة السريعة» تغطيها
    const reviews = {};
    const addReviews = (id, date) => GAPS.forEach((g) => {
      let i = Math.max(0, at(addDays(date, g)));            // مراجعة فات وقتها (قبل بداية الخطة) ← أول يوم
      while (i < lastI && days[i].kind !== "study") i++;
      if (!isStudy(i)) return;
      (reviews[i] = reviews[i] || []).push([id, g]);
    });
    for (const id in learned) if (L.some((l) => l.id === id)) addReviews(id, learned[id]);

    const queue = interleave(L.filter((l) => !doneSet.has(l.id) && !learned[l.id]));
    const byId = Object.fromEntries(all.map((l) => [l.id, l]));
    const extras = (i) => {
      const x = [mk(days[i], "terms", { title: "المصطلحات المستحقة اليوم", min: EXTRA_MIN, href: "terms/", auto: { terms: 10 } })];
      if (daily >= 60) x.push(mk(days[i], "cases", { title: "حالتين من الأطلس", min: EXTRA_MIN, href: regions[i % regions.length], auto: { cases: 2 } }));
      if (daily >= 60 && (o.mistakes || 0) > 0) x.push(mk(days[i], "mistakes", { title: "أخطائي", sub: `${o.mistakes} سؤال`, min: EXTRA_MIN, href: "quiz/mistakes/", auto: { mistakes: 1 } }));
      return x;
    };
    const overhead = (daily >= 60 ? 2 : 1) * EXTRA_MIN + (daily >= 60 && (o.mistakes || 0) > 0 ? EXTRA_MIN : 0);

    let cur = null, rem = 0, carryQuiz = null;
    const finish = (l, day) => { learned[l.id] = day.date; addReviews(l.id, day.date); };
    for (let i = 0; i < n; i++) {
      const day = days[i];
      if (day.kind !== "study") continue;
      let cap = daily - overhead;
      const due = reviews[i] || [];
      if (due.length > 3) {   // أكثر من 3 باليوم ← الزايد يتأجّل لأول يوم دراسة بعده
        let j = i + 1; while (j < lastI && !isStudy(j)) j++;
        if (isStudy(j)) (reviews[j] = reviews[j] || []).unshift(...due.slice(3));
      }
      due.slice(0, 3).forEach(([id, g]) => {
        const l = byId[id]; if (!l) return;
        day.tasks.push(mk(day, "review", { lec: id, title: `راجع: ${l.title}`, sub: `${short(l)} · +${g} ${g === 1 ? "يوم" : "أيام"} · 10 أسئلة سريعة`, min: REVIEW_MIN, href: l.quiz, auto: { quiz: l.quiz } }));
        cap -= REVIEW_MIN;
      });
      if (carryQuiz) { day.tasks.push(carryQuiz(day)); cap -= carryQuiz.min; carryQuiz = null; }
      let placed = false;
      while ((cur || queue.length) && cap > 0) {
        if (!cur) { cur = queue.shift(); rem = estimate(cur).read; }
        const est = estimate(cur), take = Math.min(rem, cap);
        if (take < Math.min(rem, MIN_PART) && placed) break;   // ما نحط قطعة صغيرة بآخر اليوم
        day.tasks.push(mk(day, "read", { lec: cur.id, title: `اقرأ: ${cur.title}`, sub: short(cur), min: take, href: cur.learn, auto: { read: cur.id } }));
        rem -= take; cap -= take; placed = true;
        if (rem > 0) break;
        const l = cur; cur = null;
        if (est.listen && l.learn && (daily >= 120 || cap >= est.listen + est.quiz)) {
          day.tasks.push(mk(day, "listen", { lec: l.id, title: `اسمع: ${l.title}`, sub: short(l), min: est.listen, href: l.learn + "#listen", auto: { listen: l.id } }));
          cap -= est.listen;
        }
        const qz = (d) => mk(d, "quiz", { lec: l.id, title: `اختبر: ${l.title}`, sub: `${short(l)} · 10 أسئلة`, min: est.quiz, href: l.quiz, auto: { quiz: l.quiz } });
        if (est.quiz && cap >= est.quiz) { day.tasks.push(qz(day)); cap -= est.quiz; }
        else if (est.quiz) { carryQuiz = qz; carryQuiz.min = est.quiz; }
        finish(l, day);
      }
    }
    // الوقت ما كفى: الباقي يتوزّع على أيام الدراسة (فوق الوقت اليومي) ونگول بهدوء
    const partial = cur && rem < estimate(cur).read ? cur : null;   // محاضرة نصها انجدول ← الباقي بس
    const left = (cur ? [cur] : []).concat(queue);
    const studyIdx = days.map((d, i) => (d.kind === "study" ? i : -1)).filter((i) => i >= 0);
    const tight = left.length > 0 && tplKey !== "rush";
    if (tight && studyIdx.length) left.forEach((l, k) => {
      const day = days[studyIdx[k % studyIdx.length]], est = estimate(l);
      day.tasks.push(mk(day, "read", { lec: l.id, title: `اقرأ: ${l.title}`, sub: `${short(l)} · ${l === partial ? "الباقي" : "بسرعة"}`, min: l === partial ? rem : est.read, href: l.learn, auto: { read: l.id } }));
      if (est.quiz) day.tasks.push(mk(day, "quiz", { lec: l.id, title: `اختبر: ${l.title}`, sub: short(l), min: est.quiz, href: l.quiz, auto: { quiz: l.quiz } }));
      learned[l.id] = day.date;
    });
    if (carryQuiz && studyIdx.length) days[studyIdx[studyIdx.length - 1]].tasks.push(carryQuiz(days[studyIdx[studyIdx.length - 1]]));

    // أكثر محاضرة غلط بيها (أقل نتيجة) — لآخر يوم وللمستعجل
    const scored = L.filter((l) => o.scores && o.scores[l.id] != null).sort((a, b) => o.scores[a.id] - o.scores[b.id]);
    const weakest = scored[0] || L[0];
    const recapTasks = (day, budget) => {
      const t = [];
      t.push(mk(day, "recap", { title: "مراجعة سريعة لكل المشمول", sub: `${L.length} محاضرة · الخلاصة بس`, min: Math.max(10, Math.min(Math.round(budget * 0.4), 3 * L.length)), href: L[0] ? L[0].learn + "#summary" : "learn/", auto: null }));
      if (weakest) t.push(mk(day, "missed", { lec: weakest.id, title: `أكثر غلط: ${weakest.title}`, sub: short(weakest) + " · 10 أسئلة", min: 8, href: weakest.quiz, auto: { quiz: weakest.quiz } }));
      t.push(mk(day, "mistakes", { title: "أخطائي", sub: o.mistakes ? `${o.mistakes} سؤال` : "إذا اكو", min: EXTRA_MIN, href: "quiz/mistakes/", auto: { mistakes: 1 } }));
      t.push(mk(day, "terms", { title: "المصطلحات المستحقة اليوم", min: EXTRA_MIN, href: "terms/", auto: { terms: 10 } }));
      return t;
    };
    days.forEach((day, i) => {
      if (day.kind === "study") day.tasks.push(...extras(i));
      else if (day.kind === "recap") day.tasks = recapTasks(day, daily);
      else if (day.kind === "rest") day.tasks = [mk(day, "rest", { title: "يوم راحة", sub: "ارتاح، المخ يرتّب اللي تعلمته", min: 0, href: null, auto: null })];
      else if (day.kind === "rush") {
        // ما عندي وقت: أهم الأفكار (الخلاصة) لكل محاضرة بالأولوية (المشمول، ثم الأضعف)، ثم أكثر الغلط وأخطائي
        const pr = L.slice().sort((a, b) => ((o.scores && o.scores[a.id]) ?? 50) - ((o.scores && o.scores[b.id]) ?? 50));
        let cap = daily - 2 * EXTRA_MIN - 8;
        day.tasks = [];
        for (const l of pr) { if (cap < 3) break; day.tasks.push(mk(day, "focus", { lec: l.id, title: `أهم 3 أفكار: ${l.title}`, sub: short(l) + " · الخلاصة", min: 3, href: l.learn + "#summary", auto: { read: l.id } })); cap -= 3; }
        day.tasks.push(...recapTasks(day, daily).slice(1));
      }
      day.min = day.tasks.reduce((s, t) => s + (t.min || 0), 0);
    });
    if (exam && diff(last, exam.date) > 0) days.push({ date: exam.date, kind: "exam", min: 0, tasks: [mk({ date: exam.date }, "exam", { title: "الامتحان", sub: "بالتوفيق 🤍", min: 0, href: null, auto: null })] });

    // هدف الأسبوع: المحاضرات الجديدة والدقائق خلال 7 أيام من اليوم
    const wk = days.filter((d) => diff(today, d.date) >= 0 && diff(today, d.date) < 7);
    const goal = { lectures: new Set(wk.flatMap((d) => d.tasks.filter((t) => t.kind === "read").map((t) => t.lec))).size, minutes: wk.reduce((s, d) => s + d.min, 0), days: wk.filter((d) => d.kind === "study" || d.kind === "recap" || d.kind === "rush").length };
    return {
      v: 1, made: today, first, last, exam, tight, goal, days, done: {}, history: [],
      opts: { template: tplKey, daily, subjects: o.subjects || [], done: o.done || [], restDay, slot: o.slot || "", exam, regions: o.regions || [], mistakes: o.mistakes || 0, scores: o.scores || {} },
      learned,
    };
  }

  // مهمة: id ثابت من التاريخ والنوع والمحاضرة (حتى ✅ اليدوي يبقى بعد إعادة الترتيب)
  function mk(day, kind, x) {
    const t = Object.assign({ kind, icon: ICON[kind] || "•", title: "", sub: "", min: 0, lec: null, href: null, auto: null }, x);
    t.id = `${day.date}:${kind}:${t.lec || ""}`;
    if (day.tasks) { let k = 1, id = t.id; while (day.tasks.some((y) => y.id === id)) id = `${t.id}:${++k}`; t.id = id; }
    return t;
  }

  // ── ✅ تلقائي: facts = حقائق اليوم من track.js (Track.facts(date)) ──
  // { quizzes:[url…] خلصها اليوم, read:{id:نسبة الأقسام اللي فتحها}, listen:{id:نسبة اللي سمعه}, terms:عدد المراجعات, cases:عدد الحالات, mistakes:عدد اللي تصلّح أو خلص اختبار أخطائي }
  function autoDone(t, f) {
    const a = t && t.auto; if (!a || !f) return false;
    if (a.quiz) return (f.quizzes || []).includes(a.quiz);
    if (a.read) return ((f.read || {})[a.read] || 0) >= 0.6 || (t.kind === "focus" && ((f.read || {})[a.read] || 0) > 0);
    if (a.listen) return ((f.listen || {})[a.listen] || 0) >= 0.6;
    if (a.terms) return (f.terms || 0) >= a.terms;
    if (a.cases) return (f.cases || 0) >= a.cases;
    if (a.mistakes) return (f.mistakes || 0) >= a.mistakes;
    return false;
  }
  const isDone = (plan, t, f) => !!(plan.done && plan.done[t.id]) || autoDone(t, f);

  // ── فاتك يوم؟ نرتّب الباقي من اليوم، بدون لوم ──
  // factsFor(date) ← حقائق ذاك اليوم. المحاضرة اللي خلصت كل قراءتها تبقى «متعلّمة» بتاريخها (حتى تكمل مراجعاتها).
  function rebalance(plan, today = dayKey(), factsFor = () => null) {
    if (!plan || !plan.days) return { plan, changed: false };
    if (plan.exam && plan.exam.date && diff(today, plan.exam.date) < 0) return { plan, changed: false, over: true };   // الامتحان فات ← الخطة خلصت
    const past = plan.days.filter((d) => diff(d.date, today) > 0);
    if (!past.length) return { plan, changed: false };
    const learned = Object.assign({}, plan.learnedDone || {}), missed = new Set();
    past.forEach((d) => {
      const f = factsFor(d.date);
      d.tasks.filter((t) => t.kind === "read").forEach((t) => {
        if (isDone(plan, t, f)) { if (!missed.has(t.lec)) learned[t.lec] = d.date; }
        else { missed.add(t.lec); delete learned[t.lec]; }
      });
    });
    // محاضرة بأجزاء: إذا أي جزء فات، تنعاد كلها (missed يغلب)
    if (!missed.size) {
      const kept = Object.assign({}, plan, { learnedDone: learned });
      return { plan: kept, changed: false };
    }
    const done = new Set([...(plan.opts.done || []), ...Object.keys(learned)]);
    const np = generate(Object.assign({}, plan.opts, { today, lectures: plan._lectures || [], done: [...done], learned }));
    np.history = (plan.history || []).concat(past);
    np.done = plan.done || {};
    np.learnedDone = learned;
    np.rebalanced = { on: today, count: missed.size };
    np._lectures = plan._lectures;
    return { plan: np, changed: true };
  }
  // ملاحظة: الخطة تحتفظ بنسخة مختصرة من المحاضرات (_lectures) حتى إعادة الترتيب ما تحتاج تنزيل شي
  function make(o) {
    const p = generate(o);
    p._lectures = (o.lectures || []).map((l) => ({ id: l.id, subject: l.subject, subject_ar: l.subject_ar, type: l.type, num: l.num, title: l.title, minutes: l.minutes, sections: l.sections, questions: l.questions, learn: l.learn, quiz: l.quiz }));
    return p;
  }
  const restDays = (plan) => new Set(((plan && plan.days) || []).concat((plan && plan.history) || []).filter((d) => d.kind === "rest").map((d) => d.date));

  // ── ⏱️ جلسة 25 + 5: الحالة من وقت البداية (صحيحة حتى لو الصفحة نامت أو انقفلت الشاشة) ──
  function timerState(startedAt, now = Date.now(), work = 25, rest = 5) {
    const cyc = (work + rest) * 60e3, el = Math.max(0, now - startedAt), e = el % cyc;
    const inWork = e < work * 60e3, left = Math.ceil(((inWork ? work * 60e3 : cyc) - e) / 1000);
    return { phase: inWork ? "work" : "rest", left, round: Math.floor(el / cyc) + 1, label: `${pad(Math.floor(left / 60))}:${pad(left % 60)}` };
  }
  function timer(o = {}) {
    let iv = 0, last = null;
    const st = () => LS.get(TKEY, null);
    const tick = () => {
      const s = st(); if (!s) return;
      const x = timerState(s.at, Date.now(), s.work, s.rest);
      if (last && last !== x.phase && o.onPhase) o.onPhase(x);
      last = x.phase; if (o.onTick) o.onTick(x);
    };
    const api = {
      start(work = 25, rest = 5) { LS.set(TKEY, { at: Date.now(), work, rest }); last = null; clearInterval(iv); iv = setInterval(tick, 1000); tick(); },
      stop() { clearInterval(iv); iv = 0; if (hasLS()) try { localStorage.removeItem(TKEY); } catch (e) {} if (o.onTick) o.onTick(null); },
      get running() { return !!st(); },
    };
    if (st()) { iv = setInterval(tick, 1000); tick(); }   // جلسة شغالة من قبل (رجع للصفحة)
    return api;
  }

  // ── التخزين + خطاطيف المزامنة ──
  const load = () => LS.get(KEY, null);
  const save = (p) => { LS.set(KEY, p); if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("plan:change", { detail: p })); return p; };
  const toggle = (taskId, f) => {
    const p = load(); if (!p) return null;
    const t = p.days.flatMap((d) => d.tasks).find((x) => x.id === taskId);
    p.done = p.done || {};
    if (t && f && !p.done[taskId] && autoDone(t, f)) return p;   // خالصة تلقائياً: ما نغيّر شي
    if (p.done[taskId]) delete p.done[taskId]; else p.done[taskId] = Date.now();
    return save(p);
  };
  const exportData = () => ({ plan: load() });
  const importData = (d) => { if (d && d.plan && d.plan.v === 1 && Array.isArray(d.plan.days)) { save(d.plan); return true; } return false; };
  const today = (p, d = dayKey()) => (p && p.days || []).find((x) => x.date === d) || null;

  // ── العرض (صغير، بنفس كلاسات المعاينة: .task .plan-day .chip2) ──
  const href = (root, h) => (h ? esc(root + h) : "");
  function renderToday(el, p, f, o = {}) {
    const root = o.root || "", d = today(p, o.date);
    if (!p) { el.innerHTML = `<p class="sub">ماكو خطة بعد. <a href="#plan" data-goto="plan">🗓️ سوّي خطتك بأقل من دقيقة ‹</a></p>`; return; }
    const note = p.rebalanced && p.rebalanced.on === (o.date || dayKey()) ? `<p class="slim">🙂 فاتك شوية؟ رتّبنا الباقي من جديد على الأيام الجاية.</p>` : "";
    if (!d) {
      const nx = p.days.find((x) => diff(o.date || dayKey(), x.date) > 0);
      el.innerHTML = note + `<p class="sub">${nx ? `خطتك تبدأ ${esc(arDate(nx.date))}.` : "خلصت خطتك 👏 سوّي وحدة جديدة من «خطتي»."}</p>`;
      return;
    }
    const n = d.tasks.filter((t) => isDone(p, t, f)).length;
    el.innerHTML = note + `<h2>خطة اليوم · ${d.min} دقيقة <small class="sub">(${n}/${d.tasks.length})</small></h2>` + d.tasks.map((t) => {
      const ok = isDone(p, t, f), auto = !!t.auto, byAuto = ok && !(p.done && p.done[t.id]);
      // خلصت تلقائياً ← الزر ثابت (✓ تلقائي)؛ غيرها: label ثابت و aria-pressed يتغيّر بس
      return `<div class="task${ok ? " done" : ""}" data-task="${esc(t.id)}"><button type="button" class="ck" aria-pressed="${ok}"${byAuto ? ' aria-disabled="true" title="انحسبت وحدها"' : ""} aria-label="خلصت: ${esc(t.title)}">${ok ? "✓" : ""}</button>` +
        `<span><b>${t.icon} <bdi>${esc(t.title)}</bdi></b><small>${t.min ? t.min + " دقيقة" : ""}${t.sub ? " · " + esc(t.sub) : ""}${byAuto ? " · ✓ انحسبت وحدها" : auto ? " · تتأشّر وحدها" : ""}</small></span>` +
        (t.href ? `<a class="go" href="${href(root, t.href)}">افتح ‹</a>` : "<span></span>") + `</div>`;
    }).join("");
  }
  function renderDays(el, p, o = {}) {
    if (!p) { el.innerHTML = ""; return; }
    const head = `<h2>${esc(TEMPLATES[p.opts.template].label)} · ${DAILY[p.opts.daily]} باليوم</h2>` +
      `<p class="sub">🎯 هدف الأسبوع: ${p.goal.lectures} ${p.goal.lectures === 1 ? "محاضرة" : p.goal.lectures === 2 ? "محاضرتين" : "محاضرات"} · ${Math.round(p.goal.minutes / 6) / 10} ساعة${p.opts.slot ? " · " + esc(p.opts.slot) : ""}</p>` +
      (p.tight ? `<p class="slim">⏳ الوقت ضيّق شوية على كل المحاضرات: زيد الوقت اليومي، أو جرّب «ما عندي وقت».</p>` : "");
    const td = o.date || dayKey();
    el.innerHTML = head + p.days.map((d) => {
      const dt = parse(d.date), lab = d.date === td ? "اليوم" : diff(td, d.date) === 1 ? "باچر" : DAYS[dt.getDay()];
      const items = d.tasks.map((t) => `<li>${t.icon} ${esc(t.title)}${t.min ? ` <small class="sub">${t.min}د</small>` : ""}</li>`).join("");
      return `<div class="plan-day${d.kind === "rest" ? " rest" : d.kind === "exam" ? " exam" : ""}"><span class="d">${lab}<b>${dt.getDate()}</b></span><ul>${items}</ul></div>`;
    }).join("") + `<p class="sub">فاتك يوم؟ نرتّبها من جديد وحدها، بدون لوم.</p>`;
  }
  // الباني: أزرار بس. o = { catalog, exam, root, onMake(plan) }
  function renderBuilder(el, o) {
    const subs = [...new Map(o.catalog.map((l) => [l.subject, l.subject_ar])).entries()];
    const ex = o.exam, sel = { subjects: ex && ex.subject ? [ex.subject] : [], daily: 60, slot: "", template: "week" };
    const chip = (k, v, label, on) => `<button type="button" class="chip2" data-k="${k}" data-v="${esc(v)}" aria-pressed="${on}">${esc(label)}</button>`;
    el.innerHTML = `<div class="qday"><b>🗓️ سوّي خطتك بأقل من دقيقة</b>
      <p class="sub" id="pb-s">المادة</p><div class="chips-row" role="group" aria-labelledby="pb-s">${chip("subj", "", "كل المواد", !sel.subjects.length)}${subs.map(([k, v]) => chip("subj", k, v, sel.subjects.includes(k))).join("")}</div>
      <p class="sub" id="pb-d">${ex ? `📅 الامتحان: ${esc(arDate(ex.date))} (من «الامتحان القادم») · ` : ""}الوقت اليومي</p><div class="chips-row" role="group" aria-labelledby="pb-d">${Object.entries(DAILY).map(([k, v]) => chip("daily", k, v, +k === sel.daily)).join("")}</div>
      <p class="sub" id="pb-w">متى ووين راح تدرس؟</p><div class="chips-row" role="group" aria-labelledby="pb-w">${SLOTS.map((s) => chip("slot", s, s, false)).join("")}</div>
      <p class="sub" id="pb-t">القالب</p><div class="chips-row" role="group" aria-labelledby="pb-t">${Object.entries(TEMPLATES).map(([k, t]) => chip("tpl", k, t.label, k === sel.template)).join("")}</div>
      <button type="button" class="cbtn" data-make>✅ سوّي الخطة</button></div>`;
    el.addEventListener("click", (ev) => {
      const c = ev.target.closest(".chip2[data-k]");
      if (c) {
        const k = c.dataset.k, v = c.dataset.v, row = c.parentElement;
        if (k === "subj") {
          if (!v) sel.subjects = []; else sel.subjects = sel.subjects.includes(v) ? sel.subjects.filter((x) => x !== v) : sel.subjects.concat(v);
          row.querySelectorAll(".chip2").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v ? sel.subjects.includes(x.dataset.v) : !sel.subjects.length));
        } else {
          const f = { daily: "daily", slot: "slot", tpl: "template" }[k];
          sel[f] = k === "daily" ? +v : sel[f] === v && k === "slot" ? "" : v;
          row.querySelectorAll(".chip2").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v) === String(sel[f])));
        }
        return;
      }
      if (ev.target.closest("[data-make]") && o.onMake) o.onMake(Object.assign({}, sel));
    });
    return sel;
  }

  return { KEY, TEMPLATES, DAILY, SLOTS, GAPS, ICON, dayKey, addDays, diff, arDate, catalog, estimate, interleave, examFromCache, pick,
    generate, make, autoDone, isDone, rebalance, restDays, timerState, timer, load, save, toggle, today, renderToday, renderDays, renderBuilder,
    export: exportData, import: importData };
});
