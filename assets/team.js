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
  const src = (ph) => !ph ? "" : ph.startsWith("assets/") ? (cfg.rp || "") + ph : (cfg.store || C.url + "/storage/v1/object/public/people/") + ph;
  const person = (p, big) => {
    const s = src(p.photo), n = big ? 72 : 48;
    const av = s ? `<img class="pp-av" src="${esc(s)}" alt="" width="${n}" height="${n}" loading="lazy" decoding="async">`
      : `<span class="pp-av pp-mono" aria-hidden="true">${esc(mono(p.name))}</span>`;
    return `<li class="pp">${av}<span class="pp-t"><b>${esc(p.name)}</b>${p.title ? `<small>${esc(p.title)}</small>` : ""}${p.note ? `<span class="pp-note">${esc(p.note)}</span>` : ""}</span></li>`;
  };
  const render = (rows) => GROUPS.map(([k, ic, title, sub, anc]) => {
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
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (cached) apply(cached.d);   // يرسم المحفوظ فوراً، وبعدين الجديد من الشبكة (التعديل يطلع فوراً)
  fetch(`${C.url}/rest/v1/people?select=id,name,title,note,grp,photo,sort&visible=eq.true&order=grp.asc,sort.asc`,
    { headers: { apikey: C.anon, Authorization: "Bearer " + C.anon } })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (!d) return; try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) {} apply(d); })
    .catch(() => {});
})();
