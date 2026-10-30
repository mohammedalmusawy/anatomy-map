// 📝 ملاحظاتي (29/10/2026 — نايمة: ما تنحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// · سؤال اليوم حسب الوقت والحالة: الصبح «شنو ناوي تدرس اليوم؟» (أزرار)، إذا ما نعرف امتحانه «امتحانك الجاي شنو؟»،
//   المسا «شنو أصعب شي واجهك اليوم؟» / «شنو تعلمت اليوم؟» ← الجواب يصير ملاحظة بتاريخها، ويفيد الخطة (Notes.intentToday) والتقدّم.
// · القوالب: 📌 نقطة صعبة | ❓ سؤال للأستاذ | 🧠 ملخص | ⏰ تذكير (Notes.reminders() جاهزة للتنبيهات بعدين).
// · وهو يكتب: نلگى أسماء المحاضرات ومصطلحات المعجم وحالات الأطلس ← روابط «افتح»، ونقترح وسوم (#صدر #أجهزة …) والمادة.
// · بحث، ⭐ مهمة (نفس حقل pin القديم: تنرفع لفوق + ترجع وقت المراجعة وقبل الامتحان — learn.js، 30/10)، لون هادئ، ومن وين انكتبت (صفحة / محاضرة / حالة / مصطلح).
// · «✨ رتّبها» = خطّاف اختياري للمساعد (Notes.assistant) — هسه بس ترتيب محلي، وما يتصل بأي خدمة.
// كلشي بجهاز الطالب (localStorage «t:notes»)، وما ينرسل شي. Notes.export()/import() جاهزة للمزامنة بعدين.
(function (root, factory) {
  const N = factory();
  if (typeof module === "object" && module.exports) module.exports = N; else root.Notes = N;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:notes", AKEY = "t:asked", IKEY = "t:intent", EKEY = "t:exam-guess", MAX = 500;
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // تطبيع للبحث والمطابقة: بلا تشكيل، الألف/الياء/التاء المربوطة موحّدة، الإنكليزي صغير
  const norm = (s) => String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).toLowerCase().replace(/[ً-ْٰـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();

  const KINDS = {
    hard: { icon: "📌", label: "نقطة صعبة" }, ask: { icon: "❓", label: "سؤال للأستاذ" }, sum: { icon: "🧠", label: "ملخص" },
    rem: { icon: "⏰", label: "تذكير" }, free: { icon: "📝", label: "ملاحظة" }, answer: { icon: "💬", label: "جواب سؤال اليوم" },
  };
  const REMIND = { tomorrow: "باچر الصبح", d3: "بعد 3 أيام", exam: "قبل الامتحان بيوم" };

  // ── الوسوم والمادة ──
  const TAGS = {
    "#صدر": ["الصدر", "صدري", "رئه", "رئتين", "جنب", "ضلع", "اضلاع", "قلب", "chest", "lung", "pneumo", "pleura", "rib", "thorax", "cardiac", "heart", "effusion"],
    "#بطن": ["بطن", "امعاء", "كبد", "كليه", "مراره", "abdomen", "bowel", "liver", "kidney", "renal", "gallbladder", "appendic", "obstruction"],
    "#فقرات": ["فقرات", "فقره", "عمود فقري", "spine", "vertebra", "cervical", "lumbar", "disc"],
    "#كسور": ["كسر", "كسور", "خلع", "fracture", "dislocation"],
    "#رأس": ["الراس", "دماغ", "جمجمه", "skull", "brain", "sinus"],
    "#أطراف": ["رسغ", "كوع", "كتف", "ركبه", "القدم", "كاحل", "ورك", "wrist", "elbow", "shoulder", "knee", "foot", "ankle", "hip", "femur"],
    "#أجهزة": ["جهاز", "انبوب", "كاثود", "انود", "فلتر", "tube", "anode", "cathode", "kvp", "filament", "generator", "grid", "detector", "heel effect", "collimat"],
    "#وقاية": ["وقايه", "جرعه", "درع", "رصاص", "dose", "shield", "alara", "sievert", "dosimeter", "ionizing"],
    "#تشريح": ["تشريح", "العظم", "عظام", "مفصل", "anatomy", "bone", "joint", "pelvis", "sacrum"],
    "#وضعيات": ["وضعيه", "اسقاط", "position", "projection", "supine", "prone", "oblique", "decubitus", "plane"],
    "#ملون": ["ملون", "باريوم", "صبغه", "contrast", "barium", "iodine"],
    "#مفراس": ["مفراس", "مقطعي", "ct", "hounsfield", "slice"],
    "#امتحان": ["امتحان", "exam"],
  };
  const TAG_SUBJ = { "#أجهزة": "equipment", "#وقاية": "protection", "#تشريح": "anatomy", "#وضعيات": "radiography", "#ملون": "examinations", "#مفراس": "ct" };
  const NT = Object.fromEntries(Object.entries(TAGS).map(([t, ws]) => [t, ws.map(norm)]));
  // كلمة إنكليزية قصيرة (ct، rib) لازم تكون كلمة كاملة؛ العربي جزء كلمة يكفي (الصدر، بالرئة)
  // الكلمة القصيرة (3 حروف أو أقل: ct، rib، قلب، جنب) لازم تكون كلمة كاملة (ويسمح بـ «ال/بال/وال» قبل العربي)؛ الأطول جزء كلمة يكفي
  const has = (nt, w) => (/^[a-z0-9 ]+$/.test(w) ? new RegExp(`(^| )${w}${w.length <= 3 ? "( |$)" : ""}`).test(nt)
    : w.length <= 3 ? new RegExp(`(^| )(و?(بال|لل|ال|ب|ل))?${w}( |$)`).test(nt) : nt.includes(w));
  function tags(text) {
    const nt = " " + norm(text) + " ";
    const out = Object.keys(NT).filter((t) => NT[t].some((w) => has(nt.trim(), w)));
    (String(text).match(/#[؀-ۿA-Za-z0-9_]{2,20}/g) || []).forEach((t) => { if (!out.includes(t)) out.push(t); });   // وسوم كتبها هو
    return out;
  }
  function classify(text, links = [], tg = tags(text)) {
    const votes = {};
    links.forEach((l) => { if (l.subject) votes[l.subject] = (votes[l.subject] || 0) + (l.type === "lecture" ? 3 : 1); });
    tg.forEach((t) => { if (TAG_SUBJ[t]) votes[TAG_SUBJ[t]] = (votes[TAG_SUBJ[t]] || 0) + 1; });
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }

  // ── الفهرس: المحاضرات (Plan.catalog) + المعجم (lex.json) + حالات الأطلس [{slug, en, ar, href}] ──
  function index({ catalog = [], lex = {}, cases = [] } = {}) {
    const lec = catalog.map((l) => ({ l, ar: norm(l.title), en: norm(l.title_en), sar: norm(l.subject_ar) }));
    const terms = [];
    for (const k in lex) {
      // «Cathode / Anode» ← كل وحدة لحالها كمان (الكاثود، الأنود)
      const ens = String(lex[k][0]).replace(/\([^)]*\)/g, " ").split("/"), ars = String(lex[k][1]).split("/");
      const forms = (a) => [...new Set([a.join(" "), ...(a.length > 1 ? a : [])].map(norm).filter((x) => x.length >= 4))];
      const E = forms(ens), A = forms(ars);
      for (let i = 0; i < Math.max(E.length, A.length); i++) terms.push({ k, en: E[i] || "", ar: A[i] || "", title: lex[k][0] });
    }
    const cs = cases.map((c) => ({ c, en: norm(c.en), ar: norm(c.ar) }));
    return { lec, terms, cs };
  }
  // يرجّع روابط «افتح» (المحاضرة ← الحالة ← المصطلح)، 6 بالكثير، بلا تكرار
  function detect(text, ix) {
    if (!ix || !text) return [];
    const nt = " " + norm(text) + " ", out = [], seen = new Set();
    const push = (x) => { if (!seen.has(x.type + x.key) && out.length < 6) { seen.add(x.type + x.key); out.push(x); } };
    const word = (w) => w && nt.includes(" " + w + " ");
    // «الوقاية نظري م3» / «الأجهزة عملي م1»
    const m = [...nt.matchAll(/(نظري|عملي) ?م ?(\d+)/g)];
    ix.lec.forEach(({ l, ar, en, sar }) => {
      const byNum = m.some((x) => (x[1] === "عملي") === (l.type === "practical") && +x[2] === l.num) &&
        sar.split(" ").filter((w) => w.length >= 4).some((w) => nt.includes(w.replace(/^ال/, "")));
      if ((ar.length >= 6 && nt.includes(ar)) || (en.length >= 8 && nt.includes(en)) || byNum)
        push({ type: "lecture", key: l.id, title: l.title, href: l.learn, subject: l.subject });
    });
    const names = new Set();   // نفس الحالة بجهازين (أشعة + مفراس) ← رابط واحد
    ix.cs.forEach(({ c, en, ar }) => { if (((en.length >= 5 && nt.includes(en)) || (ar.length >= 5 && nt.includes(ar))) && !names.has(en)) { names.add(en); push({ type: "case", key: c.slug, title: c.ar || c.en, href: c.href, subject: null }); } });
    // الأطول أولاً، والقصير اللي داخل مصطلح أطول انلگى ما يتكرر («Anode» داخل «Anode heel effect»)
    const got = [];
    ix.terms.filter((t) => word(t.en) || (t.ar && nt.includes(t.ar))).sort((a, b) => (b.en || b.ar).length - (a.en || a.ar).length)
      .forEach((t) => { const f = t.en || t.ar; if (got.some((g) => g.includes(f))) return; got.push(f); push({ type: "term", key: t.k, title: t.title, href: null, subject: null }); });
    return out;
  }

  // ── سؤال اليوم ──
  // s = { hour, today, exam (معروف؟), asked:{qid:date} }
  const Q = {
    plan: { text: "☀️ شنو ناوي تدرس اليوم؟", chips: ["محاضرة", "صدر", "بطن", "فقرات", "كسور", "امتحان", "مراجعة"], kind: "answer" },
    exam: { text: "📅 امتحانك الجاي شنو؟", chips: null, kind: "answer" },   // الأزرار = المواد (من الصفحة)
    hard: { text: "🌙 شنو أصعب شي واجهك اليوم؟", chips: null, kind: "hard" },
    learned: { text: "🌙 شنو تعلمت اليوم؟", chips: null, kind: "sum" },
  };
  function question(s = {}) {
    const h = s.hour == null ? new Date().getHours() : s.hour, today = s.today || dayKey(), asked = s.asked || {};
    const fresh = (id, days = 1) => !asked[id] || (Date.parse(today) - Date.parse(asked[id])) / 864e5 >= days;
    const order = [];
    if (!s.exam) order.push(["exam", 7]);                              // مرة بالأسبوع إذا ما نعرف امتحانه
    if (h >= 5 && h < 13) order.unshift(["plan", 1]);
    if (h >= 18 || h < 3) order.push([Number(today.slice(8)) % 2 ? "hard" : "learned", 1], ["hard", 1], ["learned", 1]);
    else if (h >= 13) order.push(["learned", 1]);
    const hit = order.find(([id, d]) => fresh(id, d));
    return hit ? Object.assign({ id: hit[0] }, Q[hit[0]]) : null;
  }

  // ── التخزين ──
  const all = () => LS.get(KEY, []);
  const put = (list) => { LS.set(KEY, list.slice(-MAX)); if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("notes:change")); };
  // n = { text, kind, ctx:{kind,url,title}, remind:"tomorrow"|"d3"|"exam", examDate, color, ix (الفهرس) }
  function add(n, now = Date.now()) {
    const text = String(n.text || "").trim().slice(0, 2000); if (!text) return null;
    const links = (Array.isArray(n.links) ? n.links.filter((l) => l && l.type && l.key) : []).concat(detect(text, n.ix)).filter((l, i, a) => a.findIndex((y) => y.type === l.type && y.key === l.key) === i).slice(0, 6), tg = tags(text);
    const note = { id: now.toString(36) + Math.random().toString(36).slice(2, 6), t: now, d: dayKey(new Date(now)), text, kind: KINDS[n.kind] ? n.kind : "free",
      q: n.q || null, pin: false, color: n.color == null ? (tg.length ? (Object.keys(TAGS).indexOf(tg[0]) % 3) + 1 : 0) : +n.color,
      tags: tg, subject: classify(text, links, tg), links, ctx: n.ctx || null, remind: null };
    if (note.kind === "rem") note.remind = { at: remindAt(n.remind || "tomorrow", now, n.examDate), label: REMIND[n.remind || "tomorrow"], done: false };
    // ⏰ نفس الطابور مال «ذكّرني» (وبالحساب ← جدول reminders)، مربوط بالملاحظة
    const MS = typeof self !== "undefined" && self.MySpace;
    if (note.remind && !n.list && MS && MS.remind) MS.remind(text.slice(0, 200), "custom", now, null, { at: note.remind.at, note: note.id });
    if (n.list) { n.list.push(note); return note; }
    const list = all(); list.push(note); put(list); return note;
  }
  function remindAt(k, now = Date.now(), examDate = null) {
    const d = new Date(now);
    if (k === "exam" && examDate) { const [y, m, dd] = examDate.split("-").map(Number); return new Date(y, m - 1, dd - 1, 18, 0).getTime(); }
    d.setDate(d.getDate() + (k === "d3" ? 3 : 1)); d.setHours(9, 0, 0, 0); return d.getTime();
  }
  const update = (id, f) => { const list = all(), n = list.find((x) => x.id === id); if (!n) return null; f(n); put(list); return n; };
  const pin = (id) => update(id, (n) => { n.pin = !n.pin; });
  const color = (id) => update(id, (n) => { n.color = ((n.color || 0) + 1) % 4; });
  const remove = (id) => {
    put(all().filter((x) => x.id !== id));
    const MS = typeof self !== "undefined" && self.MySpace;   // التذكير المربوط بيها ينمسح وياها
    if (MS && MS.reminders) MS.reminders().filter((r) => r.note === id).forEach((r) => MS.removeReminder(r.id));
  };   // ملاحظة الطالب نفسه، بجهازه، وبطلب منه
  // البحث: المثبّتة أول، ثم الأحدث
  function search(q, list = all()) {
    const nq = norm(q);
    return list.filter((n) => !nq || norm(n.text + " " + n.tags.join(" ") + " " + (n.links || []).map((l) => l.title).join(" ")).includes(nq))
      .sort((a, b) => (b.pin - a.pin) || (b.t - a.t));
  }
  // التذكيرات الجاية (للتنبيهات بعدين)
  const reminders = (now = Date.now(), list = all()) => list.filter((n) => n.kind === "rem" && n.remind && !n.remind.done).map((n) => ({ id: n.id, at: n.remind.at, text: n.text, due: n.remind.at <= now })).sort((a, b) => a.at - b.at);

  // جواب سؤال اليوم ← ملاحظة + يفيد الخطة: «شنو ناوي» ← t:intent، «امتحانك الجاي» ← t:exam-guess
  function answer(qid, text, o = {}) {
    const today = o.today || dayKey(), asked = LS.get(AKEY, {}); asked[qid] = today; LS.set(AKEY, asked);
    if (qid === "plan") LS.set(IKEY, { d: today, topic: text });
    if (qid === "exam") LS.set(EKEY, { d: today, subject: o.subject || null, text });
    const q = Q[qid] || { text: "", kind: "free" };
    return add({ text: o.chip ? `${q.text.replace(/^\S+\s/, "")} ${text}` : text, kind: q.kind, q: qid, ix: o.ix, ctx: o.ctx });
  }
  const intentToday = (today = dayKey()) => { const x = LS.get(IKEY, null); return x && x.d === today ? x.topic : null; };
  const examGuess = () => LS.get(EKEY, null);

  // ── من وين انكتبت (السياق) ──
  // el (اختياري) = العنصر اللي انكتبت منه الملاحظة ← نعرف القسم (section[id^=r-s] / .lsec[id])
  function context(el) {
    if (typeof document === "undefined") return null;
    try { if (document.body.dataset.lecture) {
      const L = JSON.parse(document.body.dataset.lecture), c = { kind: "lecture", url: "/" + String(L.url || "").replace(/^\//, ""), title: L.title };
      const m = String(L.url || "").match(/learn\/([^/]+)\/(theory|practical)\/(\d+)\//); if (m) c.lec = `${m[1]}/${m[2]}/${m[3]}`;
      const sec = el && el.closest && el.closest("section[id^='r-s'], .lsec[id]");
      if (sec) { c.sec = sec.id.replace(/^r-/, ""); const h = sec.querySelector("h2 .ar, h3 .ar, h2, h3, summary"); c.secTitle = h ? h.textContent.trim().slice(0, 80) : ""; }
      return c;
    } } catch (e) {}
    const pop = document.querySelector(".tpop:not([hidden]) b");
    if (pop) return { kind: "term", url: location.pathname, title: pop.textContent };
    const c = location.hash.startsWith("#c-") && document.getElementById(location.hash.slice(1));
    if (c) return { kind: "case", url: location.pathname + location.hash, title: (c.querySelector("h3 .ar") || c.querySelector("h3") || {}).textContent || "" };
    return { kind: "page", url: location.pathname, title: document.title };
  }
  const CTX = { lecture: "من محاضرة", case: "من حالة", term: "من مصطلح", page: "من صفحة" };

  // ── ✨ رتّبها ──
  // 🔌 STUB (نايم): بعد الموافقة، Notes.assistant = async (text) => نص مرتّب ← من المساعد الموجود (smart.js / study-assistant).
  // هسه: ترتيب محلي بس (نقاط سطر سطر + وسوم) — ما يتصل بأي خدمة مدفوعة ولا ينرسل شي.
  let assistant = null;
  async function tidy(text) {
    if (typeof assistant === "function") { try { const r = await assistant(String(text)); if (r) return String(r); } catch (e) {} }
    const parts = String(text).split(/[\n.،؛!?؟]+/).map((x) => x.trim()).filter((x) => x.length > 1);
    const tg = tags(text).filter((t) => !String(text).includes(t));
    return (parts.length > 1 ? parts.map((p) => "• " + p).join("\n") : parts.join("")) + (tg.length ? "\n" + tg.join(" ") : "");
  }

  // ── العرض (نفس كلاسات المعاينة: .note .qday .chips-row .row-in) ──
  // روابط نسبية بس (أو https)، حتى بيانات مستوردة ما تحقن javascript:
  const safeHref = (h) => { h = String(h || ""); return /^[a-z][a-z0-9+.-]*:/i.test(h) && !/^https:\/\//i.test(h) ? "#" : h; };
  const clean = (n) => Object.assign({}, n, { text: String(n.text).slice(0, 2000), kind: KINDS[n.kind] ? n.kind : "free", color: Math.max(0, Math.min(3, (n.color | 0))),
    pin: !!n.pin, t: +n.t || Date.now(), d: /^\d{4}-\d{2}-\d{2}$/.test(n.d) ? n.d : dayKey(new Date(+n.t || Date.now())),
    tags: (Array.isArray(n.tags) ? n.tags : []).map(String).slice(0, 12), links: (Array.isArray(n.links) ? n.links : []).filter((l) => l && l.type && l.key).map((l) => ({ type: String(l.type), key: String(l.key), title: String(l.title || ""), href: l.href ? safeHref(l.href) : null, subject: l.subject || null })),
    ctx: n.ctx && typeof n.ctx === "object" ? Object.assign({ kind: String(n.ctx.kind || ""), url: String(n.ctx.url || ""), title: String(n.ctx.title || "") },
      n.ctx.lec ? { lec: String(n.ctx.lec).slice(0, 60) } : {}, /^s\d{1,3}$/.test(n.ctx.sec || "") ? { sec: n.ctx.sec, secTitle: String(n.ctx.secTitle || "").slice(0, 80) } : {}, n.ctx.key ? { key: String(n.ctx.key).slice(0, 80) } : {}) : null,
    remind: n.remind && typeof n.remind === "object" ? { at: +n.remind.at || 0, label: String(n.remind.label || ""), done: !!n.remind.done } : null });
  // من وين انكتبت ← رابط يرجعه لنفس المكان (القسم نفسه إذا معروف). روابط داخل الموقع بس.
  const ctxLink = (n) => { const c = n.ctx; if (!c || !c.url || !/^\/[^/]/.test(c.url) || c.kind === "page") return "";
    const lab = c.kind === "lecture" ? (c.sec ? `القسم: ${c.secTitle || c.sec}` : c.title) : c.title;
    return `<a href="${esc(c.url.split("#")[0] + (c.sec ? "#r-" + c.sec : c.kind === "case" && c.url.includes("#") ? "#" + c.url.split("#")[1] : ""))}">↩️ ${esc(CTX[c.kind] || "")}: ${esc(lab || "")}</a>`; };
  function renderNote(n, root = "") {
    n = clean(n);
    const k = KINDS[n.kind] || KINDS.free, when = new Date(n.t);
    const ago = n.d === dayKey() ? `اليوم ${pad(when.getHours())}:${pad(when.getMinutes())}` : n.d;
    const links = (n.links || []).map((l) => l.type === "term"
      ? `<span class="tm" tabindex="0" role="button" data-k="${esc(l.key)}" dir="ltr">${esc(l.title)} 🔊</span>`
      : l.href ? `<a href="${esc(/^https:/.test(l.href) || l.href === "#" ? l.href : root + l.href)}">افتح: ${esc(l.title)} ‹</a>` : "").join("");
    return `<div class="note c${n.color || 0}" data-note="${esc(n.id)}"><div class="nh"><span>${n.pin ? "⭐ مهمة · " : ""}${k.icon} ${k.label}${n.ctx ? " · " + esc(CTX[n.ctx.kind] || "") : ""}${n.remind ? ` · ⏰ ${esc(n.remind.label)}` : ""}</span><span>${esc(ago)}</span></div>` +
      `<p dir="auto">${esc(n.text).replace(/\n/g, "<br>")}</p><div class="tags">${(n.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}${links}${ctxLink(n)}</div>` +
      `<div class="chips-row"><button type="button" class="ib" data-act="pin" aria-pressed="${!!n.pin}" aria-label="علّمها مهمة" title="⭐ مهمة: ترجعلك وقت المراجعة وقبل الامتحان">⭐</button>` +
      `<button type="button" class="ib" data-act="color" aria-label="غيّر اللون">🎨</button><button type="button" class="ib" data-act="del" aria-label="امسح الملاحظة">🗑️</button></div></div>`;
  }
  // o = { root, ix, subjects:[[key,name]], examKnown, examDate }
  function mount(el, o = {}) {
    let kind = "free", rem = "tomorrow", q = question({ exam: o.examKnown, asked: LS.get(AKEY, {}) });
    const chips = (q && (q.id === "exam" ? (o.subjects || []).map(([, n]) => n) : q.chips)) || [];
    el.innerHTML = (q ? `<div class="qday" data-q="${q.id}"><b id="nq-t">${esc(q.text)}</b>${chips.length ? `<div class="chips-row" role="group" aria-labelledby="nq-t">${chips.map((c, i) => `<button type="button" class="chip2" data-ans="${i}" aria-pressed="false">${esc(c)}</button>`).join("")}</div>` : ""}</div>` : "") +
      `<div class="qday"><b>📝 ملاحظة جديدة</b><div class="row-in"><textarea rows="3" data-voice data-n-text maxlength="2000" placeholder="اكتب أو احچي…" aria-label="نص الملاحظة"></textarea></div>
      <div class="chips-row" role="group" aria-label="نوع الملاحظة">${["hard", "ask", "sum", "rem"].map((k) => `<button type="button" class="chip2" data-kind="${k}" aria-pressed="false">${KINDS[k].icon} ${KINDS[k].label}</button>`).join("")}</div>
      <div class="chips-row" data-rem hidden role="group" aria-label="وقت التذكير">${Object.entries(REMIND).filter(([k]) => k !== "exam" || o.examDate).map(([k, v]) => `<button type="button" class="chip2" data-remk="${k}" aria-pressed="${k === rem}">${v}</button>`).join("")}</div>
      <div class="tags" data-n-hint aria-live="polite"></div>
      <div class="chips-row"><button type="button" class="cbtn" data-n-save>حفظ</button><button type="button" class="cbtn ghost" data-n-tidy>✨ رتّبها</button></div></div>
      <div class="row-in"><input type="text" data-voice data-n-q placeholder="🔍 دوّر بملاحظاتك" aria-label="دوّر بملاحظاتك"></div><div data-n-list></div>`;
    const $ = (s) => el.querySelector(s), ta = $("[data-n-text]");
    const list = () => { const xs = search($("[data-n-q]").value); $("[data-n-list]").innerHTML = xs.length ? xs.map((n) => renderNote(n, o.root)).join("") : `<p class="sub">ماكو ملاحظات بعد. أول وحدة تكتبها تطلع هنا.</p>`; };
    let tmr = 0;
    ta.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(() => {
      const t = ta.value, ls = detect(t, o.ix), tg = tags(t), s = classify(t, ls, tg), sn = (o.subjects || []).find(([k]) => k === s);
      $("[data-n-hint]").innerHTML = tg.map((x) => `<span>${esc(x)}</span>`).join("") + (sn ? `<span>📚 ${esc(sn[1])}</span>` : "") +
        ls.map((l) => l.type === "term" ? `<span class="tm" tabindex="0" role="button" data-k="${esc(l.key)}" dir="ltr">${esc(l.title)} 🔊</span>` : `<a href="${esc((o.root || "") + l.href)}">افتح: ${esc(l.title)} ‹</a>`).join("");
    }, 250); });
    $("[data-n-q]").addEventListener("input", list);
    document.addEventListener("sync:applied", () => { if (!el.contains(document.activeElement) || document.activeElement === document.body) list(); else setTimeout(list, 0); });
    el.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button"); if (!t || !el.contains(t)) return;
      if (t.dataset.ans != null) {
        const qid = t.closest("[data-q]").dataset.q, txt = t.textContent, sub = qid === "exam" ? (o.subjects || [])[+t.dataset.ans] : null;
        answer(qid, txt, { chip: true, ix: o.ix, subject: sub && sub[0], ctx: context() });
        t.closest(".qday").innerHTML = `<b>✓ ${esc(txt)}</b><span class="sub">انحفظت بملاحظاتك${qid === "plan" ? "، والخطة تبدأ بيها" : ""}.</span>`;
        list(); return;
      }
      if (t.dataset.kind) {
        kind = kind === t.dataset.kind ? "free" : t.dataset.kind;
        el.querySelectorAll("[data-kind]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.kind === kind));
        $("[data-rem]").hidden = kind !== "rem"; return;
      }
      if (t.dataset.remk) { rem = t.dataset.remk; el.querySelectorAll("[data-remk]").forEach((x) => x.setAttribute("aria-pressed", x === t)); return; }
      if (t.hasAttribute("data-n-tidy")) { if (ta.value.trim()) { t.disabled = true; ta.value = await tidy(ta.value); t.disabled = false; ta.dispatchEvent(new Event("input")); } return; }
      if (t.hasAttribute("data-n-save")) {
        const qd = el.querySelector(".qday[data-q]"), qid = qd && !qd.querySelector(".chip2") && kind === "free" ? qd.dataset.q : null;   // سؤال المسا بلا أزرار ← الملاحظة جوابه
        const n = qid ? answer(qid, ta.value, { ix: o.ix, ctx: context() }) : add({ text: ta.value, kind, remind: rem, examDate: o.examDate, ix: o.ix, ctx: context() });
        if (n) { ta.value = ""; $("[data-n-hint]").innerHTML = ""; if (qid && qd) qd.remove(); list(); }
        return;
      }
      const card = t.closest("[data-note]"); if (!card) return;
      const id = card.dataset.note, a = t.dataset.act;
      const nextId = card.nextElementSibling && card.nextElementSibling.dataset.note;
      if (a === "pin") pin(id); else if (a === "color") color(id);
      else if (a === "del" && (typeof confirm !== "function" || confirm("تمسح هاي الملاحظة؟"))) remove(id);
      list();
      // الفوكس يرجع لنفس الزر (أو للملاحظة اللي بعدها إذا انمسحت)
      const back = el.querySelector(`[data-note="${id}"] [data-act="${a}"]`) || (nextId && el.querySelector(`[data-note="${nextId}"] [data-act]`)) || $("[data-n-q]");
      if (back) back.focus();
    });
    list();
  }

  // ── 📝 ملاحظة من مكانها (صفحة محاضرة / مصطلح بالمعاينة): صندوق صغير تحت الزر ──
  // o = { ctx, links:[{type,key,title}], prefill, ix, onSave }
  function quick(anchor, o = {}) {
    if (typeof document === "undefined") return null;
    const old = document.querySelector(".nquick"); if (old) { const same = old.dataset.for === (o.forId || ""); old.remove(); if (same && o.forId) return null; }
    const box = document.createElement("div"); box.className = "nquick"; box.dataset.for = o.forId || ""; box.setAttribute("role", "group"); box.setAttribute("aria-label", "ملاحظة جديدة");
    box.innerHTML = `<div class="row-in"><textarea rows="2" data-voice maxlength="2000" placeholder="اكتب أو احچي…" aria-label="الملاحظة"></textarea></div>
      <div class="chips-row"><button type="button" class="cbtn" data-qs>حفظ بملاحظاتي</button><button type="button" class="cbtn ghost" data-qx>إلغاء</button></div><p class="sub" role="status" aria-live="polite"></p>`;
    if (o.into) o.into.appendChild(box); else anchor.after(box);
    const back = () => { const r = o.returnTo || anchor; if (r && r.focus) r.focus(); };
    const ta = box.querySelector("textarea"), msg = box.querySelector("[role=status]");
    if (o.prefill) ta.value = o.prefill;
    box.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-qx]")) { box.remove(); back(); return; }
      if (!ev.target.closest("[data-qs]")) return;
      const n = add({ text: ta.value, kind: "free", ctx: o.ctx || context(anchor), links: o.links, ix: o.ix });
      if (!n) { msg.textContent = "اكتب شي أول."; ta.focus(); return; }
      msg.textContent = "✓ انحفظت بملاحظاتي."; ta.value = ""; if (o.onSave) o.onSave(n);
      setTimeout(() => { if (box.isConnected) { box.remove(); back(); } }, 1400);
    });
    box.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { box.remove(); back(); } });
    ta.focus(); return box;
  }

  return { quick, KEY, KINDS, REMIND, TAGS, norm, tags, classify, index, detect, question, add, update, pin, color, remove, search, reminders, remindAt,
    answer, intentToday, examGuess, context, tidy, renderNote, mount, all,
    get assistant() { return assistant; }, set assistant(f) { assistant = typeof f === "function" ? f : null; },
    export: () => ({ notes: all() }),
    import: (d) => { if (d && Array.isArray(d.notes)) { put(d.notes.filter((n) => n && n.id && n.text).map((n) => Object.assign(clean(n), { id: String(n.id).slice(0, 40), q: n.q ? String(n.q) : null, subject: n.subject ? String(n.subject) : null }))); return true; } return false; } };
});
