---
title: "v0 快速上手：5 分钟生成你的第一个 React 组件"
wiki: "v0-guide"
order: 2
description: "注册账号、理解界面布局、写出第一个 prompt，5 分钟内拿到可用的 React 代码"
---

v0 的上手速度可能是所有 AI 开发工具里最快的——打开浏览器、登录、输入一句话，代码就出来了。不需要装任何软件。

![v0 editor interface](https://assets.vercel.com/image/upload/v1/front/blog/introducing-the-new-v0/meta.png)

## 第一步：注册账号

1. 打开 [v0.app](https://v0.app)
2. 点击右上角 **Sign In** → 用 GitHub 账号登录（推荐，后面 Git 集成会用到）
3. 登录后进入主界面，直接就是一个对话输入框

**免费计划包含**：
- 每月 $5 的 AI credits（大约能生成 30-50 个组件）
- 最多 200 个项目
- GitHub 同步
- Vercel 一键部署
- 使用 v0-1.5-md 模型

## 第二步：理解界面布局

v0 的界面分三个主要区域：

- **左侧**：AI 对话区——你输入 prompt，v0 回复生成的结果
- **中间/右侧**：实时预览——生成的组件直接渲染出来，可以交互
- **顶部 Tab**：Preview（预览）、Code（代码）、文件浏览器

2026 年的新版 v0 还加了一个完整的 VS Code 风格编辑器，可以直接在浏览器里改代码。

## 第三步：写你的第一个 Prompt

在对话框里输入你想要的组件描述。这里有个关键原则：**越具体越好**。

差的 prompt：
```
做一个登录页面
```

好的 prompt：
```
创建一个登录页面，包含：
- 邮箱和密码输入框，带表单验证
- "记住我"复选框
- Google 和 GitHub 第三方登录按钮
- "忘记密码"链接
- 深色背景，卡片居中，圆角 16px
- 左侧放一张插图占位区域
参考 Linear 或 Vercel 的登录页风格
```

v0 会在 15-30 秒内生成完整代码并渲染预览。

## 第四步：迭代修改

看到预览后，你可以继续在对话里提修改需求：

```
把 Google 登录按钮的图标换成 SVG 版本，
密码框加一个显示/隐藏密码的眼睛图标，
整体间距再紧凑一点
```

v0 支持两种迭代方式：

1. **Prompt 迭代**：用文字描述修改（适合功能变更和结构调整）
2. **Design Mode**：直接在预览里点击元素修改样式（适合颜色、间距、字体等视觉调整）

每次修改都有版本记录，可以随时回到之前的版本。

## 第五步：拿走代码

生成满意后，你有几种方式使用代码：

**方式一：复制代码到你的项目**
```bash
# 确保你的项目已安装 shadcn/ui
npx shadcn@latest init

# 安装 v0 生成的代码用到的组件
npx shadcn@latest add card button input

# 然后把 v0 生成的组件代码复制到你的项目里
# 比如 src/components/LoginPage.tsx
```

**方式二：GitHub 同步**

在 v0 项目设置里连接 GitHub，代码自动推送到你的仓库：
```bash
git clone https://github.com/your-username/v0-project.git
cd v0-project
npm install && npm run dev
```

**方式三：一键部署到 Vercel**

点击顶部 **Deploy** 按钮 → 选择 Vercel 项目 → 30 秒内上线，拿到一个 `.vercel.app` 域名。

## 一个完整的上手示例

以下是用 v0 生成一个"团队成员展示卡片"的完整流程：

**Prompt 1（生成组件）**：
```
创建一个团队成员展示组件：
- 网格布局，每行 3 张卡片，响应式
- 每张卡片：圆形头像、姓名、职位、一句话简介
- hover 时卡片微微上浮并显示社交链接（GitHub、LinkedIn）
- 用 shadcn/ui Card 组件，整体风格简洁
```

**Prompt 2（优化细节）**：
```
头像用 Avatar 组件，加一个渐变色的 ring 边框，
卡片底部加 "View Profile" 按钮，
整体配色改成深蓝 + 白色
```

两轮对话，不到 3 分钟，你就拿到了一个可以直接用在任何 Next.js 项目里的生产级组件。
