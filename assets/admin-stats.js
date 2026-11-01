// 📊 71 (مسودة، 1/11/2026) — «الإحصائيات» للمالك بس: شاشة وحدة، هدف واحد (شكد ينستعمل الموقع).
// البيانات من دالة owner-stats (action:get, period:today|week|month) — الأرقام مجمّعة ومخفية k ≥ 5 بالقاعدة (هجرة 071).
// ⚠️ كل نص جاي من السيرفر ينحط بـ textContent بس (ماكو innerHTML بهذا الملف أبداً).
// ولا طلب إلا لما المالك يفتح التبويب؛ الفترات تنحفظ بالذاكرة لحد ما يطلع من التبويب.
(function () {
  const SEC = { "": "الرئيسية", lessons: "الرئيسية", atlas: "الأطلس", learn: "المحاضرات", quiz: "الاختبارات", terms: "القاموس",
    exams: "الامتحانات", me: "مساحتي", assistant: "المساعد", contrast: "الفحوصات الملوّنة", devices: "الأجهزة", search: "البحث",
    guide: "دليل الموقع", tools: "أدوات الطالب", study: "المراجعة", tg: "التليغرام", team: "فريق المنصة", thanks: "شكر وتقدير",
    about: "عن المنصة", physics: "الفيزياء", "map.html": "خريطة التشريح", "new-map.html": "خريطة التشريح الجديدة" };
  const PERIODS = [["today", "اليوم"], ["week", "هالأسبوع"], ["month", "هالشهر"]];
  const OFF = "الأرقام تبين بعد تفعيل الإحصائيات";

  // عنصر بنص آمن: h("p", {class:"x"}, "نص", عنصر…) — النص دائماً textContent (عقدة نص)
  function h(tag, a, ...kids) {
    const e = document.createElement(tag);
    for (const k in a || {}) { if (a[k] == null || a[k] === false) continue; if (k === "class") e.className = a[k]; else e.setAttribute(k, a[k]); }
    for (const c of kids.flat()) if (c != null && c !== false) e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    return e;
  }
  const S = "http://www.w3.org/2000/svg";
  const sv = (tag, a) => { const e = document.createElementNS(S, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };

  // رقم أو «أقل من 5» أو «≈» كما هو؛ null ← «—»
  const num = (v) => v == null || v === "" ? "—" : typeof v === "number" ? v.toLocaleString("en-US") : String(v);
  const pct = (v) => typeof v === "number" ? v + "%" : v == null || v === "" ? "—" : String(v);
  const usd = (v) => typeof v === "number" ? "$" + v.toFixed(v < 100 ? 2 : 0) : num(v);
  const isNum = (v) => typeof v === "number" && isFinite(v);

  function baghdad(ts) {
    const d = new Date(ts); if (isNaN(d)) return "—";
    try { return d.toLocaleString("en-GB", { timeZone: "Asia/Baghdad", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", ""); }
    catch (e) { return d.toISOString().slice(0, 16).replace("T", " "); }
  }

  // أسماء المحاضرات من study/data.json: «anatomy/theory/1» ← «تشريح · نظري م1 — الحوض العظمي»
  let LEC = null;
  const lectures = () => LEC || (LEC = fetch(new URL("../study/data.json", location.href)).then((r) => r.json()).catch(() => ({})));
  function lecName(D, id) {
    const m = /^\/?(?:(?:learn|quiz|terms)\/)?([a-z0-9-]+)\/(theory|practical)\/(\d+)\/?$/.exec(String(id || ""));
    if (!m) return String(id || "—");
    const s = D[m[1]] || {}, L = (s.lectures || []).find((x) => x.type === m[2] && String(x.num) === m[3]);
    const t = (m[2] === "theory" ? "نظري" : "عملي") + " م" + m[3];
    return (s.name ? s.name + " · " : "") + t + (L && L.title_ar ? " — " + L.title_ar : "");
  }

  const kpi = (label, v, sub) => h("div", { class: "os-k" }, h("b", { dir: "ltr" }, v), h("span", null, label), sub ? h("small", null, sub) : null);
  const card = (title, ...kids) => h("section", { class: "os-c" }, h("h3", null, title), ...kids);
  const quiet = (t) => h("p", { class: "os-q" }, t);

  function chart(series) {
    const pts = (series || []).filter((x) => x && x.day);
    if (!pts.length) return quiet("ماكو أيام بهالفترة بعد.");
    const W = 600, H = 150, pad = 22, n = pts.length, bw = Math.max(4, Math.min(48, (W - 8) / n - 4));
    const vals = pts.map((x) => isNum(x.devices) ? x.devices : 0), max = Math.max(5, ...vals);
    const desc = pts.map((x) => x.day.slice(5) + ": " + num(x.devices)).join("، ");
    const svg = sv("svg", { viewBox: `0 0 ${W} ${H + pad}`, class: "os-svg", role: "img", "aria-label": "الأجهزة يومياً — " + desc, preserveAspectRatio: "none" });
    svg.appendChild(sv("line", { x1: 0, x2: W, y1: H, y2: H, class: "os-ax" }));
    pts.forEach((x, i) => {
      const v = x.devices, small = typeof v === "string", bh = isNum(v) ? Math.max(v ? 3 : 0, (v / max) * (H - 18)) : small ? 6 : 0;
      const cx = (W / n) * i + (W / n - bw) / 2;
      const g = sv("g", {}); const t = sv("title", {}); t.textContent = x.day + " — " + num(v) + " جهاز"; g.appendChild(t);
      g.appendChild(sv("rect", { x: cx, y: H - bh, width: bw, height: bh, rx: 3, class: small ? "os-bar os-sm" : "os-bar" }));
      if (n <= 14 || i % Math.ceil(n / 10) === 0) { const lb = sv("text", { x: cx + bw / 2, y: H + 15, "text-anchor": "middle", class: "os-tx" }); lb.textContent = x.day.slice(8); g.appendChild(lb); }
      svg.appendChild(g);
    });
    return h("figure", { class: "os-fig" }, svg, h("figcaption", { class: "os-q" }, "الأجهزة كل يوم (بتوقيت بغداد) · العمود الفاتح = أقل من 5"));
  }

  function splitBox(sp) {
    if (!sp || sp.ready !== true) return quiet("الطلاب: يبين بعد تفعيل الأكواد");
    const row = (k, label) => { const x = sp[k] || {}; return [kpi(label, num(x.students), pct(x.students_pct)), kpi(label, num(x.visitors), pct(x.visitors_pct))]; };
    const st = h("div", { class: "os-kp" }), vi = h("div", { class: "os-kp" });
    [["devices", "أجهزة"], ["visits", "زيارات"], ["returning", "رجعوا"]].forEach(([k, l]) => { const [a, b] = row(k, l); st.appendChild(a); vi.appendChild(b); });
    return h("div", { class: "os-two" }, card("👨‍🎓 الطلاب (بالكود)", st), card("🌍 الزوار", vi));
  }

  function render(box, d, D) {
    const u = d.usage || {}, sec = d.sections || {}, lec = d.lectures || {}, q = d.quiz || {}, as = d.assistant || null, bud = d.budget || {};
    const top = (sec.top || [])[0];
    box.appendChild(card("🌐 الاستخدام العام",
      h("div", { class: "os-kp" }, kpi("أجهزة", num(u.devices)), kpi("زيارات", num(u.visits)), kpi("رجعوا", num(u.returning), pct(u.returning_pct)), kpi("معدل يومي", num(u.avg_daily))),
      top ? h("p", { class: "os-q" }, h("span", null, "أكثر قسم:"), " ", h("b", null, SEC[top.s] ?? String(top.s))) : null,
      (u.suspect || u.test_excluded) ? h("p", { class: "os-q" }, h("span", null, "مستبعد من الأرقام:"), " ", h("bdi", null, num(u.suspect)), " ", h("span", null, "مشبوه"), " · ", h("bdi", null, num(u.test_excluded)), " ", h("span", null, "اختبار آلي")) : null));
    box.appendChild(splitBox(d.split));

    const secL = h("ol", { class: "os-l" }, (sec.top || []).map((x) => h("li", null, h("span", null, SEC[x.s] ?? String(x.s)), h("b", { dir: "ltr" }, num(x.p)))));
    const lecL = h("ol", { class: "os-l" }, (lec.top || []).slice(0, 5).map((x) => h("li", null, h("span", null, lecName(D, x.id)), h("b", { dir: "ltr" }, num(x.p)))));
    box.appendChild(card("⭐ الأكثر استعمالاً",
      h("h4", null, "الأقسام"), (sec.top || []).length ? secL : quiet("ماكو قسم وصل 5 أجهزة بعد."),
      sec.hidden ? h("p", { class: "os-q" }, h("span", null, "أقسام أصغر من 5 أجهزة:"), " ", h("bdi", null, num(sec.hidden))) : null,
      h("h4", null, "أكثر 5 محاضرات"), (lec.top || []).length ? lecL : quiet("ماكو محاضرة وصلت 5 أجهزة بعد."),
      lec.small ? h("p", { class: "os-q" }, h("span", null, "محاضرات أصغر من 5 أجهزة:"), " ", h("bdi", null, num(lec.small))) : null,
      h("p", { class: "os-q" }, "الرقم = عدد الأجهزة")));

    const hard = (q.hard || []).map((x) => h("li", null, h("span", { class: "os-qq", dir: "ltr", lang: "en" }, String(x.q ?? "")),
      h("small", null, lecName(D, x.quiz)), h("b", { dir: "ltr" }, pct(x.wrong_pct))));
    box.appendChild(card("📝 الاختبارات",
      h("div", { class: "os-kp" }, kpi("أجوبة (أول محاولة)", num(q.answers)), kpi("صح", pct(q.correct_pct)), kpi("أسئلة صعبة", num(q.hard_count))),
      hard.length ? [h("h4", null, "الأسئلة الصعبة (أكثر من 70% غلط)"), h("ol", { class: "os-l os-hard" }, hard)] : quiet("ماكو سؤال صعب (أكثر من 70% غلط) بهالفترة.")));

    const cap = isNum(bud.usd) ? bud.usd : 75, spent = isNum(bud.month_cost_usd) ? bud.month_cost_usd : null;
    const p = isNum(bud.pct) ? bud.pct : spent != null && cap > 0 ? Math.round((100 * spent) / cap) : null;
    const bar = h("div", { class: "os-bar-w", role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(p ?? 0), "aria-label": "صرف المساعد هالشهر" },
      h("i", { style: `width:${Math.max(0, Math.min(100, p ?? 0))}%`, class: (p ?? 0) >= 80 ? "hot" : null }));
    box.appendChild(card("🤖 المساعد",
      h("div", { class: "os-kp" }, kpi("أسئلة", num(as && as.questions)), kpi("كلفة الفترة", usd(as && as.cost_usd))),
      h("p", { class: "os-q" }, h("span", null, "صرف هالشهر:"), " ", h("bdi", { dir: "ltr" }, usd(spent)), " ", h("span", null, "من أصل"), " ", h("bdi", { dir: "ltr" }, "$" + cap), " ", h("bdi", { dir: "ltr" }, "(" + pct(p) + ")")), bar,
      as ? null : quiet("المساعد ما عنده أرقام بعد.")));

    box.appendChild(card("📈 كل يوم", chart(d.series)));
  }

  function mount(pane, call) {
    const sig = window.AdminTab && window.AdminTab.signal;
    const cache = {};
    pane.replaceChildren();
    const sw = h("div", { class: "os-sw", role: "group", "aria-label": "الفترة" });
    const when = h("p", { class: "os-when", "aria-live": "polite" });
    const body = h("div", { class: "os-body" });
    pane.appendChild(h("div", { id: "ostats", class: "os" }, h("h2", null, "📊 الإحصائيات"), sw, when, body));
    let cur = "today", seq = 0;
    PERIODS.forEach(([k, t]) => { const b = h("button", { type: "button", "data-p": k, "aria-pressed": k === cur ? "true" : "false" }, t); b.onclick = () => go(k); sw.appendChild(b); });
    async function go(k) {
      cur = k; const my = ++seq;
      sw.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.p === k ? "true" : "false"));
      body.replaceChildren(quiet("لحظة…")); when.replaceChildren();
      let r;
      try { r = cache[k] || (cache[k] = await call({ action: "get", period: k })); } catch (e) { r = { status: 0 }; }
      const D = await lectures();
      if (my !== seq || (sig && sig.aborted)) return;
      body.replaceChildren();
      if (!r || r.status !== 200) { delete cache[k]; body.appendChild(h("div", { class: "os-off" }, h("b", null, "📊"), h("p", null, OFF))); return; }
      if (r.empty) { body.appendChild(h("div", { class: "os-off" }, h("b", null, "🌙"), h("p", null, typeof r.msg === "string" && r.msg ? r.msg : OFF))); return; }
      if (r.computed_at) when.append(h("span", null, "آخر تحديث:"), " ", h("bdi", { dir: "ltr" }, baghdad(r.computed_at)));
      render(body, r, D);
    }
    style();
    go(cur);
  }

  function style() {
    if (document.getElementById("os-css")) return;
    const st = document.createElement("style"); st.id = "os-css";
    st.textContent = `
#ostats{display:grid;gap:12px;max-width:880px;margin:0 auto}#ostats h2{margin:4px 0 0}
#ostats .os-sw{display:flex;gap:6px;border:1px solid var(--line);border-radius:12px;padding:4px;background:var(--card)}
#ostats .os-sw button{flex:1;min-height:44px;border:0;border-radius:9px;background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
#ostats .os-sw button[aria-pressed=true]{background:var(--brand);color:var(--brand-ink)}
#ostats button:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
#ostats .os-when{margin:0;color:var(--muted);font-size:14px;min-height:1.2em}
#ostats .os-body{display:grid;gap:12px}
#ostats .os-c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
#ostats .os-c h3{margin:0 0 10px;font-size:17px}#ostats .os-c h4{margin:12px 0 6px;font-size:15px;color:var(--muted)}
#ostats .os-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
#ostats .os-k{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;display:grid;gap:2px}
#ostats .os-k b{font-size:22px;color:var(--brand)}#ostats .os-k span{font-size:14px;color:var(--ink)}#ostats .os-k small{color:var(--muted);font-size:13px}
#ostats .os-two{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}#ostats .os-two .os-kp{grid-template-columns:repeat(3,minmax(0,1fr))}#ostats .os-two .os-c{margin:0}
#ostats .os-q{margin:8px 0 0;color:var(--muted);font-size:14px}
#ostats .os-l{margin:0;padding:0;list-style:none;display:grid;gap:4px;counter-reset:o}
#ostats .os-l li{display:flex;align-items:center;gap:10px;min-height:40px;border-bottom:1px solid var(--line);padding:4px 0;flex-wrap:wrap}
#ostats .os-l li:last-child{border-bottom:0}#ostats .os-l li>span{flex:1 1 180px;min-width:0;overflow-wrap:anywhere}#ostats .os-l li>b{color:var(--brand);margin-inline-start:auto}
#ostats .os-hard li small{color:var(--muted);flex:1 1 100%;order:3}
#ostats .os-bar-w{height:10px;border-radius:99px;background:var(--line);overflow:hidden;margin-top:8px}
#ostats .os-bar-w i{display:block;height:100%;background:var(--brand);border-radius:99px}#ostats .os-bar-w i.hot{background:var(--bad)}
#ostats .os-fig{margin:0}#ostats .os-svg{width:100%;height:auto;display:block}
#ostats .os-bar{fill:var(--brand)}#ostats .os-sm{fill:var(--brand);opacity:.4}#ostats .os-ax{stroke:var(--line);stroke-width:1}
#ostats .os-tx{fill:var(--muted);font-size:12px}
#ostats .os-off{background:var(--card);border:1px dashed var(--line);border-radius:14px;padding:24px 14px;text-align:center;color:var(--muted)}
#ostats .os-off b{display:block;font-size:28px}#ostats .os-off p{margin:6px 0 0;font-size:16px}`;
    document.head.appendChild(st);
  }

  window.AdminStats = { mount, _lecName: lecName, _num: num };
})();
