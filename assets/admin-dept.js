// 🏛️ رئيس القسم (29/10/2026، الدخول والصلاحيات):
//   AdminDept.mount(pane, sb)  ← تبويب «🏛️ رئيس القسم» بلوحة المالك: المفتاح العام، الحساب (الكود يطلع مرة وحدة)، الإيقاف، الانتهاء، تصفير كلمة السر، السجل.
//   AdminDept.viewer(root, sb) ← اللي يشوفه رئيس القسم نفسه بعد الدخول (كود + كلمة سر): أرقام مجمّعة بس (k ≥ 5)، بلا أسماء ولا أكواد ولا ملاحظات، وما يغيّر شي.
// كل شي يمر بدالة dept-stats (is_admin / جلسة القسم بالسيرفر).
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NAMES = { active_students: "👥 الطلاب الفعّالين (يومي/أسبوعي)", top_lectures: "📚 أكثر المحاضرات مشاهدة لكل مادة",
    hardest: "🧩 أصعب المواضيع + أكثر الأسئلة غلط (مجمّعة)", exam_engagement: "📅 التفاعل وقت الامتحانات", announcement: "📣 إعلان قصير لرئيس القسم" };
  const d10 = (t) => (t ? String(t).slice(0, 10) : "—");
  const copy = async (s, b) => { try { await navigator.clipboard.writeText(s); const o = b.textContent; b.textContent = "✔️"; setTimeout(() => (b.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };

  async function mount(pane, sb) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/dept-stats`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    pane.innerHTML = `<h2>🏛️ رئيس القسم</h2>
      <p id="dp-on"></p>
      <p class="hint">يدخل من الباب المخفي (5 ضغطات على عنوان الموقع) بكوده + كلمة سر مؤقتة تطلعلك هنا مرة وحدة، وأول دخول يجبره يختار كلمة سر جديدة (ويندوز، موبايل، آيباد، أي متصفح). يشوف أرقام مجمّعة بس، وأي رقم أقل من 5 طلاب ما يطلع. ماكو أسماء ولا أكواد ولا ملاحظات، وما يگدر يغيّر أي شي.</p>
      <div id="dp-out" aria-live="polite"></div>
      <details class="tm-new"><summary>➕ حساب ثاني (اختياري)</summary><label class="tm-f"><span>الاسم</span><input id="dp-name" value="" maxlength="120"></label>
      <label class="tm-f"><span>ينتهي (اختياري)</span><input id="dp-exp" type="date"></label>
      <p><button class="btn" id="dp-make">➕ سوّي الحساب</button></p></details>
      <h3>الحسابات</h3><div class="scroll-x" id="dp-list">…</div>
      <h3>الأجزاء اللي تنعرض</h3><div id="dp-secs"></div>
      <h3>سجل الدخول</h3><div class="scroll-x" id="dp-log"></div>`;
    const $ = (s) => pane.querySelector(s);
    let names = {};
    const once = (r, what) => window.StaffOnce ? StaffOnce(r, what || "الحساب جاهز") : `<p class="hint">${esc(r.code)}</p>`;
    const st = (v) => !v.enabled ? (v.has_password ? "⏸️ موقوف" : "💤 مطفي — ينتظر «فعّل حساب الدكتور حيدر»") : v.expires_at && new Date(v.expires_at) <= new Date() ? "⌛ منتهي"
      : v.must_change ? (v.temp_expires_at && new Date(v.temp_expires_at) <= new Date() ? "⌛ المؤقتة انتهت — «إعادة تعيين»" : "⏳ بانتظار أول دخول (كلمة سر مؤقتة)")
      : v.has_password ? "✅ فعّال" : "⏳ ماكو كلمة سر — «إعادة تعيين»";

    async function load() {
      const r = await api({ action: "admin_list" });
      if (r.status !== 200) { $("#dp-list").innerHTML = `<p class="hint">ما گدرت أجيب البيانات (${r.status}).</p>`; return; }
      $("#dp-on").innerHTML = `${r.on ? "✅ حساب رئيس القسم مفعّل" : "⏸️ مطفي — ولا أحد يگدر يدخل (يشتغل لما تگول «فعّل حساب الدكتور حيدر»)"} <button class="btn ghost" id="dp-feat">${r.on ? "⏸️ طفّيه" : "▶️ فعّله"}</button>`;
      $("#dp-feat").onclick = async () => { if (!r.on && !confirm("تفعّل دخول رئيس القسم؟")) return; await api({ action: "admin_feature", on: !r.on }); load(); };
      names = Object.fromEntries(r.viewers.map((v) => [v.id, v.name]));
      $("#dp-list").innerHTML = r.viewers.length ? `<table class="adm"><thead><tr><th>الاسم</th><th>الحالة</th><th>آخر دخول</th><th>ينتهي</th><th>إدارة</th></tr></thead><tbody>` +
        r.viewers.map((v) => `<tr data-id="${esc(v.id)}" data-name="${esc(v.name)}">
          <td><b>${esc(v.name)}</b>${!v.enabled || !r.on ? `<br><button class="btn" data-a="activate" type="button">✅ فعّل الحساب + كلمة سر مؤقتة</button>` : ""}</td><td>${st(v)}</td>
          <td>${d10(v.last_login)}</td><td><input type="date" value="${esc(v.expires_at ? d10(v.expires_at) : "")}" data-a="exp" aria-label="تاريخ الانتهاء"></td>
          <td><button class="ib" data-a="toggle" title="${v.enabled ? "إيقاف" : "تشغيل"}">${v.enabled ? "⏸️" : "▶️"}</button> <button class="ib" data-a="resetpw" title="إعادة تعيين: كلمة سر مؤقتة جديدة" aria-label="إعادة تعيين كلمة السر">🔑</button> <button class="ib" data-a="rotate" title="كود جديد">🔄</button>
          <button class="ib" data-a="log" title="سجل الدخول">🧾</button> <button class="ib" data-a="delete" title="حذف">🗑️</button></td></tr>`).join("") + "</tbody></table>"
        : '<p class="hint">ماكو حسابات بعد.</p>';
      const secs = Object.fromEntries(r.sections.map((s) => [s.key, s]));
      $("#dp-secs").innerHTML = Object.entries(NAMES).map(([k, label]) => `<label class="sw"><input type="checkbox" data-sec="${k}" ${secs[k] && secs[k].on_ ? "checked" : ""}> ${label}</label><br>`).join("") +
        `<textarea id="dp-ann" rows="2" maxlength="280" placeholder="نص الإعلان (280 حرف بالكثير)">${esc(secs.announcement && secs.announcement.value ? secs.announcement.value.text : "")}</textarea>
        <button class="btn ghost" id="dp-ann-save">💾 احفظ الإعلان</button>`;
      log();
    }
    async function log(id) {
      const r = await api({ action: "admin_logins", id });
      $("#dp-log").innerHTML = (r.logins || []).length ? `<table class="adm"><tbody>${r.logins.map((l) => `<tr><td>${esc(names[l.viewer_id] || "")}</td><td>${esc(String(l.at).replace("T", " ").slice(0, 16))}</td><td>${l.ok ? "✅" : "⛔"}</td><td dir="ltr"><small>${esc(l.ua || "")}</small></td></tr>`).join("")}</tbody></table>` : '<p class="hint">ماكو دخول بعد.</p>';
    }

    $("#dp-make").onclick = async () => {
      const r = await api({ action: "admin_create", name: $("#dp-name").value, expires_at: $("#dp-exp").value || null });
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      $("#dp-out").innerHTML = once(r, "انعمل الحساب");
      load();
    };
    pane.addEventListener("change", async (ev) => {
      const sec = ev.target.closest("[data-sec]");
      if (sec) { await api({ action: "admin_sections", sections: { [sec.dataset.sec]: { on: sec.checked } } }); return; }
      if (ev.target.dataset.a === "exp") await api({ action: "admin_expiry", id: ev.target.closest("tr").dataset.id, expires_at: ev.target.value || null });
    });
    pane.addEventListener("click", async (ev) => {
      if (ev.target.id === "dp-ann-save") { await api({ action: "admin_sections", sections: { announcement: { value: { text: $("#dp-ann").value } } } }); ev.target.textContent = "✔️ انحفظ"; return; }
      const cp = ev.target.closest("button[data-cp]"); if (cp) return copy(cp.dataset.cp, cp);
      const b = ev.target.closest("button[data-a]"); if (!b) return;
      const tr = b.closest("tr"), id = tr.dataset.id, name = tr.dataset.name, a = b.dataset.a;
      if (a === "resetpw") { if (!confirm(`إعادة تعيين «${name}»؟ تطلعلك كلمة سر مؤقتة جديدة (72 ساعة) بنفس الكود، والقديمة تبطل، ويطلع من كل أجهزته.`)) return; const rr = await api({ action: "admin_reset_password", id }); if (rr.temp_password) $("#dp-out").innerHTML = once({ ...rr, name }, "كلمة سر مؤقتة جديدة"); else alert(rr.msg || "ما صار."); load(); return; }
      if (a === "activate") { if (!confirm(`تفعّل حساب «${name}»؟ دخول رئيس القسم يشتغل، وتطلعلك كلمة سر مؤقتة (72 ساعة) تدزّها إله بالخاص.`)) return; const rr = await api({ action: "admin_activate", id }); if (rr.temp_password) $("#dp-out").innerHTML = once({ ...rr, name }, "تفعّل الحساب"); else alert(rr.msg || "ما صار."); load(); return; }
      if (a === "log") return log(id);
      let r;
      if (a === "toggle") r = await api({ action: "admin_toggle", id, enabled: b.textContent.includes("▶️") });
      if (a === "rotate") { if (!confirm(`كود جديد لـ «${name}»؟ القديم يبطل، وتطلع كلمة سر مؤقتة جديدة.`)) return; r = await api({ action: "admin_rotate", id }); if (r.code) $("#dp-out").innerHTML = once({ ...r, name }, "كود جديد + كلمة سر مؤقتة"); }
      if (a === "delete") { const t = prompt(`حذف حساب «${name}»؟ اكتب الاسم بالضبط حتى تأكد:`); if (t === null) return; r = await api({ action: "admin_delete", id, confirm: true, confirm_name: t }); }
      if (r && r.status !== 200) alert(r.msg || "صار خطأ");
      load();
    });
    load();
  }
  // 👁️ اللي يشوفه رئيس القسم (قراءة بس)
  async function viewer(root, sb) {
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch(`${C.url}/functions/v1/dept-stats`, { method: "POST",
      headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify({ action: "stats" }) });
    const d = await r.json().catch(() => ({}));
    if (r.status !== 200) {
      await sb.auth.signOut({ scope: "local" }).catch(() => {});
      root.innerHTML = `<p class="hint">${esc(d.msg || "ما گدرنا نفتح اللوحة.")}</p><p><a class="btn" href="./">رجوع لصفحة الدخول</a></p>`; return;
    }
    const n = (x) => (x === null || x === undefined ? '<span title="أقل من 5 — مخفي للخصوصية">—</span>' : esc(x));
    const a = d.active_students, last = (a && a.daily || []).slice(-7);
    const top = d.top_lectures || {}, hard = d.hardest_topics || [], ex = d.exam_engagement;
    root.innerHTML = `<div class="tm-hello"><span>أهلاً <b>${esc(d.viewer)}</b></span><span><button class="btn ghost" type="button" data-as-student>👁️ شوف كطالب</button> <button class="btn ghost" id="dv-out" type="button">خروج</button></span></div>
      <h2>📊 لوحة متابعة القسم</h2><p class="hint">أرقام مجمّعة بلا أسماء. أي مجموعة أقل من ${esc(d.k_min)} طلاب ما تطلع (—). للاطّلاع فقط.</p>
      ${d.announcement ? `<div class="alert"><b>📣</b> ${esc(d.announcement)}</div>` : ""}
      ${a ? `<div class="kpis"><div><b>${n(a.registered)}</b><span>مسجّلون بالكود</span></div><div><b>${n(last.length ? last[last.length - 1].students : null)}</b><span>نشطون آخر يوم</span></div>
        <div><b>${n((a.weekly || []).slice(-1)[0]?.students)}</b><span>نشطون هذا الأسبوع</span></div></div>
        <h3>الطلاب النشطون (آخر 7 أيام)</h3><table class="adm"><tbody>${last.map((x) => `<tr><td>${esc(x.day)}</td><td>${n(x.students)}</td></tr>`).join("") || '<tr><td>ماكو بيانات بعد.</td></tr>'}</tbody></table>` : ""}
      ${d.top_lectures ? `<h3>📚 الأكثر قراءة لكل مادة (30 يوم)</h3>${Object.keys(top).length ? Object.entries(top).map(([sub, l]) => `<p><b>${esc(sub)}</b>: ${l.map((x) => `${esc(x.lecture)} (${n(x.people)})`).join("، ")}</p>`).join("") : '<p class="hint">ماكو بيانات كافية بعد.</p>'}` : ""}
      ${d.hardest_topics ? `<h3>🧩 الموضوعات الأصعب (نسبة الغلط بأول محاولة)</h3><table class="adm"><tbody>${hard.map((x) => `<tr><td>${esc(x.quiz)}</td><td>${Math.round(x.wrong_rate * 100)}%</td></tr>`).join("") || '<tr><td>ماكو بيانات كافية بعد.</td></tr>'}</tbody></table>` : ""}
      ${ex ? `<h3>📅 التفاعل وقت الامتحانات</h3><p class="hint">${(ex.exams || []).length ? (ex.exams || []).map((e) => `${esc(e.subject)} ${esc(e.date)}`).join(" · ") : "ماكو امتحانات هسه."}</p>` : ""}
      ${!a && !d.top_lectures && !d.hardest_topics && !ex ? '<p class="hint">محمد بعده ما فعّل أجزاء اللوحة.</p>' : ""}
      <p class="hint">⚠️ للمراجعة فقط — مو توقّع لأسئلة الامتحان.</p>`;
    root.querySelector("#dv-out").onclick = async () => { await sb.auth.signOut({ scope: "local" }).catch(() => {}); location.reload(); };
  }
  window.AdminDept = { mount, viewer };
})();
