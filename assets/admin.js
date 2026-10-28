// ⚙️ لوحة الإدارة /admin/ (27/10) — دخول بإيميل محمد بس (رمز يوصل للإيميل). RLS بالسيرفر يمنع غيره حتى لو دخل.
(async function () {
  const C = window.STUDY_CLOUD || {}, box = document.getElementById("admin");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  if (!C.url || !C.anon || !window.supabase) { box.innerHTML = '<p class="hint">Supabase مو مربوط بعد. الخطوات بـ _النظام/supabase/README.md.</p>'; return; }
  const sb = supabase.createClient(C.url, C.anon);
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    box.innerHTML = `<p>دخول الإدارة:</p><input id="em" type="email" placeholder="الإيميل" dir="ltr"><button class="btn" id="send">أرسل رمز الدخول</button>
      <div id="otp" class="hidden"><input id="code" inputmode="numeric" placeholder="الرمز" dir="ltr"><button class="btn" id="ok">دخول</button></div>`;
    document.getElementById("send").onclick = async () => {
      const email = document.getElementById("em").value.trim();
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) return alert(error.message);
      document.getElementById("otp").classList.remove("hidden");
    };
    document.getElementById("ok").onclick = async () => {
      const { error } = await sb.auth.verifyOtp({ email: document.getElementById("em").value.trim(), token: document.getElementById("code").value.trim(), type: "email" });
      if (error) return alert(error.message); location.reload();
    };
    return;
  }
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) { box.innerHTML = '<p class="hint">هذا الحساب مو حساب الإدارة.</p>'; await sb.auth.signOut(); return; }

  const tabs = { stats: "📊 الإحصائيات", reports: "🚩 البلاغات", control: "🎛️ التحكم", exams: "📅 الامتحانات" };
  box.innerHTML = `<nav class="dtabs">${Object.entries(tabs).map(([k, v]) => `<a href="#${k}" data-t="${k}">${v}</a>`).join("")}</nav><div id="pane"></div>
    <p class="hint"><button class="btn ghost" id="out">خروج</button></p>`;
  document.getElementById("out").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  const pane = document.getElementById("pane");
  const table = (rows, cols) => rows && rows.length ? `<table class="adm"><tr>${cols.map((c) => `<th>${esc(c[1])}</th>`).join("")}</tr>` +
    rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(typeof c[0] === "function" ? c[0](r) : r[c[0]])}</td>`).join("")}</tr>`).join("") + "</table>" : '<p class="hint">ماكو بيانات بعد.</p>';

  async function stats() {
    const [daily, pages, hard, empty, alerts, usage] = await Promise.all([
      sb.from("admin_daily").select("*").limit(14), sb.from("admin_top_pages").select("*"),
      sb.from("question_stats").select("qkey,quiz,attempts,rate,estimated").order("rate", { ascending: false }).limit(30),
      sb.from("admin_search_empty").select("*"), sb.from("alerts").select("*").eq("status", "new").order("at", { ascending: false }),
      sb.from("assistant_usage").select("day,n,tokens_in,tokens_out").gte("day", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)),
    ]);
    const week = (daily.data || []).slice(0, 7).reduce((a, r) => a + r.visitors, 0);
    const u = usage.data || [];
    pane.innerHTML = `
      ${(alerts.data || []).map((a) => `<div class="alert"><b>${esc(a.kind === "weekly" ? "🧠 الملخص الأسبوعي" : "🔔 تنبيه")}</b><p>${esc(a.text)}</p>
        <button class="btn" data-al="${a.id}" data-s="approved">${a.kind === "exam_activity" ? "فعّل الامتحانات" : "تمام"}</button>
        <button class="btn ghost" data-al="${a.id}" data-s="dismissed">تجاهل</button></div>`).join("")}
      <div class="kpis"><div><b>${(daily.data || [])[0]?.visitors ?? 0}</b><span>زوار اليوم</span></div><div><b>${week}</b><span>زوار الأسبوع (مجموع يومي)</span></div>
        <div><b>${u.reduce((a, r) => a + r.n, 0)}</b><span>أسئلة المساعد (30 يوم)</span></div>
        <div><b>$${u.reduce((a, r) => a + (r.tokens_in * 0.1 + r.tokens_out * 0.5) / 1e6, 0).toFixed(2)}</b><span>كلفة المساعد (30 يوم، تقريبي · Haiku 5.5)</span></div></div>
      <h2>📄 أكثر الصفحات (7 أيام)</h2>${table(pages.data, [["page", "الصفحة"], ["views", "مشاهدات"]])}
      <h2>🔥 أصعب الأسئلة (نسبة الغلط)</h2>${table(hard.data, [["qkey", "السؤال"], [(r) => Math.round(r.rate * 100) + "%" + (r.estimated ? " تقديري" : ""), "الغلط"], ["attempts", "محاولات"], ["quiz", "المحاضرة"]])}
      <h2>🔎 بحثوا عنه وما لگوه</h2>${table(empty.data, [["query", "البحث"], ["n", "مرات"]])}
      <h2>📆 الزوار يومياً</h2>${table(daily.data, [["day", "اليوم"], ["visitors", "زوار"], ["views", "مشاهدات"]])}`;
    pane.querySelectorAll("[data-al]").forEach((b) => b.onclick = async () => {
      const a = (alerts.data || []).find((x) => String(x.id) === b.dataset.al);
      await sb.from("alerts").update({ status: b.dataset.s }).eq("id", a.id);
      if (a.kind === "exam_activity" && b.dataset.s === "approved") await setSection("exams", true);
      stats();
    });
  }
  async function reports() {
    const { data } = await sb.from("reports").select("*").order("at", { ascending: false }).limit(100);
    pane.innerHTML = (data || []).map((r) => `<div class="alert ${r.status}"><b>${esc(r.page)}</b><p>${esc(r.item)}</p><p>💬 ${esc(r.note)}</p><small>${esc(r.at)} · ${esc(r.status)}</small>
      <button class="btn" data-r="${r.id}" data-s="accepted">قبول</button><button class="btn ghost" data-r="${r.id}" data-s="rejected">رفض</button><button class="btn ghost" data-r="${r.id}" data-s="done">انصلح</button></div>`).join("") || '<p class="hint">ماكو بلاغات.</p>';
    pane.querySelectorAll("[data-r]").forEach((b) => b.onclick = async () => { await sb.from("reports").update({ status: b.dataset.s }).eq("id", b.dataset.r); reports(); });
  }
  async function getSet(k) { const { data } = await sb.from("settings").select("value").eq("key", k).single(); return data?.value || {}; }
  async function setSection(k, v) { const s = await getSet("sections"); s[k] = v; await sb.from("settings").upsert({ key: "sections", value: s, at: new Date().toISOString() }); }
  async function control() {
    const [ann, sec, bud] = await Promise.all([getSet("announcement"), getSet("sections"), getSet("assistant_budget")]);
    pane.innerHTML = `<h2>📣 شريط الإعلان</h2><textarea id="an" rows="2">${esc(ann.text)}</textarea>
      <label><input type="checkbox" id="anon" ${ann.on ? "checked" : ""}> ظاهر</label><button class="btn" id="ans">حفظ</button>
      <h2>🧩 الأقسام</h2>
      <label><input type="checkbox" id="sx" ${sec.exams ? "checked" : ""}> 📅 الامتحانات (أيقونة بالرئيسية وقت الامتحانات بس)</label>
      <label><input type="checkbox" id="sa" ${sec.assistant ? "checked" : ""}> 🤖 مساعد الطالب (بعد ما ينحط المفتاح)</label>
      <h2>💵 ميزانية المساعد</h2><label>شهرياً ($) <input id="bm" type="number" value="${bud.monthly_usd ?? 50}"></label>
      <label>أسئلة يومياً لكل جهاز <input id="bd" type="number" value="${bud.daily_per_device ?? 20}"></label><button class="btn" id="bs">حفظ</button>`;
    document.getElementById("ans").onclick = async () => { await sb.from("settings").upsert({ key: "announcement", value: { text: document.getElementById("an").value, on: document.getElementById("anon").checked } }); alert("انحفظ"); };
    document.getElementById("sx").onchange = (e) => setSection("exams", e.target.checked);
    document.getElementById("sa").onchange = (e) => setSection("assistant", e.target.checked);
    document.getElementById("bs").onclick = async () => { await sb.from("settings").upsert({ key: "assistant_budget", value: { monthly_usd: +document.getElementById("bm").value, daily_per_device: +document.getElementById("bd").value } }); alert("انحفظ"); };
  }
  const SUBJ = { anatomy: "تشريح", radiography: "التصوير الشعاعي", protection: "الوقاية", examinations: "الفحوصات الشعاعية", ct: "أجهزة التصوير المقطعي", equipment: "أجهزة الأشعة التقليدية" };
  async function exams() {
    const { data } = await sb.from("exams").select("*").eq("archived", false).order("exam_date");
    const row = (x, i) => `<tr data-i="${i}"><td><select class="es">${Object.entries(SUBJ).map(([k, v]) => `<option value="${k}" ${x.subject === k ? "selected" : ""}>${v}</option>`).join("")}</select></td>
      <td><input class="ed" type="date" value="${esc(x.exam_date || x.date || "")}"></td><td><input class="ep" type="date" value="${esc(x.postponed_to || "")}"></td>
      <td><input class="el" placeholder="theory/1,theory/2 (فارغ = الكل)" value="${esc((x.lectures || []).join(","))}" dir="ltr"></td><td>${esc(x.note || "")}</td></tr>`;
    pane.innerHTML = `<h2>📷 اقرأ الجدول من صورة</h2><input type="file" id="img" accept="image/*"><p class="hint" id="rd"></p>
      <h2>📅 الجدول</h2><select id="term"><option value="midterm">مِدترم</option><option value="final">نهائي</option></select>
      <table class="adm" id="et"><tr><th>المادة</th><th>التاريخ</th><th>تأجلت إلى</th><th>المحاضرات</th><th>ملاحظة</th></tr>${(data || []).map(row).join("")}</table>
      <button class="btn ghost" id="add">+ مادة</button> <button class="btn" id="save">✅ تأكيد وحفظ</button> <button class="btn ghost" id="arch">📦 للأرشيف (خلصت الامتحانات)</button>`;
    let rows = data || [];
    document.getElementById("add").onclick = () => { rows.push({}); document.getElementById("et").insertAdjacentHTML("beforeend", row({}, rows.length - 1)); };
    document.getElementById("img").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      document.getElementById("rd").textContent = "جاري القراءة…";
      const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(f); });
      const { data: out, error } = await sb.functions.invoke("exam-reader", { body: { image: b64, media_type: f.type } });
      if (error || !out || out.disabled || out.error) { document.getElementById("rd").textContent = "ما گدرت أقراها (المفتاح أو الصورة). اكتبها يدوياً."; return; }
      document.getElementById("term").value = out.term || "midterm";
      rows = out.rows.map((r) => ({ subject: r.subject, exam_date: r.date, note: r.note || r.name_in_image }));
      document.getElementById("et").innerHTML = '<tr><th>المادة</th><th>التاريخ</th><th>تأجلت إلى</th><th>المحاضرات</th><th>ملاحظة</th></tr>' + rows.map(row).join("");
      document.getElementById("rd").textContent = "✅ انقرت. راجعها وصلّح أي شي، بعدين «تأكيد وحفظ».";
    };
    document.getElementById("save").onclick = async () => {
      const term = document.getElementById("term").value;
      const list = [...document.querySelectorAll("#et tr[data-i]")].map((tr) => ({
        term, subject: tr.querySelector(".es").value, exam_date: tr.querySelector(".ed").value || null, postponed_to: tr.querySelector(".ep").value || null,
        lectures: tr.querySelector(".el").value.split(",").map((s) => s.trim()).filter(Boolean), confirmed: true, archived: false,
      })).filter((x) => x.exam_date);
      await sb.from("exams").update({ archived: true }).eq("archived", false);
      if (list.length) await sb.from("exams").insert(list);
      await setSection("exams", true); alert("انحفظ، وقسم الامتحانات تفعّل."); exams();
    };
    document.getElementById("arch").onclick = async () => { if (!confirm("خلصت الامتحانات؟ ينتقل الجدول للأرشيف وتختفي الأيقونة.")) return;
      await sb.from("exams").update({ archived: true }).eq("archived", false); await setSection("exams", false); exams(); };
  }
  const show = () => { const t = (location.hash || "#stats").slice(1); document.querySelectorAll(".dtabs a").forEach((a) => a.classList.toggle("on", a.dataset.t === t)); ({ stats, reports, control, exams }[t] || stats)(); };
  window.addEventListener("hashchange", show); show();
})();
