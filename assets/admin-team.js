// 👥 تبويب «الفريق» بلوحة الإدارة (29/10/2026) — المشرف (منسّق المحاضرات): الحساب، الإيقاف بضغطة، طابور المراجعة، القائمة الرسمية، والسجل.
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
    admin_roster_add: "➕ القائمة الرسمية", admin_roster_remove: "➖ القائمة الرسمية", admin_expected_set: "العدد المتوقع" };
  const t16 = (t) => String(t || "").replace("T", " ").slice(0, 16);
  const copy = async (s, b) => { try { await navigator.clipboard.writeText(s); const o = b.textContent; b.textContent = "✔️"; setTimeout(() => (b.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };

  async function mount(pane, sb) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/supervisor`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    pane.innerHTML = `<h2>👥 الفريق — المشرف</h2>
      <p class="hint">المشرف يرفع ملفات أو يبلّغ عن محاضرات ناقصة (تجيك هنا للمراجعة، ماكو نشر مباشر)، ويوافق بس على طلبات الأكواد اللي تطابق القائمة الرسمية، والباقي يتحوّل لك. ما يگدر يحذف ولا يغيّر إعدادات ولا يشوف ملاحظات الطلاب أو لوحة القسم.</p>
      <p id="tm-on"></p>
      <h3>الحساب</h3><div class="scroll-x" id="tm-list">…</div>
      <p><input id="tm-name" placeholder="الاسم (مثل: تحسين سليم السعيدي)"> <input id="tm-title" placeholder="الصفة" value="منسّق المحاضرات">
      <button class="btn" id="tm-make">➕ سوّي حساب مشرف</button></p><div id="tm-out"></div>
      <h3>📥 طابور المراجعة</h3><div class="scroll-x" id="tm-q">…</div>
      <h3>📚 المحاضرات المتوقعة (العدد الكلي لكل مادة)</h3><div class="scroll-x" id="tm-exp">…</div>
      <h3>🎓 القائمة الرسمية للطلاب</h3><p class="hint" id="tm-rn"></p>
      <details><summary>الصق أسماء (كل اسم ثلاثي بسطر)</summary><textarea id="tm-roster" rows="5" placeholder="الاسم الثلاثي"></textarea>
      <button class="btn ghost" id="tm-radd">➕ أضف للقائمة</button> <button class="btn ghost" id="tm-rshow">👁️ اعرض القائمة</button><div id="tm-rlist"></div></details>
      <h3>🧾 سجل أفعال المشرف</h3><div class="scroll-x" id="tm-log">…</div><button class="btn ghost" id="tm-more" hidden>أقدم…</button>`;
    const $ = (s) => pane.querySelector(s);
    let lastId = null;

    async function status() {
      const r = await api({ action: "admin_status" });
      if (r.status !== 200) { $("#tm-list").innerHTML = `<p class="hint">ما گدرت أجيب البيانات (${r.status}).</p>`; return; }
      $("#tm-on").innerHTML = `${r.on ? "✅ دور المشرف مفعّل" : "⏸️ دور المشرف مطفي (يشتغل لما تگول «فعّل تحسين»)"} <button class="btn ghost" id="tm-feat">${r.on ? "⏸️ طفّيه للكل" : "▶️ فعّله"}</button>
        ${r.forwarded ? ` · ↪️ ${r.forwarded} طلب كود محوّل لك (تبويب الطلاب)` : ""}`;
      $("#tm-feat").onclick = async () => { await api({ action: "admin_feature", on: !r.on }); status(); log(true); };
      $("#tm-rn").textContent = `بالقائمة: ${r.roster} اسم. المشرف ما يشوفها؛ الدالة تقارن الاسم الموحّد بس.`;
      $("#tm-list").innerHTML = r.supervisors.length ? `<table class="adm"><thead><tr><th>الاسم</th><th>الكود</th><th>دزّه</th><th>آخر دخول</th><th>الصلاحيات</th><th>إدارة</th></tr></thead><tbody>` +
        r.supervisors.map((v) => `<tr data-id="${esc(v.id)}" data-code="${esc(v.code || "")}" data-link="${esc(v.link || "")}" data-name="${esc(v.name)}">
          <td><b>${esc(v.name)}</b><br><small>${esc(v.title)}</small></td><td><span class="code" dir="ltr">${esc(v.code || "؟")}</span></td>
          <td><button class="ib" data-a="copy" title="نسخ الكود">📋</button> <button class="ib" data-a="link" title="رابط دخول">🔗</button></td>
          <td>${t16(v.last_login) || "—"}</td>
          <td><label class="sw"><input type="checkbox" data-p="can_uploads" ${v.can_uploads ? "checked" : ""}> 📤 رفع وتبليغ</label><br><label class="sw"><input type="checkbox" data-p="can_codes" ${v.can_codes ? "checked" : ""}> 🎓 الأكواد</label></td>
          <td><button class="btn ${v.enabled ? "ghost" : ""}" data-a="toggle">${v.enabled ? "⏸️ أوقف صلاحيته" : "▶️ رجّع صلاحيته"}</button>
          <button class="ib" data-a="rotate" title="كود جديد">🔄</button> <button class="ib" data-a="delete" title="حذف الحساب">🗑️</button></td></tr>`).join("") + "</tbody></table>"
        : '<p class="hint">ماكو حساب مشرف بعد.</p>';
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
      const r = await api({ action: "admin_create", name: $("#tm-name").value, title: $("#tm-title").value });
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      $("#tm-out").innerHTML = `<p>✅ ${esc(r.name)}: <span class="code" dir="ltr">${esc(r.code)}</span> — <span dir="ltr">${esc(r.link)}</span></p>`;
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
      const p = ev.target.dataset.p; if (!p) return;
      const id = ev.target.closest("tr").dataset.id;
      await api({ action: "admin_perms", id, [p]: ev.target.checked }); log(true);
    });
    pane.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      const tr = b.closest("tr");
      if (b.dataset.a && tr && tr.dataset.id) {
        const id = tr.dataset.id, a = b.dataset.a;
        if (a === "copy") return copy(tr.dataset.code, b);
        if (a === "link") return copy(tr.dataset.link, b);
        if (a === "toggle") { await api({ action: "admin_toggle", id, enabled: b.textContent.includes("رجّع") }); status(); log(true); return; }
        if (a === "rotate") { if (!confirm("كود جديد؟ القديم يبطل وتطلع كل أجهزته.")) return; const r = await api({ action: "admin_rotate", id }); if (r.code) $("#tm-out").innerHTML = `<p>🔄 <span class="code" dir="ltr">${esc(r.code)}</span></p>`; status(); log(true); return; }
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
