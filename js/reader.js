/* logbook ── 阅读体验：书脊进度、目录高亮、代码复制、表格横滚、回到顶部、抽屉。
   这些增强都在 JS 不加载时保持页面可读（内容本身不依赖 JS）。 */
(function () {
  'use strict';

  /* ── 1. 阅读进度：书脊（lg+）与顶边（<lg）二选一 ───────────────── */
  var spine = document.getElementById('spine-fill');
  var top = document.getElementById('top-fill');

  function paint() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
    if (spine) spine.style.transform = 'scaleY(' + p + ')';
    if (top) top.style.transform = 'scaleX(' + p + ')';
  }

  if (spine || top) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { paint(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  }

  /* ── 2. 目录：滚动时高亮当前小节 ─────────────────────────────── */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-nav a'));
  if (tocLinks.length) {
    var targets = tocLinks
      .map(function (a) {
        var id = decodeURIComponent((a.getAttribute('href') || '').replace(/^#/, ''));
        var el = id && document.getElementById(id);
        return el ? { link: a, el: el } : null;
      })
      .filter(Boolean);

    if (targets.length) {
      var mark = function (entry) {
        tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        if (entry) entry.link.setAttribute('aria-current', 'true');
      };

      var visible = [];
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var i = targets.findIndex(function (t) { return t.el === en.target; });
          if (i === -1) return;
          if (en.isIntersecting) visible.push(i);
          else visible = visible.filter(function (v) { return v !== i; });
        });
        if (visible.length) mark(targets[visible[0]]);
      }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });

      targets.forEach(function (t) { observer.observe(t.el); });
      mark(targets[0]);
    }
  }

  /* ── 3. 代码块：语言标签 + 复制按钮 ──────────────────────────── */
  document.querySelectorAll('.prose pre > code').forEach(function (code) {
    var pre = code.parentElement;
    /* Hugo 的 Chroma 输出是 <div class="highlight"><pre><code>，
       包一层框应该包 .highlight，而不是把 pre 从它里面拆出来。 */
    var hl = pre.closest('.highlight');
    var target = hl || pre;
    var block = target.closest('.code-block') || wrapBlock(target);
    if (!block || block.querySelector('.code-bar')) return;

    var lang = '';
    code.className.split(/\s+/).forEach(function (c) {
      if (c.indexOf('language-') === 0) lang = c.slice(9);
    });

    var bar = document.createElement('div');
    bar.className = 'code-bar';

    if (lang) {
      var label = document.createElement('span');
      label.textContent = lang;
      bar.appendChild(label);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.setAttribute('aria-label', '复制代码');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg><span>复制</span>';
    btn.addEventListener('click', function () {
      var text = code.innerText;
      var done = function () {
        btn.dataset.state = 'done';
        btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg><span>已复制</span>';
        setTimeout(function () {
          delete btn.dataset.state;
          btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/></svg><span>复制</span>';
        }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
      } else {
        fallback(text, done);
      }
    });
    bar.appendChild(btn);
    /* 插在第一行：这是一条头部带，不是浮在代码上的角标 */
    block.insertBefore(bar, block.firstChild);
  });

  function wrapBlock(pre) {
    var div = document.createElement('div');
    pre.parentNode.insertBefore(div, pre);
    div.appendChild(pre);
    div.className = 'code-block';
    return div;
  }

  function fallback(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { /* 无权限就算了 */ }
    document.body.removeChild(ta);
  }

  /* ── 4. 表格横向滚动：窄屏表格不该撑破正文 ──────────────────── */
  document.querySelectorAll('.prose table').forEach(function (table) {
    if (table.parentElement && table.parentElement.classList.contains('table-scroll')) return;
    var box = document.createElement('div');
    box.className = 'table-scroll';
    box.setAttribute('tabindex', '0');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', '表格（可横向滚动）');
    table.parentNode.insertBefore(box, table);
    box.appendChild(table);
  });

  /* ── 5. 回到顶部 ────────────────────────────────────────────── */
  var toTop = document.querySelector('[data-scroll-top]');
  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ── 6. 移动端抽屉 ──────────────────────────────────────────── */
  var drawer = document.getElementById('drawer');
  if (drawer && typeof drawer.showModal === 'function') {
    document.querySelectorAll('[data-drawer-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { drawer.showModal(); });
    });
    drawer.querySelectorAll('[data-drawer-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { drawer.close(); });
    });
    /* 点遮罩（dialog 外部）关闭 */
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) drawer.close();
    });
  }
})();
