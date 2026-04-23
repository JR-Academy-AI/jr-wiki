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
| `Ctrl/Cmd + Shift + P` | 命令面板（和 VS Code 一样） |

## 一个容易踩的坑

第一次打开大项目时，Windsurf 会做代码库索引（Indexing）。这个过程会吃 CPU 和内存，大项目可能要等几分钟。**别急着开始问 Cascade 问题**，等右下角的索引进度条跑完再操作，否则 AI 回答的上下文会不完整。

索引优化建议：在项目根目录创建 `.windsurfignore` 文件，排除不需要索引的目录：

```
node_modules/
dist/
build/
.git/
*.lock
```

这样能把索引文件数量减少 90% 以上，Cascade 响应也会更快。
