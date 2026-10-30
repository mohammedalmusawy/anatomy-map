// 🗣️ «صوتك يوصل» — فلتر النص (مسودة 58، 30/10/2026). نفس الدوال بالمتصفح (voice-box.js) وبالسيرفر (dept-voice.ts) — والكلمات من voice-words.json (قائمة يراجعها محمد).
// clean(): يشيل أرقام الهواتف و@المعرّفات والروابط والإيميلات تلقائياً.  check(): ok · nudge (إساءة ← «تقدر تعيد صياغتها؟» والطالب يگدر يرسل كما هي)
//   · block (تهديد صريح لغيره، ما ينرسل) — و crisis = true إذا بيها كلام إيذاء نفس (صندوق دعم هادئ).
(function (root, factory) {
  const M = factory();
  if (typeof module === "object" && module.exports) module.exports = M; else root.VoiceFilter = M;
})(typeof self !== "undefined" ? self : this, function () {
  const AR_DIG = /[٠-٩۰-۹]/g;
  const digits = (s) => s.replace(AR_DIG, (c) => String((c.charCodeAt(0) & 0xF) % 10));
  /** تطبيع للمطابقة بس (النص المرسل ما يتغير بيه). */
  function norm(s) {
    return digits(String(s ?? "")).normalize("NFKC").toLowerCase()
      .replace(/[ً-ٰٟـ]/g, "")            // تشكيل + تطويل
      .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
      .replace(/گ/g, "ك").replace(/چ/g, "ج").replace(/ڤ/g, "ف").replace(/پ/g, "ب")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/(\p{L})\1+/gu, "$1")                            // كلللب ← كلب
      .replace(/\s+/g, " ").trim();
  }
  const CUT = "‹محذوف›";
  const RX = [
    /\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g,                                   // إيميل
    /\b(?:https?:\/\/|www\.)\S+/gi,                                      // رابط
    /\b[\w-]+\.(?:com|net|org|iq|me|io|ly|gl|co|app|info|edu|gov)(?:\/\S*)?\b/gi,   // دومين
    /(?:^|\s)@[\w.]{3,}/g,                                               // @معرّف
    /(?:\+|00)?\d[\d\s\-()]{6,}\d/g,                                     // هاتف (7 أرقام أو أكثر، حتى لو بيها فراغات)
  ];
  /** يشيل وسائل التواصل. يرجّع {text, removed}. */
  function clean(s) {
    let t = digits(String(s ?? "")).normalize("NFC").replace(/[\u0000-\u0008\u000B-\u001F​-‏‪-‮⁦-⁩<>]/g, ""), n = 0;
    for (const rx of RX) t = t.replace(rx, (m) => { n++; return (/^\s/.test(m) ? " " : "") + CUT; });
    return { text: t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(), removed: n };
  }
  const PRE = ["وال", "بال", "فال", "لل", "ال", "يا", "و"];   // بلا «ب» و«ف» وحدها (بعير، بكس…)
  const SUF = ["ات", "ين", "ون", "ه", "ك", "كم"];
  const forms = (w) => {
    const out = new Set([w]);
    for (const p of PRE) if (w.startsWith(p) && w.length - p.length >= 2) out.add(w.slice(p.length));
    for (const x of [...out]) for (const s of SUF) if (x.endsWith(s) && x.length - s.length >= 2) out.add(x.slice(0, -s.length));
    return out;
  };
  /** W = محتوى voice-words.json. */
  function check(s, W) {
    const n = " " + norm(s) + " ", toks = n.trim().split(" ").filter(Boolean), hits = [];
    const has = (list) => (list || []).map(norm).filter((p) => p && n.includes(" " + p + " ") || (p.includes(" ") && n.includes(p)));
    const threat = has(W.threat), crisis = has(W.crisis);
    const ins = new Set([...(W.insult || []), ...(W.insult_en || [])].map(norm));
    for (const t of toks) for (const f of forms(t)) if (ins.has(f)) { hits.push(t); break; }
    hits.push(...has(W.insult_phrase));
    // التهديد والأزمة: نطابق جزء من الكلمة هم (اقتلك داخل «راح اقتلك»)
    const sub = (list) => (list || []).map(norm).filter((p) => p && n.includes(p));
    const th = [...new Set([...threat, ...sub(W.threat)])], cr = [...new Set([...crisis, ...sub(W.crisis)])];
    return { level: th.length ? "block" : hits.length ? "nudge" : "ok", crisis: cr.length > 0 || th.length > 0, self: cr.length > 0, hits: [...new Set(hits)], threat: th };
  }
  // رقم المتابعة: 20 حرف (≈100 بت) من حروف ما تتلخبط، مجمّعة 4-4. يتولّد بالجهاز، والسيرفر يخزن بصمته بس.
  const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  function trackCode(rand) {
    const r = rand || ((n) => { const a = new Uint8Array(n); (globalThis.crypto || require("crypto").webcrypto).getRandomValues(a); return a; });
    const b = r(40); let s = "", i = 0;
    while (s.length < 20) { const x = b[i++ % b.length]; if (x < 248) s += ABC[x % 31]; else if (i > 400) s += ABC[0]; }
    return s.match(/.{4}/g).join("-");
  }
  const codeOk = (c) => /^[2-9A-HJKMNP-Z]{4}(-[2-9A-HJKMNP-Z]{4}){4}$/.test(String(c || ""));
  const codeNorm = (c) => String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").slice(0, 20).replace(/(.{4})(?=.)/g, "$1-");
  return { norm, clean, check, trackCode, codeOk, codeNorm, CUT, KINDS: ["idea", "complaint", "opinion", "thanks"], AREAS: ["subject", "lecture", "services", "dept", "platform", "other"], MAX: 1000 };
});
