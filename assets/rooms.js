/* 🏠 غرف الدراسة (21/11/2026، هجرة 081): غرف أصدقاء 2–8، مؤقت مشترك 25/5، دقائق اليوم وسلسلة الأيام، رسائل داخل الغرفة،
   🎲 زميل عشوائي اختياري. كلشي عن طريق دوال السيرفر (rpc) بتوكن الطالب، والسحب كل 30 ثانية والصفحة ظاهرة بس (بلا اتصال دائم).
   كل نص من السيرفر ينعرض بـ textContent (ماكو innerHTML لبيانات المستخدمين). */
(function () {
  "use strict";
  var root = document.getElementById("rooms");
  if (!root) return;
  var C = window.STUDY_CLOUD || {};
  var POLL_MS = 30000;
  var REACTS = ["👏", "🔥", "💪", "❤️", "😂", "👍", "🌷", "🤲"];
  var PRESETS = ["بديت أدرس 📖", "خلصت المحاضرة ✅", "يلا نكمّل 💪", "نبدي 25 دقيقة؟ ⏱️", "آخذ استراحة 5 دقايق ☕", "رجعت 👋",
    "حليت الاختبار 📝", "موفقين بالامتحان 🤲", "شكراً 🌷", "أي محاضرة نراجع؟ 🤔", "نامو بوقت 😴", "كفو 👏"];
  var WHY = {
    rooms_off: "غرف الدراسة مو مفعّلة هسه.", not_found: "ما لگينا. تأكد من الاسم الثلاثي أو الرمز.", already: "هو بالغرفة أو مدعو قبل.",
    full: "الغرفة مليانة (8 أشخاص).", kind_gender: "هاي الغرفة مخصّصة (بنات بس أو ولد بس).", rate: "وصلت الحد اليومي، جرّب باچر.",
    too_many_rooms: "عندك 3 غرف، اطلع من وحدة أول.", bad_text: "الرسالة بيها كلمة أو رقم أو رابط ممنوع.", length: "الرسالة لازم من 1 إلى 300 حرف.",
    night: "الكتابة الحرة مقفولة من 12 بالليل لـ 6 الصبح. تگدر تستعمل الجمل الجاهزة.", exam: "الكتابة الحرة مقفولة وقت الامتحان حتى ما تنتقل أجوبة. الجمل الجاهزة شغالة.",
    random_room: "بغرفة الزميل العشوائي الجمل الجاهزة بس، لحد ما توافقون الاثنين «نصير أصدقاء».", slow: "شوية شوية 🙂 رسالة كل ثانية.",
    day_limit: "وصلت الحد اليومي.", done_today: "نكزته اليوم، باچر تگدر مرة ثانية.", empty: "ماكو أحد بالقرعة هسه، جرّب بعدين.",
    not_in_pool: "شغّل «أريد زميل دراسة» أول.", gone: "هذا الزميل طلع من القرعة.", need_gender: "اختار «طالب أو طالبة» أول.",
    random_off: "القرعة مو مفعّلة هسه.", game_over: "التحدّي خلص وقته.", unavailable: "ما نگدر نضيفه لهاي الغرفة.", gender_set: "اخترت قبل. إذا تريد تغيّره راسل الإدارة.",
    not_owner: "بس صاحب الغرفة يگدر.", bad_name: "اسم الغرفة من 2 إلى 40 حرف.", auth: "لازم تسجّل دخول أول."
  };
  var KIND = { mixed: "مختلطة", boys: "ولد بس", girls: "بنات بس" };

  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function btn(t, c, f) { var b = el("button", "btn " + (c || ""), t); b.type = "button"; if (f) b.addEventListener("click", f); return b; }
  function msg(code) { var k = String(code || "").replace(/^.*?(\b[a-z_]+)$/, "$1"); return WHY[k] || WHY[code] || "صار خطأ، جرّب مرة ثانية."; }
  function toast(t) { var n = document.getElementById("rm-toast"); if (!n) return; n.textContent = t; n.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { n.hidden = true; }, 4500); }

  var A = null;
  function tok() { return A && A.state && A.state.session && A.state.session.access_token; }
  function rpc(fn, args) {
    if (!tok()) return Promise.reject(new Error("auth"));
    return fetch(C.url + "/rest/v1/rpc/" + fn, { method: "POST", cache: "no-store",
      headers: { apikey: C.anon, Authorization: "Bearer " + tok(), "Content-Type": "application/json" }, body: JSON.stringify(args || {}) })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (_) {} if (!r.ok) { var e = new Error((j && j.message) || ("http " + r.status)); e.status = r.status; throw e; } return j; }); });
  }
  function fail(e) { toast(msg(e && e.message)); }

  var view = el("div", "rm-view"); var tst = el("p", "rm-toast"); tst.id = "rm-toast"; tst.hidden = true; tst.setAttribute("role", "status"); tst.setAttribute("aria-live", "polite");
  root.textContent = ""; root.append(tst, view);
  function clear() { view.textContent = ""; }
  function card(title) { var c = el("section", "rm-card"); if (title) c.append(el("h2", "rm-h", title)); view.append(c); return c; }

  // ───── البداية ─────
  function start() {
    clear(); view.append(el("p", "rm-muted", "لحظة…"));
    if (!(C.url && C.anon) || !window.Account) { clear(); card().append(el("p", "", "غرف الدراسة تحتاج نت.")); return; }
    A = window.Account;
    A.ready().then(function () {
      if (!tok() || !A.state.student) return needLogin();
      return home();
    }).catch(function () { clear(); card().append(el("p", "", "ما گدرنا نتصل. تأكد من النت وجرّب مرة ثانية.")); });
  }
  function needLogin() {
    clear();
    var c = card("🏠 غرف الدراسة");
    c.append(el("p", "", "ادرس ويّا أصدقائك: مؤقت مشترك، ونشوف منو يدرس هسه، ورسائل بينكم. سجّل دخولك بالاسم والرمز أول."));
    c.append(btn("🔓 تسجيل الدخول", "", function (ev) { if (window.StaffDoor && window.StaffDoor.settings) window.StaffDoor.settings(ev.currentTarget); else location.href = "../me/"; }));
    if (A && A.on) A.on(function () { if (tok() && A.state.student) home(); });
  }

  // ───── الشاشة الرئيسية ─────
  var ME = null;
  function home() {
    stopPoll();
    return rpc("room_me").then(function (d) {
      ME = d || {}; clear();
      if (!ME.on) { var c0 = card("🏠 غرف الدراسة"); c0.append(el("p", "", "غرف الدراسة بعدها مو مفعّلة. أول ما تتفعّل تطلع هنا.")); return; }
      if (!ME.gender) genderCard();
      if ((ME.invites || []).length) invitesCard();
      roomsCard();
      if (ME.random) buddyCard();
      howCard();
    }).catch(function (e) { if (e.status === 401) return needLogin(); clear(); card().append(el("p", "", msg(e.message))); });
  }
  function genderCard() {
    var c = card("👤 أول شي");
    c.append(el("p", "rm-muted", "حتى نرتب الغرف (بنات بس، ولد بس، أو مختلطة) والقرعة. ما ينعرض لأحد."));
    var row = el("div", "rm-row");
    [["m", "أنا طالب"], ["f", "أنا طالبة"]].forEach(function (x) {
      row.append(btn(x[1], "plain", function () { rpc("room_set_gender", { p_g: x[0] }).then(home, fail); }));
    });
    c.append(row);
  }
  function invitesCard() {
    var c = card("📩 دعوات إلك");
    ME.invites.forEach(function (v) {
      var r = el("div", "rm-item");
      r.append(el("p", "", (v.random ? "🎲 " : "") + v.from + " يدعوك لغرفة «" + v.name + "» (" + KIND[v.kind] + ")"));
      var b = el("div", "rm-row");
      b.append(btn("✅ أقبل", "", function () { rpc("room_respond", { p_room: v.room, p_accept: true }).then(function (x) { if (x && x.ok === false) toast(msg(x.why)); else openRoom(v.room); }, fail); }));
      b.append(btn("لا، شكراً", "plain", function () { rpc("room_respond", { p_room: v.room, p_accept: false }).then(home, fail); }));
      r.append(b); c.append(r);
    });
  }
  function roomsCard() {
    var c = card("🏠 غرفي");
    if (!(ME.rooms || []).length) c.append(el("p", "rm-muted", "ما عندك غرفة بعد. سوّي وحدة وادعو أصدقائك، أو ادخل برمز صديقك."));
    (ME.rooms || []).forEach(function (r) {
      var b = el("button", "rm-room"); b.type = "button";
      b.append(el("b", "", (r.random ? "🎲 " : "") + r.name));
      b.append(el("span", "rm-muted", r.n + " أعضاء · " + KIND[r.kind] + (r.now ? " · 🟢 " + r.now + " يدرس هسه" : "") + (r.pending ? " · 🔔 " + r.pending + " طلب" : "")));
      b.addEventListener("click", function () { openRoom(r.id); });
      c.append(b);
    });
    // إنشاء غرفة
    var f = el("form", "rm-form"); f.noValidate = true;
    var nm = el("input"); nm.placeholder = "اسم الغرفة (مثلاً: ربع التشريح)"; nm.maxLength = 40; nm.required = true; nm.setAttribute("aria-label", "اسم الغرفة");
    var kd = el("select"); kd.setAttribute("aria-label", "نوع الغرفة");
    [["mixed", "مختلطة"], ["boys", "ولد بس"], ["girls", "بنات بس"]].forEach(function (k) {
      if ((k[0] === "boys" && ME.gender !== "m") || (k[0] === "girls" && ME.gender !== "f")) return;
      var o = el("option", "", k[1]); o.value = k[0]; kd.append(o);
    });
    if (ME.gender === "f") kd.value = "girls"; else if (ME.gender === "m") kd.value = "boys";
    var sb = btn("➕ سوّي غرفة"); sb.type = "submit";
    f.append(el("h3", "rm-h3", "غرفة جديدة"), nm, kd, sb);
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var v = nm.value.trim();
      if (v.length < 2) { toast(WHY.bad_name); return; }
      sb.disabled = true;
      rpc("room_create", { p_name: v, p_kind: kd.value }).then(function (x) { openRoom(x.id); }, fail).then(function () { sb.disabled = false; });
    });
    c.append(f);
    // الدخول برمز
    var j = el("form", "rm-form"); j.noValidate = true;
    var cd = el("input"); cd.placeholder = "رمز الغرفة (6 حروف)"; cd.maxLength = 6; cd.setAttribute("dir", "ltr"); cd.setAttribute("autocapitalize", "characters"); cd.setAttribute("aria-label", "رمز الغرفة");
    var jb = btn("🔑 ادخل"); jb.type = "submit";
    j.append(el("h3", "rm-h3", "عندك رمز من صديقك؟"), cd, jb);
    j.addEventListener("submit", function (e) {
      e.preventDefault();
      rpc("room_join_code", { p_code: cd.value }).then(function (x) {
        if (!x || x.ok === false) return toast(msg(x && x.why));
        if (x.status === "active") return openRoom(x.room);
        toast("✅ انرسل طلبك لغرفة «" + (x.name || "") + "». أول ما يوافق صاحبها تطلع بقائمتك.");
      }, fail);
    });
    c.append(j);
  }
  function buddyCard() {
    var c = card("🎲 زميل دراسة عشوائي");
    c.append(el("p", "rm-muted", "شغلة حلوة: القرعة تطلعلك زميل من اللي شغّلوها هم. يطلع الاسم الأول وحرف بس، والاسم الكامل بعد ما تصيرون أصدقاء."));
    var inPool = !!ME.pool;
    var want = el("select"); want.setAttribute("aria-label", "منو يطلعلك");
    [["same", ME.gender === "f" ? "طالبات بس" : "طلاب بس"], ["any", "أي أحد"]].forEach(function (x) { var o = el("option", "", x[1]); o.value = x[0]; want.append(o); });
    want.value = (ME.pool && ME.pool.want) || "same";
    var subj = el("input"); subj.placeholder = "شنو تريد تدرس؟ (اختياري)"; subj.maxLength = 40; subj.value = (ME.pool && ME.pool.subject) || ""; subj.setAttribute("aria-label", "المادة");
    var tg = btn(inPool ? "🙈 طلّعني من القرعة" : "✋ أريد زميل دراسة", inPool ? "plain" : "", function () {
      if (!ME.gender) return toast(WHY.need_gender);
      rpc("buddy_set", { p_on: !inPool, p_want: want.value, p_subject: subj.value }).then(home, fail);
    });
    c.append(want, subj, tg);
    if (inPool) {
      var out = el("div", "rm-draw");
      var dr = btn("🎲 اسحب زميل", "", function () {
        dr.disabled = true;
        rpc("buddy_draw").then(function (x) {
          out.textContent = "";
          if (!x || x.ok === false) { out.append(el("p", "rm-muted", msg(x && x.why))); return; }
          out.append(el("p", "rm-big", "✨ " + x.name), el("p", "rm-muted", x.subject ? "يريد يدرس: " + x.subject : "ما حدد مادة"));
          out.append(btn("📩 ادعوه لغرفة دراسة", "", function () {
            rpc("buddy_invite", { p_draw: x.draw }).then(function (y) { if (!y || y.ok === false) return toast(msg(y && y.why)); toast("✅ انرسلت الدعوة. أول ما يقبل تبدون."); openRoom(y.room); }, fail);
          }));
        }, fail).then(function () { dr.disabled = false; });
      });
      c.append(dr, out, el("p", "rm-muted", "3 قرعات باليوم. اللي يرفض ما يطلعلك مرة ثانية."));
    }
  }
  function howCard() {
    var c = card("ℹ️ شلون تشتغل؟");
    var ul = el("ul", "rm-how");
    ["سوّي غرفة، وادعو صديقك باسمه الثلاثي أو دزله رمز الغرفة.", "شغّل مؤقت 25 دقيقة ويّا أصحابك، وكل واحد يشوف منو يدرس هسه 🟢.",
     "هدف اليوم 25 دقيقة. كل يوم تحققه تزيد سلسلتك 🔥.", "الرسائل داخل الغرفة بس. ماكو أرقام ولا روابط، وأي رسالة سيئة 🚩 بلّغ عليها.",
     "تطلع من الغرفة بأي وقت، والغرفة تخلص بعد أسبوعين إلا إذا مدّدتوها."].forEach(function (t) { ul.append(el("li", "", t)); });
    c.append(ul);
  }

  // ───── داخل الغرفة ─────
  var RID = null, SINCE = 0, timerT = null, pollT = null, studying = false, R = null, sending = false;
  var refs = {};
  function stopPoll() { clearTimeout(pollT); pollT = null; clearInterval(timerT); timerT = null; RID = null; playing = false; RUN++; }
  function openRoom(id) {
    stopPoll(); RID = id; SINCE = 0; R = null; clear();
    try { history.replaceState(null, "", "#r=" + id); } catch (_) {}
    var top = el("div", "rm-top");
    top.append(btn("‹ غرفي", "plain rm-back", function () { try { history.replaceState(null, "", location.pathname); } catch (_) {} home(); }));
    refs.title = el("h2", "rm-title"); top.append(refs.title);
    view.append(top);
    refs.info = el("p", "rm-muted rm-info"); view.append(refs.info);
    // المؤقت
    var tc = card();
    refs.clock = el("p", "rm-clock", "--:--"); refs.clock.setAttribute("aria-live", "off");
    refs.phase = el("p", "rm-muted rm-phase");
    var tr = el("div", "rm-row");
    tr.append(btn("▶️ 25 دراسة", "", function () { setStudy(true); rpc("room_timer", { p_room: RID, p_len: 25 }).then(poll, fail); }),
      btn("☕ 5 استراحة", "plain", function () { rpc("room_timer", { p_room: RID, p_len: 5 }).then(poll, fail); }),
      btn("⏹", "plain", function () { rpc("room_timer", { p_room: RID, p_len: 0 }).then(poll, fail); }));
    refs.studyBtn = btn("", "plain rm-study", function () { setStudy(!studying); });
    tc.append(refs.clock, refs.phase, tr, refs.studyBtn);
    // 🎮 تحدّي الغرفة
    var gc = card("🎮 العب ويّا أصحابك"); refs.game = el("div", "rm-game noterm"); gc.append(refs.game);   // noterm: listen.js ما يعلّم المصطلح (معناه يكشف الجواب)
    // الأعضاء
    var mc = card("👥 الأعضاء"); refs.members = el("div", "rm-members"); mc.append(refs.members);
    refs.inviteBox = el("form", "rm-form"); refs.inviteBox.noValidate = true;
    var inp = el("input"); inp.placeholder = "اسم صديقك الثلاثي"; inp.maxLength = 120; inp.setAttribute("aria-label", "اسم صديقك الثلاثي");
    var ib = btn("📩 ادعو"); ib.type = "submit";
    refs.inviteBox.append(inp, ib);
    refs.inviteBox.addEventListener("submit", function (e) {
      e.preventDefault(); if (!inp.value.trim()) return;
      rpc("room_invite", { p_room: RID, p_full_name: inp.value }).then(function (x) {
        if (!x || x.ok === false) return toast(msg(x && x.why));
        inp.value = ""; toast("✅ انرسلت الدعوة لـ " + x.name + ". تطلعله أول ما يفتح غرف الدراسة.");
      }, fail);
    });
    refs.codeLine = el("div", "rm-code");
    mc.append(refs.inviteBox, refs.codeLine);
    // الرسائل
    var cc = card("💬 الرسائل");
    refs.msgs = el("div", "rm-msgs"); refs.msgs.setAttribute("aria-live", "polite"); refs.msgs.setAttribute("aria-label", "رسائل الغرفة");
    refs.quiet = el("p", "rm-note"); refs.quiet.hidden = true;
    var rx = el("div", "rm-reacts"); REACTS.forEach(function (r) { var b = btn(r, "plain rm-chip", function () { send("react", r); }); b.setAttribute("aria-label", "تفاعل " + r); rx.append(b); });
    var pr = el("div", "rm-presets"); PRESETS.forEach(function (p) { pr.append(btn(p, "plain rm-chip", function () { send("preset", p); })); });
    refs.form = el("form", "rm-compose"); refs.form.noValidate = true;
    refs.text = el("textarea"); refs.text.maxLength = 300; refs.text.rows = 2; refs.text.placeholder = "اكتب رسالة (300 حرف)…"; refs.text.setAttribute("aria-label", "رسالة");
    refs.count = el("span", "rm-muted rm-count", "0/300");
    refs.text.addEventListener("input", function () { refs.count.textContent = refs.text.value.length + "/300"; });
    var sb = btn("إرسال"); sb.type = "submit";
    refs.form.append(refs.text, refs.count, sb);
    refs.form.addEventListener("submit", function (e) { e.preventDefault(); var v = refs.text.value.trim(); if (v) send("text", v, function () { refs.text.value = ""; refs.count.textContent = "0/300"; }); });
    cc.append(refs.msgs, refs.quiet, rx, pr, refs.form);
    // آخر الصفحة
    var fc = card(); refs.friend = btn("🤝 نصير أصدقاء", "", function () { rpc("room_friend", { p_room: RID }).then(function (ok) { toast(ok ? "🎉 صرتوا أصدقاء! الرسائل الحرة والأسماء الكاملة تفتحت." : "✅ وافقت. ننتظر صاحبك يوافق هم."); poll(); }, fail); });
    refs.extend = btn("⏳ مدّد الغرفة أسبوع", "plain", function () { rpc("room_extend", { p_room: RID, p_days: 7 }).then(function () { toast("✅ تمدّدت أسبوع."); poll(); }, fail); });
    var lv = btn("🚪 اطلع من الغرفة", "plain", function () { if (confirm("تطلع من الغرفة؟")) rpc("room_leave", { p_room: RID }).then(home, fail); });
    fc.append(refs.friend, refs.extend, lv);
    timerT = setInterval(tick, 1000);
    setStudy(false, true);
    poll();
  }
  function setStudy(on, silent) {
    studying = !!on;
    if (refs.studyBtn) refs.studyBtn.textContent = studying ? "📖 أدرس هسه ✓ (اضغط إذا وقفت)" : "📖 بديت أدرس؟ اضغط هنا";
    if (refs.studyBtn) refs.studyBtn.setAttribute("aria-pressed", studying ? "true" : "false");
    if (!silent) poll();
  }
  function tick() {
    if (!R || !refs.clock) return;
    if (!R.timer_started) { refs.clock.textContent = "--:--"; refs.phase.textContent = "شغّلوا المؤقت سوا: 25 دقيقة دراسة، بعدها 5 استراحة."; return; }
    var skew = R._skew || 0, end = Date.parse(R.timer_started) + R.timer_len * 60000, left = Math.max(0, end - (Date.now() + skew));
    var m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    refs.clock.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    refs.phase.textContent = left === 0 ? (R.timer_len === 25 ? "✅ خلصت الـ 25! خذوا 5 دقايق استراحة." : "☕ خلصت الاستراحة، يلا نرجع.") : (R.timer_len === 25 ? "📖 وقت الدراسة" : "☕ وقت الاستراحة");
  }
  function poll() {
    if (!RID) return;
    clearTimeout(pollT);
    var id = RID;
    return rpc("room_poll", { p_room: id, p_since: SINCE, p_studying: studying && document.visibilityState === "visible" }).then(function (d) {
      if (id !== RID || !d) return;
      R = d.room; R._skew = Date.parse(d.room.now) - Date.now();
      render(d);
    }, function (e) {
      if (e.message && /not_member/.test(e.message)) { toast("ما بعد إنت بهاي الغرفة."); return home(); }
      if (e.status === 401) return needLogin();
    }).then(function () { if (RID === id && document.visibilityState === "visible") pollT = setTimeout(poll, POLL_MS); });
  }
  document.addEventListener("visibilitychange", function () { if (RID && document.visibilityState === "visible") poll(); else clearTimeout(pollT); });

  function render(d) {
    var r = d.room;
    refs.title.textContent = (r.random ? "🎲 " : "") + r.name;
    refs.info.textContent = KIND[r.kind] + " · هدف اليوم " + r.goal + " دقيقة · " + (r.ended ? "⌛ الغرفة خلصت، مدّدوها حتى تكملون" : "تخلص " + r.ends_on);
    tick();
    renderGame(d.game);
    // الأعضاء
    refs.members.textContent = "";
    (d.members || []).forEach(function (m) {
      var row = el("div", "rm-mem" + (m.me ? " me" : ""));
      var nm = el("p", "rm-mname"); nm.append(el("span", "rm-dot" + (m.studying ? " on" : ""), m.studying ? "🟢" : "⚪"), document.createTextNode(" " + m.name + (m.me ? " (إنت)" : "")));
      if (m.studying) nm.setAttribute("aria-label", m.name + " يدرس هسه");
      var st = el("p", "rm-muted", m.status === "requested" ? "🔔 يريد يدخل الغرفة" : (m.min + " دقيقة اليوم" + (m.goal_ok ? " ✅" : "") + (m.streak ? " · 🔥 " + m.streak : "")));
      row.append(nm, st);
      var acts = el("div", "rm-row rm-acts");
      if (m.status === "requested" && r.owner) {
        acts.append(btn("✅ وافق", "", function () { rpc("room_approve", { p_room: RID, p_student: m.id, p_ok: true }).then(poll, fail); }),
          btn("رفض", "plain", function () { rpc("room_approve", { p_room: RID, p_student: m.id, p_ok: false }).then(poll, fail); }));
      } else if (!m.me) {
        if (m.nudge && !m.studying) acts.append(btn("👋 نكزة", "plain rm-chip", function () { rpc("room_nudge", { p_room: RID, p_student: m.id }).then(function (x) { if (x && x.ok === false) toast(msg(x.why)); else poll(); }, fail); }));
        if (r.owner) acts.append(btn("👢 طلّعه", "plain rm-chip", function () {
          if (!confirm("تطلّع " + m.name + " من الغرفة؟")) return;
          rpc("room_kick", { p_room: RID, p_student: m.id }).then(function () { toast("✅ طلع من الغرفة."); poll(); }, fail);
        }));
        acts.append(btn("🚫 حظر", "plain rm-chip", function () {
          if (!confirm("تحظر " + m.name + "؟ ما تشوف رسائله، وما يگدر يدعوك.")) return;
          rpc("room_block", { p_student: m.id }).then(function () { toast("✅ انحظر. تگدر تطلع من الغرفة هم إذا تحب."); poll(); }, fail);
        }));
      }
      if (acts.childNodes.length) row.append(acts);
      refs.members.append(row);
    });
    refs.inviteBox.hidden = !!r.random;
    refs.codeLine.textContent = "";
    if (r.owner && r.code && !r.random) {
      refs.codeLine.append(el("span", "", "رمز الغرفة: "), el("b", "rm-codev", r.code));
      var share = btn("📤 دز الرمز لصديقك", "plain rm-chip", function () {
        var t = "تعال ادرس ويّاي 📚 ادخل غرف الدراسة بمنصة تعلم الأشعة واكتب الرمز: " + r.code + "\n" + location.origin + location.pathname;
        if (navigator.share) navigator.share({ text: t }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast("انسخ ✓ الصقه بالواتساب أو التلگرام."); });
      });
      refs.codeLine.append(share);
    }
    // الرسائل
    var stick = refs.msgs.scrollHeight - refs.msgs.scrollTop - refs.msgs.clientHeight < 60;
    (d.msgs || []).forEach(function (g) {
      if (g.id <= SINCE) return; SINCE = g.id;
      var line = el("div", "rm-msg " + g.kind + (g.me ? " me" : ""));
      if (g.kind === "sys") line.append(el("span", "", "👋 " + g.from + " دخل الغرفة"));
      else if (g.kind === "nudge") line.append(el("span", "", "👋 " + g.from + " نكز " + g.body + ": يلا ندرس!"));
      else if (g.kind === "game") line.append(el("span", "", gameLine(g)));
      else {
        line.append(el("b", "rm-from", g.me ? "إنت" : g.from));
        line.append(el("span", g.kind === "react" ? "rm-react" : "rm-body", g.body));
        var at = new Date(g.at); line.append(el("small", "rm-at", at.toLocaleTimeString("ar-IQ", { hour: "numeric", minute: "2-digit" })));
        if (!g.me && g.kind === "text") {
          var rp = btn("🚩", "plain rm-rep"); rp.setAttribute("aria-label", "بلّغ على رسالة " + g.from);
          rp.addEventListener("click", function () { if (confirm("تبلّغ على هاي الرسالة؟ إذا 3 بلّغوا تنخفي لحد ما الإدارة تراجعها.")) rpc("room_report", { p_msg: g.id }).then(function () { toast("✅ وصل البلاغ. شكراً."); }, fail); });
          line.append(rp);
        }
      }
      refs.msgs.append(line);
    });
    while (refs.msgs.childNodes.length > 120) refs.msgs.removeChild(refs.msgs.firstChild);
    if (stick) refs.msgs.scrollTop = refs.msgs.scrollHeight;
    if (!refs.msgs.childNodes.length) refs.msgs.append(el("p", "rm-muted", "بعد ما أحد كتب. سلّم على أصحابك 👋"));
    // الكتابة الحرة
    var why = r.random ? "random_room" : d.quiet;
    refs.form.hidden = !!why; refs.quiet.hidden = !why; if (why) refs.quiet.textContent = WHY[why];
    var meRow = (d.members || []).filter(function (m) { return m.me; })[0];
    refs.friend.hidden = !r.random || (meRow && meRow.friend_ok);
    refs.extend.hidden = !(r.ended || (Date.parse(r.ends_on) - Date.now() < 3 * 864e5));
  }
  // ───── 🎮 تحدّي الغرفة: نفس الـ 5 أسئلة للكل (بذرة من السيرفر + معجم الموقع المحفوظ بالجهاز) ─────
  var LEX = null, playing = false, RUN = 0;
  function lex(fresh) {
    if (fresh) LEX = null;
    if (!LEX) LEX = fetch("../assets/audio/terms/lex.json", fresh ? { cache: "reload" } : {}).then(function (r) { return r.json(); }).then(function (d) {
      var all = Object.keys(d).map(function (k) { return d[k]; }).filter(function (v) { return v && v[1] && !/[A-Za-z]/.test(v[1]) && /^[A-Za-z][A-Za-z \-]{2,20}$/.test(v[0]); });
      return { quick: all, hard: all.filter(function (v) { return v[0].length <= 16 && v[0].split(" ").length <= 2; }) };
    }).catch(function (e) { LEX = null; throw e; });
    return LEX;
  }
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function questions(pool, kind, seed) {
    var R2 = rng(seed), used = {}, qs = [];
    while (qs.length < 5 && Object.keys(used).length < pool.length) {
      var i = Math.floor(R2() * pool.length); if (used[i]) continue; used[i] = 1;
      var q = { en: pool[i][0], ar: pool[i][1] };
      q.alts = pool.filter(function (v) { return v[1] === q.ar; }).map(function (v) { return v[0]; });
      if (kind === "quick") {
        var opts = [q.ar], tries = 0;
        while (opts.length < 4 && tries++ < 50) { var o = pool[Math.floor(R2() * pool.length)][1]; if (opts.indexOf(o) < 0) opts.push(o); }
        for (var k = opts.length - 1; k > 0; k--) { var j = Math.floor(R2() * (k + 1)); var t = opts[k]; opts[k] = opts[j]; opts[j] = t; }
        q.opts = opts;
      }
      qs.push(q);
    }
    return qs;
  }
  var norm = function (x) { return String(x || "").toLowerCase().replace(/[^a-z]/g, ""); };
  function near(a, b) {   // خطأ حرف واحد مسموح بالكلمات الطويلة
    a = norm(a); b = norm(b); if (a === b) return true; if (b.length < 6 || Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, e = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } }
    return e + (a.length - i) + (b.length - j) <= 1;
  }
  var KN = { quick: "⚡ تحدّي سريع", hard: "🧠 تحدّي صعب" };
  function gameLine(g) {
    var p = String(g.body || "").split(":");
    if (p[0] === "start") return "🎮 " + (g.me ? "إنت بديت" : g.from + " بدأ") + " " + (KN[p[1]] || "تحدّي") + "، العبوا!";
    if (p[0] === "score") { var sc = +p[1], sec = Math.round(+p[2] / 1000); return (sc === 5 ? "🏆 " : "🏁 ") + (g.me ? "إنت جبت " : g.from + " جاب ") + sc + "/5 بـ " + sec + " ثانية" + (sc === 5 ? " — كامل!" : ""); }
    return "🎮";
  }
  function renderGame(gm) {
    if (playing || !refs.game) return;
    var box = refs.game; box.textContent = "";
    var live = gm && Date.parse(gm.ends_at) > Date.now() + (R && R._skew || 0);
    if (gm && gm.scores && gm.scores.length && (gm.mine || !live)) {
      box.append(el("p", "rm-muted", (live ? "النتائج لحد هسه · " : "آخر تحدّي · ") + KN[gm.kind]));
      var ol = el("ol", "rm-board");
      gm.scores.forEach(function (x, i) { ol.append(el("li", x.me ? "me" : "", (i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "") + x.name + " — " + x.score + "/5 · " + Math.round(x.ms / 1000) + " ث")); });
      box.append(ol);
    }
    if (live && !gm.mine) {
      box.append(el("p", "rm-big", "🎮 " + gm.by + " بدأ " + KN[gm.kind] + "!"));
      box.append(btn("▶️ العب هسه (5 أسئلة)", "", function () { play(gm); }));
      return;
    }
    if (live) { box.append(el("p", "rm-muted", "لعبت ✓ ننتظر أصحابك…")); return; }
    box.append(el("p", "rm-muted", "5 أسئلة مصطلحات بنفس الوقت للكل، والأسرع والأدق يفوز 🏆"));
    var row = el("div", "rm-row");
    row.append(btn("⚡ تحدّي سريع (اختار المعنى)", "", function () { startGame("quick"); }),
      btn("🧠 تحدّي صعب (اكتب المصطلح)", "plain", function () { startGame("hard"); }));
    box.append(row);
  }
  function startGame(kind) {
    lex().then(function (L) {
      return rpc("room_game_start", { p_room: RID, p_kind: kind, p_pool: (L[kind] || L.quick).length }).then(function (x) {
        if (!x || x.ok === false) return toast(msg(x && x.why));
        play({ id: x.id, kind: x.kind, seed: x.seed, pool: x.pool, by: "إنت" });
      }, fail);
    }, function () { toast("ما گدرنا نحمّل الأسئلة. تأكد من النت."); });
  }
  function play(gm) {
    var box = refs.game, run = ++RUN; playing = true; box.textContent = ""; box.append(el("p", "rm-muted", "لحظة…"));
    var alive = function () { return run === RUN && box.isConnected; };
    var size = function (L) { return (L[gm.kind] || L.quick).length; };
    lex().then(function (L) { return gm.pool && size(L) !== gm.pool ? lex(true) : L; }).then(function (L) {
      if (!alive()) return;
      if (gm.pool && size(L) !== gm.pool) { playing = false; box.textContent = ""; box.append(el("p", "", "الأسئلة عندك نسخة ثانية. حدّث الصفحة وارجع العب 🔄")); return; }
      var qs = questions(L[gm.kind] || L.quick, gm.kind, gm.seed), i = 0, score = 0, t0 = Date.now();
      function next() {
        if (!alive()) return;
        box.textContent = "";
        if (i >= qs.length) return finish();
        var q = qs[i];
        box.append(el("p", "rm-muted", KN[gm.kind] + " · سؤال " + (i + 1) + " من " + qs.length));
        var fb = el("p", "rm-fb"); fb.setAttribute("role", "status");
        var done = function (good, right) {
          if (good) score++;
          fb.textContent = good ? "✅ صح!" : "❌ الصح: " + right;
          box.querySelectorAll("button, input").forEach(function (b) { b.disabled = true; });
          setTimeout(function () { i++; next(); }, good ? 650 : 1400);
        };
        if (gm.kind === "quick") {
          var en = el("p", "rm-q", q.en); en.setAttribute("dir", "ltr"); en.setAttribute("lang", "en"); en.tabIndex = -1; box.append(en); setTimeout(function () { if (alive() && i > 0) en.focus(); }, 30);
          var g = el("div", "rm-opts");
          q.opts.forEach(function (o) { g.append(btn(o, "plain", function () { done(o === q.ar, q.ar); })); });
          box.append(g, fb);
        } else {
          box.append(el("p", "rm-q", q.ar), el("p", "rm-muted", "يبدي بحرف " + q.en[0].toUpperCase() + " · " + q.en.replace(/[^A-Za-z]/g, "").length + " حروف"));
          var f = el("form", "rm-form"); f.noValidate = true;
          var inp = el("input"); inp.setAttribute("dir", "ltr"); inp.setAttribute("autocapitalize", "none"); inp.setAttribute("autocomplete", "off"); inp.setAttribute("spellcheck", "false"); inp.setAttribute("aria-label", "اكتب المصطلح بالإنكليزي");
          var ok = btn("تأكيد"); ok.type = "submit";
          f.append(inp, ok); f.addEventListener("submit", function (e) { e.preventDefault(); if (inp.value.trim()) done(q.alts.some(function (a) { return near(inp.value, a); }), q.en); });
          box.append(f, fb); setTimeout(function () { inp.focus(); }, 50);
        }
      }
      function finish() {
        if (!alive()) return;
        var ms = Math.min(900000, Math.max(5000, Date.now() - t0));
        box.textContent = ""; var fin = el("p", "rm-big", (score === 5 ? "🏆 كامل! " : "🏁 ") + score + "/5 بـ " + Math.round(ms / 1000) + " ثانية"); fin.setAttribute("role", "status"); box.append(fin);
        rpc("room_game_score", { p_game: gm.id, p_score: score, p_ms: ms }).then(function (x) {
          if (x && x.ok === false && x.why !== "played") toast(msg(x.why));
        }, fail).then(function () { if (run === RUN) { playing = false; poll(); } });
      }
      next();
    }).catch(function () { if (!alive()) return; playing = false; box.textContent = ""; box.append(el("p", "", "ما گدرنا نحمّل الأسئلة. تأكد من النت.")); });
  }

  function send(kind, body, done) {
    if (sending) return; sending = true;
    rpc("room_send", { p_room: RID, p_kind: kind, p_body: body }).then(function (x) {
      if (x && x.ok === false) return toast(msg(x.why));
      if (done) done(); poll();
    }, fail).then(function () { sending = false; });
  }

  var h = /#r=([0-9a-f-]{36})/.exec(location.hash);
  start();
  if (h) { var w = setInterval(function () { if (ME && ME.on) { clearInterval(w); openRoom(h[1]); } }, 300); setTimeout(function () { clearInterval(w); }, 15000); }
})();
