// 🔔 تبويب «🔔 تنبيهات البوت» للإدارة (29/10/2026) — مو موصول. الدمج بـ admin.js (نفس نمط AdminHealth):
//   التبويبات: ...(window.AdminNotify ? { notify: "🔔 التنبيهات" } : {})
//   show():    notify: () => window.AdminNotify ? AdminNotify.mount(pane, sb) : stats()
// المفاتيح: settings.tg_link.on (زر الربط بمساحتي + البوت يقبل الربط) · settings.notify.on (الإرسال) · dry_run · summary.
// الأرقام من notify_stats_admin() — بلا أسماء ولا أرقام تليغرام.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SW = [
    ["tg_link", "on", "🔗 ربط التليغرام", "يطلع زر «🔔 فعّل تنبيهات البوت» بمساحتي، والبوت يقبل الربط و/stop"],
    ["notify", "on", "🔔 إرسال التنبيهات", "كل 5 دقائق. يشتغل بس إذا «ربط التليغرام» مفعّل هم"],
    ["notify", "dry_run", "🧪 تجربة بلا إرسال", "يسجّل شنو كان راح ينرسل بس (ما يوصل شي للطلاب)"],
    ["notify", "summary", "📊 ملخص يومي إلي", "رسالة وحدة 9 بالليل: كم رسالة انرسلت (أرقام بس)"],
  ];
  async function mount(el, sb) {
    el.innerHTML = "<p>…</p>";
    const [{ data: rows }, { data: s }] = await Promise.all([
      sb.from("settings").select("key, value").in("key", ["notify", "tg_link"]),
      sb.rpc("notify_stats_admin"),
    ]);
    const V = Object.fromEntries((rows || []).map((r) => [r.key, r.value || {}]));
    const t = (s && s.today) || {}, o = (s && s.opt) || {};
    el.innerHTML = `<h2>🔔 تنبيهات البوت</h2>
<p class="sub">للطلاب اللي ربطوا حسابهم بأنفسهم بس. الهدوء 11 بالليل–8 الصبح، بالكثير ${esc(V.notify?.daily_cap ?? 3)} تلقائية + ${esc(V.notify?.reminder_cap ?? 5)} تذكيرات باليوم لكل طالب.</p>
<div class="an-sw">${SW.map(([k, f, l, d]) => `<label class="bnrow" style="display:flex;justify-content:space-between;gap:10px;min-height:48px;border-bottom:1px solid var(--line)"><span><b>${esc(l)}</b><br><small>${esc(d)}</small></span><input type="checkbox" style="width:24px;height:24px" data-k="${k}" data-f="${f}"${V[k]?.[f] === true ? " checked" : ""}></label>`).join("")}</div>
<p class="an-msg" role="status" aria-live="polite"></p>
<h3>📊 الأرقام</h3>
${s ? `<ul>
<li>المربوطين: <b>${esc(s.linked)}</b> من ${esc(s.students)} طالب فعّال</li>
<li>اليوم: ⏰ ${esc(t.reminder || 0)} · 📅 ${esc(t.exam || 0)} · 🗓️ ${esc(t.plan || 0)} · 📚 ${esc(t.lecture || 0)}${s.dry_today ? ` · 🧪 تجربة ${esc(s.dry_today)}` : ""}</li>
<li>آخر 7 أيام: ${esc(s.week)} رسالة · فكّوا/حظروا البوت: ${esc(s.blocked_week)} · فشلت: ${esc(s.failed_week)}</li>
<li>مفعّلين: ⏰ ${esc(o.reminders || 0)} · 📅 ${esc(o.exams || 0)} · 🗓️ ${esc(o.plan || 0)} · 📚 ${esc(o.lectures || 0)}</li></ul>` : "<p>ما گدرنا نقرا الأرقام.</p>"}`;
    const msg = el.querySelector(".an-msg");
    el.querySelectorAll("input[data-k]").forEach((x) => x.addEventListener("change", async () => {
      const k = x.dataset.k, f = x.dataset.f;
      const { data: cur } = await sb.from("settings").select("value").eq("key", k).maybeSingle();
      const value = Object.assign({}, (cur && cur.value) || {}, { [f]: x.checked });
      const { error } = await sb.from("settings").upsert({ key: k, value, at: new Date().toISOString() });
      if (error) { x.checked = !x.checked; msg.textContent = "ما انحفظ: " + error.message; } else msg.textContent = "✓ انحفظ";
    }));
  }
  window.AdminNotify = { mount };
})();
