/* search.js ── 站内搜索（⌘K / Ctrl+K / 「/」唤起）。
   索引由 Hugo 构建期内联进 #search-index，字段 t/u/d/y/g 分别是
   标题 / 相对链接 / 日期 / 年份 / 标签。 */
(function () {
  'use strict';

  var modal = document.getElementById('search-modal');
  if (!modal) return;

  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var countEl = document.getElementById('search-count');
  var scrim = document.getElementById('search-scrim');
  var tplWrap = document.getElementById('search-item-tpl');
  var btn = document.getElementById('search-btn');
  var raw = document.getElementById('search-index');

  var index = [];
  try { index = JSON.parse(raw ? raw.textContent : '[]') || []; } catch (e) { index = []; }
  if (!index.length) return;

  var selected = 0;
  var results = [];

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 把命中的片段包进 <mark>，先转义再插入，避免 XSS。
     用 \u0001 / \u0002 做哨兵，避免嵌套替换互相吃掉标签。 */
  var MARK = '\u0001', MARK_END = '\u0002';
  function highlight(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, MARK + '$1' + MARK_END);
    });
    return out.split(MARK).join('<mark>').split(MARK_END).join('</mark>');
  }

  function subsequence(hay, needle) {
    var i = 0;
    for (var j = 0; j < hay.length && i < needle.length; j++) {
      if (hay[j] === needle[i]) i++;
    }
    return i === needle.length;
  }

  function score(item, q, terms) {
    var t = item.t.toLowerCase();
    if (t === q) return 1000;
    if (t.indexOf(q) === 0) return 600;
    var idx = t.indexOf(q);
    if (idx > 0) return 500 - Math.min(idx, 60);
    if ((item.g || '').toLowerCase().indexOf(q) > -1) return 300;
    if (terms.length > 1 && terms.every(function (w) { return t.indexOf(w) > -1; })) return 200;
    if (t.indexOf(q) > -1) return 150;
    if (terms.length > 1 && subsequence(t, q.replace(/\s+/g, ''))) return 80;
    return 0;
  }

  function run(raw2) {
    var q = raw2.trim().toLowerCase();
    list.textContent = '';
    results = [];

    if (!q) {
      list.innerHTML = '<p class="search-empty px-3 py-8 text-center">输入关键词开始搜索。' +
        (index.length) + ' 篇文章已就绪。</p>';
      countEl.textContent = '';
      return;
    }

    var terms = q.split(/\s+/).filter(Boolean);
    results = index
      .map(function (item) { return { item: item, s: score(item, q, terms) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || (a.item.d < b.item.d ? 1 : -1); })
      .slice(0, 30)
      .map(function (r) { return r.item; });

    if (!results.length) {
      list.innerHTML = '<p class="search-empty px-3 py-10 text-center">没有匹配「' + esc(raw2.trim()) + '」的文章。</p>';
      countEl.textContent = '0 个结果';
      return;
    }

    var frag = document.createDocumentFragment();
    results.forEach(function (item, i) {
      var node = tplWrap.querySelector('[data-tpl]').cloneNode(true);
      node.href = item.u;
      node.id = 'search-hit-' + i;
      node.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

      var icon = node.querySelector('[data-icon]');
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
        'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M4.5 19.5 9 15l4 4 6.5-8.5"/><path d="M14.5 10.5h5v5"/></svg>';

      node.querySelector('[data-title]').innerHTML = highlight(item.t, terms);
      node.querySelector('[data-meta]').textContent = item.d + (item.g ? ' · ' + item.g : '');

      frag.appendChild(node);
    });
    list.appendChild(frag);

    selected = 0;
    countEl.textContent = results.length >= 30 ? '前 30 个结果' : results.length + ' 个结果';
  }

  function markSelected() {
    var nodes = list.querySelectorAll('[data-tpl]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('aria-selected', i === selected ? 'true' : 'false');
    }
    var cur = nodes[selected];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { scrim.classList.remove('opacity-0'); scrim.classList.add('opacity-100'); });
    input.focus();
    input.select();
  }

  function close() {
    modal.classList.add('hidden');
    scrim.classList.remove('opacity-100');
    scrim.classList.add('opacity-0');
    document.body.style.overflow = '';
  }

  function isOpen() { return !modal.classList.contains('hidden'); }

  if (btn) btn.addEventListener('click', function () { isOpen() ? close() : open(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-open-search]'), function (b) {
    b.addEventListener('click', open);
  });
  scrim.addEventListener('click', close);

  input.addEventListener('input', function () { run(input.value); });

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (e.key === '/' && !typing && !isOpen()) {
      e.preventDefault();
      open();
      return;
    }
    if (!isOpen()) return;

    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return;
      e.preventDefault();
      selected = (selected + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
      markSelected();
      return;
    }
    if (e.key === 'Enter') {
      var cur = list.querySelectorAll('[data-tpl]')[selected];
      if (cur) { e.preventDefault(); window.location.href = cur.getAttribute('href'); }
    }
  });

  run('');
})();
