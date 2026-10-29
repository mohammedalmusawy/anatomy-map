// 👥 صفحة المشرف (منسّق المحاضرات) — 29/10/2026. نايمة لحد «فعّل تحسين» (settings.supervisor.on بالسيرفر).
// الدخول بكود SUP-XXXXXXXX (أو رابط ?k=…) ← دالة supervisor ← verifyOtp ← جلسة (عدة أجهزة).
// كل الصلاحيات تنفحص بالسيرفر (الدالة)؛ هذا الملف واجهة بس. ماكو حذف ولا إعدادات ولا نشر من هنا.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const root = document.getElementById("sup");
  if (!root) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { theory: "نظري", practical: "عملي" };
  const ST = { uploading: "⏳ ما كمل الرفع", new: "🕓 بانتظار محمد", invalid: "⚠️ الملف مو PDF", accepted: "✅ قبلها محمد", rejected: "✖️ ما انقبلت", done: "✔️ تمت" };
  let device;
  try { device = localStorage.getItem("t:device"); if (!device) { device = crypto.randomUUID(); localStorage.setItem("t:device", device); } } catch (e) { device = crypto.randomUUID(); }
  let sb = null, me = null, subjects = [];

  if (!C.url || !C.anon || !window.supabase) { root.innerHTML = '<p class="empty">الخدمة مو متوفرة هسه.</p>'; return; }
  sb = window.supabase.createClient(C.url, C.anon, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "t:sup-session", detectSessionInUrl: false } });

  async function api(body) {
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch(`${C.url}/functions/v1/supervisor`, { method: "POST",
      headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : C.anon), "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: r.status, ...(await r.json().catch(() => ({}))) };
  }
  const msg = (el, t, ok) => { el.textContent = t || ""; el.className = "tm-msg" + (ok ? " ok" : t ? " bad" : ""); };

  function loginView(note) {
    root.innerHTML = `<div class="pcard tm-login"><b>دخول المشرف</b><p>اكتب الكود اللي أعطاك إياه محمد. يشتغل على أكثر من جهاز.</p>
      <label class="tm-f"><span>الكود</span><input id="sup-code" dir="ltr" autocomplete="one-time-code" placeholder="SUP-XXXXXXXX" maxlength="20"></label>
      <button class="cbtn" id="sup-go" type="button">دخول</button><p class="tm-msg" id="sup-m" role="status"></p></div>`;
    const m = root.querySelector("#sup-m");
    if (note) msg(m, note);
    const go = async () => {
      msg(m, "لحظة…", true);
      const r = await api({ action: "login", code: root.querySelector("#sup-code").value, device_id: device, ua: navigator.userAgent.slice(0, 120) });
      if (r.status !== 200) return msg(m, r.msg || "ما گدرنا ندخل.");
      const { error } = await sb.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
      if (error) return msg(m, "ما گدرنا ندخل. جرّب مرة ثانية.");
      start();
    };
    root.querySelector("#sup-go").onclick = go;
    root.querySelector("#sup-code").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    return root.querySelector("#sup-code");
  }

  async function start() {
    const r = await api({ action: "me" });
    if (r.status !== 200) { await sb.auth.signOut().catch(() => {}); return loginView(r.status === 403 && r.error === "off" ? "هذي الصفحة مو مفعّلة بعد." : ""); }
    me = r;
    const tabs = [["exp", "📚 المحاضرات المتوقعة"], ...(me.can_uploads ? [["up", "📤 ارفع أو بلّغ"]] : []), ...(me.can_codes ? [["codes", "🎓 طلبات الأكواد"]] : []), ["mine", "🧾 طلباتي"]];
    root.innerHTML = `<div class="tm-hello"><span>أهلاً <b>${esc(me.name)}</b> · ${esc(me.title)}</span><button class="cbtn plain" id="sup-out" type="button">خروج</button></div>
      <p class="pvnote">كل شي ترفعه أو تبلّغ عنه يروح لمحمد للمراجعة، وما ينشر إلا بعد موافقته. وكل فعل ينكتب بالسجل.</p>
      <div class="ctabs" role="tablist">${tabs.map(([k, l], i) => `<button class="ctab" role="tab" data-t="${k}" aria-selected="${i === 0}">${l}</button>`).join("")}</div>
      <div id="sup-pane" role="tabpanel"></div>`;
    root.querySelector("#sup-out").onclick = async () => { await sb.auth.signOut().catch(() => {}); loginView(); };
    root.querySelectorAll(".ctab").forEach((b) => b.onclick = () => { root.querySelectorAll(".ctab").forEach((x) => x.setAttribute("aria-selected", x === b)); show(b.dataset.t); });
    show("exp");
  }
  const pane = () => root.querySelector("#sup-pane");

  async function show(t) {
    pane().innerHTML = '<p class="empty">لحظة…</p>';
    if (t === "exp") return expected();
    if (t === "up") return upload();
    if (t === "codes") return codes();
    if (t === "mine") return mine();
  }

  async function expected() {
    const r = await api({ action: "expected" });
    if (r.status !== 200) return (pane().innerHTML = `<p class="empty">${esc(r.msg || "ما گدرنا نجيب القائمة.")}</p>`);
    subjects = [...new Map(r.expected.map((x) => [x.subject, x.subject_ar])).entries()];
    pane().innerHTML = r.expected.map((x) => `<div class="tm-exp"><b>${esc(x.subject_ar)} · ${TYPE[x.ltype]}</b>
      <small>${x.total !== null ? `المتوقع ${x.total} محاضرة` : "العدد الكلي مو محدد بعد"}${x.note ? " · " + esc(x.note) : ""}</small>
      <div class="tm-chips">${x.done.map((d) => `<span class="tm-chip ok" title="${esc(d.title)}">✅ ${d.num}</span>`).join("")}
      ${x.missing.map((n) => `<span class="tm-chip miss">⏳ ${n} ناقصة</span>`).join("")}
      ${x.next ? `<span class="tm-chip next">الجاية: ${x.next}</span>` : ""}
      ${x.pending.map((p) => `<span class="tm-chip pend">${p.kind === "upload" ? "📤" : "🚩"} ${p.num ?? "؟"} · ${esc(ST[p.status] || p.status)}</span>`).join("")}</div></div>`).join("")
      || '<p class="empty">ماكو محاضرات بعد.</p>';
  }

  async function upload() {
    if (!subjects.length) { const r = await api({ action: "expected" }); if (r.status === 200) subjects = [...new Map(r.expected.map((x) => [x.subject, x.subject_ar])).entries()]; }
    pane().innerHTML = `<div class="pcard tm-form">
      <label class="tm-f"><span>المادة</span><select id="u-sub">${subjects.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></label>
      <label class="tm-f"><span>النوع</span><select id="u-type"><option value="theory">نظري</option><option value="practical">عملي</option></select></label>
      <label class="tm-f"><span>رقم المحاضرة</span><input id="u-num" type="number" min="1" max="60" inputmode="numeric"></label>
      <label class="tm-f"><span>العنوان (اختياري)</span><input id="u-title" maxlength="200"></label>
      <label class="tm-f"><span>ملاحظة لمحمد (اختياري)</span><textarea id="u-note" rows="2" maxlength="1000"></textarea></label>
      <label class="tm-f"><span>ملف المحاضرة (PDF، أقل من 30 MB)</span><input id="u-file" type="file" accept="application/pdf,.pdf"></label>
      <div class="tm-row"><button class="cbtn" id="u-send" type="button">📤 ارفع الملف</button><button class="cbtn ghost" id="u-flag" type="button">🚩 بلّغ إنها ناقصة</button></div>
      <p class="tm-msg" id="u-m" role="status"></p></div>`;
    const $ = (s) => pane().querySelector(s), m = $("#u-m");
    const base = () => ({ subject: $("#u-sub").value, type: $("#u-type").value, num: $("#u-num").value ? Number($("#u-num").value) : null, title: $("#u-title").value, note: $("#u-note").value });
    $("#u-flag").onclick = async () => {
      const r = await api({ action: "flag_missing", ...base() });
      msg(m, r.msg || (r.status === 200 ? "وصل." : "ما وصل."), r.status === 200);
    };
    $("#u-send").onclick = async () => {
      const f = $("#u-file").files[0];
      if (!f) return msg(m, "اختار ملف PDF أول.");
      if (f.size > 31457280 || !/\.pdf$/i.test(f.name)) return msg(m, "الملف لازم PDF وأقل من 30 MB.");
      $("#u-send").disabled = true; msg(m, "يرفع…", true);
      try {
        const r = await api({ action: "upload_start", ...base(), size: f.size });
        if (r.status !== 200) return msg(m, r.msg || "ما گدرنا نبدي الرفع.");
        const { error } = await sb.storage.from(r.bucket).uploadToSignedUrl(r.path, r.token, f, { contentType: "application/pdf" });
        if (error) return msg(m, "انقطع الرفع. جرّب مرة ثانية.");
        const d = await api({ action: "upload_done", id: r.id });
        msg(m, d.msg || (d.status === 200 ? "وصل." : "ما وصل."), d.status === 200);
        if (d.status === 200) $("#u-file").value = "";
      } finally { $("#u-send").disabled = false; }
    };
  }

  async function codes() {
    const r = await api({ action: "requests" });
    if (r.status !== 200) return (pane().innerHTML = `<p class="empty">${esc(r.msg || "ما گدرنا نجيب الطلبات.")}</p>`);
    const rows = r.requests;
    pane().innerHTML = `<p class="sub">توافق بس على اللي اسمه يطابق القائمة الرسمية بالضبط (الكود يوصل للطالب بالبوت، وما يطلعلك). المشكوك فيه حوّله لمحمد.</p>` +
      (rows.length ? rows.map((x) => `<div class="tm-req" data-id="${x.id}"><div><b>${esc(x.full_name)}</b><small>${x.tg_username ? "@" + esc(x.tg_username) + " · " : ""}${esc(String(x.at).slice(0, 10))}${x.forwarded ? " · ↪️ تحوّل لمحمد" : ""}</small>
        <span class="tm-chip ${x.match ? "ok" : "miss"}">${x.match ? "✅ يطابق القائمة" : "⚠️ " + esc(x.why || "يحتاج محمد")}</span></div>
        <div class="tm-row">${x.match && !x.forwarded ? '<button class="cbtn" data-a="approve" type="button">✅ وافق</button>' : ""}${x.forwarded ? "" : '<button class="cbtn ghost" data-a="forward" type="button">↪️ حوّل لمحمد</button>'}</div>
        <p class="tm-msg" role="status"></p></div>`).join("") : '<p class="empty">ماكو طلبات منتظرة.</p>');
    pane().onclick = async (ev) => {
      const b = ev.target.closest("button[data-a]"); if (!b) return;
      const box = b.closest(".tm-req"), m = box.querySelector(".tm-msg"), id = Number(box.dataset.id);
      b.disabled = true;
      const note = b.dataset.a === "forward" ? (prompt("ملاحظة لمحمد (اختياري):") || "") : "";
      const res = await api({ action: b.dataset.a === "approve" ? "approve_request" : "forward_request", id, note });
      msg(m, res.msg || (res.status === 200 ? "تم." : "ما صار."), res.status === 200);
      if (res.status === 200) box.querySelectorAll("button").forEach((x) => x.remove()); else b.disabled = false;
    };
  }

  async function mine() {
    const r = await api({ action: "my_queue" });
    if (r.status !== 200) return (pane().innerHTML = '<p class="empty">ما گدرنا نجيبها.</p>');
    pane().innerHTML = r.queue.length ? r.queue.map((q) => `<div class="tm-exp"><b>${q.kind === "upload" ? "📤 ملف" : "🚩 تبليغ"} · ${esc(q.subject)} · ${TYPE[q.ltype]} ${q.num ?? ""}</b>
      <small>${esc(String(q.created_at).slice(0, 10))} · ${esc(ST[q.status] || q.status)}${q.admin_note ? " · محمد: " + esc(q.admin_note) : ""}</small>${q.title ? `<span>${esc(q.title)}</span>` : ""}</div>`).join("")
      : '<p class="empty">ماكو طلبات بعد.</p>';
  }

  // رابط ?k=… ← نعبّي الكود ونشيله من العنوان (ما يبقى بالسجل)
  (async () => {
    const k = new URLSearchParams(location.search).get("k");
    if (k) history.replaceState(null, "", location.pathname + location.hash);
    const { data: { session } } = await sb.auth.getSession();
    if (session && !k) return start();
    const inp = loginView();
    if (k) { inp.value = k; root.querySelector("#sup-go").click(); }
  })();
})();
