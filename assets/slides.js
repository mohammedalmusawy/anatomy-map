// عارض السلايدات: تقليب بالإصبع (scroll-snap) + أزرار وعدّاد.
(() => {
  const box = document.getElementById("slides");
  const items = [...box.children];
  const pos = document.getElementById("pos");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  // بالعربي (rtl) قيمة scrollLeft سالبة بأغلب المتصفحات، فناخذ القيمة المطلقة
  const current = () => Math.round(Math.abs(box.scrollLeft) / (box.clientWidth + 10));
  const go = (i) => items[Math.max(0, Math.min(items.length - 1, i))].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  const update = () => {
    const i = current();
    pos.textContent = `${i + 1} / ${items.length}`;
    prev.disabled = i === 0;
    next.disabled = i === items.length - 1;
  };
  box.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  prev.addEventListener("click", () => go(current() - 1));
  next.addEventListener("click", () => go(current() + 1));
  update();
})();
