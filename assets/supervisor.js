// 👥 لوحة المساعد (29/10/2026، الدخول والصلاحيات) — window.StaffPanel.mount(root, sb, me)
// المساعد يدخل من /admin/ (كود SUP-… + كلمة سر) ← admin.js يفتح هاللوحة بالتبويبات اللي محمد اختارها بس:
//   📚 المحاضرات (lectures) · 🎓 الأكواد (codes) · 👥 الفريق (team ← AdminPeople) · 📣 الإعلانات (ads ← شريط الإعلان).
// كل صلاحية تنفحص بالسيرفر (دالة supervisor + RLS staff_can)؛ هذا الملف واجهة بس. ماكو حذف ولا إعدادات ولا نشر من هنا.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { theory: "نظري", practical: "عملي" };
  const ST = { uploading: "⏳ ما كمل الرفع", new: "🕓 بانتظار محمد", invalid: "⚠️ الملف مو PDF", accepted: "✅ قبلها محمد", rejected: "✖️ ما انقبلت", done: "✔️ تمت" };
  const msg = (el, t, ok) => { el.textContent = t || ""; el.className = "tm-msg" + (ok ? " ok" : t ? " bad" : ""); };

  // الصفحة القديمة /preview/supervisor/ ← تحوّل لصفحة الدخول الموحّدة (وتحافظ على ?k=)
  const old = document.getElementById("sup");
  if (old) { old.innerHTML = '<p class="empty">صفحة المساعد انتقلت ← <a href="../../admin/' + esc(location.search) + '">صفحة الدخول</a></p>'; return; }

  function mount(root, sb, me) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/supervisor`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : C.anon), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    const P = me.perms || {};
    const tabs = [...(P.lectures ? [["exp", "📚 المحاضرات"], ["up", "📤 ارفع أو بلّغ"], ["mine", "🧾 طلباتي"]] : []),
      ...(P.codes ? [["codes", "🎓 طلبات الأكواد"]] : []), ...(P.team && window.AdminPeople ? [["team", "👥 الفريق"]] : []),
      ...(P.ads ? [["ads", "📣 الإعلانات"]] : [])];
    let subjects = [];
    root.innerHTML = `<div class="tm-hello"><span>أهلاً <b>${esc(me.name)}</b> · ${esc(me.title)}</span><button class="btn ghost" id="sup-out" type="button">خروج</button></div>
      <p class="hint">كل شي ترفعه أو تبلّغ عنه يروح لمحمد للمراجعة، وما ينشر إلا بعد موافقته. وكل فعل ينكتب بالسجل.</p>
      ${tabs.length ? `<nav class="dtabs" role="tablist">${tabs.map(([k, l], i) => `<a href="#${k}" role="tab" data-t="${k}" class="${i === 0 ? "on" : ""}">${l}</a>`).join("")}</nav>` : '<p class="hint">ماكو صلاحيات مفعّلة لحسابك هسه. راسل محمد.</p>'}
      <div id="sup-pane" role="tabpanel"></div>`;
    root.querySelector("#sup-out").onclick = async () => { await sb.auth.signOut({ scope: "local" }).catch(() => {}); location.reload(); };
    const pane = () => root.querySelector("#sup-pane");
    const show = (t) => {
      root.querySelectorAll(".dtabs a").forEach((x) => x.classList.toggle("on", x.dataset.t === t));
      pane().innerHTML = '<p class="hint">لحظة…</p>';
      ({ exp: expected, up: upload, codes, mine, team: () => window.AdminPeople.mount(pane(), sb), ads })[t]?.();
    };
    root.querySelectorAll(".dtabs a").forEach((a) => a.onclick = (e) => { e.preventDefault(); show(a.dataset.t); });
    if (tabs.length) show(tabs.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0][0]);

    async function expected() {
      const r = await api({ action: "expected" });
      if (r.status !== 200) return (pane().innerHTML = `<p class="hint">${esc(r.msg || "ما گدرنا نجيب القائمة.")}</p>`);
      subjects = [...new Map(r.expected.map((x) => [x.subject, x.subject_ar])).entries()];
      pane().innerHTML = r.expected.map((x) => `<div class="tm-exp"><b>${esc(x.subject_ar)} · ${TYPE[x.ltype]}</b>
        <small>${x.total !== null ? `المتوقع ${x.total} محاضرة` : "العدد الكلي مو محدد بعد"}${x.note ? " · " + esc(x.note) : ""}</small>
        <div class="tm-chips">${x.done.map((d) => `<span class="tm-chip ok" title="${esc(d.title)}">✅ ${d.num}</span>`).join("")}
        ${x.missing.map((n) => `<span class="tm-chip miss">⏳ ${n} ناقصة</span>`).join("")}
        ${x.next ? `<span class="tm-chip next">الجاية: ${x.next}</span>` : ""}
        ${x.pending.map((p) => `<span class="tm-chip pend">${p.kind === "upload" ? "📤" : "🚩"} ${p.num ?? "؟"} · ${esc(ST[p.status] || p.status)}</span>`).join("")}</div></div>`).join("")
        || '<p class="hint">ماكو محاضرات بعد.</p>';
    }

    async function upload() {
      if (!subjects.length) { const r = await api({ action: "expected" }); if (r.status === 200) subjects = [...new Map(r.expected.map((x) => [x.subject, x.subject_ar])).entries()]; }
      pane().innerHTML = `<div class="tm-form">
        <label class="tm-f"><span>المادة</span><select id="u-sub">${subjects.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></label>
        <label class="tm-f"><span>النوع</span><select id="u-type"><option value="theory">نظري</option><option value="practical">عملي</option></select></label>
        <label class="tm-f"><span>رقم المحاضرة</span><input id="u-num" type="number" min="1" max="60" inputmode="numeric"></label>
        <label class="tm-f"><span>العنوان (اختياري)</span><input id="u-title" maxlength="200"></label>
        <label class="tm-f"><span>ملاحظة لمحمد (اختياري)</span><textarea id="u-note" rows="2" maxlength="1000"></textarea></label>
        <label class="tm-f"><span>ملف المحاضرة (PDF، أقل من 30 MB)</span><input id="u-file" type="file" accept="application/pdf,.pdf"></label>
        <p><button class="btn" id="u-send" type="button">📤 ارفع الملف</button> <button class="btn ghost" id="u-flag" type="button">🚩 بلّغ إنها ناقصة</button></p>
        <p class="tm-msg" id="u-m" role="status"></p></div>`;
      const $ = (s) => pane().querySelector(s), m = $("#u-m");
      const base = () => ({ subject: $("#u-sub").value, type: $("#u-type").value, num: $("#u-num").value ? Number($("#u-num").value) : null, title: $("#u-title").value, note: $("#u-note").value });
      $("#u-flag").onclick = async () => { const r = await api({ action: "flag_missing", ...base() }); msg(m, r.msg || (r.status === 200 ? "وصل." : "ما وصل."), r.status === 200); };
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
      if (r.status !== 200) return (pane().innerHTML = `<p class="hint">${esc(r.msg || "ما گدرنا نجيب الطلبات.")}</p>`);
      const rows = r.requests;
      pane().innerHTML = `<p class="hint">توافق بس على اللي اسمه يطابق القائمة الرسمية بالضبط (الكود يوصل للطالب بالبوت، وما يطلعلك). المشكوك فيه حوّله لمحمد.</p>` +
        (rows.length ? rows.map((x) => `<div class="tm-req" data-id="${x.id}"><div><b>${esc(x.full_name)}</b> <small>${x.tg_username ? "@" + esc(x.tg_username) + " · " : ""}${esc(String(x.at).slice(0, 10))}${x.forwarded ? " · ↪️ تحوّل لمحمد" : ""}</small>
          <span class="tm-chip ${x.match ? "ok" : "miss"}">${x.match ? "✅ يطابق القائمة" : "⚠️ " + esc(x.why || "يحتاج محمد")}</span></div>
          <p>${x.match && !x.forwarded ? '<button class="btn" data-a="approve" type="button">✅ وافق</button> ' : ""}${x.forwarded ? "" : '<button class="btn ghost" data-a="forward" type="button">↪️ حوّل لمحمد</button>'}</p>
          <p class="tm-msg" role="status"></p></div>`).join("") : '<p class="hint">ماكو طلبات منتظرة.</p>');
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
      if (r.status !== 200) return (pane().innerHTML = '<p class="hint">ما گدرنا نجيبها.</p>');
      pane().innerHTML = r.queue.length ? r.queue.map((q) => `<div class="tm-exp"><b>${q.kind === "upload" ? "📤 ملف" : "🚩 تبليغ"} · ${esc(q.subject)} · ${TYPE[q.ltype]} ${q.num ?? ""}</b>
        <small>${esc(String(q.created_at).slice(0, 10))} · ${esc(ST[q.status] || q.status)}${q.admin_note ? " · محمد: " + esc(q.admin_note) : ""}</small>${q.title ? `<span>${esc(q.title)}</span>` : ""}</div>`).join("")
        : '<p class="hint">ماكو طلبات بعد.</p>';
    }

    // 📣 شريط الإعلان (RLS: staff_can('ads') + المفتاح announcement بس + الشكل {text, on}؛ كل حفظ ينكتب بالسجل)
    async function ads() {
      const { data } = await sb.from("settings").select("value").eq("key", "announcement").maybeSingle();
      const v = (data && data.value) || {};
      pane().innerHTML = `<h3>📣 شريط الإعلان</h3><p class="hint">يطلع بأعلى الموقع لكل الطلاب. 300 حرف بالكثير.</p>
        <textarea id="ad-t" rows="3" maxlength="300">${esc(v.text || "")}</textarea>
        <label><input type="checkbox" id="ad-on" ${v.on ? "checked" : ""}> ظاهر للطلاب</label>
        <p><button class="btn" id="ad-s" type="button">حفظ</button></p><p class="tm-msg" id="ad-m" role="status"></p>`;
      pane().querySelector("#ad-s").onclick = async () => {
        const { error } = await sb.from("settings").upsert({ key: "announcement", value: { text: pane().querySelector("#ad-t").value.slice(0, 300), on: pane().querySelector("#ad-on").checked } });
        msg(pane().querySelector("#ad-m"), error ? "ما انحفظ (الصلاحية؟)" : "انحفظ ✔️", !error);
      };
    }
  }
  window.StaffPanel = { mount };
})();
