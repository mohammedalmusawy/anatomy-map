// 🎓 حساب الطالب (29/10/2026) — جاهز ومو مربوط بأي صفحة بعد (ينتظر «وافقت» + «فعّل البوابة»).
// الدخول: كود (أو رابط ?code=…) ← دالة redeem-code ← verifyOtp({token_hash, type:"magiclink"}) ← جلسة Supabase تنحفظ بالمتصفح.
// بعدها: «أهلاً <الاسم>، هذا اسمك؟» ✅ / ✏️ · نفس معرّف الجهاز مال cloud.js (t:device) · خروج.
// window.Account = { state, ready, redeem, confirmName, fixName, logout, get, put, pull, linkTelegram, mountLogin, mountNameCheck, on }
// الأمان بالسيرفر (RLS + الدوال): الطالب يقرا/يكتب صفوفه بس، الكود 3 أجهزة، حد التخمين. هذا الملف واجهة بس.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const FN = (f) => `${C.url}/functions/v1/${f}`;
  const SB_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  const KEYS = ["progress", "mistakes", "favorites", "notes", "plan", "outside_log", "prefs"];
  const LOCAL = { progress: "t:progress", mistakes: "t:mistakes", favorites: "t:favs" };   // ينتقلن للحساب أول دخول
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // نفس معرّف الجهاز اللي يستعمله cloud.js
  let device;
  try { device = localStorage.getItem("t:device"); if (!device) { device = crypto.randomUUID(); localStorage.setItem("t:device", device); } } catch (e) { device = crypto.randomUUID(); }

  const state = { on: !!(C.url && C.anon), student: null, session: null, cache: {} };
  const subs = new Set();
  const emit = () => subs.forEach((f) => { try { f(state); } catch (e) {} });
  let sb = null;

  function loadSb() {
    if (window.supabase) return Promise.resolve();
    return new Promise((ok, no) => { const s = document.createElement("script"); s.src = SB_JS; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }
  async function client() {
    if (sb) return sb;
    await loadSb();
    sb = window.supabase.createClient(C.url, C.anon, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "t:acct-session", detectSessionInUrl: false } });
    sb.auth.onAuthStateChange((_e, s) => { state.session = s; if (!s) { state.student = null; state.cache = {}; } emit(); });
    return sb;
  }
  async function call(f, body, auth) {
    const tok = auth && state.session ? state.session.access_token : C.anon;
    const r = await fetch(FN(f), { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, ...j };
  }

  /** يدخل بالكود. يرجع {ok, full_name, name_confirmed} أو {ok:false, msg}. */
  async function redeem(code) {
    if (!state.on) return { ok: false, msg: "الحسابات مو مفعّلة بعد." };
    const r = await call("redeem-code", { code: String(code || "").trim(), device_id: device, ua: navigator.userAgent.slice(0, 120) });
    if (!r.token_hash) return { ok: false, msg: r.msg || "ما گدرنا ندخلك، جرّب مرة ثانية." };
    const c = await client();
    const { data, error } = await c.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
    if (error || !data.session) return { ok: false, msg: "ما گدرنا ندخلك، جرّب مرة ثانية." };
    state.session = data.session;
    await loadStudent();
    await migrateLocal();
    return { ok: true, full_name: r.full_name, name_confirmed: r.name_confirmed };
  }

  async function loadStudent() {
    const c = await client();
    const { data } = await c.from("students").select("id, full_name, status, name_confirmed, name_fix, streak, streak_best, last_seen").maybeSingle();
    state.student = data || null;
    emit();
    return state.student;
  }

  /** يرجع الجلسة المحفوظة (إذا موجودة) + يحدّث آخر ظهور والسلسلة مرة باليوم. */
  async function ready() {
    if (!state.on) return state;
    const url = new URL(location.href), code = url.searchParams.get("code");
    if (code) {   // رابط ?code=… ← يدخل وحده، وبعدها يشيل الكود من الرابط والتاريخ
      url.searchParams.delete("code");
      history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
      const r = await redeem(code);
      state.lastRedeem = r;
    }
    const c = await client();
    const { data: { session } } = await c.auth.getSession();
    state.session = session;
    if (session && !state.student) await loadStudent();
    if (session && state.student) {
      const day = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
      if (lsGet("t:acct-touch", "") !== day) {
        const t = await call("redeem-code", { action: "touch", device_id: device }, true);
        if (t.ok) { lsSet("t:acct-touch", day); state.student.streak = t.streak; state.student.streak_best = t.streak_best; }
        else if (t.status === 403 || t.status === 401) await logout();
      }
    }
    emit();
    return state;
  }

  const confirmName = () => call("redeem-code", { action: "confirm_name" }, true).then((r) => { if (r.ok && state.student) state.student.name_confirmed = true; emit(); return r; });
  const fixName = (name) => call("redeem-code", { action: "fix_name", name }, true);
  const linkTelegram = () => call("redeem-code", { action: "tg_link_token" }, true);   // مطفي لحد settings.tg_link.on
  async function logout() {
    // الخروج ما يفضّي مكان الجهاز (حتى ما ينتشر الكود بخروج/دخول). تصفير الأجهزة من الإدارة بس.
    try { const c = await client(); await c.auth.signOut({ scope: "local" }); } catch (e) {}
    state.session = null; state.student = null; state.cache = {};
    try { localStorage.removeItem("t:acct-touch"); } catch (e) {}
    emit();
  }

  // ── المزامنة: student_state (صف لكل مفتاح) ──
  async function pull() {
    if (!state.student) return state.cache;
    const c = await client();
    const { data } = await c.from("student_state").select("key, value, updated_at");
    (data || []).forEach((r) => { state.cache[r.key] = r.value; });
    return state.cache;
  }
  const get = (key) => state.cache[key];
  const timers = {};
  /** يحفظ (بعد 1.5 ثانية من آخر تعديل، حتى ما تكثر الطلبات). */
  function put(key, value) {
    if (!KEYS.includes(key)) throw new Error("unknown key " + key);
    state.cache[key] = value;
    if (!state.student) return Promise.resolve(false);
    clearTimeout(timers[key]);
    return new Promise((ok) => {
      timers[key] = setTimeout(async () => {
        const c = await client();
        const { error } = await c.from("student_state").upsert({ student_id: state.student.id, key, value });
        ok(!error);
      }, 1500);
    });
  }

  // ── أول دخول: t:progress / t:mistakes / t:favs ← الحساب (دمج: اللي بالحساب يبقى، والمحلي يكمّل الناقص) ──
  async function migrateLocal() {
    if (!state.student) return;
    // 🔄 مساحتي (29/10): إذا sync.js محمّل هو اللي يدمج بيانات الجهاز (أحدث وبلا ضياع)؛ وإذا بيانات الجهاز لطالب ثاني ما ننقلها لحساب هذا
    if (window.Sync) return;
    const owner = lsGet("t:sync:owner", null);
    if (owner && owner !== state.student.id) return;
    const flag = "t:acct-migrated:" + state.student.id;
    if (lsGet(flag, false)) return;
    await pull();
    const c = await client();
    for (const [key, lk] of Object.entries(LOCAL)) {
      const local = lsGet(lk, null);
      if (!local || typeof local !== "object" || !Object.keys(local).length) continue;
      const remote = state.cache[key] && typeof state.cache[key] === "object" ? state.cache[key] : {};
      const merged = { ...local, ...remote };
      const { error } = await c.from("student_state").upsert({ student_id: state.student.id, key, value: merged });
      if (!error) state.cache[key] = merged;
      else return;   // نعيد المحاولة الدخول الجاي
    }
    lsSet(flag, true);
  }

  // ── واجهة صغيرة (مثل المعاينة /preview/login/) ──
  function mountLogin(el, opts = {}) {
    el.innerHTML = `<div class="gate"><h1>🎓 دخول طلاب المرحلة الثانية</h1>
      <p class="sub">أدخل الكود اللي وصلك من محمد الموسوي. مرة وحدة بس، وبعدها الموقع يتذكّرك ويرجعك لنفس المكان.</p>
      <input id="acct-code" aria-label="الكود" placeholder="RAD-XXXX-XXXX" dir="ltr" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false">
      <button type="button" class="cbtn" id="acct-go">دخول</button>
      <p class="sub" id="acct-msg" role="status" aria-live="polite"></p>
      <p class="sub">أو افتح الرابط اللي وصلك (بيه الكود جاهز). الكود يشتغل على 3 أجهزة بالكثير.</p></div>`;
    const inp = el.querySelector("#acct-code"), btn = el.querySelector("#acct-go"), msg = el.querySelector("#acct-msg");
    const go = async () => {
      btn.disabled = true; msg.textContent = "…";
      const r = await redeem(inp.value);
      btn.disabled = false;
      if (!r.ok) { msg.textContent = r.msg; return; }
      msg.textContent = "";
      if (!r.name_confirmed) mountNameCheck(el, opts); else if (opts.done) opts.done(state);
    };
    btn.onclick = go;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }
  function mountNameCheck(el, opts = {}) {
    const n = state.student ? state.student.full_name : "";
    el.innerHTML = `<div class="gate"><h1>أهلاً ${esc(n.split(" ")[0])} 👋</h1>
      <p>هذا اسمك؟ <b>${esc(n)}</b></p>
      <button type="button" class="cbtn" id="acct-yes">✅ نعم</button> <button type="button" class="cbtn alt" id="acct-fix">✏️ صحّح اسمي</button>
      <div id="acct-fixbox" hidden><input id="acct-name" aria-label="اسمك الثلاثي الصحيح" value="${esc(n)}"><button type="button" class="cbtn" id="acct-send">أرسل</button></div>
      <p class="sub" id="acct-msg" role="status" aria-live="polite"></p></div>`;
    const msg = el.querySelector("#acct-msg");
    el.querySelector("#acct-yes").onclick = async () => { await confirmName(); if (opts.done) opts.done(state); };
    el.querySelector("#acct-fix").onclick = () => { el.querySelector("#acct-fixbox").hidden = false; el.querySelector("#acct-name").focus(); };
    el.querySelector("#acct-send").onclick = async () => {
      const r = await fixName(el.querySelector("#acct-name").value);
      msg.textContent = r.msg || (r.ok ? "وصل طلبك." : "صار خطأ.");
      if (r.ok && opts.done) setTimeout(() => opts.done(state), 1200);
    };
  }

  window.Account = {
    state, device, ready, redeem, confirmName, fixName, logout, linkTelegram, pull, get, put,
    mountLogin, mountNameCheck, on: (f) => { subs.add(f); return () => subs.delete(f); },
    token: () => (state.session ? state.session.access_token : null),   // للمساعد لما تنفتح البوابة
  };
})();
