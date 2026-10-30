// 🏛️ رئيس القسم (29/10/2026، الدخول والصلاحيات):
//   AdminDept.mount(pane, sb)  ← تبويب «🏛️ رئيس القسم» بلوحة المالك: المفتاح العام، الحساب، الإيقاف، الانتهاء، «🔑 إعادة تعيين الرقم»، «اطلع من كل أجهزته»، السجل.
//   AdminDept.viewer(root, sb) ← اللي يشوفه رئيس القسم نفسه بعد الدخول (🔢 الرقم السري بس): أرقام مجمّعة بس (k ≥ 5)، بلا أسماء ولا أكواد ولا ملاحظات، وما يغيّر شي.
// كل شي يمر بدالة dept-stats (is_admin / جلسة القسم بالسيرفر).
// 🏛️ 53 (مسودة 30/10، «المنصب مو الشخص»): بطاقة «رئيس القسم الحالي» (الاسم، المنصب، صورة دائرية، جملة الترحيب، الكلمة + مفتاح الظهور لمحمد بس)
//   · «🔄 تغيير رئيس القسم» (يقفل القديم بلا حذف + حساب جديد برقم مؤقت 72 ساعة) · «رؤساء القسم السابقين» (🔓 أعد فتح · 🙏 أضف للشكر)
//   · حساب رئيس القسم ما ينحذف أبداً: 🗑️ صار 🔒 قفل · لوحة الرئيس الجديدة (viewer): 4–6 أزرار كبار · AdminDept.choosePin: «اختر رقمك» بأول دخول.
//   الأفعال الجديدة (admin_head_* · admin_change_head · admin_reopen_head · admin_thank_former · admin_lock · head_*) مسودة بالسيرفر
//   (supabase/drafts/53-head/) — ما انرفعت. لحد ما تنرفع: البطاقات تگول «تحتاج تحديث السيرفر» وما تكسر شي.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NAMES = { active_students: "👥 الطلاب الفعّالين (يومي/أسبوعي)", top_lectures: "📚 أكثر المحاضرات مشاهدة لكل مادة",
    hardest: "🧩 أصعب المواضيع + أكثر الأسئلة غلط (مجمّعة)", exam_engagement: "📅 التفاعل وقت الامتحانات" };   // 🏛️ 53: صندوق إعلان المالك انشال (الإعلان صار من لوحة الرئيس)
  const d10 = (t) => (t ? String(t).slice(0, 10) : "—");
  const copy = async (s, b) => { try { await navigator.clipboard.writeText(s); const o = b.textContent; b.textContent = "✔️"; setTimeout(() => (b.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };

  let mountAC = null;   // 🔁 59: فتح التبويب مرة ثانية ← المستمعين القدام ينشالون (ما يتكررون)
  async function mount(pane, sb) {
    if (mountAC) mountAC.abort();
    mountAC = new AbortController();
    const on = { signal: window.AdminTab ? AdminTab.own(mountAC) : mountAC.signal };
    const ask = (el, t, o) => window.AdminAsk(el, t, o);   // ✋ 59: تأكيد داخل الصفحة (admin.js)
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/dept-stats`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    pane.innerHTML = `<h2>🏛️ رئيس القسم</h2>
      <div id="hd-admin"></div>
      <details class="hd-details" id="hd-legacy"><summary>المزيد — الحسابات والأرقام والسجل</summary>
      <p id="dp-on"></p>
      <p class="hint">يدخل من الباب المخفي (5 ضغطات على عنوان الموقع) برقمه السري بس — إنت تحدده، وهو يگدر يغيّره. يشوف أرقام مجمّعة بس، وأي رقم أقل من 5 طلاب ما يطلع. ماكو أسماء ولا أكواد ولا ملاحظات.</p>
      <div id="dp-out" aria-live="polite"></div>
      <details class="tm-new"><summary>➕ حساب ثاني (اختياري)</summary><label class="tm-f"><span>الاسم</span><input id="dp-name" value="" maxlength="120"></label>
      <label class="tm-f"><span>ينتهي (اختياري)</span><input id="dp-exp" type="date"></label>
      <label class="tm-f"><span>الرقم السري (8 أرقام أو أكثر)</span><input id="dp-pin" type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12"></label>
      <p><button class="btn ghost" id="dp-make">➕ سوّي الحساب</button></p></details>
      <h3>الحسابات</h3><div class="scroll-x" id="dp-list">…</div>
      <h3>الأجزاء اللي تنعرض بلوحته</h3><div id="dp-secs"></div>
      <h3>سجل الدخول</h3><div class="scroll-x" id="dp-log"></div></details>`;
    const $ = (s) => pane.querySelector(s);
    headAdmin(pane.querySelector("#hd-admin"), api);   // 🏛️ 53
    let names = {};
    const SP = window.StaffPin;
    const st = (v) => !v.enabled ? (v.has_password ? "⏸️ موقوف" : "💤 مطفي — ينتظر تفعيلك") : v.expires_at && new Date(v.expires_at) <= new Date() ? "⌛ منتهي"
      : v.has_password && !v.must_change ? "✅ فعّال" : "⏳ ماكو رقم بعد";

    async function load() {
      const r = await api({ action: "admin_list" });
      if (on.signal.aborted) return;   // 🔁 59: التبويب انسد قبل ما يوصل الرد
      if (r.status !== 200) { $("#dp-list").innerHTML = `<p class="hint">ما گدرت أجيب البيانات (${r.status}).</p>`; return; }
      $("#dp-on").innerHTML = `${r.on ? "✅ حساب رئيس القسم مفعّل" : "⏸️ دخول رئيس القسم مطفي — ولا أحد يگدر يدخل لحد ما تفعّله"} <button class="btn ghost" id="dp-feat">${r.on ? "⏸️ طفّيه" : "▶️ فعّله"}</button>`;
      $("#dp-feat").onclick = async () => {
        if (!r.on && !confirm("تفعّل دخول رئيس القسم؟")) return;
        // ✋ 59: «⏸️ طفّيه» ← تأكيد أول
        if (r.on && !(await ask($("#dp-on"), "تطفّي دخول رئيس القسم للكل؟ يطلع من كل أجهزته وما يگدر يدخل لحد ما تفعّله.", { danger: true, yes: "نعم، طفّيه" }))) return;
        await api({ action: "admin_feature", on: !r.on }); load();
      };
      names = Object.fromEntries(r.viewers.map((v) => [v.id, v.name]));
      $("#dp-list").innerHTML = r.viewers.length ? `<table class="adm"><thead><tr><th>الاسم</th><th>الحالة</th><th>آخر دخول</th><th>ينتهي</th><th>إدارة</th></tr></thead><tbody>` +
        r.viewers.map((v) => `<tr data-id="${esc(v.id)}" data-name="${esc(v.name)}">
          <td><b>${esc(v.name)}</b>${!v.enabled || !r.on ? `<br><button class="btn ghost" data-a="activate" type="button">✅ فعّل الحساب + حدد رقمه</button>` : ""}<div class="tm-pinbox"></div></td><td>${st(v)}</td>
          <td>${d10(v.last_login)}</td><td><input type="date" value="${esc(v.expires_at ? d10(v.expires_at) : "")}" data-a="exp" aria-label="تاريخ الانتهاء"></td>
          <td><button class="ib" data-a="toggle" title="${v.enabled ? "إيقاف" : "تشغيل"}">${v.enabled ? "⏸️" : "▶️"}</button> <button class="ib" data-a="resetpw" title="🔑 إعادة تعيين الرقم" aria-label="إعادة تعيين الرقم">🔑</button> <button class="ib" data-a="signout" title="اطلع من كل أجهزته" aria-label="اطلع من كل أجهزته">🚪</button>
          <button class="ib" data-a="log" title="سجل الدخول">🧾</button> <button class="ib" data-a="lock" title="🔒 قفل (بلا حذف)" aria-label="قفل الحساب">🔒</button></td></tr>`).join("") + "</tbody></table>"
        : '<p class="hint">ماكو حسابات بعد.</p>';
      const secs = Object.fromEntries(r.sections.map((s) => [s.key, s]));
      $("#dp-secs").innerHTML = Object.entries(NAMES).map(([k, label]) => `<label class="sw"><input type="checkbox" data-sec="${k}" ${secs[k] && secs[k].on_ ? "checked" : ""}> ${label}</label><br>`).join("") +
"";
      log();
    }
    async function log(id) {
      const r = await api({ action: "admin_logins", id });
      if (on.signal.aborted) return;
      $("#dp-log").innerHTML = (r.logins || []).length ? `<table class="adm"><tbody>${r.logins.map((l) => `<tr><td>${esc(names[l.viewer_id] || "")}</td><td>${esc(String(l.at).replace("T", " ").slice(0, 16))}</td><td>${l.ok ? "✅" : "⛔"}</td><td dir="ltr"><small>${esc(l.ua || "")}</small></td></tr>`).join("")}</tbody></table>` : '<p class="hint">ماكو دخول بعد.</p>';
    }

    $("#dp-make").onclick = async () => {
      const pin = String($("#dp-pin").value || "").replace(/\D/g, ""); $("#dp-pin").value = "";
      const r = await api({ action: "admin_create", name: $("#dp-name").value, expires_at: $("#dp-exp").value || null, pin: pin || undefined });
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      $("#dp-out").innerHTML = r.pin_set && SP ? SP.ready(r.name, r.login_url) : `<p class="tm-once">✅ انعمل الحساب. ${esc(r.msg || "حدد رقمه من الجدول (🔑).")}</p>`;
      load();
    };
    pane.addEventListener("change", async (ev) => {
      const sec = ev.target.closest("[data-sec]");
      if (sec) { await api({ action: "admin_sections", sections: { [sec.dataset.sec]: { on: sec.checked } } }); return; }
      if (ev.target.dataset.a === "exp") await api({ action: "admin_expiry", id: ev.target.closest("tr").dataset.id, expires_at: ev.target.value || null });
    }, on);
    pane.addEventListener("submit", async (ev) => {
      const f = ev.target.closest("form[data-pin-for]"); if (!f || !SP) return;
      ev.preventDefault();
      const m = f.querySelector(".tm-msg"), v = SP.pinRead(f), tr = f.closest("tr");
      if (v.err) { m.className = "tm-msg bad"; m.textContent = v.err; return; }
      const act = f.dataset.act || "admin_set_pin";
      if (act === "admin_activate" && !confirm(`تفعّل حساب «${tr.dataset.name}»؟ دخول رئيس القسم يشتغل برقمه هذا.`)) return;
      m.className = "tm-msg"; m.textContent = "لحظة…";
      const r = await api({ action: act, id: f.dataset.pinFor, pin: v.pin });
      f.querySelectorAll("input").forEach((i) => (i.value = ""));
      if (r.status !== 200) { m.className = "tm-msg bad"; m.textContent = r.msg || "ما صار."; return; }
      $("#dp-out").innerHTML = SP.ready(tr.dataset.name, r.login_url); load();
    }, on);
    pane.addEventListener("click", async (ev) => {
      if (ev.target.closest && ev.target.closest("[data-pin-x]")) { ev.target.closest("form").remove(); return; }
      const cp = ev.target.closest("button[data-cp]"); if (cp) return copy(cp.dataset.cp, cp);
      const b = ev.target.closest("button[data-a]"); if (!b) return;
      const tr = b.closest("tr"), id = tr.dataset.id, name = tr.dataset.name, a = b.dataset.a;
      if ((a === "resetpw" || a === "activate") && SP) {
        const bx = tr.querySelector(".tm-pinbox");
        if (bx.innerHTML) { bx.innerHTML = ""; return; }
        bx.innerHTML = SP.pinForm(id, a === "activate" ? "رقمه السري (8 أرقام أو أكثر) — بعدها يتفعّل" : undefined);
        if (a === "activate") bx.querySelector("form").dataset.act = "admin_activate";
        bx.querySelector("input").focus(); return;
      }
      if (a === "signout") { if (!confirm(`تطلّع «${name}» من كل أجهزته؟`)) return; const rr = await api({ action: "admin_signout", id }); alert(rr.status === 200 ? "✅ طلع من كل أجهزته." : rr.msg || "ما صار."); return; }
      if (a === "log") return log(id);
      let r;
      if (a === "toggle") {
        const back = b.textContent.includes("▶️");
        // ✋ 59: ⏸️ إيقاف رئيس القسم ← تأكيد أول (التشغيل بلا تأكيد)
        if (!back && !(await ask(b, `توقف حساب «${name}»؟ يطلع من كل أجهزته وما يگدر يدخل لحد ما ترجّعه (▶️).`, { danger: true, yes: "نعم، أوقفه" }))) return;
        r = await api({ action: "admin_toggle", id, enabled: back });
      }
      // 🏛️ 53: حساب رئيس القسم ما ينحذف — ينقفل بس (التاريخ والشهادات والتقارير تبقى باسمه، وتگدر تفتحه بضغطة)
      if (a === "lock") { if (!confirm(`تقفل حساب «${name}»؟ ما ينحذف شي، ويطلع من كل أجهزته، وتگدر تفتحه بعدين بضغطة.`)) return; r = await api({ action: "admin_lock", id }); }
      if (r && r.status !== 200) alert(r.msg || "صار خطأ");
      load();
    }, on);
    load();
  }
  // 📊 أرقام القسم (اللوحة القديمة، قراءة بس) — هسه تحت «المزيد» بلوحة الرئيس الجديدة
  async function stats(root, sb) {
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
    root.innerHTML = `<h2>📊 أرقام القسم</h2><p class="hint">أرقام مجمّعة بلا أسماء. أي مجموعة أقل من ${esc(d.k_min)} طلاب ما تطلع (—). للاطّلاع فقط.</p>
      ${d.announcement ? `<div class="alert"><b>📣</b> ${esc(d.announcement)}</div>` : ""}
      ${a ? `<div class="kpis"><div><b>${n(a.registered)}</b><span>مسجّلون بالكود</span></div><div><b>${n(last.length ? last[last.length - 1].students : null)}</b><span>نشطون آخر يوم</span></div>
        <div><b>${n((a.weekly || []).slice(-1)[0]?.students)}</b><span>نشطون هذا الأسبوع</span></div></div>
        <h3>الطلاب النشطون (آخر 7 أيام)</h3><table class="adm"><tbody>${last.map((x) => `<tr><td>${esc(x.day)}</td><td>${n(x.students)}</td></tr>`).join("") || '<tr><td>ماكو بيانات بعد.</td></tr>'}</tbody></table>` : ""}
      ${d.top_lectures ? `<h3>📚 الأكثر قراءة لكل مادة (30 يوم)</h3>${Object.keys(top).length ? Object.entries(top).map(([sub, l]) => `<p><b>${esc(sub)}</b>: ${l.map((x) => `${esc(x.lecture)} (${n(x.people)})`).join("، ")}</p>`).join("") : '<p class="hint">ماكو بيانات كافية بعد.</p>'}` : ""}
      ${d.hardest_topics ? `<h3>🧩 الموضوعات الأصعب (نسبة الغلط بأول محاولة)</h3><table class="adm"><tbody>${hard.map((x) => `<tr><td>${esc(x.quiz)}</td><td>${Math.round(x.wrong_rate * 100)}%</td></tr>`).join("") || '<tr><td>ماكو بيانات كافية بعد.</td></tr>'}</tbody></table>` : ""}
      ${ex ? `<h3>📅 التفاعل وقت الامتحانات</h3><p class="hint">${(ex.exams || []).length ? (ex.exams || []).map((e) => `${esc(e.subject)} ${esc(e.date)}`).join(" · ") : "ماكو امتحانات هسه."}</p>` : ""}
      ${!a && !d.top_lectures && !d.hardest_topics && !ex ? '<p class="hint">محمد بعده ما فعّل أجزاء اللوحة.</p>' : ""}
      <p class="hint">⚠️ للمراجعة فقط — مو توقّع لأسئلة الامتحان.</p>`;
  }
  // ───────────────────────── 🏛️ 53 (مسودة): «المنصب مو الشخص» ─────────────────────────
  const OWNER_LINE = "فكرة وتطوير: محمد آل مسافر الموسوي";              // ثابت — نفس head.py (ماكو إعداد يغيّره)
  const OWNER_FOOTER = "منصة طلاب تقنيات الأشعة · تطوير محمد الموسوي";
  const AV = (() => { try { return new URL("assets/favicon.svg", document.querySelector('link[rel="manifest"]').href).href; } catch (e) { return "../assets/favicon.svg"; } })();                                   // شعار القسم بدل الصورة إذا ماكو صورة (مو صورة شخص)
  const fmtD = (t) => { try { return new Date(t).toLocaleString("ar-IQ-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad" }); } catch (e) { return d10(t); } };
  const later = (r) => r.status === 400 || r.status === 404 || r.status === 0;   // الفعل بعده ما انرفع للسيرفر (مسودة)
  const SOON = '<p class="hint">⏳ هذا الجزء يشتغل بعد ما تنرفع تحديثات السيرفر (مسودة 53). ما يتغيّر شي هسه.</p>';
  function hdCss() {
    if (document.getElementById("hd-css")) return;
    const s = document.createElement("style"); s.id = "hd-css";
    s.textContent = `.hd-card{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:18px;padding:16px;margin:10px 0 14px;display:grid;gap:12px}
.hd-who{display:flex;align-items:center;gap:12px}.hd-who img{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--line,#ddd);background:var(--bg,#f6f2ea);flex:none}
.hd-who img[data-neutral]{padding:8px;object-fit:contain}.hd-who b{display:block;font-family:var(--title-font,inherit)}.hd-who small{color:var(--muted,#666)}
.hd-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:3px 12px;font-size:.86rem;border:0;background:color-mix(in srgb,var(--muted,#666) 14%,transparent);color:var(--muted,#555)}
.hd-pill.on{background:var(--brand-soft,#ecedf4)}
.hd-f{display:grid;gap:4px}.hd-f span{font-weight:600;font-size:.92rem;color:var(--muted,#666)}
.hd-f input,.hd-f textarea{width:100%;box-sizing:border-box;min-height:44px;font:inherit;font-size:16px;border:1px solid var(--line,#ccc);border-radius:12px;padding:8px 12px;background:var(--card,#fff);color:var(--ink,#222)}
.hd-f small{color:var(--muted,#666);font-size:.82rem}.hd-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.hd-row .btn{width:auto;padding:10px 18px;font-size:15px;min-height:44px}.hd-note{font-size:.86rem;color:var(--muted,#666);margin:0}
.hd-own{border-top:1px dashed var(--line,#ddd);padding-top:10px;font-size:.86rem;color:var(--muted,#666);margin:0}
.hd-steps{display:flex;gap:6px;font-size:.82rem;color:var(--muted,#666);margin:4px 0}.hd-steps b{color:var(--brand,#4b5a8a)}
.hd-sum{list-style:none;padding:0;margin:0;display:grid;gap:6px}.hd-sum li{background:var(--bg,#f6f2ea);border-radius:12px;padding:8px 12px}
.hd-fm{display:grid;gap:8px}.hd-fm article{border:1px solid var(--line,#ddd);border-radius:14px;padding:12px;display:grid;gap:6px;background:var(--card,#fff)}
.hd-fm .hd-kept{font-size:.84rem;color:var(--muted,#666)}
.hd-details{border:1px solid var(--line,#ddd);border-radius:18px;padding:4px 16px;margin:0 0 14px;background:var(--card,#fff)}
.hd-details>summary{min-height:48px;display:flex;align-items:center;font-weight:700;cursor:pointer}
.hp{max-width:560px;margin:0 auto;display:grid;gap:14px}.hp-top{display:flex;align-items:center;gap:12px}
.hp-top img{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--line,#ddd);background:var(--card,#fff)}.hp-top img[data-neutral]{padding:8px;object-fit:contain}
.hp-top div{flex:1}.hp-top p{margin:0;font:700 1.15rem var(--title-font,inherit)}.hp-top small{color:var(--muted,#666)}
.hp-top .btn{width:auto;padding:8px 14px;font-size:14px;min-height:44px}
.hp-acts{display:grid;gap:10px}.hp-acts button{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:12px 16px;border-radius:16px;border:1px solid var(--line,#ddd);background:var(--card,#fff);color:var(--ink,#222);font:600 1.02rem var(--title-font,inherit);cursor:pointer;text-align:start}
.hp-acts button .i{font-size:1.35rem}.hp-acts button .t{flex:1}.hp-acts button small{display:block;font:400 .82rem var(--body-font,inherit);color:var(--muted,#666)}
.hp-acts button.main{background:var(--brand,#4b5a8a);color:var(--brand-ink,#fff);border-color:var(--brand,#4b5a8a)}.hp-acts button.main small{color:inherit;opacity:.85}
.hp-acts button:focus-visible{outline:3px solid var(--brand,#4b5a8a);outline-offset:2px}
.hp-tag{font:600 .74rem var(--body-font,inherit);border-radius:999px;padding:2px 10px;background:var(--bg,#f6f2ea);color:var(--muted,#555)}
.hp-scr{display:grid;gap:12px}.hp-back{background:none;border:0;color:var(--brand,#4b5a8a);font:600 1rem inherit;min-height:44px;cursor:pointer;justify-self:start;padding:0}
.hp-prev{border:1px dashed var(--line,#ccc);border-radius:16px;padding:12px;background:var(--bg,#f6f2ea)}
.hp-prev .hd-word{margin:0}.hp-owner{text-align:center;font-size:.84rem;color:var(--muted,#666);margin:6px 0 0}
.hp-ann-badge{display:inline-block;background:var(--brand,#4b5a8a);color:var(--brand-ink,#fff);border-radius:999px;padding:2px 10px;font-size:.84rem}
.hp-more>summary{min-height:48px;display:flex;align-items:center;cursor:pointer;color:var(--muted,#666)}
.hd-f textarea{resize:none;overflow:hidden;line-height:1.7}.hd-stat{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--bg,#f6f2ea);border-radius:12px;padding:8px 12px}
.hd-stat span{flex:1;min-width:180px}.hd-stat .btn{width:auto;padding:8px 14px;font-size:14px;min-height:44px}
.hd-card details.hd-en>summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:var(--muted,#666);font-size:.92rem}
.hd-toast{position:fixed;inset-inline:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:1000;max-width:520px;margin:0 auto;display:flex;gap:10px;align-items:center;justify-content:space-between;background:var(--ink,#222);color:var(--bg,#fff);border-radius:14px;padding:10px 14px;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.hd-toast button{background:none;border:1px solid currentColor;color:inherit;border-radius:10px;min-height:44px;padding:0 12px;font:inherit;cursor:pointer}
.cp-eye{display:flex;gap:8px;align-items:center}.cp-eye input{flex:1}.cp-eye button{min-width:56px;min-height:48px;border:1px solid var(--line,#ccc);border-radius:14px;background:transparent;color:var(--brand,#3B4A8C);font:inherit;cursor:pointer}`;
    document.head.appendChild(s);
  }
  /** صورة دائرية مضغوطة (WebP ≤ 50 KB، 256px) بالمتصفح — قبل الرفع. */
  function squareWebp(file) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const n = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = 256;
        c.getContext("2d").drawImage(img, (img.width - n) / 2, (img.height - n) / 2, n, n, 0, 0, 256, 256); URL.revokeObjectURL(u);
        const tryQ = (q) => c.toBlob((b) => (b && b.size > 50e3 && q > 0.4 ? tryQ(q - 0.15) : b ? res(b) : rej(new Error("img"))), "image/webp", q);
        tryQ(0.85);
      };
      img.onerror = () => rej(new Error("img")); img.src = u;
    });
  }
  const b64 = (blob) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(String(f.result).split(",")[1]); f.readAsDataURL(blob); });
  const avatar = (url) => (url ? `<img src="${esc(url)}" alt="" width="56" height="56">` : "");   // ماكو صورة ← ماكو دائرة
  const wordPreview = (name, title, lines) => `<section class="hd-word"><h2 class="hd-wt">كلمة رئيس القسم</h2><blockquote class="hd-q">${lines.filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("") || "<p>…</p>"}</blockquote><p class="hd-by"><span>— ${esc(name || "…")}، ${esc(title || "")}</span></p></section>`;
  /** حقل نص يكبر وحده + عدّاد (Western digits). */
  const ta = (name, label, max, val, hint) => `<label class="hd-f"><span>${label}</span><textarea name="${name}" rows="1" maxlength="${max}" data-max="${max}">${esc(val || "")}</textarea>
    <small><span data-cnt="${name}">${String(val || "").length}</span>/${max}${hint ? ` · ${hint}` : ""}</small></label>`;
  function autosize(root) {
    const fit = (x) => { x.style.height = "auto"; x.style.height = x.scrollHeight + 2 + "px"; const c = root.querySelector(`[data-cnt="${x.name}"]`); if (c) c.textContent = x.value.length; };
    root.querySelectorAll("textarea[data-max]").forEach((x) => { x.addEventListener("input", () => fit(x)); requestAnimationFrame(() => fit(x)); });
  }
  /** تنبيه صغير ويّا «تراجع» (8 ثواني). */
  function toast(text, undo) {
    document.querySelector(".hd-toast")?.remove();
    const el = document.createElement("div"); el.className = "hd-toast"; el.setAttribute("role", "status");
    el.innerHTML = `<span>${esc(text)}</span>${undo ? '<button type="button">↩️ تراجع</button>' : ""}`;
    document.body.appendChild(el);
    const t = setTimeout(() => el.remove(), 8000);
    if (undo) el.querySelector("button").onclick = async () => { clearTimeout(t); el.remove(); await undo(); };
  }
  const fmtL = (t) => { try { return new Date(t).toLocaleString("ar-IQ-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad" }); } catch (e) { return d10(t); } };

  // 🏛️ لوحة محمد: بطاقة وحدة «رئيس القسم الحالي» (البيانات + حالة الدخول + الظهور) + تغيير الرئيس + السابقين
  async function headAdmin(box, api) {
    if (!box) return;
    hdCss();
    const wasOpen = [...box.querySelectorAll("details.hd-details[open]")].map((d) => d.id);   // بعد أي فعل: نفس الأقسام تبقى مفتوحة
    const [r, L] = await Promise.all([api({ action: "admin_head_get" }), api({ action: "admin_list" })]);
    if (r.status !== 200) {
      box.innerHTML = `<section class="hd-card"><b>🏛️ رئيس القسم الحالي</b>${later(r) ? SOON : `<p class="hint">ما گدرت أجيب الإعداد (${esc(r.status)}).</p>`}
        <p class="hd-own">✍️ ${esc(OWNER_LINE)} — ثابت، ما يتغيّر من هنا ولا من لوحة رئيس القسم.</p></section>`;
      return;
    }
    const h = r.head || {}, formers = r.formers || [];
    const W = Array.isArray(h.word) ? h.word : [];
    const vw = (L.viewers || []).find((v) => v.id === h.viewer_id) || (L.viewers || [])[0] || null;
    const acc = r.account || (vw && { enabled: vw.enabled, has_pin: vw.has_password, temp: vw.must_change, temp_expires_at: vw.temp_expires_at, last_login: vw.last_login });
    const loginOn = L.on === true;
    const status = !acc ? "ماكو حساب دخول بعد"
      : !loginOn || !acc.enabled ? "💤 الدخول مطفي — ينتظر تفعيلك"
      : acc.temp ? `⏳ رقم مؤقت ينتهي ${fmtL(acc.temp_expires_at)}`
      : acc.has_pin ? `✅ يدخل برقمه${acc.last_login ? ` · آخر دخول ${d10(acc.last_login)}` : ""}` : "⏳ ماكو رقم بعد";
    box.innerHTML = `<section class="hd-card" id="hd-cur" aria-labelledby="hd-cur-t">
      <div class="hd-row" style="justify-content:space-between"><b id="hd-cur-t">🏛️ رئيس القسم الحالي</b>
        <span class="hd-pill ${r.public_on ? "on" : ""}">${r.public_on ? "✅ ظاهر بالموقع" : "🔒 مطفي — ما يطلع بالموقع"}</span></div>
      <div class="hd-who">${avatar(h.photo_url)}<div><b>${esc(h.name || "—")}</b><small>${esc(h.title || "")}${h.since ? ` · من ${esc(d10(h.since))}` : ""}</small></div></div>
      <div class="hd-stat"><span>🔐 ${esc(status)}</span>${acc ? '<button class="btn ghost" type="button" data-h="pin">🔑 رقم جديد</button>' : ""}
        ${acc && (!loginOn || !acc.enabled) ? '<button class="btn ghost" type="button" data-h="login">▶️ فعّل الدخول</button>' : ""}</div>
      <div id="hd-pinbox"></div>
      <form id="hd-form" class="hd-fm" novalidate>
        <label class="hd-f"><span>الاسم</span><input name="name" maxlength="120" value="${esc(h.name || "")}"></label>
        <label class="hd-f"><span>المنصب</span><input name="title" maxlength="120" value="${esc(h.title || "رئيس قسم تقنيات الأشعة")}"></label>
        ${ta("welcome", "جملة الترحيب (تطلع مرة وحدة بأول زيارة)", 140, h.welcome)}
        ${ta("w1", "كلمة رئيس القسم — السطر الأول", 90, W[0])}
        ${ta("w2", "السطر الثاني (اختياري)", 90, W[1])}
        <label class="sw"><input type="checkbox" name="word_on" ${h.word_on !== false ? "checked" : ""}> اعرض «كلمة رئيس القسم» بالرئيسية</label>
        <details class="hd-en"><summary>الاسم بالإنكليزي (اختياري — لوضع ENG)</summary>
          <label class="hd-f"><span>Name</span><input name="name_en" maxlength="120" dir="ltr" value="${esc(h.name_en || "")}"></label>
          <label class="hd-f"><span>Title</span><input name="title_en" maxlength="120" dir="ltr" value="${esc(h.title_en || "")}" placeholder="Head of the Department of Radiology Techniques"></label></details>
        <div class="hd-row"><label class="btn ghost" style="width:auto;cursor:pointer">🖼️ ${h.photo_url ? "بدّل الصورة" : "أضف صورة"}<input type="file" accept="image/*" name="photo" hidden></label>
          <small class="hd-note">دائرية صغيرة، تبقى خاصة لحد التفعيل.</small></div>
        <div class="hd-row"><button class="btn" type="submit">💾 احفظ</button><span class="tm-msg" role="status" aria-live="polite"></span></div>
      </form>
      <div class="hd-row"><button class="btn ghost" type="button" data-h="public">${r.public_on ? "⏸️ أخفِ من الموقع" : "▶️ فعّل الظهور بالموقع"}</button>
        <small class="hd-note">${r.public_on ? "الاسم والصورة والكلمة ظاهرة بالموقع." : "بعد موافقته. لحد ذاك ولا اسم ولا صورة بأي صفحة."}</small></div>
      <p class="hd-own">✍️ سطورك ثابتة بكل مكان: «${esc(OWNER_LINE)}» و«${esc(OWNER_FOOTER)}». إنت فوق رئيس القسم: ما يگدر يشيلك ولا يغيّر اسمك أو صلاحياتك أو هالسطور.</p>
    </section>
    <details class="hd-details" id="hd-change"><summary>🔄 تغيير رئيس القسم</summary><div id="hd-chg"></div></details>
    <details class="hd-details" id="hd-formers"><summary>🗂️ رؤساء القسم السابقين (${formers.length})</summary><div class="hd-fm" id="hd-fl"></div></details>`;
    wasOpen.forEach((id) => { const d = box.querySelector("#" + id); if (d) d.open = true; });
    const f = box.querySelector("#hd-form"), msg = f.querySelector(".tm-msg");
    autosize(f);
    f.photo.onchange = async () => {
      const file = f.photo.files[0]; if (!file) return;
      msg.textContent = "لحظة…";
      try { const blob = await squareWebp(file); const rr = await api({ action: "admin_head_photo", webp: await b64(blob) });
        msg.textContent = rr.status === 200 ? "✅ انحفظت الصورة." : later(rr) ? "⏳ بعد تحديث السيرفر." : rr.msg || "ما صار.";
        if (rr.status === 200) headAdmin(box, api);
      } catch (e) { msg.textContent = "الصورة ما انقرت. جرّب صورة ثانية."; }
    };
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const body = { action: "admin_head_save", name: f.name.value.trim(), title: f.title.value.trim(), welcome: f.welcome.value.trim(), word: [f.w1.value.trim(), f.w2.value.trim()].filter(Boolean),
        word_on: f.word_on.checked, name_en: f.name_en.value.trim(), title_en: f.title_en.value.trim() };
      if (body.name.length < 2) { msg.textContent = "اكتب الاسم."; return; }
      msg.textContent = "لحظة…"; const rr = await api(body);
      msg.textContent = rr.status === 200 ? "✅ انحفظ." + (r.public_on ? " يتحدّث بالموقع خلال دقائق." : " (ما يطلع بالموقع لحد التفعيل)") : later(rr) ? "⏳ بعد تحديث السيرفر." : rr.msg || "ما صار.";
    };
    box.querySelector("[data-h=public]").onclick = async () => {
      if (!r.public_on) {
        const t = prompt("تفعيل ظهور رئيس القسم بالموقع (الاسم + الصورة + الكلمة + سطر «بإشراف»).\nبس بعد ما يوافق هو. اكتب «وافق» حتى تأكد:");
        if (t === null) return; if (t.trim() !== "وافق") return alert("ما تفعّل شي.");
      } else if (!confirm("تخفي رئيس القسم من الموقع؟ الصورة ترجع خاصة. ما ينحذف شي.")) return;
      const rr = await api({ action: "admin_head_public", on: !r.public_on, confirm: r.public_on ? undefined : "وافق" });
      if (rr.status !== 200) return alert(later(rr) ? "⏳ بعد تحديث السيرفر." : rr.msg || "ما صار.");
      headAdmin(box, api);
    };
    const pb = box.querySelector("[data-h=pin]");
    if (pb) pb.onclick = () => {
      const bx = box.querySelector("#hd-pinbox");
      if (bx.innerHTML) { bx.innerHTML = ""; return; }
      bx.innerHTML = `<form class="tm-pin hd-fm" data-hd-pin novalidate><label class="hd-f"><span>الرقم الجديد (8–12 رقم)</span><input type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12" data-pin="1"></label>
        <label class="hd-f"><span>أعده مرة ثانية</span><input type="password" inputmode="numeric" autocomplete="new-password" dir="ltr" maxlength="12" data-pin="2"></label>
        <div class="hd-row"><button class="btn ghost" type="submit">💾 احفظ الرقم</button><span class="tm-msg" role="status"></span></div></form>`;
      const pf = bx.querySelector("form"); pf.querySelector("input").focus();
      pf.onsubmit = async (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const v = window.StaffPin ? StaffPin.pinRead(pf) : { err: "ما جاهز." }, m = pf.querySelector(".tm-msg");
        if (v.err) return (m.textContent = v.err);
        const rr = await api({ action: "admin_set_pin", id: acc && (h.viewer_id || vw.id), pin: v.pin });
        pf.querySelectorAll("input").forEach((i) => (i.value = ""));
        m.textContent = rr.status === 200 ? "✅ انحفظ. سلّمه بإيدك." : rr.msg || "ما صار.";
      };
    };
    const lb = box.querySelector("[data-h=login]");
    if (lb) lb.onclick = async () => {
      if (!confirm("تفعّل دخول رئيس القسم؟ (يدخل برقمه — الظهور بالموقع يبقى مثل ما هو)")) return;
      if (!loginOn) await api({ action: "admin_feature", on: true });
      if (vw && !vw.enabled) await api({ action: "admin_toggle", id: vw.id, enabled: true });
      headAdmin(box, api);
    };
    changeFlow(box.querySelector("#hd-chg"), api, h, () => headAdmin(box, api));
    formerList(box.querySelector("#hd-fl"), api, formers, () => headAdmin(box, api), r.public_on === true);
  }

  /** 🔄 تغيير رئيس القسم: (1) البيانات + رقم مؤقت → (2) معاينة + تأكيد بكتابة الاسم → (3) جاهز (سلّم الرقم بإيدك). */
  function changeFlow(el, api, cur, done) {
    const suggest = () => {   // L8: crypto.getRandomValues — 10 أرقام، بلا تكرار ولا تسلسل
      const a = new Uint32Array(10); let s;
      do { crypto.getRandomValues(a); s = Array.from(a, (x) => x % 10).join(""); if (s[0] === "0") s = "7" + s.slice(1); }
      while (/(\d)\1{2}|0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(s) || new Set(s).size < 5);
      return s;
    };
    const step1 = (v = {}) => {
      el.innerHTML = `<div class="hd-steps"><b>1. البيانات</b>‹ 2. تأكيد ‹ 3. جاهز</div>
      <form class="hd-fm" novalidate>
        <label class="hd-f"><span>اسم رئيس القسم الجديد</span><input name="name" maxlength="120" value="${esc(v.name || "")}" required></label>
        <label class="hd-f"><span>المنصب</span><input name="title" maxlength="120" value="${esc(v.title || "رئيس قسم تقنيات الأشعة")}"></label>
        <label class="hd-f"><span>يبدأ من</span><input name="from" type="date" value="${esc(v.from || new Date().toISOString().slice(0, 10))}"></label>
        <label class="hd-f"><span>رقم مؤقت (8–12 رقم)</span><input name="pin" inputmode="numeric" dir="ltr" maxlength="12" value="${esc(v.pin || "")}" autocomplete="off">
          <small>يشتغل <b>72 ساعة بس</b>. بأول دخول يختار رقمه الخاص، وبعدها يگدر يغيّره أي وقت.</small></label>
        <div class="hd-row"><button class="btn ghost" type="button" data-s>🎲 اقترح رقم</button></div>
        <label class="sw"><input type="checkbox" name="thank" ${v.thank ? "checked" : ""}> أضف ${cur.name ? `«${esc(cur.name)}»` : "الرئيس السابق"} لـ «رعاة المنصة» (صفحة الشكر)</label>
        <div class="hd-row"><button class="btn" type="submit">التالي ›</button><span class="tm-msg" role="status"></span></div></form>`;
      const f = el.querySelector("form");
      f.querySelector("[data-s]").onclick = () => { f.pin.value = suggest(); };
      f.onsubmit = (ev) => {
        ev.preventDefault();
        const x = { name: f.name.value.trim(), title: f.title.value.trim(), from: f.from.value, pin: digits(f.pin.value), thank: f.thank.checked };
        const m = f.querySelector(".tm-msg");
        if (x.name.length < 2) return (m.textContent = "اكتب الاسم.");
        if (!/^\d{8,12}$/.test(x.pin)) return (m.textContent = "الرقم المؤقت 8–12 رقم.");
        step2(x);
      };
    };
    const step2 = (x) => {
      el.innerHTML = `<div class="hd-steps">1. البيانات ‹ <b>2. تأكيد</b> ‹ 3. جاهز</div>
      <ul class="hd-sum">
        <li>🔒 حساب ${cur.name ? `«${esc(cur.name)}»` : "الرئيس الحالي"} <b>ينقفل</b> ويطلع من كل أجهزته — <b>ما ينحذف</b> شي.</li>
        <li>🗂️ ينتقل لـ «رؤساء القسم السابقين»: شهاداته وإعلاناته وتقاريره وكلمته تبقى باسمه، وصورته ترجع خاصة.</li>
        <li>➕ حساب جديد: <b>${esc(x.name)}</b> — ${esc(x.title)}، من ${esc(x.from)}.</li>
        <li>⏳ الرقم المؤقت يشتغل 72 ساعة بس، وبأول دخول يختار رقمه.</li>
        <li>🔒 الظهور بالموقع ينطفي لحد ما يوافق الرئيس الجديد وتفعّله إنت.</li>
        ${x.thank ? "<li>🙏 السابق ينضاف لـ «رعاة المنصة» بصفحة الشكر (يظهر بس وقت ما ظهور رئيس القسم مفعّل).</li>" : ""}
      </ul>
      <form class="hd-fm" novalidate><label class="hd-f"><span>حتى تأكد، اكتب اسم الرئيس الجديد بالضبط</span><input name="c" maxlength="120" autocomplete="off"></label>
        <div class="hd-row"><button class="btn" type="submit">✅ بدّل رئيس القسم</button><button class="btn ghost" type="button" data-b>‹ رجوع</button><span class="tm-msg" role="status"></span></div></form>`;
      const f = el.querySelector("form"), m = f.querySelector(".tm-msg");
      f.querySelector("[data-b]").onclick = () => step1(x);
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        if (f.c.value.trim() !== x.name) return (m.textContent = "الاسم مو مطابق.");
        m.textContent = "لحظة…";
        const rr = await api({ action: "admin_change_head", name: x.name, title: x.title, from_date: x.from, pin: x.pin, thank: x.thank, confirm_name: f.c.value.trim() });
        if (rr.status !== 200) return (m.textContent = later(rr) ? "⏳ يشتغل بعد تحديث السيرفر (مسودة 53). ما تغيّر شي." : rr.msg || "ما صار.");
        step3(x, rr);
      };
    };
    const step3 = (x, rr) => {
      const exp = rr.temp_expires_at || new Date(Date.now() + 72 * 3600e3).toISOString();
      el.innerHTML = `<div class="hd-steps">1. البيانات ‹ 2. تأكيد ‹ <b>3. جاهز</b></div>
      <div class="tm-once" role="status"><b>✅ تبدّل رئيس القسم: ${esc(x.name)}</b>
        <p>الرقم المؤقت ينتهي: <b>${esc(fmtL(exp))}</b> (72 ساعة). سلّمه بإيدك أو برسالة خاصة — ما ينرسل بالبوت أبداً.</p>
        <p class="hint">الظهور بالموقع انطفى. فعّله بعد ما يوافق.</p>
        <p class="hint">🛡️ تذكير: ضيف اسم الرئيس السابق (والجديد) لملف <code>_النظام/head-names.local.txt</code> حتى فحص البناء يمنع ظهوره بالغلط وهو مطفي.</p>
        <p><button class="btn ghost" type="button" data-d>تم</button></p></div>`;
      el.querySelector("[data-d]").onclick = done;
    };
    step1();
  }

  /** 🗂️ رؤساء القسم السابقين: ماكو حذف. 🔓 أعد فتح الدخول (بس) · 🙏 أضف للشكر — ويّا «تراجع». */
  function formerList(el, api, list, done, publicOn) {
    if (!list.length) { el.innerHTML = '<p class="hint">ماكو رؤساء سابقين بعد.</p>'; return; }
    el.innerHTML = list.map((x) => `<article data-id="${esc(x.id)}" data-viewer="${esc(x.viewer_id || "")}" data-name="${esc(x.name)}">
      <div class="hd-who">${avatar(x.photo_url)}<div><b>${esc(x.name)}</b><small>${esc(x.title)} · ${esc(d10(x.from_date))} – ${esc(d10(x.to_date))}</small></div></div>
      <p class="hd-kept">محفوظ باسمه: ${esc(x.counts?.certs ?? 0)} شهادة · ${esc(x.counts?.anns ?? 0)} إعلان · ${esc(x.counts?.reports ?? 0)} تقرير · ${esc(x.counts?.words ?? 0)} كلمة</p>
      <div class="hd-row"><span class="hd-pill">${x.locked ? "🔒 مقفول" : "🔓 الدخول مفتوح"}</span>
        ${x.locked ? '<button class="btn ghost" type="button" data-f="reopen">🔓 أعد فتح الدخول</button>' : ""}
        ${x.thanked ? '<span class="hd-pill">🏛️ ضمن رعاة المنصة</span>' : '<button class="btn ghost" type="button" data-f="thank">🙏 أضف للشكر</button>'}</div>
      ${x.locked ? '<p class="hd-note">🔓 «أعد فتح» = يشوف تاريخه بس، ما يرجع رئيس. للرجوع رئيساً: «🔄 تغيير رئيس القسم».</p>' : ""}</article>`).join("");
    el.onclick = async (ev) => {
      const b = ev.target.closest("button[data-f]"); if (!b) return;
      const a = b.closest("article"), n = a.dataset.name;
      if (b.dataset.f === "thank" && !confirm(`تضيف «${n}» لـ «🏛️ رعاة المنصة» بصفحة الشكر؟\n(يظهر بس لما ظهور رئيس القسم مفعّل)`)) return;
      const rr = await api({ action: b.dataset.f === "reopen" ? "admin_reopen_head" : "admin_thank_former", id: a.dataset.id });
      if (rr.status !== 200) return alert(later(rr) ? "⏳ بعد تحديث السيرفر (مسودة 53)." : rr.msg || "ما صار.");
      done();
      if (b.dataset.f === "reopen") toast(`🔓 انفتح دخول «${n}» — لمشاهدة تاريخه بس.`, a.dataset.viewer ? async () => { await api({ action: "admin_lock", id: a.dataset.viewer }); done(); } : null);
      else toast(publicOn ? `🏛️ «${n}» انضاف لـ «رعاة المنصة».` : `🏛️ انضاف لـ «رعاة المنصة» — يطلع بالموقع لما يتفعّل ظهور رئيس القسم.`);
    };
  }

  // 👤 لوحة رئيس القسم (بسيطة جداً): 4–6 أزرار كبار، كل زر شاشة وحدة بزر رئيسي واحد.
  // ما يگدر يحذف، ولا يشوف بيانات طالب، ولا يغيّر إعداد تقني. كل فعل يمر بقائمة بيضاء بالسيرفر.
  async function viewer(root, sb) {
    hdCss();
    const { data: { session } } = await sb.auth.getSession();
    const call = async (body) => {
      try {
        const r = await fetch(`${C.url}/functions/v1/dept-stats`, { method: "POST",
          headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
        return { status: r.status, ...(await r.json().catch(() => ({}))) };
      } catch (e) { return { status: 0 }; }
    };
    let me = await call({ action: "head_me" });
    if (me.status === 401 || me.status === 403) {
      await sb.auth.signOut({ scope: "local" }).catch(() => {});
      root.innerHTML = `<p class="hint">${esc(me.msg || "ما گدرنا نفتح اللوحة.")}</p><p><a class="btn" href="./">رجوع لصفحة الدخول</a></p>`; return;
    }
    const draft = me.status !== 200;            // السيرفر بعده ما تحدّث ← اللوحة تشتغل بالأرقام بس، واللي مو جاهز ما يطلع
    if (draft) { const s = await call({ action: "stats" }); me = { name: s.viewer || "", title: "رئيس قسم تقنيات الأشعة" }; }
    const ACT = [
      ["word", "✍️", "كلمة رئيس القسم", me.word && me.word.length ? "تطلع بالرئيسية" : "اكتب كلمتك للطلاب", true],
      ["welcome", "👋", "جملة الترحيب", "تطلع مرة وحدة بأول زيارة"],
      ["photo", "🖼️", "صورتك", "دائرية صغيرة"],
      // 🙈 30/10: أي فعل مو مفعّل بالسيرفر ما يطلع أبداً (بلا «قريباً») — يطلع بس لما head_me يرجّع features.<k> = true
      ["ann", "📢", "إعلان للطلاب", ""],
      ["voice", "💬", "صوتك يوصل", me.voice_stale ? `🕖 ${me.voice_stale} ما انفتحت من أسبوع` : "رسائل الطلاب لك", false, me.voice_locked ? "🔐 مقفول" : me.voice_on ? (me.voice_new ? `${me.voice_new} جديدة` : "مفعّل") : "مطفي"],
      ["report", "📄", "تقرير القسم الشهري", ""],
    ];
    if (me.launch_armed && !me.launched) ACT.push(["launch", "🚀", "إطلاق المنصة رسمياً", "مرة وحدة"]);
    const FEAT = me.features || {};
    const ready = (k) => (k === "ann" || k === "report" || k === "launch" ? FEAT[k] === true : k === "voice" ? !draft : true);
    for (let i = ACT.length - 1; i >= 0; i--) if (!ready(ACT[i][0])) ACT.splice(i, 1);
    const home = () => {
      root.innerHTML = `<div class="hp">
        <div class="hp-top">${me.photo_url ? `<img src="${esc(me.photo_url)}" alt="" width="56" height="56">` : ""}
          <div><p>أهلاً ${esc(me.name)}</p><small>${esc(me.title || "")}</small></div><button class="btn ghost" type="button" id="hp-out">خروج</button></div>
        <p class="hd-note">${me.public_on ? "✅ لمستك ظاهرة بالموقع." : "🔒 لمستك تطلع بالموقع بعد التفعيل. تگدر تجهّزها هسه."}</p>
        ${me.voice_pin_notice ? `<p class="hd-note" role="alert">🔐 تم تغيير رقمك من المالك.${me.voice_locked ? " «صوتك يوصل» مقفول لحد ما تختار رقمك بنفسك." : ""}</p>` : ""}
        <nav class="hp-acts" aria-label="لوحة رئيس القسم">${ACT.map(([k, i, t, sub, main, tag]) =>
          `<button type="button" data-k="${k}" class="${main ? "main" : ""}"><span class="i" aria-hidden="true">${i}</span><span class="t">${t}${sub ? `<small>${sub}</small>` : ""}</span>${tag ? `<span class="hp-tag">${tag}</span>` : ""}<span aria-hidden="true">‹</span></button>`).join("")}</nav>
        <details class="hp-more"><summary>المزيد ▾</summary><div class="hd-row"><button class="btn ghost" type="button" data-k="stats">📊 أرقام القسم</button>
          <button class="btn ghost" type="button" data-as-student>👁️ شوف كطالب</button></div><div id="dv-self"></div></details>
        <p class="hp-owner">${esc(OWNER_LINE)} — صاحب المنصة وصانعها، وبرعايتكم الكريمة 🌿</p>
        </div>`;
      root.querySelector("#hp-out").onclick = async () => { await sb.auth.signOut({ scope: "local" }).catch(() => {}); location.reload(); };
      root.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => screen(b.dataset.k)));
      if (window.AdminSelf) AdminSelf.tools(root.querySelector("#dv-self"));
    };
    const scr = (title, body) => { root.innerHTML = `<div class="hp hp-scr"><button class="hp-back" type="button">‹ رجوع</button><h2>${title}</h2>${body}</div>`; root.querySelector(".hp-back").onclick = home; };
    const saveBtn = (label, off) => `<div class="hd-row"><button class="btn" type="submit" ${off ? "disabled" : ""}>${label}</button><span class="tm-msg" role="status" aria-live="polite"></span></div>`;
    const wire = (action, read) => {
      const f = root.querySelector("form"), m = f.querySelector(".tm-msg");
      f.onsubmit = async (ev) => {
        ev.preventDefault(); m.textContent = "لحظة…";
        const body = read(f); const rr = await call({ action, ...body });
        if (rr.status === 200) { Object.assign(me, body); m.textContent = "✅ انحفظ."; } else m.textContent = draft || later(rr) ? "ما انحفظ هسه. جرّب مرة ثانية بعدين." : rr.msg || "ما صار.";
      };
    };
    function screen(k) {
      if (k !== "stats" && !ready(k)) return home();   // فعل مخفي ما ينفتح حتى لو انطلب
      if (k === "stats") { root.innerHTML = '<div class="hp hp-scr"><button class="hp-back" type="button">‹ رجوع</button><div id="hp-st"><p class="hint">لحظة…</p></div></div>'; root.querySelector(".hp-back").onclick = home; return stats(root.querySelector("#hp-st"), sb); }
      if (k === "word") {
        const W = me.word || [];
        scr("✍️ كلمة رئيس القسم", `<p class="hd-note">سطرين قصار للطلاب. تتبدّل بالرئيسية أول ما تحفظ${me.public_on ? "" : " (بعد التفعيل)"}.</p>
          <form class="hd-fm" novalidate>${ta("w1", "السطر الأول", 90, W[0])}${ta("w2", "السطر الثاني (اختياري)", 90, W[1])}
          <div class="hp-prev" aria-label="معاينة">${wordPreview(me.name, me.title, W)}</div>${saveBtn("💾 احفظ الكلمة")}</form>`);
        const f = root.querySelector("form"), pv = root.querySelector(".hp-prev"); autosize(f);
        f.oninput = () => (pv.innerHTML = wordPreview(me.name, me.title, [f.w1.value, f.w2.value]));
        return wire("head_word_set", (f) => ({ word: [f.w1.value.trim(), f.w2.value.trim()].filter(Boolean) }));
      }
      if (k === "welcome") {
        scr("👋 جملة الترحيب", `<p class="hd-note">تطلع للطالب مرة وحدة بأول زيارة، ويّا صورتك وزر «يلا نبدأ».</p>
          <form class="hd-fm" novalidate>${ta("w", "الجملة", 140, me.welcome)}${saveBtn("💾 احفظ")}</form>`);
        autosize(root.querySelector("form"));
        return wire("head_welcome_set", (f) => ({ welcome: f.w.value.trim() }));
      }
      if (k === "photo") {
        scr("🖼️ صورتك", `<p class="hd-note">صورة دائرية صغيرة (وجه واضح). تبقى خاصة لحد التفعيل. أيقونة الموقع تبقى شعار القسم.</p>
          <form class="hd-fm" novalidate><div class="hd-who">${me.photo_url ? `<img src="${esc(me.photo_url)}" alt="" width="56" height="56">` : '<small class="hd-note">ماكو صورة بعد.</small>'}<div><b>${esc(me.name)}</b><small>معاينة</small></div></div>
          <label class="hd-f"><span>اختر صورة</span><input type="file" name="p" accept="image/*"></label>${saveBtn("💾 احفظ الصورة")}</form>`);
        const f = root.querySelector("form"), m = f.querySelector(".tm-msg");
        f.onsubmit = async (ev) => {
          ev.preventDefault(); const file = f.p.files[0]; if (!file) return (m.textContent = "اختر صورة.");
          m.textContent = "لحظة…";
          try { const rr = await call({ action: "head_photo", webp: await b64(await squareWebp(file)) }); m.textContent = rr.status === 200 ? "✅ انحفظت." : "ما انحفظت هسه. جرّب مرة ثانية بعدين."; if (rr.photo_url) me.photo_url = rr.photo_url; }
          catch (e) { m.textContent = "الصورة ما انقرت. جرّب ثانية."; }
        };
        return;
      }
      if (k === "ann") {
        scr("📢 إعلان للطلاب", `<p class="hd-note">اختار قالب، عدّل النص، وشوف شكله. <b>الإرسال مطفي بهالمسودة</b> — يتفعّل بعدين بموافقة محمد.</p>
          <form class="hd-fm" novalidate><div class="hd-row">${[["extra", "📚 محاضرة إضافية"], ["postpone", "📅 تأجيل"], ["congrats", "🎉 تهنئة"], ["free", "✏️ نص حر"]].map(([v, l], i) =>
            `<label class="sw"><input type="radio" name="k" value="${v}" ${i === 0 ? "checked" : ""}> ${l}</label>`).join(" ")}</div>
          <label class="hd-f"><span>النص</span><textarea name="t" rows="3" maxlength="400">📚 محاضرة إضافية بمادة ‹المادة› يوم ‹اليوم› الساعة ‹الوقت›.</textarea><small>400 حرف بالكثير. يطلع شريط فوق الموقع.</small></label>
          <div class="hp-prev" aria-label="معاينة"><div class="annbar" data-by="head" style="border-radius:12px"><span class="hd-badge">📢 من رئيس القسم</span> <span data-pv></span></div></div>
          ${saveBtn("📤 أرسل (مطفي بالمسودة)", true)}</form>`);
        const f = root.querySelector("form"), pv = root.querySelector("[data-pv]");
        const T = { extra: "📚 محاضرة إضافية بمادة ‹المادة› يوم ‹اليوم› الساعة ‹الوقت›.", postpone: "📅 تأجّل ‹امتحان/محاضرة› ‹المادة› من ‹التاريخ› إلى ‹التاريخ›.", congrats: "🎉 تهنئة من رئاسة القسم: ‹النص›.", free: "" };
        const upd = () => (pv.textContent = f.t.value);
        f.onchange = (ev) => { if (ev.target.name === "k") { f.t.value = T[ev.target.value]; upd(); } };
        f.oninput = upd; upd(); f.onsubmit = (ev) => ev.preventDefault();
        return;
      }
      if (k === "voice") return voiceScreen();
      if (k === "report") {
        scr("📄 تقرير القسم الشهري", `<p class="hd-note">صفحة A4 بأرقام مجمّعة بلا أسماء طلاب (أي رقم أقل من 5 ما يطلع).</p>
          <div class="hp-prev"><b>تقرير القسم — ‹الشهر›</b><p class="hint">… الأرقام المجمّعة …</p><p class="hd-own">${esc(OWNER_FOOTER)} · ${esc(me.name)}، ${esc(me.title || "")}</p></div>
          <div class="hd-row"><button class="btn" type="button" data-report-pdf>⬇️ نزّل PDF</button></div>`);
        return;
      }
      if (k === "launch") {
        scr("🚀 إطلاق المنصة رسمياً", `<p class="hd-note">ضغطة وحدة بالعمر. يطلع بصفحة «عن المنصة»: «أطلقها رئيس القسم بتاريخ …».</p>
          <div class="hd-row"><button class="btn" type="button" data-launch>🚀 أطلق المنصة</button></div>`);
      }
    }
    // 💬 58 «صوتك يوصل» (مسودة): الرئيس بس يشغّل. القائمة بلا نص؛ الفتح بس يجيب النص ويكتب 👁️ «انقرت» بالسيرفر.
    async function voiceScreen() {
      vCss();
      // تأكيد داخل الصفحة (AdminAsk من admin.js)، مو نافذة المتصفح
      const ask = (where, text, o) => (window.AdminAsk ? window.AdminAsk(where, text, o) : Promise.resolve(confirm(text)));
      const K = { idea: ["💡", "مقترح"], complaint: ["📝", "شكوى"], opinion: ["💬", "رأي"], thanks: ["🌷", "شكر"] };
      const A = { subject: "المادة", lecture: "المحاضرة", services: "الخدمات", dept: "القسم", platform: "المنصة", other: "غيره" };
      const S = { received: "✓✓ جديدة", opened: "👁️ قريتها", in_progress: "🔄 قيد المتابعة", done: "✔️ تمت", declined: "✔️ ما ممكن" };
      const F = { kind: "", status: "", area: "" };
      scr("💬 صوتك يوصل", '<p class="hint">لحظة…</p>');
      let r = await call({ action: "head_voice_list" });
      if (r.status !== 200) {
        scr("💬 صوتك يوصل", `<p class="hd-note">رسائل الطلاب إلك (مقترح، شكوى، رأي، شكر) — باسمهم أو بدون اسم.</p><p class="hint">ما گدرنا نجيب الرسائل هسه. جرّب بعد شوية.</p>`);
        return;
      }
      const num = (n) => (n == null ? "0" : esc(n));
      const sumBox = (m) => `<div class="vh-sum"><b>📊 هذا الشهر (${esc(m.month || "")})</b><div class="vh-grid">
          <span><b>${num(m.total)}</b><small>الكل</small></span><span><b>${num(m.replied)}</b><small>رديت عليها</small></span>
          ${Object.entries(K).map(([k, [i, t]]) => `<span><b>${num((m.by_kind || {})[k])}</b><small>${i} ${t}</small></span>`).join("")}</div>
          <small class="hint">الأرقام الصغيرة تطلع «أقل من 5» حتى بالتقرير الشهري.</small></div>`;
      const row = (x) => `<li><button type="button" class="vh-it${x.status === "received" ? " new" : ""}" data-vid="${esc(x.id)}">
          <span class="k" aria-hidden="true">${K[x.kind] ? K[x.kind][0] : "💬"}</span>
          <span class="m"><b>${K[x.kind] ? K[x.kind][1] : ""} · ${esc(A[x.area] || "")}${x.area_ref ? " · " + esc(x.area_ref) : ""}</b>
          <small>${esc(x.day)} · ${x.named ? "🙋 باسمه" : "🕶️ بدون اسم"}${x.has_image ? " · 🖼️" : ""}${x.risk ? ' · <em class="vh-risk">⚠️ تنبيه خطر</em>' : ""}${x.late ? ' · <em class="vh-late">🕖 أكثر من 7 أيام</em>' : ""}</small></span>
          <span class="s">${esc(S[x.status] || "")}${x.has_reply ? " · 💬" : ""}</span></button></li>`;
      const list = () => {
        const it = (r.items || []).filter((x) => (!F.kind || x.kind === F.kind) && (!F.status || x.status === F.status) && (!F.area || x.area === F.area));
        return it.length ? `<ul class="vh-list">${it.map(row).join("")}</ul>` : '<p class="hint">ماكو رسائل بهالفلتر.</p>';
      };
      const sel = (n, label, opts) => `<label class="vh-f"><span>${label}</span><select name="${n}"><option value="">الكل</option>${Object.entries(opts).map(([k, v]) => `<option value="${k}" ${F[n] === k ? "selected" : ""}>${Array.isArray(v) ? v.join(" ") : esc(v)}</option>`).join("")}</select></label>`;
      const annText = `📢 فعّل رئيس القسم ${me.name} خدمة «صوتك يوصل»، اكتب مقترحك أو رأيك، وكل رسالة تقراها رئاسة القسم`;
      const main = () => {
        const has = r.voice_on || (r.items || []).length;
        const settings = `<label class="vh-sw" style="display:flex;flex-direction:row;align-items:center"><input type="checkbox" role="switch" data-v="on" ${r.voice_on ? "checked" : ""}><span><b>استقبل رسائل الطلاب</b><small>${r.voice_on ? "✅ مفعّل — الطلاب يشوفون «💬 صوتك يوصل» بصفحتهم." : "مطفي — ولا طالب يشوفها. إنت بس تشغّلها."}</small></span></label>
          ${r.voice_on ? `<div class="hp-prev vh-ann"><small class="hint">📢 إعلان الإطلاق باسمك (يطلع للطلاب — الإرسال مطفي بالمسودة)</small><div class="annbar" data-by="head" style="border-radius:12px">${esc(annText)}</div></div>` : ""}
          <label class="sw vh-rem"><input type="checkbox" data-v="rem" ${r.voice_reminder ? "checked" : ""}> 🔔 تذكير شهري لطيف للطلاب (القناة + البوت) <small class="hint">— مطفي افتراضياً</small></label>`;
        scr("💬 صوتك يوصل", `<div class="vh">
          ${r.voice_pin_notice ? `<p class="vh-stale vh-pin" role="alert">🔐 تم تغيير رقمك من المالك.${r.voice_locked ? " الرسائل مقفولة لحد ما تختار رقمك بنفسك (🔢 رقمي)." : ""} <button type="button" class="btn ghost" data-v="ack">فهمت</button></p>` : ""}
          ${r.stale ? `<p class="vh-stale" role="status">🕖 ${r.stale === 1 ? "عندك رسالة وحدة" : `عندك ${esc(r.stale)} رسائل`} ما انفتحت من أكثر من 7 أيام.</p>` : ""}
          ${has ? `<div class="vh-flt">${sel("kind", "النوع", K)}${sel("status", "الحالة", S)}${sel("area", "عن", A)}</div>
          <div data-vlist>${list()}</div>
          ${sumBox(r.month || {})}
          <details class="vh-said"><summary>⚙️ الإعدادات (التشغيل، الإعلان، التذكير)</summary>${settings}</details>` : `${settings}<p class="hint">لما تشغّلها، تطلع هنا رسائل الطلاب وأرقام الشهر.</p>`}
          <details class="vh-said"><summary>✅ «قلتم فسوّينا» — ملخص عام للفصل</summary><p class="hint">يطلع للطلاب بشاشة «صوتك يوصل». اكتب بالعموم، بلا اقتباس من أي رسالة.</p>
            <form class="hd-fm" data-said novalidate><label class="hd-f"><span>الفصل</span><input name="term" maxlength="40" placeholder="الفصل الأول"></label>
            ${ta("text", "الملخص", 600, "", "مثال: طلبتم ملخص صوتي لكل محاضرة، فصار.")}<div class="hd-row"><button class="btn" type="submit">💾 احفظ</button><span class="tm-msg" role="status" aria-live="polite"></span></div></form></details>
          <p class="hint vh-priv">🔒 «بدون اسم» يوصلك دفعة الصبح وبتاريخ اليوم بس (بلا ساعة) حتى ما ينعرف صاحبها. محمد يشوف الأعداد بس.</p></div>`);
        const q = (x) => root.querySelector(x);
        q('[data-v="on"]').onchange = async (ev) => {
          const on = ev.target.checked;
          if (!on && !(await ask(ev.target.closest("label"), "تطفّي «صوتك يوصل»؟ الطلاب ما يگدرون يرسلون لحد ما تشغّلها، والرسائل الموجودة تبقى.", { danger: true, yes: "نعم، طفّيها" }))) { ev.target.checked = true; return; }
          const rr = await call({ action: "head_voice_toggle", on }); if (rr.status === 200) { r.voice_on = on; me.voice_on = on; } else ev.target.checked = !on; main(); };
        const ack = q('[data-v="ack"]'); if (ack) ack.onclick = async () => { await call({ action: "head_voice_ack" }); r.voice_pin_notice = false; main(); };
        q('[data-v="rem"]').onchange = async (ev) => { const rr = await call({ action: "head_voice_reminder", on: ev.target.checked }); if (rr.status !== 200) ev.target.checked = !ev.target.checked; else r.voice_reminder = ev.target.checked; };
        root.querySelectorAll(".vh-flt select").forEach((x) => (x.onchange = () => { F[x.name] = x.value; q("[data-vlist]").innerHTML = list(); }));
        if (q("[data-vlist]")) q("[data-vlist]").onclick = (ev) => { const b = ev.target.closest("[data-vid]"); if (b) openMsg(b.dataset.vid); };
        const sf = q("[data-said]"); autosize(sf);
        sf.onsubmit = async (ev) => { ev.preventDefault(); const m = sf.querySelector(".tm-msg"); const rr = await call({ action: "head_voice_said", term: sf.term.value, text: sf.text.value }); m.textContent = rr.status === 200 ? "✅ انحفظ، ويطلع للطلاب." : rr.msg || "ما صار."; };
      };
      async function openMsg(id) {
        scr("💬 رسالة", '<p class="hint">لحظة…</p>');
        const m = await call({ action: "head_voice_open", id });   // 👁️ السيرفر يكتب «انقرت» هنا بس
        if (m.status !== 200) { scr("💬 رسالة", `<p class="hint">${esc(m.msg || "ما انفتحت.")}</p>`); return; }
        const x = (r.items || []).find((y) => y.id === id); if (x && x.status === "received") x.status = "opened";
        const back = () => main();
        scr(`${K[m.kind] ? K[m.kind].join(" ") : "💬"} · ${esc(A[m.area] || "")}`, `<div class="vh">
          <p class="hint">${esc(m.day)} · ${m.named ? `🙋 <b>${esc(m.name)}</b>` : "🕶️ بدون اسم"}${m.area_ref ? " · " + esc(m.area_ref) : ""} · <b data-vstate>${esc(S[m.state] || "")}</b></p>
          ${m.risk ? `<div class="vh-riskbox" role="note"><b>⚠️ تنبيه خطر</b>بالرسالة كلمات عن إيذاء النفس أو تهديد.
            <ol><li>اقرأها هسه بهدوء.</li><li>${m.named ? "تواصل ويّا الطالب اليوم عن طريق الإرشاد التربوي/النفسي بالكلية." : "بدون اسم: ما نگدر نوصل لصاحبها — اكتب رد عام هادئ بيه أرقام الدعم."}</li>
            <li>إذا بيها خطر على أحد: بلّغ الجهة المختصة بالكلية.</li></ol><small>عدم ذكر الاسم يحدّ من التدخل. «صوتك يوصل» مو قناة طوارئ.</small></div>` : ""}
          <div class="vh-body">${esc(m.text).replace(/\n/g, "<br>")}</div>
          ${m.image_url ? `<img class="vh-img" src="${esc(m.image_url)}" alt="صورة مرفقة">` : ""}
          ${m.reply ? `<div class="vh-reply"><b>💬 ردك</b>${esc(m.reply)}</div>` : ""}
          <div class="hd-row vh-acts"><button class="btn ghost" type="button" data-s="in_progress">🔄 قيد المتابعة</button><button class="btn ghost" type="button" data-s="done">✔️ تمت</button><button class="btn ghost" type="button" data-s="declined">ما ممكن</button></div>
          <form class="hd-fm" data-reply novalidate>${ta("t", "💬 رد (يشوفه الطالب برقم المتابعة)", 1000, m.reply || "", m.named ? "" : "بدون اسم: الرد يوصل برقم المتابعة بس، والمرسل يبقى مجهول.")}
            <div class="hd-row"><button class="btn" type="submit">💬 أرسل الرد</button><span class="tm-msg" role="status" aria-live="polite"></span></div></form>
          <p><button class="btn ghost vh-arch" type="button" data-arch>🗄️ أرشف (مسيئة)</button> <small class="hint">تختفي من القائمة بلا حذف.</small></p></div>`);
        root.querySelector(".hp-back").onclick = back;
        const f = root.querySelector("[data-reply]"), msg = f.querySelector(".tm-msg"); autosize(f);
        let replied = !!m.reply;
        const setState = (st) => { m.state = st; if (x) x.status = st; root.querySelector("[data-vstate]").textContent = S[st] || ""; };
        root.querySelectorAll("[data-s]").forEach((b) => (b.onclick = async () => {
          if (b.dataset.s === "declined" && !replied) { msg.textContent = "«ما ممكن» يحتاج سبب: اكتب الرد أول وأرسله."; f.t.focus(); return; }
          if (b.dataset.s !== "in_progress" && !(await ask(b.closest(".hd-row"), `تخلّيها «${S[b.dataset.s]}»؟ ما ترجع لورا (إلا إذا الطالب باسمه ضغط «ما انحلّت»).`, { yes: "نعم" }))) return;
          const rr = await call({ action: "head_voice_status", id, status: b.dataset.s });
          msg.textContent = rr.status === 200 ? `✅ صارت «${S[rr.state || b.dataset.s]}».` : rr.msg || "ما صار."; if (rr.status === 200) setState(rr.state || b.dataset.s); }));
        f.onsubmit = async (ev) => { ev.preventDefault(); const rr = await call({ action: "head_voice_reply", id, text: f.t.value }); msg.textContent = rr.status === 200 ? "✅ وصل الرد للطالب." : rr.msg || "ما صار."; if (rr.status === 200) { replied = true; if (x) x.has_reply = true; } };
        root.querySelector("[data-arch]").onclick = async (ev) => { if (!(await ask(ev.target.closest("p"), "تأرشفها؟ تختفي من القائمة (ما تنحذف).", { yes: "نعم، أرشفها" }))) return; const rr = await call({ action: "head_voice_archive", id }); if (rr.status === 200) { r.items = (r.items || []).filter((y) => y.id !== id); back(); } };
      }
      main();
    }
    home();
  }

  function vCss() {
    if (document.getElementById("vh-css")) return;
    const s = document.createElement("style"); s.id = "vh-css";
    s.textContent = `.vh{display:grid;gap:12px}.hp .vh .vh-sw{display:flex;flex-direction:row;align-items:center;gap:12px;min-height:56px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:16px;background:var(--card,#fff);cursor:pointer}
.hp .vh .vh-sw>span{flex:1;min-width:0}.vh-sw input{width:44px;height:26px;flex:none;accent-color:var(--brand,#4B5A8A)}.vh-sw b{display:block;font-family:var(--title-font,inherit)}.vh-sw small{color:var(--muted,#666)}
.vh-rem{min-height:44px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.vh-stale{background:color-mix(in srgb,var(--accent,#c98a1b) 18%,transparent);color:var(--ink,#222);border:1px solid color-mix(in srgb,var(--accent,#c98a1b) 45%,transparent);border-radius:12px;padding:10px 12px;margin:0}
.vh-flt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.vh-f{display:grid;gap:4px;font-size:.86rem}.vh-f select{min-height:44px;border:1px solid var(--line,#ddd);border-radius:12px;background:var(--bg,#fff);color:var(--ink,#222);font:inherit;padding:0 8px;width:100%}
.vh-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}.vh-it{display:flex;align-items:center;gap:10px;width:100%;min-height:60px;padding:10px 12px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--card,#fff);color:var(--ink,#222);font:inherit;text-align:start;cursor:pointer}
.vh-it.new{border-inline-start:4px solid var(--brand,#4B5A8A)}.vh-it .k{font-size:1.4rem}.vh-it .m{flex:1;min-width:0}.vh-it .m b{display:block;font-family:var(--title-font,inherit);overflow-wrap:anywhere}.vh-it small{color:var(--muted,#666)}
.vh-it .s{font-size:.86rem;font-weight:700;color:var(--brand,#4B5A8A);white-space:nowrap}.vh-risk{color:var(--bad,#b3261e);font-style:normal;font-weight:700}.vh-late{color:var(--muted,#666);font-style:normal;font-weight:700}
.vh-sum{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:12px 14px}.vh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.vh-grid span{background:var(--bg,#f6f2ea);border-radius:12px;padding:8px;text-align:center}.vh-grid b{display:block;font-family:var(--title-font,inherit)}.vh-grid small{color:var(--muted,#666);font-size:.8rem}
.vh-said summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:700}.vh-priv{margin:0}
.vh-body{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:14px;padding:14px;line-height:1.9;overflow-wrap:anywhere}.vh-img{max-width:100%;border-radius:12px;border:1px solid var(--line,#ddd)}
.vh-reply{background:var(--brand-soft,#eef);border-radius:12px;padding:12px;line-height:1.8}.vh-reply b{display:block}.vh-acts .btn{min-height:44px}
.vh-riskbox{background:color-mix(in srgb,var(--bad,#b3261e) 12%,transparent);color:var(--ink,#222);border:1px solid var(--bad,#b3261e);border-radius:14px;padding:12px 14px;line-height:1.8}.vh-riskbox b{display:block;font-family:var(--title-font,inherit)}.vh-riskbox ol{margin:6px 0;padding-inline-start:20px}
.vh-ann .annbar{margin-top:6px}@media(max-width:520px){.vh-flt{grid-template-columns:1fr 1fr}.vh-flt .vh-f:last-child{grid-column:1/-1}}`;
    document.head.appendChild(s);
  }

  /** 🔢 «اختر رقمك» — أول دخول برقم مؤقت (72 ساعة). o = {ticket, name, expires, api?}. ماكو جلسة لحد ما يختار. */
  function choosePin(root, o) {
    hdCss(); if (window.StaffDoor && StaffDoor.css) StaffDoor.css();
    const name = String(o.name || "").trim();
    const eye = (id) => `<div class="cp-eye"><input id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="new-password" dir="ltr" maxlength="12" lang="en">
      <button type="button" data-eye="${id}" aria-pressed="false" aria-label="إظهار الرقم">إظهار</button></div>`;
    root.innerHTML = `<div class="sd-card" id="cp">
      <h1>اختر رقماً</h1>
      <p class="sd-sub">أهلاً${name ? ` ${esc(name)}` : ""} 🌿 الرقم اللي استلمته مؤقت${o.expires ? ` (ينتهي ${esc(fmtD(o.expires))})` : " (72 ساعة)"}.<br>اختر رقماً خاصاً بيك — محد يعرفه غيرك.</p>
      <form id="cpf" novalidate>
        <label class="sd-lab" for="cp1">رقمك الجديد (8–12 رقماً)</label>${eye("cp1")}
        <label class="sd-lab" for="cp2">أعده مرة ثانية</label>${eye("cp2")}
        <p class="sd-sub" style="font-size:.85rem">مو تسلسل (12345678) ولا رقم مكرر، ومو نفس الرقم المؤقت. تگدر تغيّره بعدين أي وقت من لوحتك.</p>
        <button class="sd-btn" type="submit">احفظ رقمي وادخل</button></form>
      <p class="sd-msg" id="cpm" role="status" aria-live="polite"></p></div>`;
    root.querySelectorAll("[data-eye]").forEach((b) => (b.onclick = () => {
      const i = root.querySelector("#" + b.dataset.eye), show = i.type === "password";
      i.type = show ? "text" : "password"; b.textContent = show ? "إخفاء" : "إظهار"; b.setAttribute("aria-pressed", String(show));
      b.setAttribute("aria-label", show ? "إخفاء الرقم" : "إظهار الرقم");
    }));
    const $ = (q) => root.querySelector(q), m = $("#cpm");
    $("#cpf").onsubmit = async (ev) => {
      ev.preventDefault();
      const a = digits($("#cp1").value), b = digits($("#cp2").value);
      if (a !== b) return (m.textContent = "الرقمين مو متطابقين.");
      if (!/^\d{8,12}$/.test(a)) return (m.textContent = "الرقم 8–12 رقماً.");
      m.textContent = "لحظة…";
      let r;
      try {
        const res = await fetch(`${C.url}/functions/v1/staff-auth`, { method: "POST", headers: { apikey: C.anon, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "choose_pin", ticket: o.ticket, pin: a }) });
        r = { status: res.status, ...(await res.json().catch(() => ({}))) };
      } catch (e) { r = { status: 0 }; }
      $("#cp1").value = $("#cp2").value = "";
      if (r.status !== 200 || !r.session) return (m.textContent = r.msg || (later(r) ? "⏳ يشتغل بعد تحديث السيرفر." : "ما صار. جرّب مرة ثانية."));
      m.textContent = "✅ انحفظ رقمك.";
      if (o.onSession) return o.onSession(r.session);
    };
    $("#cp1").focus();
  }
  const digits = (s) => String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
  window.AdminDept = { mount, viewer, choosePin, stats };
})();
