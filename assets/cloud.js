// ☁️ ربط الموقع بـ Supabase (27/10) — مطفي لحد ما ينحط رابط المشروع والمفتاح العام بـ cloud-config.js.
// بدون تسجيل دخول. كل طالب = معرّف جهاز عشوائي. ماكو أسماء ولا أرقام.
(function () {
  const C = window.STUDY_CLOUD || {};
  const ON = !!(C.url && C.anon);
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  // 🔒 M6 (29/10): الكود/التوكن ما ينسجّل أبداً بـ events (?code= ?token= ?k= …) — والقاعدة تشيلها هم (دفاع ثاني)
  const SECRET_QS = /^(code|token|k|token_hash|access_token|refresh_token|q|t)$/i;   // 30/10: q/t = نص سؤال المساعد أو البحث، ما ينسجّل بالزيارة
  const clean = (u) => { const s = String(u), h = s.indexOf("#"), body = h < 0 ? s : s.slice(0, h), hash = h < 0 ? "" : s.slice(h), i = body.indexOf("?");
    if (i < 0) return s;
    const kept = body.slice(i + 1).split("&").filter((x) => x && !SECRET_QS.test(x.split("=")[0]));
    return body.slice(0, i) + (kept.length ? "?" + kept.join("&") : "") + hash; };
  const rel = clean(location.href.split("#")[0].slice(root.length));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let dev = null;
  try { dev = localStorage.getItem("t:device"); if (!dev) { dev = crypto.randomUUID(); localStorage.setItem("t:device", dev); } } catch (e) { dev = crypto.randomUUID(); }
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon, "Content-Type": "application/json" };
  // 📡 net.js (29/10): كاش بمدة + الزيارات دفعة كل 30 ث + طابور بلا نت. إذا الصفحة ما حمّلته (معاينات): الطريقة القديمة.
  const N = window.Net;
  const direct = (t, row) => fetch(`${C.url}/rest/v1/${t}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(row) }).catch(() => {});
  const ins = (t, row) => ON && (N ? N.post(t, { device: dev, ...row }) : direct(t, { device: dev, ...row }));
  const get = (t, q, ttl) => !ON ? Promise.resolve([]) : N ? N.get(t, q, ttl)
    : fetch(`${C.url}/rest/v1/${t}?${q}`, { headers: H }).then((r) => r.json()).catch(() => []);
  const log = (kind, ref) => { if (!ON) return; const row = { device: dev, kind, page: rel.slice(0, 300), ref: String(ref || "").slice(0, 300) }; N ? N.log(row) : direct("events", row); };
  window.Cloud = { on: ON, dev, log, root };
  if (!ON) return;

  // زيارة (مرة لكل صفحة بالجلسة)
  try { const k = "v:" + rel; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, 1); Cloud.log("view"); } } catch (e) {}

  // أجوبة الأسئلة: أول محاولة لكل جهاز تنعلّم first
  document.addEventListener("quiz:answer", (ev) => {
    const { q, ok } = ev.detail, qkey = (q.q_en || "").slice(0, 120);
    let first = false;
    try { const s = JSON.parse(localStorage.getItem("t:answered") || "{}"); if (!s[qkey]) { s[qkey] = 1; first = true; localStorage.setItem("t:answered", JSON.stringify(s)); } } catch (e) {}
    if (first) ins("answers", { qkey, quiz: rel.slice(0, 200), correct: ok, first });   // كل الإحصائيات تحسب أول محاولة بس (where first)
    if (!ok && window.STUDY_SETTINGS && STUDY_SETTINGS.assistant) {
      const fb = document.getElementById("fb");
      if (fb && !fb.querySelector(".whywrong")) fb.insertAdjacentHTML("beforeend",
        `<a class="whywrong" href="${root}assistant/?q=${encodeURIComponent("ليش غلطت؟ " + q.q_en)}">❌ ليش غلطت؟ اسأل مساعد الطالب</a>`);
    }
  });

  // الإعدادات العامة: شريط إعلان، الأقسام (الامتحانات، المساعد)
  (N ? N.settings() : get("settings", "select=key,value").then((rows) => Object.fromEntries((rows || []).map((r) => [r.key, r.value])))).then((S) => {
    const sec = S.sections || {};
    window.STUDY_SETTINGS = sec;
    const a = S.announcement || {};
    // 🏛️ 53 (مسودة): إعلان رئيس القسم (a.by = "head") عليه شارة «📢 من رئيس القسم» — بس إذا ظهور الرئيس مفعّل (settings.dept_head.on)
    const byHead = a.by === "head" && S.dept_head && S.dept_head.on === true;
    if (a.on && a.text) document.body.insertAdjacentHTML("afterbegin", byHead
      ? `<div class="annbar" data-by="head"><span class="hd-badge">📢 من رئيس القسم</span> ${esc(a.text)}</div>`
      : `<div class="annbar">📣 ${esc(a.text)}</div>`);
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
  if (document.getElementById("opts")) get("question_stats", "select=qkey,rate,estimated,hint_en,hint_ar,attempts", 6 * 3600e3).then((r) => {   // نفس طلب smart.js = كاش واحد
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
  if (qp && document.getElementById("opts")) qp.insertAdjacentHTML("beforeend", `<button class="repb" data-report="" id="repq">🚩 بلّغ عن خطأ بهذا السؤال</button>`);
  document.addEventListener("quiz:show", (ev) => { const b = document.getElementById("repq"); if (b) b.dataset.report = (ev.detail.q.q_en || "").slice(0, 200); });
})();
