/* nav.js ── 移动端抽屉导航：开合、遮罩、Esc 关闭、滚动锁定、桌面端自动复位。 */
(function () {
  'use strict';

  var btn = document.getElementById('drawer-btn');
  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('drawer-scrim');
  var closeBtn = document.getElementById('drawer-close');
  if (!btn || !drawer || !scrim) return;

  var OPEN = 'translate-x-0';
  var SHUT = '-translate-x-full';
  var isOpen = false;
  var lastFocus = null;

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    drawer.removeAttribute('inert');
    drawer.classList.remove(SHUT);
    drawer.classList.add(OPEN);
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    scrim.classList.remove('hidden', 'opacity-0');
    // 下一帧再加不透明度，保证 transition 生效
    requestAnimationFrame(function () {
      scrim.classList.add('opacity-100');
    });
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove(OPEN);
    drawer.classList.add(SHUT);
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    btn.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('opacity-100');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      if (!isOpen) scrim.classList.add('hidden', 'opacity-0');
    }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  btn.addEventListener('click', function () { isOpen ? close() : open(); });
  scrim.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);

  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) close();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) close();
  });
})();
