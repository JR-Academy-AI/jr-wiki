# /add-article — 发布一篇文章

创建一篇新文章。文章会以 blog post 的形式出现在官网 `/blog/{slug}` 页面。

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
5. 展示结果
6. 提醒：新增文章需要 `/publish` 部署 + `bun run sync` 同步元数据到 DB

## frontmatter 模板

```yaml
---
title: "文章标题"
description: "一句话描述"
publishDate: 2026-04-01
tags:
  - AI
  - 技巧
author: "JR Academy"
---
```

## 规则

- publishDate 用当天日期
- 文件名用英文小写+横杠，如 `how-to-write-resume-with-ai.md`
- slug 就是文件名去掉 .md，官网地址是 `/blog/{slug}`
- 禁止模版化/AI味内容（参见 CLAUDE.md 反模板规则）

## 发布流程

创建完成后告诉用户：
> 文章已创建：`src/content/articles/{slug}.md`
> 官网地址将是：`/blog/{slug}`
>
> 下一步：
> 1. `/preview` 本地预览
> 2. `/publish` 推送到线上
> 3. `ADMIN_TOKEN=xxx bun run sync` 同步元数据到数据库
