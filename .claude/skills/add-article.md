# /add-article — 发布一篇文章

在网站上发布一篇新文章。

## 使用方法
```
/add-article 标题 [内容或描述]
```

例子：
- `/add-article 如何用AI写简历 分享3个实用技巧帮你快速生成专业简历`
- `/add-article ChatGPT vs Claude对比测评`

## 执行步骤

1. 根据标题生成英文 slug 作为文件名
2. 在 `src/content/articles/` 下创建 `.md` 文件
3. 填入 frontmatter：title、description、publishDate（今天）、tags、author
4. 如果用户提供了内容描述，生成文章初稿
5. 展示结果，提醒用 `/preview` 预览或 `/publish` 发布

## frontmatter 模板

```yaml
---
title: "文章标题"
description: "一句话描述"
publishDate: "2024-01-15"
tags:
  - AI
  - 技巧
author: "JR Academy"
---
```

## 规则

- publishDate 用当天日期
- 文件名用英文小写+横杠，如 `how-to-write-resume-with-ai.md`
- 禁止模版化/AI味内容
