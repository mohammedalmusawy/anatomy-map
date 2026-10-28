// 🩺 لوحة «الصحة» للإدارة (29/10/2026) — مو موصولة. الدمج بـ admin.js: تبويب جديد «🩺 الصحة» ←
//   AdminHealth.mount(pane, sb)   (sb = نفس supabase client اللي بـ admin.js، بعد ما يتأكد is_admin)
// تقرا health_snapshot() (مايغريشن 20261029000010_health.sql) + تنبيهات limit_* / err_rate ، وتحسب توقعات الشهر.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MB = (b) => (b / 1048576).toFixed(0) + " MB";
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  // تقديرات لكل زيارة (من قياس 29/10): Supabase ≈ 6 KB قبل net.js و 1.5 KB بعده؛ GitHub Pages ≈ 3–6 MB لكل طالب باليوم
  const EST = { sbPerView: 6e3, ghPerDau: 4e6 };
  const WATCH = [
    ["429 من Supabase أو «too many connections»", "ضغط امتحانات: فعّل net.js (كاش settings) وقلّل الطلبات لكل صفحة"],
    ["redeem-code يرجّع 500", "سر STUDENT_CODE_PEPPER أو الدالة بعد النشر — شوف Logs بالدالة"],
    ["study-assistant: budget / limit", "الميزانية خلصت أو الحد اليومي — راجع المؤشر تحت"],
    ["الصوت ما يشتغل بالآيفون (Range)", "sw-v2 يدعم Range؛ تأكد إن النسخة الجديدة هي المفعّلة"],
    ["GitHub Pages: صفحة 404 أو build فشل", "Actions ← pages-build-deployment؛ حجم الموقع أقل من 1 GB"],
    ["أخطاء JS (events.kind = error) عالية بصفحة وحدة", "افتح الصفحة بالموبايل وشوف الكونسول"],
    ["Supabase: Project paused / egress exceeded", "لوحة Supabase ← Usage؛ الخطة المجانية توقف الخدمة إذا تعدّت"],
  ];

  function tile(label, val, of, p, note) {
    const tone = p >= 90 ? "bad" : p >= 70 ? "warn" : "ok";
    return `<div class="hl-t hl-${tone}"><div class="hl-l">${esc(label)}</div><div class="hl-v">${esc(val)}${of ? ` <small>/ ${esc(of)}</small>` : ""}</div>` +
      (p != null ? `<div class="hl-bar" role="meter" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(label)}"><i style="width:${Math.min(100, p)}%"></i></div>` : "") +
      (note ? `<div class="hl-n">${esc(note)}</div>` : "") + `</div>`;
  }

  async function mount(el, sb) {
    el.innerHTML = "<p>…</p>";
    const [{ data: s, error }, { data: al }] = await Promise.all([
      sb.rpc("health_snapshot"),
      sb.from("alerts").select("kind,text,at,status").or("kind.like.limit_%,kind.eq.err_rate,kind.eq.redeem_spike").order("at", { ascending: false }).limit(10),
    ]);
    if (error || !s) { el.innerHTML = `<p>ما انقرت الصحة: ${esc(error && error.message)} (طبّق مايغريشن health أول)</p>`; return; }
    const now = new Date(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), dom = now.getDate();
    const aiProj = (s.ai_usd_month / Math.max(dom, 1)) * dim;
    const sbMonth = (s.views_24h * EST.sbPerView * 30) / 1e9;
    const ghMonth = (s.dau * EST.ghPerDau * 30) / 1e9;
    el.innerHTML = `
<style>
.hl-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:10px 0}
.hl-t{border:1px solid var(--line,#ddd);border-radius:14px;padding:10px 12px;background:var(--card,#fff)}
.hl-l{font-size:13px;opacity:.8}.hl-v{font-weight:700;font-size:20px}.hl-v small{font-weight:500;font-size:13px;opacity:.7}
.hl-bar{height:6px;border-radius:6px;background:var(--line,#eee);margin-top:6px;overflow:hidden}.hl-bar i{display:block;height:100%;background:#2f8f5b}
.hl-warn .hl-bar i{background:#c98a12}.hl-bad .hl-bar i{background:#c0392b}.hl-n{font-size:12px;opacity:.75;margin-top:4px}
.hl-w td{padding:6px 4px;border-top:1px solid var(--line,#eee);vertical-align:top;font-size:14px}
</style>
<h2>🩺 الصحة <small>${esc(new Date(s.at).toLocaleString("ar-IQ"))}</small></h2>
<div class="hl-g">
${tile("🗄️ قاعدة البيانات", MB(s.db_bytes), "500 MB", pct(s.db_bytes, s.db_limit))}
${tile("🤖 المساعد هذا الشهر", "$" + s.ai_usd_month, "$" + s.ai_budget_usd, pct(aiProj, s.ai_budget_usd), `التوقع آخر الشهر: $${aiProj.toFixed(1)} · اليوم $${s.ai_usd_today} · ${s.ai_questions_month} سؤال`)}
${tile("👥 طلاب اليوم / الشهر", `${s.dau} / ${s.mau}`, null, null, `${s.views_24h} زيارة باليوم · ${s.answers_24h} جواب`)}
${tile("📶 Supabase egress (تقدير)", sbMonth.toFixed(1) + " GB", "5 GB", pct(sbMonth, 5), "تقدير من الزيارات؛ الرقم الحقيقي بلوحة Supabase ← Usage")}
${tile("🌐 GitHub Pages (تقدير)", ghMonth.toFixed(0) + " GB", "100 GB", pct(ghMonth, 100), "حد ناعم شهري؛ الـ service worker يقلّله")}
${tile("🔌 اتصالات القاعدة", s.connections, s.max_connections, pct(s.connections, s.max_connections))}
${tile("⚠️ أخطاء المتصفح (24 ساعة)", s.errors_24h, null, s.views_24h ? pct(s.errors_24h * 50, s.views_24h) : 0, "الحد المقبول < 2% من الزيارات")}
${tile("🚩 بلاغات جديدة", s.reports_new, null, null)}
${tile("🔐 أكواد غلط (ساعة)", s.redeem_fails_1h, "1000", pct(s.redeem_fails_1h, 1000))}
</div>
<h3>🔔 تنبيهات الحدود</h3>
${(al || []).length ? `<ul>${al.map((a) => `<li>${esc(a.text)} <small>${esc(new Date(a.at).toLocaleDateString("ar-IQ"))}</small></li>`).join("")}</ul>` : "<p>ماكو تنبيهات ✅</p>"}
<h3>👀 أخطاء نراقبها</h3>
<table class="hl-w">${WATCH.map(([e, f]) => `<tr><td>${esc(e)}</td><td>${esc(f)}</td></tr>`).join("")}</table>`;
  }
  window.AdminHealth = { mount };
})();
