// 🎤 البحث بالصوت (27/10): زر مايك جنب كل مربع بحث + «ع / EN» للغة الكلام.
// Web Speech API من المتصفح نفسه، مجاني وبدون مفتاح. الصوت ما يتسجّل ولا ينحفظ؛ بس النص يتكتب بالمربع.
// إذا المتصفح ما يدعمه، الزر ما يطلع أصلاً.
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const inputs = document.querySelectorAll('input[type="search"]');
  if (!SR || !inputs.length) return;
  const KEY = "voiceLang";
  let lang = "ar-IQ";
  try { lang = localStorage.getItem(KEY) || "ar-IQ"; } catch (e) {}
  inputs.forEach((inp) => {
    const box = document.createElement("span");
    box.className = "vbox";
    box.innerHTML = '<button type="button" class="vlang" aria-label="لغة الكلام"></button>' +
      '<button type="button" class="vmic" aria-label="ابحث بالصوت">🎤</button>';
    inp.insertAdjacentElement("afterend", box);
    const lb = box.querySelector(".vlang"), mic = box.querySelector(".vmic");
    const show = () => { lb.textContent = lang.startsWith("ar") ? "ع" : "EN"; };
    show();
    lb.addEventListener("click", () => {
      lang = lang.startsWith("ar") ? "en-US" : "ar-IQ";
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      document.querySelectorAll(".vlang").forEach((b) => { b.textContent = lang.startsWith("ar") ? "ع" : "EN"; });
    });
    let rec = null;
    mic.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = lang;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      mic.classList.add("on");
      rec.onresult = (ev) => {
        const t = Array.from(ev.results).map((r) => r[0].transcript).join(" ").trim();
        inp.value = t;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      };
      rec.onerror = () => { mic.classList.remove("on"); rec = null; };
      rec.onend = () => { mic.classList.remove("on"); rec = null; };
      try { rec.start(); } catch (e) { mic.classList.remove("on"); rec = null; }
    });
  });
})();
