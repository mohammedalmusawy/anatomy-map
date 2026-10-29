// 👤 مساحتي — «اليوم» (29/10/2026 — نايم: ما ينحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// 4 أزرار كبيرة بس: ⏰ ذكّرني · 📍 وين وصلت · 💪 قِس قوتك · 📝 ملاحظة سريعة — وتحتها خطة اليوم، والتبويبات 📈 تقدّمي · 🗓️ خطتي · 📝 ملاحظاتي.
// أول مرة: بطاقة جولة 3 خطوات داخل الصفحة (تخطّي / التالي، مو نافذة تغطي)، وما ترجع إلا بزر «؟».
// كلشي بجهاز الطالب (t:reminders · t:strength · t:tour)، وما ينرسل شي. MySpace.exportAll()/importAll() تجمع كل الوحدات للمزامنة ويّا الحساب
// (window.Account من account.js إذا موجود — نقرا منه الاسم بس، وما نعدّله).
// pickQuiz / scoreQuiz / dueReminders دوال صافية تشتغل بـ node (tests/myspace.test.js).
(function (root, factory) {
  const M = factory();
  if (typeof module === "object" && module.exports) module.exports = M; else root.MySpace = M;
})(typeof self !== "undefined" ? self : this, function () {
  const RKEY = "t:reminders", SKEY = "t:strength", TKEY = "t:tour";
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const G = (k) => (typeof window !== "undefined" ? window[k] : null);

  // ── ⏰ ذكّرني ──
  const WHEN = { h1: "بعد ساعة", night: "الليلة 9", morning: "باچر الصبح", custom: "وقت ثاني" };
  function whenAt(k, now = Date.now(), custom = null) {
    const d = new Date(now);
    if (k === "h1") return now + 3600e3;
    if (k === "night") { d.setHours(21, 0, 0, 0); if (d.getTime() <= now) d.setDate(d.getDate() + 1); return d.getTime(); }
    if (k === "morning") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.getTime(); }
    const t = custom ? Date.parse(custom) : NaN;   // من <input type="datetime-local">
    return Number.isFinite(t) && t > now ? t : now + 3600e3;
  }
  const reminders = () => { const l = LS.get(RKEY, []); return Array.isArray(l) ? l.filter((r) => r && r.id) : []; };
  const saveR = (list) => { LS.set(RKEY, list.slice(-100)); if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("reminders:change")); };
  const rid = (now) => now.toString(36) + Math.random().toString(36).slice(2, 6);
  const rtext = (t) => String(t || "").trim().slice(0, 200) || "وقت الدراسة 📚";
  // extra = { at (وقت محدد), note (ملاحظة «⏰ تذكير» مربوطة) }
  function remind(text, k, now = Date.now(), custom = null, extra = {}) {
    const r = { id: rid(now), t: now, at: +extra.at || whenAt(k, now, custom), text: rtext(text), done: false };
    if (extra.note) r.note = String(extra.note).slice(0, 40);
    const list = reminders().filter((x) => !x.done || now - x.at < 7 * 864e5); list.push(r); saveR(list);
    return r;
  }
  // ✏️ تعديل: النص و/أو الوقت (يرجع «مو خالص» حتى يطلع مرة ثانية)
  function editReminder(id, x = {}, now = Date.now()) {
    const list = reminders(), r = list.find((y) => y.id === id); if (!r) return null;
    if (x.text != null) r.text = rtext(x.text);
    if (x.at != null && Number.isFinite(+x.at)) { r.at = +x.at; r.done = r.at <= now ? r.done : false; }
    saveR(list); return r;
  }
  const removeReminder = (id) => { const list = reminders(), n = list.length, out = list.filter((y) => y.id !== id); if (out.length !== n) saveR(out); return out.length !== n; };
  const dueReminders = (list, now = Date.now()) => list.filter((r) => !r.done && r.at <= now);
  const fmt = (t) => { const d = new Date(t), n = new Date(); const same = d.toDateString() === n.toDateString();
    const tm = new Date(n); tm.setDate(n.getDate() + 1);
    return `${same ? "اليوم" : d.toDateString() === tm.toDateString() ? "باچر" : `${d.getDate()}/${d.getMonth() + 1}`} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  // التنبيه المحلي: بس إذا الطالب سمح قبل (ما نطلب الإذن وحدنا)؛ والصفحة مفتوحة. التنبيه الحقيقي (البوت + الموقع) بعدين.
  // التذكيرات من مكانين: ⏰ ذكّرني (t:reminders) + ملاحظات «⏰ تذكير» (Notes) — نفس الطابور
  const allDue = () => {
    const N = G("Notes");
    const a = reminders().filter((r) => !r.done).map((r) => ({ src: "r", id: r.id, at: r.at, text: r.text }));
    const rs = reminders(), linked = new Set(rs.map((r) => r.note).filter(Boolean)), ats = new Set(rs.map((r) => r.at + "|" + r.text));   // ملاحظة إلها تذكير بالطابور ← ما تتكرر (حتى بجهاز ثاني)
    const b = N ? N.reminders(Date.now()).filter((r) => !linked.has(r.id) && !ats.has(r.at + "|" + String(r.text).slice(0, 200))).map((r) => ({ src: "n", id: r.id, at: r.at, text: r.text })) : [];
    return a.concat(b).sort((x, y) => x.at - y.at);
  };
  const markDone = (x) => {
    if (x.src === "r") { const list = reminders(), r = list.find((y) => y.id === x.id); if (r) { r.done = true; saveR(list); } }
    else { const N = G("Notes"); if (N) N.update(x.id, (n) => { if (n.remind) n.remind.done = true; }); }
  };
  const MAXT = 2 ** 31 - 1;
  let notifTimer = 0;
  function armNotifications() {
    if (typeof window === "undefined") return;
    clearTimeout(notifTimer);
    const q = allDue(), now = Date.now();
    // اللي فات وقتها والصفحة مسدودة ← «فاتك تذكير» مرة وحدة (مو إشعار لكل وحدة)
    const missed = q.filter((x) => x.at <= now - 60e3);
    if (missed.length) { missed.forEach(markDone); document.dispatchEvent(new CustomEvent("reminder:due", { detail: { missed: true, list: missed } })); }
    const next = q.find((x) => x.at > now - 60e3);
    if (!next) return;
    const wait = Math.max(0, next.at - now);
    if (wait > MAXT) { notifTimer = setTimeout(armNotifications, MAXT); return; }   // بعيد ← نعيد الجدولة بس
    notifTimer = setTimeout(() => {
      markDone(next);
      if ("Notification" in window && Notification.permission === "granted") try { new Notification("⏰ تذكير", { body: next.text }); } catch (e) {}
      document.dispatchEvent(new CustomEvent("reminder:due", { detail: { missed: false, list: [next] } }));
      armNotifications();
    }, wait);
  }

  // ── 💪 قِس قوتك: 10 أسئلة من المحاضرات اللي قراها (إذا ماكو ← من كلها)، موزّعة بالتساوي ──
  // lectures = [{id, subject, subject_ar, title, learn, questions:[…]}] (study/data.json)، readIds = محاضرات فتحها/اختبرها
  function pickQuiz(lectures, readIds = [], n = 10, seed = Date.now()) {
    let s = seed >>> 0 || 1;
    const rnd = () => (s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32;
    const read = lectures.filter((l) => readIds.includes(l.id) && (l.questions || []).length);
    const pool = (read.length ? read : lectures.filter((l) => (l.questions || []).length)).map((l) => ({ l, qs: l.questions.slice().sort(() => rnd() - 0.5) }));
    const out = [];
    pool.sort(() => rnd() - 0.5);
    for (let i = 0; out.length < n && pool.some((p) => p.qs.length); i++) {
      const p = pool[i % pool.length];
      if (p.qs.length) out.push({ lec: p.l.id, subject: p.l.subject, q: p.qs.shift() });
    }
    return { items: out, fromRead: read.length > 0 };
  }
  // answers = [{lec, subject, ok}] ← نسبة كل مادة + أضعف محاضرة
  function scoreQuiz(answers, lectures = []) {
    const by = (k) => { const m = {}; answers.forEach((a) => { const x = (m[a[k]] = m[a[k]] || { ok: 0, n: 0 }); x.n++; if (a.ok) x.ok++; }); return m; };
    const subj = by("subject"), lec = by("lec");
    const pct = (x) => Math.round((x.ok / x.n) * 100);
    const weak = Object.entries(lec).sort((a, b) => pct(a[1]) - pct(b[1]) || b[1].n - a[1].n)[0];
    const wl = weak && lectures.find((l) => l.id === weak[0]);
    return { total: answers.length ? Math.round((answers.filter((a) => a.ok).length / answers.length) * 100) : 0,
      subjects: Object.entries(subj).map(([k, x]) => ({ subject: k, name: (lectures.find((l) => l.subject === k) || {}).subject_ar || k, pct: pct(x), n: x.n })),
      weakest: weak && pct(weak[1]) < 100 ? { id: weak[0], pct: pct(weak[1]), title: wl ? wl.title : weak[0], learn: wl ? wl.learn : null } : null };
  }

  // ── المزامنة لاحقاً: كل بيانات الطالب بملف واحد ──
  function exportAll() {
    const P = G("Plan"), T = G("Track"), N = G("Notes");
    return { v: 1, at: Date.now(), plan: P ? P.export().plan : null, track: T ? T.export().track : null, notes: N ? N.export().notes : [],
      reminders: reminders(), strength: LS.get(SKEY, []) };
  }
  function importAll(d) {
    if (!d || d.v !== 1) return false;
    const P = G("Plan"), T = G("Track"), N = G("Notes");
    if (d.plan && P) P.import({ plan: d.plan });
    if (d.track && T) T.import({ track: d.track });
    if (Array.isArray(d.notes) && N) N.import({ notes: d.notes });
    if (Array.isArray(d.reminders)) LS.set(RKEY, d.reminders);
    if (Array.isArray(d.strength)) LS.set(SKEY, d.strength);
    return true;
  }
  const studentName = () => {
    const A = G("Account"); if (!A) return null;
    try { const u = A.state && A.state.student; return (u && u.full_name && String(u.full_name).split(" ")[0]) || null; } catch (e) { return null; }
  };
  const signedIn = () => { const Y = G("Sync"); return !!(Y && Y.state && Y.state.mode === "cloud"); };

  // ── العرض ──
  // o = { root, lectures (من study/data.json ويّا الأسئلة), catalog, ix (Notes.index), examDate, onChange }
  function mountToday(el, o = {}) {
    const root = o.root || "";
    // v2 (29/10): o.tiles يختار الأزرار وترتيبها؛ «timer» زر يفتح/يسد المؤقت (#ptimer بالصفحة) بدل نافذة
    const TILE = {
      remind: `<button type="button" class="big" data-open="remind" aria-expanded="false"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a1.8 1.8 0 0 0 1.8-1.6h-3.6A1.8 1.8 0 0 0 12 21z"/><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/></svg><b>ذكّرني</b><small>بوقت تختاره</small></button>`,
      resume: `<button type="button" class="big" data-open="resume" aria-expanded="false"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg><b>وين وصلت</b><small>كمّل آخر محاضرة</small></button>`,
      test: `<button type="button" class="big" data-open="test" aria-expanded="false"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/></svg><b>قِس قوتك</b><small>10 أسئلة سريعة</small></button>`,
      note: `<button type="button" class="big" data-open="note" aria-expanded="false"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h10l4 4V19.5H5z"/><path d="M15 4.5v4h4M8.5 12.5h7M8.5 16h5"/></svg><b>ملاحظة سريعة</b><small>اكتب أو احچي</small></button>`,
      notes: `<button type="button" class="big" data-panel="pnotes-sec" aria-expanded="false" aria-controls="pnotes-sec"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19M9 8h6M9 11h4"/></svg><b>ملاحظاتي</b><small>اكتب أو احچي</small></button>`,
      timer: `<button type="button" class="big" data-panel="ptimer" aria-expanded="false" aria-controls="ptimer"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M10 3h4"/></svg><b>المؤقت</b><small>جلسة 25 دقيقة</small></button>`,
    };
    el.innerHTML = `<div class="big4" role="group" aria-label="أدواتي">${(o.tiles || ["remind", "resume", "test", "note"]).map((k) => TILE[k] || "").join("")}</div>
      <div class="bigsheet" data-sheet hidden></div><p class="slim" data-toast role="status" aria-live="polite" hidden></p>`;
    const toast = el.querySelector("[data-toast]");
    document.addEventListener("reminder:due", (ev) => {
      const d = ev.detail || {}, l = d.list || [];
      toast.textContent = (d.missed ? `⏰ فاتك ${l.length === 1 ? "تذكير" : l.length + " تذكيرات"}: ` : "⏰ تذكير: ") + l.map((x) => x.text).join(" · ");
      toast.hidden = false;
    });
    const sheet = el.querySelector("[data-sheet]");
    let open = null;
    const close = () => { sheet.hidden = true; sheet.innerHTML = ""; open = null; el.querySelectorAll("[data-open]").forEach((b) => b.setAttribute("aria-expanded", "false")); };
    const show = (k, html) => {
      sheet.innerHTML = `<div class="bsh"><b>${html.title}</b><button type="button" class="ib" data-close-sheet aria-label="سد">✕</button></div>${html.body}`;
      sheet.hidden = false; open = k;
      el.querySelectorAll("[data-open]").forEach((b) => b.setAttribute("aria-expanded", b.dataset.open === k));
      const f = sheet.querySelector("textarea, input, .chip2, .cbtn, a"); if (f) f.focus();
    };
    const local = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const rlist = () => { const list = reminders().filter((r) => !r.done).sort((a, b) => a.at - b.at);
      return list.length ? `<ul class="rrows">${list.map((r) => `<li data-rid="${esc(r.id)}"><span>⏰ <b>${esc(fmt(r.at))}</b> · ${esc(r.text)}</span><span class="ra"><button type="button" class="ib" data-redit aria-label="عدّل التذكير: ${esc(r.text)}">✏️</button><button type="button" class="ib" data-rdel aria-label="امسح التذكير: ${esc(r.text)}">🗑️</button></span></li>`).join("")}</ul>` : `<p class="sub">ماكو تذكيرات جاية.</p>`; };
    let editing = null;
    const views = {
      remind() {
        const perm = typeof Notification !== "undefined" && Notification.permission === "default";
        return { title: "ذكّرني", body: `<p class="sub" id="rm-w">إمتى؟</p><div class="chips-row" role="group" aria-labelledby="rm-w">${Object.entries(WHEN).map(([k, v], i) => `<button type="button" class="chip2" data-when="${k}" aria-pressed="${i === 0}">${v}</button>`).join("")}</div>
          <input type="datetime-local" class="tin" data-custom hidden aria-label="الوقت">
          <div class="row-in"><input type="text" data-voice data-rtext maxlength="200" placeholder="شنو؟ مثلاً: راجع محاضرة الوقاية" aria-label="شنو أذكّرك؟"></div>
          <div class="chips-row"><button type="button" class="cbtn" data-rsave>حفظ التذكير</button><button type="button" class="cbtn ghost" data-rcancel hidden>إلغاء التعديل</button></div>
          <p class="sub" data-rwhere>${signedIn() ? "☁️ التذكير محفوظ بحسابك، ويطلعلك بأي جهاز تدخل منه وقت الموقع مفتوح." : "📱 التذكير محفوظ بهالجهاز بس (أنت مو مسجّل دخول)، ويطلعلك وقت الموقع مفتوح بهالجهاز."} وإذا سمحت بالتنبيهات، يوصلك تنبيه حتى لو كنت بصفحة ثانية بالموقع.</p>
          ${perm ? `<button type="button" class="cbtn ghost" data-perm>🔔 خلّي هالجهاز ينبّهني</button>` : ""}
          <p class="sub" data-rmsg role="status" aria-live="polite"></p><div data-rlist>${rlist()}</div>` };
      },
      resume() {
        const last = LS.get("t:last", null);
        if (!last || !last.url) return { title: "وين وصلت", body: `<p class="sub">بعدك ما فتحت محاضرة. ابدأ من <a href="${esc(root)}learn/">المحاضرات ‹</a></p>` };
        const href = /^https?:/.test(last.url) ? last.url : root + last.url.replace(/^\//, "");
        const tab = { read: "📖 اقرأ", listen: "🎧 اسمع", quiz: "📝 اختبر", terms: "📚 المصطلحات" }[last.tab] || "";
        return { title: "وين وصلت", body: `<a class="resume" href="${esc(href)}"><span><small>آخر شي فتحته${tab ? " · " + tab : ""}</small><b>${esc(last.title)}</b>${last.sub ? `<small>${esc(last.sub)}</small>` : ""}</span><span class="go">كمّل ‹</span></a>` };
      },
      test() { return { title: "قِس قوتك", body: `<p class="sub">10 أسئلة سريعة من المحاضرات اللي قريتها. <b>للمراجعة فقط — مو توقّع لأسئلة الامتحان.</b></p><div data-quiz></div>` }; },
      note() { return { title: "ملاحظة سريعة", body: `<div class="row-in"><textarea rows="3" data-voice data-qn maxlength="2000" placeholder="اكتب أو احچي…" aria-label="الملاحظة"></textarea></div><button type="button" class="cbtn" data-qnsave>حفظ</button><p class="okmsg" data-qnmsg role="status" aria-live="polite"></p>` }; },
    };
    let when = "h1";
    const runQuiz = (box) => {
      const T = G("Track"), st = T ? T.state() : { lec: {} }, prog = LS.get("t:progress", {});
      const readIds = (o.lectures || []).filter((l) => (st.lec[l.id] && Object.keys(st.lec[l.id].open || {}).length) || prog[l.quiz]).map((l) => l.id);
      const { items, fromRead } = pickQuiz(o.lectures || [], readIds, 10);
      if (!items.length) { box.innerHTML = `<p class="sub">ماكو أسئلة بعد.</p>`; return; }
      let i = 0; const ans = [];
      const step = () => {
        if (i >= items.length) {
          const S = scoreQuiz(ans, o.lectures);
          const hist = LS.get(SKEY, []); hist.push({ t: Date.now(), pct: S.total, subjects: S.subjects }); LS.set(SKEY, hist.slice(-50));
          box.innerHTML = `<p class="score">${S.total}%</p>${fromRead ? "" : `<p class="sub">(من كل المحاضرات، لأنك بعدك ما قريت وحدة)</p>`}
            <div class="bars">${S.subjects.map((s) => `<div class="br"><span>${esc(s.name)}</span><span class="pct">${s.pct}%</span><span class="pbar" role="progressbar" aria-valuenow="${s.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(s.name)}"><i style="width:${s.pct}%"></i></span></div>`).join("")}</div>
            ${S.weakest ? `<p class="slim">🎯 أضعف نقطة: ${esc(S.weakest.title)} (${S.weakest.pct}%)</p>${S.weakest.learn ? `<a class="cbtn" href="${esc(root + S.weakest.learn)}">📖 راجعها</a>` : ""}` : `<p class="slim">👏 ولا غلطة!</p>`}
            <button type="button" class="cbtn ghost" data-again>🔁 مرة ثانية</button><p class="sub">للمراجعة فقط — مو توقّع لأسئلة الامتحان.</p>`;
          return;
        }
        const it = items[i], q = it.q;
        box.innerHTML = `<p class="sub" aria-live="polite">سؤال ${i + 1} من ${items.length}</p><p class="qen" dir="ltr">${esc(q.q_en)}</p><p class="qar">${esc(q.q_ar)}</p>
          <div class="qo">${q.options.map((op, k) => `<button type="button" class="qopt" data-k="${k}"><span dir="ltr">${esc(op.en)}</span><small>${esc(op.ar)}</small></button>`).join("")}</div><p class="qw" role="status" aria-live="polite" hidden></p>`;
        box.querySelector(".qopt").focus();
      };
      box.onclick = (ev) => {
        if (ev.target.closest("[data-again]")) { runQuiz(box); return; }
        const b = ev.target.closest(".qopt"); if (!b || b.disabled) return;
        const it = items[i], ok = +b.dataset.k === it.q.answer;
        box.querySelectorAll(".qopt").forEach((x) => { x.disabled = true; if (+x.dataset.k === it.q.answer) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        const w = box.querySelector(".qw"); w.textContent = (ok ? "✅ " : "💡 ") + (it.q.why || ""); w.hidden = false;
        ans.push({ lec: it.lec, subject: it.subject, ok });
        // 📕 أخطائي: نفس قاعدة tools.js (صح مرتين ← ينشال)، بس الصفحة = اختبار المحاضرة نفسها (مو مساحتي)
        const L = (o.lectures || []).find((x) => x.id === it.lec) || {}, mk = (it.q.q_en || "").slice(0, 120), mm = LS.get("t:mistakes", {});
        if (!ok) mm[mk] = { q: it.q, page: L.quiz || "", title: L.title || "", streak: 0, t: Date.now() };
        else if (mm[mk]) { mm[mk].streak = (mm[mk].streak || 0) + 1; if (mm[mk].streak >= 2) delete mm[mk]; }
        LS.set("t:mistakes", mm);
        const nx = document.createElement("button"); nx.type = "button"; nx.className = "cbtn"; nx.textContent = i + 1 < items.length ? "التالي ‹" : "شوف النتيجة";
        nx.onclick = () => { i++; step(); }; w.after(nx); nx.focus();
      };
      step();
    };
    el.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      // v2: زر يفتح/يسد قسم بالصفحة نفسها (المؤقت، ملاحظاتي) — مو نافذة
      if (b.dataset.panel) {
        const pn = document.getElementById(b.dataset.panel); if (!pn) return;
        if (open) close();
        pn.hidden = !pn.hidden; b.setAttribute("aria-expanded", String(!pn.hidden));
        if (!pn.hidden) { const f = pn.querySelector("textarea, button, input"); if (f) f.focus({ preventScroll: true }); pn.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
        return;
      }
      if (b.dataset.open) { if (open === b.dataset.open) { close(); return; } when = "h1"; editing = null; show(b.dataset.open, views[b.dataset.open]()); if (b.dataset.open === "test") runQuiz(sheet.querySelector("[data-quiz]")); return; }
      if (b.hasAttribute("data-close-sheet")) { const k = open; close(); const t = el.querySelector(`[data-open="${k}"]`); if (t) t.focus(); return; }
      if (b.dataset.when) { when = b.dataset.when; sheet.querySelectorAll("[data-when]").forEach((x) => x.setAttribute("aria-pressed", x === b)); sheet.querySelector("[data-custom]").hidden = when !== "custom"; return; }
      const setWhen = (k) => { when = k; sheet.querySelectorAll("[data-when]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.when === k)); sheet.querySelector("[data-custom]").hidden = k !== "custom"; };
      const endEdit = () => { editing = null; sheet.querySelector("[data-rsave]").textContent = "حفظ التذكير"; sheet.querySelector("[data-rcancel]").hidden = true; sheet.querySelector("[data-rtext]").value = ""; setWhen("h1"); };
      if (b.hasAttribute("data-rsave")) {
        const cv = sheet.querySelector("[data-custom]").value, bad = when === "custom" && !(Date.parse(cv) > Date.now()), msg = sheet.querySelector("[data-rmsg]");
        let r;
        if (editing) { r = editReminder(editing, { text: sheet.querySelector("[data-rtext]").value, at: whenAt(when, Date.now(), cv) }); endEdit(); }
        else { r = remind(sheet.querySelector("[data-rtext]").value, when, Date.now(), cv); sheet.querySelector("[data-rtext]").value = ""; }
        if (r) msg.textContent = `✓ ⏰ ${fmt(r.at)} · ${r.text}${bad ? " (الوقت ما كان واضح، خلّيناه بعد ساعة)" : ""}`;
        sheet.querySelector("[data-rlist]").innerHTML = rlist(); armNotifications(); return;
      }
      if (b.hasAttribute("data-rcancel")) { endEdit(); return; }
      if (b.hasAttribute("data-redit")) {
        const id = b.closest("[data-rid]").dataset.rid, r = reminders().find((x) => x.id === id); if (!r) return;
        editing = id; setWhen("custom"); sheet.querySelector("[data-custom]").value = local(r.at);
        const t = sheet.querySelector("[data-rtext]"); t.value = r.text; t.focus();
        sheet.querySelector("[data-rsave]").textContent = "حفظ التعديل"; sheet.querySelector("[data-rcancel]").hidden = false; return;
      }
      if (b.hasAttribute("data-rdel")) {
        const li = b.closest("[data-rid]"), id = li.dataset.rid, next = li.nextElementSibling;
        if (typeof confirm === "function" && !confirm("تمسح هذا التذكير؟")) return;
        removeReminder(id); if (editing === id) endEdit();
        sheet.querySelector("[data-rlist]").innerHTML = rlist(); sheet.querySelector("[data-rmsg]").textContent = "✓ انمسح التذكير.";
        const f = (next && sheet.querySelector(`[data-rid="${CSS.escape(next.dataset.rid)}"] [data-rdel]`)) || sheet.querySelector("[data-rtext]"); if (f) f.focus();
        armNotifications(); return;
      }
      if (b.hasAttribute("data-perm")) { Notification.requestPermission().then(() => b.remove()).catch(() => {}); return; }   // بضغطة الطالب بس
      if (b.hasAttribute("data-qnsave")) {
        const ta = sheet.querySelector("[data-qn]"), N = G("Notes");
        const n = N && N.add({ text: ta.value, kind: "free", ix: o.ix, ctx: N.context() });
        sheet.querySelector("[data-qnmsg]").textContent = n ? "✓ انحفظت بملاحظاتي" : "اكتب شي أول.";
        if (n) ta.value = "";
      }
    });
    // ☁️ وصل شي من جهاز ثاني ← نحدّث قائمة التذكيرات المفتوحة
    document.addEventListener("sync:applied", () => { if (open === "remind" && !editing) { const l = sheet.querySelector("[data-rlist]"); if (l) l.innerHTML = rlist(); } armNotifications(); });
    el.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && open) { const k = open; close(); const t = el.querySelector(`[data-open="${k}"]`); if (t) t.focus(); } });
    armNotifications();
  }

  // ── 👋 جولة أول مرة: 3 خطوات تتخطّى، وما ترجع إلا بزر «؟» ──
  const STEPS = [
    ["👋 هاي صفحتك", "كلشي هنا إلك بس: محاضراتك وخطتك وتقدّمك وملاحظاتك."],
    ["أدواتي تكفيك كل يوم", "ذكّرني، قِس قوتك (10 أسئلة سريعة)، ملاحظاتي، والمؤقت."],
    ["خطتي", "اختار المادة والوقت، وإحنا نرتّبلك يوم بيوم. فاتك يوم؟ تترتّب وحدها."],
  ];
  // v3b: بطاقة جولة داخل الصفحة (مو نافذة تغطي المحتوى) + تأشير خفيف على العنصر اللي تشرحه؛ تتخطّى وما ترجع إلا بزر «؟»
  const COACH = [null, ".big4", "#d-plan > summary, #t-plan"];
  function tour(force = false) {
    if (typeof document === "undefined" || (!force && LS.get(TKEY, false)) || document.querySelector(".tour")) return;
    const d = document.createElement("section");
    d.className = "tourcard tour"; d.setAttribute("aria-labelledby", "tour-t");
    let i = 0;
    const unmark = () => document.querySelectorAll(".coach").forEach((x) => x.classList.remove("coach"));
    const fin = () => { LS.set(TKEY, true); unmark(); d.remove(); };
    const paint = () => {
      unmark(); const t = COACH[i] && document.querySelector(COACH[i]); if (t) t.classList.add("coach");
      d.innerHTML = `<small class="sub">${i + 1} من ${STEPS.length}</small><b id="tour-t">${STEPS[i][0]}</b><span>${STEPS[i][1]}</span>
        <div class="chips-row"><button type="button" class="cbtn" data-next>${i + 1 < STEPS.length ? "التالي" : "يلا نبدأ"}</button><button type="button" class="cbtn ghost" data-skip>تخطّي</button></div>`;
    };
    d.addEventListener("click", (ev) => { if (ev.target.closest("[data-skip]")) fin(); else if (ev.target.closest("[data-next]")) { if (++i >= STEPS.length) fin(); else { paint(); d.querySelector("[data-next]").focus(); } } });
    d.addEventListener("keydown", (ev) => { if (ev.key === "Escape") fin(); });
    const at = document.querySelector("#ltabs") || document.querySelector("#mego-sec");
    if (at && at.parentNode) at.parentNode.insertBefore(d, at); else document.body.appendChild(d);
    paint(); if (force) d.querySelector("[data-next]").focus();
  }

  return { WHEN, whenAt, remind, editReminder, removeReminder, reminders, signedIn, dueReminders, armNotifications, pickQuiz, scoreQuiz, exportAll, importAll, studentName, mountToday, tour, STEPS };
});
