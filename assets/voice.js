// 🎤 البحث بالصوت (27/10، تحسين الوضوح والخصوصية 10/11): زر مايك جنب كل مربع بحث + «ع / EN» للغة الكلام.
// اختياري بالكامل: ما يشتغل إلا بضغطة منك + إذن المايك من المتصفح. الصوت مؤقت: إحنا ما نسجّله ولا نحفظه ولا نرسله لسيرفرنا (المتصفح نفسه ممكن يحوّله بخدمته)،
// والنص يتكتب بالمربع بس وما يتبعت لأي مكان لحد ما إنت تضغط بحث/إرسال (وتسجيل «بحث بلا نتيجة» يتخطى النص اللي جاي من المايك: data-from-voice).
// ⚠️ Web Speech API من المتصفح: كروم وسفاري ممكن يحوّلون الكلام لنص بخدمتهم (Google/Apple)، فنكتب هالشي بوضوح أول مرة.
// إذا المتصفح ما يدعم الكلام لنص، الزر ما يطلع أصلاً (ولا شي ينكسر).
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const inputs = document.querySelectorAll('input[type="search"]');
  if (!SR || !inputs.length) return;
  const KEY = "voiceLang", TOLD = "t:voice-told";
  let lang = "ar-IQ";
  try { lang = localStorage.getItem(KEY) || "ar-IQ"; } catch (e) {}
  const isAr = () => lang.startsWith("ar");
  const langName = () => (isAr() ? "عربي" : "إنكليزي");
  const ERR = {
    "not-allowed": "اسمح للمايك من إعدادات المتصفح (القفل 🔒 جنب الرابط)، وبعدها اضغط 🎤 من جديد.",
    "service-not-allowed": "المتصفح ما يسمح بتحويل الكلام لنص هنا. اكتب يدوياً.",
    "audio-capture": "ما لگيت مايك بجهازك.",
    "no-speech": "ما سمعت شي، اضغط 🎤 وجرّب مرة ثانية.",
    "network": "تحويل الكلام لنص يحتاج إنترنت. اكتب يدوياً هسه.",
    "language-not-supported": "هاللغة مو مدعومة بمتصفحك، بدّل بين «ع / EN».",
  };
  let rec = null, curMic = null;
  const stop = () => { if (rec) try { rec.stop(); } catch (e) {} };   // إيقاف عادي: آخر كلمات تنكتب قبل ما ينتهي
  const stopHard = () => { const r = rec; rec = null; curMic = null; if (r) try { r.abort ? r.abort() : r.stop(); } catch (e) {} };   // عند الإرسال: ولا شي ينكتب بعده
  window.__voiceStop = stop;   // مايك واحد شغّال بالصفحة (voice-input.js يستدعيه قبل ما يبدأ)
  inputs.forEach((inp) => {
    const box = document.createElement("span");
    box.className = "vbox";
    box.innerHTML = '<button type="button" class="vlang"></button>' +
      '<button type="button" class="vmic" aria-pressed="false" aria-label="ابحث بالصوت">🎤</button>';
    inp.insertAdjacentElement("afterend", box);
    const msg = document.createElement("span");
    msg.className = "vmsg"; msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite"); msg.hidden = true;
    const fm = inp.closest("form");
    if (fm && getComputedStyle(fm).display === "flex") fm.insertAdjacentElement("beforebegin", msg); else box.insertAdjacentElement("afterend", msg);   // نموذج flex (المساعد): الرسالة فوقه حتى ما تضغط المربع
    const say = (t) => { msg.textContent = t || ""; msg.hidden = !t; };
    const lb = box.querySelector(".vlang"), mic = box.querySelector(".vmic");
    const paintLang = () => document.querySelectorAll(".vlang").forEach((b) => {
      b.textContent = isAr() ? "ع" : "EN"; b.setAttribute("aria-label", "لغة الكلام: " + langName());
    });
    paintLang();
    lb.addEventListener("click", () => {
      lang = isAr() ? "en-US" : "ar-IQ";
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      paintLang(); stop();   // اللغة الجديدة تنطبق بالضغطة الجاية
    });
    mic.addEventListener("click", () => {
      if (rec) { const same = curMic === mic; stop(); if (same) return; }
      if (window.VoiceInput && window.VoiceInput.stop) window.VoiceInput.stop();
      say("");
      if (navigator.onLine === false) { say(ERR.network); return; }   // بلا نت: ما نبدأ أصلاً
      const r = new SR();
      r.lang = lang; r.interimResults = true; r.maxAlternatives = 1;
      let told = false; try { told = localStorage.getItem(TOLD) === "1"; } catch (e) {}
      if (!told) { say("🎤 المتصفح يحوّل كلامك لنص بخدمته (ممكن Google أو Apple). إحنا ما نسجّل الصوت ولا نحفظه."); try { localStorage.setItem(TOLD, "1"); } catch (e) {} }
      rec = r; curMic = mic;
      const on = (v) => { mic.classList.toggle("on", v); mic.setAttribute("aria-pressed", String(v)); };
      on(true);
      r.onresult = (ev) => {
        if (rec !== r) return;
        inp.dataset.fromVoice = "1";
        inp.value = Array.from(ev.results).map((x) => x[0].transcript).join(" ").trim();
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const end = () => { on(false); if (rec === r) { rec = null; curMic = null; } };
      r.onerror = (ev) => { const c = ev && ev.error; if (c && c !== "aborted") say(ERR[c] || "ما اشتغل المايك هسه. اكتب يدوياً."); end(); };
      r.onend = end;
      try { r.start(); } catch (e) { say("ما اشتغل المايك هسه. اكتب يدوياً."); end(); }
    });
    ["keydown", "paste"].forEach((t) => inp.addEventListener(t, () => { delete inp.dataset.fromVoice; }));   // لما تكتب إنت، النص صار نصك
    const form = inp.closest("form");
    if (form) form.addEventListener("submit", stopHard);   // الإرسال بضغطة منك بس، ونوقف المايك قبله
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
})();
