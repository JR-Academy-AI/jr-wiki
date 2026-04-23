/**
 * MP Inline Styles · 共享库 · v1
 *
 * 公众号粘贴所需的 inline style 注入 + 富文本 clipboard 复制
 *
 * 背景：
 *   公众号编辑器剥光 <style> / class / var(--*)，只认 inline style="" + hex color。
 *   必须在 copy 前把所有 .mp-* class 样式展开成 inline。
 *   每日 mp-article.html 都要重写这段逻辑 → 统一到这里。
 *
 * 用法（daily mp-article.html 调一次 init 即可）：
 *
 *   <script src="../../_lib/mp-inline.v1.js"></script>
 *   <script>
 *     MpInline.init({
 *       articleSel: '#mp-article',       // 要复制的文章根节点
 *       copyBtnSel: '#mp-copy-btn',      // 点击触发复制的按钮
 *       brand: {                           // 品牌色（AI Daily 用默认，Uni News 传校色）
 *         primary: '#ff5757',              // 主题红 (h2 左边线 / meta author)
 *         highlight: '#ffce44',            // 高光黄 (oneline 左边线)
 *         dark: '#10162f',                 // 深色 (title / cta 背景)
 *         onDark: '#ffffff',               // 深色上文字
 *       },
 *       onStatus: (msg, kind) => {...},    // 状态回调（可选）
 *       onLog: (msg) => {...},             // 日志回调（可选）
 *     });
 *   </script>
 *
 * 你的 HTML 只要保持 class 约定（mp-title / mp-meta / mp-lead / mp-hook / mp-h2 /
 *   mp-img / mp-alt-img / mp-oneline / mp-source / mp-divider / mp-quickview / mp-cta）
 * 就能跑。brand 色会动态替换到 MP_INLINE_STYLES 里对应颜色位。
 *
 * 踩坑记录（从 2026-04-18/mp-article.html 继承）：
 *   - `background:` shorthand 会被微信剥 → 必须用 `background-color:`
 *   - `padding:` / `margin:` / `border:` shorthand 基本 OK
 *   - display:flex 变 block → .mp-meta 用纯文本排版
 *   - var(--*) / calc() / rgba() 不支持
 *   - 不支持 aspect-ratio
 *   - 裸 <div> 背景不可靠，用 <section> 包一层
 */
(function () {
  'use strict';

  const DEFAULT_BRAND = {
    primary: '#ff5757',
    highlight: '#ffce44',
    dark: '#10162f',
    onDark: '#ffffff',
  };

  /**
   * 根据 brand 色生成 MP_INLINE_STYLES 映射
   * 颜色硬编码位置：
   *   mp-h2 border-left-color   → brand.primary
   *   mp-oneline border-left    → brand.highlight
   *   mp-cta background         → brand.dark
   *   其他灰度 / 白 / 通用色不随 brand 变
   */
  function buildStyles(brand) {
    return {
      'mp-title':    'font-size:20px;font-weight:900;line-height:1.4;color:#000000;margin-bottom:10px;',
      'mp-meta':     'color:#8a8a8a;font-size:12px;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid #eeeeee;',
      'mp-lead':     'background-color:#f1f5f9;border-radius:8px;padding:13px 15px;font-size:14px;color:#334155;line-height:1.75;margin-bottom:22px;',
      'mp-hook':     `display:inline-block;background-color:${brand.dark};color:${brand.onDark};font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;margin-bottom:10px;letter-spacing:0.5px;`,
      'mp-h2':       `font-size:17px;font-weight:900;line-height:1.45;color:#000000;margin-top:12px;margin-bottom:12px;padding-left:10px;border-left:4px solid ${brand.primary};`,
      'mp-img':      `width:100%;max-width:100%;display:block;margin:12px 0 6px;border:2px solid ${brand.dark};border-radius:10px;background-color:#ffffff;`,
      'mp-alt-img':  'width:100%;max-width:100%;border-radius:8px;display:block;margin:10px 0 4px;',
      'mp-oneline':  `background-color:#fff4d1;border-left:3px solid ${brand.highlight};padding:10px 14px;font-size:14px;font-weight:500;color:#3a3a3a;margin:12px 0 14px;line-height:1.7;`,
      'mp-source':   'font-size:12px;color:#8a8a8a;padding-top:8px;margin-top:8px;border-top:1px dashed #e5e7eb;word-break:break-all;',
      'mp-divider':  'border:0;border-top:1px solid #e5e7eb;margin:22px 0;height:1px;',
      'mp-quickview':'background-color:#fff8ee;padding:16px;border-radius:8px;margin:22px 0;',
      'mp-cta':      `background-color:${brand.dark};color:${brand.onDark};padding:18px;border-radius:10px;text-align:center;margin-top:22px;`,
    };
  }

  /**
   * 扁平 class → inline 注入
   * 再加一组嵌套选择器样式（.mp-meta .author 等）
   * 最后把需要背景的块包一层 <section> 保公众号兼容
   */
  function applyInlineStyles(root, brand) {
    const styles = buildStyles(brand);

    // 1. 按 class 映射注入
    Object.entries(styles).forEach(([cls, style]) => {
      root.querySelectorAll('.' + cls).forEach(el => {
        el.setAttribute('style', style + (el.getAttribute('style') || ''));
      });
    });

    // 2. 嵌套选择器（原 CSS 后代选择器）
    root.querySelectorAll('.mp-meta .author').forEach(el =>
      el.setAttribute('style', `color:${brand.primary};font-weight:600;`));
    root.querySelectorAll('.mp-oneline strong').forEach(el =>
      el.setAttribute('style', 'color:#000000;'));
    root.querySelectorAll('.mp-source a').forEach(el =>
      el.setAttribute('style', 'color:#3b82f6;text-decoration:none;'));
    root.querySelectorAll('.mp-quickview h3').forEach(el =>
      el.setAttribute('style', 'font-size:15px;margin-bottom:10px;color:#000000;font-weight:700;'));
    root.querySelectorAll('.mp-quickview ul').forEach(el =>
      el.setAttribute('style', 'padding-left:18px;margin:0;'));
    root.querySelectorAll('.mp-quickview li').forEach(el =>
      el.setAttribute('style', 'font-size:13px;margin-bottom:6px;color:#475569;line-height:1.7;'));
    root.querySelectorAll('.mp-quickview li strong').forEach(el =>
      el.setAttribute('style', `color:${brand.dark};font-weight:700;`));
    root.querySelectorAll('.mp-cta .big').forEach(el =>
      el.setAttribute('style', `font-size:15px;font-weight:900;margin-bottom:4px;color:${brand.onDark};`));
    root.querySelectorAll('.mp-cta .sub').forEach(el =>
      el.setAttribute('style', 'font-size:12px;color:#d1d5db;line-height:1.7;'));

    // 3. 正文段落默认样式（若未设置过 margin）
    root.querySelectorAll('p').forEach(el => {
      const existing = el.getAttribute('style') || '';
      if (!existing.includes('margin-bottom') && !existing.includes('margin:')) {
        el.setAttribute('style', 'margin:0 0 12px;color:#333333;font-size:15px;line-height:1.85;' + existing);
      }
    });

    // 4. <code> 行内背景
    root.querySelectorAll('code').forEach(el =>
      el.setAttribute('style', `background-color:#f1f5f9;padding:1px 6px;border-radius:3px;font-size:13px;color:${brand.dark};`));

    // 5. 把需要颜色背景的块再包一层 <section>，保微信兼容
    ['mp-lead', 'mp-oneline', 'mp-quickview', 'mp-cta'].forEach(cls => {
      root.querySelectorAll('.' + cls).forEach(el => {
        if (el.tagName.toLowerCase() === 'section') return;
        const wrapper = document.createElement('section');
        wrapper.setAttribute('style', styles[cls] || '');
        el.removeAttribute('style');
        el.setAttribute('style', 'background-color:transparent;padding:0;margin:0;');
        wrapper.appendChild(el.cloneNode(true));
        el.replaceWith(wrapper);
      });
    });

    // 6. .mp-hook 转 <span> (inline-block 小标签)
    root.querySelectorAll('.mp-hook').forEach(el => {
      if (el.tagName.toLowerCase() === 'span') return;
      const span = document.createElement('span');
      span.setAttribute('style', styles['mp-hook'] || '');
      span.textContent = el.textContent;
      el.replaceWith(span);
    });
  }

  /**
   * 克隆 article 节点 → 注入 inline style → 写 clipboard (text/html + text/plain)
   * opts.article: HTMLElement 根节点（必填）
   * opts.brand:   品牌色
   * opts.onStatus(msg, kind='done'|'error'): 状态回调
   * opts.onLog(msg):                          日志回调
   */
  function mpCopyHtml(opts) {
    const brand = Object.assign({}, DEFAULT_BRAND, opts.brand || {});
    const onStatus = opts.onStatus || (() => {});
    const onLog = opts.onLog || (() => {});

    const article = opts.article.cloneNode(true);

    // 相对路径图片 → 绝对 URL（微信粘贴要自抓图）
    const base = new URL('.', location.href).href;
    article.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('./')) img.src = new URL(src, base).href;
      if (src && src.startsWith('../')) img.src = new URL(src, base).href;
    });

    // 去掉内部 caption
    article.querySelectorAll('.mp-caption, .mp-alt-caption').forEach(n => n.remove());

    // 展开 inline style
    applyInlineStyles(article, brand);

    const html = '<section style="max-width:677px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Noto Sans SC\',sans-serif;font-size:15px;line-height:1.85;color:#222">'
      + article.innerHTML + '</section>';
    const plain = article.innerText;

    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      navigator.clipboard.write([item]).then(() => {
        const bgHits = (html.match(/background-color:/g) || []).length;
        const colorHits = (html.match(/color:#[0-9a-f]{6}/gi) || []).length;
        const sectionHits = (html.match(/<section /g) || []).length;
        onLog(`✅ 复制成功 · ${html.length} 字符 · ${bgHits} 处 background-color · ${colorHits} 处 hex color · ${sectionHits} 个 <section>`);
        onLog('   若公众号粘贴后颜色丢失，先贴到 Notion/Gmail 对比 — 那里也无色=前端 bug，那里有色=微信剥掉了');
        onStatus('✅ 富文本已复制，粘到公众号编辑器（图片会自动抓取）', 'done');
      }).catch(err => {
        onStatus('❌ 复制失败: ' + err.message, 'error');
      });
    } catch {
      // Fallback: textarea execCommand
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      onLog('✅ 富文本已复制（fallback）');
      onStatus('✅ 富文本已复制', 'done');
    }
  }

  /**
   * 一次性 init：绑定复制按钮 click → 触发 mpCopyHtml
   */
  function init(config) {
    const brand = Object.assign({}, DEFAULT_BRAND, config.brand || {});
    const article = typeof config.articleSel === 'string'
      ? document.querySelector(config.articleSel)
      : config.articleSel;
    if (!article) {
      console.error('[mp-inline] articleSel not found:', config.articleSel);
      return null;
    }

    if (config.copyBtnSel) {
      const btn = typeof config.copyBtnSel === 'string'
        ? document.querySelector(config.copyBtnSel)
        : config.copyBtnSel;
      if (btn) {
        btn.addEventListener('click', () => mpCopyHtml({
          article,
          brand,
          onStatus: config.onStatus,
          onLog: config.onLog,
        }));
      } else {
        console.warn('[mp-inline] copyBtnSel not found:', config.copyBtnSel);
      }
    }

    return { brand, article };
  }

  window.MpInline = {
    init,
    mpCopyHtml,
    applyInlineStyles,
    buildStyles,
    DEFAULT_BRAND,
    version: 'v1',
  };
})();
