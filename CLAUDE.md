# CLAUDE.md — jr-wiki

JR Academy Headless 内容仓库。Markdown 部署为静态文件，后端 API 实时读取渲染。官网前端零改动。

---

## 架构

```
员工/AI 写 Markdown → push → CI 构建 → nginx 部署静态文件
                                              ↓
后端 API ← source=jr-wiki 时从 nginx 实时读取 .md → 转 HTML → 返回
                                              ↓
官网 /blog/xxx ← 前端正常查 API，不知道内容来自 jr-wiki
```

### DB 只存元数据，正文从文件读

- `posts` 集合: `{ slug, title, source: "jr-wiki", contentUrl: "/content/articles/xxx.md" }`
- `testimonials` 集合: `{ slug, name, source: "jr-wiki", description, ... }`
- **正文不进 DB** — 后端实时 fetch contentUrl 的 .md 文件

### 两种操作

| 操作 | 场景 | 步骤 |
|------|------|------|
| 改内容 | 修改已有文章 | 改 md → push → 部署 → 自动生效 |
| 加内容 | 新增文章/书/故事 | 改 md → push → 部署 → `bun run sync` |

---

## 给运营 / Marketing 同事的快速指南

你不需要懂代码！直接用中文告诉 Claude 你想做什么就行。

### 常用命令

| 命令 | 作用 | 例子 |
|------|------|------|
| `/list-content` | 查看所有内容 | 直接输入即可 |
| `/add-book` | 创建一本新电子书 | `/add-book AWS入门指南 零基础学AWS` |
| `/add-chapter` | 给书添加新章节 | `/add-chapter prompt-engineering 实战案例` |
| `/edit-chapter` | 修改已有章节 | `/edit-chapter prompt-engineering 第2章 改标题` |
| `/add-article` | 发布一篇文章 | `/add-article 如何用AI写简历` |
| `/add-story` | 添加学员故事 | `/add-story 小王 从零基础到Google offer` |
| `/add-help` | 添加帮助文档 | `/add-help 如何重置密码 账号` |
| `/publish` | 发布到线上 | `/publish 新增了AWS电子书` |
| `/preview` | 本地预览 | 直接输入即可 |

### 自然语言也行

- "帮我看一下现在有哪些内容"
- "创建一本新的 React 面试宝典"
- "给 Prompt Engineering 那本书加一章"
- "发一篇文章，讲如何用 AI 写简历"
- "帮我发布到线上"

### 注意事项

- **改已有内容**: push 后等 nginx 部署完就自动生效，不用跑 sync
- **新增内容**: push 后还需要跑 `bun run sync` 把元数据注册到 DB
- 发布后等 2-3 分钟线上更新（GitHub Actions 自动部署）
- 先用 `/preview` 本地看看再发布

---

## 内容类型

| 类型 | Markdown 位置 | 必填 frontmatter | 同步目标 |
|------|---------------|-----------------|---------|
| 电子书 | `src/content/wiki/{book}/` | title, wiki, order + `_meta.yaml` | posts 集合（每章一篇） |
| 文章 | `src/content/articles/` | title, description, publishDate, tags | posts 集合 |
| 帮助中心 | `src/content/help/` | title, description, category | 不进 DB，静态部署 |
| 学员故事 | `src/content/stories/` | title, description, name, role, publishDate | testimonials 集合 |

## 构建输出

```
dist/
├── manifest.json           # 元数据索引
├── content/                # 原始 Markdown（nginx 静态服务，后端实时读取）
├── _preview/index.html     # 内部管理预览页（不对外）
└── robots.txt
```

## 命令

```bash
bun run build     # 构建到 dist/
bun run dev       # 构建 + 本地预览 http://localhost:4321
bun run sync      # 构建 + 同步元数据到 MongoDB（需要 ADMIN_TOKEN）
```

## 后端集成（jr-academy）

后端 PostService.getPostBySlug 的逻辑：
1. 查 DB 拿到 post 记录
2. 如果 `source === 'jr-wiki'` 且有 `contentUrl`
3. fetch `JR_WIKI_BASE_URL + contentUrl` 获取 .md 文件
4. 去掉 frontmatter，Markdown → HTML
5. 作为 `content` 返回（和普通文章一样的格式）

环境变量：
- `JR_WIKI_BASE_URL` — 默认 dev: `http://localhost:4321`，prod: `https://jiangren.com.au/learn-wiki`
