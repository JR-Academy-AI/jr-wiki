# /ai-content-pipeline — AI 内容自动化管道

每日自动执行：搜索 AI 热点 → 日报 → 原创 → **6 张海报 + 公众号文章同页** → 发布。

## 使用方法
```
/ai-content-pipeline
/ai-content-pipeline 2026-04-03
```

## 管道串联（每天 3 个 skill）

```
1. /ai-daily-news   → src/content/articles/ai-daily-{DATE}.md （日报 + 原创）
2. /ai-news-poster  → src/static/ai-news-posters/{DATE}/index.html （6 张海报 + 公众号文章同页）
3. /publish         → git push → GH Pages 部署 + MongoDB sync
```

**本 skill 只负责 Phase 1-2（日报 + 原创文章）。** 海报和公众号文章在同一个 index.html 里产出，见 `/ai-news-poster` 文档。

## 完整管道流程

### Phase 1: 搜索 AI 新闻 (5 分钟)

用 WebSearch 搜索当天 AI 新闻，覆盖：

**英文源** (搜 3 轮):
```
1. "AI news today {date}" site:techcrunch.com OR site:theverge.com OR site:venturebeat.com
2. "OpenAI OR Anthropic OR Google DeepMind OR Meta AI {date}"
3. "AI startup OR AI funding OR LLM OR model release {date}"
```

**中文源** (搜 2 轮):
```
4. "AI 人工智能 新闻" site:36kr.com OR site:jiqizhixin.com OR site:infoq.cn
5. "大模型 发布 融资 开源" {date}
```

**社交/论坛** (搜 2 轮):
```
6. site:news.ycombinator.com "AI" OR "LLM" OR "GPT"
7. site:reddit.com/r/MachineLearning
```

对每条搜索结果，用 WebFetch 读取原文获取详细内容。

**同时抓取配图**：读取原文 HTML 时提取 `og:image` meta 标签的 URL 作为新闻配图。

### Phase 2: 生成日报文章 (3 分钟)

从搜索结果中筛选 Top 5，创建日报文件：

**文件**: `src/content/articles/ai-daily-{YYYY-MM-DD}.md`

```yaml
---
title: "AI 日报 {date}：{最大新闻一句话}"
description: "今日 AI 五大热点：{1}、{2}、{3}、{4}、{5}"
publishDate: {date}
tags: [ai-daily, ai-news]
author: "JR Academy AI 日报"
---
```

每条新闻格式：
```markdown
## 1. {标题}

![{标题}]({og:image URL 或 Unsplash 图片 URL})

**一句话**: {概括}

{2-3 段分析，包含事实 + 为什么重要 + 对开发者的影响}

> 来源: [{媒体}]({链接})
```

**配图规则**：每条新闻必须有一张图。优先用原文 og:image，没有则用 WebSearch 搜 `{关键词} site:unsplash.com` 找免费图。

**配图策略**：
- 日报新闻：直接用原文 og:image 外链（稳定、不需要存储）
- 原创文章封面：如果有 S3 上传能力则上传到 S3 用永久 URL，否则用 Unsplash 外链
- 产品截图：优先用产品官网的图片 URL（通常稳定）

### Phase 3: 选题 + 生成原创文章 (10 分钟)

从 5 条新闻中选 **1-2 个最适合写深度文章的话题**。

**选题标准**:
1. 和 JR Academy 学员相关（编程、求职、AI 工具、技术趋势）
2. 有足够的深度可以展开（不只是一句话新闻）
3. 有实操价值（学员看完能动手做点什么）

**每篇原创文章**:

文件: `src/content/articles/{topic-slug}.md`

```yaml
---
title: "{SEO 标题：核心关键词在前，25 字以内}"
description: "{120 字以内，包含目标关键词，吸引点击}"
publishDate: {date}
tags: [{相关标签，3-5 个}]
author: "JR Academy"
keywords: "{目标长尾关键词，逗号分隔}"
---
```

**原创文章结构** (800-1500 字):

```markdown
![{alt 描述，含关键词}]({Unsplash 或新闻源图片 URL})

## {关键词}是什么
{这件事是什么，用 2-3 句话说清楚，自然包含目标关键词}

## 为什么你应该关注
{对不同角色的影响：前端/后端/数据/产品}

## 实操指南
{具体怎么做，代码示例、工具推荐、学习路径}

## 常见问题

### {FAQ 问题 1，用用户真实搜索语句}
{回答}

### {FAQ 问题 2}
{回答}

## JR Academy 相关资源
{关联课程、wiki、roadmap，使用内链}
```

### SEO 规则

1. **标题** — 核心关键词放最前面，如 "Claude Code 使用教程：5 个实战技巧" 而不是 "5 个实战技巧教你用 Claude Code"
2. **Description** — 120 字以内，包含关键词，像 Google 搜索结果的摘要
3. **H2 标题含关键词** — 每个 ## 标题自然包含 1 个相关关键词
4. **FAQ 段** — 用真实搜索语句做问题（如 "Claude Code 怎么安装"），Google 会抓 FAQ rich snippet
5. **内链** — 每篇文章至少 2 个内链指向 JR Academy 其他页面（wiki、课程、roadmap）
6. **配图 alt** — 每张图的 alt 文本包含关键词，如 `![Claude Code 终端界面截图](url)`
7. **首段** — 前 100 字必须出现目标关键词，Google 优先索引首段
8. **Keywords** — frontmatter 的 keywords 用长尾词，如 "Claude Code 教程, Claude Code 安装, AI 编程工具"

### Phase 4: 发布 (2 分钟)

1. `bun run build` — 确认构建无误
2. `git add src/content/articles/` — 只添加文章文件
3. `git commit -m "content: AI 日报 {date} + {N} 篇原创"`
4. `git push origin main`
5. 如果有 ADMIN_TOKEN，运行 `bun run sync` 同步元数据到 DB

### 完成后输出

```
🤖 AI 内容管道执行完成

📰 日报: ai-daily-{date}.md
   → /blog/ai-daily-{date}

📝 原创文章:
   1. {title} → /blog/{slug}
   2. {title} → /blog/{slug}

📊 统计:
   - 搜索了 {N} 个信息源
   - 读取了 {N} 篇原文
   - 生成了 {N} 篇文章（1 日报 + {N} 原创）

✅ 已 push 到 main
✅ 已 sync 到数据库
```

## 内容质量规则

### 日报规则
- 每条新闻必须有原文链接
- 用人话写，像资深工程师在群里分享
- 有观点，不只是转述

### 原创文章规则
- **禁止模版化内容** — 不要"在当今快速发展的..."
- **必须有实操价值** — 读完能动手做点什么
- **引用原始来源** — 不编造事实
- **和 JR Academy 关联** — 提到相关课程或学习资源
- **中文为主，技术术语保留英文** — LLM、Fine-tuning、RAG 不翻译
- **800-1500 字** — 不要水，也不要太短

### 降低 AI 率（核心规则）

生成的内容必须像人写的，不能一眼看出是 AI 生成。具体做法：

**句式打散**：
- 长短句交替，不要每句都 15-20 字
- 偶尔用口语化表达："说白了"、"踩过坑的都知道"、"这玩意儿"
- 段落长度不均匀，有的 2 行有的 5 行

**去掉 AI 味词汇**（绝对禁止）：
- ❌ "值得注意的是" → ✅ 直接说
- ❌ "总的来说/总而言之" → ✅ 删掉，或用"说白了"
- ❌ "此外/另外/与此同时" → ✅ 换成"还有个事"、"顺便说"、或直接另起一段
- ❌ "综上所述" → ✅ 删掉
- ❌ "不可否认" → ✅ 删掉
- ❌ "具有重要意义/至关重要" → ✅ 说具体为什么重要
- ❌ "旨在/致力于" → ✅ "就是为了"、"想做的是"
- ❌ "使得/使其" → ✅ "让"
- ❌ "进行了/进行" → ✅ 直接用动词
- ❌ "相关的/相应的" → ✅ 删掉或具体说

**加入人味**：
- 偶尔用第一人称："我试了下"、"我们团队之前"
- 加入个人判断："我觉得这个比 xxx 好用"
- 用比喻或类比解释技术概念
- 适当用反问："你想想，如果每次都要手动..."
- 引用具体数据而不是"大量"、"显著"

**结构不规则**：
- 不要每段都是"观点→解释→总结"的三段式
- 有的段可以只有一句话
- 列表和段落交替使用
- 偶尔在段中间突然插入一个短评

**写完后自检**：
- 删掉所有"值得注意的是"、"总的来说"、"此外"
- 检查是否每段开头都是相似句式 → 打散
- 读一遍，问自己"这段话发到微信群里自然吗" → 不自然就改

### 选题不写的情况
- 纯商业收购/人事变动（和学员无关）
- 过于前沿的论文（学员看不懂）
- 负面新闻/争议（避免风险）
