// 💬 «صوتك يوصل» — واجهة الطالب داخل «صفحتي» (مسودة 58، الجولة 3). **مطفي ومخفي** لحد ما رئيس القسم يشغّله من لوحته:
//   يرسم بس إذا settings.dept_voice.on = true (نفس قراءة team.js)، أو بالمعاينة المحلية window.__VOICE_PREVIEW (localhost بس).
//   مطفي ← ولا شي، إلا إذا الطالب عنده رسائل محفوظة بهالجهاز: يطلع «💬 رسائلي» بس (الحالة والردود)، بلا كتابة.
// الشاشات (كلها داخل نفس اللوحة): البداية · النموذج · شكراً (رقم المتابعة) · رسالة (درجات ✓ ✓✓ 👁️ 🔄 ✔️ 💬).
// الخصوصية: «بدون اسم» الافتراضي · رقم المتابعة يتولّد بالجهاز (السيرفر يخزن بصمته بس) · الصورة تنعاد رسمها بـ canvas ← JPEG بلا EXIF/موقع
//   (والسيرفر يشيل أي معلومات باقية) · رسائلي بهالجهاز بس (t:voice — تنشال على جنب ويّا بيانات الطالب لما يطلع، sync.js) ·
//   المتابعة ببصمات الأرقام بلا هوية. ENG: الصندوق data-noen وبيه إنكليزي كامل (L()).
(function (root, factory) {
  const M = factory();
  if (typeof module === "object" && module.exports) module.exports = M; else root.VoiceBox = M;
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "t:voice", DEV = "t:voice-dev", MAXLIST = 30, IMG_MAX = 300 * 1024;
  const KINDS = [["idea", "💡", "مقترح", "Suggestion"], ["complaint", "📝", "شكوى", "Complaint"], ["opinion", "💬", "رأي", "Opinion"], ["thanks", "🌷", "شكر", "Thanks"]];
  const AREAS = [["subject", "المادة", "Subject"], ["lecture", "المحاضرة", "Lecture"], ["services", "الخدمات", "Services"], ["dept", "القسم", "Department"], ["platform", "المنصة", "Platform"], ["other", "غيره", "Other"]];
  // درجات الحالة (مثل علامات الواتساب). 👁️ بس لما الرئيس يفتح الرسالة نفسها بلوحته (السيرفر يكتبها، مو المتصفح).
  const STEPS = [["sent", "✓", "أُرسلت", "Sent"], ["received", "✓✓", "وصلت", "Delivered"], ["opened", "👁️", "انقرت", "Read"], ["in_progress", "🔄", "قيد المتابعة", "In progress"], ["done", "✔︎", "تمت", "Done"]];
  const RANK = { sent: 0, received: 1, opened: 2, in_progress: 3, done: 4, declined: 4 };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = { get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const VF = () => (typeof window !== "undefined" && window.VoiceFilter) || (typeof require === "function" ? require("./voice-filter.js") : null);
  const EN = () => typeof document !== "undefined" && document.documentElement.lang === "en";
  const L = (ar, en) => (EN() ? en : ar);

  // ── منطق صافي (يتجرّب بـ node) ──
  const list = () => { const l = LS.get(KEY, []); return Array.isArray(l) ? l.filter((x) => x && x.code) : []; };
  const save = (l) => LS.set(KEY, l.slice(-MAXLIST).map((x) => Object.assign({}, x, { id: x.code })));   // id = الرقم (sync.js يشيلها على جنب ويّا بيانات الطالب)
  const sig = (x) => `${x.st}|${x.reply ? 1 : 0}`;
  function merge(items, rows) {
    const by = Object.fromEntries((rows || []).map((r) => [r.code, r]));
    return items.map((x) => { const r = by[x.code]; if (!r) return x;
      return Object.assign({}, x, { st: r.status, reply: r.reply || "", day: r.day || x.day, can_reopen: !!r.can_reopen, orphan: !!r.orphan, kind: x.kind || r.kind }); });
  }
  /** 🔴 النقطة الحمرة: أي رسالة تغيّرت حالتها (أو وصلها رد) من آخر مرة فتحها الطالب. */
  const isNew = (x) => x.seen !== undefined && x.seen !== sig(x);
  const unseen = (items) => items.some(isNew);
  const markSeen = (items) => items.map((x) => Object.assign({}, x, { seen: sig(x) }));
  const step = (x) => (x.reply ? "reply" : x.st === "declined" ? "declined" : x.st);
  function label(x) {
    const s = step(x);
    if (s === "reply") return L("💬 وصلك رد", "💬 Reply"); if (s === "declined") return L("✔️ ما ممكن", "✔️ Not possible"); if (s === "done") return L("✔️ تمت", "✔️ Done");
    const f = STEPS.find((y) => y[0] === s) || STEPS[0]; return `${f[1]} ${L(f[2], f[3])}`;
  }
  const fmtDay = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || "")); return m ? `${+m[3]}/${+m[2]}/${m[1]}` : ""; };
  const device = () => { let d = LS.get(DEV, ""); if (!/^[0-9a-f-]{36}$/.test(d)) { d = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0").slice(-12); LS.set(DEV, d); } return d; };

  // ── الصورة: إعادة رسم بـ canvas ← JPEG جديد (بلا EXIF/موقع)، ≤ 300 KB. JPEG حتى بالآيفون (Safari ما يسوّي WebP من canvas). ──
  async function toJpeg(file, max = IMG_MAX) {
    const img = await createImageBitmap(file);
    let side = 1600, q = 0.82, blob = null;
    for (let i = 0; i < 7; i++) {
      const s = Math.min(1, side / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      blob = await new Promise((r) => c.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= max) break;
      side *= 0.8; q = Math.max(0.5, q - 0.08);
    }
    if (!blob || blob.size > max || blob.type !== "image/jpeg") throw new Error("img");
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
.vb details.more { margin-top: 10px; } .vb details.more > summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; color: var(--brand); font: 700 var(--t-sm) var(--title-font); }
.vb details.more ul { margin: 0; padding-inline-start: 18px; color: var(--muted); font-size: var(--t-sm); line-height: 1.8; }
.vb .file { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; } .vb .vb-pick { position: relative; min-height: 44px; cursor: pointer; }
.vb .vb-pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; } .vb .vb-pick:focus-within { outline: 2px solid var(--brand); outline-offset: 2px; }
.vb .cbtn:not(.ghost) { background: var(--brand); color: var(--brand-ink); border: 0; } .vb .cbtn.ghost { background: transparent; color: var(--brand); border: 1px solid var(--line); }
.vb .cbtn:disabled { opacity: .55; cursor: progress; }
.vb .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .vb .acts .cbtn { flex: 1 1 auto; }
.vb .nudge, .vb .sos, .vb .err, .vb .info { border-radius: 12px; padding: 12px; margin-top: 12px; font-size: var(--t-sm); line-height: 1.8; }
.vb .nudge, .vb .info { background: var(--accent-soft); border: 1px solid var(--line); } .vb .err { background: var(--bad-soft); color: var(--ink); }
.vb .sos { background: var(--ok-soft); border: 1px solid var(--ok); } .vb .sos b { display: block; font-family: var(--title-font); }
.vb .code { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; background: var(--bg); border: 1px dashed var(--brand); border-radius: 14px; padding: 10px 12px; margin: 10px 0; }
.vb .code b { flex: 1 1 100%; text-align: center; font: 800 var(--t-md) ui-monospace, Menlo, monospace; direction: ltr; letter-spacing: .04em; word-break: break-all; }
.vb .ok-big { font: 800 var(--t-lg) var(--title-font); margin: 4px 0 8px; }
.vb ul.msgs { list-style: none; padding: 0; margin: 8px 0 0; } .vb ul.msgs li + li { margin-top: 8px; }
.vb .msg { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 52px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); color: var(--ink); font: inherit; padding: 8px 12px; text-align: start; cursor: pointer; }
.vb .msg small { color: var(--muted); font-size: var(--t-xs); display: block; } .vb .msg .st { font-size: var(--t-sm); font-weight: 700; color: var(--brand); white-space: nowrap; }
.vb .msg.new { border-color: var(--bad); box-shadow: inset 3px 0 0 var(--bad); }
.vb ol.ladder { list-style: none; padding: 0; margin: 12px 0; } .vb ol.ladder li { display: flex; align-items: center; gap: 10px; min-height: 36px; color: var(--muted); font-size: var(--t-sm); }
.vb ol.ladder li .t { width: 32px; text-align: center; } .vb ol.ladder li.on { color: var(--ink); font-weight: 700; } .vb ol.ladder li.on .t { color: var(--brand); }
.vb .reply { background: var(--brand-soft); border-radius: 12px; padding: 12px; margin-top: 8px; line-height: 1.8; } .vb .reply b { display: block; font-family: var(--title-font); margin-bottom: 4px; }
.vb .said { background: var(--ok-soft); border-radius: 12px; padding: 10px 12px; margin: 10px 0; font-size: var(--t-sm); line-height: 1.8; } .vb .said b { font-family: var(--title-font); }
.vb .track { display: flex; gap: 8px; } .vb .track input { flex: 1; min-width: 0; direction: ltr; text-transform: uppercase; } .vb .track .cbtn { flex: none; }
.vb .back { min-height: 44px; border: 0; background: none; color: var(--brand); font: 700 var(--t-sm) var(--title-font); cursor: pointer; padding: 0 4px; }
.vb .preview-tag { display: inline-block; font-size: var(--t-xs); color: var(--muted); border: 1px dashed var(--line); border-radius: 999px; padding: 2px 10px; margin-bottom: 6px; }
html[lang="en"] .vb, html[lang="en"] .vb-row { direction: ltr; text-align: left; }`;
    document.head.appendChild(s);
  }

  // ☎️ (31/10، قرار محمد) 911 بس: الرقم الموحّد الرسمي (مكتب رئيس الوزراء 9/1/2025؛ pmo.iq/?article=2933)، ومحمد تأكد بنفسه إنه يشتغل بذي قار.
  const SOS = () => `<div class="sos" role="note"><b>${L("🤍 إذا أنت أو أحد بخطر هسه", "🤍 If you or someone is in danger now")}</b>${L("كلّم أحد تثق بيه قريب منك، أو روح لأقرب مستشفى.", "Talk to someone you trust nearby, or go to the nearest hospital.")}<br>
    ${L("رقم الطوارئ بالعراق:", "Emergency number in Iraq:")} <span data-sos-numbers><b dir="ltr">911</b></span><br>
    <small>${L("«صوتك يوصل» مو قناة طوارئ، والرسائل بدون اسم ما نگدر نوصل لصاحبها.", "This is not an emergency channel, and anonymous senders can’t be reached.")}</small></div>`;

  function mount(el, o = {}) {
    if (!el || typeof document === "undefined") return;
    const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const PV = LOCAL && window.__VOICE_PREVIEW ? window.__VOICE_PREVIEW : null;
    const C = window.STUDY_CLOUD || {};
    el.hidden = true; el.innerHTML = ""; el.setAttribute("data-noen", "");
    const go = (pub) => { const on = !!(pub && pub.on === true); if (on || list().length) start(el, o, Object.assign({}, pub || {}, { on }), PV, C); };
    if (PV) return go(PV.on === true ? PV : { on: false });
    if (!C.url || !C.anon) return go({ on: false });
    fetch(`${C.url}/rest/v1/settings?select=value&key=eq.dept_voice`, { headers: { apikey: C.anon, Authorization: "Bearer " + C.anon } })
      .then((r) => (r.ok ? r.json() : [])).then((x) => go(x && x[0] && x[0].value)).catch(() => go({ on: false }));
  }

  function start(el, o, pub, PV, C) {
    css(); el.hidden = false;
    const W = { words: null };
    const words = async () => W.words || (W.words = PV && PV.words ? PV.words : await fetch((o.wordsUrl || "m/voice-words.json")).then((r) => r.json()).catch(() => ({})));
    const student = () => { if (PV) return PV.student || null; const A = window.Account; return A && A.state && A.state.session && A.state.student ? A.state.student : null; };
    const api = async (body) => {
      if (PV && typeof PV.api === "function") return PV.api(body);
      const A = window.Account, tok = A && A.state && A.state.session ? A.state.session.access_token : C.anon;
      try { const r = await fetch(`${C.url}/functions/v1/dept-voice`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        return { status: r.status, ...(await r.json().catch(() => ({}))) }; } catch (e) { return { status: 0 }; }
    };
    let items = list(), view = "home", cur = null, fresh = new Set(), sending = false, imgBusy = false;
    let draft = { kind: "", area: "", ref: "", named: false, text: "", image: null }, stage = null;
    const rowSub = () => (pub.on ? L("رسالة لرئيس القسم", "A message to the head of department") : L("رسائلي (الحالة والردود)", "My messages (status and replies)"));
    el.innerHTML = `<button type="button" class="vb-row" data-vb-toggle aria-expanded="false" aria-controls="vb-panel"><span class="i" aria-hidden="true">💬</span><span><b data-t>${L("صوتك يوصل", "Your voice")}</b><small data-ts>${rowSub()}</small></span><span class="go" aria-hidden="true">‹</span></button>
      <div class="vb" id="vb-panel" hidden aria-live="polite"></div>`;
    const row = el.querySelector("[data-vb-toggle]"), P = el.querySelector("#vb-panel");
    const dot = () => { const d = row.querySelector(".vb-dot"), u = unseen(items);
      if (u && !d) row.insertAdjacentHTML("afterbegin", `<span class="vb-dot" role="img" aria-label="${L("تغيّرت حالة رسالة", "A message changed")}"></span>`); else if (!u && d) d.remove(); };
    const poll = async () => {
      const codes = items.filter((x) => x.st !== "sent").map((x) => x.code); if (!codes.length) return dot();
      const r = await api({ action: "track", codes });
      if (r && r.items) { items = merge(items, r.items); items.forEach((x) => { if (x.seen === undefined) x.seen = ""; }); save(items); }
      dot(); if (!P.hidden && view === "home") paint();
    };
    const kindOf = (k) => KINDS.find((x) => x[0] === k) || KINDS[2];
    const kName = (k) => { const x = kindOf(k); return `${x[1]} ${L(x[2], x[3])}`; };
    const areaOf = (k) => { const x = AREAS.find((y) => y[0] === k) || AREAS[5]; return L(x[1], x[2]); };
    const subjectOpts = () => (o.subjects || []).map(([k, n]) => `<option value="${esc(n)}">${esc(EN() && o.subjectsEn && o.subjectsEn[k] ? o.subjectsEn[k] : n)}</option>`).join("");   // القيمة عربية (نفس قائمة السيرفر)
    const lectureOpts = () => (o.lectures || []).slice(0, 200).map((l) => { const v = (l.subject_ar || "") + " · " + (l.title || ""); return `<option value="${esc(v)}">${esc(v)}</option>`; }).join("");
    const msgList = () => items.length ? `<span class="lab">${L("رسائلي", "My messages")}</span><ul class="msgs">${items.slice().reverse().map((x) => `<li><button type="button" class="msg${fresh.has(x.code) ? " new" : ""}" data-vb-open="${esc(x.code)}"><span>${kName(x.kind)}<small>${esc(areaOf(x.area))}${x.day ? " · <bdi>" + esc(fmtDay(x.day)) + "</bdi>" : ""}</small></span><span class="st">${esc(label(x))}</span></button></li>`).join("")}</ul>` : "";
    const trackForm = () => `<details class="more"><summary>${L("المزيد", "More")}</summary>
          <label class="lab" for="vb-tc">${L("تابع رسالة برقم المتابعة", "Track a message by code")}</label>
          <form class="track" data-vb-track novalidate><input id="vb-tc" type="text" name="c" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${L("رقم المتابعة", "Tracking code")}" lang="en"><button class="cbtn ghost" type="submit">${L("تابع", "Track")}</button></form>
          <p class="sub" data-vb-tmsg role="status"></p>
          <ul><li>${L("يقرا رسالتك رئيس القسم بس. صاحب الموقع يشوف الأعداد بس.", "Only the head of department reads your message. The site owner sees counts only.")}</li><li>${L("مو قناة طوارئ.", "Not an emergency channel.")}</li></ul></details>`;

    const paint = () => {
      const rs = el.querySelector("[data-ts]"); if (rs) { rs.textContent = rowSub(); el.querySelector("[data-t]").textContent = L("صوتك يوصل", "Your voice"); }
      if (view === "home") {
        const said = pub.on && pub.said && pub.said.text ? `<div class="said"><b>✅ ${L("قلتم فسوّينا", "You said, we did")} · ${esc(pub.said.term)}</b><br>${esc(pub.said.text)}</div>` : "";
        P.innerHTML = `${PV ? `<span class="preview-tag">🧪 ${L("معاينة محلية", "Local preview")}</span>` : ""}<h3>💬 ${L("صوتك يوصل", "Your voice")}</h3>
          ${pub.on ? `<p class="sub">${L("مقترح، شكوى، رأي، أو شكر لرئيس القسم. ما يأثر على درجاتك أبداً.", "A suggestion, complaint, opinion or thanks for the head of department. It never affects your grades.")}</p>${said}
          <div class="acts"><button type="button" class="cbtn" data-vb="new">✍️ ${L("اكتب رسالة", "Write a message")}</button></div>`
          : `<p class="info">${L("الخدمة مطفية هسه. تگدر تتابع رسائلك والردود بس.", "The service is off right now. You can still follow your messages and replies.")}</p>`}
          ${msgList()}${trackForm()}`;
        return;
      }
      if (view === "form") {
        const st = student(), d = draft;
        P.innerHTML = `<button type="button" class="back" data-vb="home">‹ ${L("رجوع", "Back")}</button><h3>✍️ ${L("رسالة لرئيس القسم", "Message to the head of department")}</h3>
          <span class="lab" id="vb-k">${L("نوع الرسالة", "Type")}</span><div class="chips-row" role="group" aria-labelledby="vb-k">${KINDS.map(([k, i, t, e]) => `<button type="button" class="chip2" data-k="${k}" aria-pressed="${d.kind === k}">${i} ${L(t, e)}</button>`).join("")}</div>
          <span class="lab" id="vb-a">${L("عن شنو؟", "About")}</span><div class="chips-row" role="group" aria-labelledby="vb-a">${AREAS.map(([k, t, e]) => `<button type="button" class="chip2" data-a="${k}" aria-pressed="${d.area === k}">${L(t, e)}</button>`).join("")}</div>
          ${d.area === "subject" ? `<select name="ref" aria-label="${L("المادة", "Subject")}" style="margin-top:8px"><option value="">${L("اختار المادة (اختياري)", "Pick the subject (optional)")}</option>${subjectOpts()}</select>` : ""}
          ${d.area === "lecture" ? `<select name="ref" aria-label="${L("المحاضرة", "Lecture")}" style="margin-top:8px"><option value="">${L("اختار المحاضرة (اختياري)", "Pick the lecture (optional)")}</option>${lectureOpts()}</select>` : ""}
          <span class="lab" id="vb-n">${L("ترسلها", "Send it")}</span><div class="seg" role="group" aria-labelledby="vb-n">
            <button type="button" class="chip2" data-n="0" aria-pressed="${!d.named}">🕶️ ${L("بدون اسم", "Anonymous")}</button>
            <button type="button" class="chip2" data-n="1" aria-pressed="${d.named}" ${st ? "" : "disabled"}>🙋 ${L("باسمي", "With my name")}</button></div>
          ${st ? "" : `<p class="sub">${L("«باسمي» يحتاج تدخل بحسابك.", "“With my name” needs you to sign in.")}</p>`}
          <label class="lab" for="vb-t">${L("رسالتك", "Your message")}</label>
          <textarea id="vb-t" maxlength="1000" placeholder="${L("اكتب بهدوء ووضوح…", "Write calmly and clearly…")}">${esc(d.text)}</textarea><span class="cnt" data-cnt>${d.text.length} / 1000</span>
          <span class="lab">${L("صورة (اختياري، وحدة)", "Photo (optional, one)")}</span><div class="file"><label class="cbtn ghost vb-pick">📎 ${L("أضف صورة", "Add a photo")}<input type="file" accept="image/*" aria-label="${L("أضف صورة", "Add a photo")}"></label><small class="sub" data-img>${d.image ? L("✓ الصورة جاهزة (بلا معلومات الموقع)", "✓ Photo ready (location info removed)") : L("تأكد الصورة ما بيها وجه أو اسم.", "Make sure the photo shows no face or name.")}</small></div>
          <p class="note">🔒 ${d.named ? L("يقرا رسالتك رئيس القسم بس، وياها اسمك · ما يأثر على درجاتك", "Only the head of department reads it, with your name · It never affects your grades")
            : L("يقرا رسالتك رئيس القسم بس. لا تكتب اسمك ولا اسم أحد · ما يأثر على درجاتك", "Only the head of department reads it. Don’t write your name or anyone’s · It never affects your grades")}</p>
          <details class="more"><summary>${L("المزيد", "More")}</summary><ul>
            <li>${L("صاحب الموقع يشوف الأعداد بس، مو الرسائل.", "The site owner sees counts only, never messages.")}</li>
            ${d.named ? "" : `<li>${L("أسلوب كتابتك أو تفاصيل الحادثة ممكن تكشفك؛ اكتب بالعموم إذا تريد.", "Your writing style or incident details could identify you; keep it general if you prefer.")}</li><li>${L("بدون اسم: توصل لرئيس القسم بدفعة الصبح (اليوم الجاي).", "Anonymous messages reach the head in the next morning’s batch.")}</li>`}
            <li>${L("اكتب باحترام؛ الأرقام والروابط والمعرّفات تنشال وحدها.", "Be respectful; phone numbers, links and handles are removed automatically.")}</li>
            <li>${L("نحاول نرد خلال 7 أيام، ونخلّصها خلال 30 يوم.", "We aim to acknowledge within 7 days and resolve within 30.")}</li>
            <li>${L("مو قناة طوارئ.", "Not an emergency channel.")}</li></ul></details>
          <div data-vb-stage>${stage || ""}</div>
          <div class="acts"><button type="button" class="cbtn" data-vb="send" ${sending || imgBusy ? "disabled" : ""}>📤 ${sending ? L("لحظة…", "Sending…") : L("أرسل", "Send")}</button></div>`;
        const ta = P.querySelector("textarea"), cnt = P.querySelector("[data-cnt]");
        ta.oninput = () => { d.text = ta.value; cnt.textContent = `${ta.value.length} / 1000`; };
        const sel = P.querySelector("select[name=ref]"); if (sel) { sel.value = d.ref; sel.onchange = () => (d.ref = sel.value); }
        P.querySelector("input[type=file]").onchange = async (ev) => {
          const f = ev.target.files[0], m = P.querySelector("[data-img]"), sb = P.querySelector('[data-vb="send"]'); if (!f) return;
          imgBusy = true; sb.disabled = true; m.textContent = L("لحظة… نجهّز الصورة", "One moment… preparing the photo");
          try { d.image = await b64(await toJpeg(f)); m.textContent = L("✓ الصورة جاهزة (بلا معلومات الموقع)", "✓ Photo ready (location info removed)"); }
          catch (e) { d.image = null; m.textContent = L("الصورة ما انقرت. جرّب صورة ثانية.", "Couldn’t read that photo. Try another."); }
          imgBusy = false; sb.disabled = sending;
        };
        return;
      }
      if (view === "thanks") {
        const x = cur, later = x.arrives === "morning";
        P.innerHTML = `<p class="ok-big">${later ? L("رسالتك انحفظت ✅", "Your message is saved ✅") : L("رسالتك وصلت لرئاسة القسم ✅", "Your message reached the head of department ✅")}</p>
          <p class="sub">${later ? L("توصل لرئيس القسم باچر الصبح (حتى ما ينعرف وقت إرسالها). ", "It reaches the head tomorrow morning (so the send time can’t identify you). ") : ""}${L("شكراً إلك 🌷 هذا رقم المتابعة:", "Thank you 🌷 Here is your tracking code:")}</p>
          <div class="code"><b data-code>${esc(x.code)}</b><button type="button" class="cbtn ghost" data-vb="copy">📋 ${L("انسخ", "Copy")}</button></div>
          <p class="sub">📱 ${L("انحفظ بهالجهاز بـ «رسائلي». إذا ضاع الرقم ما ينرجع.", "Saved on this device under “My messages”. If you lose the code, it can’t be recovered.")}</p>
          ${o.bot || (PV && PV.bot) ? `<details class="more"><summary>🔔 ${L("تنبيه بالبوت (اختياري)", "Bot alert (optional)")}</summary>
            <p class="sub">${L("يوصلك «👁️ انقرت» و«💬 وصلك رد». ⚠️ التنبيه يربط رسالتك بحساب تليغرامك لحد ما تخلص؛ للرسائل الحساسة خلّيه مطفي.", "You’ll get “👁️ Read” and “💬 Reply”. ⚠️ The alert links your message to your Telegram account until it’s closed; leave it off for sensitive messages.")}</p>
            <div class="acts"><button type="button" class="cbtn ghost" data-vb="bot">🔔 ${L("فعّل التنبيه", "Turn on alert")}</button></div></details>` : ""}
          ${x.support ? SOS() : ""}
          <div class="acts"><button type="button" class="cbtn" data-vb-open="${esc(x.code)}">${L("شوف حالتها", "See its status")}</button><button type="button" class="cbtn ghost" data-vb="home">${L("رجوع", "Back")}</button></div>`;
        return;
      }
      if (view === "msg") {
        const x = cur, r = RANK[x.st] ?? 0, s = step(x);
        const lad = STEPS.map(([k, t, n, e], i) => { const lbl = k === "done" && x.st === "declined" ? L("ما ممكن (السبب بالرد)", "Not possible (reason in reply)") : L(n, e); return `<li class="${i <= r ? "on" : ""}"${i === r && s !== "reply" ? ' aria-current="step"' : ""}><span class="t" aria-hidden="true">${i <= r ? t : "○"}</span>${lbl}</li>`; }).join("");
        P.innerHTML = `<button type="button" class="back" data-vb="home">‹ ${L("رجوع", "Back")}</button><h3>${kName(x.kind)} · ${esc(areaOf(x.area))}</h3>
          <p class="sub">${L("رقم المتابعة:", "Tracking code:")} <bdi dir="ltr" lang="en">${esc(x.code)}</bdi>${x.day ? `<br>📅 <bdi>${esc(fmtDay(x.day))}</bdi>` : ""}</p>
          <ol class="ladder" aria-label="${L("حالة الرسالة", "Message status")}">${lad}${x.reply ? `<li class="on" aria-current="step"><span class="t" aria-hidden="true">💬</span>${L("رد", "Reply")}</li>` : ""}</ol>
          ${x.orphan ? `<p class="info">${L("تغيّر رئيس القسم قبل ما تنقرا هالرسالة، فما راح توصل للجديد. إذا بعدها مهمة، أرسلها من جديد.", "The head of department changed before this was read, so it won’t reach the new head. If it still matters, please send it again.")}</p>` : ""}
          ${x.reply ? `<div class="reply"><b>💬 ${L("رد رئاسة القسم", "Reply from the department")}</b>${esc(x.reply)}</div>` : ""}
          ${x.st === "sent" ? `<p class="sub">⏳ ${L("بعدها ما وصلت (تأكد من النت).", "Not delivered yet (check your connection).")}</p><div class="acts"><button type="button" class="cbtn" data-vb="retry">🔁 ${L("أعد الإرسال", "Send again")}</button></div>` : ""}
          ${x.can_reopen ? `<div class="acts"><button type="button" class="cbtn ghost" data-vb="reopen">↩️ ${L("ما انحلّت", "Not solved")}</button></div><p class="sub">${L("تگدر تضغطها مرة وحدة بس.", "You can use this once.")}</p>` : ""}`;
      }
    };
    const open = (v) => { view = v; paint(); const f = P.querySelector("h3, .ok-big"); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); } P.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    const toggle = () => {
      P.hidden = !P.hidden; row.setAttribute("aria-expanded", String(!P.hidden));
      if (!P.hidden) { fresh = new Set(items.filter(isNew).map((x) => x.code)); items = markSeen(items); save(items); dot(); open("home"); }   // التمييز يبقى بهالفتحة
    };
    const send = async (force) => {
      if (sending || imgBusy) return;
      sending = true;   // ضغطتين بنفس اللحظة ← وحدة بس
      try { await send1(force); } finally { sending = false; const sb = P.querySelector('[data-vb="send"]'); if (sb && !imgBusy) { sb.disabled = false; sb.textContent = "📤 " + L("أرسل", "Send"); } }
    };
    const send1 = async (force) => {
      const d = draft, F = VF(), W0 = await words(), box = P.querySelector("[data-vb-stage]");
      const say = (h) => { stage = h; box.innerHTML = h; box.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (!d.kind) return say(`<div class="err">${L("اختار نوع الرسالة.", "Pick a type.")}</div>`);
      if (!d.area) return say(`<div class="err">${L("اختار عن شنو رسالتك.", "Pick what it’s about.")}</div>`);
      const c = F.clean(d.text);
      if (c.text.replace(/\s/g, "").length < 4) return say(`<div class="err">${L("اكتب رسالتك أول.", "Write your message first.")}</div>`);
      const f = F.check(c.text, W0);
      if (f.level === "block") return say(`<div class="err">${L("ما گدرنا نرسلها، لأن بيها تهديد.", "We can’t send this because it contains a threat.")}</div>${SOS()}`);
      const nudge = (msg) => say(`<div class="nudge">🙏 ${esc(msg)}<div class="acts"><button type="button" class="cbtn" data-vb="edit">✏️ ${L("عدّل", "Edit")}</button><button type="button" class="cbtn ghost" data-vb="force">${L("أرسل كما هي", "Send as is")}</button></div></div>${f.self ? SOS() : ""}`);
      if (f.level === "nudge" && !force) return nudge(L("تقدر تعيد صياغتها؟ الرسائل المحترمة تنحل أسرع.", "Could you rephrase it? Respectful messages get solved faster."));
      const sb = P.querySelector('[data-vb="send"]'); if (sb) { sb.disabled = true; sb.textContent = "📤 " + L("لحظة…", "Sending…"); }
      const code = F.trackCode(), it = { code, kind: d.kind, area: d.area, st: "sent", seen: "sent|0", day: "" };
      items.push(it); save(items);
      const r = await api({ action: "submit", kind: d.kind, area: d.area, area_ref: d.ref, text: d.text, named: d.named, image: d.image, code, device: device(), force: !!force });
      if (r.status === 200 && r.ok) {
        Object.assign(it, { st: "received", day: r.day || "" }); it.seen = sig(it); save(items);
        cur = Object.assign({}, it, { support: !!(r.support || f.self), arrives: r.arrives || (d.named ? "now" : "morning") }); draft = { kind: "", area: "", ref: "", named: false, text: "", image: null }; stage = null; open("thanks"); return;
      }
      if (r.status === 0) { cur = it; open("msg"); return; }   // ✓ بس: انحفظت بالجهاز، تنعاد
      items = items.filter((x) => x.code !== code); save(items);
      if (r.error === "off") { pub.on = false; stage = null; open("home"); return; }   // انطفت أثناء الكتابة
      paint();
      const box2 = P.querySelector("[data-vb-stage]");
      const say2 = (h) => { stage = h; box2.innerHTML = h; box2.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (r.error === "nudge") return say2(`<div class="nudge">🙏 ${esc(r.msg)}<div class="acts"><button type="button" class="cbtn" data-vb="edit">✏️ ${L("عدّل", "Edit")}</button><button type="button" class="cbtn ghost" data-vb="force">${L("أرسل كما هي", "Send as is")}</button></div></div>`);
      say2(`<div class="err">${esc(r.msg || L("ما وصلت. جرّب مرة ثانية.", "Not delivered. Please try again."))}</div>${r.support ? SOS() : ""}`);
    };
    el.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button"); if (!b || !el.contains(b)) return;
      if (b.hasAttribute("data-vb-toggle")) return toggle();
      if (b.dataset.k) { draft.kind = b.dataset.k; stage = null; return paint(); }
      if (b.dataset.a) { draft.area = b.dataset.a; draft.ref = ""; stage = null; return paint(); }
      if (b.dataset.n) { draft.named = b.dataset.n === "1" && !!student(); return paint(); }
      if (b.dataset.vbOpen) { cur = items.find((x) => x.code === b.dataset.vbOpen) || cur; if (cur) { cur.seen = sig(cur); fresh.delete(cur.code); save(items); dot(); } return open("msg"); }
      const a = b.dataset.vb;
      if (a === "new") { if (!pub.on) return; stage = null; return open("form"); }
      if (a === "home") return open("home");
      if (a === "send") return send(false);
      if (a === "force") return send(true);
      if (a === "edit") { stage = null; paint(); const t = P.querySelector("textarea"); if (t) t.focus(); return; }
      if (a === "copy") { const t = P.querySelector("[data-code]").textContent; try { await navigator.clipboard.writeText(t); b.textContent = L("✔️ انّسخ", "✔️ Copied"); } catch (e) { b.textContent = L("حدّده وانسخه", "Select and copy it"); } return; }
      if (a === "bot") { const r = await api({ action: "notify_ticket", code: cur.code }); if (r.ticket) window.open(`${o.bot || PV.bot}?start=vn_${encodeURIComponent(r.ticket)}`, "_blank", "noopener"); else b.textContent = r.status === 0 ? L("تأكد من النت", "Check your connection") : L("ما صار", "Didn’t work"); return; }
      if (a === "reopen") { const r = await api({ action: "reopen", code: cur.code }); if (r.ok) { await poll(); cur = items.find((x) => x.code === cur.code); open("msg"); } return; }
      if (a === "retry") { items = items.filter((x) => x.code !== cur.code); save(items); draft = Object.assign(draft, { kind: cur.kind, area: cur.area }); return open(pub.on ? "form" : "home"); }
    });
    el.addEventListener("submit", async (ev) => {
      const f = ev.target.closest("[data-vb-track]"); if (!f) return; ev.preventDefault();
      const F = VF(), c = F.codeNorm(f.c.value), m = P.querySelector("[data-vb-tmsg]");
      if (!F.codeOk(c)) { m.textContent = L("الرقم مو صحيح (20 حرف).", "That code isn’t valid (20 characters)."); return; }
      if (!items.some((x) => x.code === c)) { const r = await api({ action: "track", codes: [c] });
        if (r.status === 0 || !r.items) { m.textContent = L("تأكد من النت وجرّب مرة ثانية.", "Check your connection and try again."); return; }
        if (!r.items.length) { m.textContent = L("ما لگينا رسالة بهالرقم.", "No message found for that code."); return; }
        items.push({ code: c, kind: r.items[0].kind, area: r.items[0].area, st: r.items[0].status, day: r.items[0].day, seen: "" }); items = merge(items, r.items); items[items.length - 1].seen = sig(items[items.length - 1]); save(items); }
      cur = items.find((x) => x.code === c); open("msg");
    });
    if (typeof MutationObserver === "function") new MutationObserver(() => { if (!sending) paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });   // ع ⇄ ENG
    document.addEventListener("sync:applied", () => { items = list(); dot(); if (!P.hidden) paint(); });   // طالب ثاني دخل/طلع ← رسائلي تتبدّل
    dot(); poll();
    setInterval(() => { if (document.visibilityState === "visible") poll(); }, 10 * 60e3);   // خفيف: كل 10 دقايق والصفحة ظاهرة
    if (PV && PV.open) { toggle(); if (PV.open === "form") { Object.assign(draft, PV.draft || {}); open("form"); } }
  }

  return { mount, merge, unseen, markSeen, isNew, label, step, STEPS, RANK, KINDS, AREAS, list, save, toJpeg };
});
