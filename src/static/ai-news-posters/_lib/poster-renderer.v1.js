/**
 * AI 每日头条海报 · 共享渲染库 · v1
 *
 * 用法（daily index.html 只需要调这一个函数）：
 *
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
 *   <script src="../_lib/poster-renderer.v1.js"></script>
 *   <script>
 *     PosterRenderer.renderAll({
 *       DATE: '2026-04-21',
 *       SUMMARY: { slug:'digest', frameLabel:'P0 · 合集', tags:[...], hook:[...], sub:'...', items:[...] },
 *       NEWS:    [{ slug:'01-...', frameLabel:'P1 · 单图', tags:[...], idx:'01', catText:'...', accent:'#ff5757', bg:{top,mid,bot,topRight}, title:[{text},{text,hl},{text}], titleSize:82, oneline:[{text},{text,bold}], bullets:[{k,v},...], src:'📎 ...' }, ... 4 more],
 *     });
 *   </script>
 *
 * 所有画法（layoutTokens / roundRectPath / drawQR / drawShell / drawSingle / drawSummary / drawFooter）
 * 都在这个库里，daily 页面不要重写这些，直接填数据 + 调 renderAll。
 *
 * 版本化（v1 / v2...）保证老页面不会被新改动破坏。
 *
 * WHY 用 Canvas 2D 原生绘制：
 *   旧的"DOM 截图"方案对 em padding + 大字号 + text-wrap:balance 会吞整行文字，
 *   下载 PNG 后标题整行消失（2026-04-21 事故根因）。Canvas 2D 用 ctx.fillText
 *   + measureText 完全可控，不依赖 DOM 布局，是这类场景的唯一稳健方案。
 */
(function () {
  'use strict';

  /* ============================ 常量 ============================ */

  const W = 1242, H = 1660;
  const OUTER = 32;   // 外层留白（对应原 .poster padding）
  const BORDER = 5;   // 黑色边框厚度
  const RADIUS = 36;  // 圆角
  const PAD_X = 72, PAD_Y = 80;  // 内容 padding

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

  /**
   * 把 [{text, hl?, bold?, color?}] tokens 按 maxW 自动换行
   * 支持 '\n' 显式换行
   * 换行策略：**原子级**——ASCII 词（字母/数字/连字符）保持整块，CJK 逐字，标点逐字
   *   这样 "OAuth"、"GPT-5.5"、"75%" 不会被拆断，中文仍能逐字折行
   * 返回 { lines: [[run...]], size, lineH }
   */
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

          // 开头空白：如果刚换行就吃掉（避免行首空格）
          if (isWs && curLine.length === 0) continue;

          // 原子太大超过一整行 → fallback 逐字切（罕见，超长英文单词）
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
            if (isWs) continue;  // 换行后的空白也吃掉
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

  /**
   * 绘制已排版的 tokens：
   *   hl=true run 背景加黄色圆角块
   *   bold=true run 换 boldWeight 画
   *   color 优先 token 自身色，否则 baseColor
   */
  function drawLaidOut(ctx, laid, startX, startY, fontSpec, baseColor, opts) {
    opts = opts || {};
    const hlBg = opts.hlBg || '#ffce44';
    const hlPadX = opts.hlPadX || 8;
    const hlPadY = opts.hlPadY || 4;
    const hlRadius = opts.hlRadius || 4;
    const boldWeight = opts.boldWeight || 900;
    const normalWeight = opts.normalWeight || opts.weight || 900;
    const { lines, size, lineH } = laid;

    // 第一遍：画 hl 背景
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

    // 第二遍：画文字
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

  /** 二维码（白底圆角 + 黑描边 + 黑色模块） */
  function drawQR(ctx, x, y, size, url) {
    if (typeof qrcode !== 'function') {
      console.error('[poster-renderer] qrcode-generator 未加载，QR 画不出来');
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

  function drawShell(ctx, bg) {
    // 投影块
    ctx.fillStyle = '#10162f';
    roundRectPath(ctx, OUTER + 14, OUTER + 14, W - OUTER * 2, H - OUTER * 2, RADIUS);
    ctx.fill();

    // 渐变背景
    const grad = ctx.createLinearGradient(0, OUTER, 0, H - OUTER);
    grad.addColorStop(0, bg.top);
    grad.addColorStop(0.5, bg.mid);
    grad.addColorStop(1, bg.bot);
    ctx.fillStyle = grad;
    roundRectPath(ctx, OUTER, OUTER, W - OUTER * 2, H - OUTER * 2, RADIUS);
    ctx.fill();

    // 右上角径向光晕
    if (bg.topRight) {
      const rg = ctx.createRadialGradient(W - OUTER - 80, OUTER + 80, 0, W - OUTER - 80, OUTER + 80, 520);
      rg.addColorStop(0, bg.topRight);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      roundRectPath(ctx, OUTER, OUTER, W - OUTER * 2, H - OUTER * 2, RADIUS);
      ctx.fill();
    }

    // 黑色边框
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = BORDER;
    roundRectPath(ctx, OUTER + BORDER / 2, OUTER + BORDER / 2, W - OUTER * 2 - BORDER, H - OUTER * 2 - BORDER, RADIUS - 2);
    ctx.stroke();

    // 右上角点阵
    drawDotDecor(ctx, W - OUTER - 340, OUTER + 20, 320, 320);
  }

  /* =========================== 单图海报 =========================== */

  function drawSinglePoster(ctx, d, DATE, articleUrl) {
    ctx.clearRect(0, 0, W, H);
    drawShell(ctx, d.bg);

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

    // idx 右对齐
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

    // Title
    const titleSpec = (s, w) => `${w || 900} ${s}px ${FF_CN}`;
    const titleLaid = layoutTokens(ctx, d.title, titleSpec, d.titleSize || 82, 1.12, CW);
    drawLaidOut(ctx, titleLaid, CX, y, titleSpec, '#10162f', {
      hlBg: '#ffce44', hlPadX: 10, hlPadY: 6, hlRadius: 6,
    });
    y += titleLaid.lines.length * titleLaid.lineH + 24;

    // 一句话黄底块
    const oneFontSize = 44;
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
    // b 用红色覆盖
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
    const bulletValSize = 34;
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

    // Footer
    const footerY = H - OUTER - BORDER - PAD_Y - 10;
    drawFooter(ctx, CX, footerY - 60, CW, d.src, articleUrl);
  }

  /* =========================== 合集海报 =========================== */

  function drawSummaryPoster(ctx, s, DATE, articleUrl) {
    ctx.clearRect(0, 0, W, H);
    drawShell(ctx, {
      topRight: 'rgba(59,130,246,0.18)',
      top: '#ffffff', mid: '#ffffff', bot: '#fff4e7',
    });

    const CX = OUTER + BORDER + PAD_X;
    const CW = W - 2 * (OUTER + BORDER + PAD_X);
    let y = OUTER + BORDER + PAD_Y;

    // 顶部：日期胶囊 + DIGEST
    const dateText = DATE.replace(/-/g, '·');
    ctx.font = `700 36px ${FF_MONO}`;
    ctx.textBaseline = 'alphabetic';
    const dateW = ctx.measureText(dateText).width;
    ctx.fillStyle = '#ffce44';
    roundRectPath(ctx, CX, y, dateW + 44, 72, 100);
    ctx.fill();
    ctx.strokeStyle = '#10162f';
    ctx.lineWidth = 3;
    roundRectPath(ctx, CX + 1.5, y + 1.5, dateW + 44 - 3, 69, 100);
    ctx.stroke();
    ctx.fillStyle = '#10162f';
    ctx.fillText(dateText, CX + 22, y + 50);

    ctx.font = `700 36px ${FF_MONO}`;
    ctx.fillStyle = '#ff5757';
    const dig = 'DIGEST';
    const digW = ctx.measureText(dig).width;
    ctx.fillText(dig, CX + CW - digW, y + 50);

    y += 72 + 40;

    // Hook
    const hookSize = 140;
    const hookSpec = (size, w) => `${w || 900} ${size}px ${FF_DISPLAY}`;
    const hookLaid = layoutTokens(ctx, s.hook, hookSpec, hookSize, 1.0, CW);
    // 第一遍：hl 的黄色下划线
    for (let li = 0; li < hookLaid.lines.length; li++) {
      const ly = y + li * hookLaid.lineH;
      for (const run of hookLaid.lines[li]) {
        if (!run.hl) continue;
        ctx.fillStyle = 'rgba(255,206,68,0.75)';
        const uy = ly + hookSize * 0.9;
        ctx.fillRect(CX + run.x, uy, run.width, 26);
      }
    }
    // 第二遍：文字
    ctx.textBaseline = 'alphabetic';
    for (let li = 0; li < hookLaid.lines.length; li++) {
      const ly = y + li * hookLaid.lineH;
      const baseline = ly + (hookLaid.lineH - hookSize) / 2 + hookSize * 0.82;
      for (const run of hookLaid.lines[li]) {
        ctx.font = `900 ${hookSize}px ${FF_DISPLAY}`;
        ctx.fillStyle = run.hl ? '#ff5757' : '#10162f';
        ctx.fillText(run.text, CX + run.x, baseline);
      }
    }
    y += hookLaid.lines.length * hookLaid.lineH + 20;

    // Sub
    ctx.font = `600 48px ${FF_CN}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(s.sub, CX, y + 48);
    y += 48 + 48;

    // 5 条列表
    const itemH = 140;
    const itemGap = 20;
    for (let i = 0; i < s.items.length; i++) {
      const it = s.items[i];
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, CX, y, CW, itemH, 20);
      ctx.fill();
      ctx.strokeStyle = '#10162f';
      ctx.lineWidth = 4;
      roundRectPath(ctx, CX + 2, y + 2, CW - 4, itemH - 4, 18);
      ctx.stroke();

      ctx.font = `700 60px ${FF_MONO}`;
      ctx.fillStyle = it.numColor || '#10162f';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.num, CX + 28, y + 80);

      ctx.font = `700 26px ${FF_MONO}`;
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(it.cat, CX + 140, y + 44);

      const titleMaxW = CW - 140 - 28;
      const tSpec = size => `900 ${size}px ${FF_CN}`;
      const tSize = fitText(ctx, it.t, tSpec, titleMaxW, 48, 32);
      ctx.font = tSpec(tSize);
      ctx.fillStyle = '#10162f';
      ctx.fillText(it.t, CX + 140, y + 44 + 32 + tSize);

      y += itemH + itemGap;
    }

    // Footer
    drawFooter(ctx, CX, H - OUTER - BORDER - PAD_Y - 80, CW, '📎 jiangren.com.au/blog/ai-daily', articleUrl);
  }

  /* =========================== Footer（含 QR） =========================== */

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

    // 左侧：src + brand
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

    ctx.font = `900 42px ${FF_CN}`;
    ctx.fillStyle = '#10162f';
    ctx.fillText('JR ACADEMY', cx, y + 48 + 52);
    const brandW = ctx.measureText('JR ACADEMY').width;
    ctx.font = `900 42px ${FF_CN}`;
    ctx.fillStyle = '#ff5757';
    ctx.fillText(' · AI 日报', cx + brandW, y + 48 + 52);

    ctx.font = `700 22px ${FF_MONO}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText('扫码看完整报道 →', cx, y + 48 + 52 + 44);

    drawQR(ctx, qrX, qrY, qrSize, articleUrl);
  }

  /* =========================== 页面外壳 =========================== */

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
        <h1>${opts.title || 'AI 每日头条海报'} · ${DATE} <em>Canvas 版</em></h1>
        <p>
          6 张 1242×1660 海报由 <code>Canvas 2D</code> 原生绘制 · 右下角自带二维码<br>
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
        ${opts.title || 'AI 每日头条'} · ${DATE} · 6 张海报 · 1242×1660 · <a href="../">← AI 海报 hub</a><br>
        Canvas 2D 原生渲染 · 二维码 → <code>${articleUrl.replace(/^https?:\/\//, '')}</code>
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

  function mountCards(posters) {
    const grid = document.getElementById('pr-grid');
    for (const p of posters) {
      const card = document.createElement('div');
      card.className = 'pr-frame';
      card.innerHTML = `
        <div class="pr-frame-label">${p.frameLabel || p.slug}</div>
        <div class="pr-meta">${(p.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        <div class="pr-canvas-wrap" data-preview="${p.slug}">
          <canvas data-id="${p.slug}" width="${W}" height="${H}"></canvas>
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

    injectFonts();
    injectStyles();
    renderPageShell(DATE, articleUrl, { title });
    mountCards([SUMMARY, ...NEWS]);
    bindEvents([SUMMARY, ...NEWS], DATE, articleUrl);

    // 等字体 ready 再画（否则 fallback 字体测宽会错位）
    try { await document.fonts.ready; } catch {}

    for (const p of [SUMMARY, ...NEWS]) {
      const c = document.querySelector(`canvas[data-id="${p.slug}"]`);
      if (!c) continue;
      const ctx = c.getContext('2d');
      if (p === SUMMARY) drawSummaryPoster(ctx, SUMMARY, DATE, articleUrl);
      else drawSinglePoster(ctx, p, DATE, articleUrl);
    }
  }

  window.PosterRenderer = {
    renderAll,
    // 暴露底层画法，以防未来需要单独调用
    _internal: {
      drawSinglePoster, drawSummaryPoster, drawFooter, drawShell, drawQR,
      layoutTokens, fitText, roundRectPath,
      CONST: { W, H, OUTER, BORDER, RADIUS, PAD_X, PAD_Y, FF_CN, FF_MONO, FF_DISPLAY },
    },
    version: 'v1',
  };
})();
