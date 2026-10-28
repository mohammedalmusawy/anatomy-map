// 🙏 شكر وتقدير (28/10/2026): الأطباء الموافقين بس (consent) — من Supabase مباشرة (يتحدّث من /admin/ بدون بناء)،
// وإذا Supabase ما اشتغل: النسخة المنشورة assets/thanks.json. يملي صفحة /thanks/ وسطر «بدعم وتحفيز» بأسفل أقسام الأطلس.
(function () {
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  const C = window.STUDY_CLOUD;
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const local = () => fetch(root + "assets/thanks.json", { cache: "no-cache" }).then((r) => r.json());
  const Q = "select=id,name,specialty,section,sort&consent=eq.true&order=sort";
  // 📡 net.js: كاش 60 دقيقة (القائمة تتغير نادراً). [] = ما وصل ← النسخة المنشورة
  const live = () => !C ? Promise.reject() : window.Net ? Net.get("thanks", Q, 60 * 60e3).then((r) => (r && r.length ? r : null))
    : fetch(`${C.url}/rest/v1/thanks?${Q}`, { headers: { apikey: C.anon, Authorization: "Bearer " + C.anon } }).then((r) => { if (!r.ok) throw r.status; return r.json(); });
  Promise.all([local().catch(() => ({ sections: {}, doctors: [] })), live().catch(() => null)]).then(([L, D]) => {
    const docs = D || L.doctors || [], S = L.sections || {};
    const list = document.getElementById("thanks");
    if (list && docs.length) {
      list.innerHTML = docs.map((d) => { const s = S[d.section] || {};
        return `<article class="thx-doc"><span class="thx-ic">${s.ic || "🩺"}</span><div><h3>${esc(d.name)}</h3><p>${esc(d.specialty)}</p>` +
          (s.ar ? `<p class="thx-sec">${esc(s.ar)} <bdi>${esc(s.en)}</bdi></p>` : "") + `</div></article>`; }).join("");
    }
    document.querySelectorAll(".thx[data-path]").forEach((el) => {
      const keys = Object.keys(S).filter((k) => (S[k].pages || []).includes(el.dataset.path));
      const names = docs.filter((d) => keys.includes(d.section)).map((d) => esc(d.name));
      if (!names.length) return;
      el.innerHTML = `🙏 بدعم وتحفيز: ${names.join("، ")} · <a href="${root}thanks/">شكر وتقدير</a>`;
      el.hidden = false;
    });
  });
})();
