// 💬 «صوتك يوصل» — واجهة الطالب داخل «صفحتي» (مسودة 58، 30/10/2026). **مطفي ومخفي** لحد ما رئيس القسم يشغّله من لوحته:
//   يرسم بس إذا settings.dept_voice.on = true (نفس قراءة team.js)، أو بالمعاينة المحلية window.__VOICE_PREVIEW (localhost بس).
//   مطفي ← العنصر يبقى فارغ ومخفي (ولا حرف بالصفحة).
// الشاشات (كلها داخل نفس اللوحة، بلا صفحة جديدة): البداية (اكتب رسالة · رسائلي · تابع برقم) · النموذج · شكراً (رقم المتابعة) · رسالة (درجات ✓ ✓✓ 👁️ 🔄 ✔️ 💬).
// الخصوصية: «بدون اسم» الافتراضي · رقم المتابعة يتولّد بالجهاز (السيرفر يخزن بصمته بس) · الصورة تنعاد رسمها بـ canvas (WebP بلا EXIF/موقع) ·
//   رسائلي بهالجهاز بس (t:voice) · المتابعة ببصمات الأرقام بلا هوية · ماكو IP ولا اسم بالطلب إلا «باسمي» (من الحساب نفسه).
(function (root, factory) {
  const M = factory();
  if (typeof module === "object" && module.exports) module.exports = M; else root.VoiceBox = M;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:voice", DEV = "t:voice-dev", MAXLIST = 30;
  const KINDS = [["idea", "💡", "مقترح"], ["complaint", "📝", "شكوى"], ["opinion", "💬", "رأي"], ["thanks", "🌷", "شكر"]];
  const AREAS = [["subject", "المادة"], ["lecture", "المحاضرة"], ["services", "الخدمات"], ["dept", "القسم"], ["platform", "المنصة"], ["other", "غيره"]];
  // درجات الحالة (مثل علامات الواتساب). 👁️ بس لما الرئيس يفتح الرسالة نفسها بلوحته (السيرفر يكتبها، مو المتصفح).
  const STEPS = [["sent", "✓", "أُرسلت"], ["received", "✓✓", "وصلت لرئاسة القسم"], ["opened", "👁️", "انقرت"], ["in_progress", "🔄", "قيد المتابعة"], ["done", "✔\uFE0E", "تمت"]];   // ✔︎ بشكل نص (يتلوّن ويّا الثيم)
  const RANK = { sent: 0, received: 1, opened: 2, in_progress: 3, done: 4, declined: 4 };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = { get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const VF = () => (typeof window !== "undefined" && window.VoiceFilter) || (typeof require === "function" ? require("./voice-filter.js") : null);

  // ── منطق صافي (يتجرّب بـ node) ──
  const list = () => { const l = LS.get(KEY, []); return Array.isArray(l) ? l.filter((x) => x && x.code) : []; };
  const save = (l) => LS.set(KEY, l.slice(-MAXLIST));
  const sig = (x) => `${x.st}|${x.reply ? 1 : 0}`;
  /** يدمج نتيجة المتابعة بالقائمة المحلية. يرجّع القائمة الجديدة. */
  function merge(items, rows) {
    const by = Object.fromEntries((rows || []).map((r) => [r.code, r]));
    return items.map((x) => { const r = by[x.code]; if (!r) return x;
      return Object.assign({}, x, { st: r.status, reply: r.reply || "", day: r.day || x.day, can_reopen: !!r.can_reopen, kind: x.kind || r.kind }); });
  }
  /** 🔴 النقطة الحمرة: أي رسالة تغيّرت حالتها (أو وصلها رد) من آخر مرة فتحها الطالب. */
  const unseen = (items) => items.some((x) => x.seen !== undefined && x.seen !== sig(x));
  const markSeen = (items) => items.map((x) => Object.assign({}, x, { seen: sig(x) }));
  const step = (x) => (x.reply ? "reply" : x.st === "declined" ? "declined" : x.st);
  const label = (x) => { const s = step(x); if (s === "reply") return "💬 وصلك رد"; if (s === "declined") return "✔️ ما ممكن"; if (s === "done") return "✔️ تمت"; const f = STEPS.find((y) => y[0] === s); return f ? `${f[1]} ${f[2]}` : "✓ أُرسلت"; };
  const fmtDay = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || "")); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : ""; };
  const device = () => { let d = LS.get(DEV, ""); if (!/^[0-9a-f-]{36}$/.test(d)) { d = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()); LS.set(DEV, d); } return d; };

  // ── الصورة: إعادة رسم بـ canvas ← WebP جديد (بلا EXIF/موقع)، ≤ 300 KB ──
  async function toWebp(file, max = 300 * 1024) {
    const img = await createImageBitmap(file);
    let side = 1600, q = 0.82, blob = null;
    for (let i = 0; i < 6; i++) {
      const s = Math.min(1, side / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      blob = await new Promise((r) => c.toBlob(r, "image/webp", q));
      if (blob && blob.size <= max) break;
      side *= 0.8; q = Math.max(0.5, q - 0.08);
    }
    if (!blob || blob.size > max || blob.type !== "image/webp") throw new Error("img");
    return blob;
  }
  const b64 = (blob) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(String(f.result).split(",")[1]); f.readAsDataURL(blob); });

  let CSS = false;
  function css() {
    if (CSS || typeof document === "undefined") return; CSS = true;
    const s = document.createElement("style");
    s.textContent = `
.vb-row { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 10px 14px; margin: 0 0 12px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); color: var(--ink); font: inherit; text-align: start; cursor: pointer; }
.vb-row .i { font-size: var(--t-xl); line-height: 1; } .vb-row b { font: 700 var(--t-md) var(--title-font); display: block; } .vb-row small { color: var(--muted); font-size: var(--t-xs); }
.vb-row .go { margin-inline-start: auto; color: var(--brand); font-weight: 700; } .vb-row[aria-expanded="true"] { border-color: var(--brand); background: var(--brand-soft); }
.vb-dot { position: absolute; top: 8px; inset-inline-start: 34px; width: 12px; height: 12px; border-radius: 50%; background: var(--bad); box-shadow: 0 0 0 2px var(--card); }
.vb { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 14px; margin: 0 0 14px; }
.vb h3 { font: 800 var(--t-lg) var(--title-font); margin: 0 0 4px; } .vb .sub { color: var(--muted); font-size: var(--t-sm); margin: 4px 0; line-height: 1.7; }
.vb .lab { display: block; font: 700 var(--t-sm) var(--title-font); margin: 14px 0 6px; }
.vb .chips-row { display: flex; flex-wrap: wrap; gap: 8px; } .vb .chip2 { min-height: 44px; }
.vb .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .vb .seg .chip2 { width: 100%; }
.vb .chip2:disabled { opacity: .45; cursor: default; }
.vb select, .vb textarea, .vb input[type=text] { width: 100%; box-sizing: border-box; min-height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); font: inherit; padding: 10px 12px; }
.vb textarea { min-height: 120px; resize: vertical; line-height: 1.8; }
.vb .cnt { display: block; text-align: end; color: var(--muted); font-size: var(--t-xs); margin-top: 4px; }
.vb .note { background: var(--accent-soft); border-radius: 12px; padding: 10px 12px; font-size: var(--t-sm); line-height: 1.8; margin: 12px 0 0; }
.vb .note p { margin: 0; } .vb .note p + p { margin-top: 4px; }
.vb .file { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; } .vb .vb-pick { position: relative; min-height: 44px; cursor: pointer; }
.vb .vb-pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; } .vb .vb-pick:focus-within { outline: 2px solid var(--brand); outline-offset: 2px; }
.vb .cbtn:not(.ghost) { background: var(--brand); color: var(--brand-ink); border: 0; } .vb .cbtn.ghost { background: transparent; color: var(--brand); border: 1px solid var(--line); }
.vb .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .vb .acts .cbtn { flex: 1 1 auto; }
.vb .nudge, .vb .sos, .vb .err { border-radius: 12px; padding: 12px; margin-top: 12px; font-size: var(--t-sm); line-height: 1.8; }
.vb .nudge { background: var(--accent-soft); border: 1px solid var(--line); } .vb .err { background: var(--bad-soft); color: var(--ink); }
.vb .sos { background: var(--ok-soft); border: 1px solid var(--ok); } .vb .sos b { display: block; font-family: var(--title-font); }
.vb .code { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; background: var(--bg); border: 1px dashed var(--brand); border-radius: 14px; padding: 10px 12px; margin: 10px 0; }
.vb .code b { flex: 1 1 100%; text-align: center; font: 800 var(--t-md) ui-monospace, Menlo, monospace; direction: ltr; letter-spacing: .04em; word-break: break-all; }
.vb .ok-big { font: 800 var(--t-lg) var(--title-font); margin: 4px 0 8px; }
.vb ul.msgs { list-style: none; padding: 0; margin: 8px 0 0; } .vb ul.msgs li + li { margin-top: 8px; }
.vb .msg { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 52px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); color: var(--ink); font: inherit; padding: 8px 12px; text-align: start; cursor: pointer; }
.vb .msg small { color: var(--muted); font-size: var(--t-xs); display: block; } .vb .msg .st { font-size: var(--t-sm); font-weight: 700; color: var(--brand); white-space: nowrap; }
.vb .msg.new { border-color: var(--bad); }
.vb ol.ladder { list-style: none; padding: 0; margin: 12px 0; } .vb ol.ladder li { display: flex; align-items: center; gap: 10px; min-height: 36px; color: var(--muted); font-size: var(--t-sm); }
.vb ol.ladder li .t { width: 32px; text-align: center; } .vb ol.ladder li.on { color: var(--ink); font-weight: 700; } .vb ol.ladder li.on .t { color: var(--brand); }
.vb .reply { background: var(--brand-soft); border-radius: 12px; padding: 12px; margin-top: 8px; line-height: 1.8; } .vb .reply b { display: block; font-family: var(--title-font); margin-bottom: 4px; }
.vb .said { background: var(--ok-soft); border-radius: 12px; padding: 10px 12px; margin: 10px 0; font-size: var(--t-sm); line-height: 1.8; } .vb .said b { font-family: var(--title-font); }
.vb .track { display: flex; gap: 8px; } .vb .track input { flex: 1; min-width: 0; direction: ltr; text-transform: uppercase; } .vb .track .cbtn { flex: none; }
.vb .back { min-height: 44px; border: 0; background: none; color: var(--brand); font: 700 var(--t-sm) var(--title-font); cursor: pointer; padding: 0; }
.vb .foot { color: var(--muted); font-size: var(--t-xs); margin: 14px 0 0; text-align: center; }
.vb .preview-tag { display: inline-block; font-size: var(--t-xs); color: var(--muted); border: 1px dashed var(--line); border-radius: 999px; padding: 2px 10px; margin-bottom: 6px; }`;
    document.head.appendChild(s);
  }

  // ⚠️ أرقام الدعم: placeholder بس — محمد يتأكد منها قبل التفعيل. ماكو رقم مخترع.
  const SOS = `<div class="sos" role="note"><b>🤍 إذا أنت أو أحد بخطر هسه</b>كلّم أحد تثق بيه قريب منك، أو روح لأقرب مستشفى.<br>
    أرقام الطوارئ والدعم بالعراق: <span data-sos-numbers>‹ الأرقام هنا ›</span> <small>(⚠️ يتأكد محمد من الأرقام قبل التفعيل)</small><br>
    <small>«صوتك يوصل» مو قناة طوارئ، والرسائل بدون اسم ما نگدر نوصل لصاحبها.</small></div>`;

  function mount(el, o = {}) {
    if (!el || typeof document === "undefined") return;
    const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const PV = LOCAL && window.__VOICE_PREVIEW && window.__VOICE_PREVIEW.on === true ? window.__VOICE_PREVIEW : null;
    const C = window.STUDY_CLOUD || {};
    el.hidden = true; el.innerHTML = "";
    const go = (pub) => { if (pub && pub.on === true) start(el, o, pub, PV, C); };
    if (PV) return go(PV);
    if (!C.url || !C.anon) return;
    fetch(`${C.url}/rest/v1/settings?select=value&key=eq.dept_voice`, { headers: { apikey: C.anon, Authorization: "Bearer " + C.anon } })
      .then((r) => (r.ok ? r.json() : [])).then((x) => go(x && x[0] && x[0].value)).catch(() => {});
  }

  function start(el, o, pub, PV, C) {
    css(); el.hidden = false;
    const W = { words: null };
    const words = async () => W.words || (W.words = PV && PV.words ? PV.words : await fetch((o.wordsUrl || "m/voice-words.json")).then((r) => r.json()).catch(() => ({})));
    const student = () => { if (PV) return PV.student || null; const A = window.Account; return A && A.state && A.state.session && A.state.student ? A.state.student : null; };
    const api = async (body) => {
      if (PV && typeof PV.api === "function") return PV.api(body);
      const A = window.Account, tok = body.named && A && A.state && A.state.session ? A.state.session.access_token : C.anon;
      try { const r = await fetch(`${C.url}/functions/v1/dept-voice`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        return { status: r.status, ...(await r.json().catch(() => ({}))) }; } catch (e) { return { status: 0 }; }
    };
    let items = list(), view = "home", cur = null, draft = { kind: "", area: "", ref: "", named: false, text: "", image: null }, stage = null;
    el.innerHTML = `<button type="button" class="vb-row" data-vb-toggle aria-expanded="false" aria-controls="vb-panel"><span class="i" aria-hidden="true">💬</span><span><b>صوتك يوصل</b><small>رسالة لرئيس القسم</small></span><span class="go" aria-hidden="true">‹</span></button>
      <div class="vb" id="vb-panel" hidden aria-live="polite"></div>`;
    const row = el.querySelector("[data-vb-toggle]"), P = el.querySelector("#vb-panel");
    const dot = () => { const d = row.querySelector(".vb-dot"), u = unseen(items);
      if (u && !d) row.insertAdjacentHTML("afterbegin", '<span class="vb-dot" role="img" aria-label="تغيّرت حالة رسالة"></span>'); else if (!u && d) d.remove(); };
    const poll = async () => {
      const codes = items.filter((x) => x.st !== "sent").map((x) => x.code); if (!codes.length) return dot();
      const r = await api({ action: "track", codes });
      if (r && r.items) { items = merge(items, r.items); items.forEach((x) => { if (x.seen === undefined) x.seen = ""; }); save(items); }
      dot(); if (!P.hidden && view === "home") paint();
    };
    const subjectOpts = () => (o.subjects || []).map(([k, n]) => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
    const lectureOpts = () => (o.lectures || []).slice(0, 200).map((l) => `<option value="${esc((l.subject_ar || "") + " · " + (l.title || ""))}">${esc((l.subject_ar || "") + " · " + (l.title || ""))}</option>`).join("");
    const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS[2];
    const areaOf = (k) => (AREAS.find((x) => x[0] === k) || AREAS[5])[1];

    const paint = () => {
      if (view === "home") {
        const said = pub.said && pub.said.text ? `<div class="said"><b>✅ قلتم فسوّينا · ${esc(pub.said.term)}</b><br>${esc(pub.said.text)}</div>` : "";
        P.innerHTML = `${PV ? '<span class="preview-tag">🧪 معاينة محلية</span>' : ""}<h3>💬 صوتك يوصل</h3>
          <p class="sub">مقترح، شكوى، رأي، أو شكر — يوصل لرئيس القسم مباشرة. ما يأثر على درجاتك أبداً.</p>${said}
          <div class="acts"><button type="button" class="cbtn" data-vb="new">✍️ اكتب رسالة</button></div>
          ${items.length ? `<span class="lab">رسائلي</span><ul class="msgs">${items.slice().reverse().map((x) => `<li><button type="button" class="msg${x.seen !== undefined && x.seen !== sig(x) ? " new" : ""}" data-vb-open="${esc(x.code)}"><span>${kindOf(x.kind)[1]} ${esc(kindOf(x.kind)[2])}<small>${esc(areaOf(x.area))}${x.day ? " · <bdi>" + esc(fmtDay(x.day)) + "</bdi>" : ""}</small></span><span class="st">${esc(label(x))}</span></button></li>`).join("")}</ul>` : ""}
          <span class="lab" id="vb-tl">تابع رسالة برقم المتابعة</span>
          <form class="track" data-vb-track novalidate><input type="text" name="c" inputmode="latin" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" aria-labelledby="vb-tl" lang="en"><button class="cbtn ghost" type="submit">تابع</button></form>
          <p class="sub" data-vb-tmsg role="status"></p>
          <p class="foot">يقرا رسالتك رئيس القسم بس. صاحب الموقع يشوف الأعداد بس. · مو قناة طوارئ.</p>`;
        return;
      }
      if (view === "form") {
        const st = student(), d = draft;
        P.innerHTML = `<button type="button" class="back" data-vb="home">‹ رجوع</button><h3>✍️ رسالة لرئيس القسم</h3>
          <span class="lab" id="vb-k">نوع الرسالة</span><div class="chips-row" role="group" aria-labelledby="vb-k">${KINDS.map(([k, i, t]) => `<button type="button" class="chip2" data-k="${k}" aria-pressed="${d.kind === k}">${i} ${t}</button>`).join("")}</div>
          <span class="lab" id="vb-a">عن شنو؟</span><div class="chips-row" role="group" aria-labelledby="vb-a">${AREAS.map(([k, t]) => `<button type="button" class="chip2" data-a="${k}" aria-pressed="${d.area === k}">${t}</button>`).join("")}</div>
          ${d.area === "subject" ? `<select name="ref" aria-label="المادة" style="margin-top:8px"><option value="">اختار المادة</option>${subjectOpts()}</select>` : ""}
          ${d.area === "lecture" ? `<select name="ref" aria-label="المحاضرة" style="margin-top:8px"><option value="">اختار المحاضرة</option>${lectureOpts()}</select>` : ""}
          <span class="lab" id="vb-n">ترسلها</span><div class="seg" role="group" aria-labelledby="vb-n">
            <button type="button" class="chip2" data-n="0" aria-pressed="${!d.named}">🕶️ بدون اسم</button>
            <button type="button" class="chip2" data-n="1" aria-pressed="${d.named}" ${st ? "" : "disabled"}>🙋 باسمي</button></div>
          ${st ? (d.named ? `<p class="sub">يطلع اسمك «${esc(st.full_name || st.name || "")}» لرئيس القسم بس.</p>` : "") : `<p class="sub">«باسمي» يحتاج تدخل بحسابك. هسه تگدر ترسلها بدون اسم.</p>`}
          <label class="lab" for="vb-t">رسالتك</label>
          <textarea id="vb-t" maxlength="1000" placeholder="اكتب بهدوء ووضوح…">${esc(d.text)}</textarea><span class="cnt" data-cnt>${d.text.length} / 1000</span>
          <span class="lab">صورة (اختياري، وحدة)</span><div class="file"><label class="cbtn ghost vb-pick">📎 أضف صورة<input type="file" accept="image/*" aria-label="أضف صورة"></label><small class="sub">${d.image ? "✓ الصورة جاهزة (بلا معلومات الموقع)" : "تأكد الصورة ما بيها وجه أو اسم."}</small></div>
          <div class="note"><p>🔒 يقرا رسالتك رئيس القسم بس. صاحب الموقع يشوف الأعداد بس.</p><p>✋ الرسالة توصل لرئيس القسم. لا تكتب اسمك ولا اسم أحد.</p>
            <p>🕶️ أسلوب كتابتك أو تفاصيل الحادثة ممكن تكشفك؛ اكتب بالعموم إذا تريد.</p><p>🤝 اكتب باحترام؛ الأرقام والروابط والمعرّفات تنشال وحدها. ما يأثر على درجاتك أبداً.</p></div>
          <div data-vb-stage>${stage || ""}</div>
          <div class="acts"><button type="button" class="cbtn" data-vb="send">📤 أرسل</button></div>
          <p class="foot">مو قناة طوارئ. نحاول نرد خلال 7 أيام، ونخلّصها خلال 30 يوم.</p>`;
        const ta = P.querySelector("textarea"), cnt = P.querySelector("[data-cnt]");
        ta.oninput = () => { d.text = ta.value; cnt.textContent = `${ta.value.length} / 1000`; };
        const sel = P.querySelector("select[name=ref]"); if (sel) { sel.value = d.ref; sel.onchange = () => (d.ref = sel.value); }
        P.querySelector("input[type=file]").onchange = async (ev) => {
          const f = ev.target.files[0], m = ev.target.closest(".file").querySelector("small"); if (!f) return;
          m.textContent = "لحظة…";
          try { d.image = await b64(await toWebp(f)); m.textContent = "✓ الصورة جاهزة (بلا معلومات الموقع)"; } catch (e) { d.image = null; m.textContent = "الصورة ما انقرت. جرّب صورة ثانية."; }
        };
        return;
      }
      if (view === "thanks") {
        const x = cur;
        P.innerHTML = `<p class="ok-big">رسالتك وصلت لرئاسة القسم ✅</p><p class="sub">شكراً إلك 🌷 هذا رقم المتابعة:</p>
          <div class="code"><b data-code>${esc(x.code)}</b><button type="button" class="cbtn ghost" data-vb="copy">📋 انسخ</button></div>
          <p class="sub">📱 انحفظ بهالجهاز بـ «رسائلي». إذا ضاع الرقم ما ينرجع، فانسخه إذا تريد تتابع من جهاز ثاني.</p>
          ${o.bot ? `<p class="sub">🔔 تريد تنبيه بالبوت لما رئيس القسم يقراها أو يرد؟ <a href="${esc(o.bot)}?start=voice_${esc(x.code)}" target="_blank" rel="noopener">فعّل التنبيه</a><br><small>البوت يعرف رقم المتابعة بس، مو اسمك، والتنبيه ينطفي لما الرسالة تخلص.</small></p>` : ""}
          ${x.support ? SOS : ""}
          <div class="acts"><button type="button" class="cbtn" data-vb-open="${esc(x.code)}">شوف حالتها</button><button type="button" class="cbtn ghost" data-vb="home">رجوع</button></div>`;
        return;
      }
      if (view === "msg") {
        const x = cur, r = RANK[x.st] ?? 0, s = step(x);
        const lad = STEPS.map(([k, t, n], i) => { const lbl = k === "done" && x.st === "declined" ? "ما ممكن (السبب بالرد)" : n; return `<li class="${i <= r ? "on" : ""}"${i === r && s !== "reply" ? ' aria-current="step"' : ""}><span class="t" aria-hidden="true">${i <= r ? t : "○"}</span>${lbl}</li>`; }).join("");
        P.innerHTML = `<button type="button" class="back" data-vb="home">‹ رجوع</button><h3>${kindOf(x.kind)[1]} ${esc(kindOf(x.kind)[2])} · ${esc(areaOf(x.area))}</h3>
          <p class="sub">رقم المتابعة: <bdi dir="ltr" lang="en">${esc(x.code)}</bdi>${x.day ? `<br>📅 <bdi>${esc(fmtDay(x.day))}</bdi>` : ""}</p>
          <ol class="ladder" aria-label="حالة الرسالة">${lad}${x.reply ? '<li class="on" aria-current="step"><span class="t" aria-hidden="true">💬</span>رد</li>' : ""}</ol>
          ${x.reply ? `<div class="reply"><b>💬 رد رئاسة القسم</b>${esc(x.reply)}</div>` : ""}
          ${x.st === "sent" ? `<p class="sub">⏳ بعدها ما وصلت (النت؟).</p><div class="acts"><button type="button" class="cbtn" data-vb="retry">🔁 أعد الإرسال</button></div>` : ""}
          ${x.can_reopen ? `<div class="acts"><button type="button" class="cbtn ghost" data-vb="reopen">↩️ ما انحلّت</button></div><p class="sub">تگدر تضغطها مرة وحدة بس.</p>` : ""}
          <p class="foot">✓ أُرسلت · ✓✓ وصلت · 👁️ انقرت (لما رئيس القسم يفتحها) · 🔄 قيد المتابعة · ✔️ تمت · 💬 رد</p>`;
      }
    };
    const open = (v) => { view = v; paint(); const f = P.querySelector("h3, .ok-big"); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); } P.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    const toggle = () => {
      P.hidden = !P.hidden; row.setAttribute("aria-expanded", String(!P.hidden));
      if (!P.hidden) { items = markSeen(items); save(items); dot(); open("home"); }
    };
    const send = async (force) => {
      const d = draft, F = VF(), W0 = await words(), box = P.querySelector("[data-vb-stage]");
      const say = (h) => { stage = h; box.innerHTML = h; box.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (!d.kind) return say('<div class="err">اختار نوع الرسالة.</div>');
      if (!d.area) return say('<div class="err">اختار عن شنو رسالتك.</div>');
      const c = F.clean(d.text);
      if (c.text.replace(/\s/g, "").length < 4) return say('<div class="err">اكتب رسالتك أول.</div>');
      const f = F.check(c.text, W0);
      if (f.level === "block") return say(`<div class="err">ما گدرنا نرسلها، لأن بيها تهديد.</div>${SOS}`);
      if (f.level === "nudge" && !force) return say(`<div class="nudge">🙏 تقدر تعيد صياغتها؟ الرسائل المحترمة تنحل أسرع.<div class="acts"><button type="button" class="cbtn" data-vb="edit">✏️ عدّل</button><button type="button" class="cbtn ghost" data-vb="force">أرسل كما هي</button></div></div>${f.self ? SOS : ""}`);
      const code = F.trackCode(), it = { code, kind: d.kind, area: d.area, st: "sent", seen: "sent|0", day: "" };
      items.push(it); save(items);
      const r = await api({ action: "submit", kind: d.kind, area: d.area, area_ref: d.ref, text: d.text, named: d.named, image: d.image, code, device: device(), force: !!force });
      if (r.status === 200 && r.ok) {
        Object.assign(it, { st: "received", day: r.day || "" }); it.seen = sig(it); save(items);
        cur = Object.assign({}, it, { support: !!(r.support || f.self) }); draft = { kind: "", area: "", ref: "", named: false, text: "", image: null }; stage = null; open("thanks"); return;
      }
      if (r.status === 0) { cur = it; open("msg"); return; }   // ✓ بس: انحفظت بالجهاز، تنعاد
      items = items.filter((x) => x.code !== code); save(items);
      if (r.error === "nudge") return say(`<div class="nudge">🙏 ${esc(r.msg)}<div class="acts"><button type="button" class="cbtn" data-vb="edit">✏️ عدّل</button><button type="button" class="cbtn ghost" data-vb="force">أرسل كما هي</button></div></div>`);
      say(`<div class="err">${esc(r.msg || "ما وصلت. جرّب مرة ثانية.")}</div>${r.support ? SOS : ""}`);
    };
    el.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button"); if (!b || !el.contains(b)) return;
      if (b.hasAttribute("data-vb-toggle")) return toggle();
      if (b.dataset.k) { draft.kind = b.dataset.k; stage = null; return paint(); }
      if (b.dataset.a) { draft.area = b.dataset.a; draft.ref = ""; stage = null; return paint(); }
      if (b.dataset.n) { draft.named = b.dataset.n === "1" && !!student(); return paint(); }
      if (b.dataset.vbOpen) { cur = items.find((x) => x.code === b.dataset.vbOpen) || cur; if (cur) { cur.seen = sig(cur); save(items); dot(); } return open("msg"); }
      const a = b.dataset.vb;
      if (a === "new") { stage = null; return open("form"); }
      if (a === "home") return open("home");
      if (a === "send") return send(false);
      if (a === "force") return send(true);
      if (a === "edit") { stage = null; paint(); const t = P.querySelector("textarea"); if (t) t.focus(); return; }
      if (a === "copy") { const t = P.querySelector("[data-code]").textContent; try { await navigator.clipboard.writeText(t); b.textContent = "✔️ انسخ"; } catch (e) { b.textContent = "حدّده وانسخه"; } return; }
      if (a === "reopen") { const r = await api({ action: "reopen", code: cur.code }); if (r.ok) { await poll(); cur = items.find((x) => x.code === cur.code); open("msg"); } return; }
      if (a === "retry") { items = items.filter((x) => x.code !== cur.code); save(items); draft = Object.assign(draft, { kind: cur.kind, area: cur.area }); return open("form"); }
    });
    el.addEventListener("submit", async (ev) => {
      const f = ev.target.closest("[data-vb-track]"); if (!f) return; ev.preventDefault();
      const F = VF(), c = F.codeNorm(f.c.value), m = P.querySelector("[data-vb-tmsg]");
      if (!F.codeOk(c)) { m.textContent = "الرقم مو صحيح (20 حرف)."; return; }
      if (!items.some((x) => x.code === c)) { const r = await api({ action: "track", codes: [c] });
        if (!r.items || !r.items.length) { m.textContent = "ما لگينا رسالة بهالرقم."; return; }
        items.push({ code: c, kind: r.items[0].kind, area: r.items[0].area, st: r.items[0].status, day: r.items[0].day, seen: "" }); items = merge(items, r.items); items[items.length - 1].seen = sig(items[items.length - 1]); save(items); }
      cur = items.find((x) => x.code === c); open("msg");
    });
    dot(); poll();
    setInterval(() => { if (document.visibilityState === "visible") poll(); }, 10 * 60e3);   // خفيف: كل 10 دقايق والصفحة ظاهرة
    if (PV && PV.open) { toggle(); if (PV.open !== "home") { if (PV.open === "form") { Object.assign(draft, PV.draft || {}); open("form"); } } }
  }

  return { mount, merge, unseen, markSeen, label, step, STEPS, RANK, KINDS, AREAS, list, save };
});
