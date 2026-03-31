# CLAUDE.md — jr-wiki

JR Academy Headless 内容仓库。不生成前端页面，只输出 manifest.json + 原始 Markdown 供官网 Next.js 消费。零 canonical 冲突。

---

## 给运营 / Marketing 同事的快速指南

你不需要懂代码！直接用中文告诉 Claude 你想做什么就行。

### 常用命令（输入后回车即可）

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

### 用自然语言也行

你也可以直接用中文描述需求，不用记命令：

- "帮我看一下现在有哪些内容"
- "创建一本新的 React 面试宝典"
- "给 Prompt Engineering 那本书加一章，讲 ChatGPT 的使用技巧"
- "把第2章标题改成xxx"
- "发一篇文章，讲如何用 AI 写简历"
- "加一个学员故事，小王从零基础到拿到 offer"
- "帮我发布到线上"
- "我想预览一下当前效果"

### 注意事项

- 改完内容后记得用 `/publish` 发布，否则线上看不到
- 发布后等 2-3 分钟线上才会更新（GitHub Actions 自动部署）
- 如果不确定改对没有，先用 `/preview` 本地看看
- 每次打开 Claude Code 会自动拉取最新代码，不用管 git

---

## 架构

```
员工 Claude App 写 Markdown → push → build.ts → 部署到 nginx
                                                      ↓
官网 Next.js ← fetch /learn-wiki/manifest.json (发现内容)
             ← fetch /learn-wiki/content/xxx.md (获取正文)
             → SSR 渲染在官网 URL 下 (唯一 canonical)
```

## 内容类型

| 类型 | Markdown 位置 | 必填 frontmatter |
|------|---------------|-----------------|
| 电子书 | `src/content/wiki/{book}/` | title, wiki, order + `_meta.yaml` |
| 文章 | `src/content/articles/` | title, description, publishDate, tags |
| 帮助中心 | `src/content/help/` | title, description, category |
| 学员故事 | `src/content/stories/` | title, description, name, role, publishDate |

## 构建输出

```
dist/
├── manifest.json           # 元数据（官网 fetch）
├── content/                # 原始 Markdown（官网 fetch 渲染）
├── _preview/index.html     # 内部管理预览页（不对外）
└── robots.txt              # 禁止爬虫
```

## 命令

```bash
bun run build     # 构建到 dist/
bun run dev       # 构建 + 本地预览 http://localhost:4321
```

## 主站集成

```typescript
const { books, articles, help, stories } = await fetch('/learn-wiki/manifest.json').then(r => r.json());
const md = await fetch(article.contentUrl).then(r => r.text());
```
