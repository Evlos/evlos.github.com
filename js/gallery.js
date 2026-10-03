/* logbook ── 照片墙灯箱：点击放大、Esc / 点遮罩关闭、左右切换。 */
(function () {
  'use strict';

  var box = document.getElementById('lightbox');
  if (!box) return;

  var img = box.querySelector('[data-lightbox-img]');
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-src]'));
  if (!img || !items.length) return;

  var current = 0;
  var lastFocus = null;

  function show(i) {
    current = (i + items.length) % items.length;
    var a = items[current];
    img.src = a.getAttribute('data-lightbox-src');
    img.alt = a.getAttribute('data-lightbox-alt') || '';
    box.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    box.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  items.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      lastFocus = a;
      show(i);
    });
  });

  box.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
    el.addEventListener('click', hide);
  });

  box.addEventListener('click', function (e) {
    if (e.target === img) return;
    /* 点图片之外的空白处也关闭；点在图片上留给左右切换 */
    if (e.target === box || e.target.classList.contains('lightbox')) hide();
  });

  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'ArrowLeft') show(current - 1);
  });
})();
