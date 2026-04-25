---
title: "shadcn/ui 主题定制与组件扩展"
wiki: "v0-guide"
order: 9
description: "定制 v0 生成的 shadcn/ui 主题：CSS 变量调色、暗色模式、添加组件、覆盖默认样式"
---

## v0 与 shadcn/ui 的关系

v0 生成的每一个 Button、Card、Dialog 都来自 shadcn/ui。跟 Ant Design 或 MUI 不同，shadcn/ui 的代码直接复制到你项目的 `components/ui/` 目录，不是 node_modules 里的黑盒。你拥有源码，想怎么改怎么改。

![shadcn/ui 主题系统](https://ui.shadcn.com/og.jpg)

v0 默认生成 shadcn 的 zinc 色系。换风格只需要改 CSS 变量，不需要碰组件代码。

## 用 CSS 变量换主题色

v0 项目的颜色定义在 `app/globals.css`，每种颜色有 light 和 dark 两套值：

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --accent: 240 4.8% 95.9%;
    --destructive: 0 84.2% 60.2%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
  }
}
```

把主色换成靛蓝，改 `--primary` 的 HSL 值：

```css
:root {
  --primary: 238 84% 67%;           /* indigo-500: #6366f1 */
  --primary-foreground: 0 0% 100%;
}
```

改完后所有用 `bg-primary`、`text-primary` 的组件自动跟着变。也可以在 [ui.shadcn.com/themes](https://ui.shadcn.com/themes) 在线调色，把生成的 CSS 变量直接粘到 `globals.css`。

## 添加 shadcn/ui 组件

v0 默认只生成项目用到的组件。后续需要更多组件时用 CLI 添加：

```bash
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add data-table

# 一次加多个
npx shadcn@latest add drawer command popover
```

组件代码出现在 `components/ui/` 里，可以直接改源码。

## 暗色模式切换

v0 生成的项目默认支持暗色模式，但需要 `next-themes` 来切换：

```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

切换按钮：

```typescript
'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

跟 v0 说"加一个暗色模式切换按钮"通常能自动生成这套代码。但手动定制主题时了解底层机制能调出更精确的效果。

## 覆盖组件默认样式

直接改 `components/ui/` 里的源码。比如让所有 Button 的圆角更大：

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl ...",
  // rounded-md → rounded-xl，影响所有 Button
  { variants: { ... } }
)
```

shadcn/ui 用 `class-variance-authority`（cva）管理变体。改 base class 影响所有 Button，改具体 variant 只影响那一种。这比在每个使用处加 `className` 覆盖干净得多。
