// 🔊 لفظ المصطلحات (27/10): ملف صوتي جاهز لكل مصطلح (Kokoro، صوت بشري واحد) بدل صوت المتصفح.
// - يلگى المصطلحات الإنكليزية بأي صفحة (عناوين الحالات، الفحوصات، الخيارات، الأعراض، البحث، المساعد) ويحط 🔊 + 🐢 جنبها.
// - الملف ينزل بس عند الضغط، وبعدها ينحفظ بالـ PWA ويشتغل بلا نت.
// - إذا الملف ناقص: صوت المتصفح مؤقتاً، وينحفظ بقائمة «الناقص» على الجهاز (t:say-missing).
(function () {
  const root = new URL(".", document.querySelector('link[rel="manifest"]').href).href;
  const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  let IDX = null, audio = null, cur = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function fallback(text, rate) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.9 * rate;
    speechSynthesis.speak(u);
    try { const m = JSON.parse(localStorage.getItem("t:say-missing") || "{}"); m[slug(text)] = text; localStorage.setItem("t:say-missing", JSON.stringify(m)); } catch (e) {}
  }
  function play(text, rate, btn) {
    const s = slug(text);
    if (!IDX || !IDX[s]) return fallback(text, rate);
    if (!audio) audio = new Audio();             // عنصر واحد يُعاد استعماله: يشتغل من أول ضغطة حتى بالآيفون
    if (cur) cur.classList.remove("on");
    audio.pause();
    audio.src = root + "assets/audio/terms/" + s + ".mp3";
    audio.playbackRate = rate; audio.defaultPlaybackRate = rate;
    cur = btn; if (btn) btn.classList.add("on");
    audio.onended = audio.onerror = () => { if (btn) btn.classList.remove("on"); };
    audio.play().catch(() => fallback(text, rate));
  }
  window.Say = { play, has: (t) => !!(IDX && IDX[slug(t)]), info: (t) => IDX && IDX[slug(t)] };
  const btns = (text) => `<span class="sayb"><button type="button" class="say1" data-t="${esc(text)}" title="اضغط للسماع" aria-label="اسمع لفظ ${esc(text)}">🔊</button>` +
    `<button type="button" class="say1 slow" data-t="${esc(text)}" data-r="0.75" title="لفظ بطيء" aria-label="لفظ بطيء ${esc(text)}">🐢</button></span>`;
  const pron = (i) => `<span class="pron"><span class="pa">${i.ar}</span> <bdi class="pi">${esc(i.ipa)}</bdi></span>`;
  function decorate(rootEl) {
    if (!IDX) return;
    // عناوين الحالات والفحوصات (+ اللفظ تحتها)
    rootEl.querySelectorAll("article.case h3 .en, .h1-en, h1 bdi, .sxt bdi, .exam h2 .en").forEach((el) => {
      if (el.dataset.say) return; const t = el.textContent.trim(), i = IDX[slug(t)];
      el.dataset.say = 1; if (!i) return;
      el.insertAdjacentHTML("afterend", btns(t) + (el.closest("article.case") ? pron(i) : ""));
    });
    // خيارات الأسئلة ومقاطع إنكليزية صغيرة (المصطلح كامل بس)
    rootEl.querySelectorAll(".oe, .rq .en, .rsum .en, .key .en, .sres b, .chat .key .en").forEach((el) => {
      if (el.dataset.say) return; const t = el.textContent.trim(); el.dataset.say = 1;
      if (IDX[slug(t)]) el.insertAdjacentHTML("beforeend", " " + btns(t));
    });
  }
  // نفس الضغط للماوس واللمس والكيبورد (زر = Enter/Space)؛ وما يفتح الرابط أو يختار الجواب بالغلط
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest(".say1"); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    play(b.dataset.t, +(b.dataset.r || 1), b);
  }, true);
  fetch(root + "assets/audio/terms/index.json").then((r) => r.ok ? r.json() : {}).then((d) => {
    IDX = d; decorate(document); document.dispatchEvent(new Event("say:ready"));
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && decorate(n.parentElement || n))))
      .observe(document.body, { childList: true, subtree: true });
  }).catch(() => {});
})();
