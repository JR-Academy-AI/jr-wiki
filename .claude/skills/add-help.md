# /add-help — 添加帮助文档

添加一篇帮助中心文档（FAQ、操作指南等）。帮助文档不进数据库，仅部署为静态文件。

## 使用方法
```
/add-help 标题 [分类] [内容]
```

例子：
- `/add-help 如何重置密码 账号 描述重置密码的步骤`
- `/add-help 课程退款政策 支付`
- `/add-help 如何加入学习群 社区`

## 执行步骤

1. 生成英文 slug 作为文件名
2. 在 `src/content/help/` 下创建 `.md` 文件
3. 填入 frontmatter：title、description、category、order
4. 根据用户提供的信息生成帮助内容
5. 展示结果

## frontmatter 模板

```yaml
---
title: "如何重置密码"
description: "忘记密码时的操作步骤"
category: "账号"
order: 1
---
```

## 规则

- category 用中文，常见分类：账号、支付、课程、社区、技术
- order 决定在同分类内的排序
- 内容要简洁明了，用步骤式写法
- 帮助文档**不进数据库**，只部署为静态文件在 nginx 上

## 发布流程

创建完成后告诉用户：
> 帮助文档已创建：`src/content/help/{slug}.md`
> 部署后可通过 `/learn-wiki/content/help/{slug}.md` 访问。
>
> 下一步：
> 1. `/publish` 推送到线上
> 2. 不需要 sync（帮助文档不进数据库）
