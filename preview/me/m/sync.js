// ☁️ مزامنة «مساحتي» ويّا حساب الطالب (29/10/2026 — نايمة: بس /preview/؛ ما تنحمّل بأي صفحة حيّة لحد «وافقت» + «فعّل البوابة»).
// أوف لاين أولاً: كلشي ينكتب بجهاز الطالب (localStorage) أول، والمزامنة تشتغل بس إذا الطالب مسجّل دخول (window.Account).
// الزائر: ما ينرسل أي شي، وما ينحمّل أي ملف زايد.
// القواعد حتى ماكو شي يضيع:
//  · المجموعات (ملاحظات، أخطائي، المفضلة، نتائج الاختبارات، المصطلحات، التفضيلات): دمج عنصر بعنصر — كل عنصر بختم وقت تعديله،
//    الأحدث يغلب، والممسوح ينحفظ «شاهد مسح» (tombstone) حتى ما يرجع من جهاز ثاني. نتائج الاختبار: الأعلى يبقى (best = max).
//  · التقدّم (track): كل جهاز بخانته (ما يتعارضون أبداً)، والعرض يجمع كل الأجهزة.
//  · الخطة: نفس الخطة ← الأحدث يغلب بس علامات ✅ تندمج؛ خطة ثانية ← الأحدث يغلب والقديمة تنحفظ بـ prev.
//  · الكتابة بالسحابة «قارن وبدّل» (updated_at): إذا جهاز ثاني كتب بنفس اللحظة نعيد القراءة والدمج — ماكو كتابة تمسح كتابة.
//  · ⏰ التذكيرات: جدول reminders (client_id ثابت ← ماكو تكرار حتى لو انعادت المحاولة).
//  · طالب ثاني دخل بنفس الجهاز: بيانات الأول تنشال على جنب (t:stash:<id>) وترجع إذا رجع هو — ما تندمج بحساب غيره.
// الجزء الصافي (merge*, engine) يشتغل بـ node للاختبارات (tests/sync.test.js).
(function (root, factory) {
  const S = factory();
  if (typeof module === "object" && module.exports) module.exports = S; else root.Sync = S;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const DEL_KEEP = 400 * 864e5;   // شاهد المسح يبقى 400 يوم

  // ── أدوات ──
  const canon = (v) => {
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
    return JSON.stringify(v === undefined ? null : v);
  };
  const hash = (v) => { const s = canon(v); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + "." + s.length.toString(36); };
  const same = (a, b) => canon(a) === canon(b);
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  const num = (x) => (Number.isFinite(+x) ? +x : 0);

  // ── المجموعات: {v:2, items:{id:[stamp, value]}, del:{id:stamp}} ──
  // أي قيمة قديمة بالسحابة (خريطة عادية من account.js، أو مصفوفة) تتحوّل بدون ما يضيع شي
  function asDoc(x, ts = () => 0, idOf = (v) => v && v.id) {
    const d = { v: 2, items: {}, del: {} };
    if (!x) return d;
    if (Array.isArray(x)) { x.forEach((v) => { const id = idOf(v); if (id != null) d.items[String(id)] = [num(ts(v)) || 1, v]; }); return d; }
    if (!isObj(x)) return d;
    if (x.v === 2 && isObj(x.items)) {
      for (const id in x.items) { const it = x.items[id]; if (Array.isArray(it) && it.length === 2) d.items[id] = [num(it[0]), it[1]]; }
      if (isObj(x.del)) for (const id in x.del) d.del[id] = num(x.del[id]);
    }
    for (const k in x) if (!(x.v === 2 && (k === "v" || k === "items" || k === "del")) && !d.items[k]) d.items[k] = [num(ts(x[k])) || 1, x[k]];   // خليط/قديم
    return d;
  }
  function mergeKeyed(a, b, combine, now = Date.now()) {
    a = a || { items: {}, del: {} }; b = b || { items: {}, del: {} };
    const out = { v: 2, items: {}, del: {} };
    const dels = Object.assign({}, a.del);
    for (const id in b.del || {}) dels[id] = Math.max(num(dels[id]), num(b.del[id]));
    const ids = [...new Set(Object.keys(a.items || {}).concat(Object.keys(b.items || {})))].sort();
    for (const id of ids) {
      const A = (a.items || {})[id], B = (b.items || {})[id];
      let w;
      if (A && B) {
        if (combine) w = [Math.max(A[0], B[0]), combine(A[1], B[1])];
        else w = A[0] > B[0] ? A : B[0] > A[0] ? B : (hash(A[1]) >= hash(B[1]) ? A : B);   // تعادل ← نفس النتيجة بكل الأجهزة
      } else w = A || B;
      const d = dels[id];
      if (d != null && d >= w[0]) continue;          // انمسح بعد آخر تعديل
      if (d != null) delete dels[id];                // تعدّل بعد المسح ← يرجع
      out.items[id] = [w[0], w[1]];
    }
    for (const id of Object.keys(dels).sort()) if (now - dels[id] < DEL_KEEP && !out.items[id]) out.del[id] = dels[id];
    return out;
  }

  // ── الخطة: {v:2, s, plan, prev} ──
  const planId = (p) => (p ? p.pid || `${p.made || ""}|${p.first || ""}` : null);
  const mergeDone = (x = {}, y = {}) => { const o = Object.assign({}, x); for (const k in y) if (o[k] == null || Math.abs(num(y[k])) > Math.abs(num(o[k]))) o[k] = y[k]; return o; };   // ✅ بالموجب، إلغاء ✅ بالسالب؛ الأحدث يغلب
  const slim = (p) => { if (!p) return null; const q = Object.assign({}, p); delete q._lectures; return q; };
  function asPlanDoc(x) {
    if (!x) return { v: 2, s: 0, plan: null, prev: null };
    if (x.v === 2 && "plan" in x) return { v: 2, s: num(x.s), plan: x.plan || null, prev: x.prev || null };
    if (x.v === 1 && Array.isArray(x.days)) return { v: 2, s: 1, plan: x, prev: null };   // خطة قديمة مباشرة
    return { v: 2, s: 0, plan: null, prev: null };
  }
  function mergePlan(a, b) {
    a = asPlanDoc(a); b = asPlanDoc(b);
    if (!a.plan && !b.plan) return { v: 2, s: Math.max(a.s, b.s), plan: null, prev: a.prev || b.prev };
    if (!a.plan) return b; if (!b.plan) return a;
    const [w, l] = a.s > b.s || (a.s === b.s && hash(a.plan) >= hash(b.plan)) ? [a, b] : [b, a];
    if (planId(w.plan) === planId(l.plan)) {
      const plan = Object.assign({}, w.plan, { done: mergeDone(l.plan.done, w.plan.done) });
      return { v: 2, s: w.s, plan, prev: w.prev || l.prev || null };
    }
    return { v: 2, s: w.s, plan: w.plan, prev: slim(l.plan) };
  }

  // ── التقدّم: {v:2, dev:{<جهاز>:{u, st}}} — كل جهاز يكتب خانته بس ──
  function asTrackDoc(x) { const d = { v: 2, dev: {} }; if (x && x.v === 2 && isObj(x.dev)) for (const k in x.dev) if (isObj(x.dev[k])) d.dev[k] = { u: num(x.dev[k].u), st: x.dev[k].st }; return d; }
  function mergeTrack(a, b) {
    a = asTrackDoc(a); b = asTrackDoc(b);
    const out = { v: 2, dev: {} };
    for (const k of [...new Set(Object.keys(a.dev).concat(Object.keys(b.dev)))].sort()) {
      const A = a.dev[k], B = b.dev[k];
      out.dev[k] = !A ? B : !B ? A : A.u >= B.u ? A : B;
    }
    return out;
  }

  // ── المحوّلات: وين ينحفظ كل نوع بالجهاز، وشلون يندمج ──
  const byId = (arr) => { const m = {}; (Array.isArray(arr) ? arr : []).forEach((x) => { if (x && x.id != null) m[String(x.id)] = x; }); return m; };
  const map = (o) => (isObj(o) ? o : {});
  const PREFS = { last: "t:last", intent: "t:intent", exam_guess: "t:exam-guess", asked: "t:asked", tour: "t:tour", strength: "t:strength" };
  const KINDS = {
    notes: { cloud: "notes", lk: "t:notes", read: (S) => byId(S.get("t:notes", [])), write: (S, m) => S.set("t:notes", Object.values(m).sort((x, y) => num(x.t) - num(y.t))), ts: (v) => v && v.t, ev: "notes:change" },
    mistakes: { cloud: "mistakes", lk: "t:mistakes", read: (S) => map(S.get("t:mistakes", {})), write: (S, m) => S.set("t:mistakes", m), ts: (v) => v && v.t },
    favorites: { cloud: "favorites", lk: "t:favs", read: (S) => map(S.get("t:favs", {})), write: (S, m) => S.set("t:favs", m), ts: (v) => v && v.t },
    progress: { cloud: "progress", lk: "t:progress", read: (S) => map(S.get("t:progress", {})), write: (S, m) => S.set("t:progress", m), ts: (v) => v && v.t,
      combine: (x, y) => { if (!isObj(x) || !isObj(y)) return isObj(x) ? x : y; const n = num(y.t) > num(x.t) ? y : x; return Object.assign({}, n, { best: Math.max(num(x.best), num(y.best)) }); } },
    srs: { cloud: "srs", lk: "t:srs", read: (S) => map(S.get("t:srs", {})), write: (S, m) => S.set("t:srs", m), ts: () => 0 },
    prefs: { cloud: "prefs", lk: Object.values(PREFS),
      read: (S) => { const m = {}; for (const k in PREFS) { const v = S.get(PREFS[k], null); if (v != null) m[k] = v; } return m; },
      write: (S, m) => { for (const k in PREFS) if (m[k] != null) S.set(PREFS[k], m[k]); else S.del(PREFS[k]); }, ts: (v) => v && v.t },
    reminders: { cloud: null, lk: "t:reminders", read: (S) => byId(S.get("t:reminders", [])), write: (S, m) => S.set("t:reminders", Object.values(m).sort((x, y) => num(x.at) - num(y.at))), ts: (v) => v && v.t, ev: "reminders:change" },
  };
  const ALL_LOCAL = ["t:notes", "t:mistakes", "t:favs", "t:progress", "t:srs", "t:plan", "t:track", "t:track-remote", "t:reminders", ...Object.values(PREFS)];

  // ── المحرّك: S = تخزين ({get,set,del})، api = السحابة، device، now() ──
  // api: { get(key) → {value, updated_at}|null, cas(key, value, updated_at|null) → bool, rem: {list, insert, update, remove} }
  function engine({ S, api, device, now: clock = () => Date.now() }) {
    // ⏱️ ساعة الجهاز ممكن تكون غلط: الختم دائماً أكبر من أي ختم شفناه (حتى جهاز ساعته سابقة ما يغلب كل شي)
    let floor = num(S.get("t:sync:floor", 0));
    const now = () => Math.max(clock(), floor + 1);
    const see = (x) => { if (x > floor && x < clock() + 400 * 864e5) { floor = x; S.set("t:sync:floor", floor); } };
    const seeDoc = (d) => { if (!d) return; for (const id in d.items || {}) see(num(d.items[id][0])); for (const id in d.del || {}) see(num(d.del[id])); };
    const metaKey = (k) => "t:sync:" + k;
    const meta = (k) => { const m = S.get(metaKey(k), null); return isObj(m) ? { s: map(m.s), h: map(m.h), del: map(m.del), y: map(m.y) } : { s: {}, h: {}, del: {}, y: {} }; };
    // 🔎 يقارن الجهاز بآخر مرة ← أي تعديل ياخذ ختم وقته، وأي مسح يصير شاهد مسح
    function scan(k) {
      const A = KINDS[k], m = meta(k), cur = A.read(S), t = now();
      for (const id in cur) { const h = hash(cur[id]); if (m.h[id] !== h) { m.s[id] = m.h[id] == null && m.s[id] == null ? (num(A.ts(cur[id])) || t) : t; m.h[id] = h; delete m.del[id]; } }
      for (const id in m.s) if (!(id in cur)) { m.del[id] = t; delete m.s[id]; delete m.h[id]; }
      S.set(metaKey(k), m); return { m, cur };
    }
    const localDoc = (k) => { const { m, cur } = scan(k); const d = { v: 2, items: {}, del: Object.assign({}, m.del) }; for (const id in cur) d.items[id] = [m.s[id], cur[id]]; return d; };
    function apply(k, doc, keepY) {
      const A = KINDS[k], before = A.read(S), out = {}, m = meta(k);
      for (const id in doc.items) out[id] = doc.items[id][1];
      const nm = { s: {}, h: {}, del: Object.assign({}, doc.del), y: keepY ? m.y : {} };
      for (const id in doc.items) { nm.s[id] = doc.items[id][0]; nm.h[id] = hash(doc.items[id][1]); }
      if (!same(before, out)) A.write(S, out);
      S.set(metaKey(k), nm);
      return !same(before, out);
    }
    async function keyed(k) {
      const A = KINDS[k];
      for (let i = 0; i < 5; i++) {
        const row = await api.get(A.cloud);
        const remote = asDoc(row && row.value, A.ts); seeDoc(remote);
        const merged = mergeKeyed(localDoc(k), remote, A.combine, now());
        if (!row || !same(merged, row.value)) { if (!(await api.cas(A.cloud, merged, row ? row.updated_at : null))) continue; }
        // نطبّق بنفس اللحظة: أي تعديل صار وإحنا ننتظر الشبكة ينضم (ما ينمسح)
        const fin = mergeKeyed(merged, localDoc(k), A.combine, now());
        const changed = apply(k, fin);
        return { changed, again: !same(fin, merged) };
      }
      throw new Error("busy");
    }
    async function plan() {
      const m = meta("plan"), cur = S.get("t:plan", null), h = hash(cur);
      if (m.h.p !== h) { m.h.p = h; m.s.p = cur && m.s.p == null ? (Date.parse(cur.made || "") || 1) : now(); S.set(metaKey("plan"), m); }
      const light = (p) => (p && Array.isArray(p._lectures) ? Object.assign({}, p, { _lectures: p._lectures.map((l) => Object.assign({}, l, { questions: Array.isArray(l.questions) ? l.questions.length : l.questions })) }) : p);
      const local = { v: 2, s: num(m.s.p), plan: light(cur), prev: S.get("t:plan-prev", null) };
      for (let i = 0; i < 5; i++) {
        const row = await api.get("plan");
        if (row && row.value) see(num(row.value.s));
        const merged = mergePlan(local, row && row.value);
        if (!row || !same(merged, row.value)) { if (!(await api.cas("plan", merged, row ? row.updated_at : null))) continue; }
        const fresh = S.get("t:plan", null);
        const fin = hash(fresh) === h ? merged : mergePlan(merged, { v: 2, s: now(), plan: light(fresh), prev: null });   // اتعدّلت وإحنا ننتظر
        const changed = !same(light(fresh), fin.plan);
        if (changed && fin.plan) { const keepL = fresh && fin.plan && planId(fresh) === planId(fin.plan) && fresh._lectures ? fresh._lectures : null; S.set("t:plan", keepL && !fin.plan._lectures ? Object.assign({}, fin.plan, { _lectures: keepL }) : fin.plan); }
        if (fin.prev) S.set("t:plan-prev", fin.prev);
        S.set(metaKey("plan"), { s: { p: fin.s }, h: { p: hash(S.get("t:plan", null)) }, del: {}, y: {} });
        return { changed, again: fin !== merged };
      }
      throw new Error("busy");
    }
    async function track() {
      const m = meta("track"), own = S.get("t:track", null), h = hash(own);
      if (m.h.t !== h) { m.h.t = h; m.s.t = now(); S.set(metaKey("track"), m); }
      for (let i = 0; i < 5; i++) {
        const row = await api.get("track");
        const remote = asTrackDoc(row && row.value);
        const mine = own ? { u: num(m.s.t), st: own } : remote.dev[device];
        const local = { v: 2, dev: mine ? { [device]: mine } : {} };
        const merged = mergeTrack(local, remote);
        if (!row || !same(merged, row.value)) { if (!(await api.cas("track", merged, row ? row.updated_at : null))) continue; }
        const others = {}; for (const k in merged.dev) if (k !== device) others[k] = merged.dev[k].st;
        const before = S.get("t:track-remote", {}), changed = !same(before, others);
        if (changed) S.set("t:track-remote", others);
        if (!own && remote.dev[device]) S.set("t:track", remote.dev[device].st);   // نفس الجهاز بعد تنظيف ← يرجع تقدّمه
        return { changed: changed || (!own && !!remote.dev[device]), again: false };
      }
      throw new Error("busy");
    }
    // ⏰ التذكيرات ↔ جدول reminders
    const cid = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "x";
    const rowToLocal = (r, old = {}) => Object.assign({}, old, { id: old.id || r.client_id || "s" + r.id, t: old.t || Date.parse(r.updated_at) || now(), at: Date.parse(r.at), text: r.text, done: !!(r.done || r.sent) });
    async function reminders() {
      const { m, cur } = scan("reminders");
      const rows = await api.rem.list();
      const byC = {}; rows.forEach((r) => { byC[r.client_id || "s" + r.id] = r; });
      const out = Object.assign({}, cur); let changed = false, partial = false;
      for (const id in cur) {
        const r = cur[id], row = byC[cid(id)], edited = m.y[id] == null || num(m.s[id]) > num(m.y[id]);
        if (!row) {
          if (m.y[id] != null && !edited) { delete out[id]; changed = true; continue; }   // انمسح من جهاز ثاني
          const ok = await api.rem.insert({ client_id: cid(id), at: new Date(num(r.at)).toISOString(), text: String(r.text || "📚").slice(0, 300), done: !!r.done });
          if (ok) m.y[id] = m.s[id]; else partial = true;
        } else if (edited) {
          const want = { at: new Date(num(r.at)).toISOString(), text: String(r.text || "📚").slice(0, 300), done: !!r.done };
          if (Date.parse(row.at) !== num(r.at) || row.text !== want.text || !!row.done !== want.done) { if (!(await api.rem.update(row.id, want))) { partial = true; continue; } }
          m.y[id] = m.s[id];
        } else {
          const nv = rowToLocal(row, r);
          if (!same(nv, r)) { out[id] = nv; changed = true; }
          m.y[id] = m.s[id];
        }
      }
      for (const id in m.del) { const row = byC[cid(id)]; if (row) { if (await api.rem.remove(row.id)) delete byC[cid(id)]; else partial = true; } delete m.y[id]; }
      for (const c in byC) {
        if (Object.keys(cur).some((id) => cid(id) === c) || m.del[c] != null) continue;
        const nv = rowToLocal(byC[c]); out[nv.id] = nv; changed = true;
      }
      if (changed) KINDS.reminders.write(S, out);
      // الختم: اللي جاي من السحابة ما ينحسب «تعديل محلي»
      const nm = { s: {}, h: {}, del: m.del, y: {} };
      for (const id in out) { nm.h[id] = hash(out[id]); nm.s[id] = m.s[id] != null ? m.s[id] : now(); if (m.y[id] != null) nm.y[id] = m.y[id]; if (out[id] !== cur[id]) nm.y[id] = nm.s[id]; }   // ما انرفع (بلا نت) ← يبقى «مو مرفوع» ويتعاد
      S.set(metaKey("reminders"), nm);
      return { changed, again: false, partial };
    }
    async function all(only) {
      const res = {}, list = only || ["notes", "mistakes", "favorites", "progress", "srs", "prefs", "plan", "track", "reminders"];
      let err = null;
      for (const k of list) {   // كل نوع لحاله: إذا واحد فشل (مثلاً كبير هواية) الباقي يكمّل
        try { res[k] = await (k === "plan" ? plan() : k === "track" ? track() : k === "reminders" ? reminders() : keyed(k)); }
        catch (e) { if (e instanceof TypeError || e.name === "AbortError" || e.message === "auth") throw e; err = err || e; res[k] = { changed: false, again: false, partial: true, err: e.message }; }
      }
      if (err && Object.values(res).every((x) => x.err)) throw err;
      return res;
    }
    return { scan: (k) => scan(k).m, all, keyed, plan, track, reminders };
  }

  // ── طالب ثاني بنفس الجهاز: نشيل بيانات الأول على جنب (ما تنمسح) ونرجعها إذا رجع ──
  const OWN_KEYS = () => ALL_LOCAL.concat(Object.keys(KINDS).concat(["plan", "track"]).map((k) => "t:sync:" + k), ["t:plan-prev", "t:sync:floor"]);
  const PREFER_STASH = /^t:(track|track-remote|plan|plan-prev|sync:.*)$/;   // هذني خانة الطالب نفسه ← نسخته تغلب
  function mergeRaw(k, a, b) {   // a = المحفوظ على جنب، b = اللي بالجهاز هسه (زائر) ← ماكو شي يضيع
    if (a == null) return b; if (b == null || PREFER_STASH.test(k)) return a;
    try {
      const x = JSON.parse(a), y = JSON.parse(b);
      if (Array.isArray(x) && Array.isArray(y)) { const m = byId(x); y.forEach((v) => { if (v && v.id != null) m[String(v.id)] = v; }); return JSON.stringify(Object.values(m)); }
      if (isObj(x) && isObj(y)) return JSON.stringify(Object.assign({}, x, y));
    } catch (e) {}
    return b;
  }
  // يشيل بيانات الطالب الحالي على جنب (t:stash:<id>) ويفضّي الجهاز. ما يمسح شي إلا بعد ما يتأكد إن النسخة انحفظت.
  function stashOut(S, raw) {
    const owner = S.get("t:sync:owner", null); if (!owner) return false;
    const keys = OWN_KEYS(), box = {};
    keys.forEach((k) => { const v = raw.get(k); if (v != null) box[k] = v; });
    const old = raw.get("t:stash:" + owner);
    if (old) try { const o = JSON.parse(old); for (const k in o) box[k] = mergeRaw(k, o[k], box[k]); } catch (e) {}
    const str = JSON.stringify(box);
    raw.setStrict("t:stash:" + owner, str);
    if (raw.get("t:stash:" + owner) !== str) throw new Error("stash");
    keys.forEach((k) => raw.del(k)); raw.del("t:sync:owner");
    return true;
  }
  // طالب ثاني بنفس الجهاز: نشيل بيانات الأول على جنب (ما تنمسح) ونرجعها إذا رجع
  function switchOwner(S, sid, raw) {
    const owner = S.get("t:sync:owner", null);
    if (owner === sid) return "same";
    if (owner) stashOut(S, raw);   // إذا ما انحفظت النسخة ← يرمي خطأ وما يمسح شي
    const mine = raw.get("t:stash:" + sid);
    if (mine) { try { const box = JSON.parse(mine); for (const k in box) raw.set(k, mergeRaw(k, box[k], raw.get(k))); } catch (e) {} raw.del("t:stash:" + sid); }
    S.set("t:sync:owner", sid);
    return owner ? "switched" : mine ? "restored" : "adopted";   // adopted = بيانات الزائر بهالجهاز تنضم لحسابه (أول دخول)
  }

  // ── المتصفح ──
  const state = { mode: "local", st: "idle", at: 0, msg: "" };
  let eng = null, running = false, queued = false, tmr = 0;
  const LSraw = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    setStrict(k, v) { localStorage.setItem(k, v); },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const LS = {
    get(k, d) { const v = LSraw.get(k); if (v == null) return d; try { return JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { throw new Error("quota"); } },
    del: LSraw.del,
  };
  const emit = (n, d) => { if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent(n, { detail: d })); };
  const status = (st, msg = "") => { state.st = st; state.msg = msg; if (st === "ok") state.at = Date.now(); emit("sync:status", Object.assign({}, state)); };

  function restApi(A) {
    const C = (typeof window !== "undefined" && window.STUDY_CLOUD) || {};
    const sid = () => A.state.student && A.state.student.id;
    const call = async (path, o = {}) => {   // o.soft ← 403 = «ما مسموح هالصف» (مثلاً حد التذكيرات)، مو انتهاء جلسة
      const tok = A.token && A.token(); if (!tok || !sid()) throw new Error("auth");
      const ac = typeof AbortController === "function" ? new AbortController() : null, to = ac && setTimeout(() => ac.abort(), 20000);   // طلب معلّق ← نوقفه ونعيد بعدين
      const r = await fetch(`${C.url}/rest/v1/${path}`, { method: o.method || "GET", cache: "no-store", signal: ac ? ac.signal : undefined,
        headers: Object.assign({ apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, o.headers || {}), body: o.body ? JSON.stringify(o.body) : undefined }).finally(() => clearTimeout(to));
      if (r.status === 401 || (r.status === 403 && !o.soft)) { const e = new Error("auth"); e.status = r.status; throw e; }
      return r;
    };
    const rows = async (r) => { if (!r.ok && r.status !== 409) { const e = new Error("http " + r.status); e.status = r.status; throw e; } return r.status === 204 ? [] : r.json().catch(() => []); };
    return {
      async get(key) { const j = await rows(await call(`student_state?select=value,updated_at&student_id=eq.${sid()}&key=eq.${key}`)); return j[0] || null; },
      async cas(key, value, ts) {
        if (ts) {
          const r = await call(`student_state?student_id=eq.${sid()}&key=eq.${key}&updated_at=eq.${encodeURIComponent(ts)}`, { method: "PATCH", body: { value }, headers: { Prefer: "return=representation" } });
          if (r.status === 400 && /check|size/i.test(await r.clone().text())) throw Object.assign(new Error("big"), { status: 400 });
          return (await rows(r)).length === 1;
        }
        const r = await call("student_state", { method: "POST", body: { student_id: sid(), key, value }, headers: { Prefer: "return=minimal" } });
        if (r.status === 409) return false;   // جهاز ثاني سبقنا ← نعيد القراءة والدمج
        if (r.status === 400 && /check|size/i.test(await r.clone().text())) throw Object.assign(new Error("big"), { status: 400 });
        if (!r.ok) { const e = new Error("http " + r.status); e.status = r.status; throw e; }
        return true;
      },
      rem: {
        list: async () => rows(await call(`reminders?select=id,client_id,at,text,done,sent,updated_at&student_id=eq.${sid()}&order=at`)),
        async insert(x) { const r = await call("reminders", { soft: true, method: "POST", body: Object.assign({ student_id: sid(), channels: ["web"] }, x), headers: { Prefer: "return=minimal" } }); return r.ok || r.status === 409; },
        async update(id, x) { const r = await call(`reminders?id=eq.${+id}`, { method: "PATCH", body: x }); return r.ok; },
        async remove(id) { const r = await call(`reminders?id=eq.${+id}`, { method: "DELETE" }); return r.ok; },
      },
    };
  }

  let waiters = [];
  // جولة وحدة بنفس الوقت. اللي يطلب وإحنا شغالين ينتظر الجولة الجاية (بلا سلسلة تعيد نفسها)
  function run(why) {
    if (!eng) return Promise.resolve(state);
    if (running) { queued = true; return new Promise((r) => waiters.push(r)); }
    running = true; status("syncing");
    return once();
  }
  async function once() {
    try {
      const res = await eng.all();
      const ch = Object.keys(res).filter((k) => res[k].changed);
      if (ch.length) emit("sync:applied", { kinds: ch });
      status(Object.values(res).some((x) => x.err === "big") ? "big" : Object.values(res).some((x) => x.partial) ? "partial" : "ok");
      if (Object.values(res).some((x) => x.again)) queued = true;
    } catch (e) {
      const off = (typeof navigator !== "undefined" && navigator.onLine === false) || e instanceof TypeError || e.name === "AbortError";
      status(off ? "offline" : e.message === "auth" ? "auth" : e.message === "big" ? "big" : "error");
    } finally {
      running = false;
      const w = waiters; waiters = [];
      if (queued) { queued = false; if (w.length) run().then(() => w.forEach((f) => f(state))); else schedule(1500); }
      else w.forEach((f) => f(state));
    }
    return state;
  }
  const schedule = (ms = 2000) => { clearTimeout(tmr); tmr = setTimeout(run, ms); };

  async function start(opts = {}) {
    if (typeof window === "undefined" || start.on) return state; start.on = true;
    const A = opts.account || window.Account;
    const hasSession = !!LSraw.get("t:acct-session");
    if (A && A.state && !start.hooked) {
      start.hooked = true;
      // خروج صريح ← بيانات الطالب تنشال على جنب بهالجهاز (الجاي ما يشوفها، وترجعله إذا دخل)
      if (typeof A.logout === "function") { const lo = A.logout; A.logout = async function () { const r = await lo.apply(this, arguments); try { stashOut(LS, LSraw); emit("sync:applied", { kinds: ["all"] }); } catch (e) {} return r; }; }
      // طالب ثاني دخل بنفس الجهاز ← قبل أي رفع، نشيل بيانات الأول على جنب
      A.on && A.on((st) => { const o = LS.get("t:sync:owner", null); if (st.student && o && o !== st.student.id) { try { switchOwner(LS, st.student.id, LSraw); emit("sync:applied", { kinds: ["all"] }); } catch (e) {} } });
    }
    // الزائر (أو ماكو حسابات): ولا طلب واحد للشبكة
    if (!A || !A.state || !A.state.on || !hasSession) { state.mode = "local"; status("local"); return state; }
    try { await A.ready(); } catch (e) {}
    if (!A.state.student) { state.mode = "local"; status("local"); return state; }
    let sw;
    try { sw = switchOwner(LS, A.state.student.id, LSraw); }
    catch (e) { state.mode = "local"; status("error", "stash"); return state; }   // ما گدرنا نحفظ بيانات الطالب السابق ← ما نخلط ولا نمسح
    if (sw === "switched" || sw === "restored") emit("sync:applied", { kinds: ["all"] });
    state.mode = "cloud";
    eng = engine({ S: LS, api: restApi(A), device: LS.get("t:device", null) || LSraw.get("t:device") || "dev" });
    ["notes:change", "plan:change", "track:change", "reminders:change", "quiz:finish"].forEach((n) => document.addEventListener(n, () => schedule(2000)));
    addEventListener("storage", (e) => { if (e.key && /^t:(notes|plan|track|reminders|mistakes|favs|progress|srs|last)$/.test(e.key)) schedule(2000); });
    addEventListener("online", () => schedule(300));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") schedule(500); });
    setInterval(() => { if (document.visibilityState === "visible") run(); }, 60e3);
    A.on && A.on((s) => { if (!s.student && state.mode === "cloud") { state.mode = "local"; eng = null; status("local"); } });
    await run();
    return state;
  }

  // سطر الحالة (نص بسيط للواجهة)
  function label(s = state) {
    const t = s.at ? new Date(s.at) : null, hm = t ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}` : "";
    if (s.mode !== "cloud") return "📱 محفوظة بهالجهاز بس. سجّل دخول بكودك حتى تنحفظ بحسابك وتشوفها بأي جهاز.";
    return { syncing: "☁️ دنحفظ بحسابك…", ok: `☁️ محفوظة بحسابك · آخر حفظ ${hm}`, offline: "📴 ماكو نت هسه. كلشي محفوظ بهالجهاز، وينحفظ بحسابك أول ما يرجع النت.",
      partial: "☁️ أغلبها انحفظ بحسابك، والباقي نعيد المحاولة وحدنا.", auth: "🔑 انتهت جلستك. سجّل دخول مرة ثانية، وبياناتك محفوظة بهالجهاز.",
      big: "⚠️ ملاحظاتك كثيرة هواية، ما گدرنا نحفظ كلها بالحساب. هي محفوظة بهالجهاز.", error: "⚠️ ما گدرنا نحفظ بالحساب هسه. نعيد المحاولة وحدنا، وكلشي محفوظ بهالجهاز.", idle: "" }[s.st] || "";
  }

  return { canon, hash, same, asDoc, mergeKeyed, mergePlan, mergeDone, asPlanDoc, mergeTrack, asTrackDoc, KINDS, engine, switchOwner, stashOut, mergeRaw,
    start, run, state, label, status: () => Object.assign({}, state) };
});
