// ⚙️ إعداد Supabase للموقع. يبقى فارغ لحد ما يسوّي محمد المشروع (الخطوات بـ _النظام/supabase/README.md).
// بس «Project URL» و«anon public key» — المفتاح العام آمن بالمتصفح لأن RLS مقفل. ممنوع service_role هنا.
window.STUDY_CLOUD = { url: "https://spjkntrwxfyydniklfxh.supabase.co", anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamtudHJ3eGZ5eWRuaWtsZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjM3OTUsImV4cCI6MjEwODY5OTc5NX0.6IgAY8yDfYHNfA3YaGTmCDWTAQV5cLBrtqnDQ_7FwCA" };
// 🧪 71 (1/11): زيارات اختباراتنا الآلية ما توصل للإحصائيات أبداً. AM_TEST = am_test=1 أو جهاز يبدي بـ 00000000- أو صفحة تجربة (quiz/_… أو preview/).
//   AM_BLOCK(table): events و answers ممنوعة دائماً بوضع الاختبار؛ question_stats كذلك إلا إذا am_test_stats=1 (اختبار يزيّف الجدول نفسه بـ route).
(function () {
  var t = /(^|\/)(quiz\/_[^/]*|preview)\//.test(location.pathname), s = false;
  try { var ls = window.localStorage; t = t || ls.getItem("am_test") === "1" || /^00000000-/.test(ls.getItem("t:device") || ""); s = ls.getItem("am_test_stats") === "1"; } catch (e) { /* */ }
  window.AM_TEST = t;
  window.AM_BLOCK = function (table) { return t && (table === "events" || table === "answers" || (table === "question_stats" && !s)); };
})();
