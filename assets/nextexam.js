// 📅 الامتحان القادم (29/10/2026) — بطاقة نحيفة بأعلى الرئيسية (lessons/) و«سهولة التعلم» (learn/)، مو أيقونة جديدة.
// تطلع بس إذا اكو امتحان مؤكَّد خلال 14 يوم (التأجيل أولاً). بعد يوم الامتحان تنتقل وحدها للي بعده (حساب تاريخ بالجهاز).
// المشمول يطلع بس إذا محمد حدّده؛ غيره «ما متأكدين بعد» — ما نعرض تخمين كأنه أكيد. بلا نت أو بلا امتحان ← ما يطلع شي.
(function () {
  const C = window.STUDY_CLOUD || {};
  if (!C.url || !C.anon) return;
  const man = document.querySelector('link[rel="manifest"]'); if (!man) return;
  const root = new URL(".", man.href).href;
  const rel = location.href.split(/[?#]/)[0].slice(root.length).replace(/index\.html$/, "");
  if (rel !== "lessons/" && rel !== "learn/") return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon };
  const KEY = "t:nextexam", TTL = 15 * 60e3, WINDOW = 14;
  const SUBJ = { anatomy: "التشريح", radiography: "التصوير الشعاعي", protection: "الوقاية من الإشعاع", examinations: "الفحوصات الشعاعية", ct: "أجهزة التصوير المقطعي", equipment: "أجهزة الأشعة التقليدية" };
  const TYP = { theory: "نظري", practical: "عملي" };
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

  const day = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };   // منتصف ليل الجهاز
  const arDate = (s) => { const d = day(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const inDays = (n) => n === 0 ? "اليوم" : n === 1 ? "باچر" : n === 2 ? "بعد يومين" : n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يوم`;

  async function load() {
    try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && Date.now() - c.at < TTL) return c; } catch (e) {}
    const q = (t, p) => fetch(`${C.url}/rest/v1/${t}?${p}`, { headers: H }).then((r) => { if (!r.ok) throw 0; return r.json(); });
    const [rows, set] = await Promise.all([
      q("exams", "select=term,subject,type,exam_date,postponed_to,lectures&confirmed=eq.true&archived=eq.false"),
      q("settings", "select=value&key=eq.sections").catch(() => []),
    ]);
    const c = { at: Date.now(), rows: rows || [], examsOn: !!(set && set[0] && set[0].value && set[0].value.exams) };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  function pick(rows) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return rows.map((x) => { const when = x.postponed_to || x.exam_date; return when ? { ...x, when, left: Math.round((day(when) - t) / 864e5) } : null; })
      .filter((x) => x && x.left >= 0 && x.left <= WINDOW)
      .sort((a, b) => a.left - b.left);
  }

  async function render(c) {
    const up = pick(c.rows || []); if (!up.length) return;
    const x = up[0];
    let S = null;
    try { S = (await fetch(root + "study/data.json").then((r) => r.json()))[x.subject]; } catch (e) {}
    const name = (SUBJ[x.subject] || (S && S.name) || x.subject) + (x.type ? ` (${TYP[x.type]})` : "");
    const ids = Array.isArray(x.lectures) ? x.lectures : [];
    const sure = ids.length > 0;
    const L = S ? S.lectures.filter((l) => ids.includes(`${l.type}/${l.num}`)) : [];
    const lab = (id) => id.replace("theory/", "نظري م").replace("practical/", "عملي م");
    const lecs = sure ? (L.length ? L.map((l) => `<a href="${root}${esc(l.learn)}">${esc(l.type_ar)} م${l.num} — ${esc(l.title_ar)}</a>`) : ids.map((i) => esc(lab(i)))).join("، ") : "";
    const subjLearn = `${root}learn/${encodeURIComponent(x.subject)}/`;
    const lq = sure ? "&lecs=" + encodeURIComponent(ids.join(",")) : "";
    const review = sure ? `${root}assistant/?mode=summary&subject=${encodeURIComponent(x.subject)}${lq}` : subjLearn;
    const rec = `${root}assistant/?mode=recommend&subject=${encodeURIComponent(x.subject)}${lq}`;
    const more = up.length - 1;
    const el = document.createElement("aside");
    el.className = "nexam"; el.setAttribute("aria-label", "الامتحان القادم");
    el.innerHTML = `<p class="nexam-h">📅 <span class="nexam-k">الامتحان القادم:</span> <b>${esc(name)}</b> · <span class="nexam-d${x.left <= 1 ? " nexam-soon" : ""}">${inDays(x.left)}</span> · <span class="nexam-w">${esc(arDate(x.when))}</span></p>
      ${x.postponed_to ? `<p class="nexam-p">⏩ تأجلت إلى ${esc(arDate(x.postponed_to))}${x.exam_date ? ` <small>(كان ${esc(arDate(x.exam_date))})</small>` : ""}</p>` : ""}
      ${sure ? `<p class="nexam-l">📚 المشمول: ${lecs}</p>`
        : `<p class="nexam-l">📚 المشمول: ما متأكدين بعد — نحدّثه أول ما يوصل خبر</p><p class="nexam-hint">لحد ما يتأكد، <a href="${subjLearn}">راجع المحاضرات اللي نزلت لحد هسه</a></p>`}
      <div class="nexam-b"><a class="nexam-btn" href="${review}">📝 راجع المشمول</a><a class="nexam-btn alt" href="${rec}">🎯 رشّحلي</a></div>
      ${c.examsOn ? `<a class="nexam-x" href="${root}exams/">📅 قسم الامتحانات${more > 0 ? ` (+${more} امتحان خلال أسبوعين)` : ""} · <b>للمراجعة فقط</b></a>` : ""}`;
    const at = document.querySelector(".wrap > .hero") || document.querySelector(".wrap > h1 + .sub") || document.querySelector(".wrap > h1") || document.querySelector(".wrap > header.top");
    if (at) at.insertAdjacentElement("afterend", el); else (document.querySelector(".wrap") || document.body).prepend(el);
  }

  load().then(render).catch(() => {});
})();
