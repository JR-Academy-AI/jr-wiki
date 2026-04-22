---
title: "v0 Platform API 与自动化"
wiki: "v0-guide"
order: 7
description: "用 v0 Platform API 和 SDK 实现代码生成自动化：从 API Key 申请到批量生成组件、集成 CI/CD 管线"
---

## Platform API 是什么

v0 Platform API 把浏览器里的"对话生成代码"能力开放成了 REST 接口。你可以用代码调 v0，批量生成组件、自动迭代、把 v0 嵌入自己的工具链。

![v0 Platform API](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fchangelog%2Fv0-platform-api.png&w=1920&q=75)

需要 Premium 计划（$20/月）才能用 API，免费版不行。

## 获取 API Key

1. 打开 [v0.app/chat/settings/keys](https://v0.app/chat/settings/keys)
2. 点 Create API Key
3. 复制 key，存到环境变量里，不要提交到代码仓库

```bash
# .env.local
V0_API_KEY=v0_key_xxxxxxxxxxxxxxxxxx
```

## SDK 安装与基础用法

v0 提供官方 TypeScript SDK：

```bash
npm install @anthropic-ai/v0-sdk
# 或
pnpm add @anthropic-ai/v0-sdk
```

最基本的用法——用 Prompt 生成一个 React 组件：

```typescript
import { V0Client } from '@anthropic-ai/v0-sdk'

const v0 = new V0Client({ apiKey: process.env.V0_API_KEY })

// 创建聊天会话
const chat = await v0.chats.create({
  prompt: '创建一个带搜索和分页的用户列表组件',
  model: 'v0-1.5-md'
})

// 获取生成结果
console.log(chat.id)        // 聊天 ID
console.log(chat.result)    // 生成的代码
console.log(chat.files)     // 文件列表
```

## 多轮迭代

一次生成不满意，可以在同一个聊天里继续发消息迭代：

```typescript
// 继续迭代
const updated = await v0.chats.update(chat.id, {
  prompt: '表格加上排序功能，点击列头切换升序降序'
})

// 再次迭代
const final = await v0.chats.update(chat.id, {
  prompt: '加一个导出 CSV 按钮，放在表格右上角'
})

// 获取最终的文件列表
for (const file of final.files) {
  console.log(`${file.path}: ${file.content.length} chars`)
}
```

## 批量生成组件

API 的真正威力在批量场景。比如你有一套设计规范，需要生成 20 个页面：

```typescript
const pages = [
  '用户登录页，带邮箱和 Google OAuth',
  '仪表盘，4 个 KPI 卡片 + 趋势图',
  '用户管理列表，支持搜索、筛选、批量操作',
  '设置页，个人信息 + 通知偏好 + 安全设置',
  '404 页面，带搜索框和热门链接'
]

const results = await Promise.all(
  pages.map(prompt =>
    v0.chats.create({
      prompt,
      instructions: '使用 shadcn/ui，品牌色 #6366f1，暗色主题'
    })
  )
)

// 把生成的文件写入本地项目
for (const result of results) {
  for (const file of result.files) {
    await fs.writeFile(`src/${file.path}`, file.content)
  }
}
```

5 个页面并行生成，2 分钟搞定，手写至少两天。

## 集成 CI/CD

把 v0 API 接入 GitHub Actions，实现 PR 里自动生成 UI 预览：

```yaml
# .github/workflows/v0-preview.yml
name: v0 UI Preview
on:
  pull_request:
    paths: ['docs/ui-specs/*.md']

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install @anthropic-ai/v0-sdk
      - run: node scripts/generate-ui.js
        env:
          V0_API_KEY: ${{ secrets.V0_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: generated-ui
          path: generated/
```

PM 在 `docs/ui-specs/` 里写需求文档，推 PR 后自动生成 UI 代码供开发 review——这是 v0 API 最实用的场景之一。
