// 🏛️ «المنصب مو الشخص» — لمسة رئيس القسم (مسودة 53، الجولة 2، 30/10/2026). مربوطة بالمنصب مو بالشخص: تتحدّث وحدها لما يتبدّل الرئيس.
// المصدر الوحيد: settings.dept_head (عام) — والسيرفر ما يكتب بيه اسم إلا لما محمد يفعّل الظهور (هجرة 000053).
// مطفي (أو ماكو مفتاح) ← ما يرسم أي شي، والصفحات الثابتة بيها خانات فارغة مخفية بس (ولا اسم ولا صورة).
// مفعّل ← (1) ترحيب أول زيارة مرة وحدة (<dialog> أصلي: الخلفية inert، Esc، ضغطة برا = «يلا نبدأ»، التركيز يرجع لـ «ادخل لمحاضراتك»)
//          · (2) سطر «بإشراف رئيس القسم د. …» · (3) «كلمة رئيس القسم» سطر واحد + «المزيد» · (4) سطر بـ «عن المنصة» · (5) شارة «📢 من رئيس القسم».
// ENG: الاسم والكلمة ما يتترجمون (data-noen, lang="ar" dir="auto")؛ الجمل الثابتة بنسختين (hd-ar / hd-en)؛ name_en/title_en اختياري.
// ماكو صورة ← ماكو دائرة (ولا شعار كبير). أيقونة الموقع تبقى شعار القسم دائماً.
// 🧪 المعاينة المحلية بس: window.__HEAD_PREVIEW (يحقنه Playwright) على localhost/127.0.0.1 فقط — ماكو أي بيانات معاينة بهذا الملف.
(function (root) {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;
  const TITLE_EN = "Head of the Department of Radiology Techniques";

  /** الصورة العامة: «pub/<id>.webp» (نسخة تنعمل وقت التفعيل بس، bucket people العام) أو رابط https كامل. غيرها ← لا. */
  function photoUrl(p) {
    const s = String(p || "");
    if (/^pub\/[0-9a-f-]{36}\.webp$/.test(s)) { const C = root.STUDY_CLOUD || {}; return C.url ? `${C.url}/storage/v1/object/public/people/${s}` : ""; }
    return /^https:\/\//.test(s) || /^\.\.?\//.test(s) ? s : "";
  }
  /** ينظّف الإعداد: يرجّع null إذا مطفي أو ناقص — هيچ أي خانة ما تنرسم بنص فارغ. */
  function norm(h) {
    if (!h || h.on !== true) return null;
    const name = String(h.name || "").trim().slice(0, 120);
    if (name.length < 2) return null;
    const word = Array.isArray(h.word) ? h.word : h.word && Array.isArray(h.word.lines) ? h.word.lines : [];
    return {
      name, title: String(h.title || "رئيس قسم تقنيات الأشعة").slice(0, 120),
      name_en: String(h.name_en || "").trim().slice(0, 120), title_en: String(h.title_en || "").trim().slice(0, 120),
      photo: photoUrl(h.photo),
      welcome: String(h.welcome || "").trim().slice(0, 140),
      word: word.map((x) => String(x || "").trim().slice(0, 90)).filter(Boolean).slice(0, 3),
      word_on: h.word_on !== false && word.length > 0,
      since: String(h.since || ""),
    };
  }
  const ar = (s) => `<span data-noen lang="ar" dir="auto">${esc(s)}</span>`;                       // اسم/كلمة: ما تتترجم
  const bi = (a, e) => `<span class="hd-ar" data-noen>${a}</span><span class="hd-en" lang="en" data-noen>${e}</span>`;   // جملة ثابتة بنسختين
  const nm = (H) => bi(ar(H.name), H.name_en ? esc(H.name_en) : ar(H.name));
  const tt = (H) => bi(ar(H.title), esc(H.title_en || TITLE_EN));
  const avatar = (H, cls) => (H.photo ? `<img class="${cls}" src="${esc(H.photo)}" alt="" width="40" height="40" loading="lazy">` : "");
  const lineHtml = (H) => `${avatar(H, "hd-av")}<span>${bi("بإشراف رئيس القسم", "Supervised by the Head of Department")} <b>${nm(H)}</b></span>`;
  const wordHtml = (H) => {
    const first = H.word[0], rest = H.word.slice(1);
    return `<h2 class="hd-wt">${bi("كلمة رئيس القسم", "A word from the Head of Department")}</h2>`
      + `<p class="hd-q1">${ar("«" + (rest.length ? first.replace(/[.،؛!؟…\s]+$/, "") + "…" : first + "»"))}</p>`
      + (rest.length ? `<details class="hd-more"><summary>${bi("المزيد", "More")}</summary><blockquote class="hd-q">${H.word.map((l) => `<p>${ar(l)}</p>`).join("")}</blockquote></details>` : "")
      + `<p class="hd-by">${avatar(H, "hd-av sm")}<span>— ${nm(H)}، ${tt(H)}</span></p>`;
  };
  const aboutHtml = (H) => `<h2>${bi("برعاية رئيس القسم", "Under the patronage of the Head of Department")}</h2><p class="hd-by">${avatar(H, "hd-av")}<span>`
    + bi(`تعمل المنصة برعاية وإشراف <b>${ar(H.name)}</b>، ${ar(H.title)}.`,
         `The platform runs under the patronage and supervision of <b>${H.name_en ? esc(H.name_en) : ar(H.name)}</b>, ${esc(H.title_en || TITLE_EN)}.`) + "</span></p>";
  const welcomeKey = (H) => "t:hdwel:" + (H.since || H.name);

  /** 👋 الترحيب: <dialog> أصلي بـ showModal() (الخلفية inert، Esc، التركيز محصور)؛ بدونه (متصفح قديم/اختبار) ← نفس الشكل بلا مودال. */
  function welcome(doc, H, store) {
    const d = doc.createElement("dialog");
    d.className = "hd-wel"; d.setAttribute("aria-labelledby", "hdwt"); d.setAttribute("aria-describedby", "hdwq");
    d.innerHTML = `<div class="hd-box">${avatar(H, "hd-av lg")}<p class="hd-wn" id="hdwt">${nm(H)}<small>${tt(H)}</small></p>
      <p class="hd-wq" id="hdwq">${ar(H.welcome)}</p><button type="button" class="cbtn" data-hd-go autofocus>${bi("يلا نبدأ", "Let's start")}</button></div>`;
    doc.body.appendChild(d);
    const back = () => doc.querySelector(".hhero:not([hidden]) .cbtn.big") || doc.querySelector(".cbtn.big");
    const close = () => {
      try { store.setItem(welcomeKey(H), "1"); } catch (e) {}
      doc.documentElement.classList.remove("hd-lock");
      if (d.open && d.close) d.close();
      d.remove();
      const b = back(); if (b && b.focus) b.focus();
    };
    d.querySelector("[data-hd-go]").addEventListener("click", close);
    d.addEventListener("cancel", (ev) => { ev.preventDefault(); close(); });                    // Esc
    d.addEventListener("click", (ev) => { if (ev.target === d) close(); });                       // ضغطة على الخلفية = «يلا نبدأ»
    doc.documentElement.classList.add("hd-lock");                                                  // قفل التمرير
    if (d.showModal) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } } else d.setAttribute("open", "");
    return d;
  }

  /** يرسم بالخانات الموجودة. يرجّع شنو انرسم (للاختبار). */
  function render(doc, H, store) {
    const done = [];
    if (!H) return done;
    const slot = (k) => doc.querySelector(`[data-head="${k}"]`);
    const put = (k, h) => { const s = slot(k); if (s) { s.innerHTML = h; s.hidden = false; done.push(k); } };
    put("line", lineHtml(H));
    if (H.word_on) put("word", wordHtml(H));
    put("about", aboutHtml(H));
    doc.querySelectorAll(".annbar[data-by='head']").forEach((b) => {
      if (!b.querySelector(".hd-badge")) { b.insertAdjacentHTML("afterbegin", `<span class="hd-badge">${bi("📢 من رئيس القسم", "📢 From the Head of Department")}</span> `); done.push("badge"); }
    });
    let seen = false;
    try { seen = store.getItem(welcomeKey(H)) === "1"; } catch (e) { seen = true; }   // التخزين مقفول ← ما نزعج بكل زيارة
    if (!seen && H.welcome && slot("line") && !doc.querySelector(".hd-wel")) { welcome(doc, H, store); done.push("welcome"); }
    return done;
  }

  const api = { norm, render, photoUrl, LOCAL };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.DeptHead = api;

  const go = (S) => { const H = norm(S && S.dept_head); if (H) render(document, H, localStorage); };
  if (LOCAL.test(location.hostname) && root.__HEAD_PREVIEW) return go({ dept_head: root.__HEAD_PREVIEW });   // 🧪 معاينة محلية بس
  if (!document.querySelector("[data-head]")) return;
  if (root.Net && Net.on) Net.settings().then(go).catch(() => {});
})(typeof window !== "undefined" ? window : globalThis);
