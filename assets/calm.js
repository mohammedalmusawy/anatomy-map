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
  const setTheme = (t) => { if (t === "dark") document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme; };
  setTheme(LS.get("theme", "light"));
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest("[data-theme-toggle]")) return;
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; LS.set("theme", t); setTheme(t);
  });

  // ── 🎓 أقسام الطلاب (بالمعاينة: زر «زائر / طالب» للعرض؛ بالموقع الحقيقي الدور من الجلسة) ──
  const role = LS.get("pv-role", "visitor"); document.body.dataset.role = role;
  $$("[data-name-only]").forEach((el) => { el.hidden = role !== "student"; });
  $$("[data-visitor-only]").forEach((el) => { el.hidden = role === "student"; });
  document.addEventListener("click", (ev) => {
    const r = ev.target.closest("[data-role-set]"); if (r) { LS.set("pv-role", r.dataset.roleSet); location.reload(); return; }
    const l = ev.target.closest("[data-locked]");
    if (!l || document.body.dataset.role === "student") return;
    ev.preventDefault();
    const dlg = $("#gatedlg"); if (!dlg) return;
    $("#gatego", dlg).href = $("#gatego", dlg).dataset.base + "?next=" + encodeURIComponent(new URL(l.getAttribute("href") || "", location.href).pathname);
    dlg.hidden = false; $("#gatego", dlg).focus();
  });
  // صفحة لطلابنا انفتحت مباشرة بدون كود ← نفس النافذة، و«تمام» يرجّعه للرئيسية
  if (document.body.dataset.gated && role !== "student" && $("#gatedlg")) {
    const dlg = $("#gatedlg"), go = $("#gatego", dlg);
    go.href = go.dataset.base + "?next=" + encodeURIComponent(location.pathname);
    $("[data-close]", dlg).addEventListener("click", () => { location.href = go.dataset.base.replace(/login\/$/, "home/"); });
    dlg.hidden = false;
  }
  document.addEventListener("click", (ev) => { const d = ev.target.closest("#gatedlg"); if (d && (ev.target === d || ev.target.closest("[data-close]"))) d.hidden = true; });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && $("#gatedlg")) $("#gatedlg").hidden = true; });

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

  // ── ↩️ كمّل من وين وقفت ──
  const page = document.body.dataset.lecture && JSON.parse(document.body.dataset.lecture);
  if (page) LS.set("last", Object.assign(page, { t: Date.now(), tab: (location.hash || "#read").slice(1) }));
  const res = $("#resume"), last = LS.get("last", null);
  if (res && last && last.url) {
    res.href = new URL(last.url, document.baseURI).href;
    res.innerHTML = `<svg class="ico" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>` +
      `<span><small>كمّل من وين وقفت</small><b>${esc(last.title)}</b><small>${esc(last.sub)}</small></span><span class="go">كمّل ‹</span>`;
    res.hidden = false;
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
      const d = ev.key === "ArrowLeft" ? 1 : ev.key === "ArrowRight" ? -1 : 0; if (!d) return;
      const n = btns[(i + d + btns.length) % btns.length]; n.focus(); n.click(); ev.preventDefault();
    });
    return show;
  }
  // المادة: [نظري | عملي] — يتذكّر آخر اختيار
  const st = $("#stabs");
  if (st) { const show = tabs(st, "stab:" + st.dataset.subject); const k = LS.get("stab:" + st.dataset.subject, null); show(k && $(`[data-tab="${k}"]`, st) ? k : st.dataset.def); }
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
    $$("[data-view]", seg.parentElement).forEach((v) => { v.hidden = v.dataset.view !== b.dataset.v; });
    LS.set("readv", b.dataset.v);
  }));
  const rv = LS.get("readv", "text"); $$(`.seg button[data-v="${rv}"]`).forEach((b) => b.click());

  // ── شريط تقدّم القراءة (خفيف) ──
  const bar = $(".rprog i");
  if (bar) {
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? Math.min(100, (scrollY / h) * 100) : 0) + "%"; };
    addEventListener("scroll", upd, { passive: true }); upd();
  }
})();
