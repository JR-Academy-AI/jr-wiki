---
title: "注册到第一个项目上线"
wiki: "v0-guide"
order: 2
description: "10 分钟完成 v0 注册、创建第一个应用、部署到线上"
---

## 注册

v0 注册不要钱，不要信用卡。打开 [v0.app](https://v0.app)，用以下任一方式登录：

- GitHub 账号（推荐，后面 Git 集成方便）
- Google 账号
- 邮箱
- 已有的 Vercel 账号

登录后自动获得每月 $5 免费额度，够跑完这个教程。

### 注册流程长什么样

点击 "Continue with GitHub" 后，浏览器跳转到 GitHub OAuth 授权页，v0 只申请读取账号基本信息和邮箱，不会要求 repo 写权限（那是后面 Git 集成才需要的）。点 "Authorize" 后秒跳回 v0 主界面，没有额外表单。

首次进入会看到空白对话框和几张示例卡片——"Build a SaaS dashboard"、"Create a landing page"，点一下直接开跑，或者清空自己输入。左侧侧边栏是历史对话列表，右上角实时显示剩余 credits 余额。**v0 账号就是 Vercel 账号**，两边共用一套身份，不用分别管理。

## 界面长什么样

![v0 聊天界面](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fintroducing-the-new-v0.png&w=1920&q=75)

v0 的界面是典型的 AI 对话 + 实时预览布局：

| 区域 | 功能 |
|------|------|
| 左侧聊天区 | 输入描述、迭代需求 |
| 右侧 Preview 标签 | 实时预览生成的应用 |
| 右侧 Code 标签 | VS Code 风格编辑器，逐文件查看代码 |
| 顶部栏 | 项目名称、Deploy 按钮、Git 面板 |
| 侧边栏 | 环境变量（Vars）、模板、MCP 集成 |

## 创建第一个项目

点击聊天区的 "+" 或直接输入描述。试试这个：

```
创建一个个人作品集网站，包含：
- 顶部导航栏（首页、项目、关于我、联系方式）
- Hero 区域带我的名字和一句话介绍
- 项目卡片网格，每个卡片有标题、描述、截图、链接
- 底部联系表单
- 暗色主题
- 响应式布局，手机端自动适配
```

v0 会花 10-30 秒生成完整的 Next.js 应用。右侧 Preview 直接能看效果，Code 标签能看到生成的文件结构：

```
app/
  layout.tsx        # 全局布局
  page.tsx          # 首页
components/
  ui/               # shadcn/ui 组件
  navbar.tsx        # 导航栏
  hero.tsx          # Hero 区域
  project-card.tsx  # 项目卡片
  contact-form.tsx  # 联系表单
lib/
  utils.ts          # 工具函数
```

### 第一个 React 组件实战

光看 UI 不够——来动手做一个真实能用的组件。在聊天框输入：

```
写一个 PriceCard React 组件，接受 props：
- title（字符串）
- price（数字）
- currency（字符串，默认"AUD"）
- features（字符串数组）
- highlighted（boolean，高亮时用不同边框颜色）
用 TypeScript + Tailwind CSS。
```

v0 生成的结果大概长这样：

```tsx
interface PriceCardProps {
  title: string
  price: number
  currency?: string
  features: string[]
  highlighted?: boolean
}

export function PriceCard({
  title,
  price,
  currency = "AUD",
  features,
  highlighted = false,
}: PriceCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-4 ${
        highlighted
          ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
          : "border-zinc-700"
      }`}
    >
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-4xl font-bold">
        {currency} {price}
        <span className="text-sm font-normal text-zinc-400">/月</span>
      </p>
      <ul className="flex flex-col gap-2 text-sm text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-green-400">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

几个值得注意的地方：

- **可选 prop 的默认值**：`currency?` 和 `highlighted?` 带问号代表可选，在解构时直接写 `= "AUD"` 和 `= false` 设默认值，调用时不传也不报错。
- **条件 className**：用模板字符串拼 Tailwind class 是 shadcn/ui 生态的惯用写法，`cn()` 工具函数（`clsx` + `tailwind-merge`）能做得更干净，v0 生成复杂组件时通常会自动引入。
- **key prop**：`features.map` 里 `key={f}` 是 React 列表渲染必填，v0 不会漏掉。

继续迭代：

```
highlight 状态改成顶部有渐变色条，而不是边框
```

v0 会在 Code 标签里高亮改动行，类似 GitHub diff 视图，只改了哪几行一目了然，不用通读整个组件。

## 迭代修改

不满意？直接在聊天里说：

- "把 Hero 区域的背景换成渐变色"
- "项目卡片加上悬浮放大效果"
- "导航栏改成固定在顶部"

每次修改 v0 都会生成新版本，所有历史版本都保存着，随时回滚。

还有个省钱技巧：切换到 **Design Mode**，直接点击页面上的元素修改颜色、字体、间距、文字——这些操作不消耗额度。只有 AI 生成才扣 credits。

## 部署上线

满意了？点右上角 **Deploy** 按钮：

1. v0 自动创建 Vercel 项目（名称前缀 `v0-`）
2. 几秒钟后给你一个 `xxx.vercel.app` 的线上地址
3. 自带 SSL 证书、全球 CDN、Serverless Functions
4. 后续修改再点 Deploy 就更新同一个项目

如果需要自定义域名，部署后在 v0 界面直接配置就行。

### 与 GitHub + Vercel 联动

一次性演示用 Deploy 按钮就够了。如果要正经维护项目，v0 内建的 Git 工作流更合适：

**第一步：连接 GitHub 仓库。** 在 v0 顶部找到 Git 面板，点 "Connect to GitHub"，授权时需要允许仓库写权限（这里和注册时不同）。授权后选择要推送的仓库，可以新建空仓库或连已有的 repo。

**第二步：每轮对话对应一个分支。** 连上 GitHub 后，v0 顶部会出现 "Create Branch" 按钮。点击后把当前这轮对话的所有改动推到一个独立分支，比如 `v0/feat-price-card`。这样不同功能的改动互不干扰。

**第三步：PR → 预览 → 合并发布。** 在 GitHub 里对 main 开 PR，Vercel 自动为这个 PR 生成预览链接——每次 push 都刷新预览。确认没问题了 merge 进 main，Vercel 触发正式部署，`xxx.vercel.app` 自动更新，全程不用手动操作。

**环境变量同步。** 如果应用需要 API key 或数据库连接串，在 v0 侧边栏 "Vars" 标签里填，部署时自动同步到 Vercel Environment Variables，不用单独登录 Vercel 控制台操作。

这套流程和普通前端团队用 GitHub + Vercel CI/CD 的方式完全一致，v0 只是把手写代码的环节替换掉了。

到这一步，你已经从零到上线了一个网站，全程没写一行代码。
