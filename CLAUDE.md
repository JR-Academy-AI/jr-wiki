# CLAUDE.md — jr-wiki

JR Academy Headless 内容仓库。Markdown 存 GitHub，元数据存 MongoDB，后端从 GitHub 实时读 .md 渲染。官网前端零改动零部署。

---

## 架构

```
jr-wiki (GitHub) → bun run sync → MongoDB (元数据 + contentUrl)
                                       ↓
用户访问官网 → 后端查 DB → fetch GitHub raw .md → HTML → 返回前端
```

### 三种内容的去向

| 内容 | DB 集合 | 官网 URL | 正文来源 |
|------|---------|---------|---------|
| 文章 articles | posts (source: jr-wiki) | /blog/{slug} | 后端从 GitHub 读 .md |
| 电子书 books | wikis (source: jr-wiki, 带 chapters) | /wiki/{slug} | 后端从 GitHub 读 .md，伪装成 Notion 格式 |
| 学员故事 stories | testimonials (source: jr-wiki) | 首页 | DB 里的 description |
| 帮助 help | 不进 DB | — | — |

### DB 只存元数据，正文从 GitHub 实时读

- posts 集合: `{ slug, title, source: "jr-wiki", contentUrl: "src/content/articles/xxx.md" }`
- wikis 集合: `{ slug, title, source: "jr-wiki", chapters: [{slug, title, order, contentUrl}] }`
- testimonials 集合: `{ slug, name, source: "jr-wiki", description }`

### 后端读 .md 的逻辑

- Dev: 直接读本地文件 `path.resolve(cwd, '..', 'jr-wiki', contentUrl)`
- Prod: `fetch https://raw.githubusercontent.com/JR-Academy-AI/jr-wiki/main/{contentUrl}` + GITHUB_TOKEN

### wiki 特殊处理

wiki API (`getWikiDetailBySlug`) 检测到 `source=jr-wiki` 时，把 chapters 伪装成前端期望的 Notion 格式：
- `chapters` → `categories[0].notionPages`（侧边栏章节列表）
- markdown HTML → `currentNotion.contentSnapshot`（正文内容）

前端 WikiDetailPage 不知道内容来自 jr-wiki，正常渲染。

---

## 给运营同事的快速指南

直接用中文告诉 Claude 你想做什么：

| 命令 | 作用 |
|------|------|
| `/add-article 标题` | 新建文章 → /blog/ |
| `/add-book 书名` | 新建电子书 → /wiki/ |
| `/add-chapter 书名 章节标题` | 给电子书加章节 |
| `/edit-chapter 书名 第N章 修改说明` | 修改章节内容 |
| `/add-story 学员名 故事` | 新建学员故事 → 首页 |
| `/publish` | 推送到线上 |
| `/ai-daily-news` | 搜索今天 AI 热点生成日报 |
| `/ai-news-poster` | 当天 5 条新闻生成 6 张海报 + 公众号文章（index.html 海报库 + mp-article.html 发稿页） |
| `/ai-content-pipeline` | 完整管道：日报 + 原创文章 |

### 改内容 vs 新增内容

- 改 / 新增内容: 改完 → `/publish` → CI 自动 sync MongoDB（~30 秒生效）
- 本地手动 sync（绕 CI 或排查用）: `ADMIN_TOKEN=xxx bun run sync`

---

## 内容类型

| 类型 | 位置 | 必填 frontmatter |
|------|------|-----------------|
| 文章 | `src/content/articles/` | title, description, publishDate, tags |
| 电子书 | `src/content/wiki/{book}/` | `_meta.yaml` + 每章: title, wiki, order |
| 帮助 | `src/content/help/` | title, description, category |
| 学员故事 | `src/content/stories/` | title, description, name, role, publishDate |

## 命令

```bash
bun run build     # 构建 manifest.json
bun run dev       # 本地预览 http://localhost:4321
bun run sync      # 构建 + 同步元数据到 MongoDB（需要 ADMIN_TOKEN）
```

## 自动化定时任务

| 任务 | 频率 | 产出 |
|------|------|------|
| AI 日报 + 原创 + 海报 + 公众号稿 | 每天 9:00–9:15 AEST 串跑 | 日报 → /blog/；海报库 → `.../ai-news-posters/{date}/index.html`；公众号发稿页 → `.../ai-news-posters/{date}/mp-article.html` |
| AI 工具电子书 | 每周一 | 新书 3-5 章 → /wiki/ |
| 电子书扩章 | 每周四 | 现有书加 1-2 章 → /wiki/ |

管理: https://claude.ai/code/scheduled
