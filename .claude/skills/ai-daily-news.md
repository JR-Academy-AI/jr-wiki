# /ai-daily-news — 追踪当天 AI 五大热点

全网搜索当天 AI 领域最热门的 5 条新闻，生成中文文章发布到 jr-wiki。

## 使用方法
```
/ai-daily-news
/ai-daily-news 2026-04-03
```

## 执行步骤

### Step 0: 确定日期（AEST 时区，强制）

```bash
# ⚠️ 必须用 Australia/Sydney 时区，不要用系统默认
# Claude Code 调度器通常跑在 UTC / 美国时区
# 裸用 date +%Y-%m-%d 会比澳洲慢一天 → schedule 误判"昨天的内容就是今天"
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}
```

下文所有 `{date}` / `{YYYY-MM-DD}` 占位符都指这个 `$DATE`（AEST 当天）。

### Step 1: 全网搜索当天 AI 新闻 + IT 资讯

用 WebSearch 搜索以下关键词（至少搜 6 轮，覆盖不同角度）：

```
1. "AI news today {date}"
2. "人工智能 今日新闻 {date}"
3. "OpenAI OR Anthropic OR Google AI {date}"
4. "AI startup funding {date}"
5. "LLM model release {date}"
6. "AI regulation policy {date}"
```

**另外每次必搜 2 类 IT 学习相关（原"每日 IT 资讯"trigger 合并进来的覆盖）**：

```
7. "AWS OR Azure OR GCP OR Kubernetes certification {date}"
   — 认证新消息 / 折扣 / 考试变动 / Databricks / Snowflake / Anthropic CCA-F / Tableau / Salesforce
8. "free IT course OR free AI course Coursera OR edX {date}"
   — 全球免费 IT/AI 课程（AWS Training / Microsoft Learn / Google Cloud Skills Boost 等新上线或限免）
```

### Step 2: 信息源优先级

优先从这些源头抓取：
- **英文**: TechCrunch, The Verge, Ars Technica, VentureBeat, Bloomberg, Reuters
- **中文**: 36氪, 机器之心, 量子位, InfoQ, 极客公园
- **社交**: X/Twitter AI 圈热门讨论, Hacker News, Reddit r/MachineLearning
- **官方**: OpenAI Blog, Anthropic Blog, Google AI Blog, Meta AI
- **IT 认证/课程**: AWS Training Blog, Microsoft Learn, Google Cloud Skills Boost, Coursera/edX/Udemy 限免推送, Linux Foundation (CKA/CKS)

### Step 3: 筛选 Top 5

从搜索结果中筛选最热门的 5 条，标准：
1. **影响力** — 影响多少人/公司
2. **新鲜度** — 当天或前一天发生的
3. **话题性** — 是否引发广泛讨论
4. **实用性** — 对 JR Academy 学员是否有价值

**组合原则**：5 条里留 **1-2 条**位子给 IT 认证 / 免费课程类（如 "AWS 限免 AI Practitioner 考券" / "Coursera 上线 Claude Code 官方课程 / 现在免费"）。剩下 3-4 条仍是 AI 主线大事件。如果当天确实没有 IT 认证或课程级别值得报的新闻，可以全给 AI，不硬凑。

去重：同一件事不同媒体报道的算一条。

### Step 4: 生成文章

在 `src/content/articles/` 下创建一个文件：

**文件名格式**: `ai-daily-{YYYY-MM-DD}.md`

**frontmatter**:
```yaml
---
title: "AI 日报 {YYYY-MM-DD}：{最大新闻一句话，含关键词}"
description: "今日 AI 五大热点：{热点1}、{热点2}、{热点3}...（120 字以内）"
publishDate: {YYYY-MM-DD}
tags:
  - ai-daily
  - ai-news
  - {当天最热关键词，如 claude, openai, llm}
author: "JR Academy AI 日报"
keywords: "AI新闻, AI日报, {热点关键词1}, {热点关键词2}"
---
```

**正文格式**（每条新闻）:

```markdown
## 1. {新闻标题}

![{alt 描述，含关键词}]({原文 og:image URL})

**一句话**: {30 字以内概括}

{2-3 段正文，包含：}
- 发生了什么（事实）
- 为什么重要（分析）
- 对开发者/学员的影响（实用角度）

> 来源: [{媒体名}]({原文链接})

---

## 2. {下一条新闻}
...
```

### 配图规则

- **每条新闻必须有配图**
- 优先级：原文 og:image > 公司官方 logo/产品截图 > Unsplash 免费图
- 获取方式：WebFetch 读取原文 HTML，提取 `<meta property="og:image" content="...">` 的 URL
- alt 文本必须描述图片内容并包含关键词（SEO）
- 如果 og:image 是空的或无法访问，用 WebSearch 搜 `{关键词} site:unsplash.com` 找替代图

### Step 5: 展示结果

生成完成后展示：

```
📰 AI 日报 {date} 生成完成

1. 🔥 {热点1标题}
2. 📢 {热点2标题}
3. 💰 {热点3标题}
4. 🛠️ {热点4标题}
5. 📊 {热点5标题}

文件: src/content/articles/ai-daily-{date}.md
官网: /blog/ai-daily-{date}

下一步:
- /preview 本地预览
- /publish 发布到线上
- ADMIN_TOKEN=xxx bun run sync 同步到数据库
```

## 内容规则

- **禁止模版化开场**：不要写"在当今快速发展的AI领域"这种废话
- **每条新闻必须有原文链接**：不能凭空编造
- **用人话写**：像资深工程师在群里分享消息，不像新闻稿
- **有观点**：不只是转述，要说清楚"这件事对你有什么影响"
- **中文为主，技术术语保留英文**：如 LLM、GPT、Fine-tuning 不翻译

## 降低 AI 率

**绝对禁止的词**：值得注意的是、总的来说、此外、综上所述、不可否认、至关重要、旨在、使得/使其、进行了

**用人话替换**：
- "此外" → "还有个事"、"顺便说"、或直接另起一段
- "使得" → "让"
- "具有重要意义" → 说具体为什么重要
- "进行了优化" → "优化了"

**加人味**：
- 长短句交替，偶尔一句话单独成段
- 用口语："说白了"、"踩过坑的都知道"
- 加个人判断："我觉得"、"实测下来"
- 用具体数据代替"大量"、"显著"
- 写完自检：发微信群自然吗？不自然就改

## 提升内容深度

每条新闻不只是转述事实，必须加入以下至少 2 项：

- **技术拆解** — 这个产品/技术底层是怎么实现的
- **行业影响** — 对哪些公司/岗位/技术栈有影响
- **实操建议** — 读者今天就能做的具体动作
- **历史对比** — 和之前的版本/竞品对比，进步在哪
- **争议/风险** — 不只说好的，也说潜在问题

## 示例

```markdown
## 1. Anthropic 发布 Claude 4.5 Opus，上下文窗口突破 1M tokens

![Claude 4.5 Opus 发布公告](https://cdn.anthropic.com/images/claude-4-5-announcement.jpg)

**一句话**: 最大上下文窗口的模型，能一次读完整个中型项目的代码。

Anthropic 今天发布了 Claude 4.5 Opus，最大的升级是 1M token 的上下文窗口。
实测下来，能一次性读入约 3 万行代码（大概一个中型 NestJS 项目的规模）。

对开发者来说，最直接的影响是 Claude Code 现在能理解更大的项目上下文，
不用再手动拆分文件喂给它。JR Academy 的 jr-academy 后端项目（约 2 万行）
可以完整放进去。

> 来源: [Anthropic Blog](https://anthropic.com/news/claude-4-5)
```
