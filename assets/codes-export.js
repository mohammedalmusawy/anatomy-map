// 🎓 73 (مسودة، 2/11/2026) — تصدير أكواد الطلاب: كله بمتصفح المالك بس. ولا شي يترفع للموقع ولا للقناة ولا لأي سيرفر.
// ينحمّل وقت الضغط على «تصدير» فقط (admin-students.js). بلا مكتبات خارجية: PDF وXLSX وZIP مكتوبة هنا (صغيرة)،
// والعربي يترسم بـ canvas (يشكّل الحروف ويكتب من اليمين) ← صفحات PDF صور نظيفة بدقة 200 dpi، مو نص خام (jsPDF ما يشكّل العربي).
// window.CodesExport = { text, pdf, xlsx, images, zip, save, CHUNK }
//   items = [{ n, code, stage }]   (n = الرقم التسلسلي)
(function () {
  "use strict";
  const CHUNK = 50;                 // أكواد كل صورة
  const ROWS_PDF = 36;              // صفوف كل صفحة A4
  const FONT = '"Cairo","Noto Naskh Arabic","Noto Sans Arabic","Geeza Pro","Segoe UI",Tahoma,system-ui,sans-serif';
  const MONO = '"SF Mono",Menlo,Consolas,"Roboto Mono","Liberation Mono",monospace';
  const INK = "#1F2430", MUTED = "#5B6170", LINE = "#D9DCE6", BRAND = "#4B5A8A", SOFT = "#EEF0F7", PAPER = "#FFFFFF";
  const enc = new TextEncoder();
  const LTR = (v) => "\u2066" + v + "\u2069";   // رقم/تاريخ داخل نص عربي: يبقى بترتيبه (isolate)
  const today = () => { try { return new Date().toLocaleDateString("en-CA"); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  const stagesOf = (items) => [...new Set(items.map((i) => i.stage))].sort();
  const titleOf = (items) => { const st = stagesOf(items); return "أكواد دخول الطلاب" + (st.length === 1 ? " — المرحلة " + st[0] : ""); };

  async function fonts() { try { await Promise.all(['700 30px Cairo', '400 24px Cairo'].map((f) => document.fonts.load(f, "اختبار"))); await document.fonts.ready; } catch (e) {} }

  // ───────── نص (نسخ الكل) ─────────
  const text = (items) => items.map((i) => i.code).join("\n");

  // ───────── ZIP (بلا ضغط = store) ─────────
  let crcT = null;
  function crc32(u8) {
    if (!crcT) { crcT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
    let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  /** files = [{ name, data: Uint8Array }] ← Blob (application/zip أو mime). */
  function zip(files, mime) {
    const parts = [], cen = []; let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for (const f of files) {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
      parts.push(lh.buffer, nm, f.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      cen.push(ch.buffer, nm);
      off += 30 + nm.length + sz;
    }
    const cl = cen.reduce((a, b) => a + (b.byteLength ?? b.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cl, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...cen, end.buffer], { type: mime || "application/zip" });
  }

  // ───────── XLSX ─────────
  const xe = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const col = ["A", "B", "C", "D"];
  function xlsx(items) {
    const head = ["الرقم", "الكود", "المرحلة", "اسم الطالب"];
    const cs = (r, c, v, s) => `<c r="${col[c]}${r}" t="inlineStr"${s ? ` s="${s}"` : ""}><is><t>${xe(v)}</t></is></c>`;
    const cn = (r, c, v) => `<c r="${col[c]}${r}"><v>${+v}</v></c>`;
    let rows = `<row r="1">${head.map((h, c) => cs(1, c, h, 1)).join("")}</row>`;
    items.forEach((it, i) => { const r = i + 2; rows += `<row r="${r}">${cn(r, 0, it.n)}${cs(r, 1, it.code, 2)}${cn(r, 2, it.stage)}<c r="D${r}" s="3"/></row>`; });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const f = (name, s) => ({ name, data: enc.encode(X + s) });
    return zip([
      f("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'),
      f("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      f("xl/workbook.xml", '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="الأكواد" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      f("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
      f("xl/styles.xml", '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="12"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font><font><sz val="12"/><name val="Consolas"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF0F7"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9DCE6"/></left><right style="thin"><color rgb="FFD9DCE6"/></right><top style="thin"><color rgb="FFD9DCE6"/></top><bottom style="thin"><color rgb="FFD9DCE6"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs></styleSheet>'),
      f("xl/worksheets/sheet1.xml", `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="10" customWidth="1"/><col min="4" max="4" width="36" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`),
    ], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  // ───────── رسم (canvas) ─────────
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.fillStyle = PAPER; x.fillRect(0, 0, w, h); return [c, x]; };
  const T = (x, s, px, y, o = {}) => { x.font = `${o.w || 400} ${px}px ${o.f || FONT}`; x.fillStyle = o.c || INK; x.textBaseline = "middle"; x.direction = o.dir || "rtl"; x.textAlign = o.a || "right"; x.fillText(s, o.x, y); };
  const toBlob = (c, type, q) => new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("canvas"))), type, q));
  const u8 = async (b) => new Uint8Array(await b.arrayBuffer());
  const rr = (x, a, b, w, h, r, fill) => { x.beginPath(); x.roundRect ? x.roundRect(a, b, w, h, r) : x.rect(a, b, w, h); x.fillStyle = fill; x.fill(); };

  // ───────── صور PNG (50 كود بالصورة، عمودين × 25) ─────────
  async function images(items) {
    await fonts();
    const N = Math.max(1, Math.ceil(items.length / CHUNK)), st = stagesOf(items), mixed = st.length > 1, title = titleOf(items), date = today(), out = [];
    const W = 1080, PAD = 40, HEAD = 230, ROW = 58, R = CHUNK / 2, FOOT = 74, H = HEAD + R * ROW + FOOT;
    for (let p = 0; p < N; p++) {
      const part = items.slice(p * CHUNK, (p + 1) * CHUNK), [c, x] = mk(W, H);
      rr(x, 0, 0, W, HEAD - 20, 0, BRAND);
      T(x, title, 52, 70, { x: W - PAD, w: 800, c: "#fff" });
      T(x, `${LTR(p + 1)} من ${LTR(N)}`, 46, 140, { x: W - PAD, w: 800, c: "#fff" });
      T(x, `الأكواد ${LTR(part[0].n + "–" + part[part.length - 1].n)} · ${LTR(date)}`, 30, 192, { x: W - PAD, c: "#E3E7F5" });
      T(x, "سرّي", 30, 70, { x: PAD, a: "left", w: 700, c: "#E3E7F5" });
      const colW = (W - PAD * 2 - 24) / 2;
      part.forEach((it, i) => {
        const cIdx = i < R ? 0 : 1, r = i % R;                       // العمود الأيمن أول (عربي)
        const right = W - PAD - cIdx * (colW + 24), y = HEAD + r * ROW + ROW / 2;
        if (r % 2 === 0) rr(x, right - colW, HEAD + r * ROW + 3, colW, ROW - 6, 10, SOFT);
        T(x, String(it.n), 24, y, { x: right - 14, w: 600, c: MUTED, dir: "ltr" });
        T(x, it.code, 34, y, { x: right - colW + 124, a: "left", f: MONO, w: 700, dir: "ltr" });
        if (mixed) T(x, "مرحلة " + LTR(it.stage), 22, y, { x: right - colW + 14, a: "left", c: MUTED });
      });
      T(x, "الملفات تنحفظ بجهازك بس · لا تنشر هذه القائمة", 26, H - 36, { x: W / 2, a: "center", c: MUTED });
      const name = `اكواد-${st.length === 1 ? "مرحلة" + st[0] + "-" : ""}${String(p + 1).padStart(2, "0")}-من-${String(N).padStart(2, "0")}.png`;
      const blob = await toBlob(c, "image/png");
      out.push({ name, blob, label: `${p + 1} من ${N}`, from: part[0].n, to: part[part.length - 1].n });
    }
    return out;
  }
  async function imagesZip(imgs) { return zip(await Promise.all(imgs.map(async (i) => ({ name: i.name, data: await u8(i.blob) })))); }

  // ───────── PDF (A4، صفحات صور JPEG بدقة 200 dpi) ─────────
  async function pdf(items) {
    await fonts();
    const PW = 1654, PH = 2339, S = 200 / 25.4, mm = (v) => Math.round(v * S);
    const pages = Math.max(1, Math.ceil(items.length / ROWS_PDF)), st = stagesOf(items), title = titleOf(items), date = today();
    const L = mm(12), Rr = PW - mm(12), top = mm(36), rowH = Math.floor((PH - top - mm(14)) / ROWS_PDF);
    // الأعمدة من اليمين: التسلسل | الكود | المرحلة | اسم الطالب (فارغ للكتابة)
    const cNo = Rr, cCode = Rr - mm(20), cStage = Rr - mm(78), cName = Rr - mm(100);
    const jpgs = [];
    for (let p = 0; p < pages; p++) {
      const part = items.slice(p * ROWS_PDF, (p + 1) * ROWS_PDF), [c, x] = mk(PW, PH);
      T(x, title, 56, mm(11), { x: Rr, w: 800 });
      T(x, `التاريخ: ${LTR(date)} · العدد: ${LTR(items.length)}${st.length === 1 ? " · المرحلة: " + LTR(st[0]) : ""}`, 30, mm(19), { x: Rr, c: MUTED });
      T(x, `صفحة ${LTR(p + 1)} من ${LTR(pages)}`, 28, mm(11), { x: L, a: "left", c: MUTED });
      T(x, "سرّي — للتوزيع على الطلاب بس", 26, mm(19), { x: L, a: "left", c: MUTED });
      rr(x, L, top - mm(9), Rr - L, mm(8.5), 8, BRAND);
      T(x, "#", 28, top - mm(4.8), { x: cNo - mm(3), c: "#fff", w: 700, a: "right" });
      T(x, "الكود", 28, top - mm(4.8), { x: cCode - mm(2), c: "#fff", w: 700 });
      T(x, "المرحلة", 28, top - mm(4.8), { x: cStage - mm(2), c: "#fff", w: 700 });
      T(x, "اسم الطالب", 28, top - mm(4.8), { x: cName - mm(2), c: "#fff", w: 700 });
      part.forEach((it, i) => {
        const y0 = top + i * rowH, y = y0 + rowH / 2;
        if (i % 2 === 0) { x.fillStyle = SOFT; x.fillRect(L, y0, Rr - L, rowH); }
        x.strokeStyle = LINE; x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, y0 + rowH); x.lineTo(Rr, y0 + rowH); x.stroke();
        T(x, String(it.n), 30, y, { x: cNo - mm(3), c: MUTED, dir: "ltr" });
        T(x, it.code, 38, y, { x: cCode - mm(2), f: MONO, w: 700, dir: "ltr" });
        T(x, String(it.stage), 32, y, { x: cStage - mm(2), dir: "ltr" });
      });
      x.strokeStyle = LINE; x.lineWidth = 1.5;                         // خطوط أعمدة خفيفة
      for (const cx of [cCode, cStage, cName]) { x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, top + part.length * rowH); x.stroke(); }
      T(x, "الملفات تنحفظ بجهازك بس", 24, PH - mm(6), { x: PW / 2, a: "center", c: MUTED });
      jpgs.push({ data: await u8(await toBlob(c, "image/jpeg", 0.88)), w: PW, h: PH });
    }
    return buildPdf(jpgs, title);
  }
  function buildPdf(imgs, title) {
    const parts = [], offs = []; let len = 0;
    const push = (b) => { const u = typeof b === "string" ? enc.encode(b) : b; parts.push(u); len += u.length; };
    const obj = (id, body, stream) => { offs[id] = len; push(`${id} 0 obj\n${body}`); if (stream) { push("\nstream\n"); push(stream); push("\nendstream"); } push("\nendobj\n"); };
    const n = imgs.length, PWpt = 595.28, PHpt = 841.89;
    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Kids [${imgs.map((_, i) => `${5 + i * 3} 0 R`).join(" ")}] /Count ${n} >>`);
    const hex = "FEFF" + [...title].map((ch) => ch.charCodeAt(0).toString(16).padStart(4, "0")).join("");
    obj(3, `<< /Title <${hex}> /Producer (anatomy-map) >>`);
    imgs.forEach((im, i) => {
      const pid = 5 + i * 3, cid = pid + 1, iid = pid + 2, cont = `q ${PWpt} 0 0 ${PHpt} 0 0 cm /Im0 Do Q`;
      obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PWpt} ${PHpt}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
      obj(cid, `<< /Length ${cont.length} >>`, cont);
      obj(iid, `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>`, im.data);
    });
    const total = 5 + n * 3, xref = len;
    let xr = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) xr += (offs[i] !== undefined ? String(offs[i]).padStart(10, "0") + " 00000 n \n" : "0000000000 65535 f \n");
    push(xr + `trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: "application/pdf" });
  }

  const save = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20000); };
  window.CodesExport = { text, pdf, xlsx, images, imagesZip, zip, save, crc32, CHUNK, ROWS_PDF };
})();
