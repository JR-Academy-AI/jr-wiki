---
title: "排错指南：常见问题与解决方案"
wiki: "v0-guide"
order: 11
description: "v0 使用中的常见报错、AI 生成死循环、构建失败、样式错乱的排查与修复"
---

## 常见报错

v0 不是每次都能一把生成正确代码。用多了会发现几类反复出现的问题，提前知道怎么修能省不少 credits。

![v0 代码调试](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fhow-we-made-v0-an-effective-coding-agent.png&w=1920&q=75)

### Module not found

v0 引用了一个没安装的包，或 import 路径写错：

```bash
# 报错
Module not found: Can't resolve '@/components/ui/data-table'

# 方案 1：添加缺失的 shadcn 组件
npx shadcn@latest add data-table

# 方案 2：检查 tsconfig.json 的 paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### TypeScript 类型错误

多轮迭代后 v0 容易丢失组件的 props 类型定义：

```typescript
// 报错：Type '{ data: Task[] }' is not assignable to type 'IntrinsicAttributes'
// 原因：props interface 丢失

// 修复：补上 interface
interface TaskListProps {
  data: Task[]
}

export function TaskList({ data }: TaskListProps) {
  return data.map(task => <div key={task.id}>{task.title}</div>)
}
```

### Hydration Mismatch

用了浏览器 API 但没标记 `'use client'`，服务端和客户端渲染结果不一致：

```typescript
// ❌ Hydration error
export default function Clock() {
  return <p>{new Date().toLocaleTimeString()}</p>
}

// ✅ 加 'use client' + useEffect
'use client'
import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    setTime(new Date().toLocaleTimeString())
  }, [])
  return <p>{time}</p>
}
```

## AI 修复死循环

v0 有时修 bug 会陷入循环——修了 A 引入 B，修了 B 又破坏 A。超过 3 轮还在同一个问题上转，果断止损：

1. **回滚**：点左侧版本号，回到出问题前的版本
2. **换描述**：重新表述需求，别用"修复上面的 bug"这种模糊描述
3. **手动修**：切到 Code 编辑器直接改，小问题比让 AI 循环消耗 credits 划算
4. **换模型**：Pro 模型修不好的试 Max，简单 bug 用 Mini 省钱

一条经验：如果 v0 连续 3 轮改同一处代码，回滚到出问题前的版本，用完全不同的措辞重新描述需求，成功率比继续打补丁高得多。

## 样式错乱排查

生成的页面样式跟 Preview 不一样，通常是 Tailwind 配置或 CSS 变量的问题：

```bash
# 1. 检查 tailwind.config.ts 的 content 路径
content: [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './lib/**/*.{ts,tsx}',
]

# 2. 确认 globals.css 被正确导入
# app/layout.tsx 顶部应有：
# import './globals.css'

# 3. 清除缓存重新构建
rm -rf .next && npm run dev
```

## 本地调试技巧

把 v0 项目拉到本地后的排查流程：

```bash
# 启动开发服务器
npm run dev

# 检查构建是否通过
npm run build

# 找到体积最大的依赖
ANALYZE=true npm run build

# 检查 TypeScript 错误（不实际编译）
npx tsc --noEmit
```

有个省事技巧：v0 的 Code 编辑器里直接加 `console.log`，在 Preview 的浏览器控制台（F12）就能看到输出，不需要拉到本地就能做基本调试。

## 什么时候该放弃 v0

几种情况手动写比让 v0 修更快：

| 场景 | 建议 |
|------|------|
| 复杂状态管理（多组件联动） | 手写 Zustand / Jotai |
| 第三方 SDK 集成（微信、支付宝） | 手动集成，v0 对国内 SDK 不熟 |
| 性能优化（虚拟列表、懒加载） | 手动用 react-window / next/dynamic |
| 已有项目的局部改动 | 用 Cursor 在已有代码上改，上下文更完整 |

v0 擅长从零生成整页 UI，不擅长修改复杂的现有代码。选对工具比死磕一个工具重要。
