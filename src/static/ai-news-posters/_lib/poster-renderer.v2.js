/**
 * AI 每日头条海报 · 共享渲染库 · v2
 *
 * v1 → v2 变化：
 *   1. FLEX_HEIGHT：canvas 高度自动选档（1660 / 1980 / 2310），文字长自动变高
 *   2. OVERFLOW_FALLBACK：超 2310 档位时的降级策略（shrink / ellipsis）
 *   3. measureSinglePoster()：dry-run 测量单图所需高度
 *   4. drawSinglePoster / drawFooter 接 canvasH 参数（不再硬编码 H）
 *
 * 向后兼容：renderAll 接口兼容 v1，默认 FLEX_HEIGHT:false。
 * 老页面（2026-04-21 及之前）继续用 v1，新页面用 v2。
 *
 * 用法：
 *
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
 *   <script src="../_lib/poster-renderer.v2.js"></script>
 *   <script>
 *     PosterRenderer.renderAll({
 *       DATE: '2026-04-23',
 *       SUMMARY: {...},
 *       NEWS: [...],
 *       FLEX_HEIGHT: true,                    // 开启 flex-height（推荐）
 *       HEIGHT_TIERS: [1660, 1980, 2310],     // 可选，默认这 3 档
 *       OVERFLOW_FALLBACK: 'shrink',          // 'shrink' | 'ellipsis'
 *     });
 *   </script>
 */
(function () {
  'use strict';

  /* ============================ 常量 ============================ */

  const W = 1242;
  const DEFAULT_H = 1660;
  const DEFAULT_HEIGHT_TIERS = [1660, 1980, 2310];

  const OUTER = 32;
  const BORDER = 5;
  const RADIUS = 36;
  const PAD_X = 72, PAD_Y = 80;

  const FF_CN = '"Noto Sans SC", system-ui, sans-serif';
  const FF_MONO = '"JetBrains Mono", monospace';
  const FF_DISPLAY = '"Bricolage Grotesque", "Noto Sans SC", sans-serif';

  /* ============================ 画法助手 ============================ */

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fitText(ctx, text, fontSpec, maxW, startSize, minSize) {
    let size = startSize;
    ctx.font = fontSpec(size);
    while (ctx.measureText(text).width > maxW && size > minSize) {
      size -= 4;
      ctx.font = fontSpec(size);
    }
    return size;
  }

  const ATOM_RE = /[A-Za-z0-9]+(?:[-'’·.][A-Za-z0-9]+)*%?|\s+|[^A-Za-z0-9\s]/g;

  function layoutTokens(ctx, tokens, fontSpec, size, lineHeight, maxW) {
    ctx.font = fontSpec(size);
    const lines = [];
    let curLine = [];
    let curX = 0;

    function pushLine() {
      if (curLine.length) lines.push(curLine);
      curLine = [];
      curX = 0;
    }

    for (const tok of tokens) {
      const pieces = tok.text.split('\n');
      for (let pi = 0; pi < pieces.length; pi++) {
        if (pi > 0) pushLine();
        const piece = pieces[pi];
        if (!piece) continue;

        const atoms = piece.match(ATOM_RE) || [];
        for (const atom of atoms) {
          const atomW = ctx.measureText(atom).width;
          const isWs = /^\s+$/.test(atom);

          if (isWs && curLine.length === 0) continue;

          if (atomW > maxW) {
            for (const ch of atom) {
              const cw = ctx.measureText(ch).width;
              if (curX + cw > maxW && curLine.length) pushLine();
              const run = { text: ch, hl: !!tok.hl, bold: !!tok.bold, color: tok.color, x: curX, width: cw };
              curLine.push(run);
              curX += cw;
            }
            continue;
          }

          if (curX + atomW > maxW) {
            pushLine();
            if (isWs) continue;
          }

          const run = {
            text: atom,
            hl: !!tok.hl,
            bold: !!tok.bold,
            color: tok.color,
            x: curX,
            width: atomW,
          };
          curLine.push(run);
          curX += atomW;
        }
      }
    }
    pushLine();

    return { lines, size, lineH: size * lineHeight };
  }

  function drawLaidOut(ctx, laid, startX, startY, fontSpec, baseColor, opts) {
    opts = opts || {};
    const hlBg = opts.hlBg || '#ffce44';
    const hlPadX = opts.hlPadX || 8;
    const hlPadY = opts.hlPadY || 4;
    const hlRadius = opts.hlRadius || 4;
    const boldWeight = opts.boldWeight || 900;
    const normalWeight = opts.normalWeight || opts.weight || 900;
    const { lines, size, lineH } = laid;

    if (hlBg !== 'transparent') {
      for (let li = 0; li < lines.length; li++) {
        const y = startY + li * lineH;
        for (const run of lines[li]) {
          if (!run.hl) continue;
          const bx = startX + run.x - hlPadX;
          const by = y + (lineH - size) / 2 - hlPadY + size * 0.08;
          const bw = run.width + hlPadX * 2;
          const bh = size * 0.92 + hlPadY * 2;
          ctx.fillStyle = hlBg;
          roundRectPath(ctx, bx, by, bw, bh, hlRadius);
          ctx.fill();
        }
      }
    }

    ctx.textBaseline = 'alphabetic';
    for (let li = 0; li < lines.length; li++) {
      const y = startY + li * lineH;
      const baseline = y + (lineH - size) / 2 + size * 0.82;
      for (const run of lines[li]) {
        const w = run.bold ? boldWeight : normalWeight;
        ctx.font = fontSpec(size, w);
        ctx.fillStyle = run.color || baseColor;
        ctx.fillText(run.text, startX + run.x, baseline);
      }
    }
  }

  function drawQR(ctx, x, y, size, url) {
    if (typeof qrcode !== 'function') {
      console.error('[poster-renderer.v2] qrcode-generator 未加载');
      return;
    }
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const modules = qr.getModuleCount();
    const QUIET = 16;
    const inner = size - QUIET * 2;
    const cell = inner / modules;

    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, x, y, size, size, 14);
    ctx.fill();
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, x + 1.5, y + 1.5, size - 3, size - 3, 13);
    ctx.stroke();

    ctx.fillStyle = '#10162f';
    const ox = x + QUIET, oy = y + QUIET;
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.6, cell + 0.6);
        }
      }
    }
  }

  function drawDotDecor(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(100,116,139,0.10)';
    const STEP = 28;
    for (let dx = STEP / 2; dx < w; dx += STEP) {
      for (let dy = STEP / 2; dy < h; dy += STEP) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawShell(ctx, bg, H) {
    // 投影块
    ctx.fillStyle = '#10162f';
    roundRectPath(ctx, OUTER + 14, OUTER + 14, W - OUTER * 2, H - OUTER * 2, RADIUS);
    ctx.fill();

    const grad = ctx.createLinearGradient(0, OUTER, 0, H - OUTER);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(0.5, bg.mid);
    grad.addColorStop(1, bg.bot);
    ctx.fillStyle = grad;
    roundRectPath(ctx, OUTER, OUTER, W - OUTER * 2, H - OUTER * 2, RADIUS);
    ctx.fill();

    if (bg.topRight) {
      const rg = ctx.createRadialGradient(W - OUTER - 80, OUTER + 80, 0, W - OUTER - 80, OUTER + 80, 520);
      rg.addColorStop(0, bg.topRight);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      roundRectPath(ctx, OUTER, OUTER, W - OUTER * 2, H - OUTER * 2, RADIUS);
      ctx.fill();
    }

    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = BORDER;
    roundRectPath(ctx, OUTER + BORDER / 2, OUTER + BORDER / 2, W - OUTER * 2 - BORDER, H - OUTER * 2 - BORDER, RADIUS - 2);
    ctx.stroke();

    drawDotDecor(ctx, W - OUTER - 340, OUTER + 20, 320, 320);
  }

  /* =========================== 测量（dry-run） =========================== */

  /**
   * 测量单图海报所需总高度（不实际画）
   * 用来选 flex-height 档位
   */
  function measureSinglePoster(ctx, d, shrinkLevel) {
    shrinkLevel = shrinkLevel || 0;
    const CW = W - 2 * (OUTER + BORDER + PAD_X);
    let y = OUTER + BORDER + PAD_Y;

    // 日期胶囊 + idx
    y += 72 + 28;
    // category
    y += 50 + 24;

    // title
    const titleSize = Math.max(48, (d.titleSize || 82) - shrinkLevel * 8);
    const titleSpec = (s, w) => `${w || 900} ${s}px ${FF_CN}`;
    const titleLaid = layoutTokens(ctx, d.title, titleSpec, titleSize, 1.12, CW);
    y += titleLaid.lines.length * titleLaid.lineH + 24;

    // oneline
    const oneFontSize = Math.max(34, 44 - shrinkLevel * 4);
    const onePadX = 36, onePadY = 30;
    const oneSpec = (s, w) => `${w || 700} ${s}px ${FF_CN}`;
    const oneLaid = layoutTokens(ctx, d.oneline, oneSpec, oneFontSize, 1.32, CW - onePadX * 2);
    const oneH = oneLaid.lines.length * oneLaid.lineH + onePadY * 2;
    y += oneH + 28;

    // 3 bullets
    const bulletKeySize = 26;
    const bulletValSize = Math.max(26, 34 - shrinkLevel * 4);
    const bulletPad = 22;
    for (const b of d.bullets) {
      const valSpec = (s, w) => `${w || 500} ${s}px ${FF_CN}`;
      const valLaid = layoutTokens(ctx, [{ text: b.v }], valSpec, bulletValSize, 1.32, CW - bulletPad * 2 - 8);
      const bulletH = bulletPad * 2 + bulletKeySize + 10 + valLaid.lines.length * valLaid.lineH;
      y += bulletH + 18;
    }

    // footer 占位（分割线 + qr + 品牌）
    y += 10 + 60 + 100;  // 分割线到 footer 底部的总高度

    // 底部 padding
    y += PAD_Y + BORDER + OUTER;

    return Math.ceil(y);
  }

  /**
   * 选档位：从 tiers 里找第一个 >= required 的
   * 若超最大档位，返回 null → 触发 OVERFLOW_FALLBACK
   */
  function selectHeightTier(requiredHeight, tiers) {
    for (const tier of tiers) {
      if (tier >= requiredHeight) return tier;
    }
    return null;
  }

  /* =========================== 单图海报 =========================== */

  function drawSinglePoster(ctx, d, DATE, articleUrl, H, shrinkLevel) {
    shrinkLevel = shrinkLevel || 0;
    ctx.clearRect(0, 0, W, H);
    drawShell(ctx, d.bg, H);

    const CX = OUTER + BORDER + PAD_X;
    const CW = W - 2 * (OUTER + BORDER + PAD_X);
    let y = OUTER + BORDER + PAD_Y;

    // 顶部：日期胶囊 + idx
    const dateText = DATE.replace(/-/g, '·');
    ctx.font = `700 36px ${FF_MONO}`;
    ctx.textBaseline = 'alphabetic';
    const dateW = ctx.measureText(dateText).width;
    const dateChipW = dateW + 44;
    const dateChipH = 72;
    ctx.fillStyle = '#ffce44';
    roundRectPath(ctx, CX, y, dateChipW, dateChipH, 100);
    ctx.fill();
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, CX + 1.5, y + 1.5, dateChipW - 3, dateChipH - 3, 100);
    ctx.stroke();
    ctx.fillStyle = '#10162f';
    ctx.fillText(dateText, CX + 22, y + dateChipH / 2 + 36 * 0.35);

    ctx.font = `700 44px ${FF_MONO}`;
    const idxW = ctx.measureText(d.idx).width;
    ctx.font = `700 32px ${FF_MONO}`;
    const totalW = ctx.measureText(' / 05').width;
    const idxRightX = CX + CW;
    ctx.fillStyle = '#10162f';
    ctx.font = `700 44px ${FF_MONO}`;
    ctx.fillText(d.idx, idxRightX - idxW - totalW, y + 44 + 12);
    ctx.fillStyle = '#64748b';
    ctx.font = `700 32px ${FF_MONO}`;
    ctx.fillText(' / 05', idxRightX - totalW, y + 44 + 12);

    y += dateChipH + 28;

    // Category
    ctx.fillStyle = d.accent;
    ctx.beginPath();
    ctx.arc(CX + 10, y + 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.accent + '30';
    ctx.beginPath();
    ctx.arc(CX + 10, y + 22, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10162f';
    ctx.font = `700 32px ${FF_CN}`;
    ctx.fillText(d.catText, CX + 40, y + 34);
    y += 50 + 24;

    // Title (with shrink support)
    const titleSize = Math.max(48, (d.titleSize || 82) - shrinkLevel * 8);
    const titleSpec = (s, w) => `${w || 900} ${s}px ${FF_CN}`;
    const titleLaid = layoutTokens(ctx, d.title, titleSpec, titleSize, 1.12, CW);
    drawLaidOut(ctx, titleLaid, CX, y, titleSpec, '#10162f', {
      hlBg: '#ffce44', hlPadX: 10, hlPadY: 6, hlRadius: 6,
    });
    y += titleLaid.lines.length * titleLaid.lineH + 24;

    // Oneline 黄底块
    const oneFontSize = Math.max(34, 44 - shrinkLevel * 4);
    const onePadX = 36, onePadY = 30;
    const oneSpec = (s, w) => `${w || 700} ${s}px ${FF_CN}`;
    const oneLaid = layoutTokens(ctx, d.oneline, oneSpec, oneFontSize, 1.32, CW - onePadX * 2);
    const oneH = oneLaid.lines.length * oneLaid.lineH + onePadY * 2;

    ctx.fillStyle = '#10162f';
    roundRectPath(ctx, CX + 10, y + 10, CW, oneH, 24);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    roundRectPath(ctx, CX, y, CW, oneH, 24);
    ctx.fill();
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 4;
    roundRectPath(ctx, CX + 2, y + 2, CW - 4, oneH - 4, 22);
    ctx.stroke();

    drawLaidOut(ctx, oneLaid, CX + onePadX, y + onePadY, oneSpec, '#10162f', {
      normalWeight: 700, boldWeight: 900, hlBg: 'transparent',
    });
    ctx.textBaseline = 'alphabetic';
    for (let li = 0; li < oneLaid.lines.length; li++) {
      const ly = y + onePadY + li * oneLaid.lineH;
      for (const run of oneLaid.lines[li]) {
        if (!run.bold) continue;
        const baseline = ly + (oneLaid.lineH - oneFontSize) / 2 + oneFontSize * 0.82;
        ctx.font = `900 ${oneFontSize}px ${FF_CN}`;
        ctx.fillStyle = '#ff5757';
        ctx.fillText(run.text, CX + onePadX + run.x, baseline);
      }
    }

    y += oneH + 28;

    // 3 bullets
    const bulletKeySize = 26;
    const bulletValSize = Math.max(26, 34 - shrinkLevel * 4);
    const bulletPad = 22;

    for (const b of d.bullets) {
      const valSpec = (s, w) => `${w || 500} ${s}px ${FF_CN}`;
      ctx.font = valSpec(bulletValSize);
      const valLaid = layoutTokens(ctx, [{ text: b.v }], valSpec, bulletValSize, 1.32, CW - bulletPad * 2 - 8);
      const bulletH = bulletPad * 2 + bulletKeySize + 10 + valLaid.lines.length * valLaid.lineH;

      const bgGrad = ctx.createLinearGradient(0, y, 0, y + bulletH);
      bgGrad.addColorStop(0, 'rgba(255,241,231,0.95)');
      bgGrad.addColorStop(1, 'rgba(255,255,255,0.98)');
      ctx.fillStyle = bgGrad;
      roundRectPath(ctx, CX, y, CW, bulletH, 16);
      ctx.fill();
      ctx.fillStyle = d.accent;
      ctx.fillRect(CX, y, 8, bulletH);

      ctx.textBaseline = 'alphabetic';
      ctx.font = `700 ${bulletKeySize}px ${FF_MONO}`;
      ctx.fillStyle = d.accent;
      ctx.fillText(b.k.toUpperCase(), CX + 8 + bulletPad, y + bulletPad + bulletKeySize);

      drawLaidOut(ctx, valLaid, CX + 8 + bulletPad, y + bulletPad + bulletKeySize + 10, valSpec, '#10162f', {
        normalWeight: 500, boldWeight: 700, hlBg: 'transparent',
      });

      y += bulletH + 18;
    }

    // Footer（位置基于 canvas H 动态算）
    const footerY = H - OUTER - BORDER - PAD_Y - 10;
    drawFooter(ctx, CX, footerY - 60, CW, d.src, articleUrl);
  }

  /* =========================== 合集海报（flex-height） =========================== */

  // Summary item 布局常量（给 measure + draw 共享）
  const SUMMARY_TITLE_SIZE = 44;
  const SUMMARY_TITLE_LINEH = 1.32;
  const SUMMARY_ITEM_PAD_Y = 26;
  const SUMMARY_ITEM_GAP = 20;
  const SUMMARY_ITEM_CAT_H = 42;    // 分类标签高度区
  const SUMMARY_ITEM_MIN_H = 130;
  const SUMMARY_ITEM_NUM_LEFT = 120; // 标题相对卡片左侧的偏移

  function layoutSummaryItem(ctx, it, CW) {
    const titleMaxW = CW - SUMMARY_ITEM_NUM_LEFT - 36;
    const tSpec = (s, w) => `${w || 900} ${s}px ${FF_CN}`;
    const tLaid = layoutTokens(
      ctx, [{ text: it.t }], tSpec,
      SUMMARY_TITLE_SIZE, SUMMARY_TITLE_LINEH, titleMaxW
    );
    const contentH = SUMMARY_ITEM_PAD_Y + SUMMARY_ITEM_CAT_H + 10 +
                     tLaid.lines.length * tLaid.lineH + SUMMARY_ITEM_PAD_Y;
    const itemH = Math.max(contentH, SUMMARY_ITEM_MIN_H);
    return { tLaid, tSpec, titleMaxW, itemH };
  }

  function measureSummaryPoster(ctx, s) {
    const CW = W - 2 * (OUTER + BORDER + PAD_X);
    let y = OUTER + BORDER + PAD_Y;

    // 顶部胶囊 + DIGEST label 行
    y += 72 + 40;

    // Hero DATE + 主标题 + sub 预留高度
    y += 180 + 20;     // date hero 最大 180 + 间隙
    y += 96 + 28 + 30; // headline 96 + padY*2 ~28 + 间隙
    y += 44 + 56;      // sub 44 + 间隙

    // 5 个 items（动态）
    for (const it of s.items) {
      const { itemH } = layoutSummaryItem(ctx, it, CW);
      y += itemH + SUMMARY_ITEM_GAP;
    }

    // footer (分割线 + 品牌 + QR 二维码区域)
    y += 40 + 200;

    // 底部 padding
    y += PAD_Y + BORDER + OUTER;

    return Math.ceil(y);
  }

  function drawSummaryPoster(ctx, s, DATE, articleUrl, H) {
    ctx.clearRect(0, 0, W, H);
    drawShell(ctx, {
      topRight: 'rgba(59,130,246,0.18)',
      top: '#ffffff', mid: '#ffffff', bot: '#fff4e7',
    }, H);

    const CX = OUTER + BORDER + PAD_X;
    const CW = W - 2 * (OUTER + BORDER + PAD_X);
    let y = OUTER + BORDER + PAD_Y;

    // 顶部小胶囊（只留最简，原日期胶囊文字已上移到 hero 位置）
    ctx.font = `700 30px ${FF_MONO}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffce44';
    roundRectPath(ctx, CX, y, 180, 64, 100);
    ctx.fill();
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, CX + 1.5, y + 1.5, 177, 61, 100);
    ctx.stroke();
    ctx.fillStyle = '#10162f';
    ctx.fillText('AI 日报', CX + 22, y + 44);

    ctx.font = `700 36px ${FF_MONO}`;
    ctx.fillStyle = '#ff5757';
    const dig = 'DIGEST';
    const digW = ctx.measureText(dig).width;
    ctx.fillText(dig, CX + CW - digW, y + 44);

    y += 64 + 48;

    // Hero DATE: "4月24日" 去年份
    const m = DATE.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const mm = m ? parseInt(m[2], 10) : 0;
    const dd = m ? parseInt(m[3], 10) : 0;
    const dateHeroText = `${mm} 月 ${dd} 日`;
    const dateSpec = size => `900 ${size}px ${FF_DISPLAY}`;
    const dateSize = fitText(ctx, dateHeroText, dateSpec, CW - 8, 180, 130);
    ctx.font = dateSpec(dateSize);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#10162f';
    ctx.fillText(dateHeroText, CX, y + dateSize * 0.82);
    y += dateSize + 20;

    // 主标题: "AI 五件大事"（黄底高亮块）
    const headlineText = 'AI 五件大事';
    const headlineSize = 96;
    const headlinePadX = 22;
    const headlinePadY = 14;
    ctx.font = `900 ${headlineSize}px ${FF_CN}`;
    const hW = ctx.measureText(headlineText).width;
    // 黄底
    ctx.fillStyle = '#ffce44';
    roundRectPath(ctx, CX, y, hW + headlinePadX * 2, headlineSize + headlinePadY * 2, 12);
    ctx.fill();
    // 黑字
    ctx.fillStyle = '#10162f';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(headlineText, CX + headlinePadX, y + headlinePadY + headlineSize * 0.82);
    y += headlineSize + headlinePadY * 2 + 30;

    // Sub line
    ctx.font = `700 44px ${FF_CN}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(s.sub || '一图看完 · 匠人 AI 日报', CX, y + 44);
    y += 44 + 56;

    // Items（flex-height，标题不再 fitText 缩字号）
    for (let i = 0; i < s.items.length; i++) {
      const it = s.items[i];
      const { tLaid, tSpec, itemH } = layoutSummaryItem(ctx, it, CW);

      // 卡片框
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, CX, y, CW, itemH, 20);
      ctx.fill();
      ctx.strokeStyle = '#10162f';
      ctx.lineWidth = 4;
      roundRectPath(ctx, CX + 2, y + 2, CW - 4, itemH - 4, 18);
      ctx.stroke();

      // 序号 01-05（垂直居中）
      ctx.font = `700 64px ${FF_MONO}`;
      ctx.fillStyle = it.numColor || '#10162f';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.num, CX + 26, y + itemH / 2 + 24);

      // 分类标签
      ctx.font = `700 26px ${FF_MONO}`;
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(it.cat, CX + SUMMARY_ITEM_NUM_LEFT, y + SUMMARY_ITEM_PAD_Y + 26);

      // 标题（可多行，固定 44px 大字号）
      drawLaidOut(
        ctx, tLaid,
        CX + SUMMARY_ITEM_NUM_LEFT,
        y + SUMMARY_ITEM_PAD_Y + SUMMARY_ITEM_CAT_H + 10,
        tSpec, '#10162f',
        { normalWeight: 900, boldWeight: 900, hlBg: 'transparent' }
      );

      y += itemH + SUMMARY_ITEM_GAP;
    }

    // Footer：位置基于动态 H 反推
    const footerY = H - OUTER - BORDER - PAD_Y - 170;
    drawFooter(ctx, CX, footerY, CW, '📎 jiangren.com.au/blog/ai-daily', articleUrl);
  }

  /* =========================== Footer =========================== */

  function drawFooter(ctx, cx, y, cw, srcText, articleUrl) {
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();

    const qrSize = 168;
    const qrX = cx + cw - qrSize;
    const qrY = y + 14;

    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 28px ${FF_MONO}`;
    ctx.fillStyle = '#64748b';
    const srcMaxW = cw - qrSize - 24;
    let src = srcText;
    while (ctx.measureText(src).width > srcMaxW && src.length > 4) {
      src = src.slice(0, -2);
    }
    if (src !== srcText) src = src.slice(0, -1) + '…';
    ctx.fillText(src, cx, y + 48);

    ctx.font = `900 44px ${FF_CN}`;
    ctx.fillStyle = '#10162f';
    ctx.fillText('匠人学院', cx, y + 48 + 52);
    const brandW = ctx.measureText('匠人学院').width;
    ctx.font = `900 44px ${FF_CN}`;
    ctx.fillStyle = '#ff5757';
    ctx.fillText(' · AI 日报', cx + brandW, y + 48 + 52);

    ctx.font = `700 22px ${FF_MONO}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText('扫码看完整报道 →', cx, y + 48 + 52 + 44);

    drawQR(ctx, qrX, qrY, qrSize, articleUrl);
  }

  /* =========================== 页面外壳（与 v1 一致） =========================== */

  const PAGE_STYLES = `
:root {
  --brand-red: #ff5757;
  --brand-dark: #10162f;
  --brand-yellow: #ffce44;
  --bg-cream: #fff1e7;
  --text-gray: #64748b;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Noto Sans SC", system-ui, sans-serif;
  background: linear-gradient(180deg, #fff 0%, #fff4e7 100%);
  color: var(--brand-dark);
  padding: 48px 24px 120px;
  min-height: 100vh;
}
.pr-wrap { max-width: 1360px; margin: 0 auto; }
.pr-header { text-align: center; margin-bottom: 40px; }
.pr-header h1 {
  font-size: 32px; font-weight: 900; letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.pr-header h1 em {
  font-style: normal; color: var(--brand-red);
  background: var(--brand-yellow); padding: 2px 12px; border-radius: 4px;
}
.pr-header p {
  font-size: 15px; color: var(--text-gray); line-height: 1.7;
}
.pr-header p code {
  background: #fff8ee; padding: 1px 7px; border-radius: 4px;
  font-family: "JetBrains Mono", monospace; font-size: 13px;
  border: 1px solid #ffe7b3;
}
.pr-actions-bar {
  display: flex; justify-content: center; align-items: center;
  flex-wrap: wrap; gap: 12px;
  margin: 24px auto 40px;
}
.pr-btn {
  font-family: "Noto Sans SC", sans-serif;
  font-size: 14px; font-weight: 800;
  padding: 12px 22px;
  border: 2px solid var(--brand-dark);
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--brand-dark);
  transition: all 0.12s;
  background: #fff; color: var(--brand-dark);
}
.pr-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--brand-dark);
}
.pr-btn:disabled { opacity: 0.5; cursor: wait; }
.pr-btn.primary { background: var(--brand-red); color: #fff; }
.pr-btn.ghost { background: #fff; color: var(--brand-dark); }
.pr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
}
.pr-frame {
  background: #fff;
  border: 2px solid var(--brand-dark);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 6px 6px 0 var(--brand-dark);
  display: flex; flex-direction: column;
}
.pr-frame-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 13px; font-weight: 700;
  color: var(--brand-dark);
  margin-bottom: 6px;
}
.pr-frame-label em {
  font-style: normal; color: var(--brand-red); font-weight: 700;
}
.pr-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.pr-meta span {
  font-size: 11px; font-weight: 700;
  padding: 3px 10px;
  background: var(--bg-cream);
  border: 1.5px solid var(--brand-dark);
  border-radius: 100px;
  color: var(--brand-dark);
  font-family: "JetBrains Mono", monospace;
}
.pr-canvas-wrap {
  background: #eef0f4;
  border-radius: 10px;
  padding: 14px;
  display: flex; justify-content: center;
  cursor: zoom-in;
}
.pr-canvas-wrap canvas {
  width: 100%;
  height: auto;
  display: block;
  box-shadow: 8px 8px 0 var(--brand-dark);
  border-radius: 8px;
  background: #fff;
}
.pr-card-actions { margin-top: 14px; display: flex; gap: 8px; }
.pr-card-actions .pr-btn { flex: 1; font-size: 13px; padding: 10px 12px; }
.pr-footer {
  text-align: center; margin-top: 60px;
  font-size: 12px; color: var(--text-gray);
}
.pr-footer a { color: var(--brand-red); text-decoration: none; font-weight: 700; }
.pr-footer code {
  background: #fff8ee; padding: 1px 6px; border-radius: 3px;
  font-family: "JetBrains Mono", monospace; font-size: 11px;
}
.pr-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(16,22,47,0.85);
  display: none; align-items: center; justify-content: center;
  padding: 24px;
}
.pr-lightbox.is-open { display: flex; }
.pr-lightbox-inner { position: relative; max-width: 92vw; max-height: 92vh; }
.pr-lightbox-inner img {
  max-width: 100%; max-height: 92vh;
  display: block; border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.pr-lightbox-close {
  position: absolute; top: -40px; right: 0;
  background: #fff; color: var(--brand-dark);
  border: 2px solid var(--brand-dark);
  padding: 6px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 800; cursor: pointer;
}
.pr-toast {
  position: fixed; right: 20px; bottom: 24px;
  background: var(--brand-dark); color: #fff;
  padding: 14px 20px; border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  font-size: 14px; opacity: 0;
  transform: translateY(20px);
  transition: all 0.25s;
  pointer-events: none;
  max-width: 320px;
  z-index: 10000;
}
.pr-toast.is-show { opacity: 1; transform: translateY(0); }
.pr-toast strong { display: block; font-weight: 900; margin-bottom: 2px; }
.pr-toast span { font-size: 13px; opacity: 0.88; }
`;

  function injectStyles() {
    if (document.getElementById('poster-renderer-styles')) return;
    const s = document.createElement('style');
    s.id = 'poster-renderer-styles';
    s.textContent = PAGE_STYLES;
    document.head.appendChild(s);
  }

  function injectFonts() {
    if (document.getElementById('poster-renderer-fonts')) return;
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = '';
    const f = document.createElement('link');
    f.id = 'poster-renderer-fonts';
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700&family=Bricolage+Grotesque:wght@900&display=swap';
    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(f);
  }

  function renderPageShell(DATE, articleUrl, opts) {
    const wrap = document.createElement('div');
    wrap.className = 'pr-wrap';
    wrap.innerHTML = `
      <header class="pr-header">
        <h1>${opts.title || 'AI 每日头条海报'} · ${DATE} <em>Canvas v2</em></h1>
        <p>
          6 张海报由 <code>Canvas 2D</code> 原生绘制 · 自动选高度（flex-height）<br>
          扫码直达 <code>${articleUrl.replace(/^https?:\/\//, '')}</code>
        </p>
      </header>
      <div class="pr-actions-bar">
        <button class="pr-btn primary" id="pr-download-all">⬇ 一键下载全部 PNG</button>
        <button class="pr-btn ghost" id="pr-copy-url">📋 复制文章链接</button>
      </div>
      <main>
        <div class="pr-grid" id="pr-grid"></div>
      </main>
      <footer class="pr-footer">
        ${opts.title || 'AI 每日头条'} · ${DATE} · 6 张海报 · 1242×flex · <a href="../">← AI 海报 hub</a><br>
        Canvas 2D · v2 flex-height · 二维码 → <code>${articleUrl.replace(/^https?:\/\//, '')}</code>
      </footer>
    `;
    document.body.appendChild(wrap);

    const lb = document.createElement('div');
    lb.className = 'pr-lightbox';
    lb.id = 'pr-lightbox';
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = `
      <div class="pr-lightbox-inner">
        <button class="pr-lightbox-close" id="pr-lightbox-close" type="button">关闭 ✕</button>
        <img id="pr-lightbox-img" alt="海报预览">
      </div>
    `;
    document.body.appendChild(lb);

    const toast = document.createElement('div');
    toast.className = 'pr-toast';
    toast.id = 'pr-toast';
    toast.innerHTML = '<strong id="pr-toast-title"></strong><span id="pr-toast-text"></span>';
    document.body.appendChild(toast);
  }

  function mountCards(posters, heights) {
    const grid = document.getElementById('pr-grid');
    for (let i = 0; i < posters.length; i++) {
      const p = posters[i];
      const h = heights[i] || DEFAULT_H;
      const card = document.createElement('div');
      card.className = 'pr-frame';
      card.innerHTML = `
        <div class="pr-frame-label">${p.frameLabel || p.slug}</div>
        <div class="pr-meta">${(p.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        <div class="pr-canvas-wrap" data-preview="${p.slug}">
          <canvas data-id="${p.slug}" width="${W}" height="${h}"></canvas>
        </div>
        <div class="pr-card-actions">
          <button class="pr-btn ghost" data-preview-btn="${p.slug}" type="button">👁 放大预览</button>
          <button class="pr-btn primary" data-dl="${p.slug}" type="button">⬇ 下载 PNG</button>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  function downloadOne(slug, DATE) {
    const c = document.querySelector(`canvas[data-id="${slug}"]`);
    if (!c) return;
    const a = document.createElement('a');
    a.download = `ai-news-${DATE}-${slug}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  function showToast(title, text) {
    const t = document.getElementById('pr-toast');
    document.getElementById('pr-toast-title').textContent = title;
    document.getElementById('pr-toast-text').textContent = text;
    t.classList.add('is-show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-show'), 2200);
  }

  function bindEvents(posters, DATE, articleUrl) {
    document.getElementById('pr-download-all').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = '下载中...';
      showToast('开始批量下载', '将按顺序导出 ' + posters.length + ' 张 PNG');
      for (const p of posters) {
        downloadOne(p.slug, DATE);
        await new Promise(r => setTimeout(r, 260));
      }
      btn.textContent = old;
      btn.disabled = false;
      showToast('批量下载完成', posters.length + ' 张 PNG 已触发下载');
    });

    document.getElementById('pr-copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText(articleUrl).then(() => {
        showToast('已复制', articleUrl);
      });
    });

    document.addEventListener('click', (e) => {
      const dl = e.target.closest('[data-dl]');
      if (dl) {
        downloadOne(dl.dataset.dl, DATE);
        showToast('已开始下载', dl.dataset.dl);
        return;
      }
      const preview = e.target.closest('[data-preview]') || e.target.closest('[data-preview-btn]');
      if (preview) {
        const slug = preview.dataset.preview || preview.dataset.previewBtn;
        const c = document.querySelector(`canvas[data-id="${slug}"]`);
        if (c) {
          document.getElementById('pr-lightbox-img').src = c.toDataURL('image/png');
          document.getElementById('pr-lightbox').classList.add('is-open');
        }
      }
      if (e.target.id === 'pr-lightbox-close' || e.target.id === 'pr-lightbox') {
        document.getElementById('pr-lightbox').classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.getElementById('pr-lightbox').classList.remove('is-open');
    });
  }

  /* =========================== 入口 =========================== */

  async function renderAll(config) {
    const { DATE, SUMMARY, NEWS } = config;
    if (!DATE || !SUMMARY || !NEWS) {
      throw new Error('PosterRenderer.renderAll: DATE / SUMMARY / NEWS 必填');
    }
    const articleUrl = config.articleUrl || `https://jiangren.com.au/blog/ai-daily-${DATE}`;
    const title = config.title || 'AI 每日头条海报';
    const flexHeight = !!config.FLEX_HEIGHT;
    const tiers = config.HEIGHT_TIERS || DEFAULT_HEIGHT_TIERS;
    const overflowFallback = config.OVERFLOW_FALLBACK || 'shrink';

    injectFonts();
    injectStyles();
    renderPageShell(DATE, articleUrl, { title });

    // 先把字体 ready，再 measure（否则字号会错）
    try { await document.fonts.ready; } catch {}

    // 预计算每张海报的高度
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = DEFAULT_H;
    const mctx = offscreen.getContext('2d');

    const heights = [];
    const shrinkLevels = [];

    // SUMMARY 也走 flex
    if (flexHeight) {
      const required = measureSummaryPoster(mctx, SUMMARY);
      heights.push(Math.max(required, 1400));
    } else {
      heights.push(DEFAULT_H);
    }
    shrinkLevels.push(0);

    // 单图 NEWS 每张自动选档
    for (const p of NEWS) {
      if (!flexHeight) {
        heights.push(DEFAULT_H);
        shrinkLevels.push(0);
        continue;
      }
      let shrinkLevel = 0;
      let tier = null;
      while (shrinkLevel <= 3) {
        const required = measureSinglePoster(mctx, p, shrinkLevel);
        tier = selectHeightTier(required, tiers);
        if (tier !== null) break;
        if (overflowFallback !== 'shrink') break;
        shrinkLevel++;
      }
      if (tier === null) {
        // fallback 失败 → 用最大档位强塞
        tier = tiers[tiers.length - 1];
        console.warn(`[poster-renderer.v2] ${p.slug} 超出最大档位 ${tier}，强制使用。建议裁剪内容。`);
      }
      heights.push(tier);
      shrinkLevels.push(shrinkLevel);
    }

    mountCards([SUMMARY, ...NEWS], heights);
    bindEvents([SUMMARY, ...NEWS], DATE, articleUrl);

    for (let i = 0; i < 1 + NEWS.length; i++) {
      const p = i === 0 ? SUMMARY : NEWS[i - 1];
      const c = document.querySelector(`canvas[data-id="${p.slug}"]`);
      if (!c) continue;
      const H = heights[i];
      c.height = H;
      const ctx = c.getContext('2d');
      if (i === 0) drawSummaryPoster(ctx, SUMMARY, DATE, articleUrl, H);
      else drawSinglePoster(ctx, p, DATE, articleUrl, H, shrinkLevels[i]);
    }
  }

  window.PosterRenderer = {
    renderAll,
    _internal: {
      drawSinglePoster, drawSummaryPoster, drawFooter, drawShell, drawQR,
      measureSinglePoster, selectHeightTier,
      layoutTokens, fitText, roundRectPath,
      CONST: { W, DEFAULT_H, DEFAULT_HEIGHT_TIERS, OUTER, BORDER, RADIUS, PAD_X, PAD_Y, FF_CN, FF_MONO, FF_DISPLAY },
    },
    version: 'v2',
  };
})();
