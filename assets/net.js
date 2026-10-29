// 📡 net.js (29/10/2026) — طبقة طلبات Supabase مشتركة: أقل طلبات، كاش بمدة، ولا طلب بلا نت.
// يتحمّل بعد cloud-config.js وقبل cloud.js / nextexam.js / smart.js / thanks.js / tools.js (مو موصول لحد الدمج).
//   Net.get(table, query, ttlMs)  ← GET مع كاش localStorage (نفس الطلب بكل الصفحات = طلب واحد كل ttl)
//   Net.settings()                ← جدول settings كامل مرة كل 10 دقايق (بدل طلبين بكل صفحة: cloud.js + nextexam.js)
//   Net.log(kind, page, ref)      ← الزيارات تتجمّع وتنرسل دفعة وحدة (كل 30 ثانية، أو لما تتسكّر الصفحة) — bulk insert
//   Net.post(table, row)          ← إدخال فوري (أجوبة، بلاغات) — وبلا نت ينحفظ بالطابور وينرسل بعدين
// بلا نت: GET يرجّع آخر نسخة محفوظة (حتى لو قديمة) أو [] ؛ والإدخالات تنتظر بالطابور (حد أقصى 200).
(function () {
  if (window.Net) return;
  const C = window.STUDY_CLOUD || {};
  const ON = !!(C.url && C.anon);
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon, "Content-Type": "application/json" };
  const QK = "t:netq", FLUSH_MS = 30e3, QMAX = 200;
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const online = () => navigator.onLine !== false;
  // 🔒 M6 (29/10): أي رابط ينحفظ (page/quiz/ref) بلا ?code= ?token= ?k= … (حتى لو الصفحة نست تشيلها)
  const SECRET_QS = /^(code|token|k|token_hash|access_token|refresh_token)$/i;
  const clean = (u) => { const s = String(u), h = s.indexOf("#"), body = h < 0 ? s : s.slice(0, h), hash = h < 0 ? "" : s.slice(h), i = body.indexOf("?");
    if (i < 0) return s;
    const kept = body.slice(i + 1).split("&").filter((x) => x && !SECRET_QS.test(x.split("=")[0]));
    return body.slice(0, i) + (kept.length ? "?" + kept.join("&") : "") + hash; };
  const scrub = (row) => { if (row && typeof row === "object") for (const f of ["page", "quiz", "ref"]) if (typeof row[f] === "string") row[f] = clean(row[f]); return row; };
  // L6: 401/403 متكرر (مفتاح أو سياسة تغيّرت) ← نوقف الإرسال لهاي الجلسة (الصفوف تبقى بالطابور)، بدل كل 30 ث للأبد
  let authFails = 0;
  // ⚡ (30/10 السرعة) أول طلب لـ Supabase (بلا كاش) يبدي بعد ما تكمل الصفحة (load + وقت فراغ، أقصاه ~1 ث)، مو بطريق أول رسم.
  //    أي لمسة أو زر قبلها ← يبدي فوراً. الكاش (الزيارات اللي بعدها) يرجع فوراً مثل قبل.
  let loadedP = null;
  const afterLoad = () => loadedP || (loadedP = new Promise((res) => {
    let done = false; const go = () => { if (!done) { done = true; res(); } };
    const idleGo = () => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1000 }) : setTimeout(go, 150));
    if (document.readyState === "complete") idleGo(); else addEventListener("load", idleGo, { once: true });
    ["pointerdown", "keydown", "touchstart"].forEach((t) => addEventListener(t, go, { once: true, passive: true, capture: true }));
  }));
  const inflight = new Map();

  function get(table, query, ttl = 10 * 60e3) {
    if (!ON) return Promise.resolve([]);
    const key = "t:c:" + table + "?" + query, c = ls.get(key);
    if (c && (Date.now() - c.at < ttl || !online())) return Promise.resolve(c.v);
    if (inflight.has(key)) return inflight.get(key);
    const p = afterLoad().then(() => fetch(`${C.url}/rest/v1/${table}?${query}`, { headers: H }))
      .then((r) => { if (!r.ok) throw r.status; return r.json(); })
      .then((v) => { ls.set(key, { at: Date.now(), v }); return v; })
      .catch(() => (c ? c.v : []))
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  }

  const settings = () => get("settings", "select=key,value", 10 * 60e3)
    .then((rows) => Object.fromEntries((rows || []).map((r) => [r.key, r.value])));

  // ── الطابور: {t: table, r: row} ──
  const q = () => ls.get(QK) || [];
  const save = (x) => ls.set(QK, x.slice(-QMAX));
  function push(table, row) { const x = q(); x.push({ t: table, r: scrub(row) }); save(x); }

  // إعادة المحاولة: الشبكة، 5xx، 408/425/429 (ضغط امتحانات)، 401/403 (مفتاح/صلاحية) ← الصف يبقى بالطابور.
  // 400/409/422 = صف غلط ← ينحذف (حتى ما يعلّق الطابور للأبد)؛ وإذا الدفعة بيها أكثر من صف نجرّب كل صف وحده مرة.
  const retry = (st) => st >= 500 || [401, 403, 408, 425, 429].includes(st);
  const send = (t, rows, ka) => fetch(`${C.url}/rest/v1/${t}`, { method: "POST", keepalive: ka, headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(Array.isArray(rows) ? rows.map(scrub) : scrub(rows)) })
    .then((r) => { if (r.status === 401 || r.status === 403) authFails++; else if (r.ok) authFails = 0; return r.ok ? 0 : r.status; }, () => -1);   // -1 = شبكة/إلغاء
  const KA_MAX = 60e3;                                         // حد keepalive (64 KB) بهامش
  function chunks(rows) {
    const out = []; let cur = [], size = 2;
    for (const r of rows) { const n = JSON.stringify(r).length * 3 + 1;   // ×3: الحروف العربية بـ UTF-8
      if (cur.length && size + n > KA_MAX) { out.push(cur); cur = []; size = 2; } cur.push(r); size += n; }
    if (cur.length) out.push(cur);
    return out;
  }

  let busy = false;
  async function flush() {
    if (!ON || busy || !online() || authFails >= 5) return;
    const x = q(); if (!x.length) return;
    busy = true; save([]);                                   // نفرّغ أول (حتى تبويبين ما يرسلون نفس الشي)
    const by = {};
    x.forEach((e) => (by[e.t] = by[e.t] || []).push(e.r));
    const failed = [];
    // كل الطلبات keepalive (أقل من 60 KB لكل طلب): إذا الصفحة تسكّرت بنص الإرسال، الطلب يكمل وما يضيع شي
    await Promise.all(Object.entries(by).flatMap(([t, rows]) => chunks(rows).map(async (part) => {
      const st = await send(t, part, true);
      if (!st) return;
      if (st === -1 || retry(st)) { part.forEach((r) => failed.push({ t, r })); return; }
      if (part.length > 1) for (const r of part) { const s1 = await send(t, [r], true); if (s1 === -1 || retry(s1)) failed.push({ t, r }); }
    })));
    if (failed.length) save(failed.concat(q()));
    busy = false;
  }

  function post(table, row) {
    if (!ON) return Promise.resolve();
    if (!online() || authFails >= 5) { push(table, row); return Promise.resolve(); }
    return send(table, row, false).then((st) => { if (st === -1 || retry(st)) push(table, row); });
  }

  const log = (row) => { if (ON) { push("events", row); } };

  if (ON) {
    setTimeout(() => flush(), 5e3);                           // أول دفعة بعد ما الصفحة ترتاح (ما تزاحم التحميل)
    setInterval(() => flush(), FLUSH_MS);
    addEventListener("online", () => flush());
    addEventListener("pagehide", () => flush());
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  }
  window.Net = { on: ON, get, settings, post, log, flush, afterLoad };
})();
