---
name: uni-news-poster
description: "为 src/content/universities/{school}/news-{YYYY-MM-DD}.md 产出两个渠道的投放素材：公众号发稿页（mp-article.html，全 inline style，按校 brand color）+ 小红书草稿（xhs-drafts.md，内嵌敏感词扫描）+ 小红书封面图（xhs-covers.html，1242×1660，每校不同背景特色）。不产出独立海报库，不做朋友圈素材。Use when user wants to produce daily University news materials for WeChat Official Account and Xiaohongshu (UQ/UMelb/UNSW/USYD/Monash/ANU/Adelaide/RMIT/UTS/UWA)."
argument-hint: "[YYYY-MM-DD 可选，默认今天] [school slug 可选：uq/umelb/unsw/usyd/monash/anu/adelaide/rmit/uts/uwa，不传则当天所有有 md 的学校都跑]"
sync-source: "xhs-review@1.0 / ai-news-poster (jr-wiki)"
---

# /uni-news-poster — 大学新闻 · 公众号 + 小红书素材生成器

把 `src/content/universities/{school}/news-{YYYY-MM-DD}.md` 每天 3 校的新闻日报，转成 **公众号一键复制稿 + 小红书草稿 + 小红书封面图**。两个渠道，每校独立 brand color。

**架构父文档**: `docs/UNI_NEWS_AUTOMATION_PRD.md`
**技术模板**: `.claude/skills/ai-news-poster.md`（mp-article 骨架照搬；不产海报库）

**scope 底线**: 不做独立海报库 / 不做朋友圈 / 不发单条新闻大海报。大学新闻主战场是小红书和公众号。

## 🔒 固定规格

| 产出 | 说明 |
|---|---|
| `mp-article.html` | 公众号发稿页，全 inline style，按校 brand color 做 section 底色 / 标签 / 分割线。Chrome 里点 📋 → 粘到 mp.weixin.qq.com 保留样式 |
| `xhs-drafts.md` | 小红书 1-2 篇草稿 + 敏感词扫描表格 + 人性化改写 |
| `xhs-covers.html` | 小红书封面图 1-2 张（1242×1660 竖版），每校不同背景特色（brand 底 + 纹样 + hook），html2canvas 下载 PNG |

**输出目录**: `src/static/uni-news-social/{YYYY-MM-DD}/{school}/`

## 🎓 每校 Brand Color + 纹样（写死）

```js
// Phase 1 只做 UQ，Phase 2 补全；纹样在 Phase 2 才必须按表走
const UNI_BRAND = {
  uq:       { primary: '#51247a', accent: '#ffce44', text: '#ffffff', pattern: 'dots',   nameCn: '昆士兰大学',       nameEn: 'UQ' },
  umelb:    { primary: '#094183', accent: '#ffce44', text: '#ffffff', pattern: 'dots',   nameCn: '墨尔本大学',       nameEn: 'UMelb' },
  unsw:     { primary: '#ffd100', accent: '#10162f', text: '#10162f', pattern: 'stripes',nameCn: '新南威尔士大学',   nameEn: 'UNSW' },
  usyd:     { primary: '#e64626', accent: '#ffce44', text: '#ffffff', pattern: 'grid',   nameCn: '悉尼大学',         nameEn: 'USYD' },
  monash:   { primary: '#006dae', accent: '#ffce44', text: '#ffffff', pattern: 'wave',   nameCn: '莫纳什大学',       nameEn: 'Monash' },
  anu:      { primary: '#c7a85c', accent: '#10162f', text: '#10162f', pattern: 'stripes',nameCn: '澳洲国立大学',     nameEn: 'ANU' },
  adelaide: { primary: '#002f5f', accent: '#ff5757', text: '#ffffff', pattern: 'dots',   nameCn: '阿德莱德大学',     nameEn: 'Adelaide' },
  rmit:     { primary: '#e60028', accent: '#000000', text: '#ffffff', pattern: 'grid',   nameCn: 'RMIT 皇家墨尔本理工', nameEn: 'RMIT' },
  uts:      { primary: '#0f4c81', accent: '#ff5757', text: '#ffffff', pattern: 'wave',   nameCn: '悉尼科技大学',     nameEn: 'UTS' },
  uwa:      { primary: '#27348b', accent: '#ffce44', text: '#ffffff', pattern: 'dots',   nameCn: '西澳大学',         nameEn: 'UWA' },
};
```

### 纹样 CSS（xhs-covers.html 顶层用）

```css
/* dots */
.bg-dots { background-image: radial-gradient(circle at 1px 1px, currentColor 1.5px, transparent 0); background-size: 28px 28px; opacity: 0.1; }
/* stripes */
.bg-stripes { background-image: linear-gradient(45deg, currentColor 1px, transparent 1px, transparent 20px); background-size: 28px 28px; opacity: 0.12; }
/* grid */
.bg-grid { background-image: linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px); background-size: 40px 40px; opacity: 0.1; }
/* wave - SVG inline */
.bg-wave { background-image: url("data:image/svg+xml,%3Csvg width='80' height='40' viewBox='0 0 80 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 20 0, 40 20 T 80 20' stroke='%23ffffff' stroke-width='2' fill='none' opacity='0.15'/%3E%3C/svg%3E"); background-size: 80px 40px; }
```

## 🎨 小红书封面风格（现代杂志 / 渐变卡片风，**不走 Neo-Brutalism**）

AI 新闻走 Neo-Brutalism（黑边 + offset shadow + 歪斜贴纸），受众是技术 geek，风格"硬、糙、锐"。
大学新闻受众是留学生（尤其女生），这套硬糙风不讨好。小红书封面改走**现代杂志 / 渐变卡片风**，精致、有层次、有设计感。

| 维度 | ❌ 不用 | ✅ 改用 |
|---|---|---|
| 边框 | 5-6px 粗黑边 | 无边框 / 1px 细线（半透明金 / 白） |
| 阴影 | offset `6px 6px 0 #10162f` 硬投影 | 柔和光晕 `0 8px 40px rgba(accent, .4)` / radial gradient 背景光斑 |
| 底色 | 纯色 + 点阵 | **线性渐变**（深紫 → 中紫 → 浅紫）+ 金色径向光晕 |
| 主标题字体 | Bricolage Grotesque 粗黑 | **Playfair Display**（衬线杂志感）或 Noto Serif SC 粗体，重点词用 italic 变形 |
| 数字字号 | 260px + 粗黑边 | 220-280px + `text-shadow` 光晕（无黑边） |
| 情绪贴纸 | 红底白字 Caveat + rotate -3° | 斜体衬线 + 金色柔光，不旋转、不带框 |
| Panel | 白底 + 黑边 + offset shadow | 玻璃卡片（半透明白 `rgba(255,255,255,.08)` + border-left accent 细线） |

### 结构（1242×1660）

```
┌─────────────────────────────┐
│ ● UQ  昆士兰大学     2026/04/14 │  <- 顶部细字（Mono，金色圆点 + logo）
│                             │
│ [ SCHOLARSHIP · 奖学金 ]     │  <- 分类 tag（金色细框 + 金字）
│                             │
│  奖学金                     │
│  20% 减免                   │  <- hook 大字（Playfair 144px，italic 换色）
│                             │
│  ─────────────────          │  <- 上细线（金色半透明）
│    20%                      │  <- 焦点大数字（280px Playfair，金色 + 光晕）
│    学费减免 · 覆盖全学位     │
│    + $10,000  Onshore Merit │
│  ─────────────────          │  <- 下细线
│                             │
│  ✨ 我差点就漏了这个         │  <- 情绪副标（italic 金色，无框）
│                             │
│  ▍5 月 31 日截止 · 自动评估  │  <- CTA（半透明白卡 + 金色左细线）
│    详情见评论区 »           │
│                             │
│  ● JR Academy · 澳洲留学     │  <- 底栏（细线 + Mono 字）
└─────────────────────────────┘
```

**必备元素**: 顶部 logo（学校标识，不带"JR Academy"）+ 至少一个焦点数字 + 情绪副标。

### 🚨🚨 小红书封面严格禁止（站外引流打击 · 限流/封号风险）

```
❌ 禁止出现在封面上的元素：
  - "JR Academy" / "匠人学院" / 公司品牌名
  - 任何网址域名（jiangren.com.au / .com / .cn 任何）
  - 微信号 / QQ 号 / 手机号（VX / 加V / 加微 / 薇信全部禁）
  - 二维码 / LOGO 的中英文品牌字样
  - "关注公众号" / "扫码加入" / "点击链接" / "私信领取"
  - 任何外部平台名（抖音号 / B站号 / 公众号名字）
```

封面只保留**新闻本身的内容价值**：学校 + 数据 + 情绪 + CTA（CTA 只能是"评论区聊"类，不得导流到站外）。

底栏可以保留，但**只能放分类 tag 或日期**，不放品牌/域名。示例合法底栏：
- `📍 2026-04-14 · 奖学金专题`（纯分类）
- `✦ Uni News · S2 申请季`（slogan 无导流）

违反任何一条上面封号红线 → 单条 post 限流 30 天 / 账号权重下降 / 严重者封号。

**字号铁律（1242 画布下，手机端可读）**:
| 元素 | 画布字号 | 手机端 |
|---|---|---|
| 主 hook (Playfair) | 130-160px | 40-48px |
| 焦点大数字 | 220-280px | 66-84px |
| stat-sub / CTA | 40-52px | 12-16px |
| 顶部 logo / 分类 tag / 底栏 | 28-36px | 9-11px |

**参考实现**: `src/static/uni-news-social/2026-04-14/uq/xhs-covers.html`（UQ 紫渐变 + 金色光晕 + Playfair 衬线 hook + 玻璃卡片 CTA）

## 🛠 执行步骤

### Step 1. 确认日期 + 学校

```bash
# ⚠️ 必须用 Australia/Sydney 时区（调度器跑在 UTC 会慢一天）
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}
SCHOOL=$2   # 可为空 → 自动扫当天所有有 md 的学校
```

读不到当天任何 `src/content/universities/*/news-{DATE}.md` → 报错提示"先确认 uni news 日报 job 是否跑完"。

### Step 2. parse md

每个学校的 md 按以下规则 parse：

```yaml
# frontmatter（必要字段）
title: string
description: string
publishDate: YYYY-MM-DD
university: slug
universityName: 英文名
universityNameCn: 中文名
tags: [uni-news, {school}]
```

正文每个 `## N. 标题` section 提取：

```ts
{
  index: 1,                                    // 01-03
  title: "去 '## 1. ' 前缀的原标题，≤22 字截短",
  oneLine: "h2 下第一段 body 首句（30 字内）",
  bullets: [                                   // 后续 2-3 段拆 3 点
    { key: "发生了什么", value: "…40 字内" },
    { key: "为什么重要", value: "…" },
    { key: "对你的影响", value: "…" },
  ],
  source: { name: "news.uq.edu.au", url: "从 > Source: [X](url) 抽" },
  category: "按关键词判定",   // 见下表
  xhsBullets: [                                // 小红书封面专用，每条 ≤10 字
    "High Achievers 20%",
    "9000 澳元/年",
    "自动评估 · 无需申请",
  ],
  xhsHook: "奖学金 20% 减免 / 我差点漏了这个！"  // 封面大字，≤20 字
}
```

**category 关键词判定表**（优先级从上到下）：

| 关键词出现 | category |
|---|---|
| 奖学金 / Scholarship | 奖学金 |
| 签证 / Visa / 移民 | 签证移民 |
| 学费 / Fee / 涨价 | 学费调整 |
| 招生 / Admission / 录取 | 招生政策 |
| 科研 / Research / 合作 | 科研合作 |
| 课程 / Course / 专业 | 课程更新 |
| Summer / Winter / Program | 项目开放 |
| 都没命中 | 校园动态 |

### Step 3. 产 mp-article.html（公众号发稿页）

路径：`src/static/uni-news-social/{DATE}/{school}/mp-article.html`

**硬性要求**：完全复用 `src/static/ai-news-posters/2026-04-18/mp-article.html` 第 411-498 行的三段：
1. `MP_INLINE_STYLES` 常量（覆盖 `mp-title / mp-meta / mp-lead / mp-hook / mp-h2 / mp-img / mp-alt-img / mp-oneline / mp-source / mp-divider / mp-quickview / mp-cta` 12+ class）
2. `applyInlineStyles(root)` 函数（嵌套选择器全列 + `<p>` / `<code>` 注入 + `<section>` 外包 + `.mp-hook` 转 span）
3. `mpCopyHtml()` 在拼 html 前调 `applyInlineStyles(article)`

**按校 brand color 微调**：把 `MP_INLINE_STYLES` 里的以下 class 的颜色换成当前学校的：
- `mp-hook` `background-color` → `UNI_BRAND[school].primary`
- `mp-hook` `color` → `UNI_BRAND[school].text`
- `mp-oneline` `background-color` → `UNI_BRAND[school].accent`（保持高亮特征）
- `mp-cta` `background-color` → `UNI_BRAND[school].primary`
- `mp-divider` `border-top-color` → `UNI_BRAND[school].primary`
- `mp-quickview` 左边框色 → `UNI_BRAND[school].primary`

**只改这些数据字段**：
- `<title>` + `.mp-title` + `.mp-meta` 的日期 + 学校名
- `.mp-lead`（引言，从 md `description` + 首段拼）
- 3 个 section：`.mp-hook`（category）+ `.mp-h2`（标题）+ `.mp-alt-img`（md 里的 Unsplash URL）+ `.mp-oneline` + 3 段正文 + `.mp-source`
- `.mp-quickview`（3 条 TL;DR） + `.mp-cta`（JR Academy 升学服务引流）

**去掉**：`<img class="mp-img" src="./poster-N.png">` 这行不要（因为本 skill 不产海报 PNG）。改用 `.mp-alt-img` 的 Unsplash 图作为每条新闻配图。

**字数**：2500-3500 字。低于 2500 退回重写。

**颜色铁律**：全程 6 位 hex / `background-color:` / 不用 `var(--*)` / 不用 `rgba()`（公众号编辑器不认）。

### Step 4. 产 xhs-covers.html（小红书封面图）

路径：`src/static/uni-news-social/{DATE}/{school}/xhs-covers.html`

单 HTML 塞 1-2 张 1242×1660 封面，每张下方 html2canvas 下载按钮。复用 `src/static/ai-news-posters/2026-04-18/index.html` 的：
- 外层 `.poster-frame` / `.poster-scaler` / `.poster` / `.p-inner` 三层结构
- html2canvas 下载脚本（注意避开 4 大坑，见下文）
- 下载文件名规则：`xhs-cover-{school}-{index}.png`（如 `xhs-cover-uq-1.png`）

**CSS `:root` 变量**：按 `UNI_BRAND[school]` 注入
```css
:root {
  --uni-primary: #51247a;
  --uni-accent: #ffce44;
  --uni-text: #ffffff;
}
.poster { background-color: var(--uni-primary); color: var(--uni-text); }
.poster::before { /* 注入纹样 */ content: ''; position: absolute; inset: 0; }
.poster.bg-dots::before { /* 点阵 */ ... }
.poster.bg-stripes::before { /* 斜纹 */ ... }
/* 等等 */
```

**内容来源**：`xhsHook` / `xhsBullets` 从 Step 2 parse 的数据取，每篇小红书草稿对应一张封面。

### Step 5. 产 xhs-drafts.md（小红书草稿）

路径：`src/static/uni-news-social/{DATE}/{school}/xhs-drafts.md`

格式：

```markdown
# {学校中文名} · {DATE} · 小红书草稿

> 封面图见 `xhs-covers.html`，每篇草稿对应 1 张封面图（`xhs-cover-{school}-{N}.png`）

## 草稿 1：{主打第一条新闻，情绪化标题}

📌 **标题**（{N} 字）: {标题文本}

📝 **正文**（{N} 字）:

{600-800 字正文}

🏷️ **标签**: #{学校英文} #澳洲留学 #{学校中文} #{题材} #...(5-8 个)

🖼️ **封面图**: xhs-cover-{school}-1.png

---

### 敏感词扫描

| 序号 | 原文 | 风险等级 | 替换建议 |
|---|---|---|---|
| 1 | "最好的课程" | 高危（绝对化） | "体感不错的课程" |
| 2 | "加V 领取" | 高危（引流） | "评论区扣 1" |
| ... | ... | ... | ... |

（没问题就写"✅ 未检出敏感词"）

---

## 草稿 2：{另一个角度切入，第 2 或第 3 条新闻}

（同上结构 + 对应 `xhs-cover-{school}-2.png`）
```

每校 1-2 篇草稿（优先 2 篇，新闻题材差异不够就 1 篇）。

### Step 6. 输出说明

```
✅ {school} 大学新闻素材 {DATE} 生成完成

目录: src/static/uni-news-social/{DATE}/{school}/
├─ mp-article.html   公众号发稿页（全 inline style · {school} brand color）
├─ xhs-drafts.md     小红书 1-2 篇草稿 + 敏感词报告
└─ xhs-covers.html   小红书封面图 1-2 张（1242×1660 · 每校不同背景特色）

预览:
  cd jr-wiki && python3 -m http.server 8090
  → http://localhost:8090/src/static/uni-news-social/{DATE}/{school}/

运营操作:
- 公众号：打开 mp-article.html，Chrome 里点 📋 → 粘到 mp.weixin.qq.com
- 小红书：打开 xhs-covers.html 下载 1-2 张封面 PNG → 打开 xhs-drafts.md
         复制文案 → 小红书 APP 发布时上传封面 + 粘贴文案
- **粘贴前必须核对 xhs-drafts.md 顶部的敏感词扫描表**

下一步:
  /publish
```

## 🚨 小红书敏感词规则（内嵌 · 不依赖外部 skill）

每次产 `xhs-drafts.md` 都要跑一遍这个扫描，把命中项写到草稿下方表格。

### 1. 绝对化用语（广告法 · 高危）

```
最、第一、唯一、首个、首选、最佳、最好、最大、最强、顶级、顶尖、极致、
绝对、万能、全网最低、独家、独创、首发、100%、零风险、零差评、国家级、
世界级、全球首款、史无前例、永久、无敌、销量冠军、销量第一、No.1、TOP1、
最低价、史上最便宜
```

**替换**: 换成"我觉得"、"体感不错"、"性价比挺高"、"用过的里面比较推荐的"

### 2. 教育场景专属（高危 · 小红书封号重点）

```
包过、不过退款、保录取、确定录、必中、100% 录取、保送、内部渠道、
稳上、稳过、名师保过、VIP 直通、中介挂羊头
```

**替换**: 直接删。不要用"帮你上 XX"、"助你冲刺 XX" 这种承诺式句子，改为"我怎么准备的"、"这几步我觉得有用"。

### 3. 引流/营销（平台打击 · 高危）

```
微信号、QQ号、手机号、加V、加微、VX、薇信（及谐音）、私我、私聊、
私信领取、点击链接、复制口令、关注公众号、关注抖音号、评论区留联系方式、
图片嵌入二维码、免费领、0元购
```

**替换**: "评论区扣 1"、"感兴趣的可以聊聊"、"有同学问我 XX，我的经验是..."。

### 🚨 3a. 封面专属禁令（文案 + 封面图都要扫）

文案和封面图**都不允许**出现：
- 品牌名："JR Academy"、"匠人学院"、任何公司品牌字样
- 网址："jiangren.com.au"、任何 `.com/.cn/.au` 域名、short link
- 外部平台名："公众号"、"抖音号"、"B 站"、"微博号"

**为什么单列**：这些都是小红书平台判定"站外引流"的典型信号。小红书禁止把用户导到站外，命中会直接降权或限流。连在文案里写"关注我们的公众号"都会被系统扫到。

**替换**：
- 想引流到公众号 / 官网 → 改成"评论区聊"、"有同学问过我这个流程，评论区扣 1"
- 想让用户记住品牌 → 靠文案风格统一性 + 账号主页介绍，不靠每篇 post 重复品牌名
- 封面底栏只放"分类 tag"或"日期 slogan"，不放品牌名 / 域名

### 4. AI 味典型（中危 · 降权风险）

禁词：
```
首先...其次...最后、值得注意的是、总的来说、综上所述、此外、
与此同时、不仅如此、作为一个、旨在、使得、进行了（+动词）
```

**替换**:
- "首先...其次" → 直接换段，用"先说 XX"、"另一件事"
- "此外" → "还有个事"、"顺便说一句"
- "值得注意的是" → "有个点挺重要"、删掉（九成后面的句子本身就够重要）
- "进行了优化" → "优化了"
- "作为一个 XX" → "我 XX"、"以 XX 的角度"

### 5. 医疗/化妆品（本场景极少用到 · 高危）

看到直接删，大学新闻不应出现"治疗"、"速效"、"药妆"、"纯天然"、"可以吃的护肤品"。

### 6. 政治/色情/金融（零容忍）

- 涉港澳台不当 / 领导人使用 / 历史虚无 → 此类题材不写
- 任何色情擦边、未成年人擦边 → 零容忍
- "保本"、"稳赚"、"年化收益 XX%"、"荐股" → 大学新闻不碰金融题材

### 7. 标签策略

- 5-8 个
- 必含：学校英文名（`#UQ` / `#UMelb`）+ `#澳洲留学`
- 推荐：`#留学生活`、`#留学干货`、`#{学校中文名}`、题材标签（`#奖学金` / `#科研` / `#签证`）
- **不用** `#{学校} 包过`、`#保录取` 这种

### 8. 扫描执行顺序

1. 先扫第 1/2/3/5/6 类（硬违规）→ 全部替换或删除
2. 再扫第 4 类（AI 味）→ 改口语
3. 最后扫第 7 类（标签）→ 确保合规
4. 在 `xhs-drafts.md` 的表格里列所有命中项 + 替换后的版本
5. 即便没命中也要写"✅ 未检出敏感词"，证明跑过扫描

## 🎨 人性化改写要求

小红书文案必须过这几关（写完自检，不过就改）：

1. **第一人称**: "我在 UQ 读大二"、"上周刚看到 XX 通知"
2. **有具体时间线**: "2026 年 5 月 31 日截止" 比 "近期截止" 好
3. **段落长短参差**: 有 1-2 句的短段，也有 4-5 句的长段
4. **emoji 克制**: 1-2 段插 1 个，不要每句都挂
5. **有小纠结/个人判断**: "我也在犹豫申 High Achievers 还是冲 Excellence"
6. **结尾互动**: "有同样在申请的姐妹扣 1"、"有问题评论区聊"
7. **标题 ≤20 字（含 emoji 算字数）**: 口语化、带数字、带对比

示例（UQ 奖学金题材）：

```
标题：UQ奖学金20%减免！我差点漏了这个🎓

正文：
上周刷 UQ 官网的时候发现，除了热度最高的 Excellence Scholarship（25% 学费减），
还有一个 International High Achievers Scholarship，20% 减免 + 自动评估，
覆盖整个学位周期。

我算了一下，CS 本科一年大概能省 9,000 澳元学费。申请门槛是本科 GPA
相当于国内 985 院校 85+，比 Excellence 的门槛宽不少。

还有一个叫 Onshore Merit 的，一次性 10,000 澳元，针对已经在澳洲读过
高中/本科/预科的学生。我之前在墨尔本读的 11-12 年级完全符合，
结果第一年没申请就错过了，肉疼。

UQ 2026 S2 申请 5 月 31 日截止，想冲的姐妹赶紧准备材料。
我觉得比起硬冲 Excellence，先确保能拿到 High Achievers + Onshore Merit
的组合更稳。

有一起申请 UQ 的姐妹吗？评论区扣 1 一起交流💬

标签：#UQ #澳洲留学 #昆士兰大学 #奖学金 #留学干货 #UQ申请 #留学生活
封面图：xhs-cover-uq-1.png
```

（这段自己也要过敏感词——"最"、"第一"、"绝对"、"包过"、"加V"全清，AI 味词全无，第一人称 + 具体数据 + 时间线 + 结尾互动齐全）

## 📝 HTML 骨架（直接改数据）

**mp-article.html**: 从 `src/static/ai-news-posters/2026-04-18/mp-article.html` 复制骨架，只换数据 + brand color 映射。

**xhs-covers.html**: 从 `src/static/ai-news-posters/2026-04-18/index.html` 复制 `.poster-frame` + html2canvas 脚本部分，简化为 1-2 张封面，按 `UNI_BRAND[school]` 注入颜色和纹样。

## 🚫 绝对禁止

1. **产独立海报库 `index.html`** — 大学新闻不做这个
2. **产单条新闻的大海报 poster-N.html** — 不做
3. **做朋友圈素材** — 两个出口就是小红书 + 公众号，朋友圈不管
4. `mp-article.html` 漏 `MP_INLINE_STYLES` / `applyInlineStyles` / `mpCopyHtml` 调用（漏一个粘到公众号变纯文本）
5. `mp-article.html` 用 `var(--*)` / `rgba()` / 3 位 hex（公众号不认）
6. `xhs-drafts.md` 不带敏感词扫描表格（哪怕"未检出"也必须写）
7. 小红书文案 / 封面出现 VX / 加V / 包过 / 保录取 / 绝对化用语 / 二维码
8. 营销套话（"在当今全球化的留学浪潮中" 立刻删）
9. 编造新闻 / 模糊来源（正文每条必须有真实 source）
10. 封面图正文 < 48px / hook < 100px
11. 封面缺日期 / 学校 eyebrow / brand 底栏

## 🚨 html2canvas 1.4.1 4 大坑（xhs-covers.html 必读）

1. **box-shadow + inline 文字吞字** → 用 `.p-oneline-wrap` + `::before` 伪元素替代 `box-shadow`
2. **`getComputedStyle(el).background` 丢 linear-gradient** → 写死纯色（不要复制 scaler 的 background）
3. **固定 1660 高度 + overflow:hidden 截断** → `.poster { height: auto }`，放弃固定高度
4. **`z-index: -1` ::before 渲染到前面** → 父元素不给 `z-index`，用 wrapper 方案

详细修法见 `.claude/skills/ai-news-poster.md` 同名章节，一字不改搬过来。

## ✅ 验证流程（每次生成完必跑）

```bash
cd jr-wiki
python3 -m http.server 8090
# 浏览器：http://localhost:8090/src/static/uni-news-social/{DATE}/{school}/
```

1. 打开 `xhs-covers.html` → 每张「⬇ 下载 PNG」→ 和预览 pixel-level 对比，底色是校 brand 色
2. 打开 `mp-article.html` → 点 📋 复制 → 粘到 Gmail/Notion，确认深色 hook 胶囊 / brand 色 section 底 / 黄色 oneline 都在
3. 打开 `xhs-drafts.md` → 扫描表格是否列全；手动再过一遍文案找漏网
4. 合规检查：无二维码 / 无 VX / 无绝对化 / 无"包过"

### schedule 跑完自检 grep（产出后、`/publish` 前必跑）

```bash
OUT=src/static/uni-news-social/{DATE}/{school}
MP=$OUT/mp-article.html
XHS=$OUT/xhs-drafts.md
COV=$OUT/xhs-covers.html

# mp-article.html 三段核心
grep -q "const MP_INLINE_STYLES" $MP       || echo "❌ mp 缺 MP_INLINE_STYLES"
grep -q "function applyInlineStyles" $MP   || echo "❌ mp 缺 applyInlineStyles"
grep -q "applyInlineStyles(article)" $MP   || echo "❌ mpCopyHtml 没调 applyInlineStyles"

# var(--*) 只在 #mp-article 内部才算违规（外层页面 CSS 用 var 不会被复制到公众号）
awk '/<article[^>]*id="mp-article"/,/<\/article>/' $MP | grep -q "var(--" \
  && echo "⚠️ mp-article 内部有 var(--*)，公众号不认" || true

# xhs-drafts.md 有敏感词扫描表
grep -q "敏感词扫描\|未检出敏感词" $XHS    || echo "❌ xhs 缺敏感词扫描表"

# xhs 硬违规词：只扫 📝 正文区域，跳过 ### 敏感词扫描 下的说明表（那里会列禁词作为示例）
awk '/^📝 \*\*正文\*\*/,/^### 敏感词扫描/' $XHS \
  | grep -Eq "加V|加微|VX|薇信|包过|保录取|最好|最佳|100%" \
  && echo "⚠️ xhs 正文有硬违规词，回去清" || true

# 封面文件存在 + 有下载脚本
ls $COV >/dev/null                         || echo "❌ 缺 xhs-covers.html"
grep -q "html2canvas" $COV                 || echo "❌ xhs-covers.html 缺下载脚本"

# 封面站外引流扫描（JR Academy / jiangren.com.au / 公众号 等品牌/域名绝对不能出现在封面上）
! grep -Eq "JR Academy|匠人学院|jiangren\.com|关注公众号|抖音号" $COV \
  && ! grep -Eq "JR Academy|匠人学院|jiangren\.com|关注公众号|抖音号" $XHS \
  || echo "❌❌ 封面/草稿出现品牌名/域名/引流词，小红书封号风险！立刻清掉"
```

**关键点**：
- `var(--*)` 只查 `<article id="mp-article">` 内部（用 awk 截取），外层页面 CSS 壳层用 var 不影响公众号复制结果
- `xhs` 硬违规词只查 `📝 正文` 到 `### 敏感词扫描` 之间的区域，避开说明表里列出的禁词示例

任何一条不通过 **禁止进 `/publish`**。

## 🔗 相关

- **父 PRD**: `docs/UNI_NEWS_AUTOMATION_PRD.md`
- **技术模板**: `.claude/skills/ai-news-poster.md`（mp-article 骨架 + html2canvas 修坑）
- **上游 md**: `src/content/universities/{school}/news-{date}.md`（数据源，别的 job 产）
- **通用小红书规则**: `~/.claude/skills/xhs-review/SKILL.md`（本 skill 内嵌版的来源，同步时对 diff）

## 自动化 schedule 建议

Phase 2 加一个 remote trigger（`claude.ai/code/scheduled` 新建）：

```
每天 12:30 AEST  cd jr-wiki && /uni-news-poster     # 自动扫当天所有有 md 的学校逐个跑
每天 12:50 AEST  cd jr-wiki && /publish             # push + 部署
```

**超时应急**：3 校 / 天，每校 3 个产物，estimate 6-10 分钟，单个 trigger 跑得开。

### 🚨 schedule 跑时的硬性要求

定时任务没人盯，以下 4 条漏任意一条 → 当天内容报废：

1. `mp-article.html` 必须带完整 `MP_INLINE_STYLES` 表 + `applyInlineStyles()` 函数 + `mpCopyHtml()` 调用
2. `mp-article.html` 全程 6 位 hex / `background-color:` / 无 `var(--*)` / 无 `rgba()`
3. `xhs-drafts.md` 必须有敏感词扫描表格（至少"✅ 未检出"）
4. 小红书文案 / 封面不得出现：加V / VX / 包过 / 保录取 / 绝对化用语 / 100% 保证 / 站外引流链接 / 二维码

跑完自检 grep 不过就 `exit 1`，不要 `/publish`。
