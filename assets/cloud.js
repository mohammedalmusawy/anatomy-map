// ☁️ ربط الموقع بـ Supabase (27/10) — مطفي لحد ما ينحط رابط المشروع والمفتاح العام بـ cloud-config.js.
// بدون تسجيل دخول. كل طالب = معرّف جهاز عشوائي. ماكو أسماء ولا أرقام.
(function () {
  const C = window.STUDY_CLOUD || {};
  const ON = !!(C.url && C.anon);
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  const rel = location.href.split("#")[0].slice(root.length);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let dev = null;
  try { dev = localStorage.getItem("t:device"); if (!dev) { dev = crypto.randomUUID(); localStorage.setItem("t:device", dev); } } catch (e) { dev = crypto.randomUUID(); }
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon, "Content-Type": "application/json" };
  const ins = (t, row) => ON && fetch(`${C.url}/rest/v1/${t}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ device: dev, ...row }) }).catch(() => {});
  const get = (t, q) => ON ? fetch(`${C.url}/rest/v1/${t}?${q}`, { headers: H }).then((r) => r.json()).catch(() => []) : Promise.resolve([]);
  window.Cloud = { on: ON, dev, log: (kind, ref) => ins("events", { kind, page: rel.slice(0, 300), ref: String(ref || "").slice(0, 300) }), root };
  if (!ON) return;

  // زيارة (مرة لكل صفحة بالجلسة)
  try { const k = "v:" + rel; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, 1); Cloud.log("view"); } } catch (e) {}

  // أجوبة الأسئلة: أول محاولة لكل جهاز تنعلّم first
  document.addEventListener("quiz:answer", (ev) => {
    const { q, ok } = ev.detail, qkey = (q.q_en || "").slice(0, 120);
    let first = false;
    try { const s = JSON.parse(localStorage.getItem("t:answered") || "{}"); if (!s[qkey]) { s[qkey] = 1; first = true; localStorage.setItem("t:answered", JSON.stringify(s)); } } catch (e) {}
    ins("answers", { qkey, quiz: rel.slice(0, 200), correct: ok, first });
    if (!ok && window.STUDY_SETTINGS && STUDY_SETTINGS.assistant) {
      const fb = document.getElementById("fb");
      if (fb && !fb.querySelector(".whywrong")) fb.insertAdjacentHTML("beforeend",
        `<a class="whywrong" href="${root}assistant/?q=${encodeURIComponent("ليش غلطت؟ " + q.q_en)}">❌ ليش غلطت؟ اسأل مساعد الطالب</a>`);
    }
  });

  // الإعدادات العامة: شريط إعلان، الأقسام (الامتحانات، المساعد)
  get("settings", "select=key,value").then((rows) => {
    const S = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    const sec = S.sections || {};
    window.STUDY_SETTINGS = sec;
    const a = S.announcement || {};
    if (a.on && a.text) document.body.insertAdjacentHTML("afterbegin", `<div class="annbar">📣 ${esc(a.text)}</div>`);
    if (sec.exams) document.querySelectorAll(".exams-only").forEach((x) => x.classList.remove("hidden"));
    if (sec.assistant) {
      document.querySelectorAll(".assistant-only").forEach((x) => x.classList.remove("hidden"));
      document.querySelectorAll("article.case[id^='c-']").forEach((c) => {
        const t = c.querySelector("h3 .en"); if (!t || c.querySelector(".explainme")) return;
        (c.querySelector(".acts") || c).insertAdjacentHTML("beforeend",
          `<a class="explainme" href="${root}assistant/?q=${encodeURIComponent("فهّمني هالحالة: " + t.textContent)}">💡 فهّمني هالحالة</a>`);
      });
    }
  });

  // 🚦 صعوبة السؤال (من نسب الغلط الحقيقية، أو «تقديري»)
  let stats = null;
  if (document.getElementById("quiz-data")) get("question_stats", "select=qkey,rate,estimated").then((r) => {
    stats = Object.fromEntries((r || []).map((x) => [x.qkey, x]));
  });
  document.addEventListener("quiz:show", (ev) => {
    const s = stats && stats[(ev.detail.q.q_en || "").slice(0, 120)], c = document.getElementById("count");
    if (!c) return;
    c.querySelector(".diff")?.remove();
    if (!s) return;
    const [ic, w] = s.rate >= 0.5 ? ["🔴", "صعب"] : s.rate >= 0.25 ? ["🟡", "متوسط"] : ["🟢", "سهل"];
    c.insertAdjacentHTML("beforeend", ` <span class="diff">${ic} ${w}${s.estimated ? " · تقديري" : ""}</span>`);
  });

  // 🚩 بلّغ عن خطأ (بكل سؤال وحالة)
  const rep = (item) => {
    const note = prompt("🚩 شنو الخطأ؟ (اكتب باختصار)");
    if (note && note.trim()) { ins("reports", { page: rel.slice(0, 300), item: String(item).slice(0, 300), note: note.trim().slice(0, 1000) }); alert("وصل البلاغ، شكراً 🌷"); }
  };
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-report]");
    if (b) { ev.preventDefault(); rep(b.dataset.report || document.title); }
  });
  document.querySelectorAll("article.case[id^='c-']").forEach((c) => {
    (c.querySelector(".acts") || c).insertAdjacentHTML("beforeend", `<button class="repb" data-report="${esc(c.id)}">🚩 بلّغ عن خطأ</button>`);
  });
  const qp = document.getElementById("play");
  if (qp && document.getElementById("quiz-data")) qp.insertAdjacentHTML("beforeend", `<button class="repb" data-report="" id="repq">🚩 بلّغ عن خطأ بهذا السؤال</button>`);
  document.addEventListener("quiz:show", (ev) => { const b = document.getElementById("repq"); if (b) b.dataset.report = (ev.detail.q.q_en || "").slice(0, 200); });
})();
