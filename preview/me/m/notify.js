// 🔔 تنبيهات البوت بـ«مساحتي» (29/10/2026) — window.BotNotify.mount(el, {root}). مطفية: ما تبين إلا إذا:
//   الطالب مسجّل دخول (Account) + settings.tg_link.on (الدالة notify-me ترجع available). الزائر ← ولا طلب شبكة ولا شي يبين.
// غير مربوط ← «🔔 فعّل تنبيهات البوت» ← Account.linkTelegram() ← رابط t.me/…?start=<رمز> (15 دقيقة، مرة وحدة)
//   ← البوت يرد برمز 6 أرقام ← الطالب يكتبه هنا (notify-me confirm) ← ينربط. (الربط بالطرفين، ضد ربط تليغرام غيرك.)
// مربوط ← 4 مفاتيح (⏰ تذكيراتي · 📅 قبل الامتحان · 🗓️ خطة اليوم · 📚 محاضرة جديدة) + «🔕 فك الربط».
// المعاينة: ?notify-demo ← شكل تجريبي بلا شبكة (ما يطلع للطلاب).
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPES = [
    ["reminders", "⏰ تذكيراتي", "اللي تسوّيها من «ذكّرني»، بوقتها"],
    ["exams", "📅 قبل الامتحان", "قبل أسبوع و3 أيام ويوم (وقت الامتحانات بس)"],
    ["plan", "🗓️ خطة اليوم", "سطر واحد الصبح إذا عندك خطة"],
    ["lectures", "📚 محاضرة جديدة", "أول ما تنزل بالموقع"],
  ];
  const CSS = `.bn{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px 14px 14px;margin:0 0 14px}
.bn h3{font:800 var(--t-md) var(--title-font);margin:0 0 4px}.bn p{margin:4px 0;color:var(--muted);font-size:var(--t-sm)}
.bn .bnrow{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;border-top:1px solid var(--line)}
.bn .bnrow:first-of-type{border-top:0}.bn .bnrow span{min-width:0}.bn .bnrow b{display:block;font-weight:700}.bn .bnrow small{color:var(--muted);font-size:var(--t-xs)}
.bn input[type=checkbox]{width:24px;height:24px;flex:none;accent-color:var(--brand);cursor:pointer}
.bn .bnact{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.bn .cbtn{min-height:44px}
.bn .bnmsg{min-height:1em}.bn .bnmsg:empty{display:none}`;

  function css() { if (document.getElementById("bn-css")) return; const s = document.createElement("style"); s.id = "bn-css"; s.textContent = CSS; document.head.appendChild(s); }
  async function call(body) {
    const tok = window.Account && Account.token && Account.token();
    if (!tok || !C.url) return { status: 0 };
    try {
      const r = await fetch(`${C.url}/functions/v1/notify-me`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return Object.assign({ status: r.status }, await r.json().catch(() => ({})));
    } catch (e) { return { status: 0, msg: "ماكو نت هسه، جرّب بعدين." }; }
  }

  function render(el, st, o) {
    const demo = !!o.demo;
    if (!st.linked) {
      el.innerHTML = `<section class="bn" aria-labelledby="bn-h"><h3 id="bn-h">🔔 تنبيهات البوت</h3>
<p>توصلك تذكيراتك وتذكير قبل الامتحان على تليغرام. بالكثير 3 تنبيهات باليوم غير تذكيراتك، وماكو شي من 11 بالليل لـ 8 الصبح.</p>
<div class="bnact"><button type="button" class="cbtn" data-bn="link">🔔 فعّل تنبيهات البوت</button></div>
<p class="bnmsg" role="status" aria-live="polite"></p></section>`;
    } else {
      el.innerHTML = `<section class="bn" aria-labelledby="bn-h"><h3 id="bn-h">🔔 تنبيهات البوت ✅ مربوطة</h3>
${st.sending ? "" : "<p>الإرسال يبدأ قريباً — اختياراتك تنحفظ من هسه.</p>"}
<fieldset style="border:0;margin:0;padding:0"><legend class="sr-only" style="position:absolute;clip:rect(0 0 0 0)">شنو يوصلك</legend>
${TYPES.map(([k, t, d]) => `<label class="bnrow"><span><b>${esc(t)}</b><small>${esc(d)}</small></span><input type="checkbox" data-bnk="${k}"${st.prefs[k] ? " checked" : ""}></label>`).join("")}</fieldset>
<div class="bnact"><button type="button" class="cbtn ghost" data-bn="unlink">🔕 فك الربط</button></div>
<p class="bnmsg" role="status" aria-live="polite"></p></section>`;
    }
    const say = (t) => { const m = el.querySelector(".bnmsg"); if (m) m.textContent = t; };
    el.querySelectorAll("[data-bnk]").forEach((x) => x.addEventListener("change", async () => {
      if (demo) { st.prefs[x.dataset.bnk] = x.checked; return say("✓ انحفظ (تجربة)"); }
      const r = await call({ action: "prefs", prefs: { [x.dataset.bnk]: x.checked } });
      if (r.ok) { st.prefs = r.prefs; say("✓ انحفظ"); } else { x.checked = !x.checked; say(r.msg || "ما انحفظ، جرّب مرة ثانية."); }
    }));
    const lb = el.querySelector('[data-bn="link"]');
    if (lb) lb.onclick = async () => {
      if (demo) { st.linked = true; return render(el, st, o); }
      lb.disabled = true;
      const r = await Account.linkTelegram();
      lb.disabled = false;
      if (!r || !r.url || !/^https:\/\/t\.me\/mohammed_almusawy_bot\?start=L[A-Za-z0-9_-]{20,63}$/.test(r.url)) return say((r && r.msg) || "ما گدرنا نسوّي الرابط، جرّب بعد شوية.");
      say("1) اضغط «Start» بالبوت  2) البوت يدزلك رمز 6 أرقام  3) اكتبه هنا. الرابط إلك بس (15 دقيقة، مرة وحدة) — لا تنطيه لأحد.");
      const a = document.createElement("div"); a.className = "bnact";
      a.innerHTML = `<a class="cbtn" href="${esc(r.url)}" target="_blank" rel="noopener">↗️ افتح البوت</a>
<label style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span>رمز البوت:</span><input class="tin" data-bn="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" style="width:9em;margin:0" aria-label="رمز التأكيد من البوت (6 أرقام)"></label>
<button type="button" class="cbtn" data-bn="confirm">✅ أكّد الربط</button>`;
      lb.closest(".bnact").replaceWith(a);
      try { window.open(r.url, "_blank", "noopener"); } catch (e) {}
      a.querySelector('[data-bn="confirm"]').onclick = async () => {
        const code = (a.querySelector('[data-bn="code"]').value || "").replace(/\D/g, "");
        if (code.length !== 6) return say("اكتب الرمز (6 أرقام) اللي وصلك من البوت.");
        const c = await call({ action: "confirm", code });
        if (c.ok) load(el, o); else say(c.msg || "ما كمل الربط، جرّب مرة ثانية.");
      };
    };
    const ub = el.querySelector('[data-bn="unlink"]');
    if (ub) ub.onclick = async () => {
      if (!confirm("توقف كل تنبيهات البوت؟ تگدر ترجع تفعّلها وقت ما تريد.")) return;
      if (demo) { st.linked = false; return render(el, st, o); }
      const r = await call({ action: "unlink" });
      if (r.ok) load(el, o); else say(r.msg || "صار خطأ، جرّب مرة ثانية.");
    };
  }

  async function load(el, o) {
    const st = await call({ action: "status" });
    if (st.status !== 200 || !st.available) { el.innerHTML = ""; return; }   // مطفي أو مو طالب ← ولا شي يبين
    render(el, st, o);
  }

  function mount(el, o = {}) {
    if (!el) return;
    css();
    if (/[?&]notify-demo\b/.test(location.search)) return render(el, { linked: false, sending: false, prefs: { reminders: true, exams: true, plan: true, lectures: false } }, Object.assign({}, o, { demo: true }));
    const A = window.Account;
    if (!A || !A.state || !A.state.on) return;
    let who = null;   // نحمّل مرة لكل طالب (Account.on يطلق مع كل تغيير)
    const go = () => {
      const id = A.state.session && A.state.student ? A.state.student.id : null;
      if (id === who) return; who = id;
      if (id) load(el, o); else el.innerHTML = "";
    };
    if (A.on) A.on(go);
    go();
  }

  window.BotNotify = { mount };
})();
