// ✋ التحديد الذكي (طلب محمد 17/11/2026): حدّد أي كلمة أو كم كلمة (ضغطة مطوّلة بالموبايل، سحب أو ضغطتين بالكمبيوتر)
// ← قائمة صغيرة: 🔊 اسمع (+ 🐢 أبطأ) · ⭐ احفظ بمصطلحاتي · 🔍 ابحث بالموقع.
// · اللفظ: إذا النص بالمعجم (lex.json) ← ملفنا (Kokoro) عبر Listen.say؛ غيره ← صوت المتصفح (en-US)، وإذا ماكو صوت ← رسالة هادئة.
//   صوت واحد بنفس الوقت (نفس قاعدة listen.js: أي تشغيل جديد يوقف السابق، وبالعكس).
// · الحفظ: نفس مخزن «🔁 راجع اليوم» (localStorage «t:srs»، بجهاز الطالب بس، ويتزامن ويّا حسابه إذا مسجّل مثل قبل).
//   المحفوظ يدخل المراجعة ويطلع بقائمة «⭐ مصطلحاتي» بصفحة المصطلحات (terms.js). ما ينرسل شي لأي مكان.
// · نص الأستاذ ما يتغير: القائمة طبقة فوق الصفحة. ما تطلع داخل الأزرار وخيارات الاختبار والحقول والروابط والقوائم.
// · يتحمّل وحده من listen.js (كل صفحة بيها المشغّل)، بلا أي أيقونة جديدة. الدوال الصافية تشتغل بـ node (tests/pick.test.js).
(function (root, factory) {
  const P = factory();
  if (typeof module === "object" && module.exports) module.exports = P;
  else { root.Pick = P; if (typeof document !== "undefined") P.boot(); }
})(typeof self !== "undefined" ? self : this, function () {
  const SKEY = "t:srs", DAY = 864e5, MAXC = 600, SAVE_W = 6, SAVE_C = 60;
  const LAT = /[A-Za-z]/, ARB = /[؀-ۿ]/;
  const BADK = /^(__proto__|constructor|prototype)$/;   // مفاتيح تخرب الكائنات ← ما تنحفظ

  // ── دوال صافية ──
  // النص المحدد ← سطر واحد نظيف: فراغات موحّدة، بلا علامات بأوله وآخره (الأقواس المتوازنة تبقى)
  function clean(s) {
    let t = String(s || "").slice(0, 2000).replace(/[­​-‏‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim();
    t = t.replace(/^[\s"'“”‘’«»,.;:!?،؛…\-–—•·*]+/, "").replace(/[\s"'“”‘’«»,.;:!?،؛…\-–—•·*]+$/, "");
    const open = (t.match(/\(/g) || []).length, close = (t.match(/\)/g) || []).length;
    if (open > close && t.startsWith("(")) t = t.slice(1).trim();
    if (close > open && t.endsWith(")")) t = t.slice(0, -1).trim();
    return t.slice(0, MAXC);
  }
  function info(t) {
    const words = t ? t.split(" ").length : 0, latin = LAT.test(t), arabic = ARB.test(t);
    return { words, latin, arabic, canSave: latin && words <= SAVE_W && t.length <= SAVE_C && !BADK.test(t), canSay: latin || arabic };
  }
  const today = (now = Date.now()) => Math.floor(now / DAY);
  // ⭐ حفظ: مدخل جديد يبدأ بالمراجعة اليوم؛ مدخل موجود (راجعه قبل) يحتفظ بصندوقه وموعده
  function save(st, key, now = Date.now()) {
    const out = Object.assign(Object.create(null), st);
    if (BADK.test(key)) return Object.assign({}, out);
    const old = out[key];
    out[key] = old && typeof old === "object" ? Object.assign({}, old, { mine: now }, old.r || old.box || old.due != null ? { r: 1 } : {}) : { box: 0, due: today(now), mine: now };
    return Object.assign({}, out);
  }
  // إلغاء الحفظ: إذا بعده ما راجعه ← ينشال؛ إذا راجعه ← تقدّمه يبقى، بس يطلع من «مصطلحاتي»
  function unsave(st, key) {
    const out = Object.assign(Object.create(null), st), v = BADK.test(key) ? null : out[key];
    if (!v || typeof v !== "object") return Object.assign({}, out);
    if (v.r) { const w = Object.assign({}, v); delete w.mine; out[key] = w; } else delete out[key];
    return Object.assign({}, out);
  }
  const mine = (st) => Object.keys(st || {}).filter((k) => st[k] && st[k].mine).sort((a, b) => st[b].mine - st[a].mine);

  // ── الصفحة ──
  function boot() {
    if (window.__pickBooted) return; window.__pickBooted = true;
    const me = document.currentScript && document.currentScript.src;
    const base = (window.Pick && window.Pick.base) || (me ? new URL("../", me).href : new URL("./", location.href).href);
    const EXCL = "button,input,textarea,select,option,label,a,[contenteditable],[contenteditable=''],.opt,.qo,.nnav,.cbar,.crumbs,.lang,.tpop,.pkm,.pkt,.nopick,dialog,nav,header,summary";
    const en = () => document.documentElement.lang === "en";
    const L = (ar, e) => (en() ? e : ar);
    const LS = {
      get() { try { const v = JSON.parse(localStorage.getItem(SKEY) || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } },
      set(v) { try { localStorage.setItem(SKEY, JSON.stringify(v)); } catch (e) {} },
    };
    const SHEET = matchMedia("(max-width: 639px), (hover: none)");

    const css = document.createElement("style");
    css.textContent = `
.pkm{position:absolute;z-index:70;display:flex;align-items:center;gap:4px;padding:4px;background:var(--card,#fff);color:var(--ink,#222);border:1px solid var(--line,#ddd);border-radius:14px;box-shadow:0 8px 24px rgba(20,24,40,.16);font:600 15px/1.2 inherit;direction:rtl;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.pkm[hidden],.pkt[hidden]{display:none}
.pkm button{min-width:44px;min-height:44px;padding:0 10px;border:0;border-radius:10px;background:none;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.pkm button:hover,.pkm button:focus-visible{background:var(--brand-soft,#eef)}
.pkm button:focus-visible{outline:2px solid var(--brand,#446);outline-offset:1px}
.pkm button.on{background:var(--brand-soft,#eef);color:var(--brand,#446)}
.pkm .pk-slow{min-width:44px;padding:0 6px}
.pkm i{width:1px;align-self:stretch;margin:8px 0;background:var(--line,#ddd)}
.pkm.sheet{position:fixed;top:auto!important;left:max(12px,env(safe-area-inset-left))!important;right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));justify-content:space-around;border-radius:16px;padding:6px;animation:pkup .16s ease-out}
.pkm.sheet button{flex:1 1 auto}
.pkt{position:fixed;z-index:71;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));max-width:calc(100vw - 32px);box-sizing:border-box;padding:10px 14px;border-radius:12px;background:var(--ink,#222);color:var(--card,#fff);font:600 15px/1.4 inherit;box-shadow:0 8px 24px rgba(0,0,0,.2);text-align:center}
.pkt a{color:inherit;text-decoration:underline;margin-inline-start:8px;display:inline-block;min-height:24px}
.minebox{margin:10px 0 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--card,#fff);padding:0 12px}
.minebox summary{min-height:48px;display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700}
.minebox summary small{color:var(--muted,#666);font-weight:600}
.minebox ul{list-style:none;margin:0 0 8px;padding:0}
.minebox li{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:6px 0;border-top:1px solid var(--line,#ddd)}
.minebox .mk{font-weight:700;direction:ltr;unicode-bidi:isolate;overflow-wrap:anywhere}
.minebox .ta{color:var(--muted,#666);font-size:15px}
.minebox .mb{margin-inline-start:auto;display:flex;gap:4px}
.minebox .mb button{min-width:44px;min-height:44px;border:0;border-radius:10px;background:none;color:inherit;font-size:17px;cursor:pointer}
.minebox .mb button:hover,.minebox .mb button:focus-visible,.minebox .mb button.on{background:var(--brand-soft,#eef)}
.minebox .hint{margin:0 0 8px;color:var(--muted,#666);font-size:14px}
@keyframes pkup{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.pkm.sheet{animation:none}}`;
    document.head.appendChild(css);

    const m = document.createElement("div");
    m.className = "pkm noterm"; m.hidden = true; m.setAttribute("role", "toolbar"); m.setAttribute("data-noen", ""); m.dir = "rtl";
    const t = document.createElement("div");
    t.className = "pkt noterm"; t.hidden = true; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); t.setAttribute("data-noen", "");
    let text = "", nfo = null, lexKey = null, pressing = false, toastT = 0, hideT = 0, dismissed = "";

    function render() {
      const st = LS.get(), saved = !!(st[saveKey()] && st[saveKey()].mine);
      m.setAttribute("aria-label", L("خيارات النص المحدد", "Selected text options"));
      m.dir = en() ? "ltr" : "rtl"; m.style.direction = m.dir;
      let h = "";
      if (nfo.canSay) h += `<button type="button" class="pk-say" data-a="say" aria-label="${L("اسمع اللفظ", "Listen")}">🔊 <span>${L("اسمع", "Listen")}</span></button>` +
        `<button type="button" class="pk-slow" data-a="slow" aria-label="${L("لفظ أبطأ", "Slower")}" title="${L("أبطأ", "Slower")}">🐢</button><i aria-hidden="true"></i>`;
      if (nfo.canSave) h += `<button type="button" class="pk-save${saved ? " on" : ""}" data-a="save" aria-pressed="${saved}" aria-label="${saved ? L("محفوظ بمصطلحاتي — اضغط للإلغاء", "Saved — tap to remove") : L("احفظ بمصطلحاتي", "Save to my terms")}">${saved ? "⭐" : "☆"} <span>${saved ? L("محفوظ", "Saved") : L("احفظ", "Save")}</span></button><i aria-hidden="true"></i>`;
      h += `<button type="button" class="pk-find" data-a="find" aria-label="${L("ابحث بالموقع", "Search the site")}">🔍 <span>${L("ابحث", "Search")}</span></button>`;
      const fa = m.contains(document.activeElement) && document.activeElement.dataset.a;   // الفوكس يبقى على نفس الزر بعد إعادة الرسم (كيبورد)
      m.innerHTML = h;
      if (fa) { const b = m.querySelector(`button[data-a="${fa}"]`); if (b) b.focus(); }
    }
    const saveKey = () => (lexKey && window.Listen && Listen.info(lexKey) ? Listen.info(lexKey)[0] : text);

    function place(range) {
      if (!m.isConnected) document.body.appendChild(m);
      m.hidden = false;
      const sheet = SHEET.matches;
      m.classList.toggle("sheet", sheet);
      if (sheet) { m.style.top = m.style.left = ""; return; }
      const rs = range.getClientRects(), r = rs.length ? rs[rs.length - 1] : range.getBoundingClientRect();
      const W = document.documentElement.clientWidth, w = m.offsetWidth, h = m.offsetHeight;
      let top = r.bottom + 8; if (top + h > innerHeight - 8 && r.top - h - 8 > 8) top = r.top - h - 8;   // تحت التحديد، وإذا ماكو مكان فوقه
      top = Math.max(8, Math.min(top, innerHeight - h - 8));   // تحديد طويل نهايته برّا الشاشة ← القائمة تبقى بالشاشة
      m.style.top = top + scrollY + "px";
      m.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, W - w - 8)) + scrollX + "px";
    }
    function hide() { m.hidden = true; text = ""; }
    function bad(n) { const el = n && (n.nodeType === 1 ? n : n.parentElement); return !el || !!el.closest(EXCL); }

    function check() {
      clearTimeout(hideT);
      const sel = getSelection && getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { dismissed = ""; if (!pressing) hideT = setTimeout(() => { if (!pressing) hide(); }, 200); return; }
      const range = sel.getRangeAt(0);
      if (bad(sel.anchorNode) || bad(sel.focusNode) || (range.commonAncestorContainer.nodeType === 1 && range.commonAncestorContainer.closest && range.commonAncestorContainer.closest(EXCL))) { hide(); return; }
      const tx = clean(sel.toString());
      if (!tx || !(LAT.test(tx) || ARB.test(tx))) { hide(); return; }
      if (tx === dismissed) return;   // سدّها بـ Escape ← ما ترجع لنفس التحديد
      if (tx === text && !m.hidden) { place(range); return; }
      text = tx; nfo = info(tx);
      lexKey = window.Listen && Listen.match ? Listen.match(tx) : null;
      if (nfo.arabic && !nfo.latin && !arVoice()) nfo.canSay = false;
      render(); place(range);
    }
    let deb = 0;
    document.addEventListener("selectionchange", () => { clearTimeout(deb); deb = setTimeout(check, SHEET.matches ? 350 : 200); });
    ["mouseup", "keyup", "touchend"].forEach((e) => document.addEventListener(e, (ev) => { if (!m.contains(ev.target)) { clearTimeout(deb); deb = setTimeout(check, 30); } }, true));

    // ضغطة على القائمة ما تمسح التحديد (الكمبيوتر)، وبالموبايل نتذكّر النص حتى لو التحديد انمسح
    document.addEventListener("pointerdown", (ev) => { if (!m.contains(ev.target)) dismissed = ""; }, true);   // تحديد جديد (حتى لنفس النص) بعد Escape ← القائمة ترجع
    m.addEventListener("pointerdown", (ev) => { pressing = true; if (ev.pointerType === "mouse") ev.preventDefault(); });
    m.addEventListener("mousedown", (ev) => ev.preventDefault());
    addEventListener("pointerup", () => setTimeout(() => { pressing = false; }, 400), true);
    addEventListener("pointercancel", () => { pressing = false; }, true);
    m.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-a]"); if (!b || !text) return;
      ev.preventDefault(); ev.stopPropagation();
      const a = b.dataset.a;
      if (a === "say" || a === "slow") say(text, a === "slow" ? 0.75 : 1, b);
      else if (a === "save") toggleSave();
      else if (a === "find") { const q = text.slice(0, 120); hide(); location.href = base + "search/?q=" + encodeURIComponent(q); }
    });
    document.addEventListener("keydown", (ev) => {
      if (m.hidden) return;
      if (ev.key === "Escape") { dismissed = text; hide(); const f = document.activeElement; if (f && m.contains(f)) f.blur(); return; }
      // ⌨️ Tab والقائمة ظاهرة ← أول زر بيها (القائمة بآخر الصفحة، فبدون هذا Tab يروح لأول الصفحة)
      if (ev.key === "Tab" && !ev.shiftKey && !m.contains(document.activeElement) && !(document.activeElement && document.activeElement.closest("input,textarea,select,[contenteditable]"))) {
        const b = m.querySelector("button"); if (b) { ev.preventDefault(); b.focus(); }
      }
    });
    // ع ⇄ ENG والقائمة مفتوحة ← نصوصها تتبدّل فوراً
    new MutationObserver(() => { if (!m.hidden && nfo) render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    addEventListener("resize", () => { if (!m.hidden && !SHEET.matches) hide(); });

    // ── اللفظ ──
    const SS = window.speechSynthesis;
    let voices = [];
    const loadV = () => { try { voices = SS ? SS.getVoices() : []; } catch (e) { voices = []; } };
    if (SS) { loadV(); try { SS.addEventListener("voiceschanged", loadV); } catch (e) {} }
    const pickV = (lang) => {
      const pre = lang.slice(0, 2), all = voices.filter((v) => v.localService !== false && (v.lang || "").replace("_", "-").toLowerCase().startsWith(pre));   // 🔒 أصوات الجهاز بس: النص المحدد ما يطلع لخادم خارجي
      return all.find((v) => /en-US/i.test(v.lang.replace("_", "-")) && v.localService) || all.find((v) => /en-US/i.test(v.lang.replace("_", "-"))) || all.find((v) => v.localService) || all[0] || null;
    };
    function arVoice() { loadV(); return !!(SS && pickV("ar")); }
    let on = null;
    const clr = () => { if (on) on.classList.remove("on"); on = null; };
    function say(tx, rate, btn) {
      if (window.Listen && Listen.stop) Listen.stop();
      if (SS) try { SS.cancel(); } catch (e) {}
      clr(); if (btn) { on = btn; btn.classList.add("on"); }
      if (lexKey && tx === text && window.Listen && Listen.say) { Listen.say(lexKey, rate, () => clr()); return; }
      const lat = LAT.test(tx), lang = lat ? "en-US" : "ar-SA";
      loadV();
      if (!SS || !window.SpeechSynthesisUtterance || (voices.length && !pickV(lang))) { clr(); toast(L("صوت القراءة مو متوفر بهالجهاز. جرّب متصفح Chrome أو Safari المحدّث.", "Speech isn't available on this device. Try an updated Chrome or Safari.")); return; }
      const u = new SpeechSynthesisUtterance(lat ? tx.replace(/[؀-ۿ]+/g, " ") : tx);
      u.lang = lang; const v = pickV(lang); if (v) try { u.voice = v; } catch (e) {}
      u.rate = rate < 1 ? 0.7 : 0.95;
      u.onend = clr;
      u.onerror = (e) => { clr(); if (e && e.error !== "interrupted" && e.error !== "canceled") toast(L("ما گدرت أشغّل الصوت. جرّب مرة ثانية.", "Couldn't play the sound. Try again.")); };
      try { SS.speak(u); } catch (e) { clr(); }
    }
    // listen.js يشغّل شي ← صوت المتصفح يوقف (صوت واحد بنفس الوقت)
    document.addEventListener("listen:play", () => { if (SS) try { SS.cancel(); } catch (e) {} clr(); });

    // ── الحفظ ──
    function toggleSave() {
      const k = saveKey(), st = LS.get(), was = !!(st[k] && st[k].mine);
      LS.set(was ? unsave(st, k) : save(st, k));
      document.dispatchEvent(new CustomEvent("pick:saved", { detail: { key: k, saved: !was } }));
      render();
      const onTerms = /\/terms\/?$/.test(location.pathname);
      toast(was ? L("انشال من مصطلحاتي", "Removed from my terms") : L("⭐ انحفظ بمصطلحاتي، ويطلعلك بـ «راجع اليوم»", "⭐ Saved to my terms"), was || onTerms ? null : [L("افتحها", "Open"), base + "terms/#mine"]);
    }
    function toast(msg, link) {
      if (!t.isConnected) document.body.appendChild(t);
      t.textContent = msg;
      if (link) { const a = document.createElement("a"); a.href = link[1]; a.textContent = link[0]; t.appendChild(a); }
      t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3500);
    }
    window.Pick.say = (tx, rate, btn) => { text = ""; lexKey = window.Listen && Listen.match ? Listen.match(tx) : null; if (lexKey) text = tx; say(tx, rate || 1, btn); };
    window.Pick.toast = toast;
  }
  return { clean, info, save, unsave, mine, today, boot, SKEY };
});
