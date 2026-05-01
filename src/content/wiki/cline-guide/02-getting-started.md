---
title: "安装配置与第一个项目"
wiki: "cline-guide"
order: 2
description: "5 分钟装好 Cline、配好 API key、用 Plan/Act 模式完成第一个真实任务"
---

## 安装 Cline

Cline 是 VS Code 扩展，安装只要 30 秒：

1. 打开 VS Code，按 `Ctrl+Shift+X`（Mac 用 `Cmd+Shift+X`）进扩展市场
2. 搜索 **Cline**（作者 Cline Bot Inc.）
3. 点 Install，等几秒就好

装完后左侧活动栏会多一个 Cline 图标（一个机器人头像），点它打开 Cline 侧边栏。

![Cline 安装后的 VS Code 侧边栏](https://img.youtube.com/vi/N4UfySSBW-k/maxresdefault.jpg)

## 配置 API Provider

Cline 不内置模型，你需要接入自己的 API。支持的 Provider 超过 10 个：

```
┌─────────────────────────────────────┐
│  Anthropic (Claude)   ← 推荐首选    │
│  OpenAI (GPT)                       │
│  Google (Gemini)                    │
│  OpenRouter           ← 聚合多模型   │
│  AWS Bedrock / Azure / GCP Vertex   │
│  Groq / Cerebras      ← 超快推理    │
│  Ollama / LM Studio   ← 本地模型    │
│  Cline API            ← 一个 key 通吃│
└─────────────────────────────────────┘
```

**新手推荐**：用 Anthropic API 接 Claude Sonnet——性价比最高、编程能力最强。注册 [console.anthropic.com](https://console.anthropic.com)，创建 API key，充值 $5 够用一个月。

配置步骤：

1. 打开 Cline 侧边栏
2. 点右上角齿轮图标
3. API Provider 选 **Anthropic**
4. 粘贴你的 API key
5. Model 选 **claude-sonnet-4-6**
6. 点 Save

配好以后在输入框随便打一句话试试，能回复就说明连接成功。

## 第一个任务：用 Plan 模式分析项目

打开你的项目文件夹，在 Cline 输入框里打：

```
帮我分析一下这个项目的整体架构，列出主要模块和它们之间的依赖关系
```

Cline 会自动切到 Plan 模式——它只读文件、不做修改。你会看到它依次打开 `package.json`、入口文件、路由配置，然后输出一份结构化的项目分析。

Plan 模式的每一步都会列出它要做什么（读哪个文件、为什么读），你点 ✅ 同意后它才执行。如果你觉得某一步没必要，可以点 ❌ 跳过或者输入文字引导它。

## 第一个实战：用 Act 模式改代码

现在来个真实任务。假设你有一个 Express 项目，想加一个健康检查接口：

```
给这个 Express 项目加一个 GET /health 接口，返回 { status: "ok", timestamp: Date.now() }。
先看一下现有的路由结构，然后在合适的位置添加。加完跑一下 npm test 确认没破坏别的。
```

Cline 的执行流程：

1. **读取** `src/routes/` 目录和 `app.js`（或 `index.ts`），理解路由怎么组织的
2. **创建或修改**路由文件，添加 `/health` 接口
3. **跑** `npm test`，读取输出
4. 如果测试报错，**自动修复**再跑一次
5. 任务完成，汇报改了哪些文件

全程你能看到每步的 diff 预览，不满意可以拒绝或者口头纠正。

## 关键操作速查

| 操作 | 方法 |
|------|------|
| 提及文件 | 输入 `@filename` 或 `@folder` |
| 提及 URL | 输入 `@url` 让 Cline 爬网页内容 |
| 看诊断问题 | 输入 `@problems` 获取 VS Code 问题面板信息 |
| 切 Plan/Act | 任务栏的 Plan/Act 切换按钮 |
| 回滚操作 | 点对话中某一步的 Restore Checkpoint |
| 换模型 | 齿轮图标 → 选不同 Model |
| 新对话 | 点 ➕ 按钮开始全新任务 |

```bash
# 验证 Cline 装好了
code --list-extensions | grep -i cline
# 输出: saoudrizwan.claude-dev
```

## 小贴士

**模型选择策略**：不用所有任务都上最贵的模型。简单任务（写注释、改变量名、加日志）用 Gemini Flash 或 DeepSeek，几乎免费；复杂任务（重构架构、调试疑难 bug）再切 Claude Sonnet。Cline 侧边栏右上角随时可以切模型，不用重新配置。
