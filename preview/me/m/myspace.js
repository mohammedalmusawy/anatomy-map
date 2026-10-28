// 👤 مساحتي — «اليوم» (29/10/2026 — نايم: ما ينحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// 4 أزرار كبيرة بس: ⏰ ذكّرني · 📍 وين وصلت · 💪 قِس قوتك · 📝 ملاحظة سريعة — وتحتها خطة اليوم، والتبويبات 📈 تقدّمي · 🗓️ خطتي · 📝 ملاحظاتي.
// أول مرة: جولة 3 خطوات (تخطّي / التالي)، وما ترجع إلا بزر «؟».
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
  const reminders = () => LS.get(RKEY, []);
  function remind(text, k, now = Date.now(), custom = null) {
    const r = { id: now.toString(36), t: now, at: whenAt(k, now, custom), text: String(text || "").trim().slice(0, 200) || "وقت الدراسة 📚", done: false };
    const list = reminders().filter((x) => !x.done || now - x.at < 7 * 864e5); list.push(r); LS.set(RKEY, list.slice(-100));
    return r;
  }
  const dueReminders = (list, now = Date.now()) => list.filter((r) => !r.done && r.at <= now);
  const fmt = (t) => { const d = new Date(t), n = new Date(); const same = d.toDateString() === n.toDateString();
    const tm = new Date(n); tm.setDate(n.getDate() + 1);
    return `${same ? "اليوم" : d.toDateString() === tm.toDateString() ? "باچر" : `${d.getDate()}/${d.getMonth() + 1}`} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  // التنبيه المحلي: بس إذا الطالب سمح قبل (ما نطلب الإذن وحدنا)؛ والصفحة مفتوحة. التنبيه الحقيقي (البوت + الموقع) بعدين.
  let notifTimer = 0;
  function armNotifications() {
    if (typeof window === "undefined") return;
    clearTimeout(notifTimer);
    const next = reminders().filter((r) => !r.done).sort((a, b) => a.at - b.at)[0];
    if (!next) return;
    notifTimer = setTimeout(() => {
      const list = reminders(), r = list.find((x) => x.id === next.id); if (!r) return;
      r.done = true; LS.set(RKEY, list);
      if ("Notification" in window && Notification.permission === "granted") try { new Notification("⏰ تذكير", { body: r.text }); } catch (e) {}
      document.dispatchEvent(new CustomEvent("reminder:due", { detail: r }));
      armNotifications();
    }, Math.max(0, Math.min(next.at - Date.now(), 2 ** 31 - 1)));
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
    try { const u = typeof A.get === "function" ? A.get() : A.user || A; return (u && (u.name || u.full_name)) || null; } catch (e) { return null; }
  };

  // ── العرض ──
  // o = { root, lectures (من study/data.json ويّا الأسئلة), catalog, ix (Notes.index), examDate, onChange }
  function mountToday(el, o = {}) {
    const root = o.root || "";
    el.innerHTML = `<div class="big4" role="group" aria-label="أزرار اليوم">
      <button type="button" class="big" data-open="remind" aria-expanded="false"><span aria-hidden="true">⏰</span><b>ذكّرني</b></button>
      <button type="button" class="big" data-open="resume" aria-expanded="false"><span aria-hidden="true">📍</span><b>وين وصلت</b></button>
      <button type="button" class="big" data-open="test" aria-expanded="false"><span aria-hidden="true">💪</span><b>قِس قوتك</b></button>
      <button type="button" class="big" data-open="note" aria-expanded="false"><span aria-hidden="true">📝</span><b>ملاحظة سريعة</b></button></div>
      <div class="bigsheet" data-sheet hidden></div>`;
    const sheet = el.querySelector("[data-sheet]");
    let open = null;
    const close = () => { sheet.hidden = true; sheet.innerHTML = ""; open = null; el.querySelectorAll("[data-open]").forEach((b) => b.setAttribute("aria-expanded", "false")); };
    const show = (k, html) => {
      sheet.innerHTML = `<div class="bsh"><b>${html.title}</b><button type="button" class="ib" data-close-sheet aria-label="سد">✕</button></div>${html.body}`;
      sheet.hidden = false; open = k;
      el.querySelectorAll("[data-open]").forEach((b) => b.setAttribute("aria-expanded", b.dataset.open === k));
      const f = sheet.querySelector("textarea, input, .chip2, .cbtn, a"); if (f) f.focus();
    };
    const views = {
      remind() {
        const list = reminders().filter((r) => !r.done).sort((a, b) => a.at - b.at);
        const perm = typeof Notification !== "undefined" && Notification.permission === "default";
        return { title: "⏰ ذكّرني", body: `<p class="sub" id="rm-w">إمتى؟</p><div class="chips-row" role="group" aria-labelledby="rm-w">${Object.entries(WHEN).map(([k, v], i) => `<button type="button" class="chip2" data-when="${k}" aria-pressed="${i === 0}">${v}</button>`).join("")}</div>
          <input type="datetime-local" data-custom hidden aria-label="الوقت">
          <div class="row-in"><input type="text" data-voice data-rtext maxlength="200" placeholder="شنو؟ مثلاً: راجع محاضرة الوقاية" aria-label="شنو أذكّرك؟"></div>
          <button type="button" class="cbtn" data-rsave>حفظ التذكير</button>
          <p class="sub">راح نذكّرك هنا وبالبوت (التنبيه بالبوت يشتغل بعد تفعيل الحسابات).</p>
          ${perm ? `<button type="button" class="cbtn ghost" data-perm>🔔 خلّي هالجهاز ينبّهني</button>` : ""}
          <div data-rlist>${list.map((r) => `<p class="slim">⏰ ${esc(fmt(r.at))} · ${esc(r.text)}</p>`).join("")}</div>` };
      },
      resume() {
        const last = LS.get("t:last", null);
        if (!last || !last.url) return { title: "📍 وين وصلت", body: `<p class="sub">بعدك ما فتحت محاضرة. ابدأ من <a href="${esc(root)}learn/">المحاضرات ‹</a></p>` };
        const href = /^https?:/.test(last.url) ? last.url : root + last.url.replace(/^\//, "");
        const tab = { read: "📖 اقرأ", listen: "🎧 اسمع", quiz: "📝 اختبر", terms: "📚 المصطلحات" }[last.tab] || "";
        return { title: "📍 وين وصلت", body: `<a class="resume" href="${esc(href)}"><span><small>آخر شي فتحته${tab ? " · " + tab : ""}</small><b>${esc(last.title)}</b>${last.sub ? `<small>${esc(last.sub)}</small>` : ""}</span><span class="go">كمّل ‹</span></a>` };
      },
      test() { return { title: "💪 قِس قوتك", body: `<p class="sub">10 أسئلة سريعة من المحاضرات اللي قريتها. <b>للمراجعة فقط — مو توقّع لأسئلة الامتحان.</b></p><div data-quiz></div>` }; },
      note() { return { title: "📝 ملاحظة سريعة", body: `<div class="row-in"><textarea rows="3" data-voice data-qn maxlength="2000" placeholder="اكتب أو احچي…" aria-label="الملاحظة"></textarea></div><button type="button" class="cbtn" data-qnsave>حفظ</button><p class="sub" data-qnmsg aria-live="polite"></p>` }; },
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
          <div class="qo">${q.options.map((op, k) => `<button type="button" class="qopt" data-k="${k}"><span dir="ltr">${esc(op.en)}</span><small>${esc(op.ar)}</small></button>`).join("")}</div><p class="qw" hidden></p>`;
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
        document.dispatchEvent(new CustomEvent("quiz:answer", { detail: { q: it.q, ok } }));   // أخطائي (tools.js إذا موجود)
        const nx = document.createElement("button"); nx.type = "button"; nx.className = "cbtn"; nx.textContent = i + 1 < items.length ? "التالي ‹" : "شوف النتيجة";
        nx.onclick = () => { i++; step(); }; w.after(nx); nx.focus();
      };
      step();
    };
    el.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.open) { if (open === b.dataset.open) { close(); return; } when = "h1"; show(b.dataset.open, views[b.dataset.open]()); if (b.dataset.open === "test") runQuiz(sheet.querySelector("[data-quiz]")); return; }
      if (b.hasAttribute("data-close-sheet")) { const k = open; close(); const t = el.querySelector(`[data-open="${k}"]`); if (t) t.focus(); return; }
      if (b.dataset.when) { when = b.dataset.when; sheet.querySelectorAll("[data-when]").forEach((x) => x.setAttribute("aria-pressed", x === b)); sheet.querySelector("[data-custom]").hidden = when !== "custom"; return; }
      if (b.hasAttribute("data-rsave")) {
        const r = remind(sheet.querySelector("[data-rtext]").value, when, Date.now(), sheet.querySelector("[data-custom]").value);
        sheet.querySelector("[data-rlist]").insertAdjacentHTML("afterbegin", `<p class="slim">✓ ⏰ ${esc(fmt(r.at))} · ${esc(r.text)}</p>`);
        sheet.querySelector("[data-rtext]").value = ""; armNotifications(); return;
      }
      if (b.hasAttribute("data-perm")) { Notification.requestPermission().then(() => b.remove()).catch(() => {}); return; }   // بضغطة الطالب بس
      if (b.hasAttribute("data-qnsave")) {
        const ta = sheet.querySelector("[data-qn]"), N = G("Notes");
        const n = N && N.add({ text: ta.value, kind: "free", ix: o.ix, ctx: N.context() });
        sheet.querySelector("[data-qnmsg]").textContent = n ? "✓ انحفظت بملاحظاتي" : "اكتب شي أول.";
        if (n) ta.value = "";
      }
    });
    el.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && open) { const k = open; close(); const t = el.querySelector(`[data-open="${k}"]`); if (t) t.focus(); } });
    armNotifications();
  }

  // ── 👋 جولة أول مرة: 3 خطوات تتخطّى، وما ترجع إلا بزر «؟» ──
  const STEPS = [
    ["👋 هاي مساحتك", "كلشي هنا إلك بس: خطتك وتقدّمك وملاحظاتك."],
    ["⏰ 📍 💪 📝", "4 أزرار تكفيك كل يوم: ذكّرني، وين وصلت، قِس قوتك، ملاحظة سريعة."],
    ["🗓️ خطتي", "اختار المادة والوقت، وإحنا نرتّبلك يوم بيوم. فاتك يوم؟ تترتّب وحدها."],
  ];
  function tour(force = false) {
    if (typeof document === "undefined" || (!force && LS.get(TKEY, false))) return;
    const prev = document.activeElement;
    const d = document.createElement("div");
    d.className = "gatedlg tour"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "tour-t");
    let i = 0;
    const fin = () => { LS.set(TKEY, true); d.remove(); if (prev && prev.focus) prev.focus(); };
    const paint = () => {
      d.innerHTML = `<div class="box"><small class="sub">${i + 1} / ${STEPS.length}</small><b id="tour-t">${STEPS[i][0]}</b><span>${STEPS[i][1]}</span>
        <div class="chips-row"><button type="button" class="cbtn" data-next>${i + 1 < STEPS.length ? "التالي" : "يلا نبدأ"}</button><button type="button" class="cbtn ghost" data-skip>تخطّي</button></div></div>`;
      d.querySelector("[data-next]").focus();
    };
    d.addEventListener("click", (ev) => { if (ev.target.closest("[data-skip]")) fin(); else if (ev.target.closest("[data-next]")) { if (++i >= STEPS.length) fin(); else paint(); } });
    d.addEventListener("keydown", (ev) => { if (ev.key === "Escape") fin(); });
    document.body.appendChild(d); paint();
  }

  return { WHEN, whenAt, remind, reminders, dueReminders, armNotifications, pickQuiz, scoreQuiz, exportAll, importAll, studentName, mountToday, tour, STEPS };
});
