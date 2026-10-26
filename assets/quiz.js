// اختبار محاضرة وحدة: نفس أسئلة الملف، والترتيب (الأسئلة والخيارات) يتخلط كل مرة.
(() => {
  const data = JSON.parse(document.getElementById("quiz-data").textContent);
  const $ = (id) => document.getElementById(id);
  const LETTERS = ["A", "B", "C", "D"];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let round = [], pos = 0, wrong = [];

  function start(questions) {
    round = shuffle(questions).map((q) => ({ q, order: shuffle([0, 1, 2, 3]) }));
    pos = 0;
    wrong = [];
    $("result").classList.add("hidden");
    $("play").classList.remove("hidden");
    show();
  }

  function show() {
    const { q, order } = round[pos];
    $("count").textContent = `سؤال ${pos + 1} من ${round.length}`;
    $("bar").style.width = `${(pos / round.length) * 100}%`;
    $("qen").textContent = q.q_en;
    $("qar").textContent = q.q_ar;
    $("opts").innerHTML = order.map((k, i) => `
      <button class="opt" data-k="${k}">
        <span class="l">${LETTERS[i]}</span>
        <span class="t"><span class="oe">${esc(q.options[k].en)}</span><span class="oa">${esc(q.options[k].ar)}</span></span>
      </button>`).join("");
    $("fb").className = "fb hidden";
    $("next").classList.add("hidden");
    $("opts").querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => pick(b)));
    window.scrollTo({ top: 0 });
  }

  function pick(btn) {
    const { q } = round[pos];
    const k = +btn.dataset.k;
    const all = $("opts").querySelectorAll(".opt");
    all.forEach((b) => {
      b.disabled = true;
      if (+b.dataset.k === q.answer) b.classList.add("right");
    });
    const fb = $("fb");
    if (k === q.answer) {
      fb.className = "fb ok";
      fb.textContent = "🟢 إجابة صحيحة";
    } else {
      btn.classList.add("wrong");
      wrong.push(q);
      const a = q.options[q.answer];
      fb.className = "fb no";
      fb.innerHTML = `<b>🔴 إجابة خاطئة</b>
        <div class="ans">الإجابة الصحيحة: <span class="en">${esc(a.en)}</span>${esc(a.ar)}</div>
        <div class="why">💡 ${esc(q.why)}</div>`;
    }
    const last = pos === round.length - 1;
    $("next").textContent = last ? "النتيجة" : "السؤال التالي";
    $("next").classList.remove("hidden");
    $("bar").style.width = `${((pos + 1) / round.length) * 100}%`;
    $("next").scrollIntoView({ block: "end", behavior: "smooth" });
  }

  function finish() {
    const n = round.length, ok = n - wrong.length, pct = ok / n;
    $("play").classList.add("hidden");
    $("result").classList.remove("hidden");
    $("score").innerHTML = `${ok}<small> / ${n}</small>`;
    $("msg").textContent =
      pct >= 0.9 ? "ممتاز! 🌟 لقد فهمت المحاضرة جيداً." :
      pct >= 0.7 ? "أحسنت 👏 راجع الأسئلة التي أخطأت فيها لتثبيت المعلومة." :
      pct >= 0.5 ? "بداية جيدة 💪 اقرأ المحاضرة مرة أخرى ثم أعد المحاولة." :
                   "لا بأس 🌱 كل محاولة تقرّبك من الفهم. اقرأ الملف وعد إلينا.";
    $("retry-wrong").classList.toggle("hidden", wrong.length === 0);
    window.scrollTo({ top: 0 });
  }

  $("next").addEventListener("click", () => (pos < round.length - 1 ? (pos++, show()) : finish()));
  $("retry-wrong").addEventListener("click", () => start(wrong));
  $("retry-all").addEventListener("click", () => start(data.questions));
  start(data.questions);
})();
