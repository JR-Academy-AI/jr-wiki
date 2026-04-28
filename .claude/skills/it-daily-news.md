---
name: it-daily-news
description: "追踪当天 IT 认证 & 课程动态：AWS/Azure/GCP 认证更新、CompTIA/Cisco/Oracle 新考纲、考试折扣、官方免费课、Linux Foundation/Coursera/edX 新路径。产出：src/content/articles/it-daily-{DATE}.md（3-5 条）。slug 前缀 `it-daily-` 自动被 articles 索引页分类成 'it-daily' chip。无 JSON、无海报、无 pipeline。"
argument-hint: "[YYYY-MM-DD 可选，默认今天 AEST]"
---

# /it-daily-news — 最简版（2026-04-28 新建）

## 🎯 为什么有这条 routine

首页 `channel.it` 入口和 `articles/?filter=it-daily` chip 是 2025 年就预留的，但没有内容生产管线 → chip 永远 0。这条 routine 每天产 1 篇 IT 认证 / 课程聚合文章，slug 前缀 `it-daily-` 触发 `src/static/articles/index.html` 的分类逻辑：

```js
if (article.slug && article.slug.startsWith('it-daily-')) return 'it-daily';
if (tags.includes('it-certs') || tags.includes('it-daily')) return 'it-daily';
```

不抄 ai-daily-news 的数据驱动架构（agent 写 JSON + pipeline 渲染海报），原因：IT 认证内容没有小红书海报需求，公众号也不是主要分发渠道。**单一 markdown 就够**，agent 链路最短，最不容易 timeout。

## 🛠 执行步骤

### Step 0. 日期（AEST 强制）

```bash
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}

if [ -f "src/content/articles/it-daily-${DATE}.md" ]; then
  echo "✅ ${DATE} 已产，跳过（--force 覆盖）"
  [[ ! "$*" =~ --force ]] && exit 0
fi
```

⚠️ 调度器跑在 UTC，必须 `TZ='Australia/Sydney'`，否则会拿到比澳洲慢一天的日期，当天内容漏产。

### Step 1. 搜当天 IT 认证 / 课程新闻（6 轮 parallel WebSearch）

```
1. "AWS certification update OR new exam {date}"
2. "Microsoft Azure certification OR Microsoft Learn {date}"
3. "Google Cloud certification OR Google Cloud Skills Boost {date}"
4. "CompTIA OR Cisco OR Oracle certification update {date}"
5. "free IT course {date} site:coursera.org OR site:edx.org OR site:linuxfoundation.org"
6. "考证 OR IT 认证 OR 免费课程 {date}"
```

优先源（按权威度）：
- 官方：aws.amazon.com/training · learn.microsoft.com · cloud.google.com/learn · comptia.org · linuxfoundation.org · oracle.com/education
- 平台：coursera.org · edx.org · pluralsight.com · acloud.guru
- 中文：51CTO · 极客时间 · InfoQ 中文

### Step 2. 筛 3-5 条（不强制凑 5）

**优先组合**：
- 考纲变动 / 新版本上线（如 SAP-C03 → SAP-C04、CKAD v1.32）
- 退役公告（如 SAA-C02 终止报名日期）
- 官方折扣 / 免费券（AWS re:Invent 50% 券、Microsoft Free Cert Vouchers）
- 新课上线（Linux Foundation Free Cert、Coursera Plus 学生价）
- 学习路径推荐（Cloud Resume Challenge、CKA → CKS）

**去重**：同一件事不同媒体报算一条。
**新鲜度**：超过 7 天的不要。
**找不到 5 条就写 3 条 —— 宁缺毋滥，捏造比缺条更糟。**

### Step 3. 写 `src/content/articles/it-daily-{DATE}.md`

**frontmatter**（必填字段，缺一不可，参考 `src/content/config.ts` articles schema）：

```yaml
---
title: "（5 条关键词拼，禁带日期、禁带 IT 日报 前缀）"
description: "（200-400 字概括，要有具体数字 / 考试代码 / 时间点）"
publishDate: 2026-04-28
tags:
  - it-daily       # 必带，触发 articles index 分类
  - it-certs       # 必带，分类规则的第二条 fallback
  - aws-cert       # 视内容选填
  - azure-cert
  - gcp-cert
  - free-course
  - comptia
author: "JR Academy IT 认证"
---
```

**正文**（每条 300-500 字）：

```markdown
## 1. AWS SAP-C03 改版：题量从 75 降到 65、新增 generative AI 域

（一段背景：旧版 SAP-C02 的痛点 / 新版变动时间点）

（关键差异：题型 / 新增域 / 通过分数 / 报名截止日）

（实操：原计划考 C02 的人怎么办、新备考资料推荐）

来源：[AWS Training Blog](https://aws.amazon.com/blogs/training-and-certification/...)
```

5 条之间不要堆"此外""与此同时"过渡，直接 `## N. 标题` 开下一条。

### Step 4. 自检

```bash
FILE="src/content/articles/it-daily-${DATE}.md"

# frontmatter 必填字段
for k in title description publishDate tags; do
  grep -qE "^${k}:" "$FILE" || { echo "❌ 缺 frontmatter $k"; exit 1; }
done

# tags 必须含 it-daily 或 it-certs（触发分类）
grep -qE "^\s*-\s+(it-daily|it-certs)" "$FILE" || { echo "❌ tags 缺 it-daily/it-certs"; exit 1; }

# 至少 3 条新闻（## N.）
COUNT=$(grep -cE "^## [0-9]+\." "$FILE")
[ "$COUNT" -ge 3 ] || { echo "❌ 只有 $COUNT 条新闻，至少 3 条"; exit 1; }

# 每条至少 1 个 markdown 链接
LINKS=$(grep -cE "\[.+\]\(http" "$FILE")
[ "$LINKS" -ge "$COUNT" ] || { echo "❌ 链接数 $LINKS < 新闻数 $COUNT"; exit 1; }

echo "✅ ${DATE} IT 日报自检通过（$COUNT 条 / $LINKS 个来源链接）"
```

任一不过 → `exit 1`，routine 不 commit。

## 🎯 内容规则（Anti-AI + 真实优先）

**🚨 标题铁律**（沿用 ai-daily 政策）：
- ❌ `IT 日报 2026-04-28：xxx`
- ❌ `2026-04-28 IT 认证日报：xxx`
- ✅ 5 条关键词拼：`AWS SAP-C04 改版 / CKAD v1.32 上线 / Azure AZ-104 50% off / LF 免费证书新路径 / Coursera Plus 学生价`
- 理由：日期已在 URL（`/blog/it-daily-2026-04-28`）+ publishDate 字段，标题再写一遍冗余且毁 SEO

**禁词**：值得注意的是 / 总的来说 / 此外 / 综上所述 / 不可否认 / 至关重要 / 旨在 / 使得 / 使其 / 进行了 / 作为一个 / 与此同时

**真实优先 — 这条比 AI 日报更严格**：
- ❌ 禁止捏造考试代码（SAP-C99 之类不存在的）
- ❌ 禁止捏造折扣百分比 / 报名截止日
- ❌ 找不到具体数字就写"官方未公布"，不要编
- ✅ 每条至少 1 个**官方域名**链接（aws.amazon.com / learn.microsoft.com / cloud.google.com / linuxfoundation.org / comptia.org）
- ✅ 中文媒体来源（51CTO / 极客时间）只能作为第二来源，不能作为唯一来源

**深度建议**（每条至少覆盖 2 项）：
- 考纲拆解 / 题型对比
- 退役时间线 / 新旧版本切换窗口
- 备考资源（官方课 / 第三方课 / 免费 lab）
- 价格 / 折扣 / 免费券领取条件
- 中国大陆考点 / Pearson VUE 中心可用性

## 📋 产出清单

```
src/content/articles/it-daily-{DATE}.md   ← 唯一产物（约 4-8KB）
```

不产 JSON、不产海报、不产公众号 HTML。需要的话以后再加。

## 🔗 参考

- **articles 分类逻辑**：`src/static/articles/index.html` 第 ~50-80 行（slug startsWith `it-daily-` 触发）
- **首页入口**：`src/static/index.html` 已有 `<a href="./articles/?filter=it-daily" class="channel it">`
- **frontmatter schema**：`src/content/config.ts` articles collection
- **风格参考**：`src/content/articles/ai-daily-2026-04-27.md`
- **配套 routine**：`docs/ROUTINE_PROMPTS.md` Routine 5
