// 🏛️ «المنصب مو الشخص» — لمسة رئيس القسم (مسودة 53، 30/10/2026). مربوطة بالمنصب مو بالشخص: تتحدّث وحدها لما يتبدّل الرئيس.
// المصدر الوحيد: settings.dept_head (عام) — وهذا المفتاح ما يطلع من السيرفر إلا لما محمد يفعّل الظهور (هجرة 000053).
// مطفي (أو ماكو مفتاح) ← ما يرسم أي شي، والصفحات الثابتة بيها خانات فارغة مخفية بس (ولا اسم ولا صورة).
// مفعّل ← (1) ترحيب أول زيارة مرة وحدة (صورة دائرية + جملته + «يلا نبدأ») · (2) سطر «بإشراف رئيس القسم د. …» بالرئيسية
//          · (3) بطاقة «كلمة رئيس القسم» · (4) سطر بـ «عن المنصة» · (5) شارة «📢 من رئيس القسم» على إعلاناته.
// أيقونة الموقع تبقى شعار القسم دائماً — هذا الملف ما يلمس favicon ولا manifest.
// 🧪 المعاينة المحلية بس: window.__HEAD_PREVIEW (يحقنه Playwright) يشتغل على localhost/127.0.0.1 فقط — ماكو أي بيانات معاينة بهذا الملف.
(function (root) {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

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
      photo: photoUrl(h.photo),
      welcome: String(h.welcome || "").trim().slice(0, 140),
      word: word.map((x) => String(x || "").trim().slice(0, 90)).filter(Boolean).slice(0, 3),
      word_on: h.word_on !== false && word.length > 0,
      since: String(h.since || ""),
    };
  }
  /** الصورة: صورته إذا موجودة، وإلا شعار القسم (مو صورة شخص). */
  const avatar = (H, rp, cls) => `<img class="${cls}" src="${esc(H.photo || rp + "assets/favicon.svg")}" alt="" width="40" height="40" loading="lazy"${H.photo ? "" : ' data-neutral'}>`;
  const lineHtml = (H, rp) => `${avatar(H, rp, "hd-av")}<span>بإشراف رئيس القسم <b>${esc(H.name)}</b></span>`;
  const wordHtml = (H, rp) => `<h2 class="hd-wt">كلمة رئيس القسم</h2><blockquote class="hd-q">${H.word.map((l) => `<p>${esc(l)}</p>`).join("")}</blockquote>`
    + `<p class="hd-by">${avatar(H, rp, "hd-av sm")}<span>${esc(H.name)}، ${esc(H.title)}</span></p>`;
  const aboutHtml = (H, rp) => `<h2>برعاية رئيس القسم</h2><p class="hd-by">${avatar(H, rp, "hd-av")}<span>تعمل المنصة برعاية وإشراف <b>${esc(H.name)}</b>، ${esc(H.title)}.</span></p>`;
  const welcomeKey = (H) => "t:hdwel:" + (H.since || H.name);

  /** يرسم بالخانات الموجودة. يرجّع شنو انرسم (للاختبار). */
  function render(doc, H, rp, store) {
    const done = [];
    if (!H) return done;
    const slot = (k) => doc.querySelector(`[data-head="${k}"]`);
    const put = (k, h) => { const s = slot(k); if (s) { s.innerHTML = h; s.hidden = false; done.push(k); } };
    put("line", lineHtml(H, rp));
    if (H.word_on) put("word", wordHtml(H, rp));
    put("about", aboutHtml(H, rp));
    // 📢 شارة على إعلان رئيس القسم (الإرسال نفسه مطفي بهالمسودة)
    doc.querySelectorAll(".annbar[data-by='head']").forEach((b) => {
      if (!b.querySelector(".hd-badge")) { b.insertAdjacentHTML("afterbegin", '<span class="hd-badge">📢 من رئيس القسم</span> '); done.push("badge"); }
    });
    // 👋 ترحيب أول زيارة — مرة وحدة لكل رئيس (رئيس جديد ← ترحيب جديد مرة وحدة)
    let seen = false;
    try { seen = store.getItem(welcomeKey(H)) === "1"; } catch (e) { seen = true; }   // التخزين مقفول ← ما نزعج بكل زيارة
    if (!seen && H.welcome && slot("line") && !doc.querySelector(".hd-wel")) {
      doc.body.insertAdjacentHTML("beforeend", `<div class="hd-wel" role="dialog" aria-modal="true" aria-labelledby="hdwt"><div class="hd-box">
        ${avatar(H, rp, "hd-av lg")}<p class="hd-wn" id="hdwt">${esc(H.name)}<small>${esc(H.title)}</small></p>
        <p class="hd-wq">${esc(H.welcome)}</p><button type="button" class="cbtn" data-hd-go>يلا نبدأ</button></div></div>`);
      const w = doc.querySelector(".hd-wel"), close = () => { try { store.setItem(welcomeKey(H), "1"); } catch (e) {} w.remove(); };
      w.querySelector("[data-hd-go]").addEventListener("click", close);
      w.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
      setTimeout(() => { const b = w.querySelector("[data-hd-go]"); if (b && b.focus) b.focus(); }, 0);
      done.push("welcome");
    }
    return done;
  }

  const api = { norm, render, photoUrl, LOCAL };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.DeptHead = api;

  const rp = (() => { try { return new URL(".", document.querySelector('link[rel="manifest"]').href).href; } catch (e) { return "../"; } })();
  const go = (S) => { const H = norm(S && S.dept_head); if (H) render(document, H, rp, localStorage); };
  if (LOCAL.test(location.hostname) && root.__HEAD_PREVIEW) return go({ dept_head: root.__HEAD_PREVIEW });   // 🧪 معاينة محلية بس
  if (!document.querySelector("[data-head]")) return;
  if (root.Net && Net.on) Net.settings().then(go).catch(() => {});
})(typeof window !== "undefined" ? window : globalThis);
