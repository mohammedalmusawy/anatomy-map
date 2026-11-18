// 🔒 078 (مسودة 17/11/2026): واجهة «مساحتي بالاسم الثلاثي + رقم سري» — واجهة بس، الحماية كلها بالسيرفر (pin-login + القاعدة).
// window.PinUI = { mountGate(box, {done, back}), mountSettings(el) }
//   mountGate: نافذة الدخول (staffdoor) ← 3 تبويبات: «احفظ مساحتك» · «ادخل» · «نسيت الرقم؟» (رمز استعادة من الإدارة بالواتساب).
//   mountSettings: «صفحتي» ← تحت «أجهزتي»: احفظ مساحتك برقم (إذا ماكو) · غيّر رقمي / امسح رقمي (داخل details).
// ينحمّل بس لما settings.student_pin.on. عربي + ENG (حسب lang وقت الرسم)، أزرار ≥ 44px، aria-live، بلا تمرير أفقي.
// الرقم ما ينحفظ بالمتصفح أبداً (ولا localStorage): الحقول type=password + autocomplete حتى مدير كلمات السر يشتغل، واللصق مسموح.
(function () {
  "use strict";
  if (window.PinUI) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const EN = () => { try { return document.documentElement.lang === "en"; } catch (e) { return false; } };
  const T = (ar, en) => (EN() ? en : ar);
  const A = () => window.Account;
  const clean = (v) => String(v || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[\s-]/g, "");
  const triple = (n) => n.trim().split(/\s+/).filter(Boolean).length >= 3;
  let uid = 0;

  function css() {
    if (document.getElementById("pinx-css")) return;
    const st = document.createElement("style"); st.id = "pinx-css";
    st.textContent = `.pinx{--px-card:var(--card,#fff);--px-ink:var(--ink,#1d1f24);--px-mut:var(--muted,#5a5f6b);--px-line:var(--line,#c4c8d2);--px-bg:var(--bg,#fff);--px-brand:var(--brand,#3F4E80);--px-bi:var(--brand-ink,#fff);--px-bad:var(--bad,#A1261B);--px-ok:var(--ok,#1F6B3A);
display:grid;gap:10px;min-width:0;max-width:100%;box-sizing:border-box;color:var(--px-ink);font:inherit}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pinx{--px-card:var(--card,#252932);--px-ink:var(--ink,#ECE7DD);--px-mut:var(--muted,#B9BDC8);--px-line:var(--line,#4a5060);--px-bg:var(--bg,#1D2027);--px-brand:var(--brand,#A9B6E3);--px-bi:var(--brand-ink,#1D2027);--px-bad:var(--bad,#FFB4A9);--px-ok:var(--ok,#8FD6A5)}}
:root[data-theme=dark] .pinx{--px-card:var(--card,#252932);--px-ink:var(--ink,#ECE7DD);--px-mut:var(--muted,#B9BDC8);--px-line:var(--line,#4a5060);--px-bg:var(--bg,#1D2027);--px-brand:var(--brand,#A9B6E3);--px-bi:var(--brand-ink,#1D2027);--px-bad:var(--bad,#FFB4A9);--px-ok:var(--ok,#8FD6A5)}
.pinx *{box-sizing:border-box;min-width:0}.pinx h2,.pinx h3{margin:0;overflow-wrap:anywhere}.pinx p{margin:0;overflow-wrap:anywhere}
.pinx .px-tabs{display:flex;flex-wrap:wrap;gap:6px}.pinx .px-tabs button{flex:1 1 90px}
.pinx label{display:grid;gap:4px;font-weight:600}
.pinx input{width:100%;min-height:48px;padding:0 12px;border:1px solid var(--px-line);border-radius:12px;background:var(--px-bg);color:var(--px-ink);font:inherit;font-size:1rem}
.pinx input:focus-visible,.pinx button:focus-visible{outline:3px solid var(--px-brand);outline-offset:2px}
.pinx .px-pw{display:flex;gap:6px}.pinx .px-pw input{flex:1 1 auto}
.pinx button{min-height:48px;min-width:48px;padding:0 16px;border-radius:12px;border:1px solid var(--px-brand);background:var(--px-brand);color:var(--px-bi);font:inherit;font-weight:700;cursor:pointer}
.pinx button.ghost,.pinx .px-tabs button[aria-selected=false]{background:transparent;color:var(--px-brand)}
.pinx button[disabled]{opacity:.6;cursor:wait}
.pinx .px-sub{color:var(--px-mut);font-size:.95rem}.pinx .px-msg{min-height:1.4em;font-weight:600}.pinx .px-msg.bad{color:var(--px-bad)}.pinx .px-msg.ok{color:var(--px-ok)}
.pinx details{border:1px solid var(--px-line);border-radius:12px;padding:0 12px}.pinx summary{min-height:48px;display:flex;align-items:center;cursor:pointer;font-weight:700}
.pinx details[open]{padding-bottom:12px}.pinx details>div{display:grid;gap:10px}
.pinx .px-card{background:var(--px-card);border:1px solid var(--px-line);border-radius:14px;padding:12px 14px;display:grid;gap:10px}`;
    document.head.appendChild(st);
  }
  const pw = (id, label, ac) => `<label for="${id}">${label}</label><div class="px-pw"><input id="${id}" data-pin type="password" inputmode="numeric" pattern="[0-9٠-٩]*" maxlength="16" autocomplete="${ac}" dir="ltr" spellcheck="false"><button type="button" class="ghost" data-eye="${id}" aria-pressed="false" aria-label="${T("إظهار الرقم", "Show PIN")}">👁</button></div>`;
  const nameField = (id, ac) => `<label for="${id}">${T("اسمك الثلاثي", "Your full (three-part) name")}</label><input id="${id}" autocomplete="${ac}" maxlength="120" placeholder="${T("مثال: أحمد علي حسين", "e.g. Ahmed Ali Hussein")}">`;
  function eyes(root) {
    root.querySelectorAll("[data-eye]").forEach((b) => b.onclick = () => { const i = root.querySelector("#" + b.dataset.eye); const show = i.type === "password"; i.type = show ? "text" : "password"; b.setAttribute("aria-pressed", String(show)); });
  }
  const sayer = (m) => (t, bad) => { m.className = "px-msg " + (bad ? "bad" : "ok"); m.textContent = t || ""; };
  const forgot = () => `<p class="px-sub">${T("نسيت رقمك السري؟ راسلنا ونعطيك رقم جديد.", "Forgot your PIN? Message us and we will give you a new one.")}</p>`;
  const waitMsg = (r) => r.minutes ? T(` (حوالي ${r.minutes} دقيقة)`, ` (about ${r.minutes} min)`) : "";

  /** نافذة الدخول. o.done(state) بعد الدخول، o.back() رجوع للكود. */
  function mountGate(box, o = {}) {
    css();
    const k = ++uid, tabs = [["save", T("احفظ مساحتك", "Save my space")], ["in", T("ادخل", "Sign in")], ["lost", T("نسيت الرقم؟", "Forgot PIN?")]];
    let tab = o.tab === "save" || o.tab === "lost" ? o.tab : "in";   // 18/11: صفحة الدخول تفتح «احفظ مساحتك» لأول مرة
    const draw = () => {
      box.innerHTML = `<div class="pinx" data-noen><h2 id="sd-gt">${T("🔒 مساحتك برقم سري", "🔒 Your space with a PIN")}</h2>
        <div class="px-tabs" role="tablist">${tabs.map(([id, t]) => `<button type="button" role="tab" id="px${k}-t-${id}" aria-selected="${tab === id}" aria-controls="px${k}-p">${esc(t)}</button>`).join("")}</div>
        <form id="px${k}-p" role="tabpanel" novalidate class="pinx">${body()}</form>
        <p class="px-msg" id="px${k}-m" role="status" aria-live="polite"></p>
        ${o.back ? `<button type="button" class="ghost" id="px${k}-back">${T("‹ رجوع", "‹ Back")}</button>` : ""}</div>`;
      tabs.forEach(([id]) => box.querySelector(`#px${k}-t-${id}`).onclick = () => { tab = id; draw(); box.querySelector(`#px${k}-t-${id}`).focus(); });
      if (o.back) box.querySelector(`#px${k}-back`).onclick = () => o.back();
      eyes(box);
      const f = box.querySelector(`#px${k}-p`), say = sayer(box.querySelector(`#px${k}-m`));
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        const v = (n) => (f.querySelector(`#px${k}-${n}`) || {}).value || "";
        const name = v("n").trim().replace(/\s+/g, " "), p1 = clean(v("p1")), p2 = clean(v("p2"));
        if (!triple(name)) return say(T("اكتب اسمك الثلاثي كامل.", "Write your full (three-part) name."), true);
        if (!/^\d{8,12}$/.test(p1)) return say(T("الرقم السري 8 إلى 12 رقم.", "The PIN is 8 to 12 digits."), true);
        if (tab !== "in" && p1 !== p2) return say(T("الرقمين مو متطابقين.", "The two PINs do not match."), true);
        if (tab === "lost" && !v("c").trim()) return say(T("اكتب رمز الاستعادة اللي وصلك من الإدارة.", "Enter the recovery code from the admins."), true);
        const b = f.querySelector("button[type=submit]"); b.disabled = true; say(T("لحظة…", "One moment…"));
        let r;
        try { r = tab === "save" ? await A().pinCreate(name, p1, p2) : tab === "in" ? await A().pinLogin(name, p1) : await A().pinRecover(name, v("c"), p1, p2); }
        catch (e) { r = { ok: false, msg: T("ماكو اتصال. جرّب مرة ثانية.", "No connection. Try again.") }; }
        b.disabled = false;
        f.querySelectorAll("input[data-pin]").forEach((i) => { i.value = ""; i.type = "password"; });   // الرقم ما يبقى بالصفحة (حتى لو انضغط 👁)
        f.querySelectorAll("[data-eye]").forEach((x) => x.setAttribute("aria-pressed", "false"));
        if (!r.ok) return say((r.msg || "") + (r.error === "wait" ? waitMsg(r) : ""), true);
        say(r.recovered ? T("✅ تغيّر رقمك، وطلعت كل الأجهزة الثانية.", "✅ PIN changed; all other devices were signed out.") : r.created ? T("✅ انحفظت مساحتك.", "✅ Your space is saved.") : T("✅ أهلاً بيك.", "✅ Welcome back."));
        if (o.done) setTimeout(() => o.done(A().state), 600);
      };
      const first = f.querySelector("input"); if (first) first.focus();
    };
    const body = () => {
      if (tab === "save") return `<p class="px-sub">${T("اختار رقم سري (8 أرقام أو أكثر) حتى ترجع لمساحتك (تقدّمك وأخطاءك وملاحظاتك) من أي جهاز. بلا أكواد.", "Choose a PIN (8+ digits) to get back to your space (progress, mistakes, notes) from any device. No codes.")}</p>
        ${nameField(`px${k}-n`, "username")}${pw(`px${k}-p1`, T("رقمك السري", "Your PIN"), "new-password")}${pw(`px${k}-p2`, T("اكتب الرقم مرة ثانية", "Type the PIN again"), "new-password")}
        <button type="submit">${T("احفظ مساحتي", "Save my space")}</button><p class="px-sub">${T("لا تنطيه لأحد: يفتح ملاحظاتك الخاصة.", "Do not share it: it opens your private notes.")}</p>${forgot()}`;
      if (tab === "in") return `${nameField(`px${k}-n`, "username")}${pw(`px${k}-p1`, T("رقمك السري", "Your PIN"), "current-password")}<button type="submit">${T("ادخل", "Sign in")}</button>${forgot()}`;
      return `<p class="px-sub">${T("تواصل ويّا الإدارة بالواتساب، تنطيك «رمز استعادة» باسمك يشتغل 24 ساعة ومرة وحدة. اكتبه هنا ويّا رقم جديد. كل الأجهزة الثانية تطلع.", "Message the admins on WhatsApp; they give you a one-time recovery code for your name, valid 24 hours. Enter it with a new PIN. All other devices are signed out.")}</p>
        ${nameField(`px${k}-n`, "username")}<label for="px${k}-c">${T("رمز الاستعادة", "Recovery code")}</label><input id="px${k}-c" dir="ltr" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" maxlength="16" placeholder="XXXXX-XXXXX">
        ${pw(`px${k}-p1`, T("رقمك السري الجديد", "New PIN"), "new-password")}${pw(`px${k}-p2`, T("اكتب الرقم مرة ثانية", "Type the PIN again"), "new-password")}
        <button type="submit">${T("غيّر الرقم وادخل", "Change PIN and sign in")}</button>`;
    };
    draw();
  }

  /** «صفحتي»: حالة الرقم + الحفظ/التغيير/المسح. */
  async function mountSettings(el) {
    css();
    if (!A() || !A().state.session) { el.hidden = true; return; }
    const k = ++uid;
    el.innerHTML = `<div class="pinx" data-noen><p class="px-sub" role="status">${T("لحظة…", "One moment…")}</p></div>`;
    const i = await A().pinInfo();
    if (!i.ok) { el.hidden = true; return; }
    el.hidden = false;
    const card = (inner) => { el.innerHTML = `<div class="pinx" data-noen><div class="px-card">${inner}<p class="px-msg" id="px${k}-m" role="status" aria-live="polite"></p></div></div>`; eyes(el); return sayer(el.querySelector(`#px${k}-m`)); };
    if (!i.has) {
      if (!i.can) {
        card(`<h3>${T("🔒 احفظ مساحتك برقم سري", "🔒 Save your space with a PIN")}</h3><p class="px-sub">${i.why === "ambiguous" ? T("اسمك مكرر بقائمة القسم؛ الإدارة لازم تثبّته أول.", "Your name appears more than once in the list; the admins must confirm it first.") : T("اسمك مو مربوط بقائمة القسم. راسل الإدارة.", "Your name is not linked to the department list. Contact the admins.")}</p>`);
        return;
      }
      const say = card(`<h3>${T("🔒 احفظ مساحتك برقم سري", "🔒 Save your space with a PIN")}</h3><p class="px-sub">${T("حتى ترجعلها من أي جهاز باسمك الثلاثي ورقمك.", "So you can return from any device with your full name and PIN.")}</p>
        <form id="px${k}-f" class="pinx" novalidate>${pw(`px${k}-p1`, T("رقمك السري (8 أرقام أو أكثر)", "Your PIN (8+ digits)"), "new-password")}${pw(`px${k}-p2`, T("اكتب الرقم مرة ثانية", "Type the PIN again"), "new-password")}
        <button type="submit">${T("احفظ", "Save")}</button><p class="px-sub">${T("لا تنطيه لأحد: يفتح ملاحظاتك الخاصة.", "Do not share it: it opens your private notes.")}</p></form>`);
      wire(el.querySelector(`#px${k}-f`), say, (f) => A().pinSet(clean(f.p1), clean(f.p2)), T("✅ انحفظ رقمك. هسه تگدر تدخل من أي جهاز.", "✅ PIN saved. You can now sign in from any device."), true);
      return;
    }
    const say = card(`<h3>${i.disabled ? T("⚠️ رقمك السري منطفي (محاولات غلط كثيرة). راسل الإدارة لرمز استعادة.", "⚠️ Your PIN is disabled (too many wrong attempts). Ask the admins for a recovery code.") : T("🔒 مساحتك محفوظة برقم سري ✅", "🔒 Your space is saved with a PIN ✅")}</h3>
      <details><summary>${T("غيّر رقمي السري", "Change my PIN")}</summary><div><form id="px${k}-c" class="pinx" novalidate>${pw(`px${k}-cur`, T("رقمك الحالي", "Current PIN"), "current-password")}${pw(`px${k}-p1`, T("الرقم الجديد", "New PIN"), "new-password")}${pw(`px${k}-p2`, T("الجديد مرة ثانية", "New PIN again"), "new-password")}
        <button type="submit">${T("غيّر (وطلّع الأجهزة الثانية)", "Change (signs out other devices)")}</button></form></div></details>
      <details><summary>${T("امسح رقمي السري", "Remove my PIN")}</summary><div><form id="px${k}-x" class="pinx" novalidate><p class="px-sub">${T("بعدها ما تگدر تدخل بالاسم والرقم من جهاز جديد. بياناتك تبقى.", "You will no longer be able to sign in by name and PIN on a new device. Your data stays.")}</p>
        ${pw(`px${k}-cur2`, T("رقمك الحالي", "Current PIN"), "current-password")}<button type="submit" class="ghost">${T("امسح الرقم", "Remove PIN")}</button></form></div></details>`);
    wire(el.querySelector(`#px${k}-c`), say, (f) => A().pinSet(clean(f.p1), clean(f.p2), clean(f.cur)), T("✅ تغيّر رقمك، وطلعت الأجهزة الثانية.", "✅ PIN changed; other devices were signed out."), true);
    wire(el.querySelector(`#px${k}-x`), say, (f) => A().pinClear(clean(f.cur2)), T("✅ انمسح رقمك السري.", "✅ PIN removed."), false, () => mountSettings(el));
  }
  function wire(form, say, run, okMsg, check2, after) {
    const k = form.id.replace(/-[a-z]$/, "");
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const g = (n) => (form.querySelector(`#${k}-${n}`) || {}).value || "";
      const f = { p1: g("p1"), p2: g("p2"), cur: g("cur"), cur2: g("cur2") };
      if (check2) {
        if (!/^\d{8,12}$/.test(clean(f.p1))) return say(T("الرقم السري 8 إلى 12 رقم.", "The PIN is 8 to 12 digits."), true);
        if (clean(f.p1) !== clean(f.p2)) return say(T("الرقمين مو متطابقين.", "The two PINs do not match."), true);
      }
      const b = form.querySelector("button[type=submit]"); b.disabled = true; say(T("لحظة…", "One moment…"));
      const r = await run(f).catch(() => ({ ok: false, msg: T("ماكو اتصال.", "No connection.") }));
      b.disabled = false; form.querySelectorAll("input").forEach((i) => { i.value = ""; });
      if (!r.ok) return say((r.msg || "") + (r.error === "wait" ? waitMsg(r) : ""), true);
      say(okMsg); if (after) setTimeout(after, 1200);
    };
  }
  window.PinUI = { mountGate, mountSettings };
})();
