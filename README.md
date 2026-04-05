# JR Learn Wiki

JR Academy Headless 内容仓库。Markdown 存 GitHub，元数据存 MongoDB，后端 API 实时从 GitHub 读 .md 渲染。官网前端零改动。

## 架构

```
jr-wiki (GitHub 仓库，存 Markdown 源文件)
    ↓ bun run sync
MongoDB（只存元数据 + contentUrl）
    ↓ 用户访问官网
后端 API → fetch GitHub raw .md → markdown→HTML → 返回前端
    ↓
/blog/xxx (文章)    /wiki/xxx (电子书)    首页 (学员故事)
```

## 三种内容

| 内容 | Markdown 位置 | 同步到 | 官网 URL | 正文来源 |
|------|---------------|--------|---------|---------|
| 文章 | `src/content/articles/*.md` | posts 集合 | `/blog/{slug}` | GitHub raw |
| 电子书 | `src/content/wiki/{book}/*.md` | wikis 集合 (带 chapters) | `/wiki/{slug}` | GitHub raw |
| 学员故事 | `src/content/stories/*.md` | testimonials 集合 | 首页 | DB description |
| 帮助 | `src/content/help/*.md` | 不进 DB | — | — |

## 快速开始

```bash
bun run build                    # 构建 manifest.json
bun run dev                      # 本地预览 http://localhost:4321
ADMIN_TOKEN=xxx bun run sync     # 同步元数据到 MongoDB
```

## 操作规则

| 操作 | 步骤 | 需要 sync？ |
|------|------|------------|
| 改已有文章内容 | 改 .md → push | 不需要 |
| 新增文章/电子书/故事 | 创建 .md → push → `bun run sync` | 需要 |
| 删除内容 | 删 .md → push → Admin CMS 改 archived | 需要 |

改内容不需要 sync 是因为后端每次请求都从 GitHub 实时读 .md 文件。

## 详细文档

- [PRD.md](./PRD.md) — 完整架构、数据模型、三种内容的数据保存/传输/显示流程
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) — 如何写 Markdown 内容
- [CLAUDE.md](./CLAUDE.md) — Claude Code 使用指南
