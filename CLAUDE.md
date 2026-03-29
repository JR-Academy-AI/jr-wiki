# CLAUDE.md — jr-wiki

JR Academy 独立静态知识库站点，Astro 构建，纯 static HTML。

## 内容类型

| 类型 | 路径 | Markdown 位置 |
|------|------|---------------|
| 电子书 | `/learn-wiki/{book}/{chapter}/` | `src/content/wiki/{book}/` |
| 文章 | `/learn-wiki/articles/{slug}/` | `src/content/articles/` |
| 帮助中心 | `/learn-wiki/help/{slug}/` | `src/content/help/` |
| 学员故事 | `/learn-wiki/stories/{slug}/` | `src/content/stories/` |

## 命令

```bash
bun install && bun run dev     # localhost:4321
bun run build                  # → dist/
```

## 主站集成

构建时自动生成 `/learn-wiki/manifest.json`，主站 fetch 即可发现新内容。

## 设计

Neo-Brutalism 风格，CSS 变量在 `src/styles/global.css`。
