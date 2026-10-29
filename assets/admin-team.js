// 🔑 تبويب «المساعدين» بلوحة الإدارة (29/10/2026؛ الرقم السري 29/10) — حسابات المساعدين (الرقم السري بس، محمد يحدده)، صلاحيات لكل واحد
//   (المحاضرات · الأكواد · الفريق · الإعلانات)، الإيقاف بضغطة، الانتهاء، «🔑 إعادة تعيين الرقم»، «اطلع من كل أجهزته»، الطابور، القائمة الرسمية، والسجل.
// الربط (سطرين بـ admin.js + سطر بـ smart.py): tabs.team = "👥 الفريق" ← AdminTeam.mount(pane, sb). كل شي يمر بدالة supervisor (is_admin بالسيرفر).
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { theory: "نظري", practical: "عملي" };
  const ST = { uploading: "⏳ ما كمل الرفع", new: "🆕 جديد", invalid: "⚠️ مو PDF", accepted: "✅ مقبول", rejected: "✖️ مرفوض", done: "✔️ تم" };
  const ACT = { login: "دخول", view_expected: "شاف المتوقعة", view_requests: "شاف طلبات الأكواد", flag_missing: "🚩 بلّغ عن ناقصة", upload_start: "📤 بدأ رفع",
    upload_done: "📤 رفع ملف", approve_request: "✅ وافق على كود", forward_request: "↪️ حوّل طلب", admin_feature: "🎛️ المفتاح العام", admin_create: "➕ حساب",
    admin_toggle: "⏸️/▶️ الصلاحية", admin_perms: "الصلاحيات", admin_rotate: "🔄 كود جديد", admin_delete: "🗑️ حذف حساب", admin_decide: "قرار بالطابور",
    admin_roster_add: "➕ القائمة الرسمية", admin_roster_remove: "➖ القائمة الرسمية", admin_expected_set: "العدد المتوقع",
    set_password: "🔑 غيّر المؤقتة لكلمة سر خاصة", temp_expired: "⌛ جرّب بمؤقتة منتهية", admin_expiry: "⌛ تاريخ الانتهاء", admin_reset_password: "🔑 إعادة تعيين (مؤقتة جديدة)", admin_set_pin: "🔢 محمد حدد الرقم", admin_signout: "🚪 طلّعه من كل أجهزته", change_pin: "🔢 غيّر رقمه", db_insert: "✏️ أضاف", db_update: "✏️ عدّل" };
  const t16 = (t) => String(t || "").replace("T", " ").slice(0, 16);
  const copy = async (s, b) => { try { await navigator.clipboard.writeText(s); const o = b.textContent; b.textContent = "✔️"; setTimeout(() => (b.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };
  // 🔢 29/10 (الرقم السري): محمد يحدد الرقم من هنا (فريد بين الكل). مشتركة ويّا admin-dept.js (window.StaffPin).
  //   الرقم ما يرجع من السيرفر أبداً؛ الرسالة الجاهزة بلا الرقم (يدزه محمد برسالة ثانية).
  const pinForm = (id, label) => `<form class="tm-pin" data-pin-for="${esc(id)}" novalidate>
      <label class="tm-f"><span>${esc(label || "الرقم السري الجديد (8 أرقام أو أكثر)")}</span><input type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12" data-pin="1"></label>
      <label class="tm-f"><span>أعده مرة ثانية</span><input type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12" data-pin="2"></label>
      <p class="hint">مو تسلسل (12345678) ولا رقم مكرر، ومو رقمك إنت. القديم يبطل وكل أجهزته تطلع.</p>
      <p><button class="btn" type="submit">💾 احفظ الرقم</button> <button class="btn ghost" type="button" data-pin-x>إلغاء</button></p><p class="tm-msg" role="status" aria-live="polite"></p></form>`;
  const digits = (s) => String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
  const pinRead = (f) => { const a = digits(f.querySelector("[data-pin='1']").value), b = digits(f.querySelector("[data-pin='2']").value);
    return a !== b ? { err: "الرقمين مو متطابقين." } : a.length < 8 || a.length > 12 ? { err: "الرقم السري 8–12 رقم." } : { pin: a }; };
  const ready = (name, url) => {
    const nm = String(name || "").split("—")[0].trim();
    const text = `السلام عليكم ${nm}،\nحسابك بموقع دروس تقنيات الأشعة جاهز:\n١) افتح الموقع واضغط على العنوان «دروس تقنيات الأشعة» 5 مرات بسرعة${url ? ` (أو افتح: ${url})` : ""}\n` +
      `٢) اكتب رقمك السري (أدزه إلك برسالة ثانية)\n٣) إذا الجهاز مالتك، أشّر «تذكّر هذا الجهاز 30 يوم».\nتگدر تغيّر رقمك من لوحتك (اختياري). لا تشارك رقمك ويّا أي أحد.`;
    return `<div class="tm-once" role="status"><b>✅ انحفظ الرقم — ${esc(name || "")}</b>
      <p><button class="btn" type="button" data-cp="${esc(text)}">📋 انسخ رسالة جاهزة (بلا الرقم)</button> <button class="btn ghost" type="button" data-once-hide>✕ خلصت</button></p>
      <p class="hint">دز الرقم نفسه برسالة ثانية بالخاص. الرقم ما ينحفظ بأي مكان تگدر تقراه (ولا بالسجل).</p></div>`;
  };
  window.StaffPin = { pinForm, pinRead, ready };
  if (!window.__onceHide) { window.__onceHide = 1; document.addEventListener("click", (ev) => { const b = ev.target.closest && ev.target.closest("[data-once-hide]"); if (b) b.closest(".tm-once").remove(); }); }

  async function mount(pane, sb) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/supervisor`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    const PERM = [["can_lectures", "📚 المحاضرات"], ["can_codes", "🎓 الأكواد"], ["can_team", "👥 الفريق"], ["can_ads", "📣 الإعلانات"]];
    pane.innerHTML = `<h2>🔑 المساعدين والصلاحيات</h2>
      <p class="hint">كل مساعد يدخل من الباب المخفي (5 ضغطات على عنوان الموقع) بـ<b>رقمه السري بس</b> — إنت تحدده هنا، والموقع يعرفه من الرقم. يگدر يغيّره من لوحته (اختياري)، وإذا نساه: «🔑 إعادة تعيين الرقم». كل دخول توصلك عليه رسالة بالبوت. يشوف بس الصلاحيات اللي تأشّرها هنا. <b>ممنوع على كل مساعد:</b> الحذف، الإعدادات، ملاحظات الطلاب، لوحة رئيس القسم، وإضافة مساعدين. كل فعل ينكتب بالسجل تحت.</p>
      <p id="tm-on"></p>
      <div class="tm-new"><h3>➕ مساعد جديد</h3>
        <label class="tm-f"><span>الاسم</span><input id="tm-name" placeholder="مثل: تحسين سليم السعيدي" maxlength="120"></label>
        <label class="tm-f"><span>الصفة</span><input id="tm-title" value="منسّق المحاضرات" maxlength="80"></label>
        <fieldset class="tm-perms"><legend>الصلاحيات</legend>${PERM.map(([k, l]) => `<label class="sw"><input type="checkbox" data-np="${k.slice(4)}" ${k === "can_lectures" ? "checked" : ""}> ${l}</label>`).join("")}</fieldset>
        <label class="tm-f"><span>ينتهي (اختياري)</span><input id="tm-exp-new" type="date"></label>
        <label class="tm-f"><span>الرقم السري (8 أرقام أو أكثر)</span><input id="tm-pin-new" type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12"></label>
        <p><button class="btn" id="tm-make">➕ سوّي الحساب</button></p><div id="tm-out" aria-live="polite"></div></div>
      <h3>المساعدين</h3><div class="scroll-x" id="tm-list">…</div>
      <h3>📥 طابور مراجعة المحاضرات</h3><div class="scroll-x" id="tm-q">…</div>
      <h3>📚 المحاضرات المتوقعة (العدد الكلي لكل مادة)</h3><div class="scroll-x" id="tm-exp">…</div>
      <h3>🎓 القائمة الرسمية للطلاب</h3><p class="hint" id="tm-rn"></p>
      <details><summary>الصق أسماء (كل اسم ثلاثي بسطر)</summary><textarea id="tm-roster" rows="5" placeholder="الاسم الثلاثي"></textarea>
      <button class="btn ghost" id="tm-radd">➕ أضف للقائمة</button> <button class="btn ghost" id="tm-rshow">👁️ اعرض القائمة</button><div id="tm-rlist"></div></details>
      <h3>🧾 سجل أفعال المساعدين</h3><div class="scroll-x" id="tm-log">…</div><button class="btn ghost" id="tm-more" hidden>أقدم…</button>`;
    const $ = (s) => pane.querySelector(s);
    let lastId = null;
    const st = (v) => !v.enabled ? "⏸️ موقوف" : v.expires_at && new Date(v.expires_at) <= new Date() ? "⌛ منتهي"
      : v.pw_set_at && !v.must_change ? "✅ فعّال" : "⏳ ماكو رقم بعد";

    async function status() {
      const r = await api({ action: "admin_status" });
      if (r.status !== 200) { $("#tm-list").innerHTML = `<p class="hint">ما گدرت أجيب البيانات (${r.status}).</p>`; return; }
      $("#tm-on").innerHTML = `${r.on ? "✅ حسابات المساعدين شغّالة" : "⏸️ حسابات المساعدين موقوفة للكل"} <button class="btn ghost" id="tm-feat">${r.on ? "⏸️ أوقف الكل" : "▶️ شغّلها"}</button>
        ${r.forwarded ? ` · ↪️ ${r.forwarded} طلب كود محوّل لك` : ""}`;
      $("#tm-feat").onclick = async () => { await api({ action: "admin_feature", on: !r.on }); status(); log(true); };
      $("#tm-rn").textContent = `بالقائمة: ${r.roster} اسم. المساعد ما يشوفها؛ الدالة تقارن الاسم الموحّد بس.`;
      // بطاقات بدل جدول (تنقرا زين بالموبايل 375px وبالشاشة الكبيرة)
      $("#tm-list").innerHTML = r.supervisors.length ? `<div class="tm-cards">` +
        r.supervisors.map((v) => `<div class="tm-card" data-id="${esc(v.id)}" data-name="${esc(v.name)}">
          <div class="tm-card-h"><span><b>${esc(v.name)}</b> <small>${esc(v.title)}</small></span><span class="tm-st">${st(v)}</span></div>
          <div class="tm-perms">${PERM.map(([k, l]) => `<label class="sw"><input type="checkbox" data-p="${k}" ${v[k] ? "checked" : ""}> ${l}</label>`).join("")}</div>
          <div class="tm-card-r"><label class="tm-f tm-exp-f"><span>ينتهي</span><input type="date" data-a="exp" value="${esc(v.expires_at ? String(v.expires_at).slice(0, 10) : "")}"></label>
            <small>آخر دخول: ${t16(v.last_login) || "—"}</small></div>
          <div class="tm-card-a"><button class="btn ${v.enabled ? "ghost" : ""}" data-a="toggle">${v.enabled ? "⏸️ أوقفه" : "▶️ رجّعه"}</button>
          <button class="btn ${v.pw_set_at && !v.must_change ? "ghost" : ""}" data-a="pin">${v.pw_set_at && !v.must_change ? "🔑 إعادة تعيين الرقم" : "🔢 حدد الرقم"}</button>
          <button class="btn ghost" data-a="signout" title="ينهي كل جلساته ويشيل أجهزته المحفوظة">🚪 اطلع من كل أجهزته</button>
          <button class="ib" data-a="delete" title="حذف الحساب" aria-label="حذف الحساب">🗑️</button></div><div class="tm-pinbox"></div></div>`).join("") + "</div>"
        : '<p class="hint">ماكو مساعد بعد.</p>';
    }
    async function queue() {
      const r = await api({ action: "admin_queue" });
      const q = r.queue || [];
      $("#tm-q").innerHTML = q.length ? `<table class="adm"><thead><tr><th>النوع</th><th>المحاضرة</th><th>التفاصيل</th><th>من</th><th>الحالة</th><th>قرارك</th></tr></thead><tbody>` +
        q.map((x) => `<tr data-q="${x.id}"><td>${x.kind === "upload" ? "📤 ملف" : "🚩 ناقصة"}</td><td>${esc(x.subject)} · ${TYPE[x.ltype]} ${x.num ?? "؟"}</td>
          <td>${esc(x.title || "")}${x.note ? `<br><small>${esc(x.note)}</small>` : ""}${x.file_size ? `<br><small>${(x.file_size / 1048576).toFixed(1)} MB</small>` : ""}</td>
          <td>${esc(x.by_name || "")}<br><small>${t16(x.created_at)}</small></td><td>${ST[x.status] || esc(x.status)}${x.admin_note ? `<br><small>${esc(x.admin_note)}</small>` : ""}</td>
          <td>${x.file_path && x.status !== "uploading" ? '<button class="ib" data-d="file" title="نزّل الملف وراجعه">📥</button> ' : ""}
          <button class="ib" data-d="accepted" title="قبول — قارنه أول بملف الأستاذ الأصلي؛ بعدها حطه بنفسك بـ «قيد العمل» (مصدر: مشرف)">✅</button>
          <button class="ib" data-d="rejected" title="رفض">✖️</button> <button class="ib" data-d="done" title="تمت">✔️</button></td></tr>`).join("") + "</tbody></table>"
        : '<p class="hint">الطابور فارغ.</p>';
    }
    async function expected() {
      const r = await api({ action: "admin_expected_get" });
      $("#tm-exp").innerHTML = (r.expected || []).length ? `<table class="adm"><thead><tr><th>المادة</th><th>النازل</th><th>الناقص</th><th>العدد الكلي</th></tr></thead><tbody>` +
        r.expected.map((x) => `<tr data-s="${esc(x.subject)}" data-t="${x.ltype}"><td>${esc(x.subject_ar)} · ${TYPE[x.ltype]}</td><td>${x.done.map((d) => d.num).join("، ")}</td>
          <td>${x.missing.join("، ") || "—"}</td><td><input type="number" min="0" max="60" value="${x.total ?? ""}" placeholder="مو محدد" style="width:6em" data-e="total"> <button class="ib" data-e="save" title="احفظ">💾</button></td></tr>`).join("") + "</tbody></table>"
        : '<p class="hint">—</p>';
    }
    async function log(reset) {
      if (reset) lastId = null;
      const r = await api({ action: "admin_log", before: lastId ?? undefined });
      const rows = r.log || [];
      const html = rows.map((l) => `<tr><td>${t16(l.at)}</td><td>${esc(l.who)}${l.actor === "admin" ? " <small>(أنت)</small>" : ""}</td><td>${esc(ACT[l.action] || l.action)}</td><td>${esc(l.target || "")}</td><td>${l.ok ? "✅" : "⛔ مرفوض"}</td></tr>`).join("");
      if (reset || !lastId) $("#tm-log").innerHTML = rows.length ? `<table class="adm"><thead><tr><th>الوقت</th><th>منو</th><th>الفعل</th><th>على</th><th></th></tr></thead><tbody>${html}</tbody></table>` : '<p class="hint">ماكو أفعال بعد.</p>';
      else $("#tm-log tbody").insertAdjacentHTML("beforeend", html);
      lastId = rows.length ? rows[rows.length - 1].id : lastId;
      $("#tm-more").hidden = rows.length < 200;
    }

    $("#tm-make").onclick = async () => {
      const perms = {}; pane.querySelectorAll("[data-np]").forEach((c) => (perms[c.dataset.np] = c.checked));
      const pin = digits($("#tm-pin-new").value);
      if (pin && (pin.length < 8 || pin.length > 12)) return alert("الرقم السري 8–12 رقم (أو خلّيه فارغ وحدده بعدين).");
      const r = await api({ action: "admin_create", name: $("#tm-name").value, title: $("#tm-title").value, perms, expires_at: $("#tm-exp-new").value || null, pin: pin || undefined });
      $("#tm-pin-new").value = "";
      if (r.status !== 200) return alert(r.msg || "صار خطأ (الاسم؟)");
      $("#tm-out").innerHTML = r.pin_set ? ready(r.name, r.login_url) : `<p class="tm-once">✅ انعمل الحساب. ${esc(r.msg || "حدد رقمه من بطاقته («🔢 حدد الرقم»).")}</p>`;
      $("#tm-name").value = ""; status(); log(true);
    };
    $("#tm-more").onclick = () => log(false);
    $("#tm-radd").onclick = async () => {
      const r = await api({ action: "admin_roster_add", names: $("#tm-roster").value });
      alert(r.status === 200 ? `انضاف ${r.added} اسم (وانترك ${r.skipped}: مكرر أو مو ثلاثي).` : "صار خطأ");
      if (r.status === 200) { $("#tm-roster").value = ""; status(); }
    };
    $("#tm-rshow").onclick = async () => {
      const r = await api({ action: "admin_roster_get" });
      $("#tm-rlist").innerHTML = (r.roster || []).map((x) => `<div data-k="${esc(x.name_key)}">${esc(x.full_name)} <button class="ib" data-r="rm" title="شيله من القائمة">➖</button></div>`).join("") || '<p class="hint">فارغة.</p>';
    };
    pane.addEventListener("change", async (ev) => {
      const tr = ev.target.closest("[data-id]"); if (!tr) return;
      const p = ev.target.dataset.p;
      if (p) { await api({ action: "admin_perms", id: tr.dataset.id, [p]: ev.target.checked }); log(true); return; }
      if (ev.target.dataset.a === "exp") { await api({ action: "admin_expiry", id: tr.dataset.id, expires_at: ev.target.value || null }); status(); log(true); }
    });
    pane.addEventListener("submit", async (ev) => {
      const f = ev.target.closest("form[data-pin-for]"); if (!f) return;
      ev.preventDefault();
      const m = f.querySelector(".tm-msg"), v = pinRead(f), card = f.closest(".tm-card");
      if (v.err) { m.className = "tm-msg bad"; m.textContent = v.err; return; }
      m.className = "tm-msg"; m.textContent = "لحظة…";
      const r = await api({ action: "admin_set_pin", id: f.dataset.pinFor, pin: v.pin });
      f.querySelectorAll("input").forEach((i) => (i.value = ""));
      if (r.status !== 200) { m.className = "tm-msg bad"; m.textContent = r.msg || "ما صار."; return; }
      $("#tm-out").innerHTML = ready(card ? card.dataset.name : r.name, r.login_url); f.remove(); status(); log(true);
      $("#tm-out").scrollIntoView({ block: "nearest" });
    });
    pane.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-pin-x")) { b.closest("form").remove(); return; }
      if (b.dataset.cp) return copy(b.dataset.cp, b);
      const tr = b.closest("tr") || b.closest(".tm-card");
      if (b.dataset.a && tr && tr.dataset.id) {
        const id = tr.dataset.id, a = b.dataset.a;
        if (a === "toggle") { await api({ action: "admin_toggle", id, enabled: b.textContent.includes("رجّع") }); status(); log(true); return; }
        if (a === "pin") { const bx = tr.querySelector(".tm-pinbox"); bx.innerHTML = bx.innerHTML ? "" : pinForm(id); const f = bx.querySelector("input"); if (f) f.focus(); return; }
        if (a === "signout") { if (!confirm(`تطلّع «${tr.dataset.name}» من كل أجهزته؟ يگدر يدخل مرة ثانية برقمه.`)) return; const r = await api({ action: "admin_signout", id }); alert(r.status === 200 ? "✅ طلع من كل أجهزته." : r.msg || "ما صار."); log(true); return; }
        if (a === "delete") { const n = prompt(`حذف الحساب نهائياً (السجل يبقى). اكتب الاسم بالضبط للتأكيد:\n${tr.dataset.name}`); if (!n) return; const r = await api({ action: "admin_delete", id, confirm: true, confirm_name: n }); if (r.status !== 200) alert("ما انحذف (الاسم ما طابق؟)"); status(); log(true); return; }
      }
      if (b.dataset.d && tr && tr.dataset.q) {
        const id = Number(tr.dataset.q);
        if (b.dataset.d === "file") { const r = await api({ action: "admin_file_url", id }); if (r.url) window.open(r.url, "_blank", "noopener"); return; }
        const note = b.dataset.d === "rejected" ? (prompt("سبب قصير (يشوفه المشرف، اختياري):") || "") : "";
        await api({ action: "admin_decide", id, status: b.dataset.d, note }); queue(); log(true); return;
      }
      if (b.dataset.e === "save" && tr) {
        const v = tr.querySelector("[data-e=total]").value;
        await api({ action: "admin_expected_set", subject: tr.dataset.s, type: tr.dataset.t, total: v === "" ? null : Number(v) }); expected(); log(true); return;
      }
      if (b.dataset.r === "rm") {
        const row = b.closest("[data-k]");
        if (!confirm("أشيل الاسم من القائمة الرسمية؟")) return;
        await api({ action: "admin_roster_remove", name_key: row.dataset.k, confirm: true }); row.remove(); status(); log(true);
      }
    });
    status(); queue(); expected(); log(true);
  }
  window.AdminTeam = { mount };
})();
