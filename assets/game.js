/* 🎮 كلمة اليوم (21/11/2026): خمّن مصطلح الأشعة الإنكليزي بـ 6 محاولات.
   كلمة وحدة لكل يوم (توقيت بغداد) لكل الطلاب، من مصطلحات المحاضرات اللي إلها صوت.
   كل شي بالجهاز بس (localStorage)، ماكو أي إرسال للسيرفر. */
(function () {
  "use strict";
  var root = document.getElementById("gw");
  var dataEl = document.getElementById("gw-data");
  if (!root || !dataEl) return;
  var WORDS = JSON.parse(dataEl.textContent || "[]");
  if (!WORDS.length) return;
  var R = root.getAttribute("data-r") || "../";
  var TRIES = 6;
  var KS = "am_game_v1", KST = "am_game_stats_v1";

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (_) { return null; } }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  // اليوم بتوقيت بغداد ← رقم يوم ثابت لكل الطلاب
  function todayKey() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baghdad" }).format(new Date()); }
    catch (_) { var d = new Date(Date.now() + 3 * 3600e3); return d.toISOString().slice(0, 10); }
  }
  function dayNum(k) { var p = k.split("-"); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); }
  var START = dayNum("2026-11-21");
  // الكلمات جاية مرتبة بجدول ثابت (لعبة-ترتيب.json، الجديد ينضاف بالآخر بس) ← اليوم N = الكلمة N لكل الطلاب
  var TODAY = todayKey(), DAY = dayNum(TODAY), NO = DAY - START + 1;
  var dailyIdx = ((DAY - START) % WORDS.length + WORDS.length) % WORDS.length;
  var MEM = null;   // نسخة بالذاكرة إذا التخزين ممنوع (التصفح الخاص)

  // الحالة
  var mode = "daily", word, cur = "", guesses = [], done = false, won = false, hintShown = false;
  function loadDaily() {
    var s = store(KS) || MEM;
    mode = "daily";
    if (s && s.day === TODAY && s.w) {
      word = WORDS.filter(function (x) { return x.w === s.w; })[0] || WORDS[dailyIdx];
      guesses = s.g || []; done = !!s.done; won = !!s.won; hintShown = !!s.h;
    } else { word = WORDS[dailyIdx]; guesses = []; done = false; won = false; hintShown = false; }
    cur = "";
  }
  function saveDaily() { if (mode !== "daily") return; MEM = { day: TODAY, w: word.w, g: guesses.slice(), done: done, won: won, h: hintShown }; store(KS, MEM); }

  function score(g, w) {
    var res = new Array(w.length).fill("no"), left = {}, k;
    for (k = 0; k < w.length; k++) { if (g[k] === w[k]) res[k] = "ok"; else left[w[k]] = (left[w[k]] || 0) + 1; }
    for (k = 0; k < w.length; k++) { if (res[k] !== "ok" && left[g[k]] > 0) { res[k] = "near"; left[g[k]]--; } }
    return res;
  }

  // الواجهة
  root.textContent = "";
  var head = el("div", "gw-head");
  var title = el("p", "gw-no");
  var help = el("p", "gw-help", "اكتب المصطلح بالإنكليزي. عندك 6 محاولات، والألوان تساعدك:");
  var legend = el("p", "gw-legend");
  legend.innerHTML = '<span class="gw-k ok">✓</span> الحرف بمكانه · <span class="gw-k near">↔</span> موجود بمكان ثاني · <span class="gw-k no">✕</span> مو موجود';
  var hintBox = el("div", "gw-hint");
  var hintBtn = el("button", "gw-hbtn", "💡 شوف المعنى بالعربي");
  hintBtn.type = "button";
  var hintTxt = el("p", "gw-htxt");
  hintBox.append(hintBtn, hintTxt);
  head.append(title, help, legend, hintBox);
  var grid = el("div", "gw-grid"); grid.setAttribute("dir", "ltr"); grid.setAttribute("aria-label", "المحاولات");
  var msg = el("p", "gw-msg"); msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite");
  var kb = el("div", "gw-kb"); kb.setAttribute("dir", "ltr");
  var end = el("div", "gw-end hidden");
  root.append(head, grid, msg, kb, end);

  var keyEls = {};
  ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"].forEach(function (row) {
    var r = el("div", "gw-row");
    row.split("").forEach(function (c) {
      var b = el("button", "gw-key");
      b.type = "button";
      if (c === "+") { b.textContent = "إدخال"; b.className += " wide"; b.dataset.k = "enter"; b.setAttribute("aria-label", "إدخال المحاولة"); }
      else if (c === "-") { b.textContent = "⌫"; b.className += " wide"; b.dataset.k = "back"; b.setAttribute("aria-label", "امسح حرف"); }
      else { b.textContent = c.toUpperCase(); b.dataset.k = c; keyEls[c] = b; }
      r.append(b);
    });
    kb.append(r);
  });

  var RANK = { no: 1, near: 2, ok: 3 };
  var NAME = { ok: "بمكانه", near: "موجود بمكان ثاني", no: "مو موجود" };
  function render() {
    var L = word.w.length;
    title.textContent = mode === "daily" ? "كلمة اليوم رقم " + NO + " · " + L + " حروف" : "🎲 تمرين · " + L + " حروف";
    grid.style.setProperty("--n", L);
    grid.textContent = "";
    var keyState = {};
    for (var r = 0; r < TRIES; r++) {
      var row = el("div", "gw-line");
      var g = guesses[r], sc = g ? score(g, word.w) : null;
      var txt = g || (r === guesses.length && !done ? cur : "");
      for (var c = 0; c < L; c++) {
        var ch = txt[c] || "";
        var cell = el("div", "gw-cell" + (sc ? " " + sc[c] : ch ? " typed" : ""), ch.toUpperCase());
        if (sc) {
          if (!keyState[ch] || RANK[sc[c]] > RANK[keyState[ch]]) keyState[ch] = sc[c];
        }
        row.append(cell);
      }
      grid.append(row);
    }
    Object.keys(keyEls).forEach(function (k) { keyEls[k].className = "gw-key" + (keyState[k] ? " " + keyState[k] : ""); });
    if (hintShown || guesses.length >= 3 || done) { hintTxt.textContent = "المعنى: " + word.ar; hintBtn.hidden = true; }
    else { hintTxt.textContent = ""; hintBtn.hidden = false; }
    kb.classList.toggle("hidden", done);
    renderEnd();
  }

  function stats() { return store(KST) || { played: 0, wins: 0, streak: 0, best: 0, last: null, dist: [0, 0, 0, 0, 0, 0] }; }
  function recordDaily() {
    var s = stats();
    if (s.last === TODAY) return;
    s.played++;
    if (won) { s.wins++; s.streak = s.last && dayNum(s.last) === DAY - 1 ? s.streak + 1 : 1; s.best = Math.max(s.best, s.streak); s.dist[guesses.length - 1]++; }
    else s.streak = 0;
    s.last = TODAY;
    store(KST, s);
  }

  function shareText() {
    var lines = guesses.map(function (g) { return score(g, word.w).map(function (x) { return x === "ok" ? "🟩" : x === "near" ? "🟨" : "⬜"; }).join(""); });
    var url = location.origin + location.pathname;
    return "🎮 كلمة اليوم " + NO + " — " + (won ? guesses.length : "X") + "/6\n" + lines.join("\n") + "\n" + url;
  }

  function renderEnd() {
    end.textContent = "";
    if (!done) { end.classList.add("hidden"); return; }
    end.classList.remove("hidden");
    var h = el("p", "gw-res", won ? (["عبقري! 🤩", "ممتاز 👏", "حلو جداً 👍", "زين 🙂", "لحقتها 😅", "على الحافة 😮‍💨"][guesses.length - 1]) : "ما لحقت هالمرة، الجواب:");
    var card = el("div", "gw-card");
    var en = el("p", "gw-en", word.en); en.setAttribute("dir", "ltr"); en.setAttribute("lang", "en");
    var ar = el("p", "gw-ar", word.ar);
    card.append(en, ar);
    if (word.p) { var pr = el("p", "gw-pr", "تُلفظ: " + word.p); card.append(pr); }
    if (word.s) {
      var au = el("button", "btn plain gw-say", "🔊 اسمع اللفظ"); au.type = "button";
      au.addEventListener("click", function () { try { new Audio(R + "assets/audio/terms/" + word.s + ".mp3").play(); } catch (_) {} });
      card.append(au);
    }
    end.append(h, card);
    if (mode === "daily") {
      var s = stats();
      var st = el("div", "gw-stats");
      [["لعبت", s.played], ["فزت %", s.played ? Math.round(100 * s.wins / s.played) : 0], ["سلسلة 🔥", s.streak], ["أحسن سلسلة", s.best]].forEach(function (x) {
        var b = el("div", "gw-st"); b.append(el("b", "", String(x[1])), el("span", "", x[0])); st.append(b);
      });
      end.append(st);
      var sh = el("button", "btn gw-share", "📤 شارك نتيجتك ويّا زملائك"); sh.type = "button";
      sh.addEventListener("click", function () {
        var t = shareText();
        if (navigator.share) { navigator.share({ text: t }).catch(function () {}); return; }
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { say("انسخت ✓ الصقها بالتلگرام أو الواتساب"); }, function () { say(t); });
      });
      end.append(sh, el("p", "gw-next", "كلمة جديدة كل يوم بعد نص الليل (توقيت بغداد)."));
    }
    var pr2 = el("button", "btn ghost gw-more", mode === "daily" ? "🎲 تمرّن بكلمة ثانية" : "🎲 كلمة ثانية"); pr2.type = "button";
    pr2.addEventListener("click", practice);
    end.append(pr2);
    if (mode !== "daily") {
      var back = el("button", "btn plain gw-back", "↩ ارجع لكلمة اليوم"); back.type = "button";
      back.addEventListener("click", function () { loadDaily(); render(); say(""); });
      end.append(back);
    }
  }

  function practice() {
    mode = "practice";
    var k; do { k = Math.floor(Math.random() * WORDS.length); } while (WORDS.length > 1 && (k === dailyIdx || WORDS[k] === word));
    word = WORDS[k]; guesses = []; cur = ""; done = false; won = false; hintShown = false;
    render(); say("");
    window.scrollTo({ top: root.offsetTop - 10, behavior: "smooth" });
  }

  function say(t) { msg.textContent = t; }
  function shake() { var rows = grid.querySelectorAll(".gw-line"); var r = rows[guesses.length]; if (r) { r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); } }

  function press(k) {
    if (done) return;
    var L = word.w.length;
    if (k === "enter") {
      if (cur.length < L) { say("الكلمة " + L + " حروف، كمّلها"); shake(); return; }
      guesses.push(cur); cur = "";
      if (guesses[guesses.length - 1] === word.w) { done = true; won = true; }
      else if (guesses.length >= TRIES) { done = true; }
      var last = guesses[guesses.length - 1], sc = score(last, word.w);
      var rd = last.toUpperCase().split("").map(function (c, i) { return c + " " + NAME[sc[i]]; }).join("، ");
      say(done ? "" : rd + (guesses.length === 3 && !hintShown ? "\n💡 طلع المعنى بالعربي يساعدك" : ""));
      if (done && mode === "daily") recordDaily();
      saveDaily(); render();
      if (done) setTimeout(function () { try { end.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {} }, 350);
      return;
    }
    if (k === "back") { cur = cur.slice(0, -1); }
    else if (/^[a-z]$/.test(k) && cur.length < L) { cur += k; }
    say(""); render();
  }

  kb.addEventListener("click", function (e) { var b = e.target.closest(".gw-key"); if (b) press(b.dataset.k); });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (done) return;
    var free = !t || t === document.body || t === document.documentElement || (root.contains(t) && (!t.closest("button") || t.closest(".gw-key")));
    if (e.key === "Enter") { if (!free) return; e.preventDefault(); press("enter"); }
    else if (e.key === "Backspace") { if (!free && !root.contains(t)) return; e.preventDefault(); press("back"); }
    else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
  });
  hintBtn.addEventListener("click", function () { hintShown = true; saveDaily(); render(); });

  // الكيبورد كامل بالشاشة (فوق شريط التنقل السفلي) أول ما تنفتح الصفحة
  function fit() {
    if (done) return;
    var nav = document.querySelector(".nnav.nmob"), lim = innerHeight;
    if (nav && getComputedStyle(nav).display !== "none") lim = Math.min(lim, nav.getBoundingClientRect().top);
    var d = kb.getBoundingClientRect().bottom + 8 - lim;
    if (d > 0 && window.scrollY < 5) window.scrollBy(0, d);
  }

  // الصفحة بقت مفتوحة لبعد نص الليل ← نحمّل كلمة اليوم الجديد
  function dayCheck() { if (document.visibilityState !== "hidden" && todayKey() !== TODAY) location.reload(); }
  document.addEventListener("visibilitychange", dayCheck);
  window.addEventListener("focus", dayCheck);

  loadDaily();
  render();
  setTimeout(fit, 250);
})();
