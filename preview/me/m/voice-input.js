// 🎤 الكتابة بالصوت لأي حقل (29/10/2026 — نايم: ما ينحمّل بأي صفحة حيّة لحد «وافقت»؛ بس /preview/me/).
// نفس فكرة voice.js (مايك البحث) بس لأي input/textarea عليه data-voice، و«ع / EN» للغة الكلام (نفس الاختيار المحفوظ «voiceLang»).
// voice.js يبقى مثل ما هو لمربعات البحث (type=search)؛ هذا ما يلمسها حتى ما يطلع مايكين.
// Web Speech API من المتصفح نفسه: الصوت ما يتسجّل ولا ينحفظ بأي مكان، بس النص يتكتب بالحقل. المتصفح ما يدعمه ← الزر ما يطلع أصلاً.
// VoiceInput.attach(el) لحقل واحد · VoiceInput.attachAll(scope) (اختياري) لكل حقول النص · data-voice ينربط وحده (حتى اللي ينضاف بعدين).
(function () {
  if (window.VoiceInput) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const KEY = "voiceLang";
  let lang = "ar-IQ";
  try { lang = localStorage.getItem(KEY) || "ar-IQ"; } catch (e) {}
  const label = () => (lang.startsWith("ar") ? "ع" : "EN");
  const done = new WeakSet();
  let rec = null, curMic = null;

  const stop = () => { if (rec) try { rec.stop(); } catch (e) {} };
  function attach(inp) {
    if (!SR || !inp || done.has(inp) || inp.type === "search" || inp.readOnly || inp.disabled) return;
    done.add(inp);
    const box = document.createElement("span");
    box.className = "vbox";
    box.innerHTML = `<button type="button" class="vlang" aria-label="لغة الكلام: ${lang.startsWith("ar") ? "عربي" : "إنكليزي"}">${label()}</button>` +
      `<button type="button" class="vmic" aria-pressed="false" aria-label="اكتب بصوتك">🎤</button>`;
    inp.insertAdjacentElement("afterend", box);
    const mic = box.querySelector(".vmic");
    box.querySelector(".vlang").addEventListener("click", () => {
      lang = lang.startsWith("ar") ? "en-US" : "ar-IQ";
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      document.querySelectorAll(".vlang").forEach((b) => { b.textContent = label(); b.setAttribute("aria-label", `لغة الكلام: ${lang.startsWith("ar") ? "عربي" : "إنكليزي"}`); });
    });
    mic.addEventListener("click", () => {
      if (rec) { const same = curMic === mic; stop(); if (same) return; }
      // نضيف للنص الموجود (ما نمسحه): الحقل الطويل بسطر جديد/مسافة، والقصير يتبدّل
      const base = inp.tagName === "TEXTAREA" && inp.value.trim() ? inp.value.replace(/\s+$/, "") + " " : "";
      const r = new SR();
      r.lang = lang; r.interimResults = true; r.maxAlternatives = 1; r.continuous = inp.tagName === "TEXTAREA";
      rec = r; curMic = mic;
      const on = (v) => { mic.classList.toggle("on", v); mic.setAttribute("aria-pressed", v); mic.setAttribute("aria-label", v ? "وقّف الكتابة بالصوت" : "اكتب بصوتك"); };
      on(true);
      r.onresult = (ev) => {
        inp.value = base + Array.from(ev.results).map((x) => x[0].transcript).join(" ").trim();
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const end = () => { on(false); if (rec === r) { rec = null; curMic = null; } };
      r.onerror = end; r.onend = end;
      try { r.start(); inp.focus(); } catch (e) { end(); }
    });
  }
  const sel = 'input[data-voice], textarea[data-voice]';
  const scan = (root) => { if (root.matches && root.matches(sel)) attach(root); if (root.querySelectorAll) root.querySelectorAll(sel).forEach(attach); };
  function attachAll(scope = document) {   // اختياري: كل حقول النص (غير البحث وكلمات السر والأرقام) إلا اللي عليها data-novoice
    scope.querySelectorAll('textarea, input:not([type]), input[type="text"]').forEach((x) => { if (!x.closest("[data-novoice]")) attach(x); });
  }
  window.VoiceInput = { supported: !!SR, attach, attachAll, stop };
  if (!SR) return;
  const boot = () => {
    scan(document);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); }))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
})();
