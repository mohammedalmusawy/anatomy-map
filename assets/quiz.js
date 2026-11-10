// اختبار محاضرة وحدة: نفس أسئلة الملف، والترتيب (الأسئلة والخيارات) يتخلط كل مرة.
(() => {
  const data = JSON.parse(document.getElementById("quiz-data").textContent);
  const $ = (id) => document.getElementById(id);
  const LETTERS = ["A", "B", "C", "D"];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 🖼️ صورة بالسؤال (31/10): img.src من جذر الموقع؛ img.after = تطلع بعد الجواب بس (إذا الصورة تكشفه)
  const ROOT = ((document.currentScript && document.currentScript.src) || "").replace(/assets\/quiz(\.min)?\.js(\?.*)?$/, "");
  window.QuizRoot = ROOT;
  const qimg = (m) => {
    if (!m || !m.src) return "";
    const en = document.documentElement.lang === "en", src = esc(ROOT + m.src), alt = esc((en ? m.alt_en || m.alt_ar : m.alt_ar || m.alt_en) || "");
    const cr = en ? m.credit_en || m.credit : m.credit;
    return `<figure class="qimg"><a href="${src}" target="_blank" rel="noopener" aria-label="${en ? "Enlarge image" : "كبّر الصورة"}"><img src="${src}" alt="${alt}" decoding="async"></a>${cr ? `<figcaption>${en ? "Source: " : "المصدر: "}${/^https:\/\//.test(m.credit_url || "") ? `<a href="${esc(m.credit_url)}" target="_blank" rel="noopener">${esc(cr)}</a>` : esc(cr)}</figcaption>` : ""}</figure>`;
  };

  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // (9/11) مكتبة المراجعة: ?only=extra يفلتر أسئلة «إضافي» بس (إذا ماكو إضافي ← كل الأسئلة). بدونه السلوك مثل قبل.
  const onlyExtra = /[?&]only=extra(?:&|$)/.test(location.search);
  const pool = () => { const x = data.questions.filter((q) => q.extra); return onlyExtra && x.length ? x : data.questions; };
  if (onlyExtra && data.questions.some((q) => q.extra)) {   // سطر واضح بوضع «إضافي بس» + رابط يرجّع كل الأسئلة (نفس الصفحة بدون الباراميتر)
    const play = document.getElementById("play");
    if (play) play.insertAdjacentHTML("beforebegin", `<p class="xonly-note" role="status" style="margin:0 0 12px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:var(--accent-soft);font-size:.9rem;line-height:1.7">أسئلة إضافية بس · <a href="${esc(location.pathname)}" style="font-weight:700">اعرض الكل</a></p>`);
  }
  let round = [], pos = 0, wrong = [], wrongInfo = [];   // wrongInfo: {q, picked} لملخص الأخطاء بالنهاية (76)

  function start(questions) {
    round = shuffle(questions).map((q) => ({ q, order: shuffle([0, 1, 2, 3]) }));
    pos = 0;
    wrong = [];
    wrongInfo = [];
    $("result").classList.add("hidden");
    $("play").classList.remove("hidden");
    show();
  }

  function show() {
    const { q, order } = round[pos];
    $("count").textContent = `سؤال ${pos + 1} من ${round.length}`;
    $("bar").style.width = `${(pos / round.length) * 100}%`;
    $("qen").classList.add("noterm");   // 🎧 المشغّل الموحّد (29/10): مصطلحات السؤال ما تتعلّم قبل الجواب (حتى البطاقة ما تكشف الجواب)
    $("qen").textContent = q.q_en;
    document.querySelectorAll("#play .xbadge").forEach((f) => f.remove());   // (8/11) سؤال «إضافي»: شارة صغيرة فوق السؤال
    if (q.extra) $("qen").insertAdjacentHTML("beforebegin", '<div class="xbadge">إضافي · Extra</div>');
    $("qar").textContent = q.q_ar;
    document.querySelectorAll("#play .qimg").forEach((f) => f.remove());
    if (q.img && !q.img.after) $("opts").insertAdjacentHTML("beforebegin", qimg(q.img));
    $("opts").innerHTML = order.map((k, i) => `
      <button class="opt" data-k="${k}">
        <span class="l">${LETTERS[i]}</span>
        <span class="t"><span class="oe">${esc(q.options[k].en)}</span><span class="oa">${esc(q.options[k].ar)}</span></span>
      </button>`).join("");
    $("fb").className = "fb hidden";
    $("next").classList.add("hidden");
    $("opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => pick(b)));
    document.dispatchEvent(new CustomEvent("quiz:show", { detail: { q } }));
    window.scrollTo({ top: 0 });
  }

  function pick(btn) {
    const { q } = round[pos];
    const k = +btn.dataset.k;
    const all = $("opts").querySelectorAll(".opt");
    all.forEach((b) => {
      b.disabled = true;
      if (+b.dataset.k === q.answer) { b.classList.add("right"); b.insertAdjacentHTML("beforeend", '<span class="mk" aria-label="الجواب الصحيح">✓</span>'); }
    });
    document.dispatchEvent(new CustomEvent("quiz:answer", { detail: { q, ok: k === q.answer } })); // أدوات الطالب (tools.js)
    $("qen").classList.remove("noterm"); if (window.Listen) Listen.mark($("qen"));
    const fb = $("fb"), a = q.options[q.answer];
    // 76: الجواب الصحيح + «ليش صح» بكل الحالات (صح وخطأ)؛ إذا why ناقص ما ينكتب سطر فاضي
    const why = q.why ? `<div class="why">💡 ${esc(q.why)}</div>` : "";
    const ans = `<div class="ans">الإجابة الصحيحة: <span class="en">${esc(a.en)}</span>${esc(a.ar)}</div>`;
    if (k === q.answer) {
      fb.className = "fb ok";
      fb.innerHTML = `<b>🟢 إجابة صحيحة</b>${ans}${why}`;
    } else {
      btn.classList.add("wrong");
      btn.insertAdjacentHTML("beforeend", '<span class="mk" aria-label="إجابتك الخاطئة">✗</span>');
      wrong.push(q);
      wrongInfo.push({ q, picked: k });
      fb.className = "fb no";
      fb.innerHTML = `<b>🔴 إجابة خاطئة</b>${ans}${why}`;
    }
    if (q.img && q.img.after) fb.insertAdjacentHTML("beforeend", qimg(q.img));
    if (q.perr) {   // (29/10) جواب الأستاذ هو المعتمد، وجنبه بين قوسين التصحيح المحتمل — سطر قصير، مرة وحدة
      const p = q.perr, src = p.source || {};
      fb.insertAdjacentHTML("beforeend", ` <a class="perr-in" href="${/^https:\/\//.test(src.url || "") ? esc(src.url) : ""}" target="_blank" rel="noopener">(احتمال خطأ: ${esc(p.short_ar || p.correct_ar || "")})</a>`);
      fb.classList.remove("hidden");
    }
    const last = pos === round.length - 1;
    $("next").textContent = last ? "النتيجة" : "السؤال التالي";
    $("next").classList.remove("hidden");
    $("bar").style.width = `${((pos + 1) / round.length) * 100}%`;
    $("next").scrollIntoView({ block: "end", behavior: "smooth" });
  }

  // 76: «ملخص أخطائك» بنهاية الاختبار — السؤال (إنكليزي + عربي)، إجابتك، الجواب الصحيح، «ليش صح»
  function mistakes() {
    const r = $("result"); let sec = $("mistakes");
    if (!sec) { sec = document.createElement("section"); sec.id = "mistakes"; sec.className = "mistakes"; const act = r.querySelector(".actions"); act ? act.before(sec) : r.append(sec); }
    if (!wrongInfo.length) { sec.innerHTML = '<p class="allok">ما أخطأت بأي سؤال، أحسنت! 🌟 كمّل بنفس المستوى.</p>'; return; }
    sec.innerHTML = `<h2>ملخص أخطائك <small>(${wrongInfo.length})</small></h2>` + wrongInfo.map(({ q, picked }, i) => {
      const p = q.options[picked], a = q.options[q.answer];
      return `<article class="mi"><div class="mq"><span class="n">${i + 1}</span><span class="en" dir="ltr">${esc(q.q_en)}</span><span class="ar">${esc(q.q_ar)}</span></div>
        <div class="mrow bad"><b>إجابتك:</b> <span class="en" dir="ltr">${esc(p.en)}</span><span class="ar">${esc(p.ar)}</span></div>
        <div class="mrow good"><b>الجواب الصحيح:</b> <span class="en" dir="ltr">${esc(a.en)}</span><span class="ar">${esc(a.ar)}</span></div>
        ${q.why ? `<div class="why">💡 ${esc(q.why)}</div>` : ""}</article>`;
    }).join("");
  }

  function finish() {
    const n = round.length, ok = n - wrong.length, pct = ok / n;
    $("play").classList.add("hidden");
    $("result").classList.remove("hidden");
    $("score").innerHTML = `${ok}<small> / ${n}</small>`;
    $("msg").textContent =
      pct >= 0.9 ? (/\/contrast\//.test(location.pathname) ? "ممتاز! 🌟 فهمت الفحص جيداً." : "ممتاز! 🌟 لقد فهمت المحاضرة جيداً.") :
      pct >= 0.7 ? "أحسنت 👏 راجع الأسئلة التي أخطأت فيها لتثبيت المعلومة." :
      pct >= 0.5 ? "بداية جيدة 💪 اقرأ المحاضرة مرة أخرى ثم أعد المحاولة." :
                   "لا بأس 🌱 كل محاولة تقرّبك من الفهم. اقرأ الملف وعد إلينا.";
    $("retry-wrong").classList.toggle("hidden", wrong.length === 0);
    mistakes();
    document.dispatchEvent(new CustomEvent("quiz:finish", { detail: { ok, n } }));
    window.scrollTo({ top: 0 });
  }

  $("next").addEventListener("click", () => (pos < round.length - 1 ? (pos++, show()) : finish()));
  $("retry-wrong").addEventListener("click", () => start(wrong));
  $("retry-all").addEventListener("click", () => start(pool()));
  if (data.questions.length) start(pool());
})();
