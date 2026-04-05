# /add-book — 创建一本新电子书

创建一本新的电子书/系列教程。每个章节会作为独立 blog post 出现在官网 `/blog/{book-slug}-{chapter-slug}`。

## 使用方法
```
/add-book 书名 [描述]
```

例子：
- `/add-book AWS入门指南 零基础学AWS云服务`
- `/add-book React面试宝典`

## 执行步骤

1. 根据用户提供的书名生成英文 slug（文件夹名）
2. 在 `src/content/wiki/` 下创建文件夹
3. 创建 `_meta.yaml`，包含 title、description、tags、order
4. 创建第一章 `01-introduction.md` 作为占位
5. 显示创建结果和官网地址

## 规则

- slug 只用英文小写 + 横杠，如 `aws-beginner-guide`
- 中文书名放在 `_meta.yaml` 的 title 字段
- order 根据现有书籍数量自动递增
- 章节文件必须有 frontmatter：title、wiki（= 文件夹名）、order

## _meta.yaml 模板

```yaml
title: "书籍标题"
description: "一句话描述"
tags:
  - 标签1
  - 标签2
order: N
```

## 章节 frontmatter 模板

```yaml
---
title: "章节标题"
wiki: "book-slug"
order: 1
description: "章节描述"
---
```

## URL 规则

每章是一篇独立 blog post：
- slug: `{book-slug}-{chapter-slug}` (如 `aws-guide-01-introduction`)
- 官网: `/blog/aws-guide-01-introduction`

## 发布流程

创建完成后告诉用户：
> 电子书已创建：`src/content/wiki/{slug}/`
>
> 下一步：
> 1. `/add-chapter {slug} 章节标题` 添加更多章节
> 2. `/preview` 本地预览
> 3. `/publish` 推送到线上
> 4. `ADMIN_TOKEN=xxx bun run sync` 同步元数据到数据库（新增内容必须）
