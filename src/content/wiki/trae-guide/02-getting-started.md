---
title: "Trae 快速上手：15 分钟从安装到写出第一个项目"
wiki: "trae-guide"
order: 2
description: "下载安装 Trae、熟悉界面布局、用 Builder Mode 生成第一个全栈应用，15 分钟完成全流程"
---

Trae 的上手速度非常快——下载安装不到 5 分钟，打开就能用 AI 写代码。如果你用过 VS Code，界面几乎零学习成本。

![Trae 安装与界面](https://img.youtube.com/vi/7QHJWFNkhYw/maxresdefault.jpg)

## 下载安装

1. 打开 [trae.ai](https://trae.ai)（海外版）或 [trae.cn](https://trae.cn)（国内版）
2. 下载对应系统的安装包（macOS / Windows，Linux 版计划中）
3. 安装后首次启动，选择界面主题（深色 / 浅色 / 深蓝）和语言
4. 用 Google、GitHub 或邮箱注册账号
5. 进入主界面，直接开始

**海外版 vs 国内版**：海外版（trae.ai）能用 Claude Sonnet 和 GPT-4o；国内版（trae.cn）接入的是豆包等国产模型，功能有差异。JR Academy 的同学建议用海外版。

## 迁移 VS Code 设置

如果你已经在用 VS Code，Trae 可以一键导入：

```bash
# Trae 首次启动时会提示导入
# 也可以手动操作：
# 1. 打开 Trae 设置
# 2. 搜索 "Import"
# 3. 选择 "Import VS Code Settings & Extensions"
# 导入内容包括：主题、快捷键、已装插件、用户设置
```

大部分 VS Code 插件（`.vsix` 格式）都能直接在 Trae 里用——GitLens、Prettier、ESLint 这些常用的都没问题。

## 界面布局

Trae 的界面分四个核心区域：

- **左侧文件树**：项目文件和文件夹，和 VS Code 一样
- **中间编辑器**：写代码的主区域，支持多标签页
- **右侧 AI 面板**：Chat / Builder / SOLO 三个模式的切换入口
- **底部终端**：内置终端，可以跑任何命令

常用快捷键：

| 操作 | macOS | Windows |
|------|-------|---------|
| 打开 AI 面板 | `Cmd + I` | `Ctrl + I` |
| 内联补全接受 | `Tab` | `Tab` |
| 命令面板 | `Cmd + Shift + P` | `Ctrl + Shift + P` |

## 用 Builder Mode 生成第一个项目

这是 Trae 最有冲击力的功能——用一段话描述需求，AI 给你搭出整个项目。

1. 新建一个空文件夹，用 Trae 打开（`File > Open Folder`）
2. 右侧 AI 面板切到 **Builder Mode**
3. 输入项目描述，比如：

```
用 React + Vite + Tailwind CSS 做一个 Pomodoro 番茄时钟应用。
需要：
- 25 分钟倒计时，可以暂停和重置
- 休息时间 5 分钟
- 完成次数统计
- 深色主题
- 响应式布局，手机端也能用
```

4. AI 开始分析需求、创建文件、写代码。你能实时看到文件树在变化
5. 点击 **Preview** 按钮，Webview 窗口弹出，应用已经在跑了
6. 觉得哪里不对，直接在 Builder 里追加修改："把计时器数字改大一点，用等宽字体"

整个过程不需要手动 `npm init`、不需要配 Tailwind、不需要写 `vite.config.ts`——AI 全帮你搞定。

## 版本回滚

Builder Mode 有个救命功能：**版本历史**。

点右上角 **Show History** 按钮，能看到每一轮 AI 修改的快照。觉得改坏了？直接回滚到任意一个历史版本。比手动 `git stash` 方便得多，特别是 AI 一次改了十几个文件的时候。

## 第一天就能做到的事

装好 Trae 后，你马上可以做这些事来熟悉它：

- 用 Builder Mode 生成一个 Todo App（经典练手项目）
- 用 Chat Mode 让 AI 解释一段你看不懂的开源代码
- 把现有项目打开，试试 `Cmd+I` 问 AI 任何关于项目的问题
- 截一张 UI 设计图丢给 AI，让它生成对应的 React 组件
