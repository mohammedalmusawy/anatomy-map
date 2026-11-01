// 👥 لوحة المساعد (29/10/2026، الدخول والصلاحيات) — window.StaffPanel.mount(root, sb, me)
// المساعد يدخل من /admin/ (🔢 الرقم السري بس، 29/10) ← admin.js يفتح هاللوحة بالتبويبات اللي محمد اختارها بس:
//   📚 المحاضرات (lectures) · 🎓 أكواد الطلاب (codes: يشوف الكود ويدزّه + 🔄 كود جديد).
// 🔒 70 (مسودة): المساعد = رفع المحاضرات + توزيع الأكواد + كود جديد بس. «الفريق» و«الإعلانات» و«طلبات الأكواد» انشالن،
//   والسيرفر يفرضها بقائمة بيضاء (supervisor + staff_can بهجرة 070). هذا الملف واجهة بس. ماكو حذف ولا إعدادات ولا إحصائيات ولا «صوتك يوصل».
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { theory: "نظري", practical: "عملي" };
  const ST = { uploading: "⏳ ما كمل الرفع", new: "🕓 بانتظار محمد", invalid: "⚠️ الملف مو PDF", accepted: "✅ قبلها محمد", rejected: "✖️ ما انقبلت", done: "✔️ تمت" };
  const msg = (el, t, ok) => { el.textContent = t || ""; el.className = "tm-msg" + (ok ? " ok" : t ? " bad" : ""); };

  // الصفحة القديمة /preview/supervisor/ ← ماكو رابط للإدارة بعد (29/10: الدخول من الباب المخفي بس)
  const old = document.getElementById("sup");
  if (old) { old.innerHTML = '<p class="empty">هذي الصفحة انتقلت.</p>'; return; }

  function mount(root, sb, me) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/supervisor`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : C.anon), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    const P = me.perms || {};
    const tabs = [...(P.lectures ? [["exp", "📚 المحاضرات"], ["up", "📤 ارفع أو بلّغ"], ["mine", "🧾 طلباتي"]] : []),
      ...(P.codes ? [["codes", "🎓 أكواد الطلاب"]] : [])];
    let subjects = [];
    root.innerHTML = `<div class="tm-hello"><span>أهلاً <b>${esc(me.name)}</b> · ${esc(me.title)}</span><span><span class="sd-asw">👁️ شوف الموقع كـ: <button class="btn ghost" type="button" data-as="student">طالب</button> <button class="btn ghost" type="button" data-as="visitor">زائر</button></span> <button class="btn ghost" id="sup-out" type="button">خروج</button></span></div>
      <p class="hint">كل شي ترفعه أو تبلّغ عنه يروح لمحمد للمراجعة، وما ينشر إلا بعد موافقته. وكل فعل ينكتب بالسجل.</p>
      ${tabs.length ? `<nav class="dtabs" role="tablist">${tabs.map(([k, l], i) => `<a href="#${k}" role="tab" data-t="${k}" class="${i === 0 ? "on" : ""}">${l}</a>`).join("")}</nav>` : '<p class="hint">ماكو صلاحيات مفعّلة لحسابك هسه. راسل محمد.</p>'}
      <div id="sup-pane" role="tabpanel"></div><div id="sup-self"></div>`;
    if (window.AdminSelf) AdminSelf.tools(root.querySelector("#sup-self"));   // 🔢 29/10: غيّر رقمي (اختياري) + اطلع من كل الأجهزة
    root.querySelector("#sup-out").onclick = async () => { await sb.auth.signOut({ scope: "local" }).catch(() => {}); location.reload(); };
    const pane = () => root.querySelector("#sup-pane");
    const show = (t) => {
      root.querySelectorAll(".dtabs a").forEach((x) => x.classList.toggle("on", x.dataset.t === t));
      pane().innerHTML = '<p class="hint">لحظة…</p>';
      ({ exp: expected, up: upload, codes, mine })[t]?.();
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

    // 🎓 70: أكواد الطلاب — يشوف الكود ويدزّه (نسخ، رابط دخول، واتساب) + 🔄 كود جديد. ولا حذف ولا إيقاف ولا إنشاء.
    const ROOT = (window.StaffDoor && window.StaffDoor.ROOT) || new URL("../", location.href).href;
    const link = (code) => `${ROOT}?code=${encodeURIComponent(code)}`;
    const waText = (name, code) => `أهلاً ${String(name).split(" ")[0]}، هذا كودك لموقع دروس تقنيات الأشعة: ${code} — أو افتح الرابط مباشرة: ${link(code)} (يشتغل على 3 أجهزة بالكثير، لا تشاركه)`;
    const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); const o = b.textContent; b.textContent = "✔️"; setTimeout(() => (b.textContent = o), 1200); } catch (e) { prompt("انسخ:", t); } };
    async function codes() {
      const r = await api({ action: "codes" });
      if (r.status !== 200) return (pane().innerHTML = `<p class="hint">${esc(r.msg || "ما گدرنا نجيب الأكواد.")}</p>`);
      const rows = r.students || [];
      pane().innerHTML = `<p class="hint">دزّ لكل طالب كوده بس. «🔄 كود جديد» يبطل القديم ويطلّعه من كل أجهزته. كل فعل ينكتب بالسجل.</p>
        <label class="tm-f"><span>دوّر على اسم</span><input id="c-q" type="search" autocomplete="off"></label>` +
        (rows.length ? `<div id="c-list">${rows.map((x) => `<div class="tm-req" data-id="${esc(x.id)}" data-name="${esc(x.full_name)}" data-code="${esc(x.code || "")}">
          <div><b>${esc(x.full_name)}</b> <span class="code" dir="ltr">${esc(x.code || "؟")}</span>${x.status === "paused" ? " <small>⏸️ موقوف</small>" : ""} <small>📱 ${x.devices}/${r.max_devices}</small></div>
          <p><button class="btn ghost" data-a="copy" type="button">📋 نسخ</button> <button class="btn ghost" data-a="link" type="button">🔗 الرابط</button>
          <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText(x.full_name, x.code || ""))}">💬 واتساب</a>
          <button class="btn ghost" data-a="rotate" type="button">🔄 كود جديد</button></p><p class="tm-msg" role="status"></p></div>`).join("")}</div>`
          : '<p class="hint">ماكو طلاب بعد.</p>');
      const q = pane().querySelector("#c-q");
      if (q) q.oninput = () => { const v = q.value.trim(); pane().querySelectorAll("#c-list .tm-req").forEach((d) => { d.style.display = v && !d.dataset.name.includes(v) ? "none" : ""; }); };
      pane().onclick = async (ev) => {
        const b = ev.target.closest("button[data-a]"); if (!b) return;
        const box = b.closest(".tm-req"), m = box.querySelector(".tm-msg"), a = b.dataset.a;
        if (a === "copy") return copy(box.dataset.code, b);
        if (a === "link") return copy(link(box.dataset.code), b);
        if (a !== "rotate" || !confirm(`كود جديد لـ «${box.dataset.name}»؟ القديم يبطل ويطلع من كل أجهزته.`)) return;
        b.disabled = true;
        const res = await api({ action: "code_rotate", id: box.dataset.id });
        b.disabled = false;
        if (res.status !== 200) return msg(m, res.msg || "ما صار.");
        box.dataset.code = res.code; box.querySelector(".code").textContent = res.code;
        const wa = box.querySelector('a[href^="https://wa.me/"]'); if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(waText(box.dataset.name, res.code));
        msg(m, "✅ الكود الجديد جاهز. دزّه للطالب.", true);
      };
    }

    async function mine() {
      const r = await api({ action: "my_queue" });
      if (r.status !== 200) return (pane().innerHTML = '<p class="hint">ما گدرنا نجيبها.</p>');
      pane().innerHTML = r.queue.length ? r.queue.map((q) => `<div class="tm-exp"><b>${q.kind === "upload" ? "📤 ملف" : "🚩 تبليغ"} · ${esc(q.subject)} · ${TYPE[q.ltype]} ${q.num ?? ""}</b>
        <small>${esc(String(q.created_at).slice(0, 10))} · ${esc(ST[q.status] || q.status)}${q.admin_note ? " · محمد: " + esc(q.admin_note) : ""}</small>${q.title ? `<span>${esc(q.title)}</span>` : ""}</div>`).join("")
        : '<p class="hint">ماكو طلبات بعد.</p>';
    }

  }
  window.StaffPanel = { mount };
})();
