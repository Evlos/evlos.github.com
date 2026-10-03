/* reader.js ── 阅读体验增强：阅读进度、代码复制、表格横向滚动、标题锚点、
   目录滚动高亮、回到顶部、照片灯箱。全部无依赖，渐进增强：
   任何一段失效都不影响正文可读。 */
(function () {
  'use strict';

  /* ── 阅读进度 ───────────────────────────────────────── */
  var bar = document.getElementById('progress');
  if (bar) {
    var ticking = false;
    var paint = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    paint();
  }

  var prose = document.querySelector('.prose');

  if (prose) {
    /* ── 代码块：包一层壳 + 注入语言标签与复制按钮 ───── */
    Array.prototype.forEach.call(prose.querySelectorAll('pre'), function (pre) {
      var block = pre.closest('.code-block');
      if (!block) {
        block = document.createElement('div');
        block.className = 'code-block';
        var holder = pre.parentElement;
        if (holder && holder.classList.contains('highlight')) {
          holder.parentNode.insertBefore(block, holder);
          block.appendChild(holder);
        } else {
          pre.parentNode.insertBefore(block, pre);
          block.appendChild(pre);
        }
      }
      if (block.querySelector('.code-bar')) return;

      var code = pre.querySelector('code');
      var m = code ? /language-([\w+#-]+)/.exec(code.className || '') : null;

      var lang = document.createElement('span');
      lang.className = 'code-lang';
      lang.textContent = m ? m[1] : 'text';

      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'code-copy';
      copy.setAttribute('data-state', 'idle');
      copy.textContent = '复制';
      copy.addEventListener('click', function () {
        var text = pre.innerText.replace(/\n$/, '');
        var done = function () {
          copy.setAttribute('data-state', 'done');
          copy.textContent = '已复制';
          window.setTimeout(function () {
            copy.setAttribute('data-state', 'idle');
            copy.textContent = '复制';
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(pre, done); });
        } else {
          fallback(pre, done);
        }
      });

      var bar2 = document.createElement('div');
      bar2.className = 'code-bar';
      bar2.appendChild(lang);
      bar2.appendChild(copy);
      block.appendChild(bar2);
    });

    function fallback(pre, done) {
      var ta = document.createElement('textarea');
      ta.value = pre.innerText;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
      document.body.removeChild(ta);
    }

    /* ── 表格：套一层容器，窄屏可横向滚动 ─────────────── */
    Array.prototype.forEach.call(prose.querySelectorAll('table'), function (table) {
      if (table.parentElement && table.parentElement.classList.contains('table-scroll')) return;
      var wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    /* ── 标题锚点 ─────────────────────────────────────── */
    Array.prototype.forEach.call(prose.querySelectorAll('h2[id], h3[id], h4[id]'), function (h) {
      if (h.querySelector('.heading-anchor')) return;
      var a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', '链接到此标题');
      a.textContent = '#';
      h.insertBefore(a, h.firstChild);
    });
  }

  /* ── 目录：滚动高亮 ─────────────────────────────────── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc-nav a[href^="#"]'));
  if (links.length) {
    var targets = links.map(function (a) {
      return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    }).filter(Boolean);

    var current = -1;
    var spy = function () {
      var line = window.scrollY + 130;
      var idx = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].offsetTop <= line) idx = i; else break;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        idx = targets.length - 1;
      }
      if (idx === current) return;
      current = idx;
      var id = targets[idx].id;
      links.forEach(function (a) {
        var on = decodeURIComponent(a.getAttribute('href').slice(1)) === id;
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    var spyTicking = false;
    window.addEventListener('scroll', function () {
      if (spyTicking) return;
      spyTicking = true;
      requestAnimationFrame(function () { spy(); spyTicking = false; });
    }, { passive: true });

    // 小屏目录点完自动收起
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        var d = a.closest('details');
        if (d) d.open = false;
      });
    });

    spy();
  }

  /* ── 回到顶部 ───────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-scroll-top]'), function (b) {
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ── 照片灯箱 ───────────────────────────────────────── */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('[data-lightbox-img]');
    var closeLb = function () {
      lb.setAttribute('hidden', '');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-lightbox-src]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lbImg.src = a.getAttribute('data-lightbox-src');
        lbImg.alt = a.getAttribute('data-lightbox-alt') || '';
        lb.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        var closer = lb.querySelector('[data-lightbox-close]:not([data-lightbox-img])');
        if (closer) closer.focus();
      });
    });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-lightbox-close]')) closeLb();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hasAttribute('hidden')) closeLb();
    });
  }
})();
