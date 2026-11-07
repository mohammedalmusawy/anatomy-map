// 📋 74 (مسودة): قراءة قائمة الطلاب من Excel (.xlsx) أو CSV — كلها على جهاز المالك، ولا مكتبة خارجية ولا طلب شبكة.
// xlsx = ملف zip: نفك الـ zip بيدنا (DecompressionStream الجاهز بالمتصفح)، ونقرا sharedStrings + الورقة الأولى بتعابير نصية (بلا DOMParser ← ما فيه XML خارجي ولا كيانات).
// حدود الأمان: ملف ≤ 5 MB، ≤ 500 عنصر بالـ zip، ≤ 30 MB بعد الفك، ≤ 5000 صف.
// الاستعمال: const r = await RosterParse.parseFile(file, defaultStage) ← { rows:[{name, univ, stage, line}], errors:[{line, why}], info:{kind, header, total} }
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m; else root.RosterParse = m;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const MAX_FILE = 5 * 1024 * 1024, MAX_ENTRIES = 500, MAX_UNPACKED = 30 * 1024 * 1024, MAX_ROWS = 5000;
  const AR = "٠١٢٣٤٥٦٧٨٩", FA = "۰۱۲۳۴۵۶۷۸۹";
  const digits = (s) => String(s).replace(/[٠-٩۰-۹]/g, (c) => String(AR.includes(c) ? AR.indexOf(c) : FA.indexOf(c)));
  const fail = (msg) => { const e = new Error(msg); e.user = true; return e; };

  // ───── zip ─────
  const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  async function inflateRaw(u8) {
    const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  /** يرجّع Map(اسم الملف ← {method, csize, usize, off}) من الفهرس المركزي. */
  function zipIndex(b) {
    let e = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) if (u32(b, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw fail("هذا مو ملف Excel (xlsx) سليم.");
    const n = u16(b, e + 10); let o = u32(b, e + 16);
    if (n === 0xffff || o === 0xffffffff) throw fail("ملف Excel كبير جداً (zip64).");
    if (n > MAX_ENTRIES) throw fail("ملف Excel فيه عناصر كثيرة غير طبيعية.");
    const map = new Map(); let total = 0;
    for (let i = 0; i < n; i++) {
      if (o + 46 > b.length || u32(b, o) !== 0x02014b50) throw fail("ملف Excel تالف.");
      const method = u16(b, o + 10), csize = u32(b, o + 20), usize = u32(b, o + 24), nl = u16(b, o + 28), xl = u16(b, o + 30), cl = u16(b, o + 32), loc = u32(b, o + 42);
      const name = new TextDecoder().decode(b.subarray(o + 46, o + 46 + nl));
      total += usize; if (total > MAX_UNPACKED) throw fail("ملف Excel أكبر من المسموح بعد الفك.");
      map.set(name, { method, csize, usize, loc }); o += 46 + nl + xl + cl;
    }
    return map;
  }
  async function zipRead(b, ent) {
    const o = ent.loc;
    if (o + 30 > b.length || u32(b, o) !== 0x04034b50) throw fail("ملف Excel تالف.");
    const start = o + 30 + u16(b, o + 26) + u16(b, o + 28), raw = b.subarray(start, start + ent.csize);
    if (raw.length !== ent.csize) throw fail("ملف Excel مقطوع.");
    if (ent.method === 0) return raw;
    if (ent.method !== 8) throw fail("ضغط غير مدعوم داخل Excel.");
    const out = await inflateRaw(raw);
    if (out.length > MAX_UNPACKED || out.length !== ent.usize) throw fail("ملف Excel تالف (الحجم ما يطابق).");
    return out;
  }

  // ───── xlsx ─────
  const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  const unxml = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (m, g) => g[0] === "#" ? String.fromCodePoint(g[1] === "x" ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10)) : ENT[g]);
  const tText = (x) => { let s = ""; for (const m of x.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) s += m[1]; return unxml(s); };
  const colIdx = (ref) => { let n = 0; for (const c of /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? "") n = n * 26 + c.charCodeAt(0) - 64; return n - 1; };
  const num = (v) => { v = v.trim(); if (/^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(v)) { const n = Number(v); return Number.isInteger(n) ? n.toFixed(0) : v; } return /^-?\d+\.0+$/.test(v) ? v.replace(/\.0+$/, "") : v; };

  async function xlsxMatrix(b) {
    const idx = zipIndex(b), text = async (n) => (idx.has(n) ? new TextDecoder().decode(await zipRead(b, idx.get(n))) : "");
    // الورقة الأولى حسب workbook.xml (وإلا أول ملف بمجلد worksheets)
    let sheet = "";
    const wb = await text("xl/workbook.xml"), rels = await text("xl/_rels/workbook.xml.rels");
    const rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb)?.[1];
    if (rid) for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) { if (new RegExp(`\\bId="${rid}"`).test(m[0])) { const t = /\bTarget="([^"]+)"/.exec(m[0])?.[1]; if (t) sheet = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, ""); } }
    if (!sheet || !idx.has(sheet)) sheet = [...idx.keys()].filter((k) => /^xl\/worksheets\/[^/]+\.xml$/.test(k)).sort()[0] ?? "";
    if (!sheet) throw fail("ما لگيت ورقة بالملف.");
    const sst = []; for (const m of (await text("xl/sharedStrings.xml")).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) sst.push(tText(m[1]));
    const xml = await text(sheet), out = [];
    for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      if (rm[2] === undefined) continue;   // صف فارغ <row r="3"/>
      const r = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? out.length + 1); if (r > MAX_ROWS + 50) throw fail(`الملف فيه أكثر من ${MAX_ROWS} صف.`);
      const row = [];
      for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const at = cm[1], body = cm[2] ?? "", ci = colIdx(/\br="([A-Z]+\d+)"/i.exec(at)?.[1] ?? "A1"), t = /\bt="([^"]+)"/.exec(at)?.[1] ?? "";
        const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1];
        let val = "";
        if (t === "s") val = sst[Number(v)] ?? ""; else if (t === "inlineStr") val = tText(/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(body)?.[1] ?? ""); else if (t === "str" || t === "e") val = unxml(v ?? ""); else if (t === "b") val = v === "1" ? "TRUE" : "FALSE"; else if (v !== undefined) val = num(unxml(v));
        if (ci >= 0 && ci < 60) row[ci] = String(val);
      }
      while (out.length < r - 1) out.push([]);
      out[r - 1] = row;
    }
    return out.map((r) => Array.from(r, (x) => x ?? ""));
  }

  // ───── csv ─────
  function decodeCsv(u8) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(u8).replace(/^﻿/, ""); }
    catch { try { return new TextDecoder("windows-1256").decode(u8); } catch { throw fail("ما گدرت أقرا ترميز الملف. احفظه UTF-8."); } }
  }
  function csvMatrix(text) {
    const first = text.split(/\r?\n/, 1)[0] ?? "";
    const d = [",", ";", "\t"].map((c) => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const out = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"' && cur === "") q = true;
      else if (c === d) { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; out.push(row); row = []; if (out.length > MAX_ROWS + 50) throw fail(`الملف فيه أكثر من ${MAX_ROWS} صف.`); }
      else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); out.push(row); }
    return out;
  }

  // ───── الأعمدة والمراحل ─────
  const norm = (s) => String(s ?? "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[\s_\-.:]+/g, "").toLowerCase();
  const H_NAME = /^(الاسم|اسم|اسمالطالب|اسمالطالبه|الاسمالثلاثي|الاسمالكامل|الاسمالرباعي|name|fullname|studentname|student)$/;
  const H_UNIV = /^(الرقمالجامعي|رقمجامعي|رقمالجامعه|الرقمالاكاديمي|رقمالطالب|رقمالقيد|الرقم|رقم|رقمالتسجيل|univ|univid|universityid|studentid|id|number|no)$/;
  const H_STAGE = /^(المرحله|مرحله|stage|class|level|الصف|السنه)$/;
  const WORDS = [[/^(الاولي|اولي|الاول|اول)$/, 1], [/^(الثانيه|ثانيه|الثاني|ثاني)$/, 2], [/^(الثالثه|ثالثه|الثالث|ثالث)$/, 3], [/^(الرابعه|رابعه|الرابع|رابع)$/, 4], [/^(الخامسه|خامسه|الخامس|خامس)$/, 5], [/^(السادسه|سادسه|السادس|سادس)$/, 6]];
  function parseStage(v) {
    const s = norm(digits(v)).replace(/^(المرحله|مرحله|م|stage|class|level|الصف)/, "");
    if (/^[1-6]$/.test(s)) return Number(s);
    if (/^[1-6](st|nd|rd|th)$/.test(s)) return Number(s[0]);
    for (const [re, n] of WORDS) if (re.test(s)) return n;
    return null;
  }
  const clean = (s) => String(s ?? "").replace(/[\u0000-\u001F​-‏‪-‮⁦-⁩<>]/g, " ").replace(/\s+/g, " ").trim();
  const univClean = (s) => digits(String(s ?? "")).replace(/[\u0000-\u001F\s]/g, "").replace(/^(\d+)\.0+$/, "$1");

  /** matrix ← صفوف جاهزة للرفع. defaultStage = مرحلة العمود الناقص (1–6 أو null). */
  function toRows(matrix, defaultStage) {
    let hdr = -1, ci = { name: -1, univ: -1, stage: -1 };
    for (let r = 0; r < Math.min(matrix.length, 10); r++) {
      const c = { name: -1, univ: -1, stage: -1 };
      matrix[r].forEach((x, i) => { const n = norm(x); if (c.name < 0 && H_NAME.test(n)) c.name = i; else if (c.univ < 0 && H_UNIV.test(n)) c.univ = i; else if (c.stage < 0 && H_STAGE.test(n)) c.stage = i; });
      if (c.name >= 0 && c.univ >= 0) { hdr = r; ci = c; break; }
    }
    if (hdr < 0) {   // بلا عناوين: الترتيب اسم · رقم جامعي · مرحلة
      const w = Math.max(0, ...matrix.slice(0, 10).map((r) => r.length));
      if (w < 2) throw fail("الملف لازم فيه عمودين على الأقل: الاسم والرقم الجامعي.");
      ci = { name: 0, univ: 1, stage: w >= 3 ? 2 : -1 };
    }
    const rows = [], errors = [], seen = new Map();
    for (let r = hdr + 1; r < matrix.length; r++) {
      const m = matrix[r];
      if (!m || m.every((x) => String(x ?? "").trim() === "")) continue;
      const line = r + 1, name = clean(m[ci.name]), univ = univClean(m[ci.univ]);
      let stage = defaultStage;
      if (ci.stage >= 0 && String(m[ci.stage] ?? "").trim() !== "") { stage = parseStage(m[ci.stage]); if (stage === null) { errors.push({ line, why: "المرحلة غير مفهومة" }); continue; } }
      if (!stage) { errors.push({ line, why: "ماكو مرحلة (اختار المرحلة الافتراضية)" }); continue; }
      if (name.length < 3 || name.length > 120) { errors.push({ line, why: "الاسم ناقص أو طويل" }); continue; }
      if (!/^[A-Za-z0-9]{3,40}$/.test(univ)) { errors.push({ line, why: "الرقم الجامعي غلط (حروف إنكليزية وأرقام، 3 على الأقل)" }); continue; }
      if (seen.has(univ.toLowerCase())) { errors.push({ line, why: `الرقم الجامعي مكرر (سطر ${seen.get(univ.toLowerCase())})` }); continue; }
      seen.set(univ.toLowerCase(), line); rows.push({ name, univ, stage, line });
    }
    if (rows.length + errors.length > MAX_ROWS) throw fail(`الملف فيه أكثر من ${MAX_ROWS} صف.`);
    return { rows, errors, header: hdr >= 0, cols: ci };
  }

  async function parseFile(file, defaultStage) {
    if (!file || file.size > MAX_FILE) throw fail("الملف أكبر من 5 MB.");
    const u8 = new Uint8Array(await file.arrayBuffer()), isZip = u8[0] === 0x50 && u8[1] === 0x4b;
    const kind = isZip ? "xlsx" : /\.xlsx?$/i.test(file.name || "") ? "bad" : "csv";
    if (kind === "bad") throw fail("هذا مو ملف xlsx سليم (الصيغة القديمة xls ما تنقرا). احفظه xlsx أو CSV.");
    const matrix = isZip ? await xlsxMatrix(u8) : csvMatrix(decodeCsv(u8));
    const r = toRows(matrix, defaultStage);
    return { ...r, info: { kind, total: r.rows.length + r.errors.length } };
  }

  return { parseFile, toRows, csvMatrix, xlsxMatrix, parseStage, zipIndex, MAX_FILE, MAX_ROWS };
});
