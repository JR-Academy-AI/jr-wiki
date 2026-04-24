---
title: "安装与第一个项目"
wiki: "windsurf-guide"
order: 2
description: "5 分钟装好 Windsurf，跑通第一个 AI 辅助开发项目"
---

## 下载安装

Windsurf 支持 macOS、Windows、Linux 三个平台，去官网下载对应安装包就行：

![Windsurf 安装与初始界面](https://img.youtube.com/vi/Ydbv0F4Ovd8/maxresdefault.jpg)

```bash
# macOS（也可以直接下载 .dmg）
brew install --cask windsurf

# Linux（Debian/Ubuntu）
# 去 windsurf.com/download 下载 .deb，然后：
sudo dpkg -i windsurf_*.deb

# Windows
# 直接下载 .exe 安装包，双击运行
```

安装后第一次启动，Windsurf 会问你要不要导入 VS Code 或 Cursor 的设置。**强烈建议导入**——主题、快捷键、插件都能保留，体验几乎一模一样。

## 注册与登录

打开 Windsurf 后右侧会出现 Cascade 面板，点击登录。支持 Google、GitHub 账号直接注册，免费账户就能开始用。

注册完成后你会获得：

| 免费额度 | 说明 |
|---------|------|
| Tab 自动补全 | **无限量**，不消耗任何 credit |
| Cascade 对话 | 每月 25 次 prompt credit |
| 模型 | 默认使用 Codeium 基础模型 |

25 次 Cascade 够你完整体验功能了。觉得好用再考虑升级 Pro（$15/月，500 credit）。

## 第一个项目：用 Cascade 生成一个 Todo App

打开一个空文件夹，然后在 Cascade 面板里输入：

```
帮我创建一个 React + TypeScript 的 Todo 应用，要求：
- 用 Vite 脚手架
- 支持添加、删除、标记完成
- 用 Tailwind CSS 做样式
- 数据存 localStorage
```

Cascade 会开始规划任务，你能看到它的执行步骤：

1. 运行 `npm create vite@latest` 初始化项目
2. 安装 Tailwind CSS 依赖并配置
3. 创建 `TodoApp.tsx`、`TodoItem.tsx` 组件
4. 编写 localStorage 读写逻辑
5. 运行 `npm run dev` 启动开发服务器

整个过程大概 2-3 分钟。Cascade 每一步都会展示 diff 预览，你可以点 Accept 或 Reject 逐步控制。

## 关键操作速查

| 快捷键 | 作用 |
|--------|------|
| `Ctrl/Cmd + L` | 打开 Cascade 面板 |
| `Ctrl/Cmd + I` | Inline Edit（选中代码后原地修改） |
| `Tab` | 接受 Supercomplete 补全建议 |
| `Esc` | 拒绝当前补全建议 |
| `Ctrl/Cmd + Shift + P` | 命令面板（和 VS Code 一样） |
| `Ctrl/Cmd + .` | 快速修复（Quick Fix） |

## Turbo 模式

Cascade 默认每一步都要你点 Accept。开启 Turbo 模式后，Cascade 可以自动执行终端命令，不再逐步确认。适合你信任 AI 输出、想让它一口气跑完的场景。

在 Cascade 面板顶部找到 Turbo 开关，或者在设置里搜索 `turbo`：

```json
// settings.json
{
  "windsurf.cascade.turboMode": true
}
```

刚上手的时候建议关着 Turbo，等你熟悉 Cascade 的行为模式后再打开。跑 `rm`、`DROP TABLE` 这类危险命令时 Cascade 仍然会弹确认，不会盲执行。

## 索引与 .windsurfignore

第一次打开大项目时，Windsurf 会做代码库索引（Indexing）。这个过程会吃 CPU 和内存，大项目可能要等几分钟。**别急着开始问 Cascade 问题**，等右下角的索引进度条跑完再操作，否则 AI 回答的上下文会不完整。

在项目根目录创建 `.windsurfignore` 文件，排除不需要索引的目录：

```
node_modules/
dist/
build/
.git/
*.lock
coverage/
.next/
```

这样能把索引文件数量减少 90% 以上，Cascade 响应也会更快。

一个实测数据：10 万行代码的 Next.js monorepo，不加 `.windsurfignore` 索引要 4 分钟，排除 `node_modules` 和 `dist` 后 40 秒内完成。

## Memories：让 AI 记住你的习惯

Windsurf 的 Memories 功能会在使用过程中学习你的编码偏好——比如你总是用 `const` 不用 `let`、API 错误处理总是返回 `{ success: false, error }` 格式。大约用两天后 Memories 开始生效，之后 Cascade 生成的代码会自动符合你的风格，不用每次在 prompt 里重复说明。

Memories 在设置里可以查看和清除：命令面板搜 `Windsurf: Manage Memories`。
