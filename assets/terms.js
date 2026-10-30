// المصطلحات: قسمين (طلابنا/عامة) + الأعراض، بحث إنكليزي وعربي، فلتر حسب المادة.
// الصوت (29/10): المشغّل الموحّد listen.js — المصطلح نفسه منقّط: ضغطة ← لفظه + بطاقة المعنى و🐢 (ما بقت أزرار 🔊 ولا صوت المتصفح).
(function () {
  const $ = (s) => document.querySelector(s);
  const D = JSON.parse($("#terms-data").textContent);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  let set = ["#general", "#symptoms"].includes(location.hash) ? location.hash.slice(1) : "ours", subj = "", q = "";
  const idx = {};
  for (const k in D) idx[k] = D[k].map((t) => ({ t, s: norm([t.en, t.ar, ...(t.k || [])].join(" ")) }));
  // 🔎 (30/10) ?t=<المصطلح> من نتائج البحث ← نفتح قسمه، نكتبه بالبحث، ونعلّمه أول النتائج
  let hit = "";
  try { hit = new URLSearchParams(location.search).get("t") || ""; } catch (e) {}
  if (hit) {
    const want = hit.toLowerCase().trim();
    const is = (t) => String(t.en).toLowerCase() === want || (t.al || []).some((a) => String(a).toLowerCase() === want);   // (30/10) الصيغة القديمة ← المدخل الأساسي
    const at = [set, ...Object.keys(D).filter((k) => k !== set)].find((k) => D[k].some(is));
    if (at) { const m = D[at].find(is); set = at; hit = m.en; q = hit; const tq = $("#tq"); if (tq) tq.value = hit; } else hit = "";
  }

  function chips() {
    const subs = [...new Set(D[set].map((t) => t.s).filter(Boolean))];
    $("#tf").innerHTML = ['<button class="chip' + (subj ? "" : " on") + '" data-s="">الكل</button>']
      .concat(subs.map((s) => `<button class="chip${s === subj ? " on" : ""}" data-s="${esc(s)}">${esc(s)}</button>`)).join("");
  }
  const pron = (en) => { const i = window.Listen && Listen.find(en); return i ? `<span class="pron"><span class="pa">${i[2]}</span> <bdi class="pi">${esc(i[3])}</bdi></span>` : ""; };
  function render() {
    const words = norm(q).split(" ").filter(Boolean);
    const list = idx[set].filter(({ t, s }) => (!subj || t.s === subj) && words.every((w) => s.includes(w)));
    const H = hit && q === hit ? hit.toLowerCase() : "";
    if (H) list.sort((a, b) => (String(b.t.en).toLowerCase() === H) - (String(a.t.en).toLowerCase() === H));
    $("#tn").textContent = `${list.length} مصطلح`;
    $("#tl").innerHTML = list.slice(0, 400).map(({ t }) => `<article class="term${H && String(t.en).toLowerCase() === H ? " hit" : ""}">
      <div class="th"><bdi class="te">${esc(t.en)}</bdi></div>
      ${pron(t.en)}
      <b class="ta">${esc(t.ar)}</b>${t.d ? `<p>${esc(t.d)}</p>` : ""}
      ${t.s ? `<span class="ts">${esc(t.s)}${t.sa ? " · " + esc(t.sa) : ""}</span>` : ""}
      ${t.c ? `<a class="seecase" href="${esc(t.c)}">🩻 شوف الحالة</a>` : ""}</article>`).join("");
  }
  $("#tt").addEventListener("click", (ev) => {
    const a = ev.target.closest("a[data-set]");
    if (!a) return;
    ev.preventDefault();
    set = a.dataset.set; subj = "";
    document.querySelectorAll("#tt a").forEach((x) => x.classList.toggle("on", x === a));
    history.replaceState(null, "", "#" + set);
    chips(); render();
  });
  $("#tf").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-s]");
    if (!b) return;
    subj = b.dataset.s; chips(); render();
  });
  $("#tq").addEventListener("input", (ev) => { q = ev.target.value; render(); });
  if (set !== "ours") document.querySelectorAll("#tt a").forEach((x) => x.classList.toggle("on", x.dataset.set === set));
  document.addEventListener("listen:ready", render);
  chips(); render();
  if (hit) { const a = $("#tl .term.hit"); if (a) { a.setAttribute("tabindex", "-1"); requestAnimationFrame(() => { a.scrollIntoView({ block: "center" }); a.focus({ preventScroll: true }); }); } }
})();
