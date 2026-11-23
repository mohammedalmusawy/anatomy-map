// ✋ التحديد الذكي (طلب محمد 17/11/2026): حدّد أي كلمة أو كم كلمة (ضغطة مطوّلة بالموبايل، سحب أو ضغطتين بالكمبيوتر)
// ← قائمة صغيرة: 🔊 اسمع (+ 🐢 أبطأ) · ⭐ احفظ بمصطلحاتي · 🔍 ابحث بالموقع.
// · اللفظ: إذا النص بالمعجم (lex.json) ← ملفنا (Kokoro) عبر Listen.say؛ غيره ← صوت المتصفح (en-US)، وإذا ماكو صوت ← رسالة هادئة.
//   صوت واحد بنفس الوقت (نفس قاعدة listen.js: أي تشغيل جديد يوقف السابق، وبالعكس).
// · الحفظ: نفس مخزن «🔁 راجع اليوم» (localStorage «t:srs»، بجهاز الطالب بس، ويتزامن ويّا حسابه إذا مسجّل مثل قبل).
//   المحفوظ يدخل المراجعة ويطلع بقائمة «⭐ مصطلحاتي» بصفحة المصطلحات (terms.js). ما ينرسل شي لأي مكان.
// · نص الأستاذ ما يتغير: القائمة طبقة فوق الصفحة. ما تطلع داخل الأزرار وخيارات الاختبار والحقول والروابط والقوائم.
// 🖍️ (18/11) «ظلّل»: يلوّن النص المحدد بـ 4 ألوان هادئة (mark.hl) كطبقة بصرية محلية فوق الصفحة (نص الأستاذ ما يتغير)؛ يتحفظ بـ localStorage «t:hl» بجهاز الطالب بس
//   (اقتباس نصي W3C TextQuoteSelector: exact + prefix/suffix داخل أقرب حاوية بمعرّف)، ويرجع بعد التحديث؛ وقائمة «🖍️ تظليلاتي» بصفحة المصطلحات.
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
.pkm.sheet{flex-wrap:wrap;position:fixed;top:auto!important;left:max(12px,env(safe-area-inset-left))!important;right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));justify-content:space-around;border-radius:16px;padding:6px;animation:pkup .16s ease-out}
.pkm.sheet button{flex:1 1 auto}
.pkt{position:fixed;z-index:71;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));max-width:calc(100vw - 32px);box-sizing:border-box;padding:10px 14px;border-radius:12px;background:var(--ink,#222);color:var(--card,#fff);font:600 15px/1.4 inherit;box-shadow:0 8px 24px rgba(0,0,0,.2);text-align:center}
.pkt a{color:inherit;text-decoration:underline;margin-inline-start:8px;display:inline-block;min-height:24px}
.pkng{position:fixed;z-index:72;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));width:min(420px,calc(100vw - 32px));box-sizing:border-box;padding:14px 16px;border-radius:16px;background:var(--card,#fff);color:var(--ink,#1E2433);border:1px solid var(--line,rgba(0,0,0,.12));box-shadow:0 10px 30px rgba(0,0,0,.18);font:15px/1.6 inherit}
.pkng[hidden]{display:none}.pkng b{display:block;font-size:16px;margin-bottom:2px}.pkng p{margin:0 0 10px;font-size:14.5px;opacity:.9}
.pkng div{display:flex;gap:8px;flex-wrap:wrap}.pkng button{min-height:44px;padding:0 16px;border-radius:12px;font:inherit;font-weight:700;cursor:pointer;border:1px solid var(--brand,#2F5BEA);background:var(--brand,#2F5BEA);color:#fff}
.pkng button.gh{background:transparent;color:var(--ink,#1E2433);border-color:var(--line,rgba(0,0,0,.2))}
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
.minebox .mx{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
.minebox .mx button{min-height:44px;padding:0 14px;border:1px solid var(--line,#ddd);border-radius:12px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}
.minebox .mx button:hover,.minebox .mx button:focus-visible{background:var(--brand-soft,#eef)}
mark.hl{border-radius:3px;padding:0 1px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
mark.hl .tm{color:inherit}
mark.hl.hl-y,mark.hl.hl-g,mark.hl.hl-b,mark.hl.hl-p{color:#1E2433}.hld.hl-y{background:#F5C518}.hld.hl-g{background:#4CAF6E}.hld.hl-b{background:#4A90D9}.hld.hl-p{background:#E873A5}mark.hl.hl-y{background:#FFE58F}mark.hl.hl-g{background:#BFEBC9}mark.hl.hl-b{background:#BCDBF9}mark.hl.hl-p{background:#F8CFE0}
@media (prefers-color-scheme: dark){:root:not([data-theme=light]) body:not(.calm) mark.hl{color:#F3F4F6}:root:not([data-theme=light]) body:not(.calm) mark.hl.hl-y{background:#5C4A0E}:root:not([data-theme=light]) body:not(.calm) mark.hl.hl-g{background:#1E5236}:root:not([data-theme=light]) body:not(.calm) mark.hl.hl-b{background:#1F4470}:root:not([data-theme=light]) body:not(.calm) mark.hl.hl-p{background:#6B2A4A}}
:root[data-theme=dark] mark.hl{color:#F3F4F6}:root[data-theme=dark] mark.hl.hl-y{background:#5C4A0E}:root[data-theme=dark] mark.hl.hl-g{background:#1E5236}:root[data-theme=dark] mark.hl.hl-b{background:#1F4470}:root[data-theme=dark] mark.hl.hl-p{background:#6B2A4A}
mark.hl.flash{outline:3px solid var(--brand,#446);outline-offset:2px;animation:hlf 1.8s ease-out}
.pkm .pk-sw{min-width:44px;padding:0}
.pkm .pk-sw .sw{display:block;width:26px;height:26px;border-radius:50%;border:2px solid var(--line,#ddd);box-sizing:border-box}
.pkm .pk-sw[aria-pressed=true] .sw{border:3px solid var(--ink,#222)}
.sw-y{background:#F5C518}.sw-g{background:#4CAF6E}.sw-b{background:#4A90D9}.sw-p{background:#E873A5}
.hlbox .hf{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
.hlbox .hf button{min-height:44px;min-width:44px;padding:0 14px;border:1px solid var(--line,#ddd);border-radius:12px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.hlbox .hf button[aria-pressed=true]{background:var(--brand-soft,#eef);border-color:var(--brand,#446)}
.hlbox .hld{width:14px;height:14px;border-radius:50%;flex:none;border:1px solid var(--line,#ddd)}
.hlbox h4{margin:10px 0 2px;font-size:15px}.hlbox h4 a{color:var(--brand,#446)}
.hlbox li{flex-wrap:nowrap;gap:10px}.hlbox .hlt{flex:1 1 auto;min-width:0;color:inherit;text-decoration:none;overflow-wrap:anywhere;padding:8px 0;line-height:1.5}
.hlbox .hlt:hover,.hlbox .hlt:focus-visible{text-decoration:underline}
@keyframes hlf{0%{outline-color:transparent}20%{outline-color:var(--brand,#446)}100%{outline-color:var(--brand,#446)}}
@media (prefers-reduced-motion: reduce){mark.hl.flash{animation:none}}
@keyframes pkup{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.pkm.sheet{animation:none}}`;
    document.head.appendChild(css);

    const m = document.createElement("div");
    m.className = "pkm noterm"; m.hidden = true; m.setAttribute("role", "toolbar"); m.setAttribute("data-noen", ""); m.dir = "rtl";
    const t = document.createElement("div");
    t.className = "pkt noterm"; t.hidden = true; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); t.setAttribute("data-noen", "");
    let text = "", nfo = null, lexKey = null, pressing = false, toastT = 0, hideT = 0, dismissed = "";
    let selRange = null, view = "main", hlId = null, hlOnly = false;   // 🖍️ المدى المحدد، شاشة القائمة (main/color)، تظليل موجود، قائمة فتحتها ضغطة على تظليل

    function render() {
      const st = LS.get(), saved = !!(st[saveKey()] && st[saveKey()].mine);
      m.setAttribute("aria-label", L("خيارات النص المحدد", "Selected text options"));
      m.dir = en() ? "ltr" : "rtl"; m.style.direction = m.dir;
      let h = "";
      if (view === "color") {
        const cur = hlId && (hlGet(hlId) || {}).c;
        h = HC.map((c) => `<button type="button" class="pk-sw" data-a="hlc" data-c="${c}" aria-pressed="${cur === c}" aria-label="${HN(c)}" title="${HN(c)}"><span class="sw sw-${c}"></span></button>`).join("");
        if (hlId) h += `<i aria-hidden="true"></i><button type="button" class="pk-hlrm" data-a="hlrm" aria-label="${L("شيل التظليل", "Remove highlight")}">✕ <span>${L("شيل التظليل", "Remove")}</span></button>`;
        if (!hlOnly) h += `<i aria-hidden="true"></i><button type="button" class="pk-back" data-a="hlback" aria-label="${L("رجوع", "Back")}">↩</button>`;
        m.setAttribute("aria-label", L("اختر لون التظليل", "Pick a highlight colour"));
        const fa0 = m.contains(document.activeElement) && document.activeElement.dataset.a;
        m.innerHTML = h;
        if (fa0) { const b = m.querySelector(`button[data-a="${fa0}"]`); if (b) b.focus(); }
        return;
      }
      if (nfo.canSay) h += `<button type="button" class="pk-say" data-a="say" aria-label="${L("اسمع اللفظ", "Listen")}">🔊 <span>${L("اسمع", "Listen")}</span></button>` +
        `<button type="button" class="pk-slow" data-a="slow" aria-label="${L("لفظ أبطأ", "Slower")}" title="${L("أبطأ", "Slower")}">🐢</button>` +
        `<button type="button" class="pk-slow" data-a="slow2" aria-label="${L("لفظ أبطأ بعد", "Even slower")}" title="${L("أبطأ بعد", "Even slower")}">🐌</button><i aria-hidden="true"></i>`;   // 🐌 (23/11)
      if (nfo.canSave) h += `<button type="button" class="pk-save${saved ? " on" : ""}" data-a="save" aria-pressed="${saved}" aria-label="${saved ? L("محفوظ بمصطلحاتي — اضغط للإلغاء", "Saved — tap to remove") : L("احفظ بمصطلحاتي", "Save to my terms")}">${saved ? "⭐" : "☆"} <span>${saved ? L("محفوظ", "Saved") : L("احفظ", "Save")}</span></button><i aria-hidden="true"></i>`;
      if (selRange) h += `<button type="button" class="pk-hl${hlId ? " on" : ""}" data-a="hl" aria-label="${L("ظلّل النص", "Highlight")}">🖍️ <span>${L("ظلّل", "Highlight")}</span></button><i aria-hidden="true"></i>`;
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
    function hide() { m.hidden = true; text = ""; view = "main"; hlOnly = false; }
    function bad(n) { const el = n && (n.nodeType === 1 ? n : n.parentElement); return !el || !!el.closest(EXCL); }

    function check() {
      clearTimeout(hideT);
      const sel = getSelection && getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { dismissed = ""; if (!pressing && !hlOnly) hideT = setTimeout(() => { if (!pressing && !hlOnly) hide(); }, 200); return; }
      const range = sel.getRangeAt(0);
      if (bad(sel.anchorNode) || bad(sel.focusNode) || (range.commonAncestorContainer.nodeType === 1 && range.commonAncestorContainer.closest && range.commonAncestorContainer.closest(EXCL))) { hide(); return; }
      const tx = clean(sel.toString());
      if (!tx || !(LAT.test(tx) || ARB.test(tx))) { hide(); return; }
      selRange = range.cloneRange(); const hid = hlIdOf(range);   // 🖍️ المدى نخزنه (بالموبايل التحديد ينمسح أول ما نضغط الزر)
      if (tx === dismissed) return;   // سدّها بـ Escape ← ما ترجع لنفس التحديد
      if (tx === text && !m.hidden && !hlOnly) { if (hid !== hlId) { hlId = hid; if (view === "color") render(); } place(range); return; }
      hlOnly = false; view = "main"; hlId = hid;
      text = tx; nfo = info(tx);
      lexKey = window.Listen && Listen.match ? Listen.match(tx) : null;
      if (nfo.arabic && !nfo.latin && !arVoice()) nfo.canSay = false;
      render(); place(range);
    }
    let deb = 0;
    document.addEventListener("selectionchange", () => { clearTimeout(deb); deb = setTimeout(check, SHEET.matches ? 350 : 200); });
    ["mouseup", "keyup", "touchend"].forEach((e) => document.addEventListener(e, (ev) => { if (!m.contains(ev.target)) { clearTimeout(deb); deb = setTimeout(check, 30); } }, true));

    // ضغطة على القائمة ما تمسح التحديد (الكمبيوتر)، وبالموبايل نتذكّر النص حتى لو التحديد انمسح
    document.addEventListener("pointerdown", (ev) => { if (!m.contains(ev.target)) { dismissed = ""; if (hlOnly) hide(); } }, true);   // تحديد جديد (حتى لنفس النص) بعد Escape ← القائمة ترجع
    m.addEventListener("pointerdown", (ev) => { pressing = true; if (ev.pointerType === "mouse") ev.preventDefault(); });
    m.addEventListener("mousedown", (ev) => ev.preventDefault());
    addEventListener("pointerup", () => setTimeout(() => { pressing = false; }, 400), true);
    addEventListener("pointercancel", () => { pressing = false; }, true);
    m.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-a]"); if (!b || !text) return;
      ev.preventDefault(); ev.stopPropagation();
      const a = b.dataset.a;
      if (a === "say" || a === "slow" || a === "slow2") say(text, a === "slow2" ? 0.6 : a === "slow" ? 0.75 : 1, b);
      else if (a === "save") toggleSave();
      else if (a === "hl" || a === "hlback") { view = a === "hl" ? "color" : "main"; render(); if (a === "hl") { const f = m.querySelector(".pk-sw"); if (f) f.focus(); } }
      else if (a === "hlc") applyColor(b.dataset.c);
      else if (a === "hlrm") { const id = hlId; hide(); hlRemove(id); getSelection().removeAllRanges(); toast(L("انشال التظليل", "Highlight removed")); }
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

    // ── 🖍️ التظليل ──
    const HK = "t:hl", HMAX = 2000, HC = ["y", "g", "b", "p"], HNAR = { y: "أصفر", g: "أخضر", b: "أزرق", p: "وردي" }, HNEN = { y: "Yellow", g: "Green", b: "Blue", p: "Pink" };
    const HN = (c) => (en() ? HNEN : HNAR)[c];
    const NOWRAP = EXCL + ",script,style,noscript,svg";
    const TSKIP = "script,style,noscript,.pkm,.pkt,.tpop";
    const baseP = (() => { try { return new URL(base).pathname; } catch (e) { return "/"; } })();
    const REL = (() => { let p = location.pathname; p = p.startsWith(baseP) ? p.slice(baseP.length) : p.replace(/^\//, ""); return p.replace(/index\.html$/, ""); })();
    const validHl = (x) => x && typeof x === "object" && /^[a-z0-9]{4,16}$/.test(x.id || "") && HC.includes(x.c) && typeof x.ex === "string" && x.ex && typeof x.p === "string";
    function hlRead() { try { const v = JSON.parse(localStorage.getItem(HK) || "null"); return v && Array.isArray(v.items) ? v.items.filter(validHl) : []; } catch (e) { return []; } }
    function hlWrite(items) { try { localStorage.setItem(HK, JSON.stringify({ v: 1, items: items.slice(-HMAX) })); } catch (e) {} document.dispatchEvent(new CustomEvent("hl:changed")); }
    const hlGet = (id) => hlRead().find((x) => x.id === id);
    const fallbackRoot = () => document.querySelector("main, .wrap") || document.body;
    const tnodes = (root) => {
      const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest(TSKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      while (w.nextNode()) out.push(w.currentNode);
      return out;
    };
    const markOf = (n) => { const el = n && (n.nodeType === 1 ? n : n.parentElement); return el && el.closest ? el.closest("mark.hl") : null; };
    function hlIdOf(range) { const a = markOf(range.startContainer), b = markOf(range.endContainer); return a && b && a.dataset.hl === b.dataset.hl ? a.dataset.hl : null; }
    function scopeOf(range) {
      let el = range.commonAncestorContainer; el = el.nodeType === 1 ? el : el.parentElement;
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) if (el.id && !/^(tpop|pkm|pkt)/.test(el.id) && document.getElementById(el.id) === el) return el;
      return fallbackRoot();
    }
    const newId = () => "h" + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
    // مدى ← إزاحات الحروف داخل حاوية (نص كل العُقد بالترتيب)
    function offsetsOf(root, range) {
      const nodes = tnodes(root); let cum = 0, s = -1, e = -1, full = "";
      for (const n of nodes) {
        const len = n.nodeValue.length;
        if (range.intersectsNode(n)) {
          const a = n === range.startContainer ? range.startOffset : 0, b = n === range.endContainer ? range.endOffset : len;
          if (b > a) { if (s < 0) s = cum + a; e = cum + b; }
        }
        full += n.nodeValue; cum += len;
      }
      return s < 0 ? null : { s, e, full };
    }
    function wrapOffsets(root, s, e, c, id) {
      let cum = 0, count = 0;
      for (const node of tnodes(root)) {
        const len = node.nodeValue.length, a = Math.max(s, cum) - cum, b = Math.min(e, cum + len) - cum; cum += len;
        if (b <= a || !/\S/.test(node.nodeValue.slice(a, b))) continue;
        const par = node.parentElement; if (!par || par.closest(NOWRAP) || par.closest("mark.hl")) continue;
        let n = node; if (b < len) n.splitText(b); if (a > 0) n = n.splitText(a);
        const mk = document.createElement("mark"); mk.className = "hl hl-" + c; mk.dataset.hl = id;
        n.parentNode.insertBefore(mk, n); mk.appendChild(n); count++;
      }
      return count;
    }
    const cl = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
    function locate(root, it, cache) {
      let full = cache && cache.get(root);
      if (full == null) { full = tnodes(root).map((n) => n.nodeValue).join(""); if (cache) cache.set(root, full); }   // التظليل ما يغيّر النص ← نص الحاوية ينقرا مرة وحدة بالجولة
      let best = -1, sc = -1, i = -1;
      while ((i = full.indexOf(it.ex, i + 1)) >= 0) {
        const pre = full.slice(Math.max(0, i - 32), i), suf = full.slice(i + it.ex.length, i + it.ex.length + 32);
        const v = cl([...(it.pre || "")].reverse().join(""), [...pre].reverse().join("")) + cl(it.suf || "", suf);
        if (v > sc) { sc = v; best = i; }
      }
      return best < 0 ? null : { s: best, e: best + it.ex.length };
    }
    function hlCreate(range, c) {
      const root = scopeOf(range), o = offsetsOf(root, range); if (!o) return false;
      let { s, e } = o; const full = o.full;
      while (s < e && /\s/.test(full[s])) s++; while (e > s && /\s/.test(full[e - 1])) e--;
      if (e - s < 2 || e - s > 2000) return false;
      const id = newId(), n = wrapOffsets(root, s, e, c, id); if (!n) return false;
      const items = hlRead();
      items.push({ id, p: REL, t: (document.title || "").slice(0, 120), c, sc: root.id || "", ex: full.slice(s, e), pre: full.slice(Math.max(0, s - 32), s), suf: full.slice(e, e + 32), at: Date.now() });
      hlWrite(items); return true;
    }
    const marksOf = (id) => [...document.querySelectorAll(`mark.hl[data-hl="${id}"]`)];
    function hlRemove(id) {
      if (!id) return;
      marksOf(id).forEach((mk) => { const par = mk.parentNode; while (mk.firstChild) par.insertBefore(mk.firstChild, mk); par.removeChild(mk); par.normalize(); });
      hlWrite(hlRead().filter((x) => x.id !== id));
    }
    function hlRecolor(id, c) { marksOf(id).forEach((mk) => { mk.className = "hl hl-" + c; }); hlWrite(hlRead().map((x) => (x.id === id ? Object.assign({}, x, { c }) : x))); }
    function applyColor(c) {
      if (!HC.includes(c)) return;
      let ok = true;
      if (hlId) hlRecolor(hlId, c); else ok = !!selRange && hlCreate(selRange, c);
      hide(); try { getSelection().removeAllRanges(); } catch (e) {}
      if (ok && !hlId) nudge("hl");
      toast(ok ? (hlId ? L("🖍️ تغيّر اللون", "🖍️ Colour changed") : L("🖍️ انظلّل، وتلگاه بـ «تظليلاتي»", "🖍️ Highlighted")) : L("ما گدرت أظلّل هنا.", "Couldn't highlight here."), ok && !/\/terms\/?$/.test(location.pathname) ? [L("افتحها", "Open"), base + "terms/#hlbox"] : null);
    }
    let hlDone = false;
    let hlRun = 0;
    function hlRestore() {
      const items = hlRead().filter((x) => x.p === REL), run = ++hlRun, cache = new Map();
      let k = 0;
      const step = () => {   // (18/11، المراجعة) بدفعات ~12ms حتى الصفحة الطويلة ما تتجمّد إذا الطالب عنده تظليلات كثيرة
        if (run !== hlRun) return;
        const t0 = performance.now();
        for (; k < items.length && performance.now() - t0 < 12; k++) {
          const it = items[k];
          if (document.querySelector(`mark.hl[data-hl="${it.id}"]`)) continue;
          try {
            let root = (it.sc && document.getElementById(it.sc)) || fallbackRoot(), r = locate(root, it, cache);
            if (!r && root !== fallbackRoot()) { root = fallbackRoot(); r = locate(root, it, cache); }   // الحاوية اختفت ← نبحث بالصفحة كلها
            if (r) wrapOffsets(root, r.s, r.e, it.c, it.id);
          } catch (e) {}
        }
        if (k < items.length) setTimeout(step, 0); else hlScroll();
      };
      step();
    }
    function hlScroll() {
      const h = /^#hl=([a-z0-9]{4,16})$/.exec(location.hash); if (!h || hlDone) return;
      const ms = marksOf(h[1]); if (!ms.length) return;
      hlDone = true; const mk = ms[0];
      for (let d = mk.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
      requestAnimationFrame(() => {
        mk.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        ms.forEach((x) => x.classList.add("flash")); setTimeout(() => ms.forEach((x) => x.classList.remove("flash")), 2200);
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      });
    }
    // ضغطة على تظليل موجود (بلا تحديد) ← قائمة الألوان + «شيل التظليل»
    document.addEventListener("click", (ev) => {
      if (m.contains(ev.target) || !(ev.target instanceof Element)) return;
      const mk = ev.target.closest("mark.hl"), sel = getSelection();
      if (!mk || (sel && !sel.isCollapsed) || ev.target.closest(".tm,a,button,input,label,summary")) return;
      const r = document.createRange(); r.selectNodeContents(mk);
      selRange = r; hlId = mk.dataset.hl; hlOnly = true; view = "color"; text = clean(mk.textContent) || "·"; nfo = info(text); lexKey = null;
      render(); place(r);
    });
    [0, 700].forEach((ms) => setTimeout(hlRestore, ms));
    if (document.readyState !== "complete") addEventListener("load", () => setTimeout(hlRestore, 300));
    document.addEventListener("listen:ready", hlRestore);
    new MutationObserver(() => hlRestore()).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    addEventListener("hashchange", () => { hlDone = false; hlRestore(); });
    window.Pick.HL = { read: hlRead, remove: hlRemove, REL };
    hlBox();

    // ── 🖍️ «تظليلاتي» بصفحة المصطلحات (جنب «⭐ مصطلحاتي») ──
    function hlBox() {
      const tt = document.getElementById("tt"); if (!tt) return;
      let flt = "all";
      const box = document.createElement("details"); box.id = "hlbox"; box.className = "minebox hlbox";
      const draw = () => {
        const EN = en(), all = hlRead().sort((a, b) => b.at - a.at), items = flt === "all" ? all : all.filter((x) => x.c === flt), open = box.open || location.hash === "#hlbox";
        const esc = (z) => String(z).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        let h = `<summary data-noen>🖍️ <b>${EN ? "My highlights" : "تظليلاتي"}</b> <small>${all.length}</small></summary>`;
        if (!all.length) h += `<p class="hint" data-noen>${EN ? "Select any important sentence and tap 🖍️" : "حدّد أي جملة مهمة واضغط 🖍️"}</p>`;
        else {
          h += `<p class="hint" data-noen>${EN ? "Stays on your device only." : "تبقى بجهازك بس، ولا تنرسل لأي مكان."}</p><div class="hf" data-noen role="group" aria-label="${EN ? "Filter by colour" : "فلتر حسب اللون"}"><button type="button" data-f="all" aria-pressed="${flt === "all"}">${EN ? "All" : "الكل"}</button>` +
            HC.map((c) => `<button type="button" data-f="${c}" aria-pressed="${flt === c}" aria-label="${HN(c)}" title="${HN(c)}"><span class="hld hl-${c}"></span></button>`).join("") + `</div>` +
            `<div class="mx" data-noen><button type="button" data-h="copy">📋 ${EN ? "Copy all" : "انسخ الكل"}</button><button type="button" data-h="dl">⬇️ ${EN ? "Download (.txt)" : "نزّلها (txt)"}</button></div>`;
          const groups = []; items.forEach((x) => { let g = groups.find((y) => y.p === x.p); if (!g) groups.push((g = { p: x.p, t: x.t, items: [] })); g.items.push(x); });
          h += groups.map((g) => `<h4><a href="${esc(base + g.p)}">${esc(g.t || g.p || "—")}</a></h4><ul>` + g.items.map((x) => `<li data-id="${x.id}"><span class="hld hl-${x.c}" aria-hidden="true"></span><a class="hlt" dir="auto" href="${esc(base + x.p)}#hl=${x.id}">${esc(x.ex.replace(/\s+/g, " ").slice(0, 220))}</a><span class="mb"><button type="button" data-h="del" aria-label="${EN ? "Remove highlight: " : "شيل التظليل: "}${esc(x.ex.replace(/\s+/g, " ").slice(0, 40))}">✕</button></span></li>`).join("") + "</ul>").join("");
          if (!items.length) h += `<p class="hint" data-noen>${EN ? "No highlights in this colour." : "ماكو تظليل بهاللون."}</p>`;
        }
        box.innerHTML = h; box.open = open;
      };
      const place2 = () => { const mine = document.getElementById("mine"), at = document.getElementById("review-box"); (mine ? mine : at || tt).insertAdjacentElement(mine || at ? "afterend" : "beforebegin", box); };
      place2(); draw();
      box.addEventListener("click", (ev) => {
        const f = ev.target.closest("button[data-f]"), b = ev.target.closest("button[data-h]");
        if (f) { ev.preventDefault(); flt = f.dataset.f; draw(); const nb = box.querySelector(`button[data-f="${flt}"]`); if (nb) nb.focus(); return; }
        if (!b) return; ev.preventDefault();
        if (b.dataset.h === "del") { const id = b.closest("li").dataset.id; hlWrite(hlRead().filter((x) => x.id !== id)); return; }
        const out = hlListText(hlRead().sort((a, z) => z.at - a.at).filter((x) => flt === "all" || x.c === flt), en(), (c) => HN(c));
        outFile(b.dataset.h, b, out);
      });
      document.addEventListener("hl:changed", draw); document.addEventListener("sync:applied", draw);   // (مراجع مستقل) التظليلات اللي تجي من الحساب تطلع بالقائمة document.addEventListener("pick:saved", place2); document.addEventListener("listen:ready", place2);
      addEventListener("storage", (e) => { if (e.key === HK) draw(); });
      new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
      if (location.hash === "#hlbox") requestAnimationFrame(() => box.scrollIntoView({ block: "start" }));
    }
    function outFile(how, btn, out) {
      const EN = en();
      const flash = (ok) => { if (!btn || !ok) return; const old = btn.textContent; btn.textContent = how === "dl" ? (EN ? "✅ Downloaded" : "✅ تنزّلت") : (EN ? "✅ Copied" : "✅ انسخت"); setTimeout(() => { if (btn.isConnected) btn.textContent = old; }, 1800); };
      const say = (ok) => { flash(ok); toast(ok ? (how === "dl" ? (EN ? "⬇️ Downloaded: " : "⬇️ تنزّلت: ") + out.name : (EN ? "📋 Copied " : "📋 انسخت ") + out.n) : (EN ? "Couldn't do it here. Try another browser." : "ما گدرت هنا. جرّب متصفح ثاني.")); };
      if (how === "dl") {
        try { const url = URL.createObjectURL(new Blob(["﻿" + out.text], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = out.name; a.hidden = true; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); say(true); } catch (e) { say(false); }
        return;
      }
      const legacy = () => { try { const ta = document.createElement("textarea"); ta.value = out.text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if (btn) btn.focus(); return ok; } catch (e) { return false; } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.text).then(() => say(true), () => say(legacy())); else say(legacy());
    }

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
      u.rate = rate < 0.7 ? 0.55 : rate < 1 ? 0.7 : 0.95;
      u.onend = clr;
      u.onerror = (e) => { clr(); if (e && e.error !== "interrupted" && e.error !== "canceled") toast(L("ما گدرت أشغّل الصوت. جرّب مرة ثانية.", "Couldn't play the sound. Try again.")); };
      try { SS.speak(u); } catch (e) { clr(); }
    }
    // listen.js يشغّل شي ← صوت المتصفح يوقف (صوت واحد بنفس الوقت)
    document.addEventListener("listen:play", () => { if (SS) try { SS.cancel(); } catch (e) {} clr(); });
    document.addEventListener("listen:fail", () => { clr(); toast(L("ما گدرت أشغّل الصوت. تأكد من النت وجرّب مرة ثانية.", "Couldn't play the sound. Check your connection and try again.")); });   // (18/11) ملفنا ما نزل ← الزر ما يبقى مضوّي

    // ── الحفظ ──
    function toggleSave() {
      const k = saveKey(), st = LS.get(), was = !!(st[k] && st[k].mine);
      LS.set(was ? unsave(st, k) : save(st, k));
      document.dispatchEvent(new CustomEvent("pick:saved", { detail: { key: k, saved: !was } }));
      render();
      const onTerms = /\/terms\/?$/.test(location.pathname);
      if (!was) nudge("save");
      toast(was ? L("انشال من مصطلحاتي", "Removed from my terms") : L("⭐ انحفظ بمصطلحاتي، ويطلعلك بـ «راجع اليوم»", "⭐ Saved to my terms"), was || onTerms ? null : [L("افتحها", "Open"), base + "terms/#mine"]);
    }
    // 🔒 (19/11، طلب محمد) الميزات الخاصة بالطالب (🖍️ ظلّل، ⭐ احفظ بمصطلحاتي): زائر ما مسجّل دخول ← بعد ما يستعملها (الشي ينحفظ بجهازه أول، ما يضيع)
    //   بطاقة هادئة «سجّل دخولك حتى تصير خاصة بيك» ← نافذة الدخول بالاسم الثلاثي والرقم السري (staffdoor.js) على نفس الصفحة، وبعدها ترجع لنفس المكان.
    //   مو نافذة تسد الصفحة: أول مرة، وبعدها كل 7 أيام، 3 مرات بالأكثر. «مو هسه» يكمّل بالجهاز بس. ماكو شي بوضع الاختبارات (AM_TEST) إلا إذا am_test_nudge=1.
    const NK = "t:nudge-login", ng = document.createElement("div");
    ng.className = "pkng"; ng.hidden = true; ng.setAttribute("role", "region"); ng.setAttribute("aria-labelledby", "pkng-t"); ng.setAttribute("aria-live", "polite");
    const loggedIn = () => { const D = window.StaffDoor; try { return !!(D && (D.studentSession() || D.staffSession())); } catch (e) { return false; } };
    function nudge(kind) {
      try {
        const D = window.StaffDoor;   // (مراجع مستقل) الدخول بالاسم الثلاثي + الرقم السري لازم مفعّل (settings.student_pin.on)، وإلا ما نوعد بيه
        if (loggedIn() || !D || typeof D.askLogin !== "function" || typeof D.pinOn !== "function" || !D.pinOn() || !(window.STUDY_CLOUD && window.STUDY_CLOUD.url) || document.querySelector(".sd-dlg")) return;
        if (window.AM_TEST && localStorage.getItem("am_test_nudge") !== "1") return;
        if (kind === "hl" && window.STUDY_CLOUD.hl !== true) return;   // التظليلات تنحفظ بالحساب بس بعد هجرة 079 (STUDY_CLOUD.hl) — قبلها ما نوعد بشي ما يصير
        const st = JSON.parse(localStorage.getItem(NK) || "{}") || {}, n = Number(st.n) || 0;
        if (st.off || n >= 3 || (st.at && Date.now() - Number(st.at) < 7 * 864e5)) return;
      } catch (e) { return; }
      // (مراجع مستقل) تطلع بعد ما تختفي رسالة «انظلّل/انحفظ + افتحها» حتى ما تغطيها، وبس إذا ماكو قائمة أو نافذة مفتوحة وقتها
      clearTimeout(ngT); ngT = setTimeout(() => show(kind, 0), 3700);
    }
    let ngT = 0;
    function show(kind, tries) {
      try {
        if (loggedIn() || document.querySelector(".sd-dlg")) return;
        if (!m.hidden || document.querySelector(".sd-dlg")) { if (tries < 60) ngT = setTimeout(() => show(kind, tries + 1), 1000); return; }   // القائمة مفتوحة (مثلاً بعد ⭐ احفظ) ← ننتظر تنسد
        const st = JSON.parse(localStorage.getItem(NK) || "{}") || {}, n = Number(st.n) || 0;
        if (st.off || n >= 3 || (st.at && Date.now() - Number(st.at) < 7 * 864e5)) return;
        localStorage.setItem(NK, JSON.stringify({ n: n + 1, at: Date.now() }));
      } catch (e) { return; }
      const what = kind === "hl" ? L("تظليلاتك", "your highlights") : L("مصطلحاتك", "your saved terms");
      ng.innerHTML = `<b id="pkng-t">${L("🔒 خلّي ", "🔒 Keep ")}${what}${L(" خاصة بيك", " yours")}</b><p>${L("سجّل دخولك باسمك الثلاثي ورقمك السري، وتنحفظ بحسابك وتلگاها بأي جهاز. هسه محفوظة بهالجهاز بس.", "Sign in with your full name and PIN to keep them in your account on any device. For now they're on this device only.")}</p><div><button type="button" data-ng="go">${L("سجّل دخولك", "Sign in")}</button><button type="button" class="gh" data-ng="no">${L("مو هسه", "Not now")}</button></div>`;
      if (!ng.isConnected) document.body.appendChild(ng);
      ng.hidden = false;
    }
    ng.addEventListener("click", (ev) => {
      const b = ev.target.closest && ev.target.closest("[data-ng]"); if (!b) return;
      ng.hidden = true;
      if (b.dataset.ng === "go") try { window.StaffDoor.askLogin(location.href.split("#")[0]); } catch (e) {}
    });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !ng.hidden) ng.hidden = true; });
    // 🔄 (19/11) التظليلات تجي من الحساب (sync.js) ← الصفحة تتحدّث: اللي انشال يرجع نص عادي، واللون اللي تغيّر يتبدّل، والجديد يتظلّل
    document.addEventListener("sync:applied", (ev) => {
      const k = (ev.detail && ev.detail.kinds) || []; if (!k.includes("hl") && !k.includes("all")) return;
      try {
        const have = new Map(hlRead().map((x) => [x.id, x]));
        document.querySelectorAll("mark.hl[data-hl]").forEach((mk) => {
          const it = have.get(mk.dataset.hl);
          if (!it || it.p !== REL) { const par = mk.parentNode; while (mk.firstChild) par.insertBefore(mk.firstChild, mk); par.removeChild(mk); par.normalize(); }
          else if (!mk.classList.contains("hl-" + it.c)) mk.className = "hl hl-" + it.c;
        });
        hlRestore();
      } catch (e) {}
    });
    function toast(msg, link) {
      if (!t.isConnected) document.body.appendChild(t);
      t.textContent = msg;
      if (link) { const a = document.createElement("a"); a.href = link[1]; a.textContent = link[0]; t.appendChild(a); }
      t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3500);
    }
    window.Pick.say = (tx, rate, btn) => { text = ""; lexKey = window.Listen && Listen.match ? Listen.match(tx) : null; if (lexKey) text = tx; say(tx, rate || 1, btn); };
    window.Pick.toast = toast;
  }
  // 📋 (18/11) نص «مصطلحاتي» للنسخ أو التنزيل: سطر لكل مصطلح «المصطلح — المعنى» (المعنى إذا بالقاموس)
  function listText(keys, meaning, en, now = Date.now()) {
    const d = new Date(now), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const ks = (keys || []).filter((k) => typeof k === "string" && k && !BADK.test(k));
    const bidi = (s) => s.replace(/[‪-‮⁦-⁩]/g, "");   // محارف اتجاه مخفية ما تقلب ترتيب السطر بالملف
    const lines = ks.map((k) => { const m = meaning ? bidi(String(meaning(k) || "")).replace(/\s+/g, " ").trim() : ""; return m ? `${bidi(k)} — ${m}` : bidi(k); });
    return { name: (en ? "my-terms-" : "مصطلحاتي-") + day + ".txt", text: `${en ? "⭐ My terms" : "⭐ مصطلحاتي"} (${ks.length}) · ${day}\n\n${lines.join("\n")}\n` };
  }
  // 📋 نص «تظليلاتي»: مجمّع حسب الصفحة، سطر لكل تظليل «• النص»
  function hlListText(items, en, cname, now = Date.now()) {
    const d = new Date(now), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const bidi = (s) => String(s || "").replace(/[‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim();
    const g = [], seen = {};
    (items || []).forEach((x) => { if (!x || !x.ex) return; const k = x.p; if (!(k in seen)) { seen[k] = { t: bidi(x.t) || k, l: [] }; g.push(seen[k]); } seen[k].l.push(`• ${bidi(x.ex)}${cname ? ` (${cname(x.c)})` : ""}`); });
    const n = g.reduce((a, z) => a + z.l.length, 0);
    return { n, name: (en ? "my-highlights-" : "تظليلاتي-") + day + ".txt", text: `${en ? "🖍️ My highlights" : "🖍️ تظليلاتي"} (${n}) · ${day}\n\n${g.map((z) => `# ${z.t}\n${z.l.join("\n")}`).join("\n\n")}\n` };
  }
  return { clean, info, save, unsave, mine, today, boot, listText, hlListText, SKEY };
});
