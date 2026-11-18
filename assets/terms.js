// المصطلحات: قسمين (طلابنا/عامة) + الأعراض، بحث إنكليزي وعربي، فلتر حسب المادة.
// الصوت (29/10): المشغّل الموحّد listen.js — المصطلح نفسه منقّط: ضغطة ← لفظه + بطاقة المعنى و🐢 (ما بقت أزرار 🔊 ولا صوت المتصفح).
// ⚡ (17/11 السرعة) البيانات بـ data.json?v= (مو داخل الصفحة): «الرأس» داخل الصفحة (#terms-head: أول 40 + العدد + الفلاتر) يترسم فوراً،
//    والباقي يجي من الملف. والقائمة نفسها: أول 40 بطاقة فوراً والباقي بعد شوية (requestIdleCallback) حتى أول رسم ما يتأخر.
//    tools.js («🔁 راجع اليوم») ياخذ البيانات من حدث terms:data / window.TERMS_DATA.
(function () {
  const $ = (s) => document.querySelector(s);
  const el = $("#terms-data");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  const FIRST = 40, MAX = 400;
  let set = ["#general", "#symptoms"].includes(location.hash) ? location.hash.slice(1) : "ours", subj = "", q = "";
  let D = null, HEAD = null;
  const idx = {};
  let hit = "";
  try { hit = new URLSearchParams(location.search).get("t") || ""; } catch (e) {}
  if (el && !el.dataset.src) D = JSON.parse(el.textContent);   // الصيغة القديمة (البيانات داخل الصفحة)
  else { try { HEAD = JSON.parse(($("#terms-head") || {}).textContent || "null"); } catch (e) { HEAD = null; } }

  function index() {
    for (const k in D) idx[k] = D[k].map((t) => ({ t, s: norm([t.en, t.ar, ...(t.k || [])].join(" ")) }));
    // 🔎 (30/10) ?t=<المصطلح> من نتائج البحث ← نفتح قسمه، نكتبه بالبحث، ونعلّمه أول النتائج
    if (hit) {
      const want = hit.toLowerCase().trim();
      const is = (t) => String(t.en).toLowerCase() === want || (t.al || []).some((a) => String(a).toLowerCase() === want);   // (30/10) الصيغة القديمة ← المدخل الأساسي
      const at = [set, ...Object.keys(D).filter((k) => k !== set)].find((k) => D[k].some(is));
      if (at) { const m = D[at].find(is); set = at; hit = m.en; q = hit; const tq = $("#tq"); if (tq) tq.value = hit; } else hit = "";
      if (set !== "ours") document.querySelectorAll("#tt a").forEach((x) => x.classList.toggle("on", x.dataset.set === set));
    }
  }
  // قبل ما توصل البيانات: الرأس يكفي بس لـ «مصطلحات طلابنا» بلا بحث ولا فلتر
  const headOK = () => !D && HEAD && set === "ours" && !subj && !q && !hit;

  function chips() {
    const subs = D ? [...new Set(D[set].map((t) => t.s).filter(Boolean))] : headOK() ? HEAD.subs[set] || [] : null;
    if (!subs) return;
    $("#tf").innerHTML = ['<button class="chip' + (subj ? "" : " on") + '" data-s="">الكل</button>']
      .concat(subs.map((s) => `<button class="chip${s === subj ? " on" : ""}" data-s="${esc(s)}">${esc(s)}</button>`)).join("");
  }
  const pron = (en) => { const i = window.Listen && Listen.find(en); return i ? `<span class="pron"><span class="pa">${i[2]}</span> <bdi class="pi">${esc(i[3])}</bdi></span>` : ""; };
  const card = (t, H) => `<article class="term${H && String(t.en).toLowerCase() === H ? " hit" : ""}">
      <div class="th"><bdi class="te">${esc(t.en)}</bdi></div>
      ${pron(t.en)}
      <b class="ta">${esc(t.ar)}</b>${t.d ? `<p>${esc(t.d)}</p>` : ""}
      ${t.s ? `<span class="ts">${esc(t.s)}${t.sa ? " · " + esc(t.sa) : ""}</span>` : ""}
      ${t.c ? `<a class="seecase" href="${esc(t.c)}">🩻 شوف الحالة</a>` : ""}</article>`;
  let tok = 0;
  const later = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 300 }) : setTimeout(f, 30));
  function render() {
    const my = ++tok;
    let list, n;
    if (D) {
      const words = norm(q).split(" ").filter(Boolean);
      list = idx[set].filter(({ t, s }) => (!subj || t.s === subj) && words.every((w) => s.includes(w))).map((x) => x.t);
      n = list.length;
    } else if (headOK()) { list = HEAD.ours; n = HEAD.n.ours; } else return;
    const H = hit && q === hit ? hit.toLowerCase() : "";
    if (H) list = list.slice().sort((a, b) => (String(b.en).toLowerCase() === H) - (String(a.en).toLowerCase() === H));
    $("#tn").textContent = `${n} مصطلح`;
    const tl = $("#tl"), all = list.slice(0, MAX);
    tl.removeAttribute("data-pending");   // ⚡ المكان المحجوز (CSS) لحد أول رسم للقائمة ← «الذيل» ما يقفز
    tl.innerHTML = all.slice(0, FIRST).map((t) => card(t, H)).join("");
    let i = FIRST;
    const more = () => {   // الباقي دفعات (100) بالخلفية؛ بحث أو فلتر جديد يوگف الدفعات القديمة
      if (my !== tok || i >= all.length) return;
      tl.insertAdjacentHTML("beforeend", all.slice(i, i + 100).map((t) => card(t, H)).join(""));
      i += 100; later(more);
    };
    if (all.length > FIRST) later(more);
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
  // ⭐ (17/11) «مصطلحاتي»: اللي حفظه الطالب بالتحديد الذكي (pick.js) — بجهازه بس (t:srs، نفس مخزن «راجع اليوم»)
  function mineBox() {
    let st = {}; try { st = JSON.parse(localStorage.getItem("t:srs") || "{}") || {}; } catch (e) {}
    const ks = Object.keys(st).filter((k) => st[k] && st[k].mine).sort((a, b) => st[b].mine - st[a].mine);
    let box = document.getElementById("mine");
    if (!ks.length) { if (box) box.hidden = true; return; }
    if (!box) {
      box = document.createElement("details"); box.id = "mine"; box.className = "minebox";
      const at = $("#review-box"); (at || $("#tt")).insertAdjacentElement(at ? "afterend" : "beforebegin", box);
      box.addEventListener("click", (ev) => {
        const b = ev.target.closest("button[data-m]"); if (!b) return;
        ev.preventDefault();
        if (b.dataset.m === "copy" || b.dataset.m === "dl") { mineOut(b.dataset.m, b); return; }
        const k = b.closest("li").dataset.k;
        if (b.dataset.m === "say") { if (window.Pick && Pick.say) Pick.say(k, 1, b); return; }
        let s2 = {}; try { s2 = JSON.parse(localStorage.getItem("t:srs") || "{}") || {}; } catch (e) {}
        const v = s2[k]; if (v && v.r) delete v.mine; else delete s2[k];
        try { localStorage.setItem("t:srs", JSON.stringify(s2)); } catch (e) {}
        document.dispatchEvent(new CustomEvent("pick:saved", { detail: { key: k, saved: false } }));
      });
    }
    const open = box.open || location.hash === "#mine";
    box.hidden = false;
    const ar = (k) => { const x = window.Listen && Listen.match && Listen.match(k), i = x && Listen.info(x); return i ? i[1] : ""; };
    const EN = document.documentElement.lang === "en";
    box.innerHTML = `<summary data-noen>⭐ <b>${EN ? "My terms" : "مصطلحاتي"}</b> <small>${ks.length}</small></summary><p class="hint" data-noen>${EN ? "Select any word on any page ← ⭐ Save. They join “Review today” and stay on your device only." : "اللي حفظته بالتحديد: حدّد أي كلمة بأي صفحة ← ⭐ احفظ. تدخل «راجع اليوم» وتبقى بجهازك بس."}</p>` +
      `<div class="mx" data-noen><button type="button" data-m="copy">📋 ${EN ? "Copy all" : "انسخ الكل"}</button><button type="button" data-m="dl">⬇️ ${EN ? "Download (.txt)" : "نزّلها (txt)"}</button></div><ul>` +
      ks.map((k) => `<li data-k="${esc(k)}"><bdi dir="ltr" class="mk">${esc(k)}</bdi>${ar(k) ? `<span class="ta">${esc(ar(k))}</span>` : ""}<span class="mb"><button type="button" data-m="say" aria-label="${EN ? "Listen: " : "اسمع "}${esc(k)}">🔊</button><button type="button" data-m="del" aria-label="${EN ? "Remove from my terms: " : "شيل من مصطلحاتي: "}${esc(k)}">✕</button></span></li>`).join("") + "</ul>";
    box.open = open;
  }
  // 📋⬇️ (18/11) نسخ «مصطلحاتي» كلها أو تنزيلها ملف نص — كله بالجهاز، ولا شي يطلع للنت
  function mineOut(how, btn) {
    const P = window.Pick; if (!P || !P.listText) return;
    let st = {}; try { st = JSON.parse(localStorage.getItem("t:srs") || "{}") || {}; } catch (e) {}
    const ks = Object.keys(st).filter((k) => st[k] && st[k].mine).sort((a, b) => st[b].mine - st[a].mine);
    const EN = document.documentElement.lang === "en";
    const mean = (k) => { const x = window.Listen && Listen.match && Listen.match(k), i = x && Listen.info(x); return i ? i[1] : ""; };
    const out = P.listText(ks, mean, EN);
    const flash = (ok) => { if (!btn || !ok) return; const old = btn.textContent; btn.textContent = how === "dl" ? (EN ? "✅ Downloaded" : "✅ تنزّلت") : (EN ? "✅ Copied" : "✅ انسخت"); setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800); };   // الزر نفسه يأكّد (أوضح من التوست وحده)
    const say = (ok) => flash(ok) || P.toast && P.toast(ok ? (how === "dl" ? (EN ? "⬇️ Downloaded: " : "⬇️ تنزّلت: ") + out.name : (EN ? "📋 Copied " : "📋 انسخت ") + ks.length + (EN ? " terms" : " مصطلح")) : (EN ? "Couldn't do it here. Try another browser." : "ما گدرت هنا. جرّب متصفح ثاني."));
    if (how === "dl") {
      try {
        const url = URL.createObjectURL(new Blob(["﻿" + out.text], { type: "text/plain;charset=utf-8" }));
        const a = document.createElement("a"); a.href = url; a.download = out.name; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000); say(true);
      } catch (e) { say(false); }
      return;
    }
    const legacy = () => { try { const ta = document.createElement("textarea"); ta.value = out.text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if (btn) btn.focus(); return ok; } catch (e) { return false; } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.text).then(() => say(true), () => say(legacy()));
    else say(legacy());
  }
  document.addEventListener("pick:saved", mineBox);
  document.addEventListener("listen:ready", mineBox);
  addEventListener("storage", (e) => { if (e.key === "t:srs") mineBox(); });
  new MutationObserver(() => mineBox()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });   // ع ⇄ ENG
  mineBox();
  if (location.hash === "#mine") { const b = document.getElementById("mine"); if (b) requestAnimationFrame(() => b.scrollIntoView({ block: "start" })); }
  const focusHit = () => { if (hit) { const a = $("#tl .term.hit"); if (a) { a.setAttribute("tabindex", "-1"); requestAnimationFrame(() => { a.scrollIntoView({ block: "center" }); a.focus({ preventScroll: true }); }); } } };
  const ready = () => {
    index(); chips(); render(); focusHit();
    window.TERMS_DATA = D;
    try { document.dispatchEvent(new CustomEvent("terms:data", { detail: D })); } catch (e) {}
  };
  if (D) { ready(); return; }
  chips(); render();   // الرأس (إذا ينفع) هسه
  fetch(new URL(el.dataset.src, location.href).href).then((r) => { if (!r.ok) throw r.status; return r.json(); })
    .then((d) => { D = d; const tq = $("#tq"); if (tq && tq.value && !q) q = tq.value; ready(); })   // المتصفح رجّع نص البحث (رجوع للصفحة)
    .catch(() => { $("#tl").removeAttribute("data-pending"); $("#tn").textContent = "ما گدرت أحمّل كل المصطلحات. تأكد من النت وحدّث الصفحة."; });
})();
