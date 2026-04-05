# JR Learn Wiki

JR Academy Headless 内容仓库。Markdown 文件部署为静态资源，后端 API 实时读取渲染。

## 架构

```
jr-wiki (Markdown 源文件)
    ↓ push + CI
nginx /learn-wiki/ (静态文件服务)
    ↓                           ↓
后端 API (实时读取 .md)     sync 脚本 (元数据写入 MongoDB)
    ↓
官网 /blog/xxx (前端零改动，正常渲染)
```

### 核心原则

- **Markdown 是唯一内容源** — 改 md 文件 → 部署 → 内容自动更新
- **DB 只存元数据** — slug, title, description, contentUrl（指向 .md 文件路径）
- **正文不进 DB** — 后端 API 被调用时从 nginx 静态文件实时读取 .md → 转 HTML → 返回
- **官网前端零改动** — 从后端 API 拿数据，不知道内容来自 jr-wiki
- **零 canonical 冲突** — 所有 URL 在官网域名下

### 两种操作

| 操作 | 什么时候 | 命令 |
|------|---------|------|
| **改内容** | 修改/改进已有文章 | 改 md → push → nginx 自动部署 → 生效 |
| **加内容** | 新增文章/电子书/故事 | 改 md → push → 部署 → `bun run sync` 注册元数据到 DB |

## 快速开始

```bash
bun run build           # 构建到 dist/
bun run dev             # 构建 + 本地预览 http://localhost:4321
bun run sync            # 构建 + 同步元数据到 MongoDB（需要 ADMIN_TOKEN）
```

### 同步到数据库

```bash
# 本地开发
ADMIN_TOKEN=xxx bun run sync

# 生产环境
ADMIN_TOKEN=xxx API_URL=https://api.jiangren.com.au bun run sync
```

sync 只写元数据（title, slug, contentUrl），不写正文。正文始终从部署的 .md 文件实时读取。

## 内容类型

| 类型 | 位置 | 必填 frontmatter | 同步目标 |
|------|------|-----------------|---------|
| **电子书** | `src/content/wiki/{book}/` | `title`, `wiki`, `order` + `_meta.yaml` | posts 集合（每章一篇） |
| **文章** | `src/content/articles/` | `title`, `description`, `publishDate`, `tags` | posts 集合 |
| **帮助中心** | `src/content/help/` | `title`, `description`, `category` | 不进 DB，静态部署 |
| **学员故事** | `src/content/stories/` | `title`, `description`, `name`, `role`, `publishDate` | testimonials 集合 |

## 构建输出

```
dist/
├── manifest.json           # 元数据索引
├── content/                # 原始 Markdown（nginx 静态服务）
│   ├── books/{book}/*.md
│   ├── articles/*.md
│   ├── help/*.md
│   └── stories/*.md
├── _preview/index.html     # 内部管理预览页
└── robots.txt
```

## 数据流详解

### 文章/电子书 → /blog/xxx

```
1. sync 写入 posts 集合:
   { slug: "cursor-tips", source: "jr-wiki", contentUrl: "/content/articles/cursor-tips.md", ... }

2. 用户访问 /blog/cursor-tips:
   前端 → GET /posts/slug/cursor-tips → 后端查 DB
   → 发现 source=jr-wiki → fetch http://nginx/learn-wiki/content/articles/cursor-tips.md
   → 读 Markdown → 转 HTML → 返回给前端

3. 修改内容:
   改 md → push → nginx 部署 → 下次请求自动拿到新内容（不用重新 sync）
```

### 学员故事 → 首页 testimonials

```
sync 写入 testimonials 集合:
{ slug: "alice-story", source: "jr-wiki", name: "Alice", ... }
首页正常查 DB 展示，和其他 testimonial 混在一起。
```

## Nginx 配置

```nginx
location /learn-wiki/ {
    alias /var/www/static/learn-wiki/;
    add_header Access-Control-Allow-Origin *;
    try_files $uri $uri/ =404;
}
```

## 添加内容

详见 [CONTENT_GUIDE.md](./CONTENT_GUIDE.md)。
