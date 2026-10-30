// 👥 تبويب «الفريق والشكر» بلوحة الإدارة (29/10/2026) — محمد (أو مساعد عنده صلاحية الفريق) يضيف ويعدّل بدون كود.
// الربط (يسويه وكيل الدخول والصلاحيات): tabs.people = "👥 الفريق والشكر" ← AdminPeople.mount(pane, sb).
// الجدول public.people (RLS: الكتابة بس لـ staff_can('team'))، والصور bucket «people» (عام للقراءة، ≤ 60 KB، WebP).
// الصورة تنقص دائرة وتنضغط بالمتصفح قبل الرفع (WebP < 50 KB؛ JPEG احتياط لـ Safari القديم). ماكو حذف: «إخفاء» بس.
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const GRP = [["team", "👥 فريق المنصة"], ["doctors", "🩺 أطباء دعموا بالصور"], ["patrons", "🏛️ رعاة المنصة"], ["special", "🤝 شكر خاص"], ["supporters", "💛 داعمون"], ["supervision", "🔬 الإشراف العلمي"]];
  const TAGS = [["", "— لا —"], ["chest-abdomen", "الصدر والبطن"], ["spine-joints", "الفقرات والمفاصل"], ["fractures", "الكسور"], ["paeds", "الأطفال"]];
  const MAX = 50 * 1024, PREFIX = ["الصيدلانية", "الصيدلاني", "الدكتورة", "الدكتور", "أ.د.", "د.", "م."];
  const mono = (name) => {
    let n = String(name || "").trim(), again = true;
    while (again) { again = false; for (const p of PREFIX) if (n.startsWith(p)) { n = n.slice(p.length).trim(); again = true; } }
    return (n.match(/\p{L}/u) || ["•"])[0];
  };
  const CSS = `<style>
  .ap-f{display:grid;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0 18px}
  .ap-f [hidden]{display:none!important}
  .ap-f label{display:grid;gap:4px;margin:0;font-size:14px;color:var(--muted)}
  .ap-f input[type=text],.ap-f select{min-height:44px;width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
  .ap-chk{display:flex!important;align-items:center;gap:8px;min-height:44px;color:var(--ink)!important}
  .ap-chk input{width:20px;height:20px}
  .ap-ph{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .ap-note{color:var(--muted)}
  .ap-av{flex:none;width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--line);background:var(--brand-soft);display:inline-flex;align-items:center;justify-content:center;color:var(--brand);font:800 1.3rem/1 var(--title-font,system-ui)}
  .ap-row .ap-av{width:44px;height:44px;font-size:1.05rem}
  .ap-b{min-height:44px;min-width:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-weight:700;font-size:14px;font-family:inherit;cursor:pointer}
  .ap-b.pri{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
  .ap-b:disabled{opacity:.45;cursor:default}
  .ap-b:focus-visible,.ap-h:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .ap-acts{display:flex;flex-wrap:wrap;gap:8px}
  .ap-g{margin:16px 0 4px;font-size:16px}
  .ap-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .ap-row{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px 10px}
  .ap-row.off{opacity:.6}
  .ap-row.drag{box-shadow:0 6px 18px rgba(0,0,0,.14);border-color:var(--brand)}
  .ap-h{flex:none;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;color:var(--muted);font-size:20px;border-radius:10px;user-select:none}
  .ap-t{flex:1;min-width:0;display:grid}
  .ap-t b{overflow-wrap:anywhere}
  .ap-t small{color:var(--muted)}
  .ap-tag{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:0 8px;margin-inline-start:6px;color:var(--muted)}
  .ap-msg{min-height:1.4em;margin:0;font-size:14px}.ap-msg.ok{color:var(--ok)}.ap-msg.bad{color:var(--bad)}
  @media (max-width:560px){.ap-row{flex-wrap:wrap}.ap-row .ap-acts{width:100%;justify-content:flex-end}}
  </style>`;

  // 📷 قص دائري تلقائي + ضغط (بالمتصفح قبل الرفع)
  async function bitmap(file) {
    if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) {} }
    return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error("الصيغة ما مدعومة — صدّر الصورة JPG أو PNG وجرّب.")); im.src = u; });
  }
  const toBlob = (cv, type, q) => new Promise((ok) => cv.toBlob(ok, type, q));
  async function makePhoto(file) {
    if (!/^image\//.test(file.type)) throw new Error("الملف مو صورة.");
    if (file.size > 25 * 1024 * 1024) throw new Error("الصورة كبيرة كلش (أكثر من 25 MB).");
    const img = await bitmap(file), w = img.width, h = img.height, side = Math.min(w, h);
    const sx = (w - side) / 2, sy = h > w ? (h - side) * 0.3 : (h - side) / 2;   // الصورة الطولية: الوجه عادة بالثلث الفوقاني
    for (const size of [320, 256, 200, 160]) {
      const cv = document.createElement("canvas"); cv.width = cv.height = size;
      const x = cv.getContext("2d"); x.imageSmoothingQuality = "high";
      x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.closePath(); x.clip();
      x.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
        let b = await toBlob(cv, "image/webp", q), ext = "webp";
        if (!b || b.type !== "image/webp") {   // Safari القديم ما يصدّر WebP ← JPEG بخلفية بيضاء (الصفحة تدوّرها بالـ CSS)
          const c2 = document.createElement("canvas"); c2.width = c2.height = size;
          const y = c2.getContext("2d"); y.fillStyle = "#fff"; y.fillRect(0, 0, size, size); y.drawImage(cv, 0, 0);
          b = await toBlob(c2, "image/jpeg", q); ext = "jpg";
        }
        if (b && b.size < MAX) return { blob: b, ext, size };
      }
    }
    throw new Error("ما گدرت أصغّر الصورة تحت 50 KB.");
  }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10));
  async function upload(sb, ph) {
    const path = `p/${uuid()}.${ph.ext}`;
    const { error } = await sb.storage.from("people").upload(path, ph.blob, { contentType: ph.ext === "webp" ? "image/webp" : "image/jpeg", cacheControl: "31536000", upsert: false });
    if (error) throw new Error("ما انرفعت الصورة: " + (error.message || error));
    return path;
  }
  // صفحة الفريق وسطر الأطلس عندهم كاش بالجهاز ← نمسحه حتى محمد يشوف التعديل فوراً
  const dropCache = () => { try { Object.keys(localStorage).forEach((k) => { if (k === "t:people" || k.startsWith("t:c:people?")) localStorage.removeItem(k); }); } catch (e) {} };

  async function mount(pane, sb) {
    const C = window.STUDY_CLOUD || {};
    const man = document.querySelector('link[rel="manifest"]');   // جذر الموقع (يشتغل من /admin/ أو أي صفحة ثانية)
    const root = man ? new URL(".", man.href).href : new URL("../", location.href).href;
    const src = (ph) => !ph ? "" : ph.startsWith("assets/") ? root + ph : `${C.url}/storage/v1/object/public/people/${ph}`;
    const av = (p) => p.photo ? `<img class="ap-av" src="${esc(src(p.photo))}" alt="" width="44" height="44" loading="lazy">` : `<span class="ap-av" aria-hidden="true">${esc(mono(p.name))}</span>`;
    pane.innerHTML = CSS + `<h2>👥 الفريق والشكر</h2>
      <p class="hint">الأسماء هنا تطلع بصفحة «فريق المنصة» (والأطباء اللي إلهم «قسم الأطلس» يطلعون بسطر «🙏 بدعم وتحفيز» آخر صفحات الأطلس). ماكو حذف: «إخفاء» يشيله من الموقع ويبقى هنا. رتّب بالسحب من ⠿ أو بالأسهم.</p>
      <form class="ap-f" id="ap-form" novalidate>
        <b id="ap-ft">➕ إضافة شخص</b>
        <label>الاسم<input type="text" id="ap-name" maxlength="120" required autocomplete="off"></label>
        <label>الصفة / الاختصاص (اختياري)<input type="text" id="ap-title" maxlength="120" autocomplete="off" placeholder="مثل: جراحة العظام والمفاصل"></label>
        <label>كلمة شكر (اختياري، سطر قصير) <small id="ap-note-n" aria-live="polite">0/80</small><input type="text" id="ap-note" maxlength="80" autocomplete="off" placeholder="مثل: شكراً لدعمك الطلاب بصورك"></label>
        <label>القسم<select id="ap-grp">${GRP.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label>
        <label id="ap-tagw">قسم الأطلس (اختياري — يطلع اسمه بسطر الشكر آخر صفحات الأطلس)<select id="ap-tag">${TAGS.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label>
        <div class="ap-ph"><span class="ap-av" id="ap-prev" aria-hidden="true">؟</span>
          <label style="flex:1">صورة (اختياري — تنقص دائرة وتنضغط وحدها)<input type="file" id="ap-file" accept="image/*"></label>
          <button type="button" class="ap-b" id="ap-nophoto" hidden>بلا صورة</button></div>
        <label class="ap-chk"><input type="checkbox" id="ap-vis" checked> يطلع بالموقع</label>
        <div class="ap-acts"><button type="submit" class="ap-b pri" id="ap-save">💾 حفظ</button><button type="button" class="ap-b" id="ap-cancel" hidden>إلغاء التعديل</button></div>
        <p class="ap-msg" id="ap-msg" role="status" aria-live="polite"></p>
      </form>
      <div id="ap-list"><p class="hint">لحظة…</p></div>`;
    const $ = (s) => pane.querySelector(s);
    let headOn = false;   // 🏛️ ظهور رئيس القسم المنشور (للرعاة)
    let rows = [], edit = null, photo = null /* {blob,ext,path?} جديدة */, clear = false, blobUrl = null;
    // 💬 عدّاد «كلمة شكر» (80 حرف كحد أقصى)
    $("#ap-note").addEventListener("input", () => { $("#ap-note-n").textContent = $("#ap-note").value.length + "/80"; });
    const msg = (t, k) => { const m = $("#ap-msg"); m.textContent = t; m.className = "ap-msg" + (k ? " " + k : ""); };
    const syncTag = () => { $("#ap-tagw").hidden = $("#ap-grp").value !== "doctors"; };
    $("#ap-grp").onchange = syncTag;

    function preview() {
      const pv = $("#ap-prev"), cur = edit && !clear ? edit.photo : null;
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      if (photo) { blobUrl = URL.createObjectURL(photo.blob); pv.outerHTML = `<img class="ap-av" id="ap-prev" src="${blobUrl}" alt="">`; }
      else if (cur) pv.outerHTML = `<img class="ap-av" id="ap-prev" src="${esc(src(cur))}" alt="">`;
      else pv.outerHTML = `<span class="ap-av" id="ap-prev" aria-hidden="true">${esc(mono($("#ap-name").value) || "؟")}</span>`;
      $("#ap-nophoto").hidden = !(photo || cur);
    }
    $("#ap-name").oninput = () => { if (!photo && !(edit && edit.photo && !clear)) preview(); };
    $("#ap-file").onchange = async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      msg("⏳ أجهّز الصورة…");
      try { photo = await makePhoto(f); clear = false; preview(); msg(`✔️ الصورة جاهزة (${Math.round(photo.blob.size / 1024)} KB، ${photo.size}×${photo.size}) — تنرفع وقت الحفظ.`, "ok"); }
      catch (e) { photo = null; ev.target.value = ""; msg("⚠️ " + e.message, "bad"); }
    };
    $("#ap-nophoto").onclick = () => { photo = null; clear = true; $("#ap-file").value = ""; preview(); };

    function resetForm() {
      edit = null; photo = null; clear = false; $("#ap-form").reset(); $("#ap-vis").checked = true; $("#ap-note-n").textContent = "0/80";
      $("#ap-ft").textContent = "➕ إضافة شخص"; $("#ap-cancel").hidden = true; syncTag(); preview();
    }
    $("#ap-cancel").onclick = () => { resetForm(); msg(""); };
    function startEdit(p) {
      edit = p; photo = null; clear = false;
      $("#ap-name").value = p.name; $("#ap-title").value = p.title || ""; $("#ap-note").value = p.note || ""; $("#ap-note").dispatchEvent(new Event("input")); $("#ap-grp").value = p.grp; $("#ap-tag").value = p.tag || "";
      $("#ap-vis").checked = !!p.visible; $("#ap-file").value = "";
      $("#ap-ft").textContent = "✏️ تعديل: " + p.name; $("#ap-cancel").hidden = false; syncTag(); preview(); msg("");
      $("#ap-form").scrollIntoView({ behavior: "smooth", block: "start" }); $("#ap-name").focus({ preventScroll: true });
    }

    $("#ap-form").onsubmit = async (ev) => {
      ev.preventDefault();
      const name = $("#ap-name").value.trim().replace(/\s+/g, " ");
      if (name.length < 2) { msg("⚠️ اكتب الاسم.", "bad"); $("#ap-name").focus(); return; }
      const grp = $("#ap-grp").value;
      const row = { name, title: $("#ap-title").value.trim().replace(/\s+/g, " "), note: $("#ap-note").value.trim().replace(/\s+/g, " ").slice(0, 80), grp, tag: grp === "doctors" ? $("#ap-tag").value : "", visible: $("#ap-vis").checked };
      if (grp === "patrons") row.patron = true;   // 🏛️ الراعي يبقى راعي (ما يطلع وهو مطفي، حتى لو انتقل لمجموعة ثانية)
      $("#ap-save").disabled = true; msg("⏳ أحفظ…");
      try {
        if (photo) row.photo = photo.path || (photo.path = await upload(sb, photo));   // إعادة المحاولة ما ترفع نسخة ثانية
        else if (clear) row.photo = null;
        if (edit) {
          if (edit.grp !== grp) row.sort = nextSort(grp);
          const { error } = await sb.from("people").update(row).eq("id", edit.id);
          if (error) throw error;
        } else {
          row.sort = nextSort(grp);
          const { error } = await sb.from("people").insert(row);
          if (error) throw error;
        }
        const pat = grp === "patrons" || (edit && edit.patron);
        dropCache(); msg((edit ? "✅ انحفظ التعديل." : "✅ انضاف.") + (pat && row.visible && !headOn ? " يظهر لما يتفعّل ظهور رئيس القسم." : ""), "ok"); resetForm(); await load();
      } catch (e) { msg("⚠️ ما انحفظ: " + (e.message || e), "bad"); }
      finally { $("#ap-save").disabled = false; }
    };
    const nextSort = (grp) => rows.filter((r) => r.grp === grp).reduce((m, r) => Math.max(m, r.sort || 0), 0) + 10;

    async function load() {
      const { data, error } = await sb.from("people").select("*").order("grp").order("sort");   // 🏛️ * ← patron/name_en (54) بلا ما ينكسر قبل الهجرة
      try { const { data: s } = await sb.from("settings").select("value").eq("key", "dept_head").maybeSingle(); headOn = !!(s && s.value && s.value.on === true); } catch (e) { headOn = false; }
      if (error) { $("#ap-list").innerHTML = `<p class="hint">ما گدرت أجيب القائمة (${esc(error.message)}).</p>`; return; }
      rows = data || []; draw();
    }
    function draw(focus) {
      $("#ap-list").innerHTML = GRP.map(([k, t]) => {
        const xs = rows.filter((r) => r.grp === k).sort((a, b) => a.sort - b.sort);
        return `<h3 class="ap-g">${t} <small class="hint">(${xs.length})</small></h3>` + (k === "patrons" ? `<p class="hint">رؤساء القسم السابقون. يطلعون بالموقع بس وقت ما ظهور رئيس القسم مفعّل.${headOn ? "" : " (هسه مطفي)"}</p>` : "") + (xs.length ? `<ul class="ap-list" data-grp="${k}">` + xs.map((p, i) => `
          <li class="ap-row${p.visible ? "" : " off"}" data-id="${p.id}">
            <span class="ap-h" role="img" aria-label="اسحب للترتيب" title="اسحب للترتيب">⠿</span>${av(p)}
            <span class="ap-t"><b>${esc(p.name)}${p.visible ? "" : ' <span class="ap-tag">مخفي</span>'}${p.patron && p.visible && !headOn ? ' <span class="ap-tag">يظهر لما يتفعّل الظهور</span>' : ""}${p.tag ? ` <span class="ap-tag">${esc((TAGS.find((x) => x[0] === p.tag) || ["", p.tag])[1])}</span>` : ""}</b>${p.title ? `<small>${esc(p.title)}</small>` : ""}${p.note ? `<small class="ap-note">💬 ${esc(p.note)}</small>` : ""}</span>
            <span class="ap-acts">
              <button type="button" class="ap-b" data-up aria-label="انقل ${esc(p.name)} لفوق"${i ? "" : " disabled"}>▲</button>
              <button type="button" class="ap-b" data-down aria-label="انقل ${esc(p.name)} لجوّه"${i < xs.length - 1 ? "" : " disabled"}>▼</button>
              <button type="button" class="ap-b" data-edit>✏️ تعديل</button>
              <button type="button" class="ap-b" data-vis>${p.visible ? "🙈 إخفاء" : "👁️ إظهار"}</button></span></li>`).join("") + "</ul>"
          : `<p class="hint">ماكو أحد بعد.</p>`);
      }).join("");
      if (focus) { const b = $(`li[data-id="${focus[0]}"] [${focus[1]}]`); if (b && !b.disabled) b.focus(); else { const r = $(`li[data-id="${focus[0]}"] [data-edit]`); r && r.focus(); } }
    }

    // ترتيب: يحفظ sort = 10، 20، 30… للقسم كله (بس اللي تغيّر)
    async function saveOrder(grp, ids) {
      const ch = ids.map((id, i) => ({ id, sort: (i + 1) * 10 })).filter((x) => (rows.find((r) => r.id === x.id) || {}).sort !== x.sort);
      ch.forEach((x) => { const r = rows.find((y) => y.id === x.id); if (r) r.sort = x.sort; });
      if (!ch.length) return;
      msg("⏳ أحفظ الترتيب…");
      const res = await Promise.all(ch.map((x) => sb.from("people").update({ sort: x.sort }).eq("id", x.id)));
      const bad = res.find((r) => r.error);
      if (bad) { msg("⚠️ ما انحفظ الترتيب: " + bad.error.message, "bad"); await load(); } else { dropCache(); msg("✅ انحفظ الترتيب.", "ok"); }
    }
    const order = (grp) => rows.filter((r) => r.grp === grp).sort((a, b) => a.sort - b.sort).map((r) => r.id);

    $("#ap-list").onclick = async (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      const li = b.closest("li"), p = rows.find((r) => r.id === li.dataset.id); if (!p) return;
      if (b.hasAttribute("data-edit")) return startEdit(p);
      if (b.hasAttribute("data-vis")) {
        b.disabled = true;
        const { error } = await sb.from("people").update({ visible: !p.visible }).eq("id", p.id);
        if (error) { msg("⚠️ " + error.message, "bad"); b.disabled = false; return; }
        const on = !p.visible; dropCache(); await load();   // الحالة من القاعدة، مو تخمين
        msg(!on ? `🙈 ${p.name} انخفى من الموقع (باقي هنا).` : p.patron && !headOn ? `👁 ${p.name}: يظهر لما يتفعّل ظهور رئيس القسم.` : `✅ ${p.name} يطلع بالموقع.`, "ok");
        const nb = $("#ap-list").querySelector(`li[data-id="${p.id}"] [data-vis]`); if (nb) nb.focus(); return;
      }
      const up = b.hasAttribute("data-up"); if (!up && !b.hasAttribute("data-down")) return;
      const ids = order(p.grp), i = ids.indexOf(p.id), j = up ? i - 1 : i + 1;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      ids.forEach((id, k) => { rows.find((r) => r.id === id).sort = -1000 + k; });   // مؤقت حتى saveOrder يشوفه تغيّر
      draw([p.id, up ? "data-up" : "data-down"]);
      await saveOrder(p.grp, ids);
    };

    // سحب بالماوس أو اللمس من ⠿ (pointer events — يشتغل بالموبايل)
    $("#ap-list").addEventListener("pointerdown", (ev) => {
      const h = ev.target.closest(".ap-h"); if (!h) return;
      const li = h.closest("li"), ul = li.parentElement; ev.preventDefault();
      try { h.setPointerCapture(ev.pointerId); } catch (e) {} li.classList.add("drag");
      const move = (e) => {
        const over = document.elementFromPoint(e.clientX, e.clientY), o = over && over.closest("li.ap-row");
        if (!o || o === li || o.parentElement !== ul) return;
        const r = o.getBoundingClientRect();
        ul.insertBefore(li, e.clientY > r.top + r.height / 2 ? o.nextSibling : o);
      };
      const up = async () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        li.classList.remove("drag");
        const ids = [...ul.querySelectorAll("li.ap-row")].map((x) => x.dataset.id);
        await saveOrder(ul.dataset.grp, ids); draw();
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    });

    resetForm(); await load();
  }

  window.AdminPeople = { mount, _makePhoto: makePhoto, _upload: upload };
})();
