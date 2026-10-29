// 🌿 الهوية الهادئة (معاينة 29/10/2026): تكبير/تصغير الخط (يتذكّر)، «↩️ كمّل من وين وقفت»، التقدّم من الاختبارات،
// تبويبات المادة [نظري | عملي] وتبويبات المحاضرة [اقرأ | اسمع | اختبر نفسك | المصطلحات | الملف]، وشريط تقدّم القراءة.
// كلشي بجهاز الطالب بس (localStorage بأسماء t:…)، وما ينرسل شي.
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("t:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("t:" + k, JSON.stringify(v)); } catch (e) {} },
  };
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── 🌙 الوضع الليلي: اختياري بزر، ويتذكّر (الافتراضي فاتح) ──
  // 30/10: لون شريط المتصفح (theme-color) يتبع الوضع الفعلي للصفحة (فاتح افتراضياً، داكن بـ 🌙) — مو وضع الجهاز
  const themeColor = (t) => {
    const ms = [...document.querySelectorAll('meta[name="theme-color"]')];
    const m = ms[0] || document.head.appendChild(Object.assign(document.createElement("meta"), { name: "theme-color" }));
    ms.slice(1).forEach((x) => x.remove()); m.removeAttribute("media");
    m.setAttribute("content", t === "dark" ? "#12151C" : "#4B5A8A");
  };
  const setTheme = (t) => { if (t === "dark") document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme; themeColor(t); };
  setTheme(LS.get("theme", "light"));
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest("[data-theme-toggle]")) return;
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; LS.set("theme", t); setTheme(t);
  });

  // ── 🎓 أقسام الطلاب (بالمعاينة: زر «زائر / طالب» للعرض؛ بالموقع الحقيقي الدور من الجلسة) ──
  // 🌿 v3 حي (29/10): برا /preview/ الدور من جلسة الطالب الحقيقية (t:acct-session) أو «👁️ شوف كطالب»، والبوابة من settings.gate
  // (staffdoor.js هو اللي يقفل فعلاً لما تنفتح). البوابة مطفية ← ولا قفل ولا نافذة كود.
  const LIVE = !/\/preview\//.test(location.pathname);
  if (LIVE) document.documentElement.dataset.live = "1";
  const alive = (x) => !!(x && x.user && (x.refresh_token || (x.expires_at && x.expires_at * 1000 > Date.now())));
  const sess = (() => { try { const x = JSON.parse(localStorage.getItem("t:acct-session") || "null"); return alive(x) && ((x.user.app_metadata || {}).role === "student") ? x : null; } catch (e) { return null; } })();
  const liveRole = () => { try { if (sess || localStorage.getItem("t:staff-view") === "1") return "student"; } catch (e) {} return "visitor"; };
  const role = LIVE ? liveRole() : LS.get("pv-role", "visitor"); document.body.dataset.role = role;
  $$("[data-name-only]").forEach((el) => { el.hidden = role !== "student"; });
  $$("[data-visitor-only]").forEach((el) => { el.hidden = role === "student"; });
  if (LIVE && sess) {   // «أهلاً، <الاسم>» من الجلسة إذا موجود (وإلا «أهلاً 👋» بس)
    const md = sess.user.user_metadata || {}, nm = String(md.full_name || md.name || "").trim().split(/\s+/)[0];
    if (nm) $$("[data-hello]").forEach((el) => { el.textContent = `أهلاً، ${nm} 👋`; });
  }
  // 🔗 رابط الدخول المباشر من لوحة الطلاب (…/?code=RAD-…) ← شاشة الدخول بنفس الكود
  try {
    const qc = new URLSearchParams(location.search).get("code"), man0 = document.querySelector('link[rel="manifest"]');
    if (LIVE && qc && man0 && !/\/login\/(index\.html)?$/.test(location.pathname) && !/\/admin\//.test(location.pathname)) {
      location.replace(new URL("login/?code=" + encodeURIComponent(qc), new URL(".", man0.href)).href); return;
    }
  } catch (e) {}
  let gateOn = LIVE && document.documentElement.dataset.gate === "on";
  const applyGate = () => {
    $$("[data-gate-href]").forEach((a) => {   // «📚 ادخل لمحاضراتك»: البوابة مطفية ← المحاضرات مباشرة؛ مفتوحة والزائر بلا كود ← الدخول بالكود
      if (!a.dataset.offHref) a.dataset.offHref = a.getAttribute("href");
      a.setAttribute("href", gateOn && role !== "student" ? a.dataset.gateHref : a.dataset.offHref);
    });
  };
  applyGate();
  if (LIVE && window.Net && window.Net.on && window.Net.settings) Promise.resolve(window.Net.settings()).then((S) => {
    gateOn = !!(S && S.gate && S.gate.on);
    if (gateOn) document.documentElement.dataset.gate = "on"; else delete document.documentElement.dataset.gate;
    applyGate();
  }).catch(() => {});
  if (!LIVE) document.addEventListener("click", (ev) => {
    const r = ev.target.closest("[data-role-set]"); if (r) { LS.set("pv-role", r.dataset.roleSet); location.reload(); return; }
    const l = ev.target.closest("[data-locked]");
    if (!l || document.body.dataset.role === "student") return;
    ev.preventDefault();
    const dlg = $("#gatedlg"); if (!dlg) return;
    $("#gatego", dlg).href = $("#gatego", dlg).dataset.base + "?next=" + encodeURIComponent(new URL(l.getAttribute("href") || "", location.href).pathname);
    dlg.hidden = false; $("#gatego", dlg).focus();
  });
  // صفحة لطلابنا انفتحت مباشرة بدون كود ← نفس النافذة، و«تمام» يرجّعه للرئيسية (المعاينة بس؛ بالحي staffdoor.js)
  if (!LIVE && document.body.dataset.gated && role !== "student" && $("#gatedlg")) {
    const dlg = $("#gatedlg"), go = $("#gatego", dlg);
    go.href = go.dataset.base + "?next=" + encodeURIComponent(location.pathname);
    const cl = $("[data-close]", dlg); cl.textContent = "‹ رجوع للرئيسية";
    cl.addEventListener("click", () => { location.href = go.dataset.base.replace(/login\/$/, "home/"); });
    dlg.hidden = false;
  }
  document.addEventListener("click", (ev) => { const d = ev.target.closest("#gatedlg"); if (d && (ev.target === d || ev.target.closest("[data-close]"))) d.hidden = true; });
  // 📱 كيبورد: Esc = نفس «تمام»، Tab يدور داخل النافذة بس، والتركيز يرجع للزر اللي فتحها
  let gateFrom = null;
  document.addEventListener("focusin", (ev) => { const d = $("#gatedlg"); if (d && d.hidden && !d.contains(ev.target)) gateFrom = ev.target; });
  document.addEventListener("keydown", (ev) => {
    const tr = $(".gatedlg.tour");   // جولة «مساحتي»: Esc يسدها حتى لو التركيز طلع منها بالماوس
    if (ev.key === "Escape" && tr && !tr.contains(ev.target)) { const k = $("[data-skip]", tr); if (k) k.click(); return; }
    const d = $("#gatedlg"); if (!d || d.hidden) return;
    if (ev.key === "Escape") { ev.preventDefault(); const c = $("[data-close]", d); if (document.body.dataset.gated && document.body.dataset.role !== "student") c.click(); else { d.hidden = true; if (gateFrom && gateFrom.focus) gateFrom.focus(); } return; }
    if (ev.key === "Tab") {
      const f = $$("a[href],button", d); if (!f.length) return;
      const i = f.indexOf(document.activeElement); ev.preventDefault();
      f[i < 0 ? 0 : (i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  new MutationObserver(() => { const d = $("#gatedlg"); if (d && !d.hidden && !d.contains(document.activeElement)) $("#gatego", d).focus(); })
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
  if ($("#gatedlg") && !$("#gatedlg").hidden) $("#gatego").focus();

  // ── حجم الخط: 4 درجات، يتذكّر اختيار الطالب ──
  const SIZES = [0.92, 1, 1.1, 1.22];
  let fs = LS.get("fs", 1);
  const applyFs = () => document.documentElement.style.setProperty("--fs", SIZES[fs] || 1);
  applyFs();
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-fs]"); if (!b) return;
    fs = Math.max(0, Math.min(SIZES.length - 1, fs + +b.dataset.fs)); LS.set("fs", fs); applyFs();
  });

  // ── التقدّم: نسبة محاضرات المادة اللي اختبرها (من t:progress اللي يكتبها tools.js) ──
  const prog = LS.get("progress", {});
  $$("[data-quiz]").forEach((el) => { if (prog[el.dataset.quiz]) el.classList.add("is-done"); });
  $$("[data-quizzes]").forEach((el) => {
    const qs = JSON.parse(el.dataset.quizzes), done = qs.filter((q) => prog[q]).length;
    const pct = qs.length ? Math.round((done / qs.length) * 100) : 0;
    const bar = $(".pbar i", el), lab = $(".pct", el);
    if (bar) bar.style.width = pct + "%";
    if (lab) lab.textContent = done ? `${pct}% · اختبرت ${done} من ${qs.length}` : `${qs.length} محاضرة`;
  });
  $$(".lcard[data-quiz]").forEach((el) => {
    const p = prog[el.dataset.quiz], d = $(".done", el);
    if (p && d) { d.hidden = false; d.textContent = `✓ اختبرتها · ${p.best}%`; }
  });

  // ── ↩️ كمّل من وين وقفت (v3b: نفس البطاقة بالرئيسية وصفحة المحاضرات + شريط تقدّم «القسم n من N») ──
  const page = document.body.dataset.lecture && JSON.parse(document.body.dataset.lecture);
  const secmap = LS.get("pv-secs", {});
  if (page) {
    const prevSec = (secmap[page.url] || 0);
    LS.set("last", Object.assign(page, { t: Date.now(), tab: (location.hash || "#read").slice(1), sec: prevSec }));
    LS.set("lastlec", LS.get("last", null));   // نسخة ثابتة: tools.js يكتب t:last بصفحات الاختبار (بلا عنوان المادة)
  }
  const man = document.querySelector('link[rel="manifest"]'), base = man ? new URL(".", man.href).href : document.baseURI;
  const resumeHTML = (x, sample) => {
    const pct = x.secs ? Math.max(4, Math.round(((x.sec || 0) / x.secs) * 100)) : 0;
    const tab = { read: "اقرأ", listen: "اسمع", quiz: "اختبر نفسك", terms: "المصطلحات", file: "الملف" }[x.tab] || "";
    return `<span class="rt"><small>كمّل من وين وقفت${sample ? ' <span class="pvtag">مثال</span>' : ""}</small><b>${esc(x.title)}</b><small>${esc(x.sub)}${tab ? " · " + tab : ""}</small>` +
      (x.secs ? `<span class="pbar" role="progressbar" aria-label="تقدّمك بالمحاضرة" aria-valuemin="0" aria-valuemax="${x.secs}" aria-valuenow="${x.sec || 0}"><i style="width:${pct}%"></i></span>` +
        `<small class="pn">القسم ${x.sec || 1} من ${x.secs}</small>` : "") + `</span><span class="go">كمّل ‹</span>`;
  };
  const okLast = (v) => v && v.url && /^(preview\/)?learn\/[^/]+\/(theory|practical)\/\d+\/$/.test(v.url) && v.title && v.sub;
  let last = LS.get("last", null);
  if (LIVE) { const ll = LS.get("lastlec", null); if (!okLast(last) && okLast(ll)) last = ll; if (okLast(last)) last = Object.assign({}, last, { url: last.url.replace(/^preview\//, "") }); }
  const res = $("#resume");
  if (res && (role === "student" || LIVE)) {   // بالحي: أي أحد عنده آخر محاضرة بجهازه (بلا «مثال»)
    const ok = okLast(last);
    let x = ok ? Object.assign({}, last, { sec: secmap[last.url] || secmap["preview/" + last.url] || last.sec || 0 }) : null, sample = false;
    if (!x && res.dataset.sample && !LIVE) { try { x = JSON.parse(res.dataset.sample); sample = true; } catch (e) {} }
    if (x) { res.href = new URL(x.url + (x.tab && x.tab !== "read" ? "#" + x.tab : ""), base).href; res.innerHTML = resumeHTML(x, sample); res.hidden = false; }
  }
  // صفحة المحاضرة: أبعد قسم وصله (قراءة أو استماع) ← «القسم n من N»
  if (page && page.secs) {
    const mark = (n) => { if (n > (secmap[page.url] || 0)) { secmap[page.url] = n; LS.set("pv-secs", secmap); const l = LS.get("last", {}); if (l.url === page.url) { l.sec = n; LS.set("last", l); } } };
    const secs = $$(".read section[data-sec]");
    if ("IntersectionObserver" in window && secs.length) {
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) mark(secs.indexOf(en.target) + 1); }), { rootMargin: "0px 0px -60% 0px" });
      secs.forEach((x) => io.observe(x));
    }
    $$(".lsec").forEach((d, i) => d.addEventListener("toggle", () => { if (d.open) mark(i + 1); }));
  }

  // ── التبويبات ──
  function tabs(box, key, def) {
    const btns = $$("[role=tab]", box), panels = btns.map((b) => document.getElementById(b.getAttribute("aria-controls")));
    const show = (id, push) => {
      btns.forEach((b, i) => { const on = b.dataset.tab === id; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; panels[i].hidden = !on; });
      if (key) LS.set(key, id);
      if (push) history.replaceState(null, "", "#" + id);
      if (page) LS.set("last", Object.assign(LS.get("last", {}), { tab: id }));
    };
    box.addEventListener("click", (ev) => { const b = ev.target.closest("[role=tab]"); if (b) show(b.dataset.tab, !key); });
    box.addEventListener("keydown", (ev) => {   // الأسهم بين التبويبات (RTL: اليمين = السابق)
      const i = btns.indexOf(document.activeElement); if (i < 0) return;
      const vert = getComputedStyle(box).flexDirection === "column";   // 🖥️ عمود جانبي: الأسهم فوق/جوّه
      const d = ev.key === "ArrowLeft" || (vert && ev.key === "ArrowDown") ? 1 : ev.key === "ArrowRight" || (vert && ev.key === "ArrowUp") ? -1 : 0;
      const n = ev.key === "Home" ? btns[0] : ev.key === "End" ? btns[btns.length - 1] : d ? btns[(i + d + btns.length) % btns.length] : null;
      if (!n) return; n.focus(); n.click(); ev.preventDefault();
    });
    return show;
  }
  // المادة: [نظري | عملي] — يتذكّر آخر اختيار
  // v3: الرابط يگدر يختار التبويب (#xray، #ct …) — «‹ الأطلس» من صفحة منطقة يرجّعه لنفس الجهاز
  const st = $("#stabs");
  if (st) {
    const show = tabs(st, "stab:" + st.dataset.subject), hk = decodeURIComponent(location.hash.slice(1)), k = LS.get("stab:" + st.dataset.subject, null);
    show($(`[data-tab="${hk}"]`, st) ? hk : k && $(`[data-tab="${k}"]`, st) ? k : st.dataset.def);
    addEventListener("hashchange", () => { const x = location.hash.slice(1); if ($(`[data-tab="${x}"]`, st)) { show(x); const av = $("#aview"); if (av) av.querySelector('[data-av="body"]').click(); } });
  }
  // v3: الأطلس [🦴 حسب الجسم | 🩺 حسب العَرَض] بنفس الصفحة (بدون تنقّل)؛ #sx يفتح «حسب العَرَض»
  const av = $("#aview");
  if (av) {
    const btns = $$("[data-av]", av);
    const pick = (v, push) => {
      btns.forEach((b) => { const on = b.dataset.av === v; b.setAttribute("aria-selected", on); document.getElementById(b.getAttribute("aria-controls")).hidden = !on; });
      if (push) history.replaceState(null, "", v === "sx" ? "#sx" : location.pathname + location.search);
    };
    av.addEventListener("click", (ev) => { const b = ev.target.closest("[data-av]"); if (b) pick(b.dataset.av, true); });
    pick(location.hash === "#sx" ? "sx" : "body");
    // 30/10: «حسب العَرَض» يتذكّر الجهاز والعَرَض المفتوحين (sessionStorage) ← الرجوع من الحالة يلگاهن مثل ما چانن
    const sxp = $("#av-sx");
    if (sxp) {
      const ds = $$("details", sxp), K = "t:atlas-sx";
      try { JSON.parse(sessionStorage.getItem(K) || "[]").forEach((i) => { if (ds[i]) ds[i].open = true; }); } catch (e) {}
      sxp.addEventListener("toggle", () => { try { sessionStorage.setItem(K, JSON.stringify(ds.map((d, i) => (d.open ? i : -1)).filter((i) => i >= 0))); } catch (e) {} }, true);
    }
  }
  // المحاضرة: التبويب من الرابط (#read #listen #quiz #terms #file)، والروابط القديمة (#listen و#s3 من الـ PDF) تفتح «اسمع» على نفس القسم
  const lt = $("#ltabs");
  if (lt) {
    const show = tabs(lt, null);
    const h = decodeURIComponent(location.hash.slice(1));
    const ids = $$("[role=tab]", lt).map((b) => b.dataset.tab);
    if (ids.includes(h)) show(h);
    else if (h && document.getElementById(h) && document.getElementById(h).closest("#p-listen")) {
      show("listen"); const d = document.getElementById(h); if (d.tagName === "DETAILS") d.open = true; setTimeout(() => d.scrollIntoView({ block: "start" }), 50);
    } else show(ids.includes("read") ? "read" : ids[0]);
    window.addEventListener("hashchange", () => { const x = location.hash.slice(1); if (ids.includes(x)) show(x); });
  }
  // [النص | السلايدات] داخل «اقرأ»
  $$(".seg").forEach((seg) => seg.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-v]"); if (!b) return;
    $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", x === b));
    $$("[data-view]", seg.closest(".tpanel") || seg.parentElement).forEach((v) => { v.hidden = v.dataset.view !== b.dataset.v; });
    LS.set("readv", b.dataset.v);
  }));
  const rv = LS.get("readv", "text"); if (rv !== "text") $$(`.seg button[data-v="${rv}"]`).forEach((b) => b.click());   // ⚡ «النص» هو الافتراضي بالـ HTML

  // ── شريط تقدّم القراءة (خفيف) ──
  const bar = $(".rprog i");
  if (bar) {
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? Math.min(100, (scrollY / h) * 100) : 0) + "%"; };
    addEventListener("scroll", upd, { passive: true }); requestAnimationFrame(() => setTimeout(upd, 0));   // ⚡ بلا تخطيط إجباري وقت التحميل
  }

  // ═════ 📱 الأجهزة (29/10): كيبورد ولمس ═════
  // تخطَّ للمحتوى (أول Tab) — يفيد بالمحاضرة اللي بيها مئات المصطلحات المنقّطة
  const h1 = $("h1");
  if (h1 && !$(".skip")) {
    h1.id = h1.id || "main"; h1.tabIndex = -1;
    document.body.insertAdjacentHTML("afterbegin", `<a class="skip" href="#${h1.id}">تخطَّ للمحتوى</a>`);
  }
  // المصطلح المنقّط: أول مرة بس ينوصل له بـ Tab (الباقي بالماوس/اللمس) حتى الكيبورد ما يمر على 400 كلمة
  let dq = 0;
  const dedupe = () => {   // ⚡ (v3 حي) دفعات وقت الفراغ
    dq = 0; const seen = new Set(), all = $$(".tm[data-k]"); let i = 0;
    const step = () => { const t0 = performance.now(); for (; i < all.length && performance.now() - t0 < 12; i++) { const t = all[i], k = t.dataset.k, ti = t.getAttribute("tabindex");
      if (seen.has(k)) { if (ti !== "-1") t.setAttribute("tabindex", "-1"); } else { seen.add(k); if (ti !== "0") t.setAttribute("tabindex", "0"); } }
      if (i < all.length) (window.requestIdleCallback ? requestIdleCallback(step, { timeout: 1200 }) : setTimeout(step, 30)); };
    step();
  };
  // ⚡ (v3 حي) dedupe ينادى من آخر tidyTerms (مراقب واحد مجدول وقت الفراغ بدل مراقبين بكل إضافة)
  // صور الحالات: تنفتح بالكيبورد (Enter/مسافة)، والتركيز يروح لزر الإغلاق ويرجع للصورة
  let lbFrom = null;
  $$(".case .xi").forEach((x) => {
    x.tabIndex = 0; x.setAttribute("role", "button");
    const img = $("img", x); x.setAttribute("aria-label", "كبّر الصورة" + (img && img.alt ? ": " + img.alt : ""));
    const w = img && +img.getAttribute("width"), h = img && +img.getAttribute("height");
    if (w && h) { x.style.maxWidth = `min(100%, calc(${innerWidth < 640 ? 60 : 68}vh * ${(w / h).toFixed(4)}))`; x.style.marginInline = "auto"; }   // الصورة كلها بالشاشة
  });
  document.addEventListener("keydown", (ev) => {
    const x = ev.target.closest && ev.target.closest(".case .xi");
    if (x && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); lbFrom = x; x.click(); }
  });
  document.addEventListener("click", (ev) => { const x = ev.target.closest && ev.target.closest(".case .xi"); if (x) lbFrom = x; }, true);
  new MutationObserver((ms) => ms.forEach((m) => {
    m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains("lb")) { n.setAttribute("role", "dialog"); n.setAttribute("aria-modal", "true"); const c = $(".x", n); if (c) c.focus(); } });
    m.removedNodes.forEach((n) => { if (n.classList && n.classList.contains("lb") && lbFrom) { lbFrom.focus(); } });
  })).observe(document.body, { childList: true });
  // 🤖 العائم: يتنحّى وقت النزول بالقراءة ويرجع وقت الصعود/آخر الصفحة، ويختفي وقت الكتابة (كيبورد الموبايل)
  const fab = $(".fab");
  if (fab) {
    let y0 = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY, end = y + innerHeight >= document.documentElement.scrollHeight - 120;
      if (Math.abs(y - y0) < 8) return;
      fab.classList.toggle("tuck", y > y0 && y > 160 && !end); y0 = y;
    }, { passive: true });
    document.addEventListener("focusin", (ev) => { if (ev.target.matches("input,textarea,select,[contenteditable]")) fab.classList.add("tuck"); });
    document.addEventListener("focusout", (ev) => { if (ev.target.matches("input,textarea,select,[contenteditable]")) fab.classList.remove("tuck"); });
    fab.addEventListener("focus", () => fab.classList.remove("tuck"));
  }

  // ═════ v3b (مراجعتين مستقلتين 29/10) ═════
  // 📨 «اطلب كودك»: يفتح شرح «قريباً» (زر البوت مطفي لحد «فعّل طلب الأكواد»)
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-reqcode]"); if (!b) return;
    const n = b.parentElement.querySelector("[data-reqnote]"); if (!n) return;
    n.hidden = !n.hidden; b.setAttribute("aria-expanded", !n.hidden);
  });

  // 🔗 روابط تكتبها سكربتات الموقع (البحث، المساعد، أدوات الطالب) للصفحات الحية ← نسخة المعاينة (preview/map.json)
  const PRE = LIVE ? base : new URL("preview/", base).href;
  let MAPJ = null;
  const remapHref = (a) => {
    if (!MAPJ || !a.href || a.dataset.pvmap) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !u.href.startsWith(base) || (!LIVE && u.href.startsWith(PRE))) return;
    let rel = u.pathname.slice(new URL(base).pathname.length).replace(/index\.html$/, "");
    const to = MAPJ[rel];
    if (to == null) return;
    const [p, h] = to.split("#");
    a.href = new URL(p, base).href + u.search + (u.hash || (h ? "#" + h : ""));
    a.dataset.pvmap = "1";
  };
  const remapAll = (root) => $$("a[href]", root).forEach(remapHref);
  fetch(LIVE ? new URL("assets/v3-map.json", base) : new URL("map.json", PRE)).then((r) => (r.ok ? r.json() : null)).then((j) => { MAPJ = j; remapAll(document); }).catch(() => {});
  document.addEventListener("click", (ev) => { const a = ev.target.closest && ev.target.closest("a[href]"); if (a) remapHref(a); }, true);

  // 🔎 نتائج البحث: الحالة و«أعراض الحالة» نفس الرابط ← نتيجة وحدة
  const sr = $("#sr");
  if (sr) new MutationObserver(() => {
    const seen = new Set(); let n = 0;
    $$("a.sres", sr).forEach((a) => { const k = a.getAttribute("href"); if (seen.has(k)) a.remove(); else { seen.add(k); n++; } });
    const sn = $("#sn"); if (sn && /^\d+ نتيجة/.test(sn.textContent) && sn.textContent !== `${n} نتيجة`) sn.textContent = `${n} نتيجة`;
    remapAll(sr);
  }).observe(sr, { childList: true });

  // 🔤 التنقيط: لا تنقيط داخل العناوين (اسم الحالة، عناوين الأقسام)، والمصطلح يتنقّط أول مرة بكل قسم بس
  const HEAD = "h1,h2,h3,summary,.cmpt,.gh,.h1en";
  const unmark = (t) => { const s = document.createElement("span"); s.className = "noterm"; s.textContent = t.textContent; t.replaceWith(s); };
  let tq = 0;
  const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 30));
  const tidyTerms = () => {
    tq = 0;
    // ⚡ (v3 حي) نجمع شنو ينشال أول (قراءة بس)، وبعدين نشيله دفعات صغيرة وقت الفراغ (كانت مهمتين طويلة ~150ms بالمحاضرات الطويلة على الموبايل)
    const ops = [];
    $$(HEAD.split(",").map((h) => h + " .tm[data-k]").join(",")).forEach((t) => { if (!t.classList.contains("demo") && !t.closest(".tod")) ops.push(t); });
    $$(".read section, .lsec, article.case, .step, .rich, .term, .q").forEach((box) => {
      const seen = new Set();
      $$(".tm[data-k]", box).forEach((t) => { if (seen.has(t.dataset.k)) ops.push(t); else seen.add(t.dataset.k); });
    });
    const step = () => { const t0 = performance.now(); while (ops.length && performance.now() - t0 < 12) { const t = ops.pop(); if (t.isConnected && t.classList.contains("tm")) unmark(t); } if (ops.length) idle(step); else idle(dedupe); };
    idle(step);
  };
  new MutationObserver((ms) => { if (!tq && ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1))) tq = setTimeout(() => idle(tidyTerms), 250); })
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener("listen:ready", () => setTimeout(tidyTerms, 600));

  // 🔠 الإنكليزي بالعناوين: lang="en" حتى يتقطّع صح (hyphens) بدل ما ينكسر وسط الكلمة
  $$(".en, bdi, .h1-en, .h1en, .te").forEach((x) => { if (!x.lang && !/[؀-ۿ]/.test(x.textContent)) x.lang = "en"; });

  // 📖 المصطلحات: 24 بطاقة أول، وبعدها «عرض المزيد» + تحميل تدريجي وقت التمرير (الصفحة كانت ~75 ألف بكسل)
  const tl = $("#tl");
  if (tl) {
    const STEP = 24; let shown = STEP;
    const more = document.createElement("button"); more.type = "button"; more.className = "cbtn ghost tmore"; tl.after(more);
    const apply = () => {
      const cards = $$("article.term", tl);
      cards.forEach((c, i) => { c.hidden = i >= shown; });
      const left = Math.max(0, cards.length - shown);
      more.hidden = !left; more.textContent = `عرض المزيد (${left})`;
    };
    new MutationObserver(() => { shown = STEP; apply(); }).observe(tl, { childList: true });
    more.addEventListener("click", () => { shown += STEP * 2; apply(); });
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { if (es[0].isIntersecting && !more.hidden) { shown += STEP; apply(); } }, { rootMargin: "600px 0px" }).observe(more);
    apply();
  }

  // المصطلحات: عنوان البحث يختفي وقت الشريط لاصق (يوفّر مساحة بالموبايل)
  const tst = $(".tsticky");
  if (tst) addEventListener("scroll", () => { tst.classList.toggle("stuck", tst.getBoundingClientRect().top <= 1 && scrollY > tst.offsetTop - 8); }, { passive: true });

  // 🔍 بحث ظاهر يفلتر قائمة الصفحة نفسها (الملوّنة) — Enter يروح للبحث العام
  $$("form.psearch[data-filter]").forEach((f) => {
    const inp = $("input", f), sel = f.dataset.filter, cnt = document.createElement("p");
    cnt.className = "hint"; cnt.setAttribute("aria-live", "polite"); f.after(cnt);
    const nrm = (x) => String(x).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
    inp.addEventListener("input", () => {
      const q = nrm(inp.value.trim()); document.body.classList.toggle("filtering", !!q);
      let n = 0;
      $$(sel).forEach((it) => { const on = !q || nrm(it.textContent).includes(q); it.hidden = !on; if (on) n++; });
      $$(".conlist .list").forEach((l) => { const any = $$(".item:not([hidden])", l).length; l.hidden = !any; const h = l.previousElementSibling; if (h && h.matches("h2.gh")) h.hidden = !any; });
      cnt.textContent = q ? (n ? `${n} نتيجة بهالصفحة · Enter للبحث بكل الموقع` : "ماكو بهالصفحة — اضغط «بحث» تدوّر بكل الموقع") : "";
    });
  });

  // 📝 نتيجة الاختبار: «📕 أخطائي» ظاهرة (السؤال + الصحيح + ليش) بدل زر «أعد» بس، وكلام أوضح
  const wrongNow = [];
  document.addEventListener("quiz:answer", (ev) => { const d = ev.detail || {}; if (d.q && !d.ok && !wrongNow.includes(d.q)) wrongNow.push(d.q); if (d.q && d.ok) { const i = wrongNow.indexOf(d.q); if (i >= 0) wrongNow.splice(i, 1); } });
  document.addEventListener("quiz:start", () => { wrongNow.length = 0; });
  $$("#retry-wrong, #retry-all").forEach((b) => b.addEventListener("click", () => { wrongNow.length = 0; const o = $("#mylist"); if (o) o.remove(); }, true));
  document.addEventListener("quiz:finish", () => {
    const msg = $("#msg"); if (msg) msg.textContent = msg.textContent.replace("اقرأ الملف وعد إلينا.", "ارجع للمحاضرة (أو ملف الـ PDF)، وبعدين اختبر نفسك مرة ثانية.");
    const old = $("#mylist"); if (old) old.remove();
    const r = $("#result"); if (!r || !wrongNow.length) return;
    const L = "ABCD";
    r.querySelector(".actions").insertAdjacentHTML("beforebegin", `<details id="mylist" class="mylist" open><summary>📕 أخطائي بهالاختبار (${wrongNow.length})</summary>` +
      wrongNow.map((q) => `<div class="mq"><p class="qen" dir="ltr" lang="en">${esc(q.q_en)}</p>${q.q_ar ? `<p class="qar">${esc(q.q_ar)}</p>` : ""}` +
        `<p class="ok">✓ الصحيح: <bdi dir="ltr">${L[q.answer] || ""}. ${esc((q.options[q.answer] || {}).en)}</bdi><bdi>${esc((q.options[q.answer] || {}).ar)}</bdi></p>${q.why ? `<p class="why">ليش؟ ${esc(q.why)}</p>` : ""}</div>`).join("") +
      `</details>`);
  });

  // 🩻 «قارن بالطبيعي» جنب صورة الحالة (مو تحت الأزرار)، و«وين العلامة؟» يبيّن وين صارت
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(".case .acts button"); if (!b) return;
    const card = b.closest(".case");
    setTimeout(() => {
      if (b.dataset.act === "cmp") {
        const box = $(".cmp", card), fig = $(":scope > figure.xr", card);
        if (box && fig && box.previousElementSibling !== fig) fig.after(box);
        card.classList.toggle("cmpon", !!(box && !box.hidden));
        if (box && !box.hidden) fig.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (b.dataset.act === "mark") {
        let n = $(".mhint", card);
        if (!n) { n = document.createElement("p"); n.className = "mhint"; n.setAttribute("role", "status"); $(":scope > figure.xr", card).after(n); }
        const on = b.classList.contains("on");
        n.hidden = !on; n.textContent = on ? "العلامة من المصدر نفسه (خط أو سهم ملوّن على الصورة). إذا ما بانت، اضغط الصورة وكبّرها." : "";
        if (on) $(":scope > figure.xr", card).scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 0);
  });
})();

// 🧭 صف التنقل (29/10، «صفحتي» v2): يلوّن الزر الحالي إذا المولّد ما حدّده — الرئيسية بالضبط، المحاضرات لـ learn/ و quiz/، صفحتي لـ me/.
(function () {
  const ns = document.querySelectorAll(".nnav .nn"); if (!ns.length || document.querySelector('.nn[aria-current="page"]')) return;
  const man = document.querySelector('link[rel="manifest"]'); if (!man) return;
  const root = new URL(".", man.href).pathname, p = decodeURIComponent(location.pathname).replace(/index\.html$/, "");
  const rel = p.startsWith(root) ? p.slice(root.length).replace(/^preview\//, "") : "";
  const k = /^(lessons|home)\/$/.test(rel) || rel === "" ? 0 : /^(learn|quiz)\//.test(rel) ? 1 : /^me\//.test(rel) ? 2 : -1;
  if (k >= 0) ns.forEach((a) => { if (+a.dataset.nn === k) a.setAttribute("aria-current", "page"); });
})();
