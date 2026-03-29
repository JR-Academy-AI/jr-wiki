# /add-book — 创建一本新电子书

创建一本新的电子书/系列教程。你只需要提供书名和主题，Claude 帮你搭好结构。

## 使用方法
```
/add-book 书名 [描述]
```

例子：
- `/add-book AWS入门指南 零基础学AWS云服务`
- `/add-book React面试宝典`
- `/add-book 数据分析实战`

## 执行步骤

1. 根据用户提供的书名生成英文 slug（文件夹名）
2. 在 `src/content/wiki/` 下创建文件夹
3. 创建 `_meta.yaml`，包含 title、description、tags、order
4. 创建第一章 `01-introduction.md` 作为占位
5. 显示创建结果和本地预览地址

## 规则

- slug 只用英文小写 + 横杠，如 `aws-beginner-guide`
- 中文书名放在 `_meta.yaml` 的 title 字段
- order 根据现有书籍数量自动递增
- 章节文件必须有 frontmatter：title、wiki（= 文件夹名）、order
- 创建完成后提醒用户可以用 `/add-chapter` 添加更多章节

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
