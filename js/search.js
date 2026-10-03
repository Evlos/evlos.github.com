/* logbook ── 站内搜索：⌘K / Ctrl+K / "/" 打开，原生 <dialog> 兜底焦点陷阱。 */
(function () {
  'use strict';

  var dlg = document.getElementById('search');
  var input = document.getElementById('search-input');
  var out = document.getElementById('search-results');
  var raw = document.getElementById('search-index');
  if (!dlg || !input || !out || !raw || typeof dlg.showModal !== 'function') return;

  var index;
  try { index = JSON.parse(raw.textContent); } catch (e) { return; }
  if (!index || !index.length) return;

  /* 预编译小写检索串：中文不分词，直接子串匹配即可，英文再按词首字母兜一层 */
  var items = index.map(function (it) {
    return {
      title: it.t, url: it.u, date: it.d, year: it.y, tags: it.g || [],
      hay: (it.t + ' ' + it.s + ' ' + (it.g || []).join(' ')).toLowerCase()
    };
  });

  var active = -1;
  var hits = [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mark(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var lower = text.toLowerCase();
    var i = lower.indexOf(q);
    if (i === -1) return safe;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function render(q) {
    active = -1;
    hits = [];
    if (!q) {
      out.innerHTML = '<p class="search-empty">输入关键词开始搜索。支持 <kbd class="border border-rule px-1 font-mono text-[0.85em]">⌘K</kbd> 或 <kbd class="border border-rule px-1 font-mono text-[0.85em]">/</kbd> 打开。</p>';
      return;
    }

    hits = items.filter(function (it) { return it.hay.indexOf(q) !== -1; }).slice(0, 40);

    if (!hits.length) {
      out.innerHTML = '<p class="search-empty">没有匹配「' + esc(q) + '」的条目。换个词试试，或者直接去<a href="/posts/" class="underline" style="text-decoration-color:var(--signal-line)">全部文章</a>里翻。</p>';
      return;
    }

    out.innerHTML = hits.map(function (it, i) {
      return '<a class="search-hit" role="option" aria-selected="false" href="' + esc(it.url) + '" data-i="' + i + '">' +
        '<span class="flex items-baseline justify-between gap-3">' +
          '<span class="text-[14.5px] font-semibold leading-snug text-ink">' + mark(it.title, q) + '</span>' +
          '<span class="eyebrow shrink-0 tabular-nums">' + esc(it.year) + '</span>' +
        '</span>' +
        '<span class="mt-1 block text-[12.5px] text-ink-mute">' + esc(it.date) + (it.tags.length ? ' · #' + esc(it.tags.join(' #')) : '') + '</span>' +
      '</a>';
    }).join('');
  }

  function move(step) {
    var nodes = out.querySelectorAll('.search-hit');
    if (!nodes.length) return;
    if (active >= 0) {
      nodes[active].setAttribute('aria-selected', 'false');
      nodes[active].style.background = '';
    }
    active = (active + step + nodes.length) % nodes.length;
    nodes[active].setAttribute('aria-selected', 'true');
    nodes[active].style.background = 'var(--signal-soft)';
    nodes[active].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!dlg.open) dlg.showModal();
    input.focus();
    input.select();
  }

  document.querySelectorAll('[data-search-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!dlg.open) { open(); }
    });
  });

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);

    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      dlg.open ? dlg.close() : open();
      return;
    }
    if (e.key === '/' && !typing && !dlg.open) {
      e.preventDefault();
      open();
      return;
    }
    if (!dlg.open) return;

    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      var node = out.querySelector('[data-i="' + active + '"]');
      if (node) { dlg.close(); window.location.href = node.getAttribute('href'); }
    }
  });

  var t;
  input.addEventListener('input', function () {
    clearTimeout(t);
    var q = input.value.trim().toLowerCase();
    t = setTimeout(function () { render(q); }, 80);
  });

  /* 关掉时清空，下次打开是干净的 */
  dlg.addEventListener('close', function () {
    input.value = '';
    render('');
  });
})();
