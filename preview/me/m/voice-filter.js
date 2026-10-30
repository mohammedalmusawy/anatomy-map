// 🗣️ «صوتك يوصل» — فلتر النص (مسودة 58، الجولة 2). نفس الدوال بالمتصفح (voice-box.js) وبالسيرفر (dept-voice.ts) — والكلمات من voice-words.json (قائمة يراجعها محمد).
// مساعد بس، مو حارس كامل: clean() يشيل الهواتف/@/المعرّفات/الروابط/الإيميلات · check(): ok · nudge (تنبيه صياغة، يگدر يرسل كما هي) · block (تهديد صريح بس).
// المطابقة كلمة كاملة (مو جزء من كلمة): «skill you» ما تطلع «kill you»، و«bomb calorimeter» عادية.
(function (root, factory) {
  const M = factory();
  if (typeof module === "object" && module.exports) module.exports = M; else root.VoiceFilter = M;
})(typeof self !== "undefined" ? self : this, function () {
  const AR_DIG = /[٠-٩۰-۹]/g;
  const digits = (s) => s.replace(AR_DIG, (c) => String((c.charCodeAt(0) & 0xF) % 10));
  /** تطبيع للمطابقة بس (النص المرسل ما يتغير بيه). الحرف المكرر 3 مرات أو أكثر ← حرف واحد (غبيييي ← غبي)، والمكرر مرتين يبقى (kill تبقى kill). */
  function norm(s) {
    return digits(String(s ?? "").normalize("NFKC")).toLowerCase()
      .replace(/[ً-ٰٟـ​-‏]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
      .replace(/گ/g, "ك").replace(/چ/g, "ج").replace(/ڤ/g, "ف").replace(/پ/g, "ب")
      .replace(/['’`]/g, "")                                     // I'm ← im · I'll ← ill
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/(\p{L})\1{2,}/gu, "$1")
      .replace(/\s+/g, " ").trim();
  }
  const CUT = "‹محذوف›";
  const SOCIAL = "(?:انستا|انستغرام|انستكرام|insta|instagram|ig|سناب|snap|snapchat|تلي|تلكرام|تليكرام|تيليجرام|telegram|tg|فيس|facebook|fb|تيك توك|tiktok|واتساب|whatsapp|يوزري|حسابي|يوزر|user)";
  const DATE = /^(\d{1,4})\s?[-/.]\s?(\d{1,4})(?:\s?[-/.]\s?(\d{2,4}))?$/;
  const isDate = (m) => { const x = DATE.exec(m.trim()); if (!x) return false; const p = x.slice(1).filter(Boolean).map(Number);
    return (p.length === 2 && p[0] >= 1900 && p[1] >= 1900) || (p.length === 3 && (p[0] <= 31 || p[0] >= 1900) && (p[2] >= 1900 || p[2] <= 99)); };
  const RX = [
    [/\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g],                                                       // إيميل
    [/\b(?:https?:\/\/|www\.)\S+/gi],                                                          // رابط
    [/\b[\w-]+\.(?:com|net|org|iq|me|io|ly|gl|co|app|info|edu|gov|link|page)(?:\/\S*)?\b/gi],  // دومين
    [/(^|[\s(])@[\w.]{2,}/g],                                                                   // @معرّف
    [new RegExp(SOCIAL + "\\s*[:：]?\\s*@?[A-Za-z][\\w.]{2,}", "giu")],                         // «انستا ali.hassan99»
    [/\b[A-Za-z]{2,}[._][A-Za-z0-9._]*\d[A-Za-z0-9._]*\b|\b[A-Za-z]{3,}\d{3,}\b/g],             // معرّف شكله ali.hassan99 / ali_99 / ali1999 (مو T1 ولا CT2)
    [/(?:\+|00)?\d(?:[\s.\-_()/]{0,2}\d){6,}/g, isDate],                                        // هاتف (7 أرقام أو أكثر) — بس مو تاريخ
  ];
  /** يشيل وسائل التواصل. يرجّع {text, removed}. */
  function clean(s) {
    let t = digits(String(s ?? "").normalize("NFKC")).replace(/[\u0000-\u0008\u000B-\u001F​-‏‪-‮⁦-⁩<>]/g, ""), n = 0;
    for (const [rx, keep] of RX) t = t.replace(rx, (m, pre) => { if (keep && keep(m)) return m; n++; return (typeof pre === "string" && /^[\s(]$/.test(pre) ? pre : /^\s/.test(m) ? " " : "") + CUT; });
    return { text: t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(), removed: n };
  }
  const PRE = ["وال", "بال", "فال", "هال", "لل", "ال", "و"];
  const SUF = ["ات", "ين", "ون", "ه", "ك", "كم"];
  const forms = (w) => {
    const out = new Set([w]);
    for (const p of PRE) if (w.startsWith(p) && w.length - p.length >= 2) out.add(w.slice(p.length));
    for (const x of [...out]) for (const s of SUF) if (x.endsWith(s) && x.length - s.length >= 2) out.add(x.slice(0, -s.length));
    return out;
  };
  const PRAISE = new Set(["حيوان", "وحش"]);
  const FILL = new Set(["an", "a", "so", "very", "such", "are", "is", "كلش", "جدا", "هوايه", "شكد", "صدك", "اكثر", "حيل"]);
  const cache = new WeakMap();
  const prep = (W) => { let c = cache.get(W); if (c) return c;
    const set = (k) => new Set((W[k] || []).map(norm).filter(Boolean)), list = (k) => (W[k] || []).map(norm).filter(Boolean);
    c = { hard: set("hard"), soft: set("soft"), target: set("target"), phrase: list("phrase"), threat: list("threat"), crisis: list("crisis") };
    cache.set(W, c); return c; };
  /** W = محتوى voice-words.json. العبارات تنطابق ككلمات كاملة (بداية ونهاية كلمة). */
  function check(s, W) {
    const P = prep(W || {}), n = " " + norm(s) + " ", toks = n.trim().split(" ").filter(Boolean);
    const has = (list) => list.filter((p) => n.includes(" " + p + " "));
    const hits = [];
    toks.forEach((t, i) => {
      const f = forms(t);
      if ([...f].some((x) => P.hard.has(x))) return hits.push(t);
      if (PRAISE.has(t) && toks[i + 1] && toks[i + 1].startsWith("ب")) return;   // «حيوان بالشرح» = مدح
      if ([...f].some((x) => P.soft.has(x))) {   // موجّهة لشخص: «يا/انت/الأستاذ …» قبلها مباشرة، أو قبلها بكلمة حشو («you are an idiot»، «انت كلش غبي»)
        const p1 = toks[i - 1], p2 = toks[i - 2], p3 = toks[i - 3];
        if (P.target.has(p1) || (FILL.has(p1) && (P.target.has(p2) || (FILL.has(p2) && P.target.has(p3))))) hits.push(t);
      }
    });
    hits.push(...has(P.phrase));
    const th = has(P.threat), cr = has(P.crisis);
    return { level: th.length ? "block" : hits.length ? "nudge" : "ok", crisis: cr.length > 0 || th.length > 0, self: cr.length > 0, hits: [...new Set(hits)], threat: th };
  }
  // رقم المتابعة: 20 حرف (≈100 بت) من حروف ما تتلخبط، مجمّعة 4-4. يتولّد بالجهاز، والسيرفر يخزن بصمته بس.
  const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  function trackCode(rand) {
    const r = rand || ((n) => { const a = new Uint8Array(n); (globalThis.crypto || require("crypto").webcrypto).getRandomValues(a); return a; });
    let s = "";
    while (s.length < 20) { const b = r(32); for (const x of b) { if (x < 248 && s.length < 20) s += ABC[x % 31]; } }
    return s.match(/.{4}/g).join("-");
  }
  const codeOk = (c) => /^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/.test(String(c || ""));
  const codeNorm = (c) => String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").slice(0, 20).replace(/(.{4})(?=.)/g, "$1-");
  return { norm, clean, check, trackCode, codeOk, codeNorm, CUT, KINDS: ["idea", "complaint", "opinion", "thanks"], AREAS: ["subject", "lecture", "services", "dept", "platform", "other"], MAX: 1000 };
});
