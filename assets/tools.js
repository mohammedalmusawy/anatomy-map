// ✨ أدوات الطالب (27/10) — على جهاز الطالب بس (localStorage)، بدون تسجيل دخول وبدون أي اسم أو رقم.
// 📕 أخطائي · 📈 التقدّم لكل مادة · ❓ سؤال اليوم · 📤 بطاقة النتيجة · ⭐ المفضلة · ↩️ كمّل من وين وقفت
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("t:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("t:" + k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const root = (document.querySelector('link[rel="manifest"]') || {}).href ? new URL(".", document.querySelector('link[rel="manifest"]').href).href : "/";
  const here = location.href.split("#")[0];
  const rel = here.startsWith(root) ? here.slice(root.length) : location.pathname;
  const key = (q) => (q.q_en || "").slice(0, 120);

  // ── 1) من الاختبار: نسجّل الأخطاء والتقدّم ──
  document.addEventListener("quiz:answer", (ev) => {
    const { q, ok } = ev.detail;
    const m = LS.get("mistakes", {});
    const k = key(q);
    if (!ok) m[k] = { q, page: rel, title: document.title, streak: 0, t: Date.now() };
    else if (m[k]) { m[k].streak = (m[k].streak || 0) + 1; if (m[k].streak >= 2) delete m[k]; } // صح مرتين ورا بعض ← ينشال
    LS.set("mistakes", m);
  });
  document.addEventListener("quiz:finish", (ev) => {
    const { ok, n } = ev.detail;
    if (!/^quiz\/[^/]+\/[^/]+\/\d+\/$/.test(rel)) return;
    const p = LS.get("progress", {});
    const best = Math.max(p[rel] ? p[rel].best : 0, Math.round((ok / n) * 100));
    p[rel] = { best, last: Math.round((ok / n) * 100), t: Date.now() };
    LS.set("progress", p);
    const share = document.getElementById("share-card");
    if (share) share.classList.remove("hidden");
  });

  // ── 2) ↩️ آخر صفحة محاضرة/حالة زارها ──
  if (/^(learn|quiz)\/[^/]+\/[^/]+\/\d+\/$/.test(rel) || /^devices\/[^/]+\/cases\/[^/]+\/$/.test(rel)) {
    LS.set("last", { url: rel, title: document.title, t: Date.now() });
  }

  // ── 3) 📤 بطاقة النتيجة (صورة يشاركها الطالب ويّا رابط الموقع) ──
  const shareBtn = document.getElementById("share-card");
  if (shareBtn) shareBtn.addEventListener("click", async () => {
    const score = (document.getElementById("score") || {}).textContent || "";
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 1080, 1080); grad.addColorStop(0, "#3B4A8C"); grad.addColorStop(1, "#1E2433");
    g.fillStyle = grad; g.fillRect(0, 0, 1080, 1080);
    g.fillStyle = "#fff"; g.textAlign = "center"; g.direction = "rtl";
    g.font = "700 64px 'IBM Plex Sans Arabic', sans-serif"; g.fillText("اختبرت نفسي ✅", 540, 260);
    g.font = "700 200px 'IBM Plex Sans Arabic', sans-serif"; g.fillText(score.replace(/\s+/g, " "), 540, 560);
    g.font = "600 44px 'IBM Plex Sans Arabic', sans-serif"; g.fillText(document.title.replace("اختبار ", ""), 540, 700);
    g.font = "500 38px 'IBM Plex Sans Arabic', sans-serif"; g.fillText("دروس تقنيات الأشعة · مجاني", 540, 860);
    g.direction = "ltr"; g.fillText(root.replace(/^https?:\/\//, "").replace(/\/$/, ""), 540, 920);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    const file = new File([blob], "نتيجتي.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: "اختبر نفسك: " + root }); return; } catch (e) { return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "نتيجتي.png"; a.click();
  });

  // ── 4) ⭐ المفضلة (زر بصفحات المحاضرات والحالات) ──
  const fav = document.getElementById("fav");
  if (fav) {
    const favs = LS.get("favs", {});
    const paint = () => { fav.textContent = favs[rel] ? "⭐ بالمفضلة" : "☆ أضف للمفضلة"; fav.classList.toggle("on", !!favs[rel]); };
    paint();
    fav.addEventListener("click", () => {
      if (favs[rel]) delete favs[rel]; else favs[rel] = { title: document.title, t: Date.now() };
      LS.set("favs", favs); paint();
    });
  }

  // ── 5) لوحة «أدواتي» بصفحة «اختبر نفسك» (التقدّم، أخطائي، سؤال اليوم، المفضلة، كمّل) ──
  const panel = document.getElementById("my-tools");
  if (panel) {
    // 📈 التقدّم لكل مادة: نسبة المحاضرات اللي اختبرها
    const p = LS.get("progress", {});
    document.querySelectorAll("[data-subj]").forEach((a) => {
      const s = a.dataset.subj, total = +a.dataset.n || 0;
      const done = Object.keys(p).filter((u) => u.startsWith("quiz/" + s + "/")).length;
      if (!total || !done) return;
      const pct = Math.min(100, Math.round((done / total) * 100));
      const tag = a.querySelector(".tag");
      if (tag) tag.insertAdjacentHTML("beforebegin", `<span class="prog" title="التقدّم"><span class="pb"><i style="width:${pct}%"></i></span><b>${pct}%</b></span>`);
    });
    const parts = [];
    const last = LS.get("last", null);
    if (last) parts.push(`<a class="tool" href="${root}${esc(last.url)}">↩️ <b>كمّل من وين وقفت</b><small>${esc(last.title)}</small></a>`);
    const m = Object.values(LS.get("mistakes", {}));
    if (m.length) parts.push(`<a class="tool" href="${root}quiz/mistakes/">📕 <b>أخطائي</b><small>${m.length} سؤال غلطت بيه — أعده لحد ما تصححه</small></a>`);
    const favs = Object.entries(LS.get("favs", {}));
    if (favs.length) parts.push(`<details class="tool"><summary>⭐ <b>المفضلة</b><small>${favs.length}</small></summary>` +
      favs.map(([u, f]) => `<a href="${root}${esc(u)}">${esc(f.title)}</a>`).join("") + `</details>`);
    panel.innerHTML = parts.join("");
    // ❓ سؤال اليوم: نفس السؤال لكل الطلاب باليوم (من بنك الموقع)
    const qd = document.getElementById("qotd");
    if (qd) fetch(root + "quiz/bank.json").then((r) => r.json()).then((bank) => {
      const d = new Date(); const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 400;
      const it = bank[day % bank.length];
      const q = it.q;
      qd.innerHTML = `<div class="qh">❓ <b>سؤال اليوم</b><small>${esc(it.t)}</small></div>
        <p class="qen">${esc(q.q_en)}</p><p class="qar">${esc(q.q_ar)}</p>
        <div class="qo">${q.options.map((o, i) => `<button data-i="${i}"><span>${esc(o.en)}</span><small>${esc(o.ar)}</small></button>`).join("")}</div>
        <p class="qw hidden"></p>`;
      qd.classList.remove("hidden");
      qd.querySelectorAll(".qo button").forEach((b) => b.addEventListener("click", () => {
        qd.querySelectorAll(".qo button").forEach((x) => { x.disabled = true; if (+x.dataset.i === q.answer) x.classList.add("right"); });
        if (+b.dataset.i !== q.answer) b.classList.add("wrong");
        const w = qd.querySelector(".qw"); w.textContent = "💡 " + q.why; w.classList.remove("hidden");
        document.dispatchEvent(new CustomEvent("quiz:answer", { detail: { q, ok: +b.dataset.i === q.answer } }));
      }));
    }).catch(() => {});
  }

  // ── 6) صفحة 📕 أخطائي: تبني الاختبار من الأخطاء المحفوظة (tools.js ينحمّل قبل quiz.js) ──
  const qdata = document.getElementById("quiz-data");
  if (qdata && qdata.dataset.mistakes) {
    const qs = Object.values(LS.get("mistakes", {})).map((m) => m.q);
    qdata.textContent = JSON.stringify({ questions: qs });
    if (!qs.length) {
      const e = document.getElementById("empty"); if (e) e.classList.remove("hidden");
      const pl = document.getElementById("play"); if (pl) pl.remove();
      qdata.textContent = JSON.stringify({ questions: [] });
    }
  }
})();
