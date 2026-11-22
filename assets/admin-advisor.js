// 🧭 84 — «تقارير المستشار» للمالك بس (تبويب + إشعار وسط اللوحة).
// البيانات: advisor_reports_list / advisor_report_seen (RPC). ⚠️ كل نص جاي من السيرفر ينحط بـ textContent بس (ماكو innerHTML بالبيانات أبداً).
(function () {
  const str = (v) => (v == null || typeof v === "object" || typeof v === "function" || typeof v === "symbol" ? "" : String(v));
  const arr = (v) => (Array.isArray(v) ? v : []);
  const DEPT = "radiology";

  // ───── محلل الماركداون (نقي، بلا DOM): نص ← كتل بيانات ─────
  // inline: «**غامق**» ← [{b:false,t},{b:true,t}] — كل شي حرف حرف نص، حتى <img onerror=…>
  function inline(s) {
    const parts = str(s).split("**"), out = [], n = parts.length;
    parts.forEach((t, i) => {
      const dangling = i === n - 1 && i % 2 === 1;   // «**» بلا إغلاق ← نص عادي
      const tx = dangling ? "**" + t : t;
      if (tx !== "") out.push({ b: i % 2 === 1 && !dangling, t: tx });
    });
    return out;
  }
  const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");
  function parseMd(body) {
    const L = str(body).replace(/\r/g, "").split("\n"), out = []; let i = 0, para = [];
    const flush = () => { if (para.length) { out.push({ k: "p", c: inline(para.join(" ")) }); para = []; } };
    while (i < L.length) {
      const l = L[i], t = l.trim();
      if (!t) { flush(); i++; continue; }
      let m;
      if ((m = /^(#{2,3})\s+(.*)$/.exec(t))) { flush(); out.push({ k: m[1].length === 2 ? "h2" : "h3", c: inline(m[2]) }); i++; continue; }
      if (/^[-*]\s+/.test(t)) { flush(); const items = []; while (i < L.length && /^\s*[-*]\s+/.test(L[i])) { items.push(inline(L[i].trim().replace(/^[-*]\s+/, ""))); i++; } out.push({ k: "ul", items }); continue; }
      if (t.startsWith("|") && i + 1 < L.length && isSep(L[i + 1])) {
        flush(); const head = cells(t).map(inline); i += 2; const rows = [];
        while (i < L.length && L[i].trim().startsWith("|")) { rows.push(cells(L[i]).map(inline)); i++; }
        out.push({ k: "table", head, rows }); continue;
      }
      if (/^>\s?/.test(t)) { flush(); const q = []; while (i < L.length && /^\s*>\s?/.test(L[i])) { q.push(L[i].trim().replace(/^>\s?/, "")); i++; } out.push({ k: "quote", c: inline(q.join(" ")) }); continue; }
      para.push(t); i++;
    }
    flush(); return out;
  }

  // ───── منطق نقي ─────
  const bday = (ts) => { const d = new Date(str(ts)); return isNaN(d) ? "" : new Date(d.getTime() + 3 * 3600e3).toISOString().slice(0, 10); };   // بغداد = UTC+3 ثابت
  const bmonth = (ts) => bday(ts).slice(0, 7);
  // devlog ← { current:[{day,items}], older:[{month,days:[…]}] } (الأحدث أول)
  function groupDevlog(list, now) {
    const cur = bmonth(now || new Date().toISOString()), days = {};
    arr(list).filter((x) => x && typeof x === "object" && bday(x.created_at)).forEach((x) => { const d = bday(x.created_at); (days[d] = days[d] || []).push(x); });
    const keys = Object.keys(days).sort().reverse(), mk = {};
    const current = [], older = [];
    keys.forEach((d) => { const g = { day: d, items: days[d] }; if (d.slice(0, 7) === cur) current.push(g); else { const m = d.slice(0, 7); if (!mk[m]) { mk[m] = { month: m, days: [] }; older.push(mk[m]); } mk[m].days.push(g); } });
    return { current, older };
  }
  const sortReports = (l) => arr(l).filter((x) => x && typeof x === "object" && x.id != null).slice().sort((a, b) => str(b.created_at).localeCompare(str(a.created_at)));
  const unseenCount = (l) => arr(l).filter((x) => x && !x.seen_at).length;
  const newestUnseenId = (l) => { const r = sortReports(l).find((x) => !x.seen_at); return r ? r.id : null; };

  const pure = { parseMd, inline, groupDevlog, sortReports, unseenCount, newestUnseenId, bday, bmonth };
  if (typeof module !== "undefined" && module.exports) module.exports = pure;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // ───── DOM ─────
  function h(tag, a, ...kids) {
    const e = document.createElement(tag);
    for (const k in a || {}) { if (a[k] == null || a[k] === false) continue; if (k === "class") e.className = a[k]; else e.setAttribute(k, a[k]); }
    for (const c of kids.flat()) if (c != null && c !== false) e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    return e;
  }
  const spans = (c) => c.map((x) => (x.b ? h("strong", null, x.t) : document.createTextNode(x.t)));
  function renderMd(body) {
    const root = h("div", { class: "ad-md" });
    parseMd(body).forEach((b) => {
      if (b.k === "h2" || b.k === "h3") root.appendChild(h(b.k, null, spans(b.c)));
      else if (b.k === "p") root.appendChild(h("p", null, spans(b.c)));
      else if (b.k === "quote") root.appendChild(h("blockquote", null, spans(b.c)));
      else if (b.k === "ul") root.appendChild(h("ul", null, b.items.map((it) => h("li", null, spans(it)))));
      else if (b.k === "table") root.appendChild(h("div", { class: "ad-tw" }, h("table", null,
        h("thead", null, h("tr", null, b.head.map((c) => h("th", null, spans(c))))),
        h("tbody", null, b.rows.map((r) => h("tr", null, r.map((c) => h("td", null, spans(c)))))))));
    });
    return root;
  }

  const MON = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const dayLbl = (d) => { const p = d.split("-"); return +p[2] + " " + MON[+p[1] - 1]; };
  const monLbl = (m) => { const p = m.split("-"); return MON[+p[1] - 1] + " " + p[0]; };
  const period = (r) => { const a = str(r.period_from), b = str(r.period_to); return a && b && a !== b ? a + " ← " + b : a || b || bday(r.created_at); };

  // ───── تحميل (وعد واحد مشترك بين الإشعار والتبويب) ─────
  let P = null;
  function load(sb, force) {
    if (P && !force) return P;
    P = Promise.resolve().then(() => sb.rpc("advisor_reports_list", { p_dept: DEPT })).then((r) => {
      if (r && r.error && (r.error.code === "PGRST202" || /could not find the function/i.test(str(r.error.message)))) return { err: "off" };   // (22/11) قبل تفعيل 084 بالقاعدة
      if (r && r.error) return { err: r.error.code === "42501" || /42501|permission|not.*owner/i.test(str(r.error.message)) ? "owner" : "net" };
      const d = (r && r.data && typeof r.data === "object") ? r.data : {};
      return { reports: sortReports(d.reports), devlog: arr(d.devlog) };
    }).catch(() => ({ err: "net" }));
    return P;
  }
  const subs = [];   // يحدّث الإشعار لما يصير «مقروء»
  function markSeen(sb, D, r) {
    if (r.seen_at) return;
    r.seen_at = new Date().toISOString();
    try { Promise.resolve(sb.rpc("advisor_report_seen", { p_id: r.id })).catch(() => {}); } catch (e) { /* نتجاهل */ }
    subs.forEach((f) => f(D));
  }

  function mount(pane, sb) {
    css(); pane.replaceChildren();
    const root = h("div", { id: "advisor", class: "ad" }, h("h2", null, "🧭 تقارير المستشار"));
    const body = h("div", { class: "ad-body" }, h("p", { class: "ad-q" }, "لحظة…"));
    root.appendChild(body); pane.appendChild(root);
    const sig = window.AdminTab && window.AdminTab.signal; let dead = false;
    if (sig) sig.addEventListener("abort", () => { dead = true; }, { once: true });
    load(sb).then((D) => { if (!dead) draw(body, D, sb); });
  }

  function draw(box, D, sb) {
    box.replaceChildren();
    if (D.err === "owner") return box.appendChild(h("p", { class: "ad-off" }, "هذي الصفحة لصاحب الموقع بس."));
    if (D.err === "off") return box.appendChild(h("p", { class: "ad-off" }, "التقارير تبين هنا أول ما تتفعّل قاعدتها (خطوة وحدة من محمد)."));
    if (D.err) return box.appendChild(h("p", { class: "ad-off" }, "ما گدرت أجيب التقارير هسه. حاول بعد شوية."));
    const hot = newestUnseenId(D.reports); let open = null;
    const list = h("div", { class: "ad-list" });
    if (!D.reports.length) list.appendChild(h("p", { class: "ad-q" }, "ماكو تقارير بعد. أول تقرير ينزل هنا من المستشار."));
    D.reports.forEach((r) => {
      const nw = !r.seen_at, det = h("div", { class: "ad-det", hidden: "" });
      const dot = h("i", { class: "ad-dot", "aria-label": "جديد", role: "img" });
      const head = h("button", { type: "button", class: "ad-head", "aria-expanded": "false" },
        h("span", { class: "ad-t" }, nw ? dot : null, h("b", null, str(r.title) || "تقرير"), h("small", null, period(r))),
        h("span", { class: "ad-chip" }, r.cycle === "monthly" ? "شهري" : "أسبوعي"));
      const card = h("article", { class: "ad-card" + (r.id === hot ? " hot" : ""), "data-id": str(r.id) }, head, det);
      head.onclick = () => {
        const was = !det.hasAttribute("hidden");
        if (open && open !== card) { open.querySelector(".ad-det").setAttribute("hidden", ""); open.querySelector(".ad-head").setAttribute("aria-expanded", "false"); open.classList.remove("open"); }
        if (was) { det.setAttribute("hidden", ""); head.setAttribute("aria-expanded", "false"); card.classList.remove("open"); open = null; return; }
        if (!det.firstChild) det.appendChild(renderMd(r.body));
        det.removeAttribute("hidden"); head.setAttribute("aria-expanded", "true"); card.classList.add("open"); open = card;
        if (!r.seen_at) { markSeen(sb, D, r); const d = head.querySelector(".ad-dot"); if (d) d.remove(); card.classList.remove("hot"); }
      };
      list.appendChild(card);
    });
    box.appendChild(list);

    const g = groupDevlog(D.devlog), sec = h("section", { class: "ad-dev" }, h("h3", null, "🛠️ شنو تطوّر هالشهر"));
    const days = (gs) => gs.map((x) => h("div", { class: "ad-day" }, h("h4", null, dayLbl(x.day)),
      x.items.map((it) => h("div", { class: "ad-it" }, h("b", null, str(it.title)),
        (str(it.before_txt) || str(it.after_txt)) ? h("p", { class: "ad-ba" }, h("span", null, str(it.before_txt) || "—"), h("em", { "aria-label": "صار" }, "←"), h("span", null, str(it.after_txt) || "—")) : null,
        str(it.body) ? h("p", { class: "ad-q" }, str(it.body)) : null))));
    if (!g.current.length) sec.appendChild(h("p", { class: "ad-q" }, "ماكو تحديثات مسجلة هالشهر بعد."));
    else sec.appendChild(h("div", null, days(g.current)));
    if (g.older.length) {
      const det = h("details", { class: "ad-old" }, h("summary", null, "الأشهر السابقة"));
      g.older.forEach((m) => det.appendChild(h("div", null, h("h4", { class: "ad-m" }, monLbl(m.month)), days(m.days))));
      sec.appendChild(det);
    }
    box.appendChild(sec);
  }

  // ───── إشعار «تقرير جديد» وسط اللوحة (مو نافذة تحجب) ─────
  function badge(host, sb, open) {
    css();
    return load(sb).then((D) => {
      if (D.err || unseenCount(D.reports) < 1 || !host || !host.parentNode) return null;
      const el = h("div", { class: "ad-badge", role: "status" },
        h("span", { class: "ad-bt" }, "📬 تقرير جديد من المستشار"),
        h("span", { class: "ad-bb" }, h("button", { type: "button", class: "ad-go" }, "افتحه"), h("button", { type: "button", class: "ad-x", "aria-label": "إخفاء" }, "✕")));
      const kill = () => { const i = subs.indexOf(sync); if (i > -1) subs.splice(i, 1); el.remove(); };
      const sync = (d) => { if (unseenCount(d.reports) < 1) kill(); };
      subs.push(sync);
      el.querySelector(".ad-go").onclick = () => { kill(); if (typeof open === "function") open(); };
      el.querySelector(".ad-x").onclick = kill;
      host.parentNode.insertBefore(el, host);
      return el;
    });
  }

  function css() {
    if (document.getElementById("ad-css")) return;
    const st = document.createElement("style"); st.id = "ad-css";
    st.textContent = `
#advisor{display:grid;gap:12px;max-width:720px;margin:0 auto}#advisor h2{margin:4px 0 0}
#advisor button:focus-visible,.ad-badge button:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
#advisor .ad-list{display:grid;gap:8px}
#advisor .ad-card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
#advisor .ad-card.hot{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-soft)}
#advisor .ad-head{width:100%;min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border:0;background:transparent;color:var(--ink);font:inherit;text-align:start;cursor:pointer}
#advisor .ad-t{display:grid;gap:2px;min-width:0;position:relative}#advisor .ad-t b{overflow-wrap:anywhere}#advisor .ad-t small{color:var(--muted);font-size:14px;direction:ltr;text-align:start}
#advisor .ad-chip{flex:none;font-size:13px;font-weight:700;color:var(--brand);background:var(--brand-soft);border-radius:99px;padding:2px 10px}
#advisor .ad-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--bad);margin-inline-end:6px;vertical-align:middle}
#advisor .ad-det{padding:2px 14px 14px;border-top:1px solid var(--line)}#advisor .ad-det[hidden]{display:none}
#advisor .ad-md h2{font-size:18px;margin:14px 0 6px}#advisor .ad-md h3{font-size:16px;margin:12px 0 4px;color:var(--muted)}
#advisor .ad-md p,#advisor .ad-md li{font-size:16px;line-height:1.7;overflow-wrap:anywhere}#advisor .ad-md p{margin:6px 0}#advisor .ad-md ul{margin:6px 0;padding-inline-start:20px}
#advisor .ad-md blockquote{margin:8px 0;padding:8px 12px;border-inline-start:3px solid var(--brand);background:var(--brand-soft);border-radius:8px;font-size:15px}
#advisor .ad-tw{overflow-x:auto;margin:8px 0;-webkit-overflow-scrolling:touch}#advisor .ad-tw table{border-collapse:collapse;min-width:100%;font-size:15px}
#advisor .ad-tw th,#advisor .ad-tw td{border:1px solid var(--line);padding:6px 10px;text-align:start;white-space:nowrap}#advisor .ad-tw th{background:var(--brand-soft)}
#advisor .ad-dev{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}#advisor .ad-dev h3{margin:0 0 8px;font-size:17px}
#advisor .ad-day h4,#advisor .ad-m{margin:12px 0 4px;font-size:15px;color:var(--muted)}
#advisor .ad-it{padding:6px 0;border-bottom:1px solid var(--line)}#advisor .ad-it:last-child{border-bottom:0}#advisor .ad-it b{overflow-wrap:anywhere}
#advisor .ad-ba{margin:4px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:15px}#advisor .ad-ba span{overflow-wrap:anywhere}#advisor .ad-ba span:first-child{color:var(--muted)}#advisor .ad-ba em{color:var(--brand);font-style:normal}
#advisor .ad-old{margin-top:10px}#advisor .ad-old summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:var(--brand);font-weight:700}
#advisor .ad-q{margin:4px 0;color:var(--muted);font-size:15px}
#advisor .ad-off{background:var(--card);border:1px dashed var(--line);border-radius:14px;padding:24px 14px;text-align:center;color:var(--muted)}
.ad-badge{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 14px;max-width:420px;margin:12px auto;padding:12px 16px;background:var(--card);color:var(--ink);border:1px solid var(--brand);border-radius:16px;box-shadow:0 4px 18px rgba(0,0,0,.12);text-align:center}
.ad-badge .ad-bt{font-weight:700}.ad-badge .ad-bb{display:flex;gap:8px;align-items:center}
.ad-badge button{min-height:44px;min-width:44px;border-radius:12px;font:inherit;font-weight:700;cursor:pointer}
.ad-badge .ad-go{border:0;background:var(--brand);color:var(--brand-ink);padding:0 20px}.ad-badge .ad-x{border:1px solid var(--line);background:transparent;color:var(--muted)}
`;
    document.head.appendChild(st);
  }

  window.AdminAdvisor = { mount, badge, _pure: pure, _reset: () => { P = null; subs.length = 0; } };
})();
