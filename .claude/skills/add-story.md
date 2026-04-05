# /add-story — 添加学员故事

发布一篇学员成功故事。故事会同步到官网首页 testimonials 区。

## 使用方法
```
/add-story 学员名字 [故事内容或关键信息]
```

例子：
- `/add-story 小王 从零基础到拿到Google offer，学了6个月`
- `/add-story Lisa 非IT背景转行前端，现在在Atlassian工作`

## 执行步骤

1. 生成英文 slug 作为文件名
2. 在 `src/content/stories/` 下创建 `.md` 文件
3. 填入 frontmatter：title、description、name、role、company、course、tags、publishDate、highlight
4. 根据用户提供的信息生成故事内容
5. 展示结果

## frontmatter 模板

```yaml
---
title: "从零基础到Google Offer"
description: "小王的转行故事"
name: "小王"
role: "Frontend Developer"
company: "Google"
course: "Web全栈开发"
tags:
  - 转行
  - 前端
publishDate: 2026-04-01
highlight: "6个月从零到offer"
---
```

## 规则

- publishDate 用当天日期
- highlight 是一句话亮点，会显示在首页卡片上
- 故事要真实自然，避免过度夸张

## 发布流程

创建完成后告诉用户：
> 学员故事已创建：`src/content/stories/{slug}.md`
> 发布后会出现在官网首页学员故事区。
>
> 下一步：
> 1. `/publish` 推送到线上
> 2. `ADMIN_TOKEN=xxx bun run sync` 同步到 testimonials 集合（新增内容必须）
