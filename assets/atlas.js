// أطلس الحالات المرضية: البحث، الهيكل، «وين العلامة؟»، «قارن بالطبيعي»، التكبير بالإصبع، «خمّن الحالة» و«خلط».
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // البحث: إنكليزي أو عربي، بدون تشكيل وبتوحيد الألف والياء والتاء المربوطة
  const norm = (s) => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();
  const q = $("#q");
  if (q && window.ATLAS_S) {
    const idx = window.ATLAS_S.map((c) => ({ c, t: norm([c.en, c.ar, ...(c.aka || [])].join(" ")) }));
    q.addEventListener("input", () => {
      const v = norm(q.value), res = $("#res");
      if (!v) { res.innerHTML = ""; return; }
      const hits = idx.filter((x) => v.split(" ").every((w) => x.t.includes(w))).slice(0, 12);
      res.innerHTML = hits.length ? hits.map(({ c }) => `<li><a href="${esc(c.u)}"><span class="en">${esc(c.en)}</span> — ${esc(c.ar)}<small>${esc(c.rg)}</small></a></li>`).join("")
        : '<li class="none">ما في نتيجة. جرّب الاسم الإنكليزي أو كلمة أقصر.</li>';
    });
  }

  // الهيكل: المنطقة الملوّنة تفتح صفحتها
  document.querySelectorAll("svg.body:not(.mini) .rg").forEach((el) => el.addEventListener("click", () => {
    const u = (window.ATLAS_LINKS || {})[el.dataset.r];
    if (u) location.href = u;
  }));

  // «وين العلامة؟» و«قارن بالطبيعي»
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest(".acts button");
    if (!b) return;
    const card = b.closest(".case");
    if (b.dataset.act === "mark") {
      const on = !b.classList.contains("on");
      b.classList.toggle("on", on);
      const fig = card.querySelector(".xr .xi"), img = fig.querySelector("img"), svg = fig.querySelector(".marks");
      if (svg) svg.toggleAttribute("hidden", !on);
      if (img.dataset.marked) {
        img.dataset.plain = img.dataset.plain || img.getAttribute("src");
        img.src = on ? img.dataset.marked : img.dataset.plain;
      }
      const lg = card.querySelector(".legend");
      if (lg) lg.hidden = !on;
    } else if (b.dataset.act === "cmp") {
      const box = card.querySelector(".cmp"), on = box.hidden;
      box.hidden = !on;
      b.classList.toggle("on", on);
      const im = box.querySelector("img[data-src]");
      if (on && im && !im.getAttribute("src")) im.src = im.dataset.src;
      if (on) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
  document.querySelectorAll('.marks[data-show="1"]').forEach((s) => s.removeAttribute("hidden"));

  // التكبير بالإصبع: نضغط على الصورة فتنفتح بكامل الشاشة
  document.addEventListener("click", (ev) => {
    const xi = ev.target.closest(".xi");
    if (!xi || xi.closest(".lb")) return;
    openZoom(xi);
  });
  function openZoom(xi) {
    const lb = document.createElement("div");
    lb.className = "lb";
    lb.innerHTML = '<button class="x" aria-label="إغلاق">✕</button><div class="lbin"></div><p class="tip">قرّب بإصبعين · اسحب للتحريك · نقرتان للتكبير</p>';
    const inner = lb.querySelector(".lbin");
    const img = xi.querySelector("img").cloneNode();
    img.removeAttribute("loading");
    inner.appendChild(img);
    const svg = xi.querySelector(".marks");
    if (svg && !svg.hasAttribute("hidden")) inner.appendChild(svg.cloneNode(true));
    document.body.appendChild(lb);
    document.body.style.overflow = "hidden";
    const src0 = xi.querySelector("img"), W = innerWidth, H = innerHeight;
    const iw = +img.getAttribute("width") || src0.naturalWidth, ih = +img.getAttribute("height") || src0.naturalHeight;
    const fit = Math.min(W / iw, H / ih);
    inner.style.width = iw * fit + "px";
    let s = 1, tx = (W - iw * fit) / 2, ty = (H - ih * fit) / 2;
    const base = { tx, ty };
    const apply = () => (inner.style.transform = `translate(${tx}px,${ty}px) scale(${s})`);
    apply();
    const pts = new Map();
    let last = null, lastTap = 0;
    const zoomAt = (ns, cx, cy) => {
      ns = Math.min(6, Math.max(1, ns));
      tx = cx - ((cx - tx) * ns) / s; ty = cy - ((cy - ty) * ns) / s; s = ns;
      if (s === 1) { tx = base.tx; ty = base.ty; }
      apply();
    };
    lb.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".x")) return;
      lb.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) {
        const now = Date.now();
        if (now - lastTap < 300) zoomAt(s > 1 ? 1 : 2.5, e.clientX, e.clientY);
        lastTap = now;
      }
      last = null;
    });
    lb.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
        if (last) zoomAt((s * d) / last, cx, cy);
        last = d;
      } else if (pts.size === 1 && s > 1) {
        tx += e.clientX - prev[0]; ty += e.clientY - prev[1]; apply();
      }
    });
    const up = (e) => { pts.delete(e.pointerId); last = null; };
    lb.addEventListener("pointerup", up);
    lb.addEventListener("pointercancel", up);
    lb.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
    const close = () => { lb.remove(); document.body.style.overflow = ""; removeEventListener("keydown", key); };
    const key = (e) => e.key === "Escape" && close();
    addEventListener("keydown", key);
    lb.querySelector(".x").onclick = close;
  }

  // «خمّن الحالة» (صفحة المنطقة) و«خلط» (من كل المناطق): صورة بدون اسم و4 خيارات من نفس المنطقة
  const startBtn = $("#guess") || $("#shuffle");
  if (startBtn && window.ATLAS_Q) startBtn.addEventListener("click", () => guess(window.ATLAS_Q));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function guess(all) {
    let order = shuffle(all), i = 0, ok = 0, n = 0;
    const gz = document.createElement("div");
    gz.className = "gz";
    document.body.appendChild(gz);
    document.body.style.overflow = "hidden";
    const close = () => { gz.remove(); document.body.style.overflow = ""; };
    const show = () => {
      if (i >= order.length) { order = shuffle(all); i = 0; }
      const c = order[i];
      let pool = all.filter((x) => x.r === c.r && x.id !== c.id);
      if (pool.length < 3) pool = all.filter((x) => x.id !== c.id);
      const opts = shuffle([c, ...shuffle(pool).filter((x, k, arr) => arr.findIndex((y) => y.en === x.en) === k && x.en !== c.en).slice(0, 3)]);
      gz.innerHTML = `<div class="wrap"><div class="bar2"><button class="close">‹ رجوع</button><span>صحيح ${ok} من ${n}</span></div>
        <h2 style="margin:0 0 8px;font-size:19px">🎯 شنو هذه الحالة؟</h2>
        <div class="xi"><img src="${esc(window.ATLAS_BASE + c.img)}" width="${c.w}" height="${c.h}" alt=""></div>
        <div class="opts">${opts.map((o) => `<button data-id="${esc(o.id)}"><span class="en">${esc(o.en)}</span><small>${esc(o.ar)}</small></button>`).join("")}</div>
        <div class="fbx"></div></div>`;
      gz.querySelector(".close").onclick = close;
      gz.querySelectorAll(".opts button").forEach((b) => (b.onclick = () => {
        if (gz.querySelector(".opts .ok")) return;
        n++;
        const right = b.dataset.id === c.id;
        if (right) ok++;
        b.classList.add(right ? "ok" : "no");
        gz.querySelector(`.opts button[data-id="${CSS.escape(c.id)}"]`).classList.add("ok");
        gz.querySelector(".bar2 span").textContent = `صحيح ${ok} من ${n}`;
        const xi = gz.querySelector(".xi");
        if (c.mf) xi.querySelector("img").src = window.ATLAS_BASE + c.mf;
        else if (c.mk) { xi.insertAdjacentHTML("beforeend", c.mk); xi.querySelector(".marks").removeAttribute("hidden"); }
        gz.querySelector(".fbx").innerHTML = `<div class="fb"><b>${right ? "✅ صحيح" : "❌ الجواب الصحيح"}: <span class="en">${esc(c.en)}</span> — ${esc(c.ar)}</b>
          <p style="margin:6px 0 0">${esc(c.line)}</p><a class="go" href="${esc(window.ATLAS_BASE + caseUrl(c))}">👁️ افتح البطاقة وشوف العلامة</a></div>
          <button class="next">التالية ›</button>`;
        gz.querySelector(".go").onclick = close;
        gz.querySelector(".fbx").scrollIntoView({ behavior: "smooth", block: "nearest" });
        gz.querySelector(".next").onclick = () => { i++; show(); gz.scrollTop = 0; };
      }));
    };
    show();
  }
  // رابط البطاقة نسبةً لـ ATLAS_BASE (مسار الصورة يبدأ باسم مجلد المنطقة)
  function caseUrl(c) { return c.img.split("/img/")[0] + "/#c-" + c.id; }
})();
