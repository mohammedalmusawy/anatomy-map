// 🎓 تبويب «الطلاب» بلوحة الإدارة (29/10/2026) — جاهز ومو مربوط بـ admin.js بعد.
// 70 (مسودة): طلبات الكود من البوت انشالت · أجهزة كل طالب (نوعها + أول وآخر ظهور) · ♻️ صار «سجّل خروج من كل الأجهزة».
// 73 (مسودة): ➕ أكواد جملة (حتى 600) بلا أسماء + تصدير على جهازك بس (نسخ · PDF · Excel · صور PNG + ZIP).
// الربط بعدين (بعد «وافقت»): بـ admin.js ← tabs.students = "🎓 الطلاب" ← AdminStudents.mount(pane, sb).
// كل شي يمر بدالة students-admin (is_admin بالسيرفر). الأكواد تنعرض من التشفير، وما تنحفظ بالمتصفح.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const SITE = "https://mohammedalmusawy.github.io/anatomy-map/";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (code) => `${SITE}?code=${encodeURIComponent(code)}`;
  const waText = (name, code) => `أهلاً${name ? " " + name.split(" ")[0] : ""}، هذا كودك لموقع دروس تقنيات الأشعة: ${code} — أو افتح الرابط مباشرة: ${link(code)} (يشتغل على 3 أجهزة بالكثير، لا تشاركه)`;
  const ago = (t) => { if (!t) return "—"; const d = Math.floor((Date.now() - new Date(t)) / 864e5); return d <= 0 ? "اليوم" : d === 1 ? "أمس" : "قبل " + arDays(d); };
  const arDays = (n) => (n = Math.abs(Math.round(+n || 0))) === 1 ? "يوم" : n === 2 ? "يومين" : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يوم`;   // عبارة كاملة
  const copy = async (s, btn) => { try { await navigator.clipboard.writeText(s); const o = btn.textContent; btn.textContent = "✔️"; setTimeout(() => (btn.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };

  // 73: ملف التصدير ينحمّل وقت الضغط بس (نفس نسخة هذا الملف ?v=)
  const SRC_ = (document.currentScript && document.currentScript.src) || ((document.querySelector('script[src*="admin-students"]') || {}).src || "");
  const EXP = SRC_.replace(/admin-students(\.min)?\.js/, "codes-export.js");
  let expP = null;
  const loadExp = () => window.CodesExport ? Promise.resolve(window.CodesExport) : (expP ??= new Promise((ok, no) => {
    const sc = document.createElement("script"); sc.src = EXP; sc.onload = () => ok(window.CodesExport); sc.onerror = () => { expP = null; no(new Error("load")); }; document.head.appendChild(sc);
  }));
  const MAX_TOTAL = 600, PER_REQ = 100;

  const CSS_ID = "st73-css";
  if (!document.getElementById(CSS_ID)) {
    const el = document.createElement("style"); el.id = CSS_ID;
    el.textContent = `#admin .st-bulk{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 18px}
#admin .st-bulk h3{margin:0 0 4px}#admin .st-row{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:8px 0}
#admin .st-row label{display:grid;gap:4px;font-size:var(--t-sm,.9rem);color:var(--muted)}
#admin .st-row select,#admin .st-row input{min-height:44px;min-width:88px;padding:0 10px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit}
#admin .st-row .btn{min-height:48px;padding:0 18px}
#admin .st-stage{display:inline-block;padding:0 7px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}
#admin .st-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:8px}
#admin .st-thumbs figure{margin:0;border:1px solid var(--line);border-radius:12px;padding:6px;background:#fff;text-align:center}
#admin .st-thumbs img{width:100%;height:auto;border-radius:8px;display:block}#admin .st-thumbs figcaption{font-size:var(--t-sm,.9rem);color:#1F2430}`;
    document.head.appendChild(el);
  }

  let mountAC = null;   // 🔁 59: فتح التبويب مرة ثانية ← المستمعين القدام ينشالون (ما يتكررون)
  async function mount(pane, sb) {
    if (mountAC) mountAC.abort();
    mountAC = new AbortController();
    const on = { signal: window.AdminTab ? AdminTab.own(mountAC) : mountAC.signal };
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/students-admin`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { ...(await r.json().catch(() => ({}))), status: r.status };   // 🛡️ الحالة من HTTP دائماً (body.status ما يغطّيها)
    };
    let batch = [];   // 73: أكواد آخر دفعة، بذاكرة الصفحة بس (ولا تنحفظ بأي مكان)
    pane.innerHTML = `<h2>🎓 الطلاب</h2>
      <section class="st-bulk" aria-labelledby="st-bh">
        <h3 id="st-bh">➕ أكواد جاهزة بلا أسماء</h3>
        <p class="hint">اختار المرحلة والعدد (حتى ${MAX_TOTAL})، والأسماء تنكتب بعدين: منك، أو الطالب بنفسه بأول دخول.</p>
        <div class="st-row">
          <label>المرحلة <select id="st-stage" aria-label="المرحلة"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>
          <label>العدد <input id="st-count" type="number" inputmode="numeric" min="1" max="${MAX_TOTAL}" value="100" aria-label="العدد"></label>
          <button class="btn" id="st-bulk" type="button">سوّي الأكواد</button>
        </div>
        <p class="hint" id="st-prog" role="status" aria-live="polite"></p>
        <div id="st-exp" hidden>
          <p><b id="st-expn"></b></p>
          <div class="st-row">
            <button class="btn" id="st-xcopy" type="button">📋 نسخ الكل</button>
            <button class="btn ghost" id="st-xpdf" type="button">📄 PDF (A4)</button>
            <button class="btn ghost" id="st-xxls" type="button">📊 Excel</button>
            <button class="btn ghost" id="st-ximg" type="button">🖼️ صور PNG</button>
          </div>
          <div id="st-imgs"></div>
        </div>
        <p class="hint">🔒 الملفات تنحفظ بجهازك بس — ما ينرفع شي للموقع ولا للقناة.</p>
      </section>
      <h3>أسماء ثلاثية</h3>
      <p class="hint">ألصق الأسماء الثلاثية (كل اسم بسطر) ← كود قصير لكل طالب. الاسم المكرر (حتى بفرق أ/ا أو ة/ه) ما ينسواله كود ثاني.</p>
      <textarea id="st-names" rows="5" placeholder="أحمد علي حسين&#10;زينب محمد كاظم"></textarea>
      <p><button class="btn" id="st-make">➕ سوّي الأكواد</button> <button class="btn ghost" id="st-csv">⬇️ نسخة CSV (بلا أكواد)</button></p>
      <div id="st-out"></div>
      <h3>القائمة</h3><p class="st-row"><label>عرض <select id="st-filter" aria-label="عرض"><option value="all">الكل</option><option value="blank">بلا اسم فقط</option></select></label> <button class="btn ghost" id="st-xblank" type="button">📤 تصدير الأكواد بلا اسم</button></p><div class="scroll-x" id="st-list"><p class="hint">…</p></div>`;
    const $ = (s) => pane.querySelector(s);
    const actions = (s) => `<button class="ib" data-a="copy" title="نسخ">📋</button> <button class="ib" data-a="link" title="رابط دخول مباشر">🔗</button> ` +
      `<a class="ib" title="واتساب برسالة جاهزة" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText(s.full_name, s.code || ""))}">💬</a>`;

    // 📱 70: قائمة الأجهزة (نوعها بكلمتين، أول ظهور، آخر ظهور) + «سجّل خروج من كل الأجهزة»
    const day = (t) => (t ? String(t).slice(0, 10) : "—");
    const devs = (s, max) => {
      const dl = s.device_list || [];
      return `<details class="stdev"><summary>📱 ${s.devices}/${max}</summary>` +
        (dl.length ? `<ul>${dl.map((d) => `<li><b>${esc(d.kind)}</b> <small>أول: ${esc(day(d.first_seen))} · آخر: ${esc(ago(d.last_seen))}</small></li>`).join("")}</ul>` +
          '<button class="btn ghost" data-a="reset" type="button">سجّل خروج من كل الأجهزة</button>' : '<p class="hint">ماكو أجهزة.</p>') + "</details>";
    };
    let allRows = [];
    async function list() {
      const r = await api({ action: "list" });
      if (on.signal.aborted) return;   // 🔁 59: التبويب انسد قبل ما يوصل الرد
      if (r.status !== 200) { $("#st-list").innerHTML = `<p class="hint">ما گدرت أجيب القائمة (${r.status}).</p>`; return; }
      allRows = r.students || [];
      const flt = $("#st-filter") ? $("#st-filter").value : "all";
      const rows = flt === "blank" ? allRows.filter((x) => !x.full_name) : allRows;
      $("#st-list").innerHTML = rows.length ? `<table class="adm"><thead><tr><th>الاسم الثلاثي</th><th>الكود</th><th>دزّه</th><th>آخر دخول</th><th>الأجهزة</th><th>السلسلة</th><th>إدارة</th></tr></thead><tbody>` +
        rows.map((s) => `<tr data-id="${esc(s.id)}" data-code="${esc(s.code || "")}" data-name="${esc(s.full_name || "")}">
          <td>${s.full_name ? `<b>${esc(s.full_name)}</b>` : `<span class="hint">— بلا اسم —</span>`} <small class="st-stage" title="المرحلة">م${esc(s.stage_n || 2)}</small>${s.status === "paused" ? " <small>⏸️ موقوف</small>" : ""}${s.name_fix ? `<br><small>✏️ طلب تصحيح: ${esc(s.name_fix)} <button class="ib" data-a="fixok" title="طبّق التصحيح">✅</button></small>` : ""}</td>
          <td><span class="code" dir="ltr">${esc(s.code || "؟")}</span></td><td>${actions(s)}</td>
          <td>${ago(s.last_seen)}</td><td>${devs(s, r.max_devices)}</td><td>${s.streak ? "🔥 " + s.streak : "—"}</td>
          <td><button class="ib" data-a="setname" title="${s.full_name ? "تعديل الاسم" : "اكتب الاسم"}">✏️</button> <button class="ib" data-a="rotate" title="كود جديد">🔄</button> <button class="ib" data-a="${s.status === "paused" ? "resume" : "pause"}" title="${s.status === "paused" ? "تشغيل" : "إيقاف"}">${s.status === "paused" ? "▶️" : "⏸️"}</button> <button class="ib" data-a="delete" title="حذف كامل">🗑️</button></td></tr>`).join("") +
        "</tbody></table>" : '<p class="hint">ماكو طلاب بعد.</p>';
    }
    $("#st-make").onclick = async () => {
      const r = await api({ action: "create", names: $("#st-names").value });
      if (r.status !== 200) { $("#st-out").innerHTML = `<p class="hint">${esc(r.msg || "صار خطأ")}</p>`; return; }
      $("#st-out").innerHTML = (r.created.length ? `<p>✅ انسوّت ${r.created.length} أكواد (تگدر تنسخها بعدين من القائمة):</p><ul>${r.created.map((s) => `<li>${esc(s.full_name)} — <span class="code" dir="ltr">${esc(s.code)}</span></li>`).join("")}</ul>` : "") +
        (r.duplicates.length ? `<p>⚠️ مكرر — ما انسوّاله كود (قرّر أنت):</p><ul>${r.duplicates.map((d) => `<li>${esc(d.name)} ← ${esc(d.reason)}: «${esc(d.existing)}»</li>`).join("")}</ul>` : "") +
        (r.invalid.length ? `<p>✋ مو اسم ثلاثي: ${r.invalid.map(esc).join("، ")}</p>` : "");
      if (r.created.length) $("#st-names").value = r.duplicates.map((d) => d.name).concat(r.invalid).join("\n");
      list();
    };
    // ───── 73: أكواد جملة ─────
    const st = (m) => { $("#st-prog").textContent = m; };
    const showExp = () => {
      $("#st-exp").hidden = !batch.length; $("#st-expn").textContent = batch.length ? `✅ ${batch.length} كود جاهز للتصدير` : "";
      $("#st-imgs").innerHTML = "";
    };
    $("#st-bulk").onclick = async (ev) => {
      const btn = ev.currentTarget, stage = +$("#st-stage").value, want = Math.floor(+$("#st-count").value);
      if (!(want >= 1 && want <= MAX_TOTAL)) { st(`العدد من 1 إلى ${MAX_TOTAL}.`); return; }
      if (!confirm(`تسوّي ${want} كود للمرحلة ${stage}؟ (بلا أسماء)`)) return;
      btn.disabled = true; batch = []; showExp();
      let made = 0, failed = 0, msg = "";
      for (let left = want; left > 0 && !on.signal.aborted;) {
        const n = Math.min(PER_REQ, left);
        st(`جاري التوليد… انسوّى ${made} من ${want}`);
        let r;
        try { r = await api({ action: "bulk_create", count: n, stage }); } catch (e) { r = { status: 0 }; }
        if (r.status !== 200) { msg = r.status === 403 ? "هذا للمالك بس." : `وقف الطلب (${r.status || "انقطع النت"}). ممكن بعض الأكواد انسوّت — شوف القائمة.`; failed += left; break; }
        for (const c of r.created) batch.push({ n: batch.length + 1, code: c.code, stage });
        made += r.created.length; failed += r.failed || 0; left -= n;
      }
      btn.disabled = false;
      st((made === want ? `✅ انسوّت ${made} كود للمرحلة ${stage}.` : `⚠️ انسوّى ${made} من ${want}${failed ? ` (فشل ${failed})` : ""}. ${msg} الأكواد اللي انسوّت صالحة.`));
      showExp(); list();
    };
    const exporter = async (fn) => { try { const X = await loadExp(); await fn(X); } catch (e) { st("ما گدرت أجهّز الملف: " + (e && e.message ? e.message : "خطأ")); } };
    const stamp = () => { const st1 = [...new Set(batch.map((b) => b.stage))]; return `اكواد-${st1.length === 1 ? "مرحلة" + st1[0] + "-" : ""}${new Date().toLocaleDateString("en-CA")}`; };
    $("#st-xcopy").onclick = (ev) => exporter(async (X) => { const b = ev.currentTarget; try { await navigator.clipboard.writeText(X.text(batch)); b.textContent = `✔️ اننسخ ${batch.length}`; } catch (e) { prompt("انسخ:", X.text(batch)); } setTimeout(() => (b.textContent = "📋 نسخ الكل"), 2000); });
    $("#st-xpdf").onclick = () => exporter(async (X) => { st("جاري تجهيز الـ PDF…"); X.save(await X.pdf(batch), stamp() + ".pdf"); st("✔️ انحفظ الـ PDF بجهازك."); });
    $("#st-xxls").onclick = () => exporter(async (X) => { X.save(X.xlsx(batch), stamp() + ".xlsx"); st("✔️ انحفظ ملف Excel بجهازك."); });
    $("#st-ximg").onclick = () => exporter(async (X) => {
      st("جاري تجهيز الصور…"); const imgs = await X.images(batch);
      $("#st-imgs").innerHTML = `<p class="st-row"><button class="btn" id="st-zip" type="button">⬇️ كل الصور (ZIP)</button></p><div class="st-thumbs">` +
        imgs.map((m, i) => `<figure><img alt="صورة ${esc(m.label)}" src="${URL.createObjectURL(m.blob)}"><figcaption>${esc(m.label)} <button class="ib" data-img="${i}" title="تنزيل ${esc(m.label)}">⬇️</button></figcaption></figure>`).join("") + "</div>";
      $("#st-imgs").onclick = (e) => { const b = e.target.closest("[data-img]"); if (b) X.save(imgs[+b.dataset.img].blob, imgs[+b.dataset.img].name); };
      $("#st-zip").onclick = async () => { X.save(await X.imagesZip(imgs), stamp() + "-صور.zip"); };
      st(`✔️ ${imgs.length} صورة جاهزة (كل صورة ${X.CHUNK} كود).`);
    });
    // تصدير الأكواد اللي بلا اسم من القائمة (إذا الدفعة راحت بإغلاق الصفحة): المرحلة تنفصل بترتيب
    $("#st-xblank").onclick = () => {
      const blank = allRows.filter((x) => !x.full_name && x.code).sort((a, b) => (a.stage_n - b.stage_n) || String(a.created_at).localeCompare(String(b.created_at)));
      if (!blank.length) { st("ماكو أكواد بلا اسم."); return; }
      batch = blank.map((x, i) => ({ n: i + 1, code: x.code, stage: x.stage_n || 2 })); showExp(); st(`جاهز تصدير ${batch.length} كود بلا اسم.`);
      $("#st-exp").scrollIntoView({ block: "nearest" });
    };
    $("#st-filter").onchange = () => list();

    $("#st-csv").onclick = async () => {
      const r = await api({ action: "export_csv" });
      if (!r.csv) return alert("صار خطأ");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      a.download = `الطلاب-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };
    pane.addEventListener("click", async (ev) => {
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const tr = b.closest("tr"), id = tr.dataset.id, code = tr.dataset.code, name = tr.dataset.name, a = b.dataset.a;
      if (a === "setname") {
        const typed = prompt(name ? `الاسم الثلاثي الجديد لـ «${name}»:` : "اكتب الاسم الثلاثي للطالب:", name);
        if (typed === null || !typed.trim()) return;
        const rr = await api({ action: "rename", id, full_name: typed });
        if (rr.status !== 200) return alert(rr.msg || "صار خطأ");
        return list();
      }
      if (a === "copy") return copy(code, b);
      if (a === "link") return copy(link(code), b);
      if (a === "rotate" && !confirm(`كود جديد لـ «${name || "كود بلا اسم"}»؟ القديم يبطل والأجهزة تتصفّر.`)) return;
      if (a === "pause" && !confirm(`إيقاف «${name || "كود بلا اسم"}»؟ يطلع من كل أجهزته.`)) return;
      if (a === "reset" && !confirm(`تسجّل خروج «${name || "كود بلا اسم"}» من كل أجهزته؟ يدخل مرة ثانية بنفس الكود.`)) return;
      let body = { action: a, id };
      if (a === "fixok") body = { action: "rename", id };
      if (a === "delete") {
        const typed = prompt(name ? `🗑️ حذف كامل لـ «${name}» وكل بياناته (ما يرجع). اكتب الاسم الثلاثي بالضبط حتى تأكد:` : "🗑️ حذف هذا الكود (بلا اسم) وكل بياناته (ما يرجع). اكتب كلمة «حذف» حتى تأكد:");
        if (typed === null) return;
        body = { action: "delete", id, confirm: true, confirm_name: typed };
      }
      const r = await api(body);
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      if (a === "rotate") alert(`الكود الجديد: ${r.code}`);
      list();
    }, on);
    list();
  }
  window.AdminStudents = { mount };
})();
