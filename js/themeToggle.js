/**
 * themeToggle.js
 * 负责：读取/写入 localStorage 中的主题设置，绑定按钮点击事件，
 * 并在切换时更新 <html data-theme="..."> 属性。
 *
 * 命名统一使用 camelCase。
 */
(function () {
  var STORAGE_KEY = 'site-theme';
  var DEFAULT_THEME = 'dark';

  function getStoredTheme() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      console.log('[themeToggle] getStoredTheme: read value =', value);
      return value;
    } catch (err) {
      console.warn('[themeToggle] getStoredTheme: failed to read localStorage', err);
      return null;
    }
  }

  function setStoredTheme(themeName) {
    try {
      window.localStorage.setItem(STORAGE_KEY, themeName);
      console.log('[themeToggle] setStoredTheme: saved theme =', themeName);
    } catch (err) {
      console.warn('[themeToggle] setStoredTheme: failed to write localStorage', err);
    }
  }

  function getCurrentTheme() {
    var current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    console.log('[themeToggle] getCurrentTheme: current data-theme =', current);
    return current;
  }

  function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    console.log('[themeToggle] applyTheme: html[data-theme] set to', themeName);
  }

  function toggleTheme() {
    var currentTheme = getCurrentTheme();
    var nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('[themeToggle] toggleTheme: switching', currentTheme, '->', nextTheme);
    applyTheme(nextTheme);
    setStoredTheme(nextTheme);
  }

  function initThemeToggleButton() {
    var toggleBtn = document.getElementById('themeToggleBtn');
    if (!toggleBtn) {
      console.warn('[themeToggle] initThemeToggleButton: #themeToggleBtn not found in DOM');
      return;
    }

    // 页面加载完成后，再次确保 data-theme 与 localStorage 一致
    // （header.html 中的预加载脚本已处理首屏无闪烁，这里做兜底同步）
    var storedTheme = getStoredTheme();
    if (storedTheme === 'light' || storedTheme === 'dark') {
      applyTheme(storedTheme);
    } else {
      console.log('[themeToggle] initThemeToggleButton: no stored theme, keeping default =', DEFAULT_THEME);
      setStoredTheme(DEFAULT_THEME);
    }

    toggleBtn.addEventListener('click', function (event) {
      event.preventDefault();
      console.log('[themeToggle] initThemeToggleButton: toggle button clicked');
      toggleTheme();
    });

    console.log('[themeToggle] initThemeToggleButton: event listener bound successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggleButton);
  } else {
    initThemeToggleButton();
  }
})();
