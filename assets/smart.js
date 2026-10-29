// 🧠 الأقسام الذكية (27/10): 🔎 البحث الذكي · 🤖 مساعد الطالب · 🎯 رشّحلي/📝 لخّصلي · 📅 الامتحانات.
// البحث و«رشّحلي» و«لخّصلي» يشتغلون بدون ذكاء اصطناعي (من بيانات الموقع). المحادثة تحتاج مفتاح Supabase.
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  const C = window.STUDY_CLOUD || {}, ON = !!(C.url && C.anon);
  const H = { apikey: C.anon, Authorization: "Bearer " + C.anon, "Content-Type": "application/json" };
  // توكن جلسة الطالب: من account.js إذا محمّل، وإلا من جلسة Supabase المحفوظة (t:acct-session) إذا بعدها صالحة
  const studentToken = () => {
    try { if (window.Account && Account.token) return Account.token(); } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem("t:acct-session") || "null");
      const t = s && (s.access_token || (s.currentSession && s.currentSession.access_token));
      return t && (s.expires_at || 0) * 1000 > Date.now() + 30e3 ? t : null;
    } catch (e) { return null; }
  };
  const N = window.Net;   // 📡 net.js: كاش بمدة (إذا الصفحة ما حمّلته: طلب مباشر مثل قبل)
  const rest = (t, q, ttl) => !ON ? Promise.resolve([]) : N ? N.get(t, q, ttl) : fetch(`${C.url}/rest/v1/${t}?${q}`, { headers: H }).then((r) => r.json()).catch(() => []);
  const norm = (s) => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem("t:" + k)) ?? d; } catch (e) { return d; } };
  const params = new URLSearchParams(location.search);
  const DISC = '<p class="rev-only">⚠️ <b>للمراجعة فقط — مو توقّع لأسئلة الامتحان</b></p>';
  let DATA = null, STATS = null;
  const data = () => DATA ? Promise.resolve(DATA) : fetch(root + "study/data.json").then((r) => r.json()).then((d) => (DATA = d));
  const stats = () => STATS ? Promise.resolve(STATS) : rest("question_stats", "select=qkey,rate,estimated,hint_en,hint_ar,attempts", 6 * 3600e3).then((r) => (STATS = Object.fromEntries((r || []).map((x) => [x.qkey, x]))));
  const qk = (q) => (q.q_en || "").slice(0, 120);
  const settings = () => window.STUDY_SETTINGS ? Promise.resolve(window.STUDY_SETTINGS)
    : (N && ON ? N.settings() : rest("settings", "select=key,value").then((r) => Object.fromEntries((r || []).map((x) => [x.key, x.value])))).then((S) => (S && S.sections) || S || {});   // cloud.js يحط STUDY_SETTINGS = الأقسام نفسها؛ الطلب المباشر يرجّع كل الإعدادات

  // ───────── 🔎 البحث الذكي ─────────
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  if ($("#sq")) {
    let IDX = null, timer = 0;
    fetch(root + "assistant/index.json").then((r) => r.json()).then((d) => {
      IDX = d.map((c) => { const h = norm(c.t + " " + (c.k || "") + " " + c.x); return { c, h, toks: new Set(h.split(" ")) }; });
      if (params.get("q")) { $("#sq").value = params.get("q"); run(); }
    });
    const run = () => {
      const words = norm($("#sq").value).split(" ").filter((w) => w.length > 1);
      if (!IDX || !words.length) { $("#sr").innerHTML = ""; $("#sn").textContent = ""; return; }
      const res = [];
      for (const it of IDX) {
        let s = 0, all = true;
        for (const w of words) {
          if (it.h.includes(w)) { s += 3; continue; }
          let f = false;
          if (w.length > 3) for (const t of it.toks) { if (lev(w, t) <= (w.length > 6 ? 2 : 1)) { f = true; break; } }
          if (f) s += 1; else all = false;
        }
        if (s && all) res.push([s + (norm(it.c.t).includes(words.join(" ")) ? 3 : 0), it.c]);
      }
      res.sort((a, b) => b[0] - a[0]);
      $("#sn").textContent = res.length ? `${res.length} نتيجة` : "ما لگيت شي بهالكلمات. جرّب كلمة ثانية أو بالإنكليزي.";
      $("#sr").innerHTML = res.slice(0, 40).map(([, c]) => `<a class="item sres" href="${root}${esc(c.u)}"><span><b>${esc(c.t)}</b><small>${esc(c.x.slice(0, 140))}…</small></span><span class="go">‹</span></a>`).join("");
      clearTimeout(timer);
      if (!res.length && window.Cloud) timer = setTimeout(() => Cloud.log("search_empty", $("#sq").value), 1500);
    };
    $("#sq").addEventListener("input", run);
  }

  // ───────── 🎯 رشّحلي / 📝 لخّصلي (بدون ذكاء اصطناعي) ─────────
  const COUNT = { "30": 15, "60": 30, "120": 60, "all": 1e9 };
  function chips(name, items, multi) {
    return `<div class="chips" data-name="${name}">${items.map(([v, l]) => `<button type="button" data-v="${esc(v)}"${multi ? ' data-multi="1"' : ""}>${esc(l)}</button>`).join("")}</div>`;
  }
  async function recommender(mode, subj) {
    const box = $("#rec"); box.classList.remove("hidden");
    const d = await data();
    const state = { subj: subj && d[subj] ? subj : "", lecs: new Set(), time: "" };
    // 📅 (29/10) ?lecs=theory/1,theory/2 من بطاقة «الامتحان القادم» ← المحاضرات المشمولة مختارة جاهزة.
    if (state.subj && params.get("lecs")) { const want = params.get("lecs").split(","); d[state.subj].lectures.forEach((L, i) => { if (want.includes(`${L.type}/${L.num}`)) state.lecs.add(String(i)); }); }
    const draw = () => {
      let h = DISC + `<p><b>${mode === "summary" ? "📝 لخّصلي" : "🎯 رشّحلي"}</b></p><p class="q1">أي مادة؟</p>` +
        chips("subj", Object.entries(d).map(([k, v]) => [k, v.name]));
      if (state.subj) {
        h += `<p class="q1">أي محاضرات؟</p>` + chips("lecs", [["*", "كل المحاضرات"]].concat(d[state.subj].lectures.map((L, i) => [String(i), `${L.type_ar} م${String(L.num).padStart(2, "0")}`])), true);
        if (mode !== "summary") h += `<p class="q1">كم وقت عندك؟</p>` + chips("time", [["30", "نص ساعة"], ["60", "ساعة"], ["120", "ساعتين"], ["all", "أكثر"]]);
        h += `<button class="btn" id="go">${mode === "summary" ? "اعرض الملخص" : "رشّحلي"}</button>`;
      }
      box.innerHTML = h + '<div id="recout"></div>';
      box.querySelectorAll(".chips button").forEach((b) => {
        const n = b.parentElement.dataset.name, v = b.dataset.v;
        const on = n === "subj" ? state.subj === v : n === "time" ? state.time === v : (v === "*" ? state.lecs.size === 0 : state.lecs.has(v));
        b.classList.toggle("on", on);
        b.onclick = () => {
          if (n === "subj") { state.subj = v; state.lecs.clear(); }
          else if (n === "time") state.time = v;
          else if (v === "*") state.lecs.clear(); else state.lecs.has(v) ? state.lecs.delete(v) : state.lecs.add(v);
          draw();
        };
      });
      const go = $("#go"); if (go) go.onclick = () => build(mode, d, state);
    };
    draw();
  }
  async function build(mode, d, state) {
    const S = d[state.subj], st = await stats(), mine = LS("mistakes", {}), ai = (await settings()).assistant && ON;
    const lecs = S.lectures.filter((L, i) => !state.lecs.size || state.lecs.has(String(i)));
    let h = DISC + "<h2>📝 الملخص</h2>";
    for (const L of lecs) {
      h += `<details class="rsum" ${lecs.length < 3 ? "open" : ""}><summary>${esc(L.type_ar)} م${L.num} — ${esc(L.title_ar)}</summary>` +
        (L.summary.length ? `<ul>${L.summary.map((x) => `<li><span class="en">${esc(x.en)}</span>${esc(x.ar)}</li>`).join("")}</ul>` : `<p class="hint">الملخص بملف المحاضرة.</p>`) +
        `<a class="btn alt" href="${root}${esc(L.learn)}">📖 افتح المحاضرة</a>${L.pdf ? ` <a class="btn alt" href="${root}${esc(L.pdf)}">📥 الملف</a>` : ""}</details>`;
    }
    if (mode !== "summary") {
      const n = COUNT[state.time || "60"], total = lecs.reduce((a, L) => a + L.questions.length, 0);
      const picked = [], hard = [];
      for (const L of lecs) {
        const sumTxt = norm(L.summary.map((x) => x.en).join(" "));
        const quota = Math.max(1, Math.round((L.questions.length / total) * Math.min(n, total)));
        const scored = L.questions.map((q) => {
          const s = st[qk(q)], a = q.options[q.answer].en;
          let sc = 0;
          if (sumTxt && a.length > 3 && sumTxt.includes(norm(a))) sc += 2;      // أ) الأهمية: بالخلاصة
          if (/\d/.test(q.q_en + a)) sc += 1;                                     // أرقام وجداول
          if (s) sc += s.rate * 3;                                                // ج) الأكثر غلط
          if (mine[qk(q)]) sc += 3;                                               // د) أخطائي
          if (s && s.rate >= 0.5) hard.push({ q, L, s });
          return { q, L, sc, easy: !s || s.rate < 0.5 };
        }).sort((x, y) => (y.easy - x.easy) || (y.sc - x.sc));                    // هـ) سهل لمتوسط أول
        picked.push(...scored.slice(0, quota));
      }
      const byL = new Map();
      picked.slice(0, n).forEach((p) => { if (!byL.has(p.L)) byL.set(p.L, []); byL.get(p.L).push(p.q); });
      h += `<h2>❓ الأسئلة (${Math.min(picked.length, n)})</h2>`;
      for (const [L, qs] of byL) {
        h += `<h3>${esc(L.type_ar)} م${L.num} — ${esc(L.title_ar)}</h3>` + qs.map((q) => qcard(q, L, ai)).join("");
      }
      hard.sort((a, b) => b.s.rate - a.s.rate);
      if (hard.length) h += `<h2>🔥 الأكثر غلط عند الطلاب</h2>${DISC}` + hard.slice(0, 8).map(({ q, L, s }) => qcard(q, L, ai, s)).join("");
    }
    $("#recout").innerHTML = h;
    $("#recout").scrollIntoView({ behavior: "smooth" });
  }
  function qcard(q, L, ai, s) {
    const a = q.options[q.answer];
    return `<details class="rq"><summary><span class="en">${esc(q.q_en)}</span>${esc(q.q_ar)}${s ? ` <i class="rate">${Math.round(s.rate * 100)}% غلط${s.estimated ? " · تقديري" : ""}</i>` : ""}</summary>
      <p>✅ <span class="en">${esc(a.en)}</span> ${esc(a.ar)}</p><p>💡 ${esc(q.why)}</p>
      ${s && s.hint_ar ? `<p class="hintl">🧠 <span class="en">${esc(s.hint_en || "")}</span>${esc(s.hint_ar)}</p>` : ""}
      <a class="btn alt" href="${root}${esc(L.learn)}">📖 اقرأ هذا الجزء</a>
      ${ai ? ` <a class="btn alt" href="${root}assistant/?q=${encodeURIComponent("ليش غلطت؟ " + q.q_en)}">❌ ليش غلطت؟</a>` : ""}</details>`;
  }

  // ───────── 🤖 المحادثة ─────────
  if ($("#chat")) {
    const chat = $("#chat");
    const say = (who, html) => { chat.insertAdjacentHTML("beforeend", `<div class="msg ${who}">${html}</div>`); chat.lastElementChild.scrollIntoView({ block: "end", behavior: "smooth" }); };
    async function ask(q) {
      say("me", esc(q));
      const s = await settings();
      if (!ON || !s.assistant) { say("bot", "🤖 المحادثة بالذكاء الاصطناعي تشتغل قريباً. هسه تگدر تستعمل <b>🎯 رشّحلي</b> و<b>📝 لخّصلي</b> فوق، و<a href='" + root + "search/'>🔎 البحث</a>."); return; }
      say("bot", "<i class='typing'>…</i>");
      const body = JSON.stringify({ device: window.Cloud && Cloud.dev, q, ctx: params.get("subject") ? { subject: params.get("subject") } : null });
      const post = (tok) => fetch(`${C.url}/functions/v1/study-assistant`, { method: "POST", headers: { ...H, Authorization: "Bearer " + (tok || C.anon) }, body });
      // 🎓 29/10: الطالب المسجّل يرسل توكن جلسته حتى ينحسب طالب (مو زائر). توكن منتهي/مرفوض ← نعيد كزائر مرة وحدة.
      const tok = studentToken();
      const r = await post(tok).then((x) => (tok && x.status === 401 ? post(null) : x)).then((x) => x.json()).catch(() => ({ error: 1 }));
      chat.lastElementChild.remove();
      if (r.disabled) return say("bot", "🤖 المساعد مطفي حالياً.");
      if (r.limit) return say("bot", "وصلت حد اليوم (" + (r.max || 15) + " سؤال). ارجع باچر 🌙 — وهسه تگدر تستعمل 🎯 رشّحلي.");
      if (r.budget || r.error) return say("bot", "المساعد مو متوفر هسه. البحث و«رشّحلي» يشتغلون عادي.");
      if (r.intent === "exams") { say("bot", `📅 <a href="${root}exams/">افتح قسم الامتحانات</a>`); return; }
      if (r.intent === "recommend") { recommender("recommend", params.get("subject")); return; }
      if (r.intent === "summary") recommender("summary", params.get("subject"));
      let h = `<p class="ai">🤖 رد ذكاء اصطناعي</p><p><b>${esc(r.short)}</b></p>` + (r.explain ? `<p>${esc(r.explain)}</p>` : "") +
        (r.key_en || r.key_ar ? `<p class="key">⭐ <span class="en">${esc(r.key_en)}</span>${esc(r.key_ar)}</p>` : "") +
        (r.sources || []).map((x) => `<a class="btn alt" href="${root}${esc(String(x.u).replace(root, ""))}">افتح: ${esc(x.t)}</a>`).join(" ");
      if (r.ask) h += `<p>${esc(r.ask.q)}</p>` + (r.ask.options || []).map((o) => `<button class="nx" data-q="${esc(o)}">${esc(o)}</button>`).join("");
      h += (r.next || []).slice(0, 2).map((n) => `<button class="nx" data-q="${esc(n.q)}">${esc(n.label)}</button>`).join("");
      const ss = await settings(); if (ss.exams) h += `<p class="hint">📅 وقت امتحانات: <a href="${root}exams/">شوف قسم الامتحانات</a></p>`;
      say("bot", h);
    }
    chat.addEventListener("click", (ev) => { const b = ev.target.closest(".nx"); if (b) ask(b.dataset.q); });
    $("#ask").addEventListener("submit", (ev) => { ev.preventDefault(); const v = $("#aq").value.trim(); if (v) { $("#aq").value = ""; ask(v); } });
    $("#quick").addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.mode) recommender(b.dataset.mode, params.get("subject")); else ask(b.dataset.q);
    });
    if (params.get("mode")) recommender(params.get("mode"), params.get("subject"));
    else if (params.get("q")) ask(params.get("q"));
  }

  // ───────── 📅 الامتحانات ─────────
  if ($("#exams")) (async () => {
    const s = await settings();
    if (!ON || !s.exams) return;
    const [ex, d, st] = await Promise.all([rest("exams", "select=*&confirmed=eq.true&archived=eq.false", 15 * 60e3), data(), stats()]);
    if (!ex.length) return;
    const day = (x) => new Date(x + "T00:00:00");
    ex.sort((a, b) => day(a.postponed_to || a.exam_date) - day(b.postponed_to || b.exam_date));
    const ai = s.assistant;
    $("#exams").innerHTML = ex.map((x) => {
      const S = d[x.subject]; if (!S) return "";
      const when = x.postponed_to || x.exam_date, left = Math.ceil((day(when) - new Date()) / 864e5);
      const sure = !!(x.lectures && x.lectures.length);   // (29/10) فارغ = «ما متأكدين بعد»: نعرض المحاضرات للمراجعة بس، مو كأنها المشمولة
      const inc = sure ? S.lectures.filter((L) => x.lectures.includes(`${L.type}/${L.num}`)) : S.lectures.filter((L) => !x.type || L.type === x.type);
      const qs = inc.flatMap((L) => L.questions.map((q) => ({ q, L, s: st[qk(q)] }))).filter((r) => r.s);
      qs.sort((a, b) => b.s.rate - a.s.rate);
      const top = qs[0];
      return `<section class="exam"><h2>${esc(S.name)}${x.type ? ` (${x.type === "theory" ? "نظري" : "عملي"})` : ""} <bdi class="en">${esc(S.en)}</bdi></h2>
        <p class="when">🗓️ ${esc(when)} · ${left > 0 ? `باقي <b>${left}</b> يوم` : left === 0 ? "<b>اليوم</b>" : "خلص"}</p>
        ${x.postponed_to ? `<p class="post">⏩ تأجلت المادة إلى يوم ${esc(x.postponed_to)}</p>` : ""}
        ${sure ? `<p class="inc">📚 المشمول: ${inc.map((L) => `${esc(L.type_ar)} م${L.num}`).join("، ")}</p>` : `<p class="inc">📚 المشمول: ما متأكدين بعد — نحدّثه أول ما يوصل خبر.<br><small>لحد ما يتأكد، المراجعة تحت من المحاضرات اللي نزلت لحد هسه.</small></p>`}
        ${top ? `<div class="topq">⭐ <b>السؤال الأكثر غلط</b>${DISC}${qcard(top.q, top.L, ai, top.s)}</div>` : ""}
        <a class="btn" href="${root}assistant/?mode=recommend&subject=${esc(x.subject)}${sure ? "&lecs=" + encodeURIComponent(x.lectures.join(",")) : ""}">🎯 رشّحلي لهالمادة</a>
        ${qs.length ? `<h3>🔥 أصعب الأسئلة — راجعوها</h3>${DISC}${qs.slice(0, 10).map((r) => qcard(r.q, r.L, ai, r.s)).join("")}` : ""}
        ${qs.some((r) => r.s.hint_ar) ? `<h3>🧠 المفاهيم اللي الطلاب يغلطون بيها</h3><ul>${qs.filter((r) => r.s.hint_ar).slice(0, 8).map((r) => `<li><span class="en">${esc(r.s.hint_en)}</span>${esc(r.s.hint_ar)} <a href="${root}${esc(r.L.learn)}">📖</a></li>`).join("")}</ul>` : ""}
        <h3>📝 ملخص النقاط المهمة</h3>${inc.map((L) => `<details class="rsum"><summary>${esc(L.type_ar)} م${L.num} — ${esc(L.title_ar)}</summary>${L.summary.length ? `<ul>${L.summary.map((y) => `<li><span class="en">${esc(y.en)}</span>${esc(y.ar)}</li>`).join("")}</ul>` : ""}<a class="btn alt" href="${root}${esc(L.learn)}">📖 افتح</a></details>`).join("")}
        <h3>❓ أسئلة وأجوبة</h3>${inc.map((L) => `<details class="rsum"><summary>${esc(L.type_ar)} م${L.num} (${L.questions.length})</summary>${L.questions.map((q) => qcard(q, L, ai, st[qk(q)])).join("")}</details>`).join("")}
      </section>`;
    }).join("");
  })();
})();
