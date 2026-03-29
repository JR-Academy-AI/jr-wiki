# JR Learn Wiki

JR Academy 独立静态知识库，Astro 构建，纯 static HTML，部署在 `/learn-wiki/`。

非技术员工通过 Claude App 写 Markdown → Push 到 GitHub → 自动构建部署 → 主站通过 `manifest.json` 发现新内容。

## 内容类型

| 类型 | 路由 | Markdown 位置 | 用途 |
|------|------|---------------|------|
| **电子书** | `/learn-wiki/{book}/{chapter}/` | `src/content/wiki/{book}/` | 体系化系列教程 |
| **文章** | `/learn-wiki/articles/{slug}/` | `src/content/articles/` | 独立技术文章 |
| **帮助中心** | `/learn-wiki/help/{slug}/` | `src/content/help/` | FAQ、操作指南 |
| **学员故事** | `/learn-wiki/stories/{slug}/` | `src/content/stories/` | 转行案例、成功故事 |

## 快速开始

```bash
bun install
bun run dev       # http://localhost:4321/learn-wiki/
bun run build     # 输出到 dist/
bun run preview   # 预览构建结果
```

## 添加内容

详细操作见 [CONTENT_GUIDE.md](./CONTENT_GUIDE.md)。

### 添加电子书

```bash
# 1. 创建书籍文件夹
mkdir src/content/wiki/my-book

# 2. 添加书籍元信息
cat > src/content/wiki/my-book/_meta.yaml << 'EOF'
title: "书名"
description: "一句话描述"
tags: [tag1, tag2]
order: 1
EOF

# 3. 添加章节
cat > src/content/wiki/my-book/01-intro.md << 'EOF'
---
title: "章节标题"
wiki: "my-book"
order: 1
---

正文内容...
EOF
```

### 添加文章

```bash
cat > src/content/articles/my-article.md << 'EOF'
---
title: "文章标题"
description: "一句话描述"
publishDate: 2026-03-29
tags: [ai-tools]
author: "JR Academy"
---

正文内容...
EOF
```

### 添加帮助文档

```bash
cat > src/content/help/my-faq.md << 'EOF'
---
title: "问题标题"
description: "简要描述"
category: "课程"
order: 1
---

正文内容...
EOF
```

### 添加学员故事

```bash
cat > src/content/stories/student-name.md << 'EOF'
---
title: "故事标题"
description: "简要描述"
name: "学员名"
role: "会计 → 前端工程师"
company: "Canva"
course: "全栈开发班"
tags: [转行, 前端]
publishDate: 2026-03-29
highlight: "3 个月拿到 offer"
---

正文内容...
EOF
```

## 主站集成

构建时自动生成 `/learn-wiki/manifest.json`，包含所有内容的元数据。主站运行时 fetch 即可发现新内容，无需重新部署：

```typescript
const res = await fetch('/learn-wiki/manifest.json');
const { books, articles, help, stories, stats } = await res.json();
```

manifest 结构：

```json
{
  "generatedAt": "2026-03-29T...",
  "baseUrl": "/learn-wiki",
  "books": [{ "slug": "", "title": "", "chapters": [...], "url": "" }],
  "articles": [{ "slug": "", "title": "", "publishDate": "", "tags": [], "url": "" }],
  "help": [{ "slug": "", "title": "", "category": "", "url": "" }],
  "stories": [{ "slug": "", "title": "", "role": "", "company": "", "url": "" }],
  "stats": { "totalBooks": 1, "totalChapters": 3, "totalArticles": 2, "totalHelp": 3, "totalStories": 2 }
}
```

## Nginx 配置

```nginx
location /learn-wiki/ {
    alias /var/www/static/learn-wiki/;
    try_files $uri $uri/ $uri/index.html =404;
}
```

## 技术栈

- **Astro 5** — 纯静态输出，零 JS（除交互组件）
- **Markdown** — 内容格式
- **Neo-Brutalism** — JR Academy 品牌设计风格
- **GitHub Actions** — Push 到 main 自动构建部署

## 项目结构

```
src/
├── content/                    # Markdown 内容
│   ├── wiki/{book}/            # 电子书（文件夹 + _meta.yaml + 章节.md）
│   ├── articles/               # 文章（单文件.md）
│   ├── help/                   # 帮助中心（单文件.md）
│   ├── stories/                # 学员故事（单文件.md）
│   └── config.ts               # 内容集合 Schema
├── layouts/                    # 页面布局
│   ├── BaseLayout.astro        # HTML + Header + Footer
│   ├── WikiLayout.astro        # 侧边栏 + 上下章导航
│   └── ArticleLayout.astro     # 文章布局
├── components/                 # 组件
│   ├── Header.astro            # 顶部导航
│   ├── Footer.astro
│   ├── WikiSidebar.astro       # 电子书章节侧边栏
│   ├── PrevNextNav.astro       # 上一章/下一章
│   ├── Breadcrumb.astro
│   └── ArticleCard.astro       # 文章卡片
├── pages/                      # 路由页面
│   ├── index.astro             # 首页
│   ├── [wiki]/                 # 电子书路由
│   ├── articles/               # 文章路由
│   ├── help/                   # 帮助中心路由
│   └── stories/                # 学员故事路由
├── integrations/
│   └── manifest.ts             # 构建时生成 manifest.json
└── styles/
    └── global.css              # Neo-Brutalism 设计变量
```
