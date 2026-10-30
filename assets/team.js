// 👥 صفحة «فريق المنصة» (29/10/2026): الصفحة تنكتب ثابتة وقت البناء (تشتغل بلا JS وبلا نت)،
// وهذا الملف يحدّثها حيّ من جدول Supabase «people» (الظاهرين بس — RLS) حتى تعديلات /admin/ تطلع بدون بناء.
// كاش 30 دقيقة بالجهاز. الصور lazy. نفس شكل preview_team.py بالضبط.
(function () {
  "use strict";
  const box = document.getElementById("ppl"), C = window.STUDY_CLOUD;
  if (!box || !C || !C.url) return;
  let cfg = {};
  try { cfg = JSON.parse(box.dataset.cfg || "{}"); } catch (e) {}
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const GROUPS = [
    ["team", "👥", "فريق المنصة", "", "team"],
    ["doctors", "🩺", "شكر وتقدير", "لأطباء دعموا الطلاب بالصور الشعاعية، وكانوا عوناً لهم بعلمهم وتشجيعهم.", "thanks"],
    ["patrons", "🏛️", "رعاة المنصة", "رؤساء القسم السابقون الذين رعوا المنصة.", "patrons"],   // 🏛️ 54: يطلع بس إذا ظهور رئيس القسم مفعّل (settings.dept_head.on) وفيه أحد
    ["special", "🤝", "شكر خاص", "", "special"],
    ["supporters", "💛", "داعمون", "", "supporters"],
    ["supervision", "🔬", "الإشراف العلمي", "", "supervision"],
  ];
  const PREFIX = ["الصيدلانية", "الصيدلاني", "الدكتورة", "الدكتور", "أ.د.", "د.", "م."];
  const mono = (name) => {
    let n = String(name || "").trim(), again = true;
    while (again) { again = false; for (const p of PREFIX) if (n.startsWith(p)) { n = n.slice(p.length).trim(); again = true; } }
    return (n.match(/\p{L}/u) || ["•"])[0];
  };
  // 🔧 (30/10) جذر الموقع من رابط الـ manifest (مو cfg.rp الثابت من صفحة المعاينة «../../» اللي تكسر بالحي)
  const ROOT = (() => { const l = document.querySelector('link[rel="manifest"]'); return l ? new URL(".", l.href).href : new URL("../", location.href).href; })();
  // نسخ WebP الجاهزة بالصفحة الثابتة (<picture>) ← نرجع نستعملها لنفس الصورة بعد التحديث الحي
  const PIC = {};
  box.querySelectorAll("picture").forEach((pc) => { const im = pc.querySelector("img"); if (im && im.src) PIC[im.src] = [...pc.querySelectorAll("source")].map((x) => x.outerHTML).join(""); });
  const src = (ph) => !ph ? "" : ph.startsWith("assets/") ? new URL(ph, ROOT).href : (cfg.store || C.url + "/storage/v1/object/public/people/") + ph;
  const person = (p, big) => {
    const s = src(p.photo), n = big ? 72 : 48;
    const img = `<img class="pp-av" src="${esc(s)}" alt="" width="${n}" height="${n}" loading="lazy" decoding="async">`;
    const av = s ? (PIC[s] ? `<picture>${PIC[s]}${img}</picture>` : img)
      : `<span class="pp-av pp-mono" aria-hidden="true">${esc(mono(p.name))}</span>`;
    // 🏛️ الرعاة بوضع ENG: name_en إذا موجود (بلا «EN soon»)، وإلا الاسم العربي نفسه بلا ترجمة
    const nm = p.patron || p.grp === "patrons"
      ? `<span class="hd-ar" data-noen>${esc(p.name)}</span><span class="hd-en" lang="en" data-noen>${esc(p.name_en || p.name)}</span>` : esc(p.name);
    return `<li class="pp">${av}<span class="pp-t"><b${p.grp === "patrons" ? ' data-noen dir="auto"' : ""}>${nm}</b>${p.title ? `<small>${esc(p.title)}</small>` : ""}${p.note ? `<span class="pp-note"${p.grp === "patrons" ? ' dir="ltr" style="text-align:start"' : ""}>${esc(p.note)}</span>` : ""}</span></li>`;   // الفترة 2025–2026 تنقرا صح
  };
  // 🏛️ 54: «رعاة المنصة» مربوطة بظهور رئيس القسم — مطفي (أو ما نعرف بعد) ← المجموعة ما تنرسم أبداً، حتى لو وصل صف (دفاع ثاني بعد القاعدة)
  let headOn = false;   // يتخزّن ويّا t:people (ماكو ظهور متأخر)
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const render = (rows) => GROUPS.map(([k, ic, title, sub, anc]) => {
    if (k === "patrons" && !headOn) return "";
    const xs = rows.filter((r) => r.grp === k).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    if (!xs.length) return "";
    const big = k === "team";
    return `<section class="pp-sec" id="${anc}" aria-labelledby="h-${anc}"><h2 id="h-${anc}"><span aria-hidden="true">${ic}</span> ${esc(title)}</h2>` +
      (sub ? `<p class="pp-sub">${esc(sub)}</p>` : "") +
      `<ul class="pp-list${big ? " pp-big" : ""}" role="list">${xs.map((r) => person(r, big)).join("")}</ul></section>`;
  }).join("");

  const KEY = "t:people", TTL = 30 * 60e3;
  const apply = (rows) => {
    if (!Array.isArray(rows)) return;   // [] من Supabase = الكل مخفي ← القائمة تنفرغ
    const html = render(rows);
    if (html !== box.innerHTML) box.innerHTML = html;
  };
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon };
  const preview = LOCAL && window.__HEAD_PREVIEW && window.__HEAD_PREVIEW.on === true;   // 🧪 معاينة محلية بس
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached) { headOn = preview || cached.h === true; apply(cached.d); }   // يرسم المحفوظ فوراً، وبعدين الجديد من الشبكة (التعديل يطلع فوراً)
  // الناس + الظهور المنشور سوا ← رسمة وحدة (القاعدة نفسها تخفي الرعاة وهو مطفي؛ هذا دفاع ثاني)
  Promise.all([
    fetch(`${C.url}/rest/v1/people?select=*&visible=eq.true&order=grp.asc,sort.asc`, { headers: H }).then((r) => (r.ok ? r.json() : null)),
    preview ? Promise.resolve(true) : fetch(`${C.url}/rest/v1/settings?select=value&key=eq.dept_head`, { headers: H })
      .then((r) => (r.ok ? r.json() : [])).then((x) => !!(x && x[0] && x[0].value && x[0].value.on === true)).catch(() => false),
  ]).then(([d, on]) => {
    if (!d) return;
    headOn = on;
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d, h: on })); } catch (e) {}
    apply(d);
  }).catch(() => {});
})();
