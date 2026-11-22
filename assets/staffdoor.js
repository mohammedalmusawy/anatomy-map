// 🚪 الباب المخفي + بوابة الطلاب (29/10/2026، طلب محمد) — ينحمّل بكل صفحات الموقع (site.py page()) والمعاينة (preview.py foot()).
//  1) الباب: 5 ضغطات على شعار الموقع (العنوان «دروس تقنيات الأشعة» / «قسم تقنيات الأشعة» بالمعاينة) خلال 3 ثواني ← شاشة «دخول الإدارة» (/admin/).
//     ماكو زر ولا رابط ظاهر. الباب واجهة بس؛ الحماية كلها بالسيرفر (staff-auth: الرقم السري + قفل 5 محاولات + تنبيه بالبوت بكل دخول).
//  2) «👁️ شوف كطالب»: من لوحة الفريق ← الموقع ينفتح مثل الطالب، ويّا زر صغير «⚙️ رجوع للإدارة».
//  3) البوابة: مطفية لحد settings.gate.on = true. لما تنفتح: المحاضرات والاختبارات ومصطلحات المحاضرات و«مساحتي» والامتحانات لطلابنا بالكود؛
//     الأطلس والملوّنة والأجهزة والمصطلحات العامة مفتوحة. ⚠️ هذي بوابة بالمتصفح: تمنع التصفح العادي بس — ملفات GitHub Pages
//     (PDF، JSON) تبقى تنفتح لأي أحد يعرف رابطها. اللي محمي فعلاً بالسيرفر: المساعد الكامل، وبيانات الطالب (RLS)، ولوحات الفريق.
//  🗑️ 70 (مسودة): «طلب الكود من البوت» انشال. النافذة: «هذي المحاضرة لطلاب القسم 🎓 اكتب كودك» + «نسيت الكود؟ راسل المشرف»
//     (رابط محادثة تليغرام من إعدادات.json ← smart.py يبدّل __SUPPORT_TG__ وقت النسخ؛ فارغ ← الزر ما يطلع).
(function () {
  "use strict";
  if (window.StaffDoor) return;
  const me = document.currentScript;
  const ROOT = me && me.src ? me.src.replace(/assets\/staffdoor(?:\.min)?\.js(?:\?.*)?$/, "") : location.origin + "/";
  const C = window.STUDY_CLOUD || {};
  const REF = (() => { try { return new URL(C.url).hostname.split(".")[0]; } catch (e) { return "spjkntrwxfyydniklfxh"; } })();
  const cfgLink = (v) => (/^https:\/\/t\.me\/[A-Za-z0-9_]{3,64}\/?$/.test(v) ? v : "");   // تليغرام بس (مو رقم ولا رابط ثاني)
  const SUPPORT = cfgLink("__SUPPORT_TG__");
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } },
    json(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ── الشكل الموحّد: نفس بطاقة دخول الطلاب (تستعملها شاشة «دخول الإدارة» ونافذة البوابة) ──
  function css() {
    if (document.getElementById("sd-css")) return;
    const st = document.createElement("style"); st.id = "sd-css";
    st.textContent = `
.sd-card .sd-sh{margin:6px 0 0;font-size:1rem}.sd-card .sd-row{display:flex;gap:8px;flex-wrap:wrap}.sd-card .sd-row .sd-btn{flex:1 1 120px}
.sd-card{max-width:440px;margin:12px auto;background:var(--card,#fff);color:var(--ink,#222);border:1px solid var(--line,#ddd);border-radius:22px;padding:20px;display:grid;gap:12px;box-sizing:border-box}
.sd-card h1,.sd-card h2{margin:0;font-size:1.35rem;line-height:1.4}.sd-sub{margin:0;color:var(--muted,#666);font-size:.95rem}
.sd-card form{display:grid;gap:8px;margin:0}.sd-card [hidden],.sd-dlg [hidden]{display:none!important}.sd-lab{font-weight:700;font-size:.92rem;color:var(--muted,#666)}
.sd-card input{width:100%;box-sizing:border-box;min-height:48px;font-size:16px;border:1px solid var(--line,#ccc);border-radius:14px;padding:8px 14px;background:var(--card,#fff);color:var(--ink,#222)}
.sd-card input:focus-visible,.sd-btn:focus-visible,.sd-link:focus-visible{outline:3px solid var(--brand,#3B4A8C);outline-offset:2px}
.sd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 20px;border-radius:14px;width:100%;box-sizing:border-box;
  background:var(--brand,#3B4A8C);color:var(--brand-ink,#fff);font:inherit;font-weight:700;border:0;cursor:pointer;text-decoration:none}
.sd-btn.ghost{background:transparent;color:var(--brand,#3B4A8C);border:1px solid var(--line,#ccc)}.sd-btn[disabled]{opacity:.6;cursor:wait}
.sd-msg{min-height:1.4em;margin:0;font-size:.95rem}.sd-msg.bad{color:#B3261E;font-weight:700}.sd-msg.ok{color:var(--muted,#666)}
.sd-links{margin:0;font-size:.9rem;display:flex;flex-wrap:wrap;gap:4px 12px}
.sd-link{background:none;border:0;padding:6px 0;min-height:44px;color:var(--brand,#3B4A8C);font:inherit;text-decoration:underline;cursor:pointer}
.sd-codebox{direction:ltr;unicode-bidi:embed;text-align:center;font-family:ui-monospace,Menlo,monospace;font-size:1.5rem;font-weight:700;letter-spacing:.06em;padding:14px 10px;border:2px dashed var(--brand,#3B4A8C);border-radius:14px;user-select:all;overflow-wrap:anywhere}
.sd-free{font-size:.85rem;color:var(--muted,#666);margin:0}
.sd-dlg{position:fixed;inset:0;z-index:2147483000;background:rgba(20,24,34,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;overflow:auto}
.sd-dlg .sd-card{margin:0;width:100%;max-height:calc(100vh - 32px);overflow:auto;margin-bottom:env(safe-area-inset-bottom)}
@media (min-width:700px){.sd-dlg{align-items:center}}
body.sd-locked .wrap,body.sd-locked main{visibility:hidden}
.sd-pill{position:fixed;inset-inline-start:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147482000;display:inline-flex;gap:6px;align-items:center;
  min-height:44px;padding:0 16px;border-radius:999px;background:var(--ink,#222);color:var(--card,#fff);font:inherit;font-weight:700;font-size:15px;border:0;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer;text-decoration:none}
.sd-pv{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:center;padding:4px 12px;padding-top:calc(4px + env(safe-area-inset-top));background:var(--ink,#222);color:var(--card,#fff);font:inherit;font-size:14px;line-height:1.4;position:relative;z-index:2147483100}
/* (69) الشريط بالتدفق (ما يغطي المحتوى) بس فوق خلفية نافذة الكود/البوابة حتى «ارجع» و«شوف كـ…» يبقون ينضغطون */
body:has(.sd-pv) .sd-dlg,body:has(.sd-pv) .gatedlg{padding-top:calc(76px + env(safe-area-inset-top))}
.sd-pv button{min-height:44px;padding:0 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}

@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .sd-msg.bad{color:#FF8A80}}:root[data-theme=dark] .sd-msg.bad{color:#FF8A80}`;
    document.head.appendChild(st);
  }

  // ── 1) الباب المخفي ──
  // 🎓 (10/11/2026، فرع logo-door): الباب ينضاف للوجو الموقع (data-staffdoor) ويّا العنوان. باب واحد بس (5 ضغطات) لكل الطاقم؛
  //   الرقم السري هو اللي يحدد منو (محمد / رئيس القسم / المساعد) والصلاحية بالسيرفر (staff-auth pin_login) — ماكو باب ثاني بـ 3 ضغطات.
  //   pointerup بدل click: Safari الآيفون ما يوصّل click من عنصر مو قابل للضغط (عنوان/صورة) للـ document، فالباب كان ممكن ما ينفتح باللمس.
  //   الضغطة تنحسب بس إذا: إصبع/ماوس واحد، بلا سحب (≤ 12px، يعني مو تمرير)، وبلا ضغط طويل (< 600ms)، وبالزر الأساسي.
  const LOGO = "[data-staffdoor], .hero h1, header.idn h1";
  let taps = [], down = null;
  // (10/11) ستايل الباب لحاله ودائماً: قبل كان داخل css() اللي ما تنحمّل إلا ويّا النوافذ، فالضغط السريع على الموبايل يكبّر الصفحة أو يحدد النص.
  const DOOR_CSS = ".sd-door{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}.sd-door img,img.sd-door{-webkit-user-drag:none}";
  const mark = () => {
    if (!document.getElementById("sd-door-css")) { const st = document.createElement("style"); st.id = "sd-door-css"; st.textContent = DOOR_CSS; document.head.appendChild(st); }
    document.querySelectorAll(LOGO).forEach((el) => el.classList.add("sd-door"));
  };
  const onLogo = (ev) => ev.target && ev.target.closest && ev.target.closest(LOGO);
  document.addEventListener("pointerdown", (ev) => {
    down = ev.isPrimary && ev.button === 0 && onLogo(ev) ? { x: ev.clientX, y: ev.clientY, t: Date.now(), id: ev.pointerId } : null;
  }, { passive: true });
  document.addEventListener("pointercancel", () => { down = null; }, { passive: true });
  document.addEventListener("pointerup", (ev) => {
    const d = down; down = null;
    if (!d || ev.pointerId !== d.id || !onLogo(ev)) return;
    const t = Date.now();
    if (t - d.t > 600 || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 12) { taps = []; return; }
    taps = taps.filter((x) => t - x < 3000); taps.push(t);
    if (taps.length >= 5) { taps = []; location.href = ROOT + "admin/"; }
  }, { passive: true });
  // ضغط سريع بالماوس على العنوان/اللوجو ما يحدد النص (user-select بالـ CSS يغطي اللمس، وهذا يغطي النقر المزدوج/الثلاثي)
  document.addEventListener("mousedown", (ev) => { if (ev.detail > 1 && onLogo(ev)) ev.preventDefault(); });

  // ── الجلسات (للعرض بس؛ الصلاحية الحقيقية بالسيرفر) ──
  const alive = (s) => !!(s && (s.refresh_token || (s.expires_at && s.expires_at * 1000 > Date.now())) && s.user);
  function staffSession() {
    // 🔢 29/10: بلا «تذكّر هذا الجهاز» الجلسة بـ sessionStorage (admin.js)
    let s = LS.json(`sb-${REF}-auth-token`);
    if (!alive(s)) { try { s = JSON.parse(sessionStorage.getItem(`sb-${REF}-auth-token`) || "null"); } catch (e) { s = null; } }
    if (!alive(s)) return null;
    const role = ((s.user || {}).app_metadata || {}).role || "";
    return role === "student" ? null : s;          // المالك أو مساعد أو رئيس القسم
  }
  function studentSession() {
    const s = LS.json("t:acct-session");
    return alive(s) && ((s.user || {}).app_metadata || {}).role === "student" ? s : null;
  }

  // ── 2) «👁️ شوف كطالب» / «⚙️ رجوع للإدارة» ──
  // (69) «👁️ شوف الموقع كـ: طالب / زائر» — القيمة student أو visitor ("1" القديمة = طالب). للطاقم بس، وما يتغيّر شي للناس.
  const VIEW = "t:staff-view";
  function asView(k) { LS.set(VIEW, k === "visitor" ? "visitor" : "student"); location.href = ROOT + "lessons/"; }
  function asStudent() { asView("student"); }
  function backToAdmin() { LS.del(VIEW); location.href = ROOT + "admin/"; }
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest) return;
    if (ev.target.closest("[data-as-student]")) { ev.preventDefault(); asStudent(); }
    const as = ev.target.closest("[data-as]"); if (as) { ev.preventDefault(); asView(as.dataset.as); }
    if (ev.target.closest("[data-back-admin]")) { ev.preventDefault(); backToAdmin(); }
  });
  const inAdmin = /\/admin\/(?:index\.html)?$/.test(location.pathname);
  if (inAdmin) LS.del(VIEW);
  const vraw = LS.get(VIEW), vkind = vraw === "visitor" ? "visitor" : vraw ? "student" : null;
  const staffView = !inAdmin && !!vkind && !!staffSession();
  if (vkind && !staffSession()) LS.del(VIEW);
  // شريط «وضع المعاينة» صغير بأعلى الصفحة (مو عائم، فما يغطي المحتوى)
  function pill() {
    if (!staffView || document.querySelector(".sd-pv")) return;
    css();
    const other = vkind === "visitor" ? "student" : "visitor";
    document.body.insertAdjacentHTML("afterbegin", `<div class="sd-pv" role="status"><span>👁️ وضع المعاينة: <b>${vkind === "visitor" ? "زائر" : "طالب"}</b></span>` +
      `<button type="button" data-as="${other}">شوف كـ${other === "visitor" ? "زائر" : "طالب"}</button><button type="button" data-back-admin>ارجع ←</button></div>`);
  }

  // ── 3) بوابة الطلاب ──
  const rel = (() => { try { return decodeURIComponent(location.pathname).slice(decodeURIComponent(new URL(ROOT).pathname).length); } catch (e) { return ""; } })();
  const skip = inAdmin || /^(preview|tg|audio-check|telegram)\//.test(rel);
  // 🎓 70 (قرار محمد 1/11): نطاق البوابة لما يشغّلها محمد (هسه مطفية، وما يتغير شي للناس):
  //   مقفول على الزائر: learn/ (المحاضرات والـ PDF بصفحاتها) · quiz/ (اختبارات المحاضرات + quiz/mistakes) · terms/<محاضرة> · exams/ · me/
  //   مفتوح: atlas/ · devices/ · contrast/ · terms/ (القاموس) واختباراتها داخل صفحاتها، وكل شي ثاني.
  //   tg/listen (Mini App «اسمع المحاضرة») معفي مثل قبل (skip فوق). ماكو مفتاح «محاضرات بس» منفصل.
  const CLOSED = ["learn/", "quiz/", "exams/", "me/", "terms/*"];   // * = صفحة داخلها (مصطلحات محاضرة)؛ terms/ نفسها مفتوحة
  const norm = (p) => p.replace(/index\.html$/, "");
  function match(p, list) {
    p = norm(p);
    return list.some((o) => o.endsWith("$") ? p === o.slice(0, -1) : o.endsWith("*") ? p.startsWith(o.slice(0, -1)) && p.length > o.length - 1 : p.startsWith(o));
  }
  const gated = (p, g) => !match(p, g.open || ["devices/", "atlas/", "contrast/", "terms/$"]) && match(p, g.closed || CLOSED);
  const allowed = () => staffView ? vkind === "student" : !!studentSession() || !!staffSession();

  let G = null;
  function dialog(next, o) {
    o = o || {};
    css();
    document.querySelectorAll(".sd-dlg").forEach((d) => d.remove());
    const direct = !next;
    const d = document.createElement("div");
    d.className = "sd-dlg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "sd-gt");
    d.innerHTML = `<div class="sd-card">
      <h2 id="sd-gt">${o.title || "هذي المحاضرة لطلاب القسم 🎓 اكتب كودك"}</h2>
      <p class="sd-sub">${o.sub || "مرة وحدة بس، وبعدها الموقع يتذكّرك ويرجّعك لنفس المكان."}</p>
      <form id="sd-cf" novalidate><label class="sd-lab" for="sd-code">الكود</label>
        <input id="sd-code" name="code" dir="ltr" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" placeholder="RAD-XXXX-XXXX" maxlength="20">
        <button type="submit" class="sd-btn">دخول</button></form>
      <p class="sd-msg" id="sd-cm" role="status" aria-live="polite"></p>
      ${PIN.on ? `<button type="button" class="sd-btn ghost" id="sd-pingo">🔒 ادخل باسمك ورقمك السري</button>` : ""}
      ${NA.on ? `<button type="button" class="sd-btn ghost" id="sd-namego">ما عندي كود؟ اكتب اسمي</button>` : ""}
      ${SUPPORT ? `<a class="sd-btn ghost" href="${esc(SUPPORT)}" target="_blank" rel="noopener" data-sd-support>نسيت الكود؟ راسل المشرف</a>` : ""}
      <p class="sd-free">الأطلس والفحوصات الملوّنة والأجهزة والمصطلحات العامة مفتوحة لأي أحد.</p>
      <button type="button" class="sd-btn ghost" data-sd-close>${direct ? "‹ رجوع للرئيسية" : "مو هسه"}</button></div>`;
    document.body.appendChild(d);
    const inp = d.querySelector("#sd-code"), m = d.querySelector("#sd-cm"), btn = d.querySelector("#sd-cf button");
    const close = () => { if (direct) location.href = ROOT + "lessons/"; else d.remove(); };
    d.querySelector("[data-sd-close]").onclick = close;
    d.addEventListener("click", (ev) => { if (ev.target === d && !direct) close(); });
    // (69) المستمع على الصفحة (مو النافذة بس) حتى الدوران يكمل لما التركيز على أزرار شريط المعاينة
    const onKey = (ev) => {
      if (!d.isConnected) { document.removeEventListener("keydown", onKey); return; }
      if (!d.contains(ev.target) && !(ev.target.closest && ev.target.closest(".sd-pv"))) return;
      if (ev.key === "Escape") { ev.preventDefault(); close(); }
      if (ev.key === "Tab") {   // التركيز يدور داخل النافذة بس
        // (69) أزرار شريط المعاينة ضمن الدوران
        const f = [...document.querySelectorAll(".sd-pv button"), ...d.querySelectorAll("input,button,a[href]")]; const i = f.indexOf(document.activeElement);
        ev.preventDefault(); f[(i < 0 ? 0 : i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    d.querySelector("#sd-cf").onsubmit = async (ev) => {
      ev.preventDefault();
      if (!inp.value.trim()) { m.className = "sd-msg bad"; m.textContent = "اكتب الكود أول (مثل RAD-7K4P-2QXM)."; return; }
      btn.disabled = true; m.className = "sd-msg ok"; m.textContent = "لحظة…";
      try {
        await account();
        const r = await window.Account.redeem(inp.value);
        btn.disabled = false;
        if (!r.ok) { m.className = "sd-msg bad"; m.textContent = r.msg; return; }
        // بعد الدخول (29/10، «صفحتي» v2): رابط مقفول ← نفس الرابط؛ صفحة مقفولة ← نفسها؛ غيرها ← صفحتي (me/)
        const go = () => { if (next) location.href = next; else if (G && gated(rel, G)) location.reload(); else location.href = ROOT + "me/"; };
        if (!r.name_confirmed || r.needs_name) return nameCheck(d.querySelector(".sd-card"), r.full_name || "", go);
        go();
      } catch (e) { btn.disabled = false; m.className = "sd-msg bad"; m.textContent = "ماكو اتصال. تأكد من النت وجرّب مرة ثانية."; }
    };
    const pg = d.querySelector("#sd-pingo");   // 🔒 078: الاسم الثلاثي + رقم سري (pin-ui.js ينحمّل وقت الضغط بس)
    if (pg) pg.onclick = async () => {
      pg.disabled = true;
      try { await account(); await pinui(); } catch (e) { pg.disabled = false; m.className = "sd-msg bad"; m.textContent = "ماكو اتصال. تأكد من النت وجرّب مرة ثانية."; return; }
      const done = () => { if (next) location.href = next; else if (G && gated(rel, G)) location.reload(); else location.href = ROOT + "me/"; };
      window.PinUI.mountGate(d.querySelector(".sd-card"), { done, back: () => { d.remove(); dialog(next, o); } });
    };
    const ng = d.querySelector("#sd-namego");
    if (ng) { ng.onclick = () => nameFlow(d.querySelector(".sd-card"), () => { if (next) location.href = next; else if (G && gated(rel, G)) location.reload(); else location.href = ROOT + "me/"; }, close, direct, next); if (LS.get("t:name-wait") === "1") ng.click(); }
    setTimeout(() => inp.focus(), 30);
  }
  // 🔑 75: «اكتب اسمك» — مفتوحة للزائر بس لما settings.name_access.on. الكود ما يبين لمن يكتب اسماً لحاله: لازم رقمه الجامعي أو موافقة الإدارة،
  // والكود يوصل لهالجهاز بس (سر عشوائي بالمتصفح، بالسيرفر بصمته). مطفية افتراضياً.
  let NA = { on: false }, PIN = { on: false };   // 🔒 078: settings.student_pin.on (مطفي افتراضياً)
  let pinP = null;
  const pinui = () => window.PinUI ? Promise.resolve() : (pinP ??= new Promise((ok, no) => { const s = document.createElement("script"); s.src = ROOT + "assets/pin-ui.js"; s.onload = ok; s.onerror = () => { pinP = null; no(new Error("load")); }; document.head.appendChild(s); }));
  const NURL = () => ((window.STUDY_CLOUD || {}).url || "") + "/functions/v1/name-claim";
  function nsecret() {
    let k = LS.get("t:name-secret");
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(k || "")) {
      const b = new Uint8Array(24); crypto.getRandomValues(b);
      k = btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); LS.set("t:name-secret", k);
    }
    return k;
  }
  async function ncall(action, extra) {
    const A = (window.STUDY_CLOUD || {}).anon || "";
    try {
      const r = await fetch(NURL(), { method: "POST", headers: { apikey: A, Authorization: "Bearer " + A, "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ action, secret: nsecret() }, extra || {})) });
      const j = await r.json().catch(() => ({})); j.http = r.status; return j;
    } catch (e) { return { status: "net", msg: "ماكو اتصال. تأكد من النت وجرّب مرة ثانية." }; }
  }
  function nameFlow(box, go, close, direct, next) {
    let poll = 0, name = "", univ = false;
    const stop = () => { clearInterval(poll); poll = 0; };
    const draw = () => {
      box.innerHTML = `<h2 id="sd-gt">اكتب اسمك 👋</h2><p class="sd-sub">اكتب اسمك الثلاثي مثل ما هو بقائمة القسم. إذا كان بالقائمة، الكود يوصلك هنا.</p>
        <form id="sd-nf" novalidate><label class="sd-lab" for="sd-nn">اسمك الثلاثي</label><input id="sd-nn" autocomplete="name" maxlength="120" value="${esc(name)}">
          <div id="sd-uw" ${univ ? "" : "hidden"}><label class="sd-lab" for="sd-un">رقمك الجامعي</label><input id="sd-un" inputmode="numeric" dir="ltr" autocomplete="off" maxlength="40"></div>
          <button type="submit" class="sd-btn" id="sd-ngo">${univ ? "تأكيد" : "تحقّق"}</button></form>
        <div id="sd-nx"></div><p class="sd-msg" id="sd-nm2" role="status" aria-live="polite"></p>
        <button type="button" class="sd-btn ghost" data-sd-back>‹ رجوع للكود</button>`;
      const m = box.querySelector("#sd-nm2"), x = box.querySelector("#sd-nx"), say = (t, bad) => { m.className = "sd-msg " + (bad ? "bad" : "ok"); m.textContent = t || ""; };
      box.querySelector("[data-sd-back]").onclick = () => { stop(); dialogAgain(); };
      const askBtn = () => { x.innerHTML = `<button type="button" class="sd-btn ghost" id="sd-ask">اطلب موافقة الإدارة</button>`; x.querySelector("#sd-ask").onclick = async () => {
        const r = await ncall("ask", { name }); handle(r); }; };
      const handle = (r) => {
        const st = r && r.status; x.innerHTML = "";
        if (st === "ok") { stop(); LS.del("t:name-wait"); LS.del("t:name-last"); LS.del("t:name-at"); LS.del("t:name-first"); return showCode(r.code, r.name || name); }
        if (st === "need_proof") { univ = r.mode === "univ_or_ask"; box.querySelector("#sd-uw").hidden = !univ; box.querySelector("#sd-ngo").textContent = univ ? "تأكيد" : "تحقّق"; askBtn(); if (univ) box.querySelector("#sd-un").focus(); return say(r.msg); }
        if (st === "queued" || st === "pending") { LS.set("t:name-wait", "1"); if (name) { LS.set("t:name-last", name); if (!LS.get("t:name-at")) LS.set("t:name-at", String(Date.now())); if (!LS.get("t:name-first")) LS.set("t:name-first", String(Date.now())); } say(r.msg || "طلبك عند الإدارة."); if (!poll) { let n = 0; poll = setInterval(async () => { if (!box.isConnected || ++n > 100) return stop(); const p = await ncall("poll"); if (p.status === "ok") handle(p); else if (p.status === "rejected") { stop(); LS.del("t:name-wait"); LS.del("t:name-last"); LS.del("t:name-at"); LS.del("t:name-first"); say(p.msg, true); } }, 9000); } return; }
        if (st === "rejected" || st === "none") { LS.del("t:name-wait"); LS.del("t:name-last"); LS.del("t:name-at"); LS.del("t:name-first"); return say(r.msg || "ما لگينا طلب. اكتب اسمك مرة ثانية.", st === "rejected"); }
        if (st === "taken" || st === "nomatch" || st === "locked") { askBtn(); return say(r.msg, true); }
        say((r && r.msg) || "صار خطأ، جرّب مرة ثانية.", true);
      };
      box.querySelector("#sd-nf").onsubmit = async (ev) => {
        ev.preventDefault(); name = box.querySelector("#sd-nn").value.trim().replace(/\s+/g, " ");
        if (name.length < 3) return say("اكتب اسمك الثلاثي كامل.", true);
        const b = box.querySelector("#sd-ngo"); b.disabled = true; say("لحظة…");
        const r = await ncall("find", { name, univ: univ ? box.querySelector("#sd-un").value.trim() : "" }); b.disabled = false; handle(r);
      };
      if (LS.get("t:name-wait") === "1") ncall("poll").then((p) => { if (!box.isConnected) return; handle(p.status === "none" ? { status: "none" } : p);
        // 75 (مراجعة خامسة): إذا ما زال ينتظر، نعيد الطلب بصمت مرة كل 6 ساعات (يدخل الطابور لو كان انرفض بالنظام بسبب حد، ويجدّد الانتهاء) بدل ما ينتظر 14 يوم بلا تغيير
        const last = LS.get("t:name-last"), at = +LS.get("t:name-at") || 0;
        // 75 (مراجعة سادسة): الإعادة التلقائية تتوقف بعد 14 يوم من أول طلب (انتهاء مدة الطلب) — يعيد الكتابة أو يراسل المشرف
        const first = +LS.get("t:name-first") || 0;
        if (first && Date.now() - first > 14 * 86400 * 1000) { LS.del("t:name-wait"); LS.del("t:name-last"); LS.del("t:name-at"); LS.del("t:name-first"); return say("انتهت مدة الطلب، أعد الكتابة أو راسل المشرف.", true); }
        if ((p.status === "pending" || p.status === "queued") && last && Date.now() - at > 6 * 3600 * 1000) { LS.set("t:name-at", String(Date.now())); ncall("ask", { name: last }); } });
      box.querySelector("#sd-nn").focus();
    };
    const dialogAgain = () => { const dd = box.closest(".sd-dlg"); if (dd) dd.remove(); dialog(next); };
    const showCode = (code, nm) => {
      box.innerHTML = `<h2 id="sd-gt">أهلاً ${esc(String(nm || "").split(" ")[0])} 👋</h2><p class="sd-sub">هذا كودك. احفظه (صوّر الشاشة أو انسخه) حتى تدخل فيه من أي جهاز.</p>
        <div class="sd-codebox" id="sd-cc">${esc(code)}</div>
        <button type="button" class="sd-btn ghost" id="sd-cp">نسخ الكود</button><button type="button" class="sd-btn" id="sd-in">ادخل</button><p class="sd-msg" id="sd-cm3" role="status" aria-live="polite"></p>`;
      box.querySelector("#sd-cp").onclick = async (e) => { try { await navigator.clipboard.writeText(code); e.currentTarget.textContent = "✔️ اننسخ"; } catch (er) { /* */ } };
      box.querySelector("#sd-in").onclick = async (e) => {
        const b = e.currentTarget, m = box.querySelector("#sd-cm3"); b.disabled = true;
        try { await account(); const r = await window.Account.redeem(code); b.disabled = false;
          if (!r.ok) { m.className = "sd-msg bad"; m.textContent = r.msg; return; }
          if (!r.name_confirmed || r.needs_name) return nameCheck(box, r.full_name || "", go); go();
        } catch (er) { b.disabled = false; m.className = "sd-msg bad"; m.textContent = "ماكو اتصال. جرّب مرة ثانية."; }
      };
    };
    draw();
  }
  // أول دخول: «هذا اسمك؟» (نفس خطوة ٢ بشاشة دخول الطلاب)
  function nameCheck(box, n, go) {
    if (!n) {   // 73: كود جملي بلا اسم ← يكتب اسمه الثلاثي بنفسه (مرة وحدة)
      box.innerHTML = `<h2 id="sd-gt">أهلاً بيك 👋</h2><p class="sd-sub">اكتب اسمك الثلاثي كامل (مرة وحدة بس).</p>
        <form id="sd-nf" novalidate><label class="sd-lab" for="sd-name">اسمك الثلاثي</label><input id="sd-name" autocomplete="name" placeholder="مثال: أحمد علي حسين">
        <button type="submit" class="sd-btn">دخول</button></form><p class="sd-msg" id="sd-nm" role="status" aria-live="polite"></p>`;
      box.querySelector("#sd-nf").onsubmit = async (e) => {
        e.preventDefault(); const b = e.currentTarget.querySelector("button"), m = box.querySelector("#sd-nm"); b.disabled = true;
        const v0 = box.querySelector("#sd-name").value.trim().replace(/\s+/g, " "); if (v0.split(" ").length < 3) { b.disabled = false; m.className = "sd-msg bad"; m.textContent = "اكتب اسمك الثلاثي كامل."; return; }
        const r = await window.Account.setName(v0); b.disabled = false;
        if (r.ok) go(); else { m.className = "sd-msg bad"; m.textContent = r.msg || "صار خطأ."; }
      };
      box.querySelector("#sd-name").focus(); return;
    }
    box.innerHTML = `<h2 id="sd-gt">أهلاً ${esc(n.split(" ")[0])} 👋</h2><p class="sd-sub">هذا اسمك؟ <b>${esc(n)}</b></p>
      <button type="button" class="sd-btn" id="sd-yes">إي، هذا اسمي — ادخل</button>
      <button type="button" class="sd-btn ghost" id="sd-fix" aria-expanded="false">لا، صحّح الاسم</button>
      <form id="sd-ff" hidden novalidate><label class="sd-lab" for="sd-name">اسمك الثلاثي الصحيح</label><input id="sd-name" autocomplete="name" value="${esc(n)}">
        <button type="submit" class="sd-btn">أرسل</button><p class="sd-free">يوصل تنبيه لمحمد يتأكد، وتگدر تدخل هسه.</p></form>
      <p class="sd-msg" id="sd-nm" role="status" aria-live="polite"></p>`;
    box.querySelector("#sd-yes").onclick = async () => { const r = await window.Account.confirmName(); if (r && r.ok) go(); else { const m = box.querySelector("#sd-nm"); m.className = "sd-msg bad"; m.textContent = (r && r.msg) || "صار خطأ، جرّب مرة ثانية."; } };
    box.querySelector("#sd-fix").onclick = (e) => { box.querySelector("#sd-ff").hidden = false; e.currentTarget.setAttribute("aria-expanded", "true"); box.querySelector("#sd-name").focus(); };
    box.querySelector("#sd-ff").onsubmit = async (e) => {
      e.preventDefault();
      const r = await window.Account.fixName(box.querySelector("#sd-name").value);
      const m = box.querySelector("#sd-nm"); m.className = "sd-msg " + (r.ok ? "ok" : "bad"); m.textContent = r.msg || (r.ok ? "وصل طلبك." : "صار خطأ.");
      if (r.ok) setTimeout(go, 1200);
    };
    box.querySelector("#sd-yes").focus();
  }
  let acc = null;
  function account() {
    if (window.Account) return Promise.resolve();
    return acc ??= new Promise((ok, no) => { const s = document.createElement("script"); s.src = ROOT + "assets/account.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  function apply(g) {
    if (staffView && vkind === "visitor") g = Object.assign({}, g || {}, { on: true });   // معاينة الزائر = شكل الموقع بعد تشغيل البوابة
    G = g;
    LS.set("t:gate-on", g && g.on ? "1" : "0");
    if (!g || !g.on) { document.body.classList.remove("sd-locked"); return; }
    if (gated(rel, g) && !allowed()) { document.body.classList.add("sd-locked"); dialog(null); }
    else document.body.classList.remove("sd-locked");
  }
  // روابط الأقسام المقفولة ← نفس النافذة، وبعد الكود يكمل للرابط نفسه
  document.addEventListener("click", (ev) => {
    if (skip || !G || !G.on || allowed() || ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    const a = ev.target.closest && ev.target.closest("a[href]"); if (!a || a.target === "_blank") return;
    let u; try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
    if (u.origin !== location.origin || !decodeURIComponent(u.pathname).startsWith(decodeURIComponent(new URL(ROOT).pathname))) return;
    const p = decodeURIComponent(u.pathname).slice(decodeURIComponent(new URL(ROOT).pathname).length);
    if (!gated(p, G)) return;
    ev.preventDefault(); dialog(u.href);
  }, true);


  // ⚙️ (20/11، قرار محمد) زر «الإعدادات» بشريط كل صفحة: الدخول باسمك الثلاثي ورمزك السري (حروف أو أرقام)، اللغة، والوضع الليلي. بسيط: نافذة وحدة.
  const GEAR = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  function gear() {
    const t = document.querySelector("header .tools, .tools");
    if (!t || t.querySelector("[data-sd-gear]")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "tbtn"; b.setAttribute("data-sd-gear", ""); b.setAttribute("aria-label", document.documentElement.lang === "en" ? "Settings" : "الإعدادات"); b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = GEAR; b.onclick = () => settings(b);
    t.appendChild(b);
  }
  function settings(opener) {
    css(); document.querySelectorAll(".sd-dlg").forEach((d) => d.remove());
    const en = document.documentElement.lang === "en", T = (a, e) => (en ? e : a);
    const ss = studentSession(), nm = LS.get("t:acct-name") || "";
    const dark = document.documentElement.dataset.theme === "dark";
    const d = document.createElement("div");
    d.className = "sd-dlg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "sd-gt");
    d.innerHTML = `<div class="sd-card" data-noen>
      <h2 id="sd-gt">⚙️ ${T("الإعدادات", "Settings")}</h2>
      <h3 class="sd-sh">${T("حسابي", "My account")}</h3>
      ${ss ? `<p class="sd-sub">✅ ${T("داخل باسم", "Signed in as")}: <b>${esc(nm || T("طالب", "student"))}</b></p>
        <a class="sd-btn" href="${ROOT}me/">${T("صفحتي", "My page")}</a>
        <a class="sd-btn ghost" href="${ROOT}rooms/" data-sd-rooms hidden>🏠 ${T("غرف الدراسة", "Study rooms")}</a>
        <button type="button" class="sd-btn ghost" data-sd-out>${T("اطلع من هذا الجهاز", "Sign out on this device")}</button>`
      : PIN.on ? `<p class="sd-sub">${T("اكتب اسمك الثلاثي واختار رمز سري (حروف أو أرقام)، وتصير مساحتك خاصة بيك بأي جهاز.", "Write your full name and choose a secret code (letters or digits); your space becomes yours on any device.")}</p>
        <button type="button" class="sd-btn" data-sd-pin="save">🔒 ${T("تسجيل جديد", "New sign-up")}</button>
        <button type="button" class="sd-btn ghost" data-sd-pin="in">${T("عندي حساب: دخول", "I have an account: sign in")}</button>`
      : `<p class="sd-sub">${T("الدخول بالاسم مو شغّال هسه.", "Name sign-in is not available right now.")}</p>`}
      <h3 class="sd-sh">${T("اللغة", "Language")}</h3>
      <div class="sd-row"><button type="button" class="sd-btn ${en ? "ghost" : ""}" data-sd-lang="ar" aria-pressed="${!en}">العربي</button><button type="button" class="sd-btn ${en ? "" : "ghost"}" data-sd-lang="en" aria-pressed="${en}">English</button></div>
      <h3 class="sd-sh">${T("المظهر", "Appearance")}</h3>
      <div class="sd-row"><button type="button" class="sd-btn ${dark ? "ghost" : ""}" data-sd-th="light" aria-pressed="${!dark}">☀️ ${T("فاتح", "Light")}</button><button type="button" class="sd-btn ${dark ? "" : "ghost"}" data-sd-th="dark" aria-pressed="${dark}">🌙 ${T("ليلي", "Dark")}</button></div>
      <p class="sd-msg" id="sd-gm" role="status" aria-live="polite"></p>
      <button type="button" class="sd-btn ghost" data-sd-close>${T("تمّ", "Done")}</button></div>`;
    document.body.appendChild(d);
    const m = d.querySelector("#sd-gm");
    const close = () => { d.remove(); document.removeEventListener("keydown", onKey); if (opener && opener.isConnected) opener.focus(); };
    const onKey = (ev) => {
      if (!d.isConnected) return document.removeEventListener("keydown", onKey);
      if (ev.key === "Escape") { ev.preventDefault(); close(); }
      if (ev.key === "Tab") { const f = [...d.querySelectorAll("input,button,a[href]")].filter((x) => x.getClientRects().length); const i = f.indexOf(document.activeElement); ev.preventDefault(); if (f.length) f[(i < 0 ? 0 : i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    };
    document.addEventListener("keydown", onKey);
    d.addEventListener("click", (ev) => { if (ev.target === d) close(); });
    d.querySelector("[data-sd-close]").onclick = close;
    d.querySelectorAll("[data-sd-lang]").forEach((b) => b.onclick = () => {
      const want = b.dataset.sdLang; const cur = document.documentElement.lang === "en" ? "en" : "ar";
      if (want !== cur) { const r = document.querySelector(`.lang button[lang="${want}"]`); if (r) r.click(); }
      settings(opener);
    });
    d.querySelectorAll("[data-sd-th]").forEach((b) => b.onclick = () => {
      const isDark = document.documentElement.dataset.theme === "dark";
      if ((b.dataset.sdTh === "dark") !== isDark) { const t = document.querySelector("[data-theme-toggle]"); if (t) t.click(); }
      settings(opener);
    });
    const out = d.querySelector("[data-sd-out]");
    if (out) out.onclick = async () => {
      out.disabled = true;
      try { await account(); await window.Account.logout(); } catch (e) { /* */ }
      try { LS.del("t:acct-session"); LS.del("t:acct-name"); } catch (e) { /* */ }
      location.reload();
    };
    d.querySelectorAll("[data-sd-pin]").forEach((b) => b.onclick = async () => {
      b.disabled = true; m.className = "sd-msg ok"; m.textContent = T("لحظة…", "One moment…");
      try { await account(); await pinui(); } catch (e) { b.disabled = false; m.className = "sd-msg bad"; m.textContent = T("ماكو اتصال. تأكد من النت وجرّب مرة ثانية.", "No connection. Check the internet and try again."); return; }
      window.PinUI.mountGate(d.querySelector(".sd-card"), { tab: b.dataset.sdPin, done: () => { location.href = ROOT + "me/"; }, back: () => settings(opener) });
    });
    // 🏠 غرف الدراسة (21/11): الزر يطلع بس إذا الغرف شغّالة لهالطالب (أو هو من المجرّبين). سؤال واحد للسيرفر ومحفوظ 10 دقايق.
    const rb = d.querySelector("[data-sd-rooms]");
    if (rb) {
      let c = null; try { c = JSON.parse(LS.get("t:rooms-on") || "null"); } catch (e) { /* */ }
      if (c && Date.now() - (c.t || 0) < 6e5) rb.hidden = !c.on;
      else (async () => {
        try {
          await account(); await window.Account.ready();
          const C = window.STUDY_CLOUD || {}, s = window.Account.state.session; if (!s) return;
          const r = await fetch(C.url + "/rest/v1/rpc/room_me", { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" });
          const j = r.ok ? await r.json() : null, on = !!(j && j.on);
          LS.set("t:rooms-on", JSON.stringify({ on, t: Date.now() })); if (rb.isConnected) rb.hidden = !on;
        } catch (e) { /* بلا نت ← ما نبين الزر */ }
      })();
    }
    const first = d.querySelector("button"); if (first) setTimeout(() => first.focus(), 30);
  }

  function start() {
    mark(); pill(); gear();
    if (skip || !window.Net || !window.Net.on) return;
    // آخر حالة معروفة ← نخفي المحتوى من أول لحظة (بلا ومضة)، والإعدادات الحقيقية تأكد أو تشيل
    if (LS.get("t:gate-on") === "1" && gated(rel, { open: null, closed: null }) && !allowed()) document.body.classList.add("sd-locked"), css();
    Promise.resolve(window.Net.settings()).then((S) => { S = S || {}; NA = S.name_access && S.name_access.on === true ? { on: true } : { on: false }; PIN = S.student_pin && S.student_pin.on === true ? { on: true } : { on: false }; apply(S.gate || { on: false }); if (S.push && S.push.on === true) setTimeout(() => pushOffer(S.push), 4000); })
      .catch(() => document.body.classList.remove("sd-locked"));
  }
  // 73: حارس الاسم المشترك — طالب مسجّل دخول وما عنده اسم محفوظ (t:acct-name) ← نحمّل account.js مرة، وready() تجيب حسابه؛ إذا بلا اسم تطلع نافذة الاسم (ما تنسد)
  // (الصفحات اللي فيها account.js أصلاً — مساحتي وغيرها — حارسها داخل Account.ready؛ هنا بس الصفحات اللي ما تحمّله، وبعد التحميل حتى ما نزاحم sync)
  function nameWatch() { try { if (window.Account || !studentSession() || skip || LS.get("t:acct-name") || document.getElementById("st3")) return; account().then(() => window.Account && window.Account.ready()).catch(() => {}); } catch (e) {} }
  const nameLater = () => setTimeout(nameWatch, 800);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { start(); }); else start();
  if (document.readyState === "complete") nameLater(); else window.addEventListener("load", nameLater);

  // 🔒 (19/11، طلب محمد) «سجّل دخولك حتى تصير الميزة خاصة بيك» (pick.js: 🖍️ ظلّل، ⭐ احفظ): نفس نافذة الدخول على نفس الصفحة،
  //   وإذا الدخول بالاسم الثلاثي + الرقم السري مفعّل (settings.student_pin.on) تنفتح عليه رأساً. بعد الدخول ← نفس الصفحة (next).
  function askLogin(next) {
    if (studentSession() || document.querySelector(".sd-dlg")) return;
    css();
    dialog(next || location.href.split("#")[0], PIN.on ? { title: "🔒 سجّل دخولك حتى تصير خاصة بيك", sub: "باسمك الثلاثي ورقمك السري، وكل اللي تحفظه يبقى بحسابك وتلگاه بأي جهاز." } : { title: "🔒 سجّل دخولك حتى تصير خاصة بيك", sub: "وكل اللي تحفظه يبقى بحسابك وتلگاه بأي جهاز." });
    const pg = document.querySelector(".sd-dlg #sd-pingo"); if (pg) pg.click();
  }
  // 🔔 (22/11، مقترح منفّذ) «صاحبك بدأ تحدّي»: بس للطالب اللي عنده غرف والغرف شغّالة إله (من الذاكرة)،
  //   سؤال واحد خفيف للسيرفر مرة كل 3 دقايق كحد أعلى، وبعد ما تخلص الصفحة. الطالب بلا غرف ← صفر طلبات.
  const KINDS = { quick: "⚡ تحدّي سريع", hard: "🧠 تحدّي صعب", image: "🩻 خمّن الصورة" };
  function roomAlerts() {
    try {
      if (skip || /(^|\/)rooms\//.test(rel) || LS.get("rm:mine") !== "1" || document.hidden) return;
      const c = LS.json("t:rooms-on"); if (!c || !c.on || Date.now() - (c.t || 0) > 864e5) return;
      const s = studentSession(); if (!s || !s.access_token || !(s.expires_at * 1000 > Date.now() + 3e4)) return;
      if (Date.now() - (+LS.get("rm:ping") || 0) < 18e4) return;
      const C = window.STUDY_CLOUD || {}; if (!C.url || !C.anon) return;
      LS.set("rm:ping", String(Date.now()));
      fetch(C.url + "/rest/v1/rpc/room_alerts", { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" })
        .then((r) => (r.ok ? r.json() : [])).then((list) => {
          const seen = LS.json("rm:seen") || [];
          const a = (Array.isArray(list) ? list : []).find((x) => x && x.game && seen.indexOf(x.game) < 0);
          if (!a || document.querySelector(".sd-rmtoast")) return;
          if (document.querySelector(".amins")) { LS.del("rm:ping"); return; }   // دليل التثبيت مفتوح ← التذكير بالصفحة الجاية (ما يتراكبون)
          LS.set("rm:seen", JSON.stringify(seen.concat(a.game).slice(-30)));
          const t = document.createElement("div"); t.className = "sd-rmtoast"; t.setAttribute("role", "status"); t.dir = "rtl";
          t.style.cssText = "position:fixed;inset-inline:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:9999;max-width:460px;margin:0 auto;display:flex;gap:8px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--card,#fff);color:var(--ink,#1B2233);border:1px solid var(--line,#D9DEE8);box-shadow:0 8px 28px rgba(0,0,0,.18);font:600 15px/1.5 system-ui,sans-serif";
          const en = document.documentElement.lang === "en";
          t.innerHTML = `<span style="flex:1">🎮 ${en ? esc(a.by || "A friend") + " started a challenge in «" + esc(a.name || "") + "»" : esc(a.by || "صاحبك") + " بدأ " + esc(KINDS[a.kind] || "تحدّي") + " بغرفة «" + esc(a.name || "") + "»"}</span>`
            + `<a href="${ROOT}rooms/#r=${esc(a.room)}" style="min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border-radius:12px;background:var(--brand,#4B5A8A);color:#fff;text-decoration:none">▶️ ${en ? "Play" : "العب"}</a>`
            + `<button type="button" aria-label="${en ? "Close" : "سدّ"}" style="min-width:44px;min-height:44px;border:0;background:transparent;color:inherit;font-size:18px">✕</button>`;
          t.querySelector("button").onclick = () => t.remove();
          document.body.append(t);
          let held = false; t.addEventListener("pointerenter", () => { held = true; }); t.addEventListener("focusin", () => { held = true; });
          const bye = () => { if (!t.isConnected) return; if (held) { held = false; setTimeout(bye, 15000); } else t.remove(); }; setTimeout(bye, 20000);
        }).catch(() => {});
    } catch (e) { /* */ }
  }
  // 🏠 (22/11، مقترح منفّذ) سطر «غرف الدراسة» تحت بطاقات الرئيسية: بس لطالب مسجّل والغرف شغّالة إله. سؤال صح/خطأ محفوظ 10 دقايق، بعد ما تخلص الصفحة.
  function roomsLine() {
    try {
      const T = (x, y) => (document.documentElement.lang === "en" ? y : x);
      if (skip || !/^(lessons\/)?(index\.html)?$/.test(rel) || document.querySelector(".sd-rmline")) return;
      const grid = document.querySelector("a.hcard") && document.querySelector("a.hcard").parentElement; if (!grid) return;
      const show = (on) => {
        if (!on || document.querySelector(".sd-rmline")) return;
        const a = document.createElement("a"); a.className = "sd-rmline"; a.href = ROOT + "rooms/";
        a.style.cssText = "display:flex;align-items:center;gap:10px;min-height:48px;margin:12px 0 0;padding:10px 14px;border-radius:14px;border:1px dashed var(--line,#D9DEE8);color:inherit;text-decoration:none;font:600 15px/1.5 system-ui,sans-serif";
        a.innerHTML = `<span aria-hidden="true" style="font-size:20px">🏠</span><span style="flex:1"><b>${T("غرف الدراسة", "Study rooms")}</b> · ${T("ادرس ويّا أصحابك بمؤقّت واحد، وتحدّيات 🎮", "Study with friends on one timer, plus challenges 🎮")}</span><span aria-hidden="true">‹</span>`;
        grid.after(a);
      };
      const c = LS.json("t:rooms-on");
      if (c && Date.now() - (c.t || 0) < (c.on ? 6e5 : 216e5)) return show(c.on);   // (مراجعة) «مطفية» 6 ساعات، حتى ما نسأل السيرفر كل 10 دقايق
      const s = studentSession(); if (!s || !s.access_token || !(s.expires_at * 1000 > Date.now() + 3e4)) return;
      const C = window.STUDY_CLOUD || {}; if (!C.url || !C.anon) return;
      fetch(C.url + "/rest/v1/rpc/room_on", { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json" }, body: "{}" })
        .then((r) => (r.ok ? r.json() : false)).then((on) => { on = on === true; LS.set("t:rooms-on", JSON.stringify({ on, t: Date.now() })); show(on); }).catch(() => {});
    } catch (e) { /* */ }
  }
  window.addEventListener("load", () => setTimeout(roomsLine, 1200));
  window.addEventListener("load", () => setTimeout(roomAlerts, 2500));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(roomAlerts, 800); });
  // 🔔 (22/11) تنبيهات الموبايل: بطاقة «فعّل التنبيهات» بالرئيسية بس، لما settings.push.on.
  //   ما تطلع: إذا المتصفح ما يدعمها، أو الطالب قرر (سمح/رفض)، أو قال «مو هسه» خلال 14 يوم، أو دليل التثبيت مفتوح،
  //   وبالآيفون إلا بعد ما يثبّت المنصة (سفاري يسمح بالتنبيهات للمثبّتة بس). اللي سمح قبل ← يتجدد اشتراكه بهدوء.
  function pushOK() { return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window; }
  const iosNotInstalled = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
  const keyBytes = (k) => { const p = (k + "===".slice((k.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(p), (c) => c.charCodeAt(0)); };
  async function pushSubscribe(cfg) {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub && LS.get("t:push-key") !== cfg.vapid_public) { try { await sub.unsubscribe(); } catch (e) { /* */ } sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(cfg.vapid_public) });
    const j = sub.toJSON(), C = window.STUDY_CLOUD || {};   // بلا حساب: الجهاز ما ينربط بالطالب
    const r = await fetch(C.url + "/rest/v1/rpc/push_subscribe", { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + C.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }) });
    const x = r.ok ? await r.json() : null;
    if (x && x.ok) { LS.set("t:push-key", cfg.vapid_public); LS.set("t:push-ok", String(Date.now())); return true; }
    return false;
  }
  function pushOffer(cfg) {
    try {
      if (skip || !cfg || !/^[A-Za-z0-9_-]{80,100}$/.test(cfg.vapid_public || "") || !pushOK() || !window.STUDY_CLOUD) return;
      if (Notification.permission === "granted") {   // سمح قبل ← نجدد بهدوء مرة بالأسبوع (أو إذا المفتاح تغيّر)
        if (LS.get("t:push-key") !== cfg.vapid_public || Date.now() - (+LS.get("t:push-ok") || 0) > 7 * 864e5) pushSubscribe(cfg).catch(() => {});
        return;
      }
      if (Notification.permission !== "default" || !/^(lessons\/)?(index\.html)?$/.test(rel) || iosNotInstalled()) return;
      if (Date.now() - (+LS.get("t:push-later") || 0) < 14 * 864e5 || document.querySelector(".amins, .sd-dlg, .sd-push")) return;
      if (!LS.get("t:install") && !(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches))) return;   // أول زيارة: دليل التثبيت أول، التنبيهات بالزيارة الجاية
      const en = document.documentElement.lang === "en", T = (a, b) => (en ? b : a);
      const c = document.createElement("div"); c.className = "sd-push"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", T("التنبيهات", "Notifications")); c.dir = en ? "ltr" : "rtl";
      c.style.cssText = "position:fixed;inset-inline:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:9998;max-width:460px;margin:0 auto;padding:14px;border-radius:16px;background:var(--card,#fff);color:var(--ink,#1B2233);border:1px solid var(--line,#D9DEE8);box-shadow:0 10px 30px rgba(0,0,0,.18);font:500 15px/1.6 system-ui,sans-serif";
      c.innerHTML = `<p style="margin:0 0 4px;font-weight:800">🔔 ${T("خلّي المنصة تنبّهك", "Let the platform remind you")}</p>`
        + `<p style="margin:0 0 10px;color:var(--muted,#5B6478)">${T("قبل الامتحان بيوم، ولما تنزل محاضرة جديدة. تنبيهين باليوم بالكثير، وبلا إزعاج بالليل.", "A day before each exam and when a new lecture is out. Two a day at most, never at night.")}</p>`
        + `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-p="yes" style="min-height:44px;padding:0 16px;border-radius:12px;border:0;background:var(--brand,#4B5A8A);color:#fff;font:700 15px system-ui,sans-serif">${T("فعّل التنبيهات", "Turn on")}</button>`
        + `<button type="button" data-p="later" style="min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line,#D9DEE8);background:transparent;color:inherit;font:600 15px system-ui,sans-serif">${T("مو هسه", "Not now")}</button></div><p data-p="msg" role="status" style="margin:8px 0 0;min-height:0"></p>`;
      const msg = c.querySelector('[data-p="msg"]');
      c.querySelector('[data-p="later"]').onclick = () => { LS.set("t:push-later", String(Date.now())); c.remove(); };
      c.querySelector('[data-p="yes"]').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        let p = "default"; try { p = await Notification.requestPermission(); } catch (e) { /* */ }
        if (p !== "granted") { LS.set("t:push-later", String(Date.now())); msg.textContent = T("ما تفعّلت. تگدر تفعّلها بعدين من إعدادات المتصفح.", "Not enabled. You can allow it later from the browser settings."); setTimeout(() => c.remove(), 3500); return; }
        try { const ok = await pushSubscribe(cfg); msg.textContent = ok ? T("✅ تمام، راح ننبّهك.", "✅ Done, we'll remind you.") : T("صار خلل، جرّب بعدين.", "Something went wrong, try later."); }
        catch (e) { msg.textContent = T("صار خلل، جرّب بعدين.", "Something went wrong, try later."); }
        setTimeout(() => c.remove(), 2500);
      };
      document.body.append(c);
    } catch (e) { /* */ }
  }
  window.StaffDoor = { settings, css, asStudent, asView, backToAdmin, staffSession, studentSession, ROOT, SUPPORT, gated, askLogin, pinOn: () => PIN.on === true };
})();
