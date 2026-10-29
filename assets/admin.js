// ⚙️ لوحة الإدارة /admin/ (27/10؛ الدخول والصلاحيات 29/10). صفحة دخول وحدة لكل الفريق، ماكو رابط إلها بالموقع:
//   محمد (المالك): إيميل + كلمة سر + رمز «كلمات السر» (TOTP) عبر دالة staff-auth (عدّاد محاولات + قفل + تنبيه بالبوت).
//     لحد ما يكمّل أول دخول كامل، دخول الرمز بالإيميل القديم يبقى (حتى ما ينقفل برا). الإعداد من «🔐 الأمان».
//   المساعد (role supervisor) ← StaffPanel (supervisor.js) بالتبويبات اللي اختارها محمد بس.
//   رئيس القسم (role dept) ← AdminDept.viewer (أرقام مجمّعة بس).
//   الطالب: دخوله بـ account.js (مفتاح جلسة ثاني) — ما تغيّر شي.
// كل الصلاحيات بالسيرفر (is_admin / staff_can / الدوال)؛ هذا الملف واجهة بس. ولا كلمة سر ولا رمز ينحفظ هنا.
(async function () {
  const C = window.STUDY_CLOUD || {}, box = document.getElementById("admin");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  if (!C.url || !C.anon || !window.supabase) { box.innerHTML = '<p class="hint">Supabase مو مربوط بعد. الخطوات بـ _النظام/supabase/README.md.</p>'; return; }
  style();
  const isRecovery = /type=recovery/.test(location.hash);
  const sb = supabase.createClient(C.url, C.anon);
  const fn = async (name, body, tok) => {
    try {
      const r = await fetch(`${C.url}/functions/v1/${name}`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + (tok || C.anon), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    } catch (e) { return { status: 0, msg: "ماكو اتصال. تأكد من النت وجرّب مرة ثانية." }; }
  };
  const DEV = { get: () => { try { return localStorage.getItem("adm:dev") || ""; } catch (e) { return ""; } }, set: (t) => { try { if (t) localStorage.setItem("adm:dev", t); } catch (e) { /* */ } } };
  const say = (el, t, ok) => { el.textContent = t || ""; el.className = "lg-msg" + (ok ? " ok" : t ? " bad" : ""); };
  const k0 = new URLSearchParams(location.search).get("k");
  if (k0) history.replaceState(null, "", location.pathname + location.hash);   // الكود ما يبقى بالعنوان ولا بالسجل

  const { data: { session } } = await sb.auth.getSession();
  if (isRecovery && session) return recoveryView();
  if (!session) return loginView("", k0 || "");
  const role = (session.user.app_metadata || {}).role || "";
  if (role === "supervisor") return assistantView();
  if (role === "dept") { box.innerHTML = '<p class="hint">لحظة…</p>'; return window.AdminDept ? AdminDept.viewer(box, sb) : (box.innerHTML = '<p class="hint">اللوحة مو جاهزة.</p>'); }
  if (role === "student") { await sb.auth.signOut({ scope: "local" }); return loginView("", "", "هذا حساب طالب؛ الطلاب يدخلون بالكود من الموقع نفسه."); }
  const { data: isAdmin } = await sb.rpc("is_admin");
  const ost = await fn("staff-auth", { action: "owner_state" }, session.access_token);
  if (!isAdmin) {
    await sb.auth.signOut({ scope: "local" });
    return loginView("", "", ost.owner ? "الحماية مفعّلة: ادخل بكلمة السر + رمز «كلمات السر»." : "هذا الحساب مو حساب الإدارة.");
  }

  // ───────── الدخول الموحّد (29/10، طلب محمد): بطاقة وحدة لكل الفريق، بنفس شكل دخول الطلاب ─────────
  // «الإيميل أو الكود» + «كلمة السر» ← الموقع يعرف منو: إيميل = محمد (بعدها رمز «كلمات السر» إذا مضاف) · SUP-/DEP- = مساعد / رئيس القسم.
  // كلمة سر مؤقتة (من لوحة محمد) ← أول دخول يجبره يختار جديدة. ولا كلمة سر تنحفظ بالصفحة (المؤقتة بالذاكرة بس لحد ما تتغيّر).
  function loginView(mode, code, note) {
    if (window.StaffDoor) StaffDoor.css();
    box.innerHTML = `<div class="sd-card" id="lg">
      <h1 id="lt">دخول الإدارة</h1>
      <p class="sd-sub" id="ls">اكتب الإيميل أو الكود، وكلمة السر. الموقع يعرفك ويفتحلك صلاحياتك.</p>
      <form id="lf" autocomplete="on" novalidate>
        <label class="sd-lab" for="li">الإيميل أو الكود</label>
        <input id="li" name="username" autocomplete="username" dir="ltr" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="name@example.com · SUP-XXXXXXXX">
        <label class="sd-lab" for="lp">كلمة السر</label>
        <input id="lp" type="password" name="password" autocomplete="current-password" dir="ltr" maxlength="200">
        <button class="sd-btn" type="submit">دخول</button></form>
      <form id="mf" hidden autocomplete="off" novalidate>
        <p class="sd-sub">افتح «كلمات السر» بالآيفون ← حساب الموقع ← انسخ <b>رمز التحقق</b> (6 أرقام) واكتبه هنا.</p>
        <label class="sd-lab" for="oc">رمز التحقق</label>
        <input id="oc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" dir="ltr">
        <button class="sd-btn" type="submit">تأكيد</button></form>
      <form id="cf" hidden autocomplete="on" novalidate>
        <input type="text" name="username" autocomplete="username" id="cu" hidden>
        <p class="sd-sub">أول دخول: اختار كلمة سر جديدة خاصة بيك (10 أحرف أو أكثر)، وخلّي مدير كلمات السر بجهازك يحفظها. المؤقتة تبطل بعدها.</p>
        <label class="sd-lab" for="n1">كلمة السر الجديدة</label><input id="n1" type="password" name="new-password" autocomplete="new-password" dir="ltr" minlength="10" maxlength="128">
        <label class="sd-lab" for="n2">أعدها مرة ثانية</label><input id="n2" type="password" autocomplete="new-password" dir="ltr" minlength="10" maxlength="128">
        <button class="sd-btn" type="submit">احفظ وادخل</button></form>
      <p class="sd-msg" id="lm" role="status" aria-live="polite"></p>
      <p class="sd-links"><button type="button" class="sd-link" id="forgot">نسيت كلمة السر؟</button><span id="ecode"></span></p></div>`;
    const $ = (q) => box.querySelector(q), m = $("#lm");
    const msg = (t, ok) => { m.textContent = t || ""; m.className = "sd-msg" + (ok ? " ok" : t ? " bad" : ""); };
    if (note) msg(note);
    if (code) $("#li").value = code;
    let ticket = "", tmp = "", who = "";
    const show = (id) => { ["#lf", "#mf", "#cf"].forEach((f) => ($(f).hidden = f !== id)); $(".sd-links").hidden = id !== "#lf"; $("#ls").hidden = id !== "#lf"; };
    const busy = (f, on) => { const b = $(f + " button[type=submit]"); if (b) b.disabled = on; };
    const finishOwner = async (r) => {
      DEV.set(r.device);
      const { error } = await sb.auth.setSession({ access_token: r.session.access_token, refresh_token: r.session.refresh_token });
      if (error) return msg("ما گدرنا نكمل الدخول. جرّب مرة ثانية.");
      location.reload();
    };
    const finishStaff = async (r) => {
      DEV.set(r.device);
      const { error } = await sb.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
      if (error) return msg("ما گدرنا نكمل الدخول. جرّب مرة ثانية.");
      location.reload();
    };
    $("#lf").onsubmit = async (e) => {
      e.preventDefault();
      const id = $("#li").value.trim(), pw = $("#lp").value;
      if (!id || !pw) return msg("اكتب الإيميل أو الكود، وكلمة السر.");
      busy("#lf", true); msg("لحظة…", true);
      if (id.includes("@")) {
        const r = await fn("staff-auth", { action: "owner_login", email: id, password: pw, dev: DEV.get() });
        $("#lp").value = ""; busy("#lf", false);
        if (r.status !== 200) return msg(r.msg || "ما گدرنا ندخل.");
        if (r.stage === "done") return finishOwner(r);
        ticket = r.ticket; msg(""); show("#mf"); $("#oc").focus(); return;
      }
      const r = await fn("staff-auth", { action: "staff_login", code: id, password: pw, dev: DEV.get(), ua: navigator.userAgent.slice(0, 120) });
      $("#lp").value = ""; busy("#lf", false);
      if (r.stage === "change_password") {
        tmp = pw; who = id; $("#cu").value = id;
        $("#lt").textContent = `أهلاً ${r.name || ""}`; msg(r.msg || "", true); show("#cf"); $("#n1").focus(); return;
      }
      if (r.status !== 200 || !r.token_hash) return msg(r.msg || "ما گدرنا ندخل.");
      finishStaff(r);
    };
    $("#mf").onsubmit = async (e) => {
      e.preventDefault(); busy("#mf", true); msg("لحظة…", true);
      const r = await fn("staff-auth", { action: "owner_mfa", ticket, code: $("#oc").value, dev: DEV.get() });
      $("#oc").value = ""; busy("#mf", false);
      if (r.status === 200) return finishOwner(r);
      msg(r.msg || "الرمز غلط.");
      if (r.error === "expired" || r.error === "locked" || /من جديد/.test(r.msg || "")) show("#lf");
    };
    $("#cf").onsubmit = async (e) => {
      e.preventDefault();
      const a = $("#n1").value, b = $("#n2").value;
      if (a !== b) return msg("الكلمتين مو متطابقات.");
      if (a.length < 10) return msg("كلمة السر لازم 10 أحرف أو أكثر.");
      busy("#cf", true); msg("لحظة…", true);
      const r = await fn("staff-auth", { action: "staff_login", code: who, password: tmp, new_password: a, dev: DEV.get(), ua: navigator.userAgent.slice(0, 120) });
      busy("#cf", false);
      if (r.status === 400) return msg(r.msg || "اختار كلمة سر أقوى.");   // ضعيفة ← يبقى بنفس الخطوة
      $("#n1").value = $("#n2").value = ""; tmp = "";
      if (r.status !== 200 || !r.token_hash) { show("#lf"); $("#lt").textContent = "دخول الإدارة"; return msg(r.msg || "ما گدرنا ندخل. ادخل من جديد."); }
      msg("✅ انحفظت كلمة السر الجديدة.", true); finishStaff(r);
    };
    $("#forgot").onclick = async () => {
      const id = $("#li").value.trim();
      if (!id) return msg("اكتب الإيميل أو الكود أول، بعدين اضغط «نسيت كلمة السر؟».");
      if (!id.includes("@")) return msg("راسل محمد الموسوي يسوّيلك «إعادة تعيين»، وتوصلك كلمة سر مؤقتة جديدة.", true);
      await sb.auth.resetPasswordForEmail(id, { redirectTo: location.origin + location.pathname });
      msg("إذا الإيميل صحيح، يوصلك رابط لتغيير كلمة السر. افتحه من نفس الجهاز.", true);
    };
    // دخول المالك برمز الإيميل: بس قبل ما تتفعّل الحماية (طريق الانتقال، حتى ما ينقفل محمد برا)
    fn("staff-auth", { action: "status" }).then((st) => {
      if (!st.email_code) return;
      const ec = $("#ecode");
      ec.innerHTML = '<button type="button" class="sd-link" id="emc">دخول برمز يوصل للإيميل (مؤقت لحد ما تكمّل الحماية)</button>';
      ec.querySelector("#emc").onclick = () => emailCode();
    });
    $(code ? "#lp" : "#li").focus();
  }
  function emailCode() {
    box.innerHTML = `<div class="sd-card"><h1>دخول الإدارة</h1><p class="sd-sub">رمز دخول يوصل لإيميل الإدارة (مؤقت لحد ما تكمّل الحماية).</p>
      <form id="ef" novalidate><label class="sd-lab" for="em">الإيميل</label><input id="em" type="email" autocomplete="username" dir="ltr">
      <button class="sd-btn" type="submit">أرسل رمز الدخول</button></form>
      <form id="ef2" hidden novalidate><label class="sd-lab" for="code">الرمز اللي وصل للإيميل</label><input id="code" inputmode="numeric" autocomplete="one-time-code" dir="ltr">
      <button class="sd-btn" type="submit">دخول</button></form><p class="sd-msg" id="emm" role="status" aria-live="polite"></p>
      <p class="sd-links"><button type="button" class="sd-link" id="bk">‹ رجوع</button></p></div>`;
    const m = box.querySelector("#emm"), say2 = (t, ok) => { m.textContent = t; m.className = "sd-msg " + (ok ? "ok" : "bad"); };
    box.querySelector("#bk").onclick = () => loginView();
    box.querySelector("#ef").onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.auth.signInWithOtp({ email: box.querySelector("#em").value.trim(), options: { shouldCreateUser: false } });
      if (error) return say2(error.message);
      box.querySelector("#ef2").hidden = false; say2("وصلك رمز بالإيميل.", true); box.querySelector("#code").focus();
    };
    box.querySelector("#ef2").onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.auth.verifyOtp({ email: box.querySelector("#em").value.trim(), token: box.querySelector("#code").value.trim(), type: "email" });
      if (error) return say2(error.message); location.reload();
    };
  }

  // رابط «نسيت كلمة السر» من الإيميل ← كلمة سر جديدة (وإذا عنده رمز: يكتبه هنا حتى يصير التغيير مسموح)
  function recoveryView() {
    box.innerHTML = `<div class="lg"><h2>🔑 كلمة سر جديدة</h2><form class="lg-form" id="rf">
      <label class="lg-f"><span>كلمة السر الجديدة</span><input id="r1" type="password" autocomplete="new-password" dir="ltr" minlength="10" required></label>
      <label class="lg-f"><span>أعدها مرة ثانية</span><input id="r2" type="password" autocomplete="new-password" dir="ltr" minlength="10" required></label>
      <label class="lg-f hidden" id="rcw"><span>رمز «كلمات السر» (6 أرقام)</span><input id="rc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr"></label>
      <button class="btn lg-go" type="submit">احفظ</button></form><p class="lg-msg" id="rm" role="status"></p></div>`;
    const m = box.querySelector("#rm");
    box.querySelector("#rf").onsubmit = async (e) => {
      e.preventDefault();
      const a = box.querySelector("#r1").value, b = box.querySelector("#r2").value;
      if (a !== b) return say(m, "الكلمتين مو متطابقات.");
      const code = box.querySelector("#rc").value.trim();
      if (code) {
        const { data } = await sb.auth.mfa.listFactors();
        const f = (data && data.totp || []).find((x) => x.status === "verified");
        if (f) { const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code }); if (error) return say(m, "الرمز غلط."); }
      }
      const { error } = await sb.auth.updateUser({ password: a });
      if (error) {
        if (/aal|AAL|assurance/i.test(error.message || error.code || "")) { box.querySelector("#rcw").classList.remove("hidden"); return say(m, "حسابك عليه رمز تحقق: اكتب الرمز من «كلمات السر» واضغط احفظ."); }
        return say(m, error.message);
      }
      box.querySelector("#r1").value = box.querySelector("#r2").value = "";
      await sb.auth.signOut({ scope: "local" });
      history.replaceState(null, "", location.pathname);
      loginView("", "", "✅ انحفظت كلمة السر الجديدة. ادخل بيها هسه.");
    };
  }

  // ───────── المساعد ─────────
  async function assistantView() {
    box.innerHTML = '<p class="hint">لحظة…</p>';
    const { data: { session: s } } = await sb.auth.getSession();
    const me = await fn("supervisor", { action: "me" }, s && s.access_token);
    if (me.status !== 200) { await sb.auth.signOut({ scope: "local" }); return loginView("", "", me.msg || "الجلسة انتهت أو الحساب موقوف. ادخل من جديد."); }
    if (!window.StaffPanel) { box.innerHTML = '<p class="hint">اللوحة مو جاهزة.</p>'; return; }
    StaffPanel.mount(box, sb, me);
  }

  // ───────── المالك ─────────
  // «🙏 الشكر» القديم انشال من التبويبات (29/10): الشكر صار بجدول people ← «🙏 الفريق والشكر» (AdminPeople). الدالة thanks() تبقى بلا تبويب.
  const tabs = { stats: "📊 الإحصائيات", reports: "🚩 البلاغات", control: "🎛️ التحكم", exams: "📅 الامتحانات",
    ...(window.AdminHealth ? { health: "🩺 الصحة" } : {}), ...(window.AdminTeam ? { team: "🔑 المساعدين" } : {}), ...(window.AdminDept ? { dept: "🏛️ رئيس القسم" } : {}),
    ...(window.AdminPeople ? { people: "🙏 الفريق والشكر" } : {}), ...(window.AdminStudents ? { students: "🎓 الطلاب" } : {}), ...(window.AdminNotify ? { notify: "🔔 التنبيهات" } : {}), security: "🔐 الأمان" };
  box.innerHTML = `<div class="tm-hello"><span><b>⚙️ لوحة الإدارة</b> · أهلاً محمد</span><span><button class="btn ghost" type="button" data-as-student>👁️ شوف كطالب</button></span></div>
    ${ost.mfa_required ? "" : '<div class="alert lg-warn"><b>🔐 كمّل حماية الدخول</b><p>هسه الدخول برمز الإيميل بس. من «🔐 الأمان»: حط كلمة سر، وضيف رمز التحقق بـ «كلمات السر» بالآيفون، وجرّب الدخول الجديد مرة وحدة — بعدها تتفعّل الحماية وحدها.</p><a class="btn" href="#security">🔐 الأمان</a></div>'}
    <nav class="dtabs">${Object.entries(tabs).map(([k, v]) => `<a href="#${k}" data-t="${k}">${v}</a>`).join("")}</nav><div id="pane"></div>
    <p class="hint"><button class="btn ghost" id="out">خروج</button></p>`;
  document.getElementById("out").onclick = async () => { await sb.auth.signOut({ scope: "local" }); location.reload(); };
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
  // 💵 الصرف هذا الشهر + التوقع لآخر الشهر (السعر: Haiku 5.5 = 0.10$/0.50$ لكل مليون توكن، يتغيّر من assistant_budget.price_in/price_out)
  async function spend(bud) {
    const box = document.getElementById("spend"); if (!box) return;
    const d = new Date(), m = d.toISOString().slice(0, 8) + "01", days = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getDate();
    const { data, error } = await sb.rpc("assistant_spend_admin", { m });
    if (error) { box.textContent = "ما گدرنا نقرا الصرف."; return; }
    const r = (Array.isArray(data) ? data[0] : data) || {};
    const usd = (r.tin || 0) * (bud.price_in ?? 0.1) / 1e6 + (r.tout || 0) * (bud.price_out ?? 0.5) / 1e6;
    // 💵 الميزانية الذكية: الحالية = الأساس + درجات هالشهر (assistant_budget_steps)، والسقف cap_usd
    const base = bud.monthly_usd ?? 50, step = bud.step_usd ?? 25, top = bud.cap_usd ?? 100;
    const { data: steps } = await sb.from("assistant_budget_steps").select("level").eq("month", m);
    const lv = (steps || []).reduce((a, x) => Math.max(a, x.level), 0), paused = lv >= 10;
    const cap = Math.min(top, base + step * lv);
    const fc = usd / Math.max(1, d.getUTCDate()) * days, pct = Math.round(usd / cap * 100);
    box.innerHTML = `<b>الصرف هذا الشهر:</b> ${usd.toFixed(2)}$ · ${r.asks || 0} سؤال<br>` +
      `<b>الميزانية الحالية:</b> ${cap}$ (${pct}%)${lv && !paused ? ` — ارتفعت وحدها ${lv} مرة` : ""} · الأساس ${base}$ والسقف ${top}$، وترجع ${base}$ أول الشهر` +
      (paused ? `<br>⛔ <b>المساعد متوقف مؤقتاً</b> لحد أول الشهر (وصل السقف)` : "") + `<br>` +
      `<b>التوقع لآخر الشهر:</b> ≈ ${fc.toFixed(2)}$ ${fc >= top ? "⚠️ يعبر السقف — المساعد يوگف بلطف لما يوصل" : fc >= cap ? "↗️ الميزانية راح ترتفع وحدها" : "✅ ضمن الميزانية"}`;
  }
  async function control() {
    const [ann, sec, bud, gate, req] = await Promise.all([getSet("announcement"), getSet("sections"), getSet("assistant_budget"), getSet("gate"), getSet("code_requests")]);
    pane.innerHTML = `<h2>📣 شريط الإعلان</h2><textarea id="an" rows="2">${esc(ann.text)}</textarea>
      <label><input type="checkbox" id="anon" ${ann.on ? "checked" : ""}> ظاهر</label><button class="btn" id="ans">حفظ</button>
      <h2>🧩 الأقسام</h2>
      <label><input type="checkbox" id="sx" ${sec.exams ? "checked" : ""}> 📅 الامتحانات (أيقونة بالرئيسية وقت الامتحانات بس)</label>
      <label><input type="checkbox" id="sa" ${sec.assistant ? "checked" : ""}> 🤖 مساعد الطالب (بعد ما ينحط المفتاح)</label>
      <h2>🎓 الموقع للطلاب بالكود</h2>
      <p class="hint">مطفي = كلشي مفتوح مثل هسه. مشغّل = المحاضرات والاختبارات ومصطلحات المحاضرات و«مساحتي» والمساعد الكامل لطلابنا بالكود؛ الأطلس والملوّنة والأجهزة والمصطلحات العامة مفتوحة للكل. (يوصل للطلاب خلال 10 دقائق.)</p>
      <label><input type="checkbox" id="gon" ${gate.on ? "checked" : ""}> 🔒 بوابة الطلاب (settings.gate.on)</label>
      <label><input type="checkbox" id="ron" ${req.on ? "checked" : ""}> 📨 طلب الكود من البوت (settings.code_requests.on)</label>
      <h2>💵 ميزانية المساعد</h2><div id="spend" class="hint">…</div><label>شهرياً ($) <input id="bm" type="number" value="${bud.monthly_usd ?? 50}"></label>
      <label>أسئلة يومياً لكل طالب/جهاز <input id="bd" type="number" value="${bud.daily_per_device ?? 15}"></label>
      <label>تنبيه بالبوت عند (%) <input id="bp" type="number" min="10" max="100" value="${bud.alert_pct ?? 70}"></label><button class="btn" id="bs">حفظ</button>`;
    spend(bud);
    document.getElementById("ans").onclick = async () => { await sb.from("settings").upsert({ key: "announcement", value: { text: document.getElementById("an").value, on: document.getElementById("anon").checked } }); alert("انحفظ"); };
    document.getElementById("sx").onchange = (e) => setSection("exams", e.target.checked);
    document.getElementById("sa").onchange = (e) => setSection("assistant", e.target.checked);
    // 🎓 مفتاحين البوابة (29/10): دمج ويّا القيم الموجودة (open، الحدود) — تأكيد قبل أي تغيير لأنه يغيّر دخول الطلاب الحقيقيين
    const flip = async (key, el, onMsg, offMsg) => {
      if (!confirm(el.checked ? onMsg : offMsg)) { el.checked = !el.checked; return; }
      const cur = await getSet(key);
      const { error } = await sb.from("settings").upsert({ key, value: { ...cur, on: el.checked }, at: new Date().toISOString() });
      if (error) { el.checked = !el.checked; alert(error.message); }
    };
    document.getElementById("gon").onchange = (e) => flip("gate", e.target,
      "تشغّل بوابة الطلاب؟ المحاضرات والاختبارات تصير لطلابنا بالكود بس (الأطلس والملوّنة والأجهزة تبقى مفتوحة).", "تطفّي البوابة؟ كلشي يرجع مفتوح للكل.");
    document.getElementById("ron").onchange = (e) => flip("code_requests", e.target,
      "تشغّل طلب الكود من البوت؟ أي أحد يگدر يطلب، والطلب يوصلك هنا بتبويب «🎓 الطلاب» وبالبوت.", "تطفّي طلب الكود من البوت؟");
    // دمج ويّا القيم الموجودة (حدود IP والحد الكلّي تبقى) — الحفظ القديم كان يمسحها
    document.getElementById("bs").onclick = async () => {
      const cur = await getSet("assistant_budget"), n = (id) => +document.getElementById(id).value;
      const value = { ...cur, monthly_usd: n("bm"), daily_per_device: n("bd"), alert_pct: n("bp") };
      const { data: g } = await sb.from("settings").select("value").eq("key", "gate").single();
      await sb.from("settings").upsert({ key: "assistant_budget", value, at: new Date().toISOString() });
      if (g) await sb.from("settings").upsert({ key: "gate", value: { ...g.value, student_daily: value.daily_per_device }, at: new Date().toISOString() });
      alert("انحفظ"); spend(value);
    };
  }
  const SUBJ = { anatomy: "تشريح", radiography: "التصوير الشعاعي", protection: "الوقاية", examinations: "الفحوصات الشعاعية", ct: "أجهزة التصوير المقطعي", equipment: "أجهزة الأشعة التقليدية" };
  // 📅 الامتحانات (27/10، نص + نوع + المشمول 29/10): صورة أو نص ← قراءة (exam-reader) ← مراجعة ← «تأكيد وحفظ». المشمول من قائمة المحاضرات الحقيقية.
  async function exams() {
    const [{ data }, LEC] = await Promise.all([
      sb.rpc("exams_admin", { only_open: true }),   // 🔒 كل الأعمدة (ويّا note) للمالك بس
      fetch(new URL("../study/data.json", location.href)).then((r) => r.json()).catch(() => ({})),
    ]);
    const TYP = [["", "غير محدد"], ["theory", "نظري"], ["practical", "عملي"]];
    const lecBox = (subj, sel) => {
      const L = (LEC[subj] || {}).lectures || [];
      return L.length ? L.map((l) => { const id = `${l.type}/${l.num}`;
        return `<label class="exl"><input type="checkbox" value="${esc(id)}" ${sel.includes(id) ? "checked" : ""}><span>${esc(l.type_ar)} م${l.num} — ${esc(l.title_ar)}</span></label>`; }).join("")
        : `<p class="hint">${subj ? "ماكو محاضرات منزّلة لهالمادة بعد." : "اختار المادة أول."}</p>`;
    };
    const count = (div) => { const n = div.querySelectorAll(".exls input:checked").length; div.querySelector(".exn").textContent = n ? `${n} محاضرة` : "ما متأكدين بعد"; };
    const card = (x) => `<div class="exrow" data-note="${esc(x.note || "")}" data-id="${esc(x.id || "")}">
      <label>المادة<select class="es"><option value="" ${x.subject ? "" : "selected"}>— اختار المادة —</option>${Object.entries(SUBJ).map(([k, v]) => `<option value="${k}" ${x.subject === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>النوع<select class="ety">${TYP.map(([k, v]) => `<option value="${k}" ${(x.type || "") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>التاريخ<input class="ed" type="date" value="${esc(x.exam_date || x.date || "")}"></label>
      <label>تأجل إلى<input class="ep" type="date" value="${esc(x.postponed_to || "")}"></label>
      <details class="exlec"><summary>📚 المشمول: <b class="exn"></b></summary><p class="hint">فارغ = «ما متأكدين بعد» (يطلع للطلاب هيچ). حدّد بس اللي متأكد منه.</p><div class="exls">${lecBox(x.subject || "", x.lectures || [])}</div></details>
      ${x.note ? `<p class="hint exnote">📝 ${esc(x.note)}</p>` : ""}
      <button type="button" class="btn ghost exdel">✕ شيل هذا الصف من الجدول</button></div>`;
    pane.innerHTML = `<h2>📷 اقرأ الجدول من صورة</h2><input type="file" id="img" accept="image/*">
      <h2>📋 أو الصق الجدول كنص</h2><textarea id="etx" rows="5" placeholder="مثلاً: الوقاية نظري الأحد 3/11 من محاضرة 1 لـ 3"></textarea>
      <button class="btn ghost exbtn" id="rtx">📖 اقرأ النص</button><p class="hint" id="rd"></p>
      <h2>📅 الجدول</h2><label>الفصل<select id="term"><option value="midterm">مِدترم</option><option value="final">نهائي</option></select></label>
      <div id="et" class="exlist"></div>
      <div class="exacts"><button class="btn ghost exbtn" id="add">+ مادة</button><button class="btn exbtn" id="save">✅ تأكيد وحفظ</button><button class="btn ghost exbtn" id="arch">📦 للأرشيف (خلصت الامتحانات)</button></div>
      <p class="hint">💡 تگدر تدز الجدول (صورة أو نص) للبوت @mohammed_almusawy_bot بالخاص، ويرجعلك الصفوف حتى تأكدها.</p>
      <p class="hint">📦 كل امتحان يفوت يومه ينتقل للأرشيف وحده (00:05 بتوقيت بغداد)، والأيقونة تختفي لما ماكو امتحان جاي. <a href="../exams/" target="_blank" rel="noopener">👁️ شوف صفحة الطلاب</a></p>`;
    const et = document.getElementById("et"), rd = document.getElementById("rd");
    if (data && data[0]) document.getElementById("term").value = data[0].term || "midterm";
    const draw = (rows) => { et.innerHTML = rows.length ? rows.map(card).join("") : '<p class="hint">ماكو امتحانات بالجدول هسه.</p>'; et.querySelectorAll(".exrow").forEach(count); };
    draw(data || []);
    et.addEventListener("change", (ev) => {
      const div = ev.target.closest(".exrow"); if (!div) return;
      if (ev.target.classList.contains("es")) div.querySelector(".exls").innerHTML = lecBox(ev.target.value, []);
      count(div);
    });
    et.addEventListener("click", (ev) => { const b = ev.target.closest(".exdel"); if (b) b.closest(".exrow").remove(); });
    document.getElementById("add").onclick = () => { et.querySelector(".exrow") || (et.innerHTML = ""); et.insertAdjacentHTML("beforeend", card({})); count(et.lastElementChild); };
    const read = async (body) => {
      rd.textContent = "جاري القراءة…";
      const { data: out, error } = await sb.functions.invoke("exam-reader", { body });
      if (error || !out || out.disabled || out.error || !(out.rows || []).length) { rd.textContent = "ما گدرت أقراه (المفتاح أو الصورة/النص). اكتبه يدوياً بـ «+ مادة»."; return; }
      document.getElementById("term").value = out.term || "midterm";
      // (المرحلة 2) نفس المادة+النوع موجودة بالجدول ← ناخذ رقمها حتى يتحدّث بمكانه (مو صف جديد + القديم يختفي)
      const used = new Set(), idOf = (r) => { const m = (data || []).find((x) => !used.has(x.id) && x.subject === r.subject && (x.type || null) === (r.type || null)); if (m) { used.add(m.id); return m.id; } return null; };
      draw(out.rows.map((r) => ({ id: idOf(r), subject: r.subject, type: r.type, exam_date: r.date, postponed_to: r.postponed_to, lectures: r.lectures || [],
        note: [r.subject ? "" : `«${r.name_in_source}»`, r.note].filter(Boolean).join(" · ") })));
      rd.textContent = "✅ انقرت — بعدها ما انحفظت. راجعها وصلّح أي شي (المادة، النوع، التاريخ، المشمول)، بعدين «تأكيد وحفظ».";
    };
    document.getElementById("img").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const b64 = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(f); });
      read({ image: b64, media_type: f.type });
    };
    document.getElementById("rtx").onclick = () => { const t = document.getElementById("etx").value.trim(); if (t) read({ text: t }); };
    document.getElementById("save").onclick = async () => {
      const term = document.getElementById("term").value;
      const all = [...et.querySelectorAll(".exrow")].map((div) => ({ id: Number(div.dataset.id) || null,
        term, subject: div.querySelector(".es").value, type: div.querySelector(".ety").value || null,
        exam_date: div.querySelector(".ed").value || null, postponed_to: div.querySelector(".ep").value || null,
        lectures: [...div.querySelectorAll(".exls input:checked")].map((i) => i.value), note: div.dataset.note || null, confirmed: true, archived: false,
      }));
      const list = all.filter((x) => x.exam_date && x.subject);
      if (all.length > list.length && !confirm(`${all.length - list.length} صف بلا مادة أو تاريخ ما راح ينحفظ. نكمّل؟`)) return;
      // 🕰️ تاريخ فات (بتوقيت بغداد) ← ينحفظ بس يروح للأرشيف وحده — نسأل حتى ما يصير غلط بالسنة
      const bgd = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
      const old = list.filter((x) => (x.postponed_to || x.exam_date) < bgd).length;
      if (old && !confirm(`${old} امتحان تاريخه فات (يروح للأرشيف مباشرة). تأكد من السنة. نكمّل؟`)) return;
      // (المرحلة 2، 29/10) الصف الموجود يتحدّث بمكانه (بلا نسخ مكررة بأرشيف الطلاب)، الجديد ينضاف،
      // واللي شلته من الجدول يصير confirmed = false (ما يطلع لأحد، ولا ينمسح).
      const keep = new Set(list.filter((x) => x.id).map((x) => x.id));
      const goneRows = (data || []).filter((x) => !keep.has(x.id));
      // امتحان صار يومه أو فات ← يروح للأرشيف ويبقى (مؤكَّد)؛ اللي بعده جاي وشلته ← confirmed = false (ما يطلع لأحد، وما ينمسح)
      const done = goneRows.filter((x) => (x.postponed_to || x.exam_date) <= bgd).map((x) => x.id), gone = goneRows.filter((x) => !done.includes(x.id)).map((x) => x.id);
      if (done.length) { const { error } = await sb.from("exams").update({ archived: true }).in("id", done); if (error) return alert(error.message); }
      if (gone.length) { const { error } = await sb.from("exams").update({ confirmed: false, archived: true }).in("id", gone); if (error) return alert(error.message); }
      for (const x of list.filter((r) => r.id)) { const { id, ...v } = x; const { error } = await sb.from("exams").update(v).eq("id", id); if (error) return alert(error.message); }
      const add = list.filter((x) => !x.id).map(({ id, ...v }) => v);
      if (add.length) { const { error } = await sb.from("exams").insert(add); if (error) return alert(error.message); }
      try { localStorage.removeItem("t:nextexam"); } catch (e) { /* */ }
      await setSection("exams", true); alert("انحفظ، وقسم الامتحانات تفعّل."); exams();
    };
    document.getElementById("arch").onclick = async () => { if (!confirm("خلصت الامتحانات؟ ينتقل الجدول للأرشيف وتختفي الأيقونة.")) return;
      await sb.from("exams").update({ archived: true }).eq("archived", false); await setSection("exams", false); exams(); };
  }

  // 🙏 شكر وتقدير (28/10): إضافة/تعديل/حذف/ترتيب (سحب) + «وافق على ذكر اسمه ✅». التغيير يطلع بالموقع فوراً (RLS: الطلاب يشوفون الموافقين بس).
  async function thanks() {
    const SEC = { "chest-abdomen": "🫁 أشعة الصدر والبطن", "spine-joints": "🦴 الفقرات والمفاصل", "fractures": "🩼 الكسور", "paeds": "🧒 أشعة الأطفال" };
    const { data, error } = await sb.from("thanks").select("*").order("sort");
    if (error) { pane.innerHTML = `<p class="hint">${esc(error.message)}</p>`; return; }
    const opt = (v) => Object.entries(SEC).map(([k, t]) => `<option value="${k}" ${v === k ? "selected" : ""}>${t}</option>`).join("") + `<option value="" ${v ? "" : "selected"}>— بلا قسم —</option>`;
    const row = (d) => `<li class="thr" draggable="true" data-id="${esc(d.id)}"><span class="drag" title="اسحب للترتيب">⠿</span>
      <input class="tn" value="${esc(d.name)}" placeholder="الاسم"><input class="ts" value="${esc(d.specialty)}" placeholder="الاختصاص">
      <select class="tq">${opt(d.section)}</select>
      <label class="tc"><input type="checkbox" ${d.consent ? "checked" : ""}> وافق على ذكر اسمه ✅</label>
      <button class="btn ghost tsave">حفظ</button><button class="btn ghost tdel">حذف</button></li>`;
    pane.innerHTML = `<h2>🙏 شكر وتقدير</h2><p class="hint">الاسم ما يطلع بالموقع إلا إذا «وافق ✅» مفعّل. اسحب ⠿ للترتيب.</p>
      <ul id="thl" class="thl">${(data || []).map(row).join("")}</ul>
      <h3>➕ طبيب جديد</h3><div class="thr"><input id="nn" placeholder="د. …"><input id="ns" placeholder="الاختصاص"><select id="nq">${opt("")}</select><button class="btn" id="nadd">إضافة</button></div>`;
    const ul = document.getElementById("thl");
    const save = async (li) => {
      const { error } = await sb.from("thanks").update({ name: li.querySelector(".tn").value.trim(), specialty: li.querySelector(".ts").value.trim(),
        section: li.querySelector(".tq").value, consent: li.querySelector(".tc input").checked, updated_at: new Date().toISOString() }).eq("id", li.dataset.id);
      li.querySelector(".tsave").textContent = error ? "✗ " + error.message : "✓ انحفظ";
    };
    ul.addEventListener("click", async (ev) => {
      const li = ev.target.closest(".thr"); if (!li) return;
      if (ev.target.closest(".tsave")) save(li);
      if (ev.target.closest(".tdel")) {
        const b = ev.target.closest(".tdel");
        if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "متأكد؟ اضغط مرة ثانية"; return; }
        const { error } = await sb.from("thanks").delete().eq("id", li.dataset.id); if (!error) li.remove();
      }
    });
    ul.addEventListener("change", (ev) => { const li = ev.target.closest(".thr"); if (li && ev.target.closest(".tc")) save(li); });
    let drag = null;
    ul.addEventListener("dragstart", (ev) => { drag = ev.target.closest(".thr"); drag.classList.add("dragging"); });
    ul.addEventListener("dragover", (ev) => { ev.preventDefault(); const over = ev.target.closest(".thr"); if (over && over !== drag) { const r = over.getBoundingClientRect(); ul.insertBefore(drag, ev.clientY < r.top + r.height / 2 ? over : over.nextSibling); } });
    ul.addEventListener("dragend", async () => { drag.classList.remove("dragging"); drag = null;
      const ids = [...ul.children].map((li) => li.dataset.id);
      await Promise.all(ids.map((id, i) => sb.from("thanks").update({ sort: i + 1 }).eq("id", id))); });
    document.getElementById("nadd").onclick = async () => {
      const name = document.getElementById("nn").value.trim(); if (!name) return;
      const id = "d-" + Date.now().toString(36);
      const { error } = await sb.from("thanks").insert({ id, name, specialty: document.getElementById("ns").value.trim(), section: document.getElementById("nq").value, consent: false, sort: (data || []).length + 1 });
      if (error) return alert(error.message); thanks();
    };
  }
  // 🔐 الأمان: كلمة السر ← رمز التحقق (كلمات السر بالآيفون) ← تجربة الدخول الجديد (بعدها الحماية تتفعّل وحدها)
  async function security() {
    pane.innerHTML = '<p class="hint">لحظة…</p>';
    const { data: { session: s } } = await sb.auth.getSession();
    const st = await fn("staff-auth", { action: "owner_state" }, s && s.access_token);
    const li = (ok, t) => `<li>${ok ? "✅" : "⏳"} ${t}</li>`;
    pane.innerHTML = `<h2>🔐 أمان الدخول</h2>
      <ul class="sec-list">${li(st.has_password, "كلمة السر")}${li(st.has_totp, "رمز التحقق («كلمات السر» بالآيفون)")}${li(st.mfa_required, "الحماية مفعّلة: كلمة سر + رمز، ودخول الإيميل موقوف")}</ul>
      <h3>1) كلمة السر</h3><p class="hint">اكتبها إنت بنفسك (12 حرف أو أكثر). خلّي الآيفون يقترح وحدة قوية ويحفظها.</p>
      <form class="lg-form" id="pwf" autocomplete="on"><input type="email" name="username" autocomplete="username" value="${esc(s && s.user.email)}" hidden>
        <label class="lg-f"><span>كلمة السر الجديدة</span><input id="p1" type="password" autocomplete="new-password" minlength="12" dir="ltr" required></label>
        <label class="lg-f"><span>أعدها مرة ثانية</span><input id="p2" type="password" autocomplete="new-password" minlength="12" dir="ltr" required></label>
        <label class="lg-f hidden" id="pnw"><span>الرمز اللي وصل للإيميل (تأكيد)</span><input id="pn" inputmode="numeric" autocomplete="one-time-code" dir="ltr"></label>
        <button class="btn" type="submit">${st.has_password ? "غيّر كلمة السر" : "احفظ كلمة السر"}</button></form><p class="lg-msg" id="pwm" role="status"></p>
      <h3>2) رمز التحقق بـ «كلمات السر»</h3>
      ${st.has_totp && !security.replace ? `<p>✅ مضاف. كل دخول يطلب الرمز (6 أرقام يتبدل كل 30 ثانية).</p>${st.mfa_required ? '<p class="hint">تغيير الرمز مقفول بالسيرفر (حماية). إذا تحتاج تبدّله (آيفون جديد): <button class="btn ghost" id="unl" type="button">🔓 افتح التغيير 10 دقائق</button></p>' : ""}` : `<p class="hint">اضغط الزر يطلعلك QR. بالآيفون: الإعدادات ← كلمات السر (أو تطبيق «كلمات السر») ← افتح حساب الموقع (أو ضيفه) ← «إعداد رمز التحقق…» ← «مسح رمز QR ضوئياً» ← وجّه الكاميرا على الـ QR. بعدين اكتب الرمز الظاهر تحت.</p>
        <button class="btn" id="en" type="button">➕ أضف رمز التحقق</button><div id="qr"></div>`}
      <h3>3) جرّب الدخول الجديد</h3>
      ${st.mfa_required ? "<p>✅ الحماية مفعّلة. الدخول بكلمة السر + الرمز بس، و5 محاولات غلط تقفل الدخول 15 دقيقة وتوصلك رسالة بالبوت.</p>"
        : `<p class="hint">بعد الخطوتين: اطلع وادخل بالإيميل + كلمة السر + الرمز. أول ما ينجح، الحماية تتفعّل وحدها ودخول الإيميل يوگف.</p>
           <button class="btn" id="try" type="button" ${st.has_password && st.has_totp ? "" : "disabled"}>🚪 اطلع وجرّب الدخول الجديد</button>`}
      <h3>الأجهزة</h3><button class="btn ghost" id="allout" type="button">اطلع من كل الأجهزة</button>
      <details><summary>إذا ضاع الآيفون (طريق الطوارئ)</summary><p class="hint">«كلمات السر» تنحفظ بـ iCloud، فتلگاها بأي جهاز Apple مسجّل بنفس الحساب (الماك: الإعدادات ← كلمات السر).
        إذا ضاعت كلها: من الماك بالـ Terminal بمجلد _النظام شغّل: <code dir="ltr">supabase db query --linked --workdir . -f "supabase/طوارئ-دخول-المالك.sql"</code> (يرجّع دخول الإيميل)، وبعدها من لوحة Supabase ← Authentication ← Users ← حسابك ← احذف عامل الـ MFA، وضيف رمز جديد من هنا.</p></details>`;
    const pm = pane.querySelector("#pwm");
    pane.querySelector("#pwf").onsubmit = async (e) => {
      e.preventDefault();
      const a = pane.querySelector("#p1").value, b = pane.querySelector("#p2").value, nonce = pane.querySelector("#pn").value.trim();
      if (a !== b) return say(pm, "الكلمتين مو متطابقات.");
      say(pm, "لحظة…", true);
      const { error } = await sb.auth.updateUser(nonce ? { password: a, nonce } : { password: a });
      if (error) {
        if (/reauth/i.test((error.code || "") + (error.message || ""))) {
          await sb.auth.reauthenticate(); pane.querySelector("#pnw").classList.remove("hidden");
          return say(pm, "للتأكيد وصلك رمز بالإيميل: اكتبه واضغط الزر مرة ثانية.", true);
        }
        return say(pm, /aal|assurance/i.test(error.message || "") ? "لازم تكون داخل بالرمز حتى تغيّرها." : error.message);
      }
      pane.querySelector("#p1").value = pane.querySelector("#p2").value = pane.querySelector("#pn").value = "";
      say(pm, "✅ انحفظت. خلّي «كلمات السر» يحفظها لما يسألك.", true); setTimeout(security, 1500);
    };
    const en = pane.querySelector("#en");
    if (en) en.onclick = async () => {
      en.disabled = true;
      const { data: lf } = await sb.auth.mfa.listFactors();
      for (const f of (lf && lf.all) || []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "iPhone " + new Date().toISOString().slice(0, 10) + "-" + Math.random().toString(36).slice(2, 6), issuer: "Radiology Study" });
      if (error || !data) { en.disabled = false; return say(pm, "ما گدرنا نضيف الرمز: " + ((error && error.message) || "")); }
      const q = pane.querySelector("#qr");
      q.innerHTML = `<div class="qr-box"><img alt="QR رمز التحقق — امسحه من «كلمات السر» بالآيفون" width="200" height="200"></div>
        <p><a class="btn ghost" id="otp-link">📱 إذا إنت هسه على الآيفون: اضغط هنا يفتح «كلمات السر»</a></p>
        <form class="lg-form" id="vf"><label class="lg-f"><span>الرمز الظاهر بـ «كلمات السر»</span><input id="vc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr" required></label>
        <button class="btn" type="submit">✅ تأكيد</button></form><p class="lg-msg" id="vm" role="status"></p>`;
      q.querySelector("img").src = data.totp.qr_code;      // الـ QR يطلع على شاشتك بس؛ ما ينحفظ بأي مكان
      q.querySelector("#otp-link").href = data.totp.uri;
      q.querySelector("#vf").onsubmit = async (e) => {
        e.preventDefault();
        const { error: ve } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code: q.querySelector("#vc").value.trim() });
        if (ve) return say(q.querySelector("#vm"), "الرمز غلط أو انتهى. اكتب الرمز الجديد.");
        say(q.querySelector("#vm"), "✅ انضاف رمز التحقق.", true); setTimeout(security, 1200);
      };
    };
    const unl = pane.querySelector("#unl");
    if (unl) unl.onclick = async () => {
      const r = await fn("staff-auth", { action: "owner_factor_unlock" }, s && s.access_token);
      if (r.status !== 200) return say(pm, "ما انفتح (لازم تكون داخل بكلمة السر + الرمز).");
      security.replace = true; await security(); security.replace = false;   // يطلع زر «أضف رمز التحقق»؛ الرمز القديم يبقى لحد ما تحذفه من لوحة Supabase أو يتبدل
    };
    const tr = pane.querySelector("#try");
    if (tr) tr.onclick = async () => { await sb.auth.signOut({ scope: "local" }); location.hash = ""; location.reload(); };
    pane.querySelector("#allout").onclick = async () => { if (!confirm("تطلع من كل الأجهزة (حتى هذا)؟")) return; await sb.auth.signOut({ scope: "global" }); location.reload(); };
  }

  const show = () => { const t = (location.hash || "#stats").slice(1); document.querySelectorAll(".dtabs a").forEach((a) => a.classList.toggle("on", a.dataset.t === t)); ({ stats, reports, control, exams, security, health: () => window.AdminHealth ? AdminHealth.mount(pane, sb) : stats(), team: () => window.AdminTeam ? AdminTeam.mount(pane, sb) : stats(),
    dept: () => window.AdminDept ? AdminDept.mount(pane, sb) : stats(), people: () => window.AdminPeople ? AdminPeople.mount(pane, sb) : stats(), notify: () => window.AdminNotify ? AdminNotify.mount(pane, sb) : stats(),
    students: () => window.AdminStudents ? AdminStudents.mount(pane, sb) : stats() }[t] || stats)(); };
  window.addEventListener("hashchange", show); show();

  function style() {
    if (document.getElementById("adm-auth-css")) return;
    const st = document.createElement("style"); st.id = "adm-auth-css";
    st.textContent = `
#admin .dtabs{flex-wrap:wrap}#admin .dtabs a{flex:1 1 auto;min-width:104px;min-height:44px;display:flex;align-items:center;justify-content:center}
.lg{max-width:440px;margin:8px auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.lg h2{margin-top:0}.lg-tabs{display:flex;gap:6px;margin:0 0 14px;background:var(--bg,transparent);border:1px solid var(--line);border-radius:12px;padding:4px}
.lg-tabs button{flex:1;min-height:44px;border:0;border-radius:9px;background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
.lg-tabs button[aria-selected=true]{background:var(--brand);color:var(--brand-ink)}
.lg-form{display:grid;gap:10px;margin:0 0 6px}.lg-f{display:grid;gap:4px}.lg-f span{font-size:14px;color:var(--muted);font-weight:600}
.lg-f input,#admin .tm-f input,#admin .tm-f select,#admin .tm-f textarea{width:100%;box-sizing:border-box;min-height:46px;font-size:16px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--card);color:var(--ink)}
.lg-f input:focus-visible,.lg-tabs button:focus-visible,.lg-link:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
.lg-go{min-height:48px;width:100%;font-size:16px}.lg-msg{min-height:1.4em;margin:6px 0;font-size:15px}.lg-msg.ok{color:var(--muted)}.lg-msg.bad{color:#B3261E;font-weight:700}
.lg-links{font-size:14px;margin:4px 0 0}.lg-link{background:none;border:0;padding:6px 0;min-height:44px;color:var(--brand);font:inherit;text-decoration:underline;cursor:pointer}
.lg-warn{border-color:var(--brand)}.sec-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.qr-box{background:#fff;display:inline-block;padding:10px;border-radius:12px;border:1px solid var(--line)}.qr-box img{display:block;width:200px;height:200px}
#admin .tm-hello{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px}
#admin .tm-new{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0;display:grid;gap:10px}
#admin .tm-new h3{margin:0}#admin .tm-f{display:grid;gap:4px}#admin .tm-f span{font-size:14px;color:var(--muted);font-weight:600}
#admin .tm-perms{border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px 14px}#admin .tm-perms label{min-height:40px;display:flex;align-items:center;gap:6px}
#admin .tm-once{border:2px solid var(--brand);border-radius:12px;padding:10px;margin:8px 0}#admin .code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:17px;font-weight:700;letter-spacing:.5px}
#admin .tm-exp,#admin .tm-req{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px;margin:0 0 8px;display:grid;gap:4px}
#admin .tm-chips{display:flex;flex-wrap:wrap;gap:6px}#admin .tm-chip{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:13px}
#admin .tm-form{display:grid;gap:10px}#admin .tm-msg.bad{color:#B3261E;font-weight:700}
#admin .ib{min-width:44px;min-height:44px}#admin .tm-cards{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}#admin .tm-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;gap:10px}#admin .tm-card-h{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}#admin .tm-card-h small{display:block;color:var(--muted)}#admin .tm-card-r{display:flex;align-items:end;justify-content:space-between;gap:8px;flex-wrap:wrap}#admin .tm-exp-f{max-width:200px}#admin .tm-card-a{display:flex;flex-wrap:wrap;gap:6px}#admin .tm-perms legend{padding:0 4px}#admin .scroll-x{overflow-x:auto}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .lg-msg.bad,:root:not([data-theme=light]) #admin .tm-msg.bad{color:#FF8A80}}
:root[data-theme=dark] .lg-msg.bad,:root[data-theme=dark] #admin .tm-msg.bad{color:#FF8A80}`;
    document.head.appendChild(st);
  }
})();
