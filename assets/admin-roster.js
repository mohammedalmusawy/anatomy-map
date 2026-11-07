// 📋 74 (مسودة): قسم «قائمة الطلاب» بتبويب 🎓 الطلاب (المالك بس) — رفع القائمة من Excel/CSV، بحث، إضافة، تصحيح، سحب كود، تشغيل البوت، روابط المراحل، السجل.
// كل شي يمر بدالة students-admin (is_admin بالسيرفر). القائمة خاصة: ما تنحفظ بالمتصفح، والأكواد ما تنعرض إلا بعد «كود جديد» (للنسخ) وبذاكرة الصفحة بس.
// يتحمّل وقت الضغط بس (ويّاه roster-parse.js). الاستعمال: AdminRoster.mount(box, api, { copy })
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const BOT = "mohammed_almusawy_bot", PAGE = 50, CHUNK = 200;
  const STAGES = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];
  const EV = { import: "رفع قائمة", claim: "أخذ كود", resend: "أعاد إرسال كوده", fail: "محاولة فاشلة", freeze: "تجميد حساب", request: "طلب وصل للمالك", accept: "✅ قبول", reject: "❌ رفض", edit: "تعديل", reissue: "سحب كود وإعطاء جديد", bot_toggle: "تشغيل/إطفاء البوت" };
  const when = (t) => { try { return new Date(t).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", dateStyle: "short", timeStyle: "short" }); } catch (e) { return String(t).slice(0, 16); } };

  if (!document.getElementById("rs74-css")) {
    const el = document.createElement("style"); el.id = "rs74-css";
    el.textContent = `#admin .rs{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
#admin .rs>*{min-width:0}
#admin .rs .rs-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
#admin .rs .rs-card>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}
#admin .rs h4{margin:0 0 6px}
#admin .rs [hidden]{display:none!important}
#admin .rs .row{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:8px 0}
#admin .rs label{display:grid;gap:4px;font-size:var(--t-sm,.9rem);color:var(--muted)}
#admin .rs input,#admin .rs select{min-height:44px;padding:0 10px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;max-width:100%}
#admin .rs input[type=file]{padding:8px 10px;height:auto;width:100%;box-sizing:border-box}
#admin .rs .row>label{min-width:0;max-width:100%;flex:1 1 150px}
#admin .rs .row>label>input,#admin .rs .row>label>select{width:100%;box-sizing:border-box}
#admin .rs .btn{min-height:48px;padding:0 18px}
#admin .rs .ib{min-width:44px;min-height:44px}
#admin .rs ul{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}
#admin .rs li.it{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:var(--bg)}
#admin .rs li.it .nm{flex:1 1 180px;min-width:0;overflow-wrap:anywhere}
#admin .rs .chip{display:inline-block;padding:0 8px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:var(--t-sm,.9rem)}
#admin .rs .chip.on{border-color:var(--accent,#8C6A3A);color:var(--accent,#8C6A3A)}
#admin .rs .sum{display:grid;gap:4px;margin:0}
#admin .rs .warn{color:var(--bad,#B3261E)}
#admin .rs .newcode{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border:1px dashed var(--accent,#8C6A3A);border-radius:12px;padding:8px 10px}
#admin .rs .code{direction:ltr;unicode-bidi:embed;font-family:ui-monospace,Menlo,monospace;overflow-wrap:anywhere;min-width:0}`;
    document.head.appendChild(el);
  }

  function mount(box, api, helpers) {
    const copy = (helpers && helpers.copy) || (async (s) => { await navigator.clipboard.writeText(s); });
    let on = false, off = 0, total = 0, parsed = null, auditLoaded = false;
    box.innerHTML = `<div class="rs">
      <div class="rs-card"><h4>🤖 بوت الطلاب</h4>
        <p class="hint" id="rs-state">جاري التحميل…</p>
        <button class="btn" id="rs-bot" type="button" aria-pressed="false">—</button>
        <p class="sum hint" id="rs-sum" role="status"></p>
        <p class="hint">البوت ياخذ بس من الأكواد اللي مو محجوزة. الأكواد اللي تسوّيها بلا علامة «للبوت» تنحجز (للطباعة)، وتگدر تحرّر أكواد مرحلة للبوت هنا:</p>
        <div class="row"><label>المرحلة <select id="rs-ps">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${STAGES[n]}</option>`).join("")}</select></label>
          <button class="btn" id="rs-rel" type="button">🤖 حرّرها للبوت</button><button class="btn ghost" id="rs-res" type="button">🔒 احجزها</button></div>
        <p class="hint" id="rs-pm" role="status"></p></div>
      <div class="rs-card"><h4>١) ارفع قائمة الطلاب</h4>
        <p class="hint">ملف Excel (.xlsx) أو CSV بأعمدة: الاسم · الرقم الجامعي · المرحلة. الملف يتقرأ على جهازك، والقائمة تنحفظ بالسيرفر الخاص بس. رفعها مرة ثانية يحدّث الموجود ويضيف الجديد.</p>
        <div class="row">
          <label>المرحلة (إذا العمود ناقص) <select id="rs-stage" aria-label="المرحلة الافتراضية">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${STAGES[n]}</option>`).join("")}</select></label>
          <label>الملف <input id="rs-file" type="file" accept=".xlsx,.csv,text/csv" aria-label="ملف القائمة"></label>
        </div>
        <div id="rs-prev" role="status" aria-live="polite"></div>
        <button class="btn" id="rs-up" type="button" hidden>ارفع القائمة</button></div>
      <details class="rs-card"><summary>➕ إضافة طالب أو تصحيح</summary>
        <div class="row">
          <label>الاسم الثلاثي <input id="rs-an" autocomplete="off" maxlength="120"></label>
          <label>الرقم الجامعي <input id="rs-au" inputmode="numeric" dir="ltr" autocomplete="off" maxlength="40"></label>
          <label>المرحلة <select id="rs-as">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${STAGES[n]}</option>`).join("")}</select></label>
          <button class="btn" id="rs-add" type="button">أضف</button>
        </div><p class="hint" id="rs-addm" role="status"></p>
        <p class="hint">مرحلة جديدة؟ أضف طلابها هنا أو بالملف، وسوّي لها أكواد جاهزة من القسم اللي فوق.</p></details>
      <div class="rs-card"><h4>٢) القائمة</h4>
        <div class="row"><label>بحث (اسم أو رقم) <input id="rs-q" type="search" autocomplete="off"></label>
          <label>المرحلة <select id="rs-fs"><option value="">الكل</option>${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${STAGES[n]}</option>`).join("")}</select></label></div>
        <p class="hint" id="rs-cnt" role="status"></p><div id="rs-nc"></div><ul id="rs-list"></ul>
        <p><button class="btn ghost" id="rs-more" type="button" hidden>أكثر</button></p></div>
      <details class="rs-card"><summary>🔗 روابط البوت لكل مرحلة</summary>
        <p class="hint">الطالب يضغط الرابط ويفتح البوت جاهز على مرحلته.</p>
        <ul>${[1, 2, 3, 4, 5, 6].map((n) => `<li class="it"><span class="nm">المرحلة ${STAGES[n]}</span><span class="code hint">t.me/${BOT}?start=stage${n}</span><button class="ib" data-link="${n}" title="نسخ رابط المرحلة ${STAGES[n]}" type="button">📋</button></li>`).join("")}</ul></details>
      <details class="rs-card" id="rs-audit"><summary>🧾 السجل (اسم وتاريخ، بلا أكواد)</summary><div id="rs-alog"><p class="hint">جاري التحميل…</p></div></details>
    </div>`;
    const $ = (s) => box.querySelector(s);
    const say = (el, m) => { el.textContent = m; };

    async function head(r) {
      on = r.on === true; $("#rs-bot").textContent = on ? "⏸️ إيقاف البوت" : "▶️ تشغيل البوت"; $("#rs-bot").setAttribute("aria-pressed", on ? "true" : "false");
      $("#rs-state").textContent = on ? "🟢 شغّال: الطالب يكتب اسمه ورقمه للبوت وياخذ كوده." : "⚪ مطفي: البوت ما يرد على الطلاب لحد ما تشغّله.";
      const st = (r.stages || []).filter((s) => s.total || s.free_codes || s.reserved);
      $("#rs-sum").innerHTML = st.length ? st.map((s) => {
        const left = s.total - s.assigned, short = left > s.free_codes;
        return `<span>المرحلة ${esc(STAGES[s.stage])}: ${s.total} بالقائمة · ${s.assigned} أخذوا كود · ${s.free_codes} كود للبوت${s.reserved ? ` · ${s.reserved} محجوز` : ""}${short ? ` <b class="warn">⚠️ ناقص ${left - s.free_codes} كود</b>` : ""}</span>`;
      }).join("") : "ماكو قائمة بعد.";
    }
    function item(r) {
      return `<li class="it" data-id="${esc(r.id)}" data-name="${esc(r.full_name)}" data-univ="${esc(r.univ_id)}">
        <span class="nm"><b>${esc(r.full_name)}</b> <span class="code">${esc(r.univ_id)}</span></span>
        <span class="chip">م${esc(r.stage_n)}</span>
        <span class="chip${r.assigned ? " on" : ""}">${r.assigned ? (r.bound ? "🟢 أخذ كوده" : "🟢 له كود") : "⚪ لسا"}</span>
        <button class="ib" data-a="edit" title="تصحيح الاسم أو الرقم" type="button">✏️</button>
        ${r.assigned ? '<button class="ib" data-a="reissue" title="اسحب الكود وأعطيه كود جديد" type="button">🔄</button>' : ""}</li>`;
    }
    async function load(more) {
      if (!more) off = 0;
      const q = $("#rs-q").value.trim(), fs = $("#rs-fs").value;
      const r = await api({ action: "roster_list", q: q || undefined, stage: fs ? +fs : undefined, off, lim: PAGE });
      if (r.status !== 200) { say($("#rs-cnt"), r.status === 403 ? "هذا للمالك بس." : `ما گدرت أجيب القائمة (${r.status}).`); return; }
      total = r.total; await head(r);
      const html = (r.rows || []).map(item).join("");
      if (more) $("#rs-list").insertAdjacentHTML("beforeend", html); else $("#rs-list").innerHTML = html;
      off += (r.rows || []).length;
      say($("#rs-cnt"), total ? `${total} طالب${total > off ? ` (معروض ${off})` : ""}` : "ماكو طلاب بهالبحث.");
      $("#rs-more").hidden = off >= total;
    }

    $("#rs-bot").onclick = async () => {
      if (!on && !confirm("تشغّل البوت للطلاب؟ كل من يكتب للبوت اسمه ورقمه الجامعي (وتطابق ويّا القائمة) ياخذ كوده.")) return;
      const r = await api({ action: "roster_bot", on: !on });
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      load(false);
    };

    // ───── حجز/تحرير أكواد مرحلة ─────
    const pool = async (reserve) => {
      const stage = +$("#rs-ps").value;
      if (!reserve && !confirm(`تحرّر كل أكواد المرحلة ${STAGES[stage]} (بلا اسم ولا استعمال) للبوت؟ لا تحرّر أكواد انطبعت أو انوزّعت.`)) return;
      const r = await api({ action: "codes_pool", stage, reserve });
      if (r.status !== 200) return say($("#rs-pm"), r.msg || "صار خطأ");
      say($("#rs-pm"), reserve ? `🔒 انحجز ${r.n} كود.` : `🤖 انحرر ${r.n} كود للبوت.`); auditLoaded = false; load(false);
    };
    $("#rs-rel").onclick = () => pool(false); $("#rs-res").onclick = () => pool(true);

    // ───── رفع الملف ─────
    $("#rs-file").onchange = async (ev) => {
      const f = ev.target.files[0]; parsed = null; $("#rs-up").hidden = true; $("#rs-prev").innerHTML = "";
      if (!f) return;
      $("#rs-prev").textContent = "جاري قراءة الملف…";
      try {
        parsed = await window.RosterParse.parseFile(f, +$("#rs-stage").value);
      } catch (e) { $("#rs-prev").innerHTML = `<p class="warn">${esc(e && e.user ? e.message : "ما گدرت أقرا الملف. تأكد إنه xlsx أو CSV سليم.")}</p>`; return; }
      const by = {}; parsed.rows.forEach((r) => { by[r.stage] = (by[r.stage] || 0) + 1; });
      $("#rs-prev").innerHTML = `<p><b>✅ ${parsed.rows.length} طالب جاهز</b>${Object.keys(by).length ? " — " + Object.keys(by).map((k) => `المرحلة ${esc(STAGES[k])}: ${by[k]}`).join(" · ") : ""}</p>` +
        (parsed.rows.length ? `<ul>${parsed.rows.slice(0, 5).map((r) => `<li class="it"><span class="nm">${esc(r.name)}</span><span class="code">${esc(r.univ)}</span><span class="chip">م${r.stage}</span></li>`).join("")}</ul>${parsed.rows.length > 5 ? `<p class="hint">… و${parsed.rows.length - 5} غيرهم</p>` : ""}` : "") +
        (parsed.errors.length ? `<details><summary class="warn">⚠️ ${parsed.errors.length} صف ما انقبل (ما راح ينرفع)</summary><ul>${parsed.errors.slice(0, 30).map((e) => `<li class="it">سطر ${e.line}: ${esc(e.why)}</li>`).join("")}</ul></details>` : "");
      $("#rs-up").hidden = !parsed.rows.length;
    };
    $("#rs-stage").onchange = () => { if ($("#rs-file").files[0]) $("#rs-file").onchange({ target: $("#rs-file") }); };
    $("#rs-up").onclick = async (ev) => {
      if (!parsed || !parsed.rows.length) return;
      const btn = ev.currentTarget; btn.disabled = true;
      const sum = { added: 0, updated: 0, kept: 0, bad: 0 }; let stop = "";
      for (let i = 0; i < parsed.rows.length; i += CHUNK) {
        say($("#rs-prev"), `جاري الرفع… ${Math.min(i, parsed.rows.length)} من ${parsed.rows.length}`);
        let r; try { r = await api({ action: "roster_import", rows: parsed.rows.slice(i, i + CHUNK).map((x) => ({ name: x.name, univ: x.univ, stage: x.stage })) }); } catch (e) { r = { status: 0 }; }
        if (r.status !== 200) { stop = r.status === 403 ? "هذا للمالك بس." : `وقف الرفع (${r.status || "انقطع النت"}). اللي انرفع قبل محفوظ — أعد رفع نفس الملف ويكمّل.`; break; }
        sum.added += r.added; sum.updated += r.updated; sum.kept += r.kept; sum.bad += (r.bad || []).length;
      }
      btn.disabled = false;
      $("#rs-prev").innerHTML = `<p>${stop ? "⚠️ " + esc(stop) : "✅ انرفعت القائمة."} انضاف ${sum.added} · تحدّث ${sum.updated} · بقى (أخذ كود) ${sum.kept}${sum.bad ? ` · ما انقبل ${sum.bad}` : ""}.</p>`;
      if (!stop) { parsed = null; $("#rs-up").hidden = true; $("#rs-file").value = ""; }
      load(false); auditLoaded = false;
    };

    // ───── إضافة طالب ─────
    $("#rs-add").onclick = async () => {
      const name = $("#rs-an").value.trim(), univ = $("#rs-au").value.trim(), stage = +$("#rs-as").value;
      if (name.length < 3 || univ.length < 3) return say($("#rs-addm"), "اكتب الاسم الثلاثي والرقم الجامعي.");
      const r = await api({ action: "roster_import", rows: [{ name, univ, stage }] });
      if (r.status !== 200) return say($("#rs-addm"), r.msg || "صار خطأ");
      say($("#rs-addm"), r.added ? "✅ انضاف." : r.updated ? "✅ الرقم موجود: تحدّث الاسم والمرحلة." : r.kept ? "الطالب أخذ كوده قبل، استعمل ✏️ من القائمة للتصحيح." : "ما انقبل (تأكد من الاسم والرقم).");
      if (r.added || r.updated) { $("#rs-an").value = ""; $("#rs-au").value = ""; } load(false); auditLoaded = false;
    };

    // ───── البحث والقائمة ─────
    let tm = 0; $("#rs-q").oninput = () => { clearTimeout(tm); tm = setTimeout(() => load(false), 300); };
    $("#rs-fs").onchange = () => load(false);
    $("#rs-more").onclick = () => load(true);
    box.addEventListener("click", async (ev) => {
      const lk = ev.target.closest("[data-link]");
      if (lk) { try { await copy(`https://t.me/${BOT}?start=stage${lk.dataset.link}`); const o = lk.textContent; lk.textContent = "✔️"; setTimeout(() => (lk.textContent = o), 1200); } catch (e) { prompt("انسخ:", `https://t.me/${BOT}?start=stage${lk.dataset.link}`); } return; }
      const cp = ev.target.closest("[data-copy]");
      if (cp) { try { await copy(cp.dataset.copy); cp.textContent = "✔️ اننسخ"; } catch (e) { prompt("انسخ:", cp.dataset.copy); } return; }
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const li = b.closest("li.it"), id = li.dataset.id, name = li.dataset.name, a = b.dataset.a;
      if (a === "edit") {
        const nn = prompt(`الاسم الثلاثي لـ «${name}»:`, name); if (nn === null) return;
        const uu = prompt("الرقم الجامعي:", li.dataset.univ); if (uu === null) return;
        const r = await api({ action: "roster_edit", id, full_name: nn.trim() || name, univ_id: uu.trim() || li.dataset.univ });
        if (r.status !== 200) return alert(r.msg || "صار خطأ");
        auditLoaded = false; return load(false);
      }
      if (a === "reissue") {
        if (!confirm(`تسحب كود «${name}» وتعطيه كود جديد؟ القديم يبطل فوراً وأجهزته تطلع.`)) return;
        const r = await api({ action: "roster_reissue", id });
        if (r.status !== 200) return alert(r.msg || "صار خطأ");
        $("#rs-nc").innerHTML = `<div class="newcode" role="status"><span>الكود الجديد لـ «${esc(name)}»:</span> <b class="code">${esc(r.code)}</b> <button class="btn ghost" data-copy="${esc(r.code)}" type="button">📋 نسخ</button><span class="hint">${r.sent ? "وصل للطالب بالبوت ✅" : "ما وصل بالبوت (حسابه مو مربوط): دزّه له أنت."}</span></div>`;
        auditLoaded = false; $("#rs-nc").scrollIntoView({ block: "nearest" });
      }
    });

    // ───── السجل ─────
    $("#rs-audit").addEventListener("toggle", async (ev) => {
      if (!ev.target.open || auditLoaded) return;
      const r = await api({ action: "roster_audit", lim: 100 });
      if (r.status !== 200) { $("#rs-alog").innerHTML = '<p class="hint">ما گدرت أجيب السجل.</p>'; return; }
      auditLoaded = true;
      $("#rs-alog").innerHTML = (r.rows || []).length ? `<ul>${r.rows.map((x) => `<li class="it"><span class="nm">${esc(EV[x.event] || x.event)}${x.name ? ` — <b>${esc(x.name)}</b>` : ""}</span><span class="hint">${esc(when(x.at))}</span></li>`).join("")}</ul>` : '<p class="hint">ماكو عمليات بعد.</p>';
    });

    load(false);
  }
  window.AdminRoster = { mount };
})();
