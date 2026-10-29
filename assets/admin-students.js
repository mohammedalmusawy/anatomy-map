// 🎓 تبويب «الطلاب» بلوحة الإدارة (29/10/2026) — جاهز ومو مربوط بـ admin.js بعد.
// الربط بعدين (بعد «وافقت»): بـ admin.js ← tabs.students = "🎓 الطلاب" ← AdminStudents.mount(pane, sb).
// كل شي يمر بدالة students-admin (is_admin بالسيرفر). الأكواد تنعرض من التشفير، وما تنحفظ بالمتصفح.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const SITE = "https://mohammedalmusawy.github.io/anatomy-map/";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (code) => `${SITE}?code=${encodeURIComponent(code)}`;
  const waText = (name, code) => `أهلاً ${name.split(" ")[0]}، هذا كودك لموقع دروس تقنيات الأشعة: ${code} — أو افتح الرابط مباشرة: ${link(code)} (يشتغل على 3 أجهزة بالكثير، لا تشاركه)`;
  const ago = (t) => { if (!t) return "—"; const d = Math.floor((Date.now() - new Date(t)) / 864e5); return d <= 0 ? "اليوم" : d === 1 ? "أمس" : `قبل ${d} يوم`; };
  const copy = async (s, btn) => { try { await navigator.clipboard.writeText(s); const o = btn.textContent; btn.textContent = "✔️"; setTimeout(() => (btn.textContent = o), 1200); } catch (e) { prompt("انسخ:", s); } };

  async function mount(pane, sb) {
    const api = async (body) => {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${C.url}/functions/v1/students-admin`, { method: "POST",
        headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    };
    pane.innerHTML = `<h2>🎓 الطلاب</h2>
      <p class="hint">ألصق الأسماء الثلاثية (كل اسم بسطر) ← كود قصير لكل طالب. الاسم المكرر (حتى بفرق أ/ا أو ة/ه) ما ينسواله كود ثاني.</p>
      <textarea id="st-names" rows="5" placeholder="أحمد علي حسين&#10;زينب محمد كاظم"></textarea>
      <p><button class="btn" id="st-make">➕ سوّي الأكواد</button> <button class="btn ghost" id="st-csv">⬇️ نسخة CSV (بلا أكواد)</button></p>
      <div id="st-out"></div>
      <h3>📨 طلبات الكود من البوت <small id="st-req-on"></small></h3><div id="st-req"></div>
      <h3>القائمة</h3><div class="scroll-x" id="st-list"><p class="hint">…</p></div>`;
    const $ = (s) => pane.querySelector(s);
    const actions = (s) => `<button class="ib" data-a="copy" title="نسخ">📋</button> <button class="ib" data-a="link" title="رابط دخول مباشر">🔗</button> ` +
      `<a class="ib" title="واتساب برسالة جاهزة" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText(s.full_name, s.code || ""))}">💬</a>`;

    async function list() {
      const r = await api({ action: "list" });
      if (r.status !== 200) { $("#st-list").innerHTML = `<p class="hint">ما گدرت أجيب القائمة (${r.status}).</p>`; return; }
      const rows = r.students || [];
      $("#st-list").innerHTML = rows.length ? `<table class="adm"><thead><tr><th>الاسم الثلاثي</th><th>الكود</th><th>دزّه</th><th>آخر دخول</th><th>الأجهزة</th><th>السلسلة</th><th>إدارة</th></tr></thead><tbody>` +
        rows.map((s) => `<tr data-id="${esc(s.id)}" data-code="${esc(s.code || "")}" data-name="${esc(s.full_name)}">
          <td><b>${esc(s.full_name)}</b>${s.status === "paused" ? " <small>⏸️ موقوف</small>" : ""}${s.name_fix ? `<br><small>✏️ طلب تصحيح: ${esc(s.name_fix)} <button class="ib" data-a="fixok" title="طبّق التصحيح">✅</button></small>` : ""}</td>
          <td><span class="code" dir="ltr">${esc(s.code || "؟")}</span></td><td>${actions(s)}</td>
          <td>${ago(s.last_seen)}</td><td>${s.devices}/${r.max_devices} ${s.devices ? '<button class="ib" data-a="reset" title="تصفير الأجهزة">♻️</button>' : ""}</td><td>${s.streak ? "🔥 " + s.streak : "—"}</td>
          <td><button class="ib" data-a="rotate" title="كود جديد">🔄</button> <button class="ib" data-a="${s.status === "paused" ? "resume" : "pause"}" title="${s.status === "paused" ? "تشغيل" : "إيقاف"}">${s.status === "paused" ? "▶️" : "⏸️"}</button> <button class="ib" data-a="delete" title="حذف كامل">🗑️</button></td></tr>`).join("") +
        "</tbody></table>" : '<p class="hint">ماكو طلاب بعد.</p>';
    }
    async function requests() {
      const r = await api({ action: "list_requests" });
      $("#st-req-on").textContent = r.on ? "· مفعّل" : "· مطفي (يشتغل لما تگول «فعّل طلب الأكواد»)";
      const rows = (r.requests || []).filter((x) => x.status === "pending");
      $("#st-req").innerHTML = rows.length ? `<table class="adm"><tbody>` + rows.map((x) => `<tr data-req="${x.id}"><td><b>${esc(x.full_name)}</b>${x.tg_username ? ` <small dir="ltr">@${esc(x.tg_username)}</small>` : ""}${x.dup ? " <small>⚠️ مكرر</small>" : ""}</td><td>${ago(x.at)}</td>
        <td><button class="ib" data-r="approve_request" title="وافق وأرسل الكود بالبوت">✅</button> <button class="ib" data-r="reject_request" title="رفض">❌</button></td></tr>`).join("") + "</tbody></table>" : '<p class="hint">ماكو طلبات.</p>';
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
    $("#st-csv").onclick = async () => {
      const r = await api({ action: "export_csv" });
      if (!r.csv) return alert("صار خطأ");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      a.download = `الطلاب-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };
    pane.addEventListener("click", async (ev) => {
      const rq = ev.target.closest("[data-r]");
      if (rq) {
        const id = Number(rq.closest("tr").dataset.req);
        const r = await api({ action: rq.dataset.r, id });
        alert(r.msg || (r.ok ? (r.full_name ? `✅ ${r.full_name}${r.sent ? " — وصله الكود بالبوت" : " — ⚠️ ما وصلته رسالة البوت، دزّه يدوي"}` : "تم") : "صار خطأ"));
        requests(); list(); return;
      }
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const tr = b.closest("tr"), id = tr.dataset.id, code = tr.dataset.code, name = tr.dataset.name, a = b.dataset.a;
      if (a === "copy") return copy(code, b);
      if (a === "link") return copy(link(code), b);
      if (a === "rotate" && !confirm(`كود جديد لـ «${name}»؟ القديم يبطل والأجهزة تتصفّر.`)) return;
      if (a === "pause" && !confirm(`إيقاف «${name}»؟ يطلع من كل أجهزته.`)) return;
      if (a === "reset" && !confirm(`تصفير أجهزة «${name}»؟`)) return;
      let body = { action: a, id };
      if (a === "fixok") body = { action: "rename", id };
      if (a === "delete") {
        const typed = prompt(`🗑️ حذف كامل لـ «${name}» وكل بياناته (ما يرجع). اكتب الاسم الثلاثي بالضبط حتى تأكد:`);
        if (typed === null) return;
        body = { action: "delete", id, confirm: true, confirm_name: typed };
      }
      const r = await api(body);
      if (r.status !== 200) return alert(r.msg || "صار خطأ");
      if (a === "rotate") alert(`الكود الجديد: ${r.code}`);
      list();
    });
    list(); requests();
  }
  window.AdminStudents = { mount };
})();
