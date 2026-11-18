// 🔒 078 (مسودة 17/11/2026): «الأرقام السرية» بلوحة الإدارة (المالك) — واجهة بس، كل الصلاحيات بالسيرفر (pin-login admin_* + is_admin + الدوال).
// window.AdminPins = { mount(box, call) }   call(body) → {status, ...} (fetch لـ pin-login بجلسة المالك)
//   • عدّاد واضح (بدل تلگرام): طلبات الأسماء المعلّقة، الأرقام المنطفية، المقفول هسه، رموز الاستعادة الفعّالة، كم طالب عنده رقم.
//   • ابحث بالاسم الثلاثي ← لكل صف: «رمز استعادة» (يطلع مرة وحدة، 24 ساعة، تنطيه للطالب بالواتساب) · «امسح الرقم» · «سجل الحجز» · «نقل الحجز للطالب الحقيقي».
// ماكو رقم ولا هاش يبين هنا أبداً. الرمز يبين مرة وحدة بس وقت التوليد (ما ينحفظ بأي مكان).
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const int0 = (v) => (typeof v === "number" && isFinite(v) ? Math.trunc(v) : 0);
  const STAGES = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];
  const when = (t) => { try { return new Date(t).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", dateStyle: "short", timeStyle: "short" }); } catch (e) { return String(t).slice(0, 16); } };
  const ACT = { "pin.claim": "حجز الاسم", "pin.change": "غيّر رقمه", "pin.clear": "الإدارة مسحت الرقم", "pin.clear_self": "مسح رقمه بنفسه", "pin.recovery_issue": "رمز استعادة انطلع", "pin.recovery_use": "استعمل رمز الاستعادة", "pin.reassign": "الإدارة نقلت الحجز" };

  async function mount(box, call) {
    box.innerHTML = '<div class="nm75"><p class="hint" role="status">لحظة…</p></div>';
    const root = box.firstElementChild;
    const s = await call({ action: "admin_summary" });
    if (s.status !== 200) { root.innerHTML = `<p class="hint">${s.status === 403 ? "هذا للمالك بس." : "ما گدرت أجيب الأرقام (الدالة pin-login لسا ما منشورة؟)."}</p>`; return; }
    root.innerHTML = `<p class="hint">${s.on ? "🟢 «احفظ مساحتك برقم سري» شغّال بالموقع." : "⚪ مطفي بالموقع (settings.student_pin.on). اللوحة تشتغل للتجهيز."}</p>
      <div class="kp" aria-label="عدّاد الأرقام السرية">
        <div><b>${int0(s.name_requests)}</b>طلبات أسماء تنتظر</div><div><b>${int0(s.disabled)}</b>رقم منطفي</div>
        <div><b>${int0(s.locked)}</b>مقفول هسه</div><div><b>${int0(s.recovery_active)}</b>رمز استعادة فعّال</div><div><b>${int0(s.with_pin)}</b>طالب عنده رقم</div></div>
      <form class="q" id="ap-f" novalidate><label for="ap-n"><b>ابحث بالاسم الثلاثي</b></label>
        <input id="ap-n" autocomplete="off" maxlength="120" placeholder="مثال: أحمد علي حسين" style="min-height:48px;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit">
        <div class="row"><button class="btn" type="submit">ابحث</button></div>
        <small>الكتابة تتوحّد (همزات، ة/ه، ى/ي، مسافات، «عبد ال…»). تحقق من الطالب (بالواتساب أو بالوجه) قبل أي رمز.</small></form>
      <div id="ap-r"></div><p class="hint" id="ap-m" role="status" aria-live="polite"></p>`;
    const $ = (q) => root.querySelector(q), say = (t) => { $("#ap-m").textContent = t || ""; };
    let rows = [];
    const draw = () => {
      $("#ap-r").innerHTML = rows.length ? rows.map((r, i) => `<div class="q" data-i="${i}"><h4>«${esc(r.name)}»</h4>
        <small>المرحلة ${esc(STAGES[r.stage] || r.stage)} · ${r.student_id ? (r.has_pin ? (r.disabled ? "⚠️ رقمه منطفي" : "🔒 عنده رقم سري") : "عنده حساب بلا رقم") : "ما عنده حساب بعد"}${r.recovery ? " · رمز استعادة فعّال" : ""}${r.open ? " · حساب بالاسم (مو بالقائمة)" : ""}</small>
        ${r.dup > 1 ? `<p class="warn">⚠️ الاسم مكرر بالقائمة (${int0(r.dup)}) — ما ينحجز تلقائياً. تأكد من الطالب.</p>` : ""}
        ${r.pin_other ? `<p class="warn">⚠️ الاسم محجوز برقم لحساب ثاني — احتمال انتحال. شوف «سجل الحجز».</p>` : ""}
        <div class="row">
          ${r.student_id ? `<button class="btn" type="button" data-a="rec">🔑 رمز استعادة</button>` : ""}
          ${r.has_pin ? `<button class="btn ghost" type="button" data-a="clear">امسح الرقم</button>` : ""}
          ${r.roster_id ? `<button class="btn ghost" type="button" data-a="hist">سجل الحجز</button>` : ""}
          ${r.roster_id && r.student_id && r.dup <= 1 ? `<button class="btn ghost" type="button" data-a="move">نقل الحجز للطالب الحقيقي</button>` : ""}
        </div><div data-out></div></div>`).join("") : '<p class="hint">ما لگيت هالاسم (لا بالقائمة ولا بحسابات الرقم السري).</p>';
    };
    $("#ap-f").onsubmit = async (ev) => {
      ev.preventDefault(); const n = $("#ap-n").value.trim();
      if (n.split(/\s+/).length < 3) return say("اكتب الاسم الثلاثي.");
      say("لحظة…"); const r = await call({ action: "admin_find", name: n });
      if (r.status !== 200) return say("صار خطأ.");
      rows = Array.isArray(r.rows) ? r.rows : []; say(""); draw();
    };
    $("#ap-r").addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const card = b.closest("[data-i]"), r = rows[+card.dataset.i], out = card.querySelector("[data-out]");
      const show = (code, extra) => { out.innerHTML = `<p><b>رمز الاستعادة (يبين هسه بس):</b></p><p dir="ltr" style="font-size:1.5rem;font-weight:800;letter-spacing:.08em;overflow-wrap:anywhere">${esc(code)}</p>
        <small>ينطي للطالب «${esc(r.name)}» بالواتساب. يشتغل مرة وحدة، 24 ساعة. ${esc(extra || "")}</small><div class="row"><button class="btn ghost" type="button" data-cp>نسخ</button></div>`;
        out.querySelector("[data-cp]").onclick = async (e) => { try { await navigator.clipboard.writeText(code); e.currentTarget.textContent = "✔️ اننسخ"; } catch (er) { /* */ } }; };
      if (b.dataset.a === "hist") {
        const h = await call({ action: "admin_history", roster_id: r.roster_id });
        out.innerHTML = h.status === 200 && h.rows && h.rows.length ? `<ul>${h.rows.map((x) => `<li class="l"><span>${esc(ACT[x.action] || x.action)}${x.dev ? ` · جهاز ${esc(x.dev)}` : ""}${x.via === "session" ? " · من حسابه" : ""}</span><small>${esc(when(x.at))}</small></li>`).join("")}</ul>` : '<p class="hint">ماكو سجل.</p>';
        return;
      }
      if (b.dataset.a === "rec") {
        if (!confirm(`تطلّع رمز استعادة لـ «${r.name}»؟ تأكدت إنه هو؟ (أي رمز قديم يبطل)`)) return;
        b.disabled = true; const x = await call({ action: "admin_recovery", student_id: r.student_id }); b.disabled = false;
        if (x.status !== 200 || !x.code) { out.textContent = "ما صار: " + (x.error || "خطأ"); return; }
        show(x.code); return;
      }
      if (b.dataset.a === "clear") {
        if (!confirm(`تمسح الرقم السري مال «${r.name}»؟ بياناته تبقى، وهو يحط رقم جديد برمز استعادة أو من جلسته.`)) return;
        const x = await call({ action: "admin_clear", student_id: r.student_id });
        out.textContent = x.status === 200 && x.cleared ? "✅ انمسح." : "ما صار."; return;
      }
      if (b.dataset.a === "move") {
        if (!confirm(`نقل حجز «${r.name}» للطالب الحقيقي؟\n• رقم الحاجز الحالي ينلغي وكل أجهزته تطلع.\n• مساحته تنحفظ أرشيف (مو حذف) بانتظار قرارك.\n• الطالب الحقيقي يبدأ برمز استعادة يطلع هسه.\nتحققت من الطالب الحقيقي؟`)) return;
        b.disabled = true; const x = await call({ action: "admin_reassign", roster_id: r.roster_id }); b.disabled = false;
        if (x.status !== 200 || !x.code) { out.textContent = "ما صار: " + (x.error || "خطأ"); return; }
        show(x.code, `انحفظت المساحة القديمة بالأرشيف (#${int0(x.archive)})، وطلعت ${int0(x.devices)} أجهزة.`);
      }
    });
  }
  window.AdminPins = { mount };
})();
