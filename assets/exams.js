// 📅 قسم «الامتحانات» (المرحلة 2 من الإطلاق، 29/10/2026) — صفحة /exams/ بس. مطفي لحد ما محمد يحفظ الجدول من /admin/ (sections.exams).
// لكل امتحان جاي (الأقرب فوق): عدّ تنازلي بتوقيت بغداد · المحاضرات المشمولة (📖 اقرأ · 🎧 اسمع · 📝 اختبر) · خطة مراجعة قصيرة ← «خطتي» بمساحتي
// · ⭐ الأكثر غلط و🔥 أصعب الأسئلة من question_stats (يتحسب مرة باليوم، أول محاولة لكل جهاز، 10 محاولات على الأقل، مجهول) · بعد يومه ← 📦 الأرشيف وحده.
// الصياغة دائماً «للمراجعة فقط — مو توقّع لأسئلة الامتحان». ولا كلمة «راح يجي / مؤكد». مطفي أو بلا نت ← الصفحة مثل ما هي (سطر «يظهر وقت الامتحانات بس»).
(function () {
  const box = document.getElementById("examsx"); if (!box) return;
  const C = window.STUDY_CLOUD || {}, ON = !!(C.url && C.anon);
  const man = document.querySelector('link[rel="manifest"]'); if (!man || !ON) return;
  const root = new URL(".", man.href).href;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon };
  const N = window.Net;
  const get = (t, q, ttl) => N ? N.get(t, q, ttl) : fetch(`${C.url}/rest/v1/${t}?${q}`, { headers: H }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const settings = () => (N ? N.settings() : get("settings", "select=key,value").then((r) => Object.fromEntries((r || []).map((x) => [x.key, x.value])))).catch(() => ({}));
  const DISC = '<p class="rev-only">⚠️ <b>للمراجعة فقط — مو توقّع لأسئلة الامتحان</b></p>';
  const MIN_N = 10;   // أقل عدد محاولات (أول محاولة لكل جهاز) حتى سؤال يدخل «الأكثر غلط» — نفس حد daily_stats بالقاعدة
  const SUBJ = { anatomy: "التشريح", radiography: "التصوير الشعاعي", protection: "الوقاية من الإشعاع", examinations: "الفحوصات الشعاعية", ct: "أجهزة التصوير المقطعي", equipment: "أجهزة الأشعة التقليدية" };
  const TYP = { theory: "نظري", practical: "عملي" }, TERM = { midterm: "مِدترم", final: "نهائي" };
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

  // 🕰️ التاريخ دائماً بتوقيت بغداد (UTC+3، بلا توقيت صيفي) مهما كان توقيت الجهاز. التواريخ «YYYY-MM-DD» تنحسب أيام كاملة بـ UTC (بلا مشاكل الساعات).
  const today = () => {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baghdad", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10); }
  };
  const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
  const utc = (s) => Date.parse(s + "T00:00:00Z");
  const diff = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);          // b − a بالأيام
  const addDays = (s, n) => new Date(utc(s) + n * 864e5).toISOString().slice(0, 10);
  const arDate = (s) => { const d = new Date(utc(s)); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
  const left = (n) => n === 0 ? "<b>اليوم</b>" : n === 1 ? "<b>باچر</b>" : n === 2 ? "باقي <b>يومين</b>" : `باقي <b>${n}</b> ${n <= 10 ? "أيام" : "يوم"}`;
  const ms2midnight = () => { const t = today(); return Math.max(60e3, utc(addDays(t, 1)) - 3 * 3600e3 - Date.now() + 5e3); };   // منتصف ليل بغداد الجاي

  const qk = (q) => (q.q_en || "").slice(0, 120);
  const lecId = (L) => `${L.type}/${L.num}`;
  const lab = (L) => `${esc(L.type_ar)} م${L.num}`;
  const style = () => {
    if (document.getElementById("exams-css")) return;
    const s = document.createElement("style"); s.id = "exams-css";
    s.textContent = `
#examsx { overflow-wrap: anywhere; }
#examsx [hidden] { display: none !important; }
#examsx .ex { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; margin: 0 0 16px; }
#examsx .ex h2 { margin: 0 0 4px; font-size: 20px; line-height: 1.4; }
#examsx .ex h2 .en { display: block; direction: ltr; text-align: left; font-size: 14px; font-weight: 500; color: var(--muted); }
#examsx .ex h3 { margin: 16px 0 6px; font-size: 16px; }
#examsx .exq-cd { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin: 4px 0 6px; font-size: 16px; }
#examsx .exq-cd .n { font-size: 20px; color: var(--brand); }
#examsx .exq-cd .n b { font-size: 26px; }
#examsx .exq-cd .w { color: var(--muted); white-space: nowrap; }
#examsx .exq-tag { display: inline-block; font-size: 12px; font-weight: 700; color: var(--brand); background: var(--brand-soft); border-radius: 99px; padding: 1px 10px; }
#examsx .exq-post { font-weight: 600; }
#examsx .exq-post small { color: var(--muted); font-weight: 500; }
#examsx .exq-l { list-style: none; padding: 0; margin: 4px 0; }
#examsx .exq-l li { border-top: 1px solid var(--line); padding: 8px 0; }
#examsx .exq-l li:first-child { border-top: 0; }
#examsx .exq-l .t { display: block; font-weight: 600; margin-bottom: 6px; }
#examsx .exq-b { display: flex; flex-wrap: wrap; gap: 6px; }
#examsx .exq-b a { flex: 1 1 90px; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 4px; border-radius: 12px; padding: 6px 10px;
  font-weight: 700; font-size: 14px; text-decoration: none; background: var(--brand-soft); color: var(--brand); border: 1px solid transparent; text-align: center; }
#examsx .exq-b a.p { background: var(--brand); color: var(--brand-ink); }
#examsx .exq-b a:focus-visible, #examsx summary:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
#examsx .exq-plan { margin: 4px 0; padding-inline-start: 20px; line-height: 1.8; }
#examsx .exq-note, #examsx .exq-data { color: var(--muted); font-size: 13px; line-height: 1.6; margin: 6px 0; }
#examsx .exq-q { background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 8px 12px; margin: 6px 0; }
#examsx .exq-q summary { cursor: pointer; font-weight: 600; min-height: 44px; line-height: 1.6; }
#examsx .exq-q .en { display: block; direction: ltr; text-align: left; font-weight: 500; }
#examsx .exq-q .rate { font-style: normal; font-size: 12px; color: #C62828; font-weight: 700; }
#examsx .exq-top { border: 2px solid #F5A623; border-radius: 14px; padding: 8px 10px; margin: 8px 0; }
#examsx .exq-arch { margin: 8px 0 0; }
#examsx .exq-arch summary { cursor: pointer; font-weight: 700; min-height: 44px; display: flex; align-items: center; }
#examsx .exq-arch li { color: var(--muted); }
@media (prefers-color-scheme: dark) { #examsx .exq-q .rate { color: #FF8A80; } }
:root[data-theme="dark"] #examsx .exq-q .rate { color: #FF8A80; }
:root[data-theme="light"] #examsx .exq-q .rate { color: #C62828; }
html[lang="en"] #examsx .ex h2 .en { text-align: left; }`;
    document.head.appendChild(s);
  };

  // سؤال من البنك + نسبته (الحقيقية أو «تقديري»)
  function qcard(q, L, s, ai) {
    const a = (q.options || [])[q.answer] || {};
    const real = s && !s.estimated && (s.attempts || 0) >= MIN_N;
    return `<details class="exq-q"><summary><span class="en">${esc(q.q_en)}</span>${esc(q.q_ar)}${s ? ` <i class="rate">${Math.round(s.rate * 100)}% غلط${real ? "" : " · تقديري"}</i>` : ""}</summary>
      <p>✅ <span class="en">${esc(a.en)}</span>${esc(a.ar)}</p>${q.why ? `<p>💡 ${esc(q.why)}</p>` : ""}
      ${s && s.hint_ar ? `<p class="hintl">🧠 <span class="en">${esc(s.hint_en || "")}</span>${esc(s.hint_ar)}</p>` : ""}
      <div class="exq-b"><a href="${root}${esc(L.learn)}">📖 اقرأ هذا الجزء</a>${ai ? `<a href="${root}assistant/?q=${encodeURIComponent("ليش غلطت؟ " + q.q_en)}">❌ ليش غلطت؟</a>` : ""}</div></details>`;
  }

  // 🗓️ خطة قصيرة: المحاضرات تتوزّع على الأيام لحد قبل الامتحان بيوم، واليوم الأخير للأصعب وأخطائي. بلا حفظ (الحفظ بـ «خطتي»).
  function plan(inc, n) {
    if (n <= 0) return [`اليوم: مرّ على الملخص بس، ونام زين. بالتوفيق 🤍`];
    if (!inc.length) return [`كل يوم: محاضرة من «المحاضرات اللي نزلت» + اختبارها.`, `آخر يوم: 🔥 أصعب الأسئلة + 📕 أخطائي.`];
    if (n === 1) return [`اليوم: الملخص (${inc.map(lab).join("، ")}) + 🔥 أصعب الأسئلة + 📕 أخطائي.`];
    const days = n - 1, per = Math.ceil(inc.length / days), out = [];
    for (let i = 0, d = 0; i < inc.length; i += per, d++) {
      const g = inc.slice(i, i + per), when = d === 0 ? "اليوم" : d === 1 ? "باچر" : arDate(addDays(today(), d));
      out.push(`${when}: ${g.map(lab).join(" + ")} — 📖 اقرأ، 🎧 اسمع، 📝 اختبر.`);
      if (out.length >= 6 && i + per < inc.length) { out.push(`… وتكمل بنفس الطريقة (${inc.length - i - per} محاضرة باقية).`); break; }
    }
    const free = days - Math.ceil(inc.length / per);
    if (free > 0) out.push(`الأيام الباقية (${free}): 🔁 مراجعة سريعة + اختبار المحاضرات مرة ثانية.`);
    out.push(`${arDate(addDays(today(), n - 1))} (قبل الامتحان بيوم): 🔥 أصعب الأسئلة + 📕 أخطائي.`);
    return out;
  }

  // «خطتي» بمساحتي: بالمعاينة ← /preview/me/#plan؛ بالموقع الحي بس إذا صفحة مساحتي موجودة. نحدّث كاش «الامتحان القادم» (نفس شكل nextexam.js) حتى الخطة تعرف الامتحان.
  let ME = null;
  const meUrl = async () => {
    if (ME !== null) return ME;
    if (location.pathname.includes("/preview/")) return (ME = root + "preview/me/#plan");
    try { const r = await fetch(root + "me/", { method: "HEAD" }); ME = r.ok ? root + "me/#plan" : ""; } catch (e) { ME = ""; }
    return ME;
  };

  let ROWS = [], DATA = {}, STATS = {}, AI = false, DAY = "";
  // مادة بلا بيانات (data.json ما وصل) ← الاسم بس وبلا محاضرات، بدل ما يختفي الامتحان
  const subj = (k) => { const S = DATA[k] || {}; return { name: S.name || SUBJ[k], en: S.en || "", lectures: Array.isArray(S.lectures) ? S.lectures : [] }; };
  function render() {
    const t = today(); DAY = t;
    // صف انبدل (البوت يأرشف القديم لنفس الفصل+المادة+النوع ويضيف الجديد) ← ما يطلع بالأرشيف كتكرار
    const K = (x) => `${x.term}|${x.subject}|${x.type || ""}`, newest = {};
    ROWS.forEach((x) => { newest[K(x)] = Math.max(newest[K(x)] || 0, Number(x.id) || 0); });
    const rows = ROWS.filter((x) => !(x.archived && (Number(x.id) || 0) < newest[K(x)]))
      .map((x) => ({ ...x, when: isDay(x.postponed_to) ? x.postponed_to : x.exam_date })).filter((x) => isDay(x.when) && SUBJ[x.subject]);
    const up = rows.filter((x) => !x.archived && diff(t, x.when) >= 0).sort((a, b) => utc(a.when) - utc(b.when));
    const past = rows.filter((x) => diff(t, x.when) < 0).sort((a, b) => utc(b.when) - utc(a.when)).slice(0, 30);
    const sec = up.map((x) => {
      const S = subj(x.subject), n = diff(t, x.when);
      const ids = Array.isArray(x.lectures) ? x.lectures : [];
      const sure = ids.length > 0;
      const inc = sure ? S.lectures.filter((L) => ids.includes(lecId(L))) : S.lectures.filter((L) => !x.type || L.type === x.type);
      const name = (SUBJ[x.subject] || S.name) + (x.type ? ` (${TYP[x.type]})` : "");
      // الإحصائيات: الحقيقية (≥10 محاولات، مو تقديري) ← الأكثر غلط؛ الأصعب: الحقيقية أولاً، وإذا ما كفت ← «تقديري» واضح
      const qs = inc.flatMap((L) => (L.questions || []).map((q) => ({ q, L, s: STATS[qk(q)] }))).filter((r) => r.s && typeof r.s.rate === "number");
      const real = qs.filter((r) => !r.s.estimated && (r.s.attempts || 0) >= MIN_N);
      const most = real.slice().sort((a, b) => b.s.rate * b.s.attempts - a.s.rate * a.s.attempts || b.s.rate - a.s.rate)[0];
      const hard = real.filter((r) => r !== most).sort((a, b) => b.s.rate - a.s.rate).slice(0, 8);
      const est = hard.length < 5 ? qs.filter((r) => r.s.estimated).sort((a, b) => b.s.rate - a.s.rate).slice(0, 5 - hard.length) : [];
      const sub = encodeURIComponent(x.subject), lq = sure ? "&lecs=" + encodeURIComponent(ids.join(",")) : "";
      return `<section class="ex" data-exam="${esc(x.subject)}-${esc(x.when)}">
        <h2>${esc(name)} <span class="en">${esc(S.en)}</span></h2>
        <p class="exq-cd"><span class="n">${left(n)}</span><span class="w">🗓️ ${esc(arDate(x.when))}</span>${x.term ? `<span class="exq-tag">${esc(TERM[x.term] || "")}</span>` : ""}</p>
        ${isDay(x.postponed_to) ? `<p class="exq-post">⏩ تأجلت المادة إلى يوم ${esc(arDate(x.postponed_to))}${isDay(x.exam_date) ? ` <small>(كانت ${esc(arDate(x.exam_date))})</small>` : ""}</p>` : ""}
        <h3>📚 المشمول</h3>
        ${sure ? "" : `<p class="exq-note">ما متأكدين بعد — نحدّثه أول ما يوصل خبر. لحد ما يتأكد، هاي المحاضرات اللي نزلت لحد هسه${x.type ? ` (${TYP[x.type]})` : ""} للمراجعة.</p>`}
        ${inc.length ? `<ul class="exq-l">${inc.map((L) => `<li><span class="t">${lab(L)} — ${esc(L.title_ar)}</span><div class="exq-b">
          <a class="p" href="${root}${esc(L.learn)}">📖 اقرأ</a><a href="${root}${esc(L.learn)}#listen">🎧 اسمع</a><a href="${root}${esc(L.quiz)}">📝 اختبر</a></div></li>`).join("")}</ul>`
          : `<p class="exq-note">ماكو محاضرات منزّلة لهالمادة بالموقع بعد.</p>`}
        <h3>🗓️ خطة مراجعة قصيرة</h3>
        <ol class="exq-plan">${plan(inc, n).map((l) => `<li>${l}</li>`).join("")}</ol>
        <div class="exq-b exq-me" hidden><a class="p" data-me href="#">📋 سوّيها بخطتي (مساحتي)</a></div>
        <div class="exq-b">${AI ? `<a href="${root}assistant/?mode=recommend&subject=${sub}${lq}">🎯 رشّحلي لهالمادة</a>` : ""}${AI ? `<a href="${root}assistant/?mode=summary&subject=${sub}${lq}">📝 لخّصلي المشمول</a>` : ""}<a href="${root}quiz/mistakes/">📕 أخطائي</a></div>
        <h3>⭐ السؤال الأكثر غلط</h3>
        ${most ? `${DISC}<div class="exq-top">${qcard(most.q, most.L, most.s, AI)}</div>`
          : `<p class="exq-note">بعدها ماكو بيانات كافية — يطلع لما سؤال بالمشمول يوصل ${MIN_N} محاولات أو أكثر.</p>`}
        <h3>🔥 أصعب الأسئلة — راجعوها</h3>
        ${hard.length || est.length ? `${DISC}${hard.map((r) => qcard(r.q, r.L, r.s, AI)).join("")}${est.length ? `${hard.length ? "" : `<p class="exq-note">«تقديري» = صعوبة تقديرية لحد ما تكفي محاولات الطلاب، وبعدها تتبدّل بالحقيقية.</p>`}${est.map((r) => qcard(r.q, r.L, r.s, AI)).join("")}` : ""}`
          : `<p class="exq-note">بعدها ماكو بيانات كافية لهالمادة.</p>`}
        <p class="exq-data">🔄 الأرقام تتحدّث مرة باليوم، من أول محاولة لكل جهاز، ومجهولة (ماكو أسماء ولا أرقام). نسبة الغلط تطلع بس للسؤال اللي إله ${MIN_N} محاولات أو أكثر.</p>
      </section>`;
    }).join("");
    const arch = past.length ? `<details class="exq-arch"${up.length ? "" : " open"}><summary>📦 الأرشيف — امتحانات خلصت (${past.length})</summary><ul>${past.map((x) => {
      const S = subj(x.subject);
      return `<li>${esc((SUBJ[x.subject] || S.name) + (x.type ? ` (${TYP[x.type]})` : ""))} · ${esc(arDate(x.when))}${x.term ? ` · ${esc(TERM[x.term] || "")}` : ""} — خلص <a href="${root}learn/${encodeURIComponent(x.subject)}/">📖 المحاضرات</a></li>`;
    }).join("")}</ul></details>` : "";
    box.innerHTML = up.length
      ? `<p class="sub">${up.length === 1 ? "امتحان واحد جاي" : `${up.length} امتحانات جاية`} — الأقرب فوق. العدّ بتوقيت بغداد.</p>${sec}${arch}`
      : `<p class="hint">ماكو امتحان جاي هسه. أول ما ينزل الجدول يطلع هنا.</p>${arch}`;
    // زر «خطتي»
    meUrl().then((u) => {
      if (!u) return;
      box.querySelectorAll(".exq-me").forEach((d) => { d.hidden = false; const a = d.querySelector("[data-me]"); a.href = u; });
    });
    clearTimeout(render.t); render.t = setTimeout(render, ms2midnight());   // الصفحة مفتوحة لبعد نص الليل ← العدّ والأرشيف يتحدّثون وحدهم
  }
  box.addEventListener("click", (ev) => {
    if (!ev.target.closest("[data-me]")) return;
    // نفس شكل كاش nextexam.js (t:nextexam) — نفس البيانات العامة، حتى «خطتي» تختار أقرب امتحان وحدها
    try { localStorage.setItem("t:nextexam", JSON.stringify({ at: Date.now(), examsOn: true,
      rows: ROWS.filter((x) => !x.archived).map(({ term, subject, type, exam_date, postponed_to, lectures }) => ({ term, subject, type, exam_date, postponed_to, lectures })) })); } catch (e) {}
  });

  (async () => {
    const S = await settings(), sec = (S && S.sections) || {};
    if (!sec.exams) return;                            // مطفي ← الصفحة مثل ما هي
    AI = !!sec.assistant;
    style();
    const F = "select=id,term,subject,type,exam_date,postponed_to,lectures,archived&confirmed=eq.true";
    const [up, old, d, st] = await Promise.all([
      get("exams", F + "&archived=eq.false&order=exam_date.asc", 15 * 60e3),                         // الجاية: كلها، بلا حد
      get("exams", F + "&archived=eq.true&order=exam_date.desc&limit=60", 15 * 60e3),               // الأرشيف: آخر 60
      fetch(root + "study/data.json").then((r) => r.json()).catch(() => ({})),
      get("question_stats", "select=qkey,rate,estimated,hint_en,hint_ar,attempts", 6 * 3600e3),   // نفس طلب smart.js/cloud.js = كاش واحد
    ]);
    ROWS = [].concat(Array.isArray(up) ? up : [], Array.isArray(old) ? old : []); DATA = d || {};
    STATS = Object.fromEntries((Array.isArray(st) ? st : []).map((x) => [x.qkey, x]));
    render();
    document.addEventListener("visibilitychange", () => { if (!document.hidden && today() !== DAY) render(); });   // الموبايل نايم وقت نص الليل
  })();
})();
