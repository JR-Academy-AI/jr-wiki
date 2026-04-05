# jr-wiki PRD — Headless 内容仓库

## 问题

JR Academy 需要一个让非技术员工（运营、Marketing）通过 AI 工具（Claude App）轻松创建和维护学习内容的系统，同时内容能自动出现在官网上，不需要开发介入。

## 方案

jr-wiki 是一个 **Headless 内容仓库**：
- 内容以 Markdown 文件形式存储在 Git 仓库
- 构建后部署为 nginx 静态文件
- 后端 API 实时从静态文件读取内容，按需转换 HTML 返回
- 官网前端零改动，通过现有 API 正常渲染

## 架构图

```
┌─────────────────────────────────────────────────────┐
│                   内容创作层                          │
│                                                     │
│  员工/AI (Claude App) → 写 Markdown → push to GitHub │
└──────────────────────┬──────────────────────────────┘
                       │ CI (GitHub Actions)
                       ▼
┌─────────────────────────────────────────────────────┐
│                   静态文件层                          │
│                                                     │
│  nginx /learn-wiki/                                 │
│  ├── manifest.json        (元数据索引)               │
│  ├── content/articles/*.md (文章原文)                │
│  ├── content/books/*/*.md  (电子书章节原文)           │
│  ├── content/help/*.md     (帮助文档原文)            │
│  └── content/stories/*.md  (学员故事原文)            │
└──────────┬────────────────────────┬─────────────────┘
           │                        │
           ▼                        ▼
┌────────────────────┐   ┌──────────────────────────┐
│    sync 脚本        │   │    后端 API (jr-academy)   │
│                    │   │                          │
│  读 manifest.json  │   │  GET /posts/slug/xxx     │
│  写元数据到 MongoDB │   │  → 查 DB (source=jr-wiki) │
│  - posts 集合      │   │  → fetch contentUrl (.md) │
│  - testimonials    │   │  → Markdown → HTML        │
│                    │   │  → 返回给前端              │
└────────────────────┘   └──────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  官网前端 (零改动)      │
                         │                      │
                         │  /blog/cursor-tips    │
                         │  /blog/pe-01-xxx      │
                         │  首页 testimonials     │
                         └──────────────────────┘
```

## 数据模型

### MongoDB posts 集合 (source: "jr-wiki")

| 字段 | 类型 | 说明 |
|------|------|------|
| slug | string | URL 标识符，唯一 |
| title | string | 文章标题 |
| source | string | `"jr-wiki"` |
| contentUrl | string | .md 文件路径，如 `/content/articles/cursor-tips.md` |
| state | string | `"published"` |
| publishedDate | Date | 发布日期 |
| meta.title | string | SEO 标题 |
| meta.description | string | SEO 描述 |
| meta.keywords | string | SEO 关键词 |
| content.brief | string | 摘要/描述 |
| content.extended | string | **空** — 正文不存 DB，实时从文件读取 |

### MongoDB testimonials 集合 (source: "jr-wiki")

| 字段 | 类型 | 说明 |
|------|------|------|
| slug | string | URL 标识符 |
| name | string | 故事标题 |
| source | string | `"jr-wiki"` |
| description | string | 故事摘要 |
| title | string | 学员姓名 |
| jobFunction | string | 学员角色 |
| company | string | 公司名 |
| recommended | boolean | `true` (首页展示) |

## 内容类型

### 1. 文章 (articles)

```
src/content/articles/cursor-tips.md
```

```yaml
---
title: "Cursor IDE 5 个实用技巧"
description: "Tab 补全、Cmd+K 编辑..."
publishDate: 2026-03-20
tags: [cursor, ide, ai-tools]
author: "JR Academy"
---

正文 Markdown...
```

同步到: `posts` 集合 → 前端 `/blog/cursor-tips`

### 2. 电子书 (books)

```
src/content/wiki/prompt-engineering/
├── _meta.yaml          # 书籍元数据
├── 01-what-is-prompt.md
├── 02-basic-techniques.md
└── 03-advanced-patterns.md
```

每个章节同步为一篇独立 post:
- slug: `{book-slug}-{chapter-slug}` (如 `prompt-engineering-01-what-is-prompt`)
- 前端: `/blog/prompt-engineering-01-what-is-prompt`

### 3. 帮助中心 (help)

```
src/content/help/how-to-enroll.md
```

不进 DB，仅作为静态文件部署在 nginx 上。

### 4. 学员故事 (stories)

```
src/content/stories/alice-accounting-to-frontend.md
```

同步到: `testimonials` 集合 → 首页学员故事区

## 操作流程

### 修改已有内容 (日常操作，不需要 sync)

```
1. 员工在 Claude App 打开 jr-wiki
2. 告诉 Claude: "把 cursor-tips 那篇文章的第3段改一下"
3. Claude 修改 Markdown 文件
4. push → GitHub Actions → nginx 部署
5. 官网下次请求时自动读到新内容
```

### 新增内容 (需要 sync)

```
1. 员工在 Claude App: "加一篇新文章，讲 Copilot 使用技巧"
2. Claude 创建新 .md 文件
3. push → GitHub Actions → nginx 部署
4. 运行 sync: ADMIN_TOKEN=xxx bun run sync
5. 元数据写入 DB → 官网列表页出现新文章
```

### 删除内容

```
1. 删除 .md 文件 → push → 部署
2. 在 Admin CMS 将对应文章状态改为 archived
   (或 DB 直接删除 source=jr-wiki 的记录)
```

## 后端改动 (jr-academy)

### 新增/修改

| 文件 | 改动 |
|------|------|
| `common/constants/post.ts` | `EPostSource` 加 `JR_WIKI = 'jr-wiki'` |
| `models/post.schema.ts` | 加 `contentUrl: string` 字段 |
| `models/wiki.schema.ts` | 加 `source: string` 字段 |
| `models/testimonial.schema.ts` | 加 `source: string` 字段 |
| `modules/post/post.service.ts` | `getPostBySlug`: source=jr-wiki 时从 contentUrl fetch .md → HTML |
| `modules/admin-cms/admin-posts` | 加 `POST /sync/jr-wiki` upsert API |
| `modules/admin-cms/admin-testimonials` | 加 `POST /sync/jr-wiki` upsert API |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|-------|------|
| `JR_WIKI_BASE_URL` | dev: `http://localhost:4321` / prod: `https://jiangren.com.au/learn-wiki` | 静态文件服务地址 |

## 前端改动

**无。** 官网前端代码零改动。

## 非功能需求

- 后端 fetch .md 文件应有缓存（避免每次请求都读文件）
- contentUrl 指向的 .md 文件不存在时 graceful fallback 到 content.brief
- sync 脚本幂等：重复运行不会创建重复记录（按 slug + source upsert）
- Admin CMS 能按 `source: jr-wiki` 筛选和管理这些内容
