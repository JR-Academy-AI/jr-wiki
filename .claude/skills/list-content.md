# /list-content — 查看所有内容

列出所有内容及其在官网的地址。

## 使用方法
```
/list-content
```

或查看特定类型：
```
/list-content books
/list-content articles
```

## 执行步骤

1. 扫描 `src/content/` 下所有内容
2. 读取元数据（frontmatter / _meta.yaml）
3. 以表格展示，包含官网 URL

### 输出格式

```
📚 电子书 (每章是一篇独立 blog 文章)

1. Prompt Engineering 实战指南
   章节:
   - 第1章: 什么是Prompt → /blog/prompt-engineering-01-what-is-prompt
   - 第2章: 基础技巧 → /blog/prompt-engineering-02-basic-techniques
   - 第3章: 高级模式 → /blog/prompt-engineering-03-advanced-patterns

📝 文章

- Cursor IDE 5 个实用技巧 → /blog/cursor-tips
- Claude Code 开发工作流实战 → /blog/claude-code-workflow

❓ 帮助中心 (静态部署，不进数据库)

- 如何报名课程 → 部署在 /learn-wiki/content/help/how-to-enroll.md

👤 学员故事 (同步到首页 testimonials)

- Alice 从会计到前端工程师
- Bob 土木工程师转 DevOps
```

### 扫描路径

- `src/content/wiki/` — 电子书（文件夹 + _meta.yaml + 章节.md）
- `src/content/articles/` — 文章
- `src/content/help/` — 帮助中心
- `src/content/stories/` — 学员故事

### URL 规则

| 内容类型 | 官网 URL | slug 生成规则 |
|---------|---------|--------------|
| 文章 | `/blog/{slug}` | 文件名去掉 .md |
| 电子书章节 | `/blog/{book-slug}-{chapter-slug}` | 书名-章节名 |
| 帮助 | 不在官网展示 | 静态文件直接访问 |
| 学员故事 | 首页 testimonials 区 | 文件名去掉 .md |
