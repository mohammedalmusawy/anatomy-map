// المصطلحات: قسمين (طلابنا/عامة)، بحث إنكليزي وعربي، فلتر حسب المادة، و🔊 نطق إنكليزي من المتصفح نفسه (بس لما يضغط الطالب).
(function () {
  const $ = (s) => document.querySelector(s);
  const D = JSON.parse($("#terms-data").textContent);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  let set = location.hash === "#general" ? "general" : "ours", subj = "", q = "";
  const idx = {};
  for (const k in D) idx[k] = D[k].map((t) => ({ t, s: norm([t.en, t.ar, ...(t.k || [])].join(" ")) }));

  function chips() {
    const subs = [...new Set(D[set].map((t) => t.s).filter(Boolean))];
    $("#tf").innerHTML = ['<button class="chip' + (subj ? "" : " on") + '" data-s="">الكل</button>']
      .concat(subs.map((s) => `<button class="chip${s === subj ? " on" : ""}" data-s="${esc(s)}">${esc(s)}</button>`)).join("");
  }
  function render() {
    const words = norm(q).split(" ").filter(Boolean);
    const list = idx[set].filter(({ t, s }) => (!subj || t.s === subj) && words.every((w) => s.includes(w)));
    $("#tn").textContent = `${list.length} مصطلح`;
    $("#tl").innerHTML = list.slice(0, 400).map(({ t }) => `<article class="term">
      <div class="th"><bdi class="te">${esc(t.en)}</bdi><button class="say" data-say="${esc(t.en)}" title="اضغط للسماع" aria-label="انطق ${esc(t.en)}">🔊</button><button class="say slow" data-say="${esc(t.en)}" data-r="0.75" title="لفظ بطيء" aria-label="لفظ بطيء ${esc(t.en)}">🐢</button></div>
      ${window.Say && Say.info(t.en) ? `<span class="pron"><span class="pa">${Say.info(t.en).ar}</span> <bdi class="pi">${esc(Say.info(t.en).ipa)}</bdi></span>` : ""}
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
  // 🔊 بس عند الضغط؛ صوت إنكليزي من المتصفح (بدون أي خدمة خارجية)
  let voice = null;
  const pick = () => {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voice = vs.find((v) => /^en(-|_)(GB|US)/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  };
  if (window.speechSynthesis) { pick(); speechSynthesis.onvoiceschanged = pick; }
  $("#tl").addEventListener("click", (ev) => {
    const b = ev.target.closest("button.say");
    if (!b) return;
    if (!window.speechSynthesis) { b.textContent = "🔇"; return; }
    if (window.Say && Say.has(b.dataset.say)) { Say.play(b.dataset.say, +(b.dataset.r || 1), b); return; } // 🔊 ملف صوتي جاهز (27/10)
    if (!voice) pick(); // iOS/Android: قائمة الأصوات أحياناً تتحمّل متأخرة
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(b.dataset.say);
    u.lang = voice ? voice.lang : "en-GB";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    b.classList.add("on");
    u.onend = u.onerror = () => b.classList.remove("on");
    speechSynthesis.speak(u);
  });
  if (set === "general") document.querySelectorAll("#tt a").forEach((x) => x.classList.toggle("on", x.dataset.set === "general"));
  document.addEventListener("say:ready", render);
  chips(); render();
})();
