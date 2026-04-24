---
name: ai-daily-news
description: "追踪当天 AI 五大热点。**新架构（2026-04-24 起）**：agent 只写 src/data/ai-daily/{DATE}.json（~15KB）+ src/content/articles/ai-daily-{DATE}.md（blog 长文），HTML 海报 + 公众号页由 `bun run build:ai-daily` pipeline 渲染。设计目标：把 agent 产出从 300KB+ HTML 压到 < 25KB，规避 Stream idle timeout。"
argument-hint: "[YYYY-MM-DD 可选，默认今天 AEST]"
---

# /ai-daily-news — 数据驱动版（2026-04-24 重构）

## 🚨 为什么用新架构

**老架构**：agent 手写 228KB HTML（poster 库 + mp-article 全 inline style + html2canvas 代码）。routine 执行 10-20 分钟，经常撞 `Stream idle timeout`。

**新架构**：
- agent 只写 **一份 JSON**（~15KB）+ **一份 blog markdown**（~8KB）
- HTML 由 `bun run build:ai-daily {DATE}` pipeline 生成（读 JSON → 渲染模板 → 出 poster 薄壳 + mp-article 薄壳）
- routine 执行 3-5 分钟，基本不会 timeout

**禁止 agent 碰**：HTML / inline style / poster-renderer.js / mp-inline.js / MP_INLINE_STYLES —— 这些全部由 template + pipeline 处理。

## 🛠 执行步骤

### Step 0. 日期（AEST 强制）

```bash
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}
# 去重
if [ -f "src/data/ai-daily/${DATE}.json" ]; then
  echo "✅ ${DATE} JSON 已产，跳过（--force 覆盖）"
  [[ ! "$*" =~ --force ]] && exit 0
fi
```

⚠️ 调度器跑在 UTC，**必须** TZ='Australia/Sydney'。

### Step 1. 搜当天 AI 新闻（8 轮 parallel WebSearch）

```
1. "AI news today {date}"
2. "OpenAI OR Anthropic OR Google AI {date}"
3. "AI startup funding {date}"
4. "LLM model release {date}"
5. "AI regulation policy {date}"
6. "人工智能 今日新闻 {date}"
7. "AWS OR Azure OR GCP certification {date}"
8. "free IT course OR free AI course {date}"
```

优先源：TechCrunch / The Verge / Bloomberg / Reuters / 36氪 / 机器之心 / Hacker News / OpenAI Blog / Anthropic Blog。

### Step 2. 筛 Top 5（4-5 条 AI 主线 + 1-2 条 IT 认证/课程）

组合原则：影响力 + 新鲜度（当天或前一天）+ 实用性。去重（同一件事不同媒体算一条）。

### Step 3. 写 `src/data/ai-daily/{DATE}.json`（主产出）

**严格按 `src/data/_schemas/ai-daily.schema.json`**。参考示例：`src/data/ai-daily/2026-04-23.json`。

关键字段：
- `summary.items` **必须 5 项**（5 条新闻预告）
- `news` **必须 5 项**，每项：
  - `slug` 必须 `^\d{2}-[a-z0-9-]+$` 格式
  - `bullets` **必须正好 3 条**，`k` 必须是 `"发生了什么"` / `"为什么重要"` / `"对你的影响"` 三个枚举值之一
  - `accent` 必须 6 位 hex
- `mp.quickview.items` 3-10 条 HTML 字符串
- `mp.title` 用简单直接的标题，不强制 ｜ 分割

**🚨 JSON 字符串里禁止嵌入 ASCII 双引号 `"`**（会破坏 JSON 结构）。要用中文引号就写 `「」` 或 `『』`，需要 ASCII 引号就用 `\"` 显式转义。

### Step 4. 写 `src/content/articles/ai-daily-{DATE}.md`（/blog/ 长文）

frontmatter + 5 条新闻各 350-600 字正文。格式参考 `src/content/articles/ai-daily-2026-04-23.md`。

### Step 5. 跑 pipeline + 自检

```bash
# 1. JSON schema 验证
jq empty src/data/ai-daily/${DATE}.json || exit 1
[ "$(jq '.news | length' src/data/ai-daily/${DATE}.json)" = "5" ] || exit 1
[ "$(jq '.summary.items | length' src/data/ai-daily/${DATE}.json)" = "5" ] || exit 1

# 2. pipeline 渲染 HTML
bun run build:ai-daily ${DATE} || exit 1

# 3. 确认 HTML 产出
[ -f src/static/ai-news-posters/${DATE}/index.html ] || exit 1
[ -f src/static/ai-news-posters/${DATE}/mp-article.html ] || exit 1
```

任一自检不过 → `exit 1`，routine 不 commit。

## 🎯 内容规则（Anti-AI + 深度）

**禁词**：值得注意的是、总的来说、此外、综上所述、不可否认、至关重要、旨在、使得/使其、进行了、作为一个、与此同时

**替换**：
- "此外" → "还有个事"、直接换段
- "使得" → "让"
- "具有重要意义" → 说具体为什么重要
- "进行了优化" → "优化了"

**加人味**：长短句交替 / 偶尔短句单独成段 / 具体数据代替"大量""显著" / 第一人称判断

**每条新闻深度**（至少 2 项）：技术拆解 / 行业影响 / 实操建议 / 历史对比 / 争议风险

## 📋 产出清单

```
src/data/ai-daily/{DATE}.json                     ← agent 产（15KB 左右）
src/content/articles/ai-daily-{DATE}.md           ← agent 产（8KB 左右）

Pipeline 产：
src/static/ai-news-posters/{DATE}/index.html      ← 海报库薄壳
src/static/ai-news-posters/{DATE}/mp-article.html ← 公众号发稿页
```

## 🔗 参考

- **Schema**: `src/data/_schemas/ai-daily.schema.json`
- **Pipeline**: `build/pipelines/ai-daily.pipeline.ts`
- **Templates**: `src/templates/xhs-poster/ai-daily.template.html`, `src/templates/mp-article/ai-daily.template.html`
- **最新示例**: `src/data/ai-daily/2026-04-23.json`
- **架构 PRD**: `docs/SCHEDULED_CONTENT_PLATFORM_PRD.md`
