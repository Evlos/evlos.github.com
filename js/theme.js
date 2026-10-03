/* theme.js ── 三态配色主题：跟随系统 → 浅色 → 深色 → 跟随系统。
   首次访问没有 localStorage 记录时默认跟随系统。
   关键约定：html[data-mode] 存的是「用户偏好」，.dark 类决定实际配色，
   head 里的内联脚本已经在首绘前把两者写好，这里只负责后续切换。 */
(function () {
  'use strict';

  var KEY = 'aurora-theme';
  var ORDER = ['system', 'light', 'dark'];
  var NEXT = {
    system: 'light',
    light: 'dark',
    dark: 'system'
  };
  var LABEL = {
    system: '跟随系统',
    light: '浅色',
    dark: '深色'
  };

  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function resolve(pref) {
    return pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
  }

  function syncColorScheme(mode) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var canvas = getComputedStyle(root).getPropertyValue('--canvas').trim();
    if (canvas) meta.setAttribute('content', canvas);
    root.style.colorScheme = mode;
  }

  function paint(pref) {
    var eff = resolve(pref);
    root.dataset.mode = pref;
    root.classList.toggle('dark', eff === 'dark');
    syncColorScheme(eff);
    if (btn) {
      var next = NEXT[pref];
      btn.title = '配色：' + LABEL[pref] + ' · 点击切换到' + LABEL[next];
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) > -1 ? v : 'system';
    } catch (e) {
      return 'system';
    }
  }

  var pref = root.dataset.mode || read();

  if (btn) {
    btn.addEventListener('click', function () {
      pref = NEXT[pref] || 'light';
      try { localStorage.setItem(KEY, pref); } catch (e) { /* 隐私模式忽略 */ }
      paint(pref);
    });
  }

  // 系统主题变化时，只有在「跟随系统」状态下才跟随
  var onSystemChange = function () {
    if ((root.dataset.mode || 'system') === 'system') paint('system');
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);

  paint(pref);

  // 多标签页同步
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) {
      pref = read();
      paint(pref);
    }
  });
})();
