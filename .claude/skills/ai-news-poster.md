---
name: ai-news-poster
description: "为每日 AI 头条生成 '1 张合集 + 5 张单图' 海报套装（1242×1660 竖版，Neo-Brutalism 设计，沿用 quest-posters / xhs-poster 色板）。输出到 src/static/ai-news-posters/{YYYY-MM-DD}/index.html，自动更新 ai-news-posters hub 页。Use when user wants to produce daily AI news posters for Xiaohongshu / 朋友圈 / 公众号封面, or run the scheduled AI 每日头条海报 pipeline."
argument-hint: "[YYYY-MM-DD 可选，默认今天]"
---

# /ai-news-poster — AI 每日头条海报生成器

把 jr-wiki `/ai-daily-news` 产出的 Top 5 新闻，转成一套可直接投放的海报素材：1 张合集大图 + 5 张单图。全部 1242×1660 竖版（小红书聚光 / 朋友圈主图标准），Neo-Brutalism 风格对齐整个 curriculum 矩阵。

## 🔒 固定规格

| 项目 | 规格 |
|------|------|
| 尺寸 | **1242 × 1660**（3:4 竖版）锁死，不给备选 |
| 产出数量 | **1 合集（summary）+ 5 单图 = 6 张 / 天** |
| 下载 | 每张图下方 html2canvas「⬇ 下载 PNG」，固定 1374×1792（含边框 + 投影） |
| 输出目录 | `src/static/ai-news-posters/{YYYY-MM-DD}/index.html` |
| 汇总 hub | `src/static/ai-news-posters/index.html`（仿 `posters.html` 的卡片列表） |

## 🎨 设计语言（对齐 quest-posters.html）

### 色板（CSS 变量）
```css
--brand-red: #ff5757;    /* 强调 / highlight */
--brand-dark: #10162f;   /* 边框 + 文字主色 */
--brand-yellow: #ffce44; /* h2 em 下划线 / 合集番号 */
--brand-blue: #3b82f6;   /* 链接 / 次信息 */
--brand-green: #10b981;  /* 正面 / 新版 */
--bg-light: #f8f9fb;
--bg-cream: #fff1e7;
```

### Neo-Brutalism 要点
- 外层 `.poster` 留纯矩形 + padding（避免 html2canvas 圆角截图 bug）
- 内层 `.p-inner` 5px 黑边 + 36px 圆角 + offset shadow `6px 6px 0 var(--brand-dark)`
- 右上角点阵装饰（`radial-gradient` 1.5px dots, 28px spacing, opacity 0.1）
- h2 em 黄色下划线高亮

### 字体
- `Noto Sans SC` 900/700/500（主）
- `JetBrains Mono` 700（番号 / 日期 / category 标签）
- `Bricolage Grotesque` 900（合集大 hook）

### 字号铁律（1242 画布下的基准，手机端可读）

| 元素 | 画布字号 | 手机端 |
|------|---------|-------|
| 合集 hook（封面大字） | 140-160px | 42-48px |
| h2 新闻标题 | 92-100px | 28-30px |
| 一句话（高亮段） | 56-60px | 17-18px |
| 正文 / 列表 | 48px | 14px |
| 番号 / 标签 / 日期 | 36-44px | 11-14px |

**禁止正文低于 48px、h2 低于 92px。** 写完自查：手机上看不清 = 重做。

## 📐 两种海报的结构

### A. Summary 合集海报（1 张，放 Top 5 标题）

```
┌─────────────────────────────┐
│ AI 每日头条 · 2026-04-09    │  <- eyebrow（黑底白字小带）
│                             │
│  今天 5 条 AI 大新闻        │  <- h2 hook（100-140px）
│  一图看完                   │
│                             │
│  01  Anthropic 反超 OpenAI  │  <- 5 条编号列表，每条 60-72px
│  02  Claude Mythos 越狱     │     左侧大番号 + 新闻标题
│  03  3.5 GW TPU 扩容        │
│  04  Microsoft MAI 脱钩     │
│  05  Qwen 3.6 Plus 登顶     │
│                             │
│  🏷 jr-wiki/blog/ai-daily   │  <- 底栏 brand bar
│  📰 JR Academy AI 日报       │
└─────────────────────────────┘
```

### B. 单图海报（5 张，每条一张）

```
┌─────────────────────────────┐
│ 01 / 05    2026-04-09       │  <- 番号 + 日期（顶栏）
│ ● 模型发布                   │  <- category dot 标签
│                             │
│  Anthropic 营收年化          │  <- h2 新闻标题（92-100px）
│  破 300 亿，反超 OpenAI      │
│                             │
│ ┌─────────────────────────┐ │
│ │ 一句话：Anthropic 15 个 │ │  <- 黄底高亮引文块
│ │ 月翻 30 倍，训练烧的钱  │ │     56-60px
│ │ 只有 OpenAI 的 1/4     │ │
│ └─────────────────────────┘ │
│                             │
│  · 发生了什么                │  <- 3 条要点（48px）
│    Anthropic 从 10 亿...     │
│  · 为什么重要                │
│    商业结构 80% 来自企业...  │
│  · 对你的影响                │
│    Claude API 配额会...      │
│                             │
│  📎 来源 tradingkey.com      │  <- 底栏 source + brand
│  📰 JR Academy AI 日报       │
└─────────────────────────────┘
```

### 必须有的元素（每张都必须）
- **日期 bar**（顶栏 `YYYY-MM-DD`）
- **番号**（单图显示 `01 / 05`，合集显示 `DIGEST`）
- **brand bar 底栏**（`📰 JR Academy AI 日报 · jiangren.com.au/blog`）

不要放二维码 / 联系方式 / 绝对化用语（和 xhs-poster 聚光合规一致）。

## 📥 内容数据源

### 优先级
1. **首选**：同日 jr-wiki 已存在的 `ai-daily-{date}.md`
   - 路径：`jr-wiki/src/content/articles/ai-daily-{YYYY-MM-DD}.md`
   - 从 frontmatter `description` 提取 5 条 headline
   - 从每个 `## N. 标题` section 提取：标题、一句话、前 2 段正文、来源链接
2. **次选**：当天跑一次 `/ai-daily-news`（在 jr-wiki 目录）获取 md
3. **兜底**：WebSearch 现找 Top 5

### 字段映射

海报上的每条新闻需要这几个字段：
```yaml
index: 1              # 01-05 番号
category: 模型 / 融资 / 监管 / 工具 / 人事  # 单图顶栏标签
title: "新闻标题（h2，≤ 22 字）"
oneLine: "一句话（高亮块，30 字以内）"
bullets:
  - key: 发生了什么, value: "…（40 字以内）"
  - key: 为什么重要, value: "…"
  - key: 对你的影响, value: "…"
source:
  name: "媒体名"
  url: "原文链接"
```

category 推荐词：模型发布 / 营收融资 / 算力硬件 / 安全监管 / 开源工具 / 人事变动 / 产品更新 / 行业政策

## 🛠 执行步骤

### Step 1. 确认日期 + 拉原始新闻

```bash
DATE=${1:-$(date +%Y-%m-%d)}
```

读 `jr-wiki/src/content/articles/ai-daily-{DATE}.md`。读不到 → 报错提示先跑 `/ai-daily-news`。

### Step 2. 提取 5 条新闻

从 md 里 parse：
- frontmatter.title → 合集 hook 的副标题来源
- frontmatter.description → 5 条一句话 summary
- 正文每个 `## N.` block → 单条完整字段

### Step 3. 生成输出文件（单 HTML 承载 6 张）

路径：`src/static/ai-news-posters/{DATE}/index.html`

一个 HTML 文件塞下所有 6 张海报：
- 顶部：页面标题 + 预览缩放（`transform: scale(0.38)`）
- 依次 6 个 `.poster-frame`（summary + 5 单图），每张自带下载按钮
- 左侧固定缩略图导航（可选，6 个不多不需要）
- 底部：复用 xhs-poster 的 html2canvas 下载脚本

> 参考实现模板：见下文「HTML 骨架」章节，直接复制改数据。

### Step 4. 更新 hub 页

`src/static/ai-news-posters/index.html` 是所有日期的汇总入口（仿 `curriculum/posters.html` 的卡片列表）。每次新生成一天，就在 hub 页顶部插一张新卡片：

```html
<a class="day-card" href="./2026-04-09/">
  <div class="day-cover" style="background: linear-gradient(135deg, #10162f 0%, #ff5757 100%);">
    <div class="d-date">2026-04-09</div>
    <div class="d-hook">Anthropic 反超 OpenAI</div>
  </div>
  <div class="day-body">
    <div class="d-tag">AI 日报</div>
    <div class="d-list">
      <div>01 · Anthropic 营收破 300 亿</div>
      <div>02 · Claude Mythos 沙箱越狱</div>
      <div>03 · 3.5 GW TPU 扩容</div>
      <div>04 · Microsoft MAI 脱钩</div>
      <div>05 · Qwen 3.6 Plus 登顶</div>
    </div>
    <div class="d-meta">6 张 · 1242×1660 · 点击进入下载</div>
  </div>
</a>
```

Hub 页骨架同 `posters.html` 视觉（`#fff1e7` 底 / 3px 黑边 / `6px 6px 0 #000` offset shadow）。

### Step 5. 首次启用必做（仅首次）

1. **注册到 `curriculum/posters.html`**（CLAUDE.md 强制规则 2）
   - 在顶部"工具/资产集合"section 插入入口卡片指向 `./ai-news-posters/`
2. **更新 `.github/workflows/deploy.yml`**（CLAUDE.md 强制规则 1）
   - 在 Assemble 步骤加：
     ```yaml
     if [ -d ai-news-posters ]; then
       cp -r ai-news-posters _site/ai-news-posters
     fi
     ```

### Step 6. 输出说明

```
✅ AI 新闻海报 {DATE} 生成完成

目录: src/static/ai-news-posters/{DATE}/
├─ index.html            6 张海报（1 合集 + 5 单图）
预览: cd curriculum && python3 -m http.server 8090
     → http://localhost:8090/ai-news-posters/{DATE}/
Hub: http://localhost:8090/ai-news-posters/

导出:
- 每张海报下方点「⬇ 下载 PNG」，固定 1374×1792 带边框 + 投影
- 合集图适合：朋友圈、公众号文章头图、小红书单发
- 单图 5 张适合：小红书 carousel、社群每日 push
```

## 📝 HTML 骨架（直接改数据用）

所有结构、CSS、html2canvas 下载脚本见：
**`src/static/ai-news-posters/2026-04-09/index.html`**（demo 参考实现，直接拷贝改新闻数据）

关键 section：
- `:root` CSS 变量（brand color + 字号基准）
- `.poster-frame` / `.poster-scaler` / `.poster` / `.p-inner` 三层结构
- `.summary` class（合集样式） vs `.single` class（单图样式）
- `.dl-btn` + 底部 `<script>` 下载逻辑（从 xhs-poster 复制）

## 🚫 绝对禁止

1. **锁死 poster 高度为固定 1660** —— 必须 `height: auto`，内容自然撑开。锁高度会导致 overflow 截断、下载和预览不一致
2. 改 ratio 宽度（1242 写死，高度由内容决定）
3. 少于 6 张（1 合集 + 5 单图必须齐）
4. 营销套话（"在当今快速发展的 AI 时代" 立刻删）
5. 编造新闻 / 模糊来源（每条必须有真实 source url）
6. 正文 < 48px / h2 < 92px（手机看不清）
7. 没有日期 bar + 番号 + brand 底栏（三件套缺一不可）
8. 没有 html2canvas 下载按钮（每张必须能导出）
9. 首次启用忘记改 `posters.html` + `deploy.yml`（线上 404）

## 🚨 html2canvas 1.4.1 踩坑记录（血泪，每次必读）

### 坑 1: `box-shadow: Xpx Xpx 0 #dark` + inline 文字 → 文字被吞

**症状**: `.p-oneline` 带 offset 投影 + 包含 `<b>` inline 文字时，导出 PNG 里整块 oneline 只剩 `<b>` 文字漂浮，中间大段正文消失。

**原因**: html2canvas 1.4.1 对 offset box-shadow 的渲染路径有 bug，投影被错误地叠加在 inline 文字上。

**修法**: 用 `.p-oneline-wrap`（父 wrapper + `::before` 伪元素画一块 offset 深色矩形）替代 `box-shadow`。JS 在 load 时自动把 `.p-oneline` 包进 wrap：

```js
document.querySelectorAll('.p-oneline').forEach(el => {
  if (el.parentElement?.classList.contains('p-oneline-wrap')) return;
  const wrap = document.createElement('div');
  wrap.className = 'p-oneline-wrap';
  el.parentNode.insertBefore(wrap, el);
  wrap.appendChild(el);
});
```

```css
.p-oneline-wrap { position: relative; z-index: 2; }
.p-oneline-wrap::before {
  content: ''; position: absolute;
  left: 10px; top: 10px; width: 100%; height: 100%;
  background: #10162f; border-radius: 28px; z-index: 0;
}
.p-oneline { position: relative; z-index: 1; /* 在 wrap 内排于 ::before 之上 */ }
```

**同类元素也必须改**: 任何 offset box-shadow 在包含 inline 文字的块上都要改这种 wrapper 模式，或干脆去掉投影用加粗黑边替代。

### 坑 2: `getComputedStyle(el).background` 丢 linear-gradient

**症状**: 尝试读 `.poster-scaler` 的 background 复制给 `.poster-export-stage`，stage 渲染成完全透明 → 下方 shadow block 整个透过来盖住 poster。

**原因**: `background` shorthand 的 computed value 形如 `"none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0)"` —— 把 linear-gradient 拆到了 `backgroundImage` 里，shorthand 丢了。

**修法**: 不要用 `scalerStyles.background` 复制，直接写死纯色 `#ffffff`（或 `backgroundImage` + `backgroundColor` 分开读）。

### 坑 3: 固定 1660 高度 + `overflow:hidden` → 下载和预览不一致

**症状**: 预览看起来正常（transform scale），下载出来内容被截断或挤压。

**原因**: 56px 字号正文 + 3 bullets + title 常常自然高度就超过 1660。锁死高度 + overflow hidden 会截断，预览因 sub-pixel rounding 看起来"勉强"能塞下，导出时同样数据在 1:1 渲染就露馅。

**修法**: 全面放弃固定高度。
- `.poster { width: 1242px; height: auto; }`
- `.p-inner` 去掉 `height: 100%` 和 flex，纯 block
- `.p-brand { margin-top: 48px; }` 不再靠 `margin-top: auto`
- 下载脚本测 `clone.offsetHeight` 后算 `totalH` 传给 html2canvas

### 坑 4: `z-index: -1` 的 ::before 在 `z-index: 1` 父元素内渲染到前面

**症状**: 尝试用 `.s-item::before { z-index: -1 }` 做 offset shadow，结果 ::before 反而覆盖在 .s-item 的白色背景上面。

**原因**: 父元素 `z-index: 1`（正值）创建了 stacking context，子 ::before `z-index: -1` 仅在父的 context 内为 -1 —— 仍然 **高于**父自己的 background 层。

**修法**: 要么不给父元素 `z-index`（保持 auto），要么用 wrapper 方案（参考坑 1 的 `.p-oneline-wrap`）。

## ✅ 验证流程（每次生成完必跑）

```bash
cd curriculum && python3 -m http.server 8090
# 浏览器打开 http://localhost:8090/ai-news-posters/{date}/
```

1. 点每张「⬇ 下载 PNG」
2. **把下载的 PNG 和页面预览并排对比** —— 所有文字、颜色、投影、高亮必须 pixel-level 一致
3. 不一致的地方立刻回头查 box-shadow / linear-gradient / 固定高度 / z-index 这 4 个坑
4. 合规检查：无二维码 / 无绝对化用语 / 无联系方式

## 📰 公众号文章版（同目录独立页 mp-article.html + CI 预渲染 PNG）

海报页和公众号文章**拆成两个独立 HTML + 6 张真实 PNG**：

| 文件 | 作用 | 产出方式 |
|------|------|----------|
| `index.html` | 海报库：6 张大海报 + 下载按钮 | 手写（skill 主产出） |
| `mp-article.html` | 公众号发稿页：左手机预览文章 + 右操作面板 | 手写（skill 主产出） |
| `poster-0.png` … `poster-5.png` | 真实 PNG 文件，1242×1660 | **CI 自动** —— `scripts/render-ai-news-posters.mjs` 用 puppeteer-core + `page.screenshot` 把 6 个 `.poster` 元素从 `dist/ai-news-posters/{date}/index.html` 拍照产出到同目录 |

**为什么 PNG 必须是真实文件**：公众号编辑器粘贴 HTML 时，`<img src="data:image/png;base64,...">` 会被丢弃；`<img src="https://...poster-0.png">` 会被自动抓取 re-host 到它自己 CDN → 实现真正的"一次 Ctrl+V 完成发稿"。

### 🚨 硬性要求：每天新建 mp-article.html 时，复制函数必须把 class 样式展开成 inline style

> **适用范围**：这节要求对**每一天**跑 `/ai-news-poster` 新产出的 `ai-news-posters/{YYYY-MM-DD}/mp-article.html` 都生效——不是一次性改老文件，是每天新建文件必带的能力。以下四条限制 + 校验清单每次都要过。

公众号编辑器（mp.weixin.qq.com）在粘贴 HTML 时会：

1. **剥掉 `<style>` 标签** — 所有 class-based CSS 规则全部失效
2. **剥掉 class 属性的视觉效果** — 保留 class 字符串但不应用任何样式
3. **不解析 CSS 变量** — `var(--brand-red)` 之类的写法直接按文字处理、不上色
4. **只认 inline `style=""`** — 且每个属性必须是具体值（hex / rgb / 像素数字）

所以 `mp-article.html` 的 `mpCopyHtml()` 必须在序列化之前做这件事：
遍历 article 副本，按 class 名查表把颜色/背景/边框/内外边距/字体大小等写回到 `style=""`。这套逻辑固定叫 `MP_INLINE_STYLES`（class → 样式字符串的映射）+ `applyInlineStyles(root)`（遍历 + 注入 + 处理嵌套选择器 `.mp-meta .author` `.mp-oneline strong` `.mp-source a` `.mp-quickview h3/ul/li` `.mp-cta .big/.sub`、正文 `<p>`、`<code>`）。

**新建 mp-article.html 时必须整段从 `src/static/ai-news-posters/2026-04-18/mp-article.html` 照搬这两个常量 + 函数**，只改日期、标题、正文数据。**不要自作主张精简或重写**——漏了任何一条，粘贴到公众号就退化成黑白纯文本，要背景色、红色左边框、黄色 oneline、深色 hook 标签全部丢失。

校验清单（mp-article.html 生成完、push 前必须 ✅）：
- [ ] `<script>` 里有 `const MP_INLINE_STYLES = { ... }` 常量，至少覆盖 `mp-title / mp-meta / mp-lead / mp-hook / mp-h2 / mp-img / mp-alt-img / mp-oneline / mp-source / mp-divider / mp-quickview / mp-cta` 这 12 个 class
- [ ] `MP_INLINE_STYLES` 每条样式值都用 hex / rgb / 具体像素，**没有** `var(--*)`
- [ ] 有 `function applyInlineStyles(root)`，里面处理了所有嵌套选择器（见上）+ `<p>` + `<code>`
- [ ] `mpCopyHtml()` 里在拼 `html` 字符串之前调用了 `applyInlineStyles(article)`
- [ ] 本地打开 html → 点 📋 复制富文本 → 在任何 rich-text 输入框粘贴，应能看到背景色/边框/红色 h2 左条——若丢失说明哪条没展开

参考实现：`src/static/ai-news-posters/2026-04-18/mp-article.html` 第 411–498 行。

mp-article.html 生成时替换：
- `<title>`、`.mp-title`、`.mp-meta` 里的日期
- `.mp-lead`（引言，从 md 首段抄）
- 5 个 section：`.mp-hook`（分类）+ `.mp-h2`（标题）+ `<img class="mp-img" src="./poster-N.png" data-poster="poster-N" data-file="mp-0N-semantic.png">`（**真实 PNG 图片**，CI 会生成对应文件）+ `.mp-alt-img`（md 里的 Unsplash 图 URL）+ `.mp-oneline` + 3 段正文 + `.mp-source`
- `.mp-quickview` + `.mp-cta`
- `MP_POSTER_SLUGS` 映射：6 个 poster-id 对应的 `{ n, label, file }`（`file` 是下载时保存的文件名，如 `mp-02-opus47.png`；`src` 始终是 `./poster-N.png` 不变）

**字数目标**: 3000-4000 字（引言 + 5 条各 2-3 段 + 速览 + CTA）。低于 2500 退回重写。

**index.html 里必须有一条**: `.utility-bar` 的副文案末尾加 `想要公众号长文版 → <a href="./mp-article">📰 mp-article</a>` 链接。

## 🔗 相关 skill

- `/ai-daily-news`（jr-wiki 目录下）— 先跑这个生成 md，再跑本 skill
- `/xhs-poster` — 课程类小红书海报（结构类似，文案策略不同）

## 自动化 schedule 建议

在 `https://claude.ai/code/scheduled` 串联每日 3 步：
```
每天 9:00 AEST  cd jr-wiki && /ai-daily-news        # 产日报 md
每天 9:10 AEST  cd jr-wiki && /ai-news-poster       # 产 index.html + mp-article.html 双页
每天 9:15 AEST  cd jr-wiki && /publish              # push + 部署
```

产出当天由 GitHub Actions 自动部署到 `https://jr-academy-ai.github.io/jr-wiki/ai-news-posters/{YYYY-MM-DD}/`：
- `index.html` — 海报库（小红书 / 朋友圈 / 公众号素材）
- `mp-article.html` — 公众号发稿页（等渲染进度 100% 后复制/下载）
