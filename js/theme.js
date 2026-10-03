/* logbook ── 配色切换：跟随系统 / 浅色 / 深色 三态循环。
   写 localStorage 的 key 必须和 head.html 里防 FOUC 那段脚本一致（logbook-mode）。 */
(function () {
  var KEY = 'logbook-mode';
  var root = document.documentElement;
  var buttons = document.querySelectorAll('[data-theme-toggle]');
  if (!buttons.length) return;

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return (v === 'light' || v === 'dark' || v === 'system') ? v : 'system';
    } catch (e) { return 'system'; }
  }

  function apply(pref) {
    var mode = pref;
    if (pref === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.dataset.modePref = 'system';
    } else {
      delete root.dataset.modePref;
    }
    root.dataset.mode = mode;
    root.classList.toggle('dark', mode === 'dark');
    syncThemeColor(mode);
  }

  /* head.html 里放了两条带 media 的 theme-color（跟随系统）。用户一旦手动
     选定配色，它们就不准了 —— 换成一条不带 media 的，由 JS 跟着当前模式更新。 */
  function syncThemeColor(mode) {
    document.querySelectorAll('meta[name="theme-color"][media]').forEach(function (m) { m.remove(); });
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = mode === 'dark' ? '#0e1110' : '#e9ebe7';
  }

  var ORDER = ['system', 'light', 'dark'];

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = read();
      var next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
      try { localStorage.setItem(KEY, next); } catch (e) { /* 隐私模式忽略 */ }
      apply(next);
    });
  });

  /* 「跟随系统」状态下，用户改系统主题，页面要立刻跟着变 */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onChange = function () { if (read() === 'system') apply('system'); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
