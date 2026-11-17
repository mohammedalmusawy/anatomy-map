// 🔑 75 (مسودة): «طلبات الأسماء» + «سجل دخول الطلاب» + «أرقام القسم» لحساب الإدارة المدمج — واجهة بس، كل الصلاحيات بالسيرفر.
// window.AdminNames = { requests(box, ops), logins(box, ops), stats(box, sb) }
//   ops = { list() → {status, rows}, decide(req, accept, rosterId) → {status, ok, rotated, msg}, logins() → {status, rows} }
//   المالك: ops من دالة students-admin (roster_name_*). المساعد: ops من دالة supervisor (name_requests / name_decide / student_logins).
// الأكواد ما تبين هنا أبداً: الطالب يستلم كوده على جهازه هو بعد الموافقة.
(function () {
  "use strict";
  const C = window.STUDY_CLOUD || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KIND = { noid: "اسم بلا رقم جامعي", ambiguous: "اسم مكرر — اختر الطالب", other_device: "طالب أخذ كوده من جهاز ثاني", mismatch: "إملاء مختلف عن القائمة" };
  const STAGES = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];
  const when = (t) => { try { return new Date(t).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", dateStyle: "short", timeStyle: "short" }); } catch (e) { return String(t).slice(0, 16); } };
  if (!document.getElementById("nm75-css")) {
    const el = document.createElement("style"); el.id = "nm75-css";
    el.textContent = `.nm75{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}.nm75>*{min-width:0}
.nm75 .q{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:14px;padding:12px 14px;display:grid;gap:8px}
.nm75 .q h4{margin:0;overflow-wrap:anywhere}.nm75 .q small,.nm75 .hint{color:var(--muted,#666)}
.nm75 label.c{display:flex;gap:8px;align-items:center;min-height:44px;padding:4px 8px;border:1px solid var(--line,#ddd);border-radius:12px;cursor:pointer;overflow-wrap:anywhere}
.nm75 label.c input{width:20px;height:20px;flex:none}
.nm75 .row{display:flex;flex-wrap:wrap;gap:8px}.nm75 .btn{min-height:48px;padding:0 18px;flex:1 1 140px}
.nm75 .chip{display:inline-block;padding:0 8px;border:1px solid var(--line,#ddd);border-radius:999px;font-size:.85rem;color:var(--muted,#666)}
.nm75 .warn{color:var(--bad,#B3261E)}.nm75 ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.nm75 li.l{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:space-between;border:1px solid var(--line,#ddd);border-radius:12px;padding:8px 10px}
.nm75 .kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.nm75 .kp div{border:1px solid var(--line,#ddd);border-radius:12px;padding:10px;text-align:center}.nm75 .kp b{display:block;font-size:1.4rem}`;
    document.head.appendChild(el);
  }

  async function requests(box, ops) {
    box.innerHTML = '<div class="nm75"><p class="hint" role="status">لحظة…</p></div>';
    const root = box.firstElementChild;
    const r = await ops.list();
    if (r.status !== 200) { root.innerHTML = `<p class="hint">${r.status === 403 ? "هذا مو من صلاحياتك." : "ما گدرت أجيب الطلبات."}</p>`; return; }
    const rows = r.rows || [];
    root.innerHTML = `<p class="hint">${rows.length ? `${rows.length} طلب ينتظر قرارك. الموافقة تربط الكود بجهاز الطالب نفسه بس.` : "ماكو طلبات هسه ✅"}</p>` +
      rows.map((q) => {
        const cands = q.cands || [], pre = cands.find((c) => c.cand && !c.assigned) || (cands.length === 1 && !cands[0].assigned ? cands[0] : null);   // الصف المعطى كود ما ينختار مسبقاً
        return `<div class="q" data-id="${esc(q.id)}"><h4>«${esc(q.typed_name)}»</h4>
          <small>${esc(KIND[q.kind] || q.kind)} · ${esc(when(q.created_at))}${q.attempts > 1 ? ` · ${esc(q.attempts)} محاولات` : ""}</small>
          ${q.auto_rej > 0 ? `<p class="hint">+${esc(q.auto_rej)} طلبات زايدة لنفس الاسم انرفضت تلقائياً</p>` : ""}
          ${q.dup > 1 ? `<p class="warn">⚠️ ${esc(q.dup)} طلبات لنفس الاسم من أجهزة مختلفة — تأكد من الطالب قبل الموافقة</p>` : ""}
          ${cands.some((c) => c.assigned) || q.kind === "other_device" ? '<p class="warn">⚠️ بين الأسماء طالب أخذ كوده قبل (من الموقع أو البوت). إذا وافقت عليه ينتقل لجهاز جديد ويتبدّل كوده والقديم يبطل. اختاره بنفسك وأكّد.</p>' : ""}
          ${cands.length ? cands.map((c) => `<label class="c"><input type="radio" name="r${esc(q.id)}" value="${esc(c.id)}"${pre && pre.id === c.id ? " checked" : ""}>
              <span><b>${esc(c.name)}</b> <span class="chip">م${esc(STAGES[c.stage] || c.stage)}</span> <span class="chip">${c.univ ? esc(c.univ) : "بلا رقم"}</span>${c.assigned ? ' <span class="chip as">أخذ كود</span>' : ""}</span></label>`).join("")
            : '<p class="warn">ماكو اسم قريب بالقائمة — ارفض الطلب أو أضف الطالب للقائمة أول.</p>'}
          <div class="row"><button class="btn" data-a="yes" type="button"${cands.length ? "" : " disabled"}>✅ وافق</button><button class="btn ghost" data-a="no" type="button">❌ ارفض</button></div>
          <p class="hint" role="status" aria-live="polite"></p></div>`;
      }).join("");
    root.onclick = async (ev) => {
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const card = b.closest(".q"), id = +card.dataset.id, m = card.querySelector("p[role=status]"), yes = b.dataset.a === "yes";
      const pick = card.querySelector("input[type=radio]:checked");
      if (yes && !pick) { m.textContent = "اختر الطالب أول."; return; }
      const pickedAssigned = yes && pick && pick.closest("label").querySelector(".chip.as");
      if (pickedAssigned && !confirm("هذا الطالب أخذ كوده قبل. تبدّل كوده وتنقله لجهاز جديد؟ الجهاز القديم يطلع.")) return;
      card.querySelectorAll("button").forEach((x) => (x.disabled = true)); m.textContent = "لحظة…";
      const d = await ops.decide(id, yes, yes && pick ? pick.value : null, !!pickedAssigned);
      if (d.status !== 200) { m.textContent = d.msg || "ما انحفظ."; card.querySelectorAll("button").forEach((x) => (x.disabled = false)); return; }
      card.innerHTML = `<p>${yes ? "✅ انوافق." + (d.rotated ? " الكود انبدّل." : "") + " الكود يوصل لجهاز الطالب لحاله." : "❌ انرفض."}</p>`;
    };
  }

  async function logins(box, ops) {
    box.innerHTML = '<div class="nm75"><p class="hint" role="status">لحظة…</p></div>';
    const r = await ops.logins();
    if (r.status !== 200) { box.firstElementChild.innerHTML = '<p class="hint">ما گدرت أجيب السجل.</p>'; return; }
    box.firstElementChild.innerHTML = (r.rows || []).length ? `<ul>${r.rows.map((x) => `<li class="l"><span><b>${esc(x.full_name || "—")}</b> <span class="chip">${x.via === "name" ? "بالاسم" : "بالكود"}</span></span><span class="hint">${esc(when(x.at))}</span></li>`).join("")}</ul>` : '<p class="hint">ماكو دخول مسجّل بعد.</p>';
  }

  // أرقام القسم (مجمّعة بس، k ≥ 5) — نفس عرض AdminDept.stats بس بلا signOut عند الفشل (هذا حساب مساعد أيضاً)
  async function stats(box, sb) {
    box.innerHTML = '<div class="nm75"><p class="hint">لحظة…</p></div>'; const root = box.firstElementChild;
    const { data: { session } } = await sb.auth.getSession();
    let d = {}, st = 0;
    try {
      const r = await fetch(`${C.url}/functions/v1/dept-stats`, { method: "POST", headers: { apikey: C.anon, Authorization: "Bearer " + (session ? session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify({ action: "stats" }) });
      st = r.status; d = await r.json().catch(() => ({}));
    } catch (e) { st = 0; }
    if (st !== 200) { root.innerHTML = `<p class="hint">${esc(st === 403 && d.error === "off" ? "اللوحة مو مفعّلة بعد." : d.msg || "ما گدرنا نفتح الأرقام.")}</p>`; return; }
    const n = (x) => (x === null || x === undefined ? '<span title="أقل من 5 — مخفي للخصوصية">—</span>' : esc(x));
    const a = d.active_students, last = (a && a.daily || []).slice(-7), top = d.top_lectures || {}, hard = d.hardest_topics || [];
    root.innerHTML = `<p class="hint">أرقام مجمّعة بلا أسماء. أي مجموعة أقل من ${esc(d.k_min)} طلاب ما تطلع (—). للاطّلاع فقط.</p>
      ${a ? `<div class="kp"><div><b>${n(a.registered)}</b><span>مسجّلون بالكود</span></div><div><b>${n(last.length ? last[last.length - 1].students : null)}</b><span>نشطون آخر يوم</span></div><div><b>${n((a.weekly || []).slice(-1)[0] && (a.weekly || []).slice(-1)[0].students)}</b><span>نشطون هذا الأسبوع</span></div></div>` : ""}
      ${d.top_lectures ? `<h4>📚 الأكثر قراءة لكل مادة (30 يوم)</h4>${Object.keys(top).length ? Object.entries(top).map(([sub, l]) => `<p><b>${esc(sub)}</b>: ${l.map((x) => `${esc(x.lecture)} (${n(x.people)})`).join("، ")}</p>`).join("") : '<p class="hint">ماكو بيانات بعد.</p>'}` : ""}
      ${d.hardest_topics ? `<h4>🧩 الموضوعات الأصعب</h4><ul>${hard.map((x) => `<li class="l"><span>${esc(x.quiz)}</span><span>${Math.round(x.wrong_rate * 100)}%</span></li>`).join("") || '<li class="hint">ماكو بيانات بعد.</li>'}</ul>` : ""}
      ${!a && !d.top_lectures && !d.hardest_topics ? '<p class="hint">الأجزاء لسا ما انفعّلت.</p>' : ""}
      <p class="hint">⚠️ للمراجعة فقط — مو توقّع لأسئلة الامتحان.</p>`;
  }

  window.AdminNames = { requests, logins, stats };
})();
