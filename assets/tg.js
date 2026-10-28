// 📱 Telegram Mini App «🎧 اسمع المحاضرة» (29/10/2026) — /tg/listen/ بنفس المشغّل الموحّد (listen.js).
// - المحاضرة من start_param (https://t.me/<البوت>/listen?startapp=equipment_t03&mode=compact)، أو ?l= برا التليغرام؛ بدونها: قائمة المحاضرات.
// - ألوان التليغرام (themeParams) على ألوان الموقع، وBackButton يرجّع للقائمة، والمسافات الآمنة (safe area) من متغيرات التليغرام.
// - بلا تسجيل دخول وبلا جمع بيانات: ما ينرسل أي شي؛ بس «🐢 أبطأ» ينحفظ بالجهاز.
(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  const view = document.getElementById("tgview");
  const esc = (x) => String(x || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ALIAS = { devices: "equipment", device: "equipment" };
  const site = new URL("../../", location.href).href;

  // الألوان: themeParams ← متغيرات الموقع (وتتحدّث إذا غيّر الطالب الثيم)
  function theme() {
    if (!tg || !tg.themeParams) return;
    const p = tg.themeParams, r = document.documentElement.style;
    const set = (k, v) => v && r.setProperty(k, v);
    set("--bg", p.bg_color); set("--ink", p.text_color); set("--muted", p.hint_color || p.subtitle_text_color);
    set("--card", p.section_bg_color || p.secondary_bg_color); set("--brand", p.button_color || p.link_color);
    set("--line", p.section_separator_color || p.hint_color && p.hint_color + "55");
    set("--brand-soft", (p.button_color || p.link_color) && (p.button_color || p.link_color) + "22");
    set("--hl", (p.button_color || p.link_color) && (p.button_color || p.link_color) + "33");
    document.documentElement.classList.toggle("dark", tg.colorScheme === "dark");
    try { tg.setHeaderColor && tg.setHeaderColor("bg_color"); tg.setBackgroundColor && tg.setBackgroundColor(p.bg_color || "#ffffff"); } catch (e) {}
  }

  function startId() {
    const q = new URLSearchParams(location.search);
    let id = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || q.get("tgWebAppStartParam") || q.get("l") || "";
    id = id.toLowerCase().replace(/-/g, "_");
    const m = id.match(/^([a-z]+)_?([tp])_?0*(\d+)$/);
    return m ? `${ALIAS[m[1]] || m[1]}_${m[2]}${String(m[3]).padStart(2, "0")}` : "";
  }

  let LIST = [];
  const back = () => { if (window.Listen) Listen.stop(); list(); };
  function list() {
    if (tg && tg.BackButton) tg.BackButton.hide();
    const groups = {};
    LIST.forEach((l) => (groups[l.subject + " · " + l.type] = groups[l.subject + " · " + l.type] || []).push(l));
    view.innerHTML = `<h1>🎧 اسمع المحاضرة</h1><p class="sub">نص الأستاذ بالإنكليزي مثل الأصل، بصوت واضح. اختر المحاضرة.</p>` +
      Object.entries(groups).map(([g, ls]) => `<h2 class="tgg">${esc(g)}</h2><div class="list">` +
        ls.map((l) => `<a class="item" href="?l=${l.id}" data-id="${l.id}"><span><b>م${String(l.num).padStart(2, "0")} · ${esc(l.ar)}</b><small><bdi>${esc(l.en)}</bdi></small></span><span class="tag">${l.min} د</span></a>`).join("") +
        `</div>`).join("");
    window.scrollTo(0, 0);
  }
  async function open(id, push) {
    const l = LIST.find((x) => x.id === id);
    if (!l) { list(); return; }
    view.innerHTML = `<p class="sub">⏳ يحمّل «${esc(l.ar)}»…</p>`;
    const html = await fetch(`data/${id}.html`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    if (!html) { view.innerHTML = `<p class="sub">ما گدرت أحمّل المحاضرة. تأكد من النت وجرّب مرة ثانية.</p>`; return; }
    view.innerHTML = `<p class="tgh"><small>${esc(l.subject)} · ${esc(l.type)} · م${String(l.num).padStart(2, "0")}</small></p>` +
      `<h1 class="tgt"><bdi>${esc(l.en)}</bdi></h1><p class="sub">${esc(l.ar)}</p>` + html +
      `<p class="tgf"><a href="${site}${l.page}" target="_blank" rel="noopener">📚 السلايدات والاختبار بالموقع</a></p>`;
    if (tg && tg.BackButton) tg.BackButton.show();
    if (window.Listen) Listen.mount(view.querySelector(".listen"));
    if (push) history.pushState({ id }, "", `?l=${id}`);
    window.scrollTo(0, 0);
  }
  view.addEventListener("click", (ev) => {
    const a = ev.target.closest("a.item[data-id]");
    if (a) { ev.preventDefault(); open(a.dataset.id, !tg); }
  });
  window.addEventListener("popstate", () => { const id = startId(); id ? open(id) : list(); });

  if (tg) {
    tg.ready();
    theme();
    tg.onEvent && tg.onEvent("themeChanged", theme);
    tg.BackButton && tg.BackButton.onClick(back);
  }
  fetch("lectures.json").then((r) => r.json()).then((d) => { LIST = d; const id = startId(); id ? open(id) : list(); })
    .catch(() => { view.innerHTML = `<p class="sub">ما گدرت أحمّل القائمة. تأكد من النت وجرّب مرة ثانية.</p>`; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("../../sw.js", { updateViaCache: "none" }).catch(() => {});
})();
