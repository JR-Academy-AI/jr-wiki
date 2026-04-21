/* 大学新闻 xhs-posters 共享：
 * 1) 右侧 copy 面板注入（读 window.XHS_COPY）
 * 2) 统一对海报标题做 auto-fit，避免预览和导出出现吞字/裁切
 *
 * 每张海报 poster-frame id（p1/p2/p3/p4/p5）对应 XHS_COPY 里的 key。
 * 下载仍走各自 xhs-posters.html 内联脚本，但内联脚本会复用这里暴露的 auto-fit。
 */
(function () {
  // Min 值对齐 20 字/行硬规则：body 不允许小于 50px，h2 不允许小于 96px
  var FIT_RULES = [
    { selector: '.p1 .hook', min: 180, step: 4 },
    { selector: '.p1 .sub', min: 60, step: 2 },
    { selector: '.p-news h2', min: 96, step: 3 },
    { selector: '.p-news .lead', min: 56, step: 2 },
    { selector: '.p-news .b-val', min: 44, step: 2 },
    { selector: '.p-news .b-key', min: 30, step: 1 },
    { selector: '.p5 h2', min: 144, step: 4 },
    { selector: '.p5 .sub', min: 50, step: 2 },
    { selector: '.p5 .quick-item .body h4', min: 50, step: 2 },
    { selector: '.p5 .quick-item .body p', min: 40, step: 1 }
  ];

  function collectPosters(scope) {
    if (!scope) return [];
    var posters = [];
    if (scope.matches && scope.matches('.poster')) posters.push(scope);
    if (scope.querySelectorAll) {
      posters = posters.concat(Array.from(scope.querySelectorAll('.poster')));
    }
    return posters;
  }

  function shrinkNode(node, min, step) {
    var current = parseFloat(node.style.fontSize || window.getComputedStyle(node).fontSize || '0');
    if (!current || current <= min) return false;
    node.style.fontSize = Math.max(min, current - step) + 'px';
    return true;
  }

  function fitPoster(poster) {
    var guard = 0;
    while (poster.scrollHeight > poster.clientHeight + 2 && guard < 200) {
      var changed = false;
      for (var i = 0; i < FIT_RULES.length; i++) {
        var rule = FIT_RULES[i];
        var nodes = poster.querySelectorAll(rule.selector);
        for (var j = 0; j < nodes.length; j++) {
          if (shrinkNode(nodes[j], rule.min, rule.step)) {
            changed = true;
            if (poster.scrollHeight <= poster.clientHeight + 2) return;
          }
        }
      }
      if (!changed) break;
      guard++;
    }
  }

  window.__applyUniPosterAutoFit = function (scope) {
    collectPosters(scope || document).forEach(fitPoster);
  };

  function injectPanels() {
    document.querySelectorAll('.poster-frame').forEach(function (frame) {
      if (frame.querySelector('.copy-panel')) return;
      var data = window.XHS_COPY[frame.id];
      if (!data) return;

      // 1. 把 poster-frame 里现有子节点（除了 .label）装进 .poster-main
      var main = document.createElement('div');
      main.className = 'poster-main';
      var label = frame.querySelector(':scope > .label');
      Array.from(frame.children).forEach(function (child) {
        if (child === label) return;
        if (child.classList && child.classList.contains('copy-panel')) return;
        main.appendChild(child);
      });
      frame.appendChild(main);

      // 2. 构建 copy panel
      var panel = document.createElement('div');
      panel.className = 'copy-panel';

      var head = document.createElement('div');
      head.className = 'cp-title';
      head.textContent = frame.id.toUpperCase() + ' · 文案素材';
      panel.appendChild(head);

      // Tabs
      var tabs = document.createElement('div');
      tabs.className = 'cp-tabs';
      var tabDefs = [
        { key: 'xhs', label: '📕 小红书', color: '#ff2442' },
        { key: 'wx',  label: '💬 朋友圈', color: '#059669' },
        { key: 'qun', label: '👥 社群',   color: '#3b82f6' }
      ];
      var panes = {};
      tabDefs.forEach(function (t, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cp-tab' + (idx === 0 ? ' active' : '');
        btn.dataset.tab = t.key;
        btn.textContent = t.label;
        btn.style.setProperty('--tab-color', t.color);
        btn.addEventListener('click', function () {
          panel.querySelectorAll('.cp-tab').forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
          Object.keys(panes).forEach(function (k) {
            panes[k].classList.toggle('hidden', k !== t.key);
          });
        });
        tabs.appendChild(btn);
      });
      panel.appendChild(tabs);

      function mkSection(label, text, cls) {
        var sec = document.createElement('div');
        sec.className = 'cp-section';
        var h = document.createElement('div');
        h.className = 'cp-label';
        h.textContent = label;
        var box = document.createElement('div');
        box.className = 'cp-box ' + (cls || '');
        box.textContent = text;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cp-btn';
        btn.textContent = '复制';
        btn.addEventListener('click', function () {
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = '✓ 已复制';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = '复制';
              btn.classList.remove('copied');
            }, 1500);
          }, function (e) { alert('复制失败：' + e.message); });
        });
        sec.appendChild(h); sec.appendChild(box); sec.appendChild(btn);
        return sec;
      }

      // 小红书 pane
      var xhsPane = document.createElement('div');
      xhsPane.className = 'cp-pane';
      xhsPane.appendChild(mkSection('📌 标题', data.title, ''));
      xhsPane.appendChild(mkSection('✍️ 正文', data.body, ''));
      xhsPane.appendChild(mkSection('# 话题标签', data.tags, 'hashtags'));

      var xhsAll = document.createElement('div');
      xhsAll.className = 'cp-section';
      var xhsAllBtn = document.createElement('button');
      xhsAllBtn.type = 'button';
      xhsAllBtn.className = 'cp-btn cp-all';
      xhsAllBtn.style.cssText = 'align-self:stretch;background:#ff2442;padding:9px 14px;font-size:12px';
      xhsAllBtn.textContent = '📕 复制小红书完整版（标题 + 正文 + 标签）';
      xhsAllBtn.addEventListener('click', function () {
        var full = data.title + '\n\n' + data.body + '\n\n' + data.tags;
        navigator.clipboard.writeText(full).then(function () {
          xhsAllBtn.textContent = '✓ 已复制完整版';
          setTimeout(function () {
            xhsAllBtn.textContent = '📕 复制小红书完整版（标题 + 正文 + 标签）';
          }, 1500);
        }, function (e) { alert('复制失败：' + e.message); });
      });
      xhsAll.appendChild(xhsAllBtn);
      xhsPane.appendChild(xhsAll);
      panes.xhs = xhsPane;
      panel.appendChild(xhsPane);

      // 朋友圈 pane
      var wxPane = document.createElement('div');
      wxPane.className = 'cp-pane hidden';
      var wxTip = document.createElement('div');
      wxTip.className = 'cp-tip';
      wxTip.textContent = '💡 朋友圈 6 行内不折叠，建议控制在 90 字以内';
      wxPane.appendChild(wxTip);
      (data.wechat || []).forEach(function (txt, i) {
        wxPane.appendChild(mkSection('版本 ' + (i + 1) + ' · ' + txt.length + ' 字', txt, 'wechat'));
      });
      panes.wx = wxPane;
      panel.appendChild(wxPane);

      // 社群 pane
      var qunPane = document.createElement('div');
      qunPane.className = 'cp-pane hidden';
      var qunTip = document.createElement('div');
      qunTip.className = 'cp-tip';
      qunTip.textContent = '💡 社群文案可稍长 / 带换行，直接群发';
      qunPane.appendChild(qunTip);
      (data.community || []).forEach(function (txt, i) {
        qunPane.appendChild(mkSection('版本 ' + (i + 1) + ' · ' + txt.length + ' 字', txt, 'community'));
      });
      panes.qun = qunPane;
      panel.appendChild(qunPane);

      frame.appendChild(panel);
    });
  }

  function boot() {
    window.__applyUniPosterAutoFit(document);
    if (window.XHS_COPY) injectPanels();
  }

  function onReady() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot, boot);
    } else {
      boot();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
