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
  const SUPPORT = cfgLink("https://t.me/m99uhammed");
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
.sd-door{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .sd-msg.bad{color:#FF8A80}}:root[data-theme=dark] .sd-msg.bad{color:#FF8A80}`;
    document.head.appendChild(st);
  }

  // ── 1) الباب المخفي ──
  const LOGO = "[data-staffdoor], .hero h1, header.idn h1";
  let taps = [];
  const mark = () => document.querySelectorAll(LOGO).forEach((el) => el.classList.add("sd-door"));
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest && ev.target.closest(LOGO);
    if (!el) return;
    const t = Date.now();
    taps = taps.filter((x) => t - x < 3000); taps.push(t);
    if (taps.length >= 5) { taps = []; location.href = ROOT + "admin/"; }
  });

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
  function dialog(next) {
    css();
    document.querySelectorAll(".sd-dlg").forEach((d) => d.remove());
    const direct = !next;
    const d = document.createElement("div");
    d.className = "sd-dlg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "sd-gt");
    d.innerHTML = `<div class="sd-card">
      <h2 id="sd-gt">هذي المحاضرة لطلاب القسم 🎓 اكتب كودك</h2>
      <p class="sd-sub">مرة وحدة بس، وبعدها الموقع يتذكّرك ويرجّعك لنفس المكان.</p>
      <form id="sd-cf" novalidate><label class="sd-lab" for="sd-code">الكود</label>
        <input id="sd-code" name="code" dir="ltr" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" placeholder="RAD-XXXX-XXXX" maxlength="20">
        <button type="submit" class="sd-btn">دخول</button></form>
      <p class="sd-msg" id="sd-cm" role="status" aria-live="polite"></p>
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
    setTimeout(() => inp.focus(), 30);
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

  function start() {
    mark(); pill();
    if (skip || !window.Net || !window.Net.on) return;
    // آخر حالة معروفة ← نخفي المحتوى من أول لحظة (بلا ومضة)، والإعدادات الحقيقية تأكد أو تشيل
    if (LS.get("t:gate-on") === "1" && gated(rel, { open: null, closed: null }) && !allowed()) document.body.classList.add("sd-locked"), css();
    Promise.resolve(window.Net.settings()).then((S) => { S = S || {}; apply(S.gate || { on: false }); })
      .catch(() => document.body.classList.remove("sd-locked"));
  }
  // 73: حارس الاسم المشترك — طالب مسجّل دخول وما عنده اسم محفوظ (t:acct-name) ← نحمّل account.js مرة، وready() تجيب حسابه؛ إذا بلا اسم تطلع نافذة الاسم (ما تنسد)
  // (الصفحات اللي فيها account.js أصلاً — مساحتي وغيرها — حارسها داخل Account.ready؛ هنا بس الصفحات اللي ما تحمّله، وبعد التحميل حتى ما نزاحم sync)
  function nameWatch() { try { if (window.Account || !studentSession() || skip || LS.get("t:acct-name") || document.getElementById("st3")) return; account().then(() => window.Account && window.Account.ready()).catch(() => {}); } catch (e) {} }
  const nameLater = () => setTimeout(nameWatch, 800);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { start(); }); else start();
  if (document.readyState === "complete") nameLater(); else window.addEventListener("load", nameLater);

  window.StaffDoor = { css, asStudent, asView, backToAdmin, staffSession, studentSession, ROOT, SUPPORT, gated };
})();
