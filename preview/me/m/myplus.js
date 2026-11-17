// 🪺 «مساحتي الخاصة» — MVP (مسودة 77، 8/11/2026). توسعة لـ «صفحتي» بس (/me/): تحية بالاسم، أفاتار حرفي، 4 ثيمات، إظهار/إخفاء الأقسام،
// مهامي (إضافة سريعة تفهم «باچر/الجمعة/المسا/الساعة 5»)، مؤقت تركيز اختياري، مقالتي، نزّل نسخة من بياناتي، امسح بياناتي.
// ⚙️ كلها خلف settings.sections.myspace_plus = {on, tasks, article, theme, wipe, …} (الفرعية افتراضيها شغّالة إذا on، ما عدا wipe لازم true صريحة).
// 🗄️ التخزين: بلا هجرة — prefs (t:me-theme/avatar/call/layout/focus/article) عبر sync.js، والمهام بـ notes بنوع "todo". ماكو أي طلب شبكة من عندنا
//    إلا استدعاء student_wipe_mine() لما الطالب يأكّد «امسح بياناتي» (ومفتاح wipe شغّال).
// 🛡️ كل نص من الطالب يمر بـ esc()/textContent، ماكو HTML من برّه، والأفاتار يتولّد من دالة ثابتة بأرقام.
// الدوال الصافية (parseTask، greet، avatarSVG، THEMES، contrast، cleanText، exportMD، focusLeft…) تشتغل بـ node (tests/myplus.test.js).
(function (root, factory) {
  const M = factory(typeof module === "object" && module.exports ? require("./myplus-articles.js") : root.MyPlusArticles);
  if (typeof module === "object" && module.exports) module.exports = M; else root.MyPlus = M;
})(typeof self !== "undefined" ? self : this, function (ARTICLES) {
  "use strict";
  const pad = (n) => String(n).padStart(2, "0");
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);   // «constructor» و«__proto__» و«toString» كلمات عادية مو مفاتيح
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
  const hasLS = () => { try { return typeof localStorage !== "undefined"; } catch (e) { return false; } };
  const LS = {
    get(k, d) { if (!hasLS()) return d; try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { if (!hasLS()) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { if (!hasLS()) return; try { localStorage.removeItem(k); } catch (e) {} },
  };
  const WD = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // ═════════ ⚙️ المفاتيح ═════════
  const SUB = ["greet", "avatar", "theme", "layout", "tasks", "focus", "article", "export"];
  function flags(S) {
    const P = (S && S.myspace_plus) || {}, on = P.on === true, f = { on };
    SUB.forEach((k) => { f[k] = on && P[k] !== false; });
    f.wipe = on && P.wipe === true;   // لازم true صريحة (مو افتراضي)
    return f;
  }

  // ═════════ 📅 محلّل المهام: «راجع الكسور باچر المسا» ═════════
  const A2I = (s) => String(s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  const nt = (w) => A2I(w).toLowerCase().replace(/[ً-ْٰـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[چ]/g, "ج").replace(/[ڤ]/g, "ف").replace(/[،,.؟?!؛:"«»()]/g, "");
  const WDN = { احد: 0, الاحد: 0, اثنين: 1, الاثنين: 1, ثنين: 1, الثنين: 1, ثلاثاء: 2, الثلاثاء: 2, الثلاثا: 2, اربعاء: 3, الاربعاء: 3, خميس: 4, الخميس: 4, جمعه: 5, الجمعه: 5, سبت: 6, السبت: 6 };
  const TOMORROW = new Set(["باجر", "بكره", "بكرا", "غدا", "غدًا", "غد", "بجر"]);
  const TODAY = new Set(["اليوم", "هسه", "الان"]);
  const EVE = new Set(["المسا", "المساء", "مساء", "مساءا", "مسا", "بالليل", "الليل", "ليلا"]);
  const ASR = new Set(["العصر", "عصرا", "بالعصر"]);   // العصر = 4 م (مو 7)
  const TONIGHT = new Set(["الليله", "الليلة"]);
  const MORN = new Set(["الصبح", "صباحا", "الصباح", "صبحا", "بالصبح"]);
  const NOON = new Set(["الظهر", "ظهرا", "بالظهر"]);
  const SFX_AM = new Set(["ص", "صباحا", "الصبح", "صبحا"]), SFX_PM = new Set(["م", "مساء", "المسا", "مسا", "ظهرا", "عصرا", "العصر", "الليل", "بالليل", "ليلا"]);
  const DAYWORD = new Set(["الاسبوع", "اسبوع", "يوم", "ايام", "يومين", "اسبوعين"]);
  const NEXTW = new Set(["الجاي", "الجايه", "القادم", "القادمه", "المقبل", "المقبله", "الجايي"]);   // «الخميس الجاي»، «الأسبوع القادم»
  // الساعة بالحروف (واحدة … اثنا عشر)
  const NUMW = { واحده: 1, وحده: 1, واحد: 1, اثنين: 2, اثنتين: 2, ثنتين: 2, ثنين: 2, ثلاثه: 3, ثلاث: 3, اربعه: 4, اربع: 4, خمسه: 5, خمس: 5, سته: 6, ست: 6, سبعه: 7, سبع: 7, ثمانيه: 8, ثمان: 8, تسعه: 9, تسع: 9, عشره: 10, عشر: 10 };
  const TEEN = { احدي: 11, احد: 11, اثنا: 12, اثني: 12 };   // + «عشر/عشرة»

  /** يفهم نص مهمة. now = ms. يرجّع { text, due:"YYYY-MM-DD"|null, time:"HH:MM"|null, slot:"today"|"evening"|"later", label, found } */
  function parseTask(raw, now = Date.now()) {
    const orig = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    const nowD = new Date(now), todayD = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
    // بعد 12 بالليل (قبل 4 الفجر) «باچر» تعني باچر الحقيقي للطالب (يعني بعد نومه): نحسبها من «أمس» التقويمي
    const baseD = nowD.getHours() < 4 ? addDays(todayD, -1) : todayD;
    const toks = orig.split(" ").filter(Boolean), N = toks.map(nt), used = new Array(toks.length).fill(false);
    let off = null, relBase = false, period = null, hh = null, mm = 0, suffix = null, minus = false, relMin = null, absDue = null, multi = false;
    // ساعة بالرقم (5، 5:30، ٥:٣٠) أو بالحروف (خمسة، احدى عشر، اثنا عشر) من التوكن k → {h, m, len} أو null
    const hourAt = (k) => {
      if (k >= toks.length) return null;
      const raw = A2I(toks[k]).replace(/[،,؟?!؛"«»()]/g, ""), m = raw.match(/^(\d{1,2})(?::(\d{2}))?$/);
      if (m) { const h = +m[1], x = m[2] ? +m[2] : 0; return h <= 24 && x <= 59 ? { h, m: x, len: 1 } : null; }
      const w0 = N[k], w1 = N[k + 1] || "";
      if (has(TEEN, w0) && /^عشر/.test(w1)) return { h: TEEN[w0], m: 0, len: 2 };
      if (has(NUMW, w0)) return { h: NUMW[w0], m: 0, len: 1 };
      return null;
    };
    const numAt = (k) => { const raw = A2I(toks[k] || "").replace(/[،,؟?!؛"«»()]/g, ""); if (/^\d{1,3}$/.test(raw)) return +raw; const w0 = N[k] || ""; return has(NUMW, w0) ? NUMW[w0] : null; };
    const use = (...is) => is.forEach((i) => { if (i >= 0 && i < toks.length) used[i] = true; });
    for (let i = 0; i < toks.length; i++) {
      const w = N[i];
      if ((w === "بعد" || w === "عقب") && i + 1 < toks.length && (EVE.has(N[i + 1]) || ASR.has(N[i + 1]) || NOON.has(N[i + 1]) || MORN.has(N[i + 1]))) {   // «بعد/عقب العصر» ← الكلمتين تنشالن
        const nx = N[i + 1]; period = period || (ASR.has(nx) ? "asr" : EVE.has(nx) ? "eve" : NOON.has(nx) ? "noon" : "morn"); use(i, i + 1); i++; continue;
      }
      if (w === "بعد" && i + 1 < toks.length && relMin == null) {   // ⏱️ نسبي من هسه
        const n1 = N[i + 1], n2 = N[i + 2] || "", HR = /^(ساعه|ساعات)$/, MI = /^(دقيقه|دقايق|دقائق|دقيقة)$/;
        if (n1 === "ساعه") { relMin = 60; use(i, i + 1); i++; continue; }
        if (n1 === "ساعتين") { relMin = 120; use(i, i + 1); i++; continue; }
        if (/^(نص|نصف)$/.test(n1) && n2 === "ساعه") { relMin = 30; use(i, i + 1, i + 2); i += 2; continue; }
        if (n1 === "ربع" && n2 === "ساعه") { relMin = 15; use(i, i + 1, i + 2); i += 2; continue; }
        const nv = numAt(i + 1);
        if (nv != null && nv >= 1 && nv <= 48 && HR.test(n2)) { relMin = nv * 60; use(i, i + 1, i + 2); i += 2; continue; }
        if (nv != null && nv >= 1 && nv <= 600 && MI.test(n2)) { relMin = nv; use(i, i + 1, i + 2); i += 2; continue; }
      }
      if (w === "بعد" && i + 1 < toks.length) {
        const nx = N[i + 1];
        if (TOMORROW.has(nx)) { off = 2; relBase = true; use(i, i + 1); i++; continue; }
        if (nx === "يومين") { off = 2; relBase = true; use(i, i + 1); i++; continue; }
        if (nx === "اسبوع" || nx === "اسبوعين") { off = nx === "اسبوع" ? 7 : 14; use(i, i + 1); i++; continue; }
        if (i + 2 < toks.length && /^(يوم|ايام)$/.test(N[i + 2])) { const dn = numAt(i + 1); if (dn != null && dn >= 1 && dn <= 60) { off = dn; use(i, i + 1, i + 2); i += 2; continue; } }
      }
      if ((w === "الاسبوع" || w === "اسبوع") && NEXTW.has(N[i + 1] || "")) { off = 7; use(i, i + 1); i++; continue; }   // الأسبوع الجاي ← بعد 7 أيام (نعرض التاريخ)
      { // 15/11 أو ١٢/١١ أو 15/11/2026 (يوم/شهر). «3/4» (رقمين مفردين بلا سنة) تبقى كسر ← مو تاريخ
        const m = A2I(toks[i]).replace(/[،,؟?!؛"«»()]/g, "").match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
        if (m && absDue == null) {
          const d = +m[1], mo = +m[2], single = m[1].length === 1 && m[2].length === 1 && !m[3];
          if (!single && d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
            let y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : todayD.getFullYear(), D = new Date(y, mo - 1, d);
            if (D.getMonth() === mo - 1 && D.getDate() === d) { if (!m[3] && D < todayD) D = new Date(y + 1, mo - 1, d); if (D.getMonth() === mo - 1 && D.getDate() === d) { absDue = ymd(D); use(i); continue; } }
          }
        }
      }
      if (TOMORROW.has(w)) { off = 1; relBase = true; use(i); continue; }
      if (TODAY.has(w)) { off = 0; use(i); continue; }
      if (TONIGHT.has(w)) { off = 0; period = "night"; use(i); continue; }
      if (has(WDN, w) && !(DAYWORD.has(w))) {
        const prevYom = i > 0 && N[i - 1] === "يوم";
        let diff = (WDN[w] - todayD.getDay() + 7) % 7; if (diff === 0) diff = 7;   // اليوم نفسه ← الأسبوع الجاي (نعرض التاريخ بـ «فهمتها»)
        off = diff; use(i); if (prevYom) use(i - 1);
        if (NEXTW.has(N[i + 1] || "")) use(i + 1);   // «الخميس الجاي» ← تنشال «الجاي»
        { const n1 = N[i + 1] || "", n2 = N[i + 2] || "", st = n1.startsWith("و") && has(WDN, n1.slice(1)) ? 1 : n1 === "و" && has(WDN, n2) ? 2 : 0;   // «الجمعة والسبت» ← أول يوم، ونوضّح
          if (st) { multi = true; use(i + st); if (st === 2) use(i + 1); i += st; } }
        continue;
      }
      if (w === "الساعه" || w === "ساعه" || w === "بالساعه") {
        const sp = hourAt(i + 1);   // رقم أو حروف؛ دقايق مستحيلة (7:70) ← ما نفهمها (تبقى نصاً)
        if (sp) {
          hh = sp.h; mm = sp.m; use(i); for (let k = 0; k < sp.len; k++) use(i + 1 + k);
          let j = i + 1 + sp.len; const a0 = N[j] || "", a1 = N[j + 1] || "";
          if (/^(ونص|ونصف)$/.test(a0)) { mm = 30; use(j); j += 1; }
          else if (a0 === "و" && /^(نص|نصف)$/.test(a1)) { mm = 30; use(j, j + 1); j += 2; }
          else if (a0 === "وربع") { mm = 15; use(j); j += 1; }
          else if (a0 === "و" && a1 === "ربع") { mm = 15; use(j, j + 1); j += 2; }
          else if (a0 === "وثلث") { mm = 20; use(j); j += 1; }
          else if (a0 === "و" && a1 === "ثلث") { mm = 20; use(j, j + 1); j += 2; }
          else if (a0 === "الا" && (a1 === "ربع" || a1 === "ثلث")) { minus = true; mm = a1 === "ربع" ? 45 : 40; use(j, j + 1); j += 2; }
          if (j < toks.length && (SFX_AM.has(N[j]) || SFX_PM.has(N[j]))) { suffix = SFX_AM.has(N[j]) ? "am" : "pm"; use(j); i = j; }
          else i = j - 1;
          continue;
        }
      }
      { // 10:30 لحالها (بلا «الساعة»)
        const m = hh == null && A2I(toks[i]).replace(/[،,.؟?!؛"«»()]/g, "").match(/^(\d{1,2}):([0-5]\d)$/);
        if (m && +m[1] <= 24) { hh = +m[1]; mm = +m[2]; use(i); const nx = N[i + 1] || ""; if (SFX_AM.has(nx) || SFX_PM.has(nx)) { suffix = SFX_AM.has(nx) ? "am" : "pm"; use(i + 1); i++; } continue; }
      }
      if (EVE.has(w)) { period = period || "eve"; use(i); continue; }
      if (ASR.has(w)) { period = period || "asr"; use(i); continue; }
      if (MORN.has(w)) { period = period || "morn"; use(i); continue; }
      if (NOON.has(w)) { period = period || "noon"; use(i); continue; }
    }
    let due = null, time = null;
    if (off != null) { due = ymd(addDays(relBase ? baseD : todayD, off)); }
    if (absDue) due = absDue;
    // الوقت
    if (relMin != null) { const t = new Date(now + relMin * 60e3); due = ymd(t); time = `${pad(t.getHours())}:${pad(t.getMinutes())}`; hh = null; period = null; }
    else if (hh != null) {
      let h = hh;
      const pm = suffix === "pm" || (!suffix && (period === "eve" || period === "night" || period === "asr"));
      const am = suffix === "am" || (!suffix && period === "morn");
      if (h <= 12) {
        if (pm && h < 12) h += 12; else if (am && h === 12) h = 0;
        else if (!pm && !am && period !== "noon") { if (h >= 1 && h <= 6) h += 12; }   // «الساعة 5» ← 5 العصر، «8» ← 8 الصبح
        else if (period === "noon" && h < 12 && h <= 6) h += 12;
      }
      if (minus) h = h - 1 <= 0 ? 12 : h - 1;
      if (h > 23) h = 0;
      time = `${pad(h)}:${pad(mm)}`;
    } else if (period) time = { eve: "19:00", asr: "16:00", night: "21:00", morn: "09:00", noon: "13:00" }[period];
    if ((time || period) && !due) due = ymd(todayD);
    let text = toks.filter((_, i) => !used[i]).join(" ").replace(/\s*[،,\-–:]+\s*$/, "").replace(/^[،,\-–:\s]+/, "").trim();
    const found = used.some(Boolean);
    if (!text) text = "مهمة";   // ما بقى عنوان (كله تاريخ/وقت) ← عنوان محايد، مو كلمة الوقت نفسها
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) time = null;   // ما نخزّن شي مو HH:MM
    if (due && !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(due)) due = null;
    const slot = slotOf({ due, time, period }, ymd(todayD));
    return { text, due, time, slot, found, multi, label: understood({ text, due, time }, now) + (multi ? " (أول يوم منهما)" : "") };
  }
  function slotOf(t, today) {
    if (t.due && t.due > today) return "later";
    if (t.period === "eve" || t.period === "night") return "evening";
    if (t.time && t.time >= "17:00") return "evening";
    return "today";
  }
  /** الخانة وقت العرض (المهمة بيومها تطلع «اليوم»، والفايتة تبقى «اليوم»)، t = {due,time,slot} */
  function effSlot(t, todayKey) {
    if (t.due && t.due > todayKey) return "later";
    if (t.slot === "evening" || (t.time && t.time >= "17:00")) return "evening";
    return "today";
  }
  function dueText(due, now = Date.now(), en = false) {
    if (!due) return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(due))) return "";
    const [y, m, d] = due.split("-").map(Number), D = new Date(y, m - 1, d), n = new Date(now), T = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const diff = Math.round((D - T) / 864e5);
    if (diff === 0) return en ? "today" : "اليوم";
    if (diff === 1) return en ? "tomorrow" : "باچر";
    return `${(en ? WD_EN : WD)[D.getDay()]} ${d}/${m}`;
  }
  const timeText = (t, en = false) => { if (!t || !/^\d{2}:\d{2}$/.test(String(t))) return ""; const [h, m] = t.split(":").map(Number), pm = h >= 12, h12 = h % 12 || 12; return `${h12}${m ? ":" + pad(m) : ""} ${en ? (pm ? "PM" : "AM") : (pm ? "م" : "ص")}`; };
  function understood(p, now = Date.now(), en = false) {
    const parts = !p.due && !p.time ? [en ? "no date (today)" : "بلا موعد (اليوم)"] : [dueText(p.due, now, en) || (en ? "today" : "اليوم"), timeText(p.time, en)].filter(Boolean);
    return `${en ? "Got it" : "فهمتها"}: «${p.text}» · ${parts.join(" · ")}`;
  }

  // ═════════ 👋 التحية ═════════
  // أسماء مركّبة عراقية: «عبد الرحمن»، «أبو بكر»، «أم البنين»، «بنت الهدى»، «ذو الفقار»… الكلمة الأولى + اللي بعدها = اسم واحد
  const COMP = new Set(["عبد", "ابو", "ابي", "ام", "ابن", "بن", "بنت", "ذو", "ذات", "سيد", "شيخ", "ست"]);
  const normN = (w) => String(w).replace(/[ً-ْٰـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  const isCompWord = (w) => COMP.has(normN(String(w || "").trim()));
  /** اسم نظيف: بلا وسوم (حتى الناقصة) ولا أحرف تحكم/اتجاه، حد 60 حرف */
  const cleanName = (s) => String(s ?? "").replace(/<[^>]*>?/g, " ").replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  function units(full) {
    full = cleanName(full);
    const w = full.split(/\s+/).filter(Boolean), out = [];
    for (let i = 0; i < w.length; i++) { if (COMP.has(normN(w[i])) && i + 1 < w.length) { out.push(w[i] + " " + w[i + 1]); i++; } else out.push(w[i]); }
    return out;
  }
  const first = (full, n = 1) => units(full).slice(0, n).join(" ");
  const nameOf = (full, call) => (call === "none" ? "" : call === "two" ? first(full, 2) : first(full, 1));
  const dayWord = (n, en) => en ? (n === 0 ? "today" : n === 1 ? "tomorrow" : `${n} days`) : (n === 0 ? "اليوم" : n === 1 ? "باچر" : n === 2 ? "يومين" : `${n} أيام`);
  /** i = { now, full, call:"first|two|none", g:"m|f|", firstVisit, gapDays, exam:{days,name}|null, plan:{done,total}, resume:{title,daysAgo}|null, weak:bool, en } */
  function greet(i) {
    const en = !!i.en, d = new Date(i.now || Date.now()), h = d.getHours(), nm = nameOf(i.full, i.call), fem = i.g === "f";
    const yaN = nm ? (en ? `, ${nm}` : ` يا ${nm}`) : "";
    const ex = i.exam && i.exam.days >= 0 && i.exam.days <= 3 ? i.exam : null, pl = i.plan || { done: 0, total: 0 };
    const hello = h < 12 ? (en ? "Good morning" : "صباح الخير") : h < 18 ? (en ? "Hello" : "هلا") : (en ? "Good evening" : "مساء الخير");
    let k = "default", text;
    if (i.firstVisit) { k = "first"; const f = i.call === "none" ? "" : i.callSet ? nameOf(i.full, i.call) : first(i.full, 3); text = en ? `Welcome${f ? " " + f : ""}. This is your page. Everything here is yours only.` : `أهلاً${f ? " " + f : ""}، هاي صفحتك. كل شي هنا إلك بس.`; }
    else if (h < 5) { k = "late"; text = en ? `It's late${yaN}. Sleep helps lock in what you studied; shall we continue tomorrow?` : `الوقت متأخر${yaN}. النوم يثبّت اللي درسته؛ نكمّل باچر؟`; }
    else if (ex) { k = "exam"; text = en ? `${ex.days === 0 ? "Today is" : ex.days === 1 ? "Tomorrow is" : `${ex.days} days to`} ${ex.name}${ex.days <= 1 ? " exam" : ""}. A light plan is ready if you want it.` : `${ex.days === 0 ? "اليوم امتحان" : ex.days === 1 ? "باچر امتحان" : `باقي ${dayWord(ex.days)} على`} ${ex.name}. خطة خفيفة جاهزة إذا تريدها.`; if (ex.days <= 1 && !en) text = ex.days === 0 ? `اليوم امتحان ${ex.name}. خطة خفيفة جاهزة إذا تريدها.` : `باچر امتحان ${ex.name}. خطة خفيفة جاهزة إذا تريدها.`; }
    else if (pl.total > 0 && pl.done >= pl.total) { k = "done"; text = en ? "You finished today's plan. You've earned the rest." : "خلّصت خطة اليوم. الاستراحة تستاهلها."; }
    else if (i.weak) { k = "weak"; text = en ? "Mistakes today point to what needs attention. Review just 3 of them." : "الغلط اليوم يدلّك على اللي يحتاج انتباه. راجع 3 منها بس."; }
    else if ((i.gapDays || 0) >= 3) { k = "back"; text = en ? `Welcome back${yaN}. We'll start where you stopped; one small step is enough.` : `${fem ? "هلا بيچ" : "هلا بيك"}${yaN}. نبدي من وين وقفت، وخطوة صغيرة تكفي.`; }
    else if (h >= 17 && i.resume && i.resume.title) { k = "resume"; text = en ? `${hello}${yaN}. You stopped at “${i.resume.title}”. Shall we continue together?` : `${hello}${yaN}. وقفت ${i.resume.daysAgo === 1 ? "أمس" : "قبل"} عند «${i.resume.title}». نكمّلها سوا؟`.replace("قبل عند", "عند"); }
    else if (h < 12 && pl.total > 0) { k = "morning"; const left = pl.total - pl.done; text = en ? `${hello}${yaN}. You have ${left} small thing${left === 1 ? "" : "s"} today.` : `${hello}${yaN}. عندك ${left === 1 ? "شي صغير واحد" : left === 2 ? "شيئين صغار" : left + " أشياء صغيرة"} اليوم.`; }
    else { text = en ? `${hello}${yaN}. Let's continue where you left off.` : `${hello}${yaN}. خلّينا نكمّل من وين وقفت.`; }
    return { key: k, text };
  }

  /** الجملة الأولى (عنوان قصير) والباقي سطر عادي — مثل mockup 01 */
  function splitGreet(text) {
    const t = String(text || ""), m = t.match(/^(.+?[.؟?])\s+([\s\S]+)$/);
    return m && m[1].length <= 60 ? { head: m[1], rest: m[2] } : { head: t, rest: "" };
  }

  // ═════════ 🎨 الأفاتار (36 شكل) ═════════
  const AV_COL = [["#DCE1F0", "#4B5A8A"], ["#E3E8D6", "#56663A"], ["#E9E2F0", "#67578C"], ["#F1E0D8", "#9A5440"], ["#EFE6D4", "#8C6A3A"], ["#E2E6EA", "#4C5266"]];
  const MOTIFS = ["arcs", "dots", "star", "wave", "moon", "lines"];
  const MOTIF = {
    dots: (c) => { let s = ""; for (let y = 12; y < 64; y += 13) for (let x = 12; x < 64; x += 13) s += `<circle cx="${x}" cy="${y}" r="1.8" fill="${c}" opacity=".35"/>`; return s; },
    arcs: (c) => [18, 28, 38, 48].map((r) => `<circle cx="64" cy="64" r="${r}" fill="none" stroke="${c}" stroke-width="2" opacity=".28"/>`).join(""),
    moon: (c, b) => `<circle cx="20" cy="20" r="11" fill="${c}" opacity=".3"/><circle cx="25" cy="16" r="10" fill="${b}"/>`,
    lines: (c) => [...Array(9)].map((_, i) => `<path d="M${i * 9 - 20} 72 L${i * 9 + 20} 0" stroke="${c}" stroke-width="2" opacity=".18"/>`).join(""),
    star: (c) => `<g transform="translate(58 14)" opacity=".3"><rect x="-8" y="-8" width="16" height="16" fill="${c}"/><rect x="-8" y="-8" width="16" height="16" fill="${c}" transform="rotate(45)"/></g>`,
    wave: (c) => `<path d="M0 50 Q16 40 32 50 T64 50 T96 50 V72 H0z" fill="${c}" opacity=".18"/>`,
  };
  let avN = 0;
  const letterOf = (name) => { const m = String(name || "").replace(/<[^>]*>?/g, " ").trim().match(/[\p{L}]/u); return m ? m[0].toUpperCase() : ""; };   // ماكو حرف ← "" (أيقونة شخص محايدة)
  /** SVG من أرقام بس: c 0-5، m من MOTIFS، الحرف مفلتر (حرف واحد) ثم esc */
  function avatarSVG(c, m, name) {
    c = AV_COL[c | 0] ? c | 0 : 0; m = has(MOTIF, m) ? m : "arcs"; const [bg, fg] = AV_COL[c], id = "mav" + ++avN;
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#${id})"><rect width="64" height="64" fill="${bg}"/>${MOTIF[m](fg, bg)}</g>${letterOf(name) ? `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Cairo, sans-serif" font-weight="800" font-size="27" fill="${fg}">${esc(letterOf(name))}</text>` : `<circle cx="32" cy="25" r="9" fill="${fg}" opacity=".6"/><path d="M14 54c2-11 10-16 18-16s16 5 18 16z" fill="${fg}" opacity=".6"/>`}</svg>`;
  }

  // ═════════ 🖌️ الثيمات (لصفحتي بس) ═════════
  const THEMES = {
    paper: { ar: "ورق", en: "Paper", L: { bg: "#F6F2EA", card: "#FCFAF5", ink: "#2B2F38", muted: "#636874", brand: "#4B5A8A", soft: "#ECEDF4" }, D: { brand: "#A9B6E3" } },
    olive: { ar: "زيتون", en: "Olive", L: { bg: "#F3F2EA", card: "#FBFBF6", ink: "#2A2E27", muted: "#5F6459", brand: "#56663A", soft: "#E8ECDD" }, D: { brand: "#B9C79A" } },
    lavender: { ar: "خزامى", en: "Lavender", L: { bg: "#F5F2F6", card: "#FCFBFD", ink: "#2C2A33", muted: "#65626E", brand: "#67578C", soft: "#EEEAF4" }, D: { brand: "#C3B5E6" } },
    clay: { ar: "طين", en: "Clay", L: { bg: "#F7F1EB", card: "#FDFAF6", ink: "#2F2A26", muted: "#6A625B", brand: "#9A5440", soft: "#F4E6E0" }, D: { brand: "#E6A890" } },
  };
  const DARK = { bg: "#1D2027", card: "#252932", ink: "#ECE7DD", muted: "#A9ACB5", ink2: "#1D2027" };
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
  const mix = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("");
  const darkSoft = (k) => mix(THEMES[k].D.brand, DARK.card, 0.2);
  /** كل أزواج النص/الخلفية اللي لازم ≥ 4.5 لكل ثيم (فاتح + داكن) */
  function themePairs(k) {
    const t = THEMES[k], L = t.L, d = t.D.brand, ds = darkSoft(k);
    return [["light ink/bg", L.ink, L.bg], ["light ink/card", L.ink, L.card], ["light muted/bg", L.muted, L.bg], ["light muted/card", L.muted, L.card], ["light brand/bg", L.brand, L.bg], ["light brand/card", L.brand, L.card],
      ["light brand/soft", L.brand, L.soft], ["light ink/soft", L.ink, L.soft], ["light btn text/brand", L.card, L.brand],
      ["dark ink/bg", DARK.ink, DARK.bg], ["dark muted/bg", DARK.muted, DARK.bg], ["dark muted/card", DARK.muted, DARK.card], ["dark brand/bg", d, DARK.bg], ["dark brand/card", d, DARK.card],
      ["dark brand/soft", d, ds], ["dark ink/soft", DARK.ink, ds], ["dark btn text/brand", DARK.bg, d]].map(([n, f, b]) => ({ n, ratio: contrast(f, b) }));
  }
  const ARTICLE_TINT = ["paper", "olive", "lavender", "clay"];
  function themeCSS() {
    let s = "";
    Object.keys(THEMES).forEach((k) => {
      const L = THEMES[k].L, d = THEMES[k].D.brand, sel = `body.calm[data-mt="${k}"]`;
      if (k !== "paper") s += `${sel}{--bg:${L.bg};--card:${L.card};--ink:${L.ink};--muted:${L.muted};--brand:${L.brand};--brand-ink:${L.card};--brand-soft:${L.soft};}
:root[data-theme="dark"] ${sel}{--bg:${DARK.bg};--card:${DARK.card};--ink:${DARK.ink};--muted:${DARK.muted};--brand:${d};--brand-ink:${DARK.bg};--brand-soft:${darkSoft(k)};}\n`;
    });
    ARTICLE_TINT.forEach((k, i) => { const L = THEMES[k].L, d = THEMES[k].D.brand;
      s += `.mart.c${i}{--ab:${L.soft};--ai:${L.ink};--ar:${L.brand};}\n:root[data-theme="dark"] .mart.c${i}{--ab:${darkSoft(k)};--ai:${DARK.ink};--ar:${d};}\n`; });
    return s;
  }

  // ═════════ 📝 مقالتي ═════════
  const LIM = { title: 40, text: 1200 };
  /** نص عادي بس: يشيل وسوم HTML والروابط وأحرف التحكم/الاتجاه المخفية، ويحدّد الطول */
  function cleanText(s, max = LIM.text) {
    return String(s ?? "").replace(/<\/?[A-Za-z!][^<>]*>/g, " ").replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g, "")
      .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
  }
  function articleOf(a) {
    if (!a || typeof a !== "object") return null;
    const base = { shape: a.shape === "quote" ? "quote" : "paper", color: Math.max(0, Math.min(3, a.color | 0)), top: !!a.top, t: +a.t || 0 };
    if (Number.isInteger(a.src) && a.src >= 1 && a.src <= ARTICLES.length) { const x = ARTICLES[a.src - 1]; return Object.assign(base, { src: a.src | 0, title: x.title, text: x.text }); }
    const title = cleanText(typeof a.title === "string" ? a.title : "", LIM.title).replace(/\n/g, " "), text = cleanText(typeof a.text === "string" ? a.text : "");
    return text ? Object.assign(base, { src: "own", title, text }) : null;
  }
  /** HTML آمن (كل نص ينهرب) */
  function articleHTML(a, full = true) {
    const x = articleOf(a); if (!x) return "";
    const paras = x.text.split("\n").filter(Boolean), body = full ? paras : paras.slice(0, 2);
    return `<article class="mart c${x.color} ${x.shape}" dir="auto">${x.shape === "quote" ? '<span class="mq" aria-hidden="true">”</span>' : ""}${x.title ? `<h3>${esc(x.title)}</h3>` : ""}${body.map((p) => `<p>${esc(p)}</p>`).join("")}</article>`;
  }

  // ═════════ ⏱️ مؤقت التركيز ═════════
  /** run = {end, len, pausedLeft?} ← {left (ثواني), done, paused} */
  function focusLeft(run, now = Date.now()) {
    if (!run || typeof run !== "object" || !(Number.isFinite(run.end) || Number.isFinite(run.pausedLeft))) return null;   // قيمة مخرّبة ← ولا جلسة
    if (run.pausedLeft != null) return { left: Math.max(0, Math.round(run.pausedLeft / 1000)), done: false, paused: true };
    const left = Math.max(0, Math.ceil((run.end - now) / 1000)); return { left, done: left === 0, paused: false };
  }
  const clock = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const clampLen = (v) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(1, Math.min(180, v)) : 25; };

  // ═════════ 📦 تصدير + مسح ═════════
  const KEYS_MINE = ["t:notes", "t:mistakes", "t:favs", "t:progress", "t:srs", "t:plan", "t:plan-prev", "t:track", "t:track-remote", "t:reminders", "t:learn", "t:voice", "t:strength", "t:last", "t:intent", "t:exam-guess", "t:asked", "t:tour",
    "t:me-theme", "t:me-avatar", "t:me-call", "t:me-layout", "t:me-focus", "t:me-article", "t:me-focus-run", "t:me-seen", "t:answered", "t:nextexam"];
  /** كل بيانات الطالب المحلية كـ JSON (ما بيها مفاتيح الجلسة ولا الأسرار) */
  function exportJSON(get = (k) => LS.get(k, null), now = Date.now()) {
    const o = { v: 1, kind: "myspace-export", at: now, data: {} };
    KEYS_MINE.forEach((k) => { const v = get(k); if (v != null) o.data[k] = v; });
    return o;
  }
  function exportMD(j, name = "") {
    const D = (j && j.data) || {}, L = [`# مساحتي — نسخة من بياناتي`, "", `${name ? "الاسم: " + name + "\n" : ""}التاريخ: ${j && j.at ? ymd(new Date(j.at)) : ""}`, ""];
    const notes = (Array.isArray(D["t:notes"]) ? D["t:notes"] : []).filter((n) => n && n.text), todos = notes.filter((n) => n.kind === "todo"), plain = notes.filter((n) => n.kind !== "todo");
    L.push("## المهام", "");
    if (!todos.length) L.push("(لا يوجد)");
    todos.forEach((n) => L.push(`- [${n.done ? "x" : " "}] ${String(n.text).replace(/\n/g, " ")}${n.due ? " — " + n.due + (n.time ? " " + n.time : "") : ""}`));
    L.push("", "## الملاحظات", "");
    if (!plain.length) L.push("(لا يوجد)");
    plain.forEach((n) => L.push(`- ${n.d || ""} (${n.kind || "free"}): ${String(n.text).replace(/\n/g, " ")}`));
    const a = D["t:me-article"] && articleOf(D["t:me-article"]);
    L.push("", "## مقالتي", "");
    if (a) L.push(a.title ? `### ${a.title}` : "", a.text); else L.push("(لا يوجد)");
    const R = (Array.isArray(D["t:reminders"]) ? D["t:reminders"] : []).filter((r) => r && r.text);
    L.push("", "## التذكيرات", "");
    if (!R.length) L.push("(لا يوجد)");
    R.forEach((r) => L.push(`- ${r.at ? new Date(r.at).toISOString().slice(0, 16).replace("T", " ") : ""}: ${r.text}`));
    return L.join("\n") + "\n";
  }
  /** يمسح المحلي كله (مفاتيح بياناته + بيانات sync + المخبّأ)، ويبقي ختم «شفت المسح». st = {keys():[], del(k), set(k,v)} */
  function wipeLocal(st, seenAt = 0) {
    const keys = st.keys().filter((k) => KEYS_MINE.includes(k) || /^t:sync:/.test(k) || /^t:me-/.test(k));   // t:stash:* (بيانات طلاب ثانيين بنفس الجهاز) ما تنلمس
    keys.forEach((k) => { if (k !== "t:sync:floor" && k !== "t:sync:owner" && k !== "t:me-wiped-seen") st.del(k); });
    if (seenAt) st.set("t:me-wiped-seen", seenAt);
    return keys.length;
  }

  return { flags, parseTask, effSlot, slotOf, splitGreet, units, has, isCompWord, cleanName, dueText, timeText, understood, greet, nameOf, first, AV_COL, MOTIFS, avatarSVG, letterOf, THEMES, themePairs, contrast, themeCSS, ARTICLES: ARTICLES || [], cleanText, articleOf, articleHTML,
    LIM, focusLeft, clock, clampLen, exportJSON, exportMD, wipeLocal, KEYS_MINE, esc, ymd, LS, WD, SUB };
});
