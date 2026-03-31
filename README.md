# JR Learn Wiki

JR Academy Headless 内容仓库。不生成前端页面，只输出 `manifest.json` + 原始 Markdown 供官网 Next.js 消费。

**零 canonical 冲突** — 所有页面 URL 只在官网，jr-wiki 只提供内容数据。

## 工作流

```
员工 Claude App 写 Markdown → push → 自动构建部署
                                         ↓
官网 fetch manifest.json → 发现新内容 → fetch .md → SSR 渲染
```

## 快速开始

```bash
bun run build     # 构建到 dist/
bun run dev       # 构建 + 本地预览 http://localhost:4321
```

## 内容类型

| 类型 | 位置 | 必填 frontmatter |
|------|------|-----------------|
| **电子书** | `src/content/wiki/{book}/` | `title`, `wiki`, `order` + `_meta.yaml` |
| **文章** | `src/content/articles/` | `title`, `description`, `publishDate`, `tags` |
| **帮助中心** | `src/content/help/` | `title`, `description`, `category` |
| **学员故事** | `src/content/stories/` | `title`, `description`, `name`, `role`, `publishDate` |

## 构建输出

```
dist/
├── manifest.json           # 元数据（官网 fetch）
├── content/                # 原始 Markdown（官网 fetch 渲染）
│   ├── books/{book}/*.md
│   ├── articles/*.md
│   ├── help/*.md
│   └── stories/*.md
├── _preview/index.html     # 内部管理预览页
└── robots.txt
```

## 官网集成

```typescript
// 发现内容
const { books, articles, help, stories } = await fetch('/learn-wiki/manifest.json').then(r => r.json());

// 获取 Markdown 正文
const md = await fetch(article.contentUrl).then(r => r.text());
```

manifest.json 每个条目都有 `contentUrl` 字段，指向原始 .md 文件。

## Nginx 配置

```nginx
location /learn-wiki/ {
    alias /var/www/static/learn-wiki/;
    add_header Access-Control-Allow-Origin *;
    try_files $uri $uri/ =404;
}

# 可选：限制 _preview 只允许内部访问
location /learn-wiki/_preview/ {
    alias /var/www/static/learn-wiki/_preview/;
    # allow 办公室 IP;
    # deny all;
}
```

## 添加内容

详见 [CONTENT_GUIDE.md](./CONTENT_GUIDE.md)。
