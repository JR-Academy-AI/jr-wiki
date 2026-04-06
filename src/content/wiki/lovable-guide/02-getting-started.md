---
title: "Lovable 快速上手：5 分钟创建你的第一个 AI 应用"
wiki: "lovable-guide"
order: 2
description: "注册账号、创建第一个项目、理解对话式开发流程，5 分钟从零到一个可访问的 Web 应用"
---

Lovable 的上手门槛极低——你只需要一个 Google 账号，不需要安装任何软件，打开浏览器就能开始构建应用。

![Lovable create new project](https://lovable.dev/placeholder-screenshot.png)

## 第一步：注册账号

1. 打开 [lovable.dev](https://lovable.dev)
2. 点击 **Sign up** → 选择 Google 登录（最快）
3. 完成后进入 Dashboard

**免费计划包含**：
- 每月 5 个项目
- 无限对话消息（在项目内）
- Lovable 托管的预览 URL
- GitHub 仓库同步（需连接 GitHub 账号）

## 第二步：创建第一个项目

点击 Dashboard 上的 **New Project** 按钮，进入一个空白的聊天界面。

这里有一个关键认知：**Lovable 的入口是一个对话框，不是代码编辑器**。你的第一条消息就是整个应用的"蓝图"。

### 写好第一条 Prompt 的技巧

差的 prompt：
```
做一个任务管理应用
```

好的 prompt：
```
创建一个任务管理应用，功能包括：
- 添加/删除/编辑任务
- 每个任务有标题、描述、截止日期、优先级（高/中/低）
- 按优先级或截止日期排序
- 标记任务为完成（带删除线效果）
- 深色模式支持
技术要求：用 React + TypeScript，界面参考 Linear 的风格，简洁现代
```

**原则**：越具体越好。列出你要的功能、UI 风格参考、技术偏好（如果你有的话）。

## 第三步：等待生成并预览

Lovable 一般在 30-60 秒内生成完整应用。生成完成后：

- **左侧**：AI 对话区域
- **右侧**：实时预览，可以直接点击交互
- **顶部**：代码视图切换按钮、部署按钮

你可以直接在预览里点击测试，也可以切换到 **Code** 视图查看生成的具体代码。

## 第四步：用对话迭代修改

这是 Lovable 最核心的体验。你发一条消息，它修改代码，右侧预览立刻更新。

**几个实用的迭代 prompt 模式**：

```
把主色调改成 #0066FF，按钮圆角改成 8px
```

```
任务列表太密集了，每个任务之间加 12px 间距，
加一个空状态图（当没有任务时显示"暂无任务"和一个图标）
```

```
添加一个搜索框，可以实时过滤任务标题
```

```
把现在的本地状态改成用 localStorage 持久化，
这样刷新页面后任务不会消失
```

每次对话都对应一个 Git commit，右上角可以看到版本历史，随时回滚。

## 第五步：分享预览链接

右上角 **Share** 按钮会生成一个公开的预览 URL，格式类似：
```
https://your-project-name.lovable.app
```

这个 URL 可以直接发给别人看，无需部署。如果你想绑定自己的域名，需要升级到付费计划。

## 连接 GitHub（推荐）

在项目设置里连接你的 GitHub 账号后，Lovable 会自动：
- 创建一个新的 GitHub 仓库
- 每次对话修改自动 commit + push
- 支持你在本地 clone 后用 Cursor/VS Code 继续开发

```bash
# 在 Lovable 项目设置里点击 Connect GitHub
# 然后 clone 到本地
git clone https://github.com/your-username/your-lovable-project.git
cd your-lovable-project

# 安装依赖并本地运行
npm install
npm run dev
```

## 一个完整的 5 分钟示例

以下是创建一个"链接收藏夹"应用的完整流程：

**Prompt 1（创建应用）**：
```
创建一个链接收藏夹应用：
- 可以添加链接（URL + 标题 + 描述 + 标签）
- 按标签筛选
- 搜索功能
- 网格卡片布局，每张卡片显示网站 favicon
- 数据暂时存 localStorage
```

**Prompt 2（优化 UI）**：
```
加一个深色/浅色模式切换按钮（右上角），
标签改成彩色徽章，不同标签不同颜色
```

**Prompt 3（加功能）**：
```
加一个"一键复制链接"按钮，点击后显示"已复制"提示（2秒后消失）
```

三条 prompt，大约 5 分钟，你就有了一个功能完整、界面美观的应用。
