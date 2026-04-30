---
title: "CrewAI 是什么：让多个 AI Agent 组队干活"
wiki: "crewai-guide"
order: 1
description: "CrewAI 核心概念、和 LangGraph / AutoGen / Dify 的区别、适合哪些人"
---

## CrewAI 一句话介绍

CrewAI 是一个开源 Python 框架，让你把多个 AI Agent 组成一支"团队"，每个 Agent 有自己的角色、目标和工具，协同完成复杂任务。它由 João Moura 在 2024 年初创建，截至 2026 年 4 月已有 **50k+ GitHub Stars**，是目前增长最快的多智能体框架。

![CrewAI 架构示意](https://raw.githubusercontent.com/crewAIInc/crewAI/main/docs/images/crewai_logo.png)

你可以把 CrewAI 理解为"AI 版的项目经理"：你定义好团队成员（Agent）、分配任务（Task）、选择协作模式（Crew），然后一键启动，Agent 们自己协调、自己执行、自己交付结果。

## 核心架构

CrewAI 的设计非常直观，三个核心概念就能上手：

```
┌─────────────────────────────────────┐
│             Crew（团队）             │
│  ┌─────────┐  ┌─────────┐          │
│  │ Agent A  │  │ Agent B  │  ...    │
│  │ 研究员   │  │ 写手     │          │
│  └────┬─────┘  └────┬─────┘         │
│       │              │               │
│  ┌────▼─────┐  ┌────▼─────┐        │
│  │ Task 1   │  │ Task 2   │  ...   │
│  │ 搜集资料  │  │ 写报告   │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

- **Agent**：一个有角色（role）、目标（goal）、背景故事（backstory）的 AI 实体，可以绑定工具。
- **Task**：一件具体的事，指定交给哪个 Agent 做，期望输出什么。
- **Crew**：把 Agent 和 Task 组合在一起的容器，决定执行顺序（顺序执行 or 层级委派）。

在这之上，CrewAI 还有 **Flow**（编排多个 Crew 的工作流）和 **Memory**（跨任务记忆），后面章节展开。

## 和其他框架有什么不同

| 特性 | CrewAI | LangGraph | AutoGen | Dify |
|------|--------|-----------|---------|------|
| 设计思路 | 角色扮演团队 | 图状态机 | 对话式多 Agent | 可视化拖拽 |
| 上手难度 | 低，3 个概念 | 高，要理解图 | 中等 | 最低，不用写代码 |
| 灵活度 | 中高 | 最高 | 中 | 低 |
| Python 代码量 | 少，YAML 配置 | 多 | 中 | 几乎不写 |
| 适合场景 | 快速搭多 Agent 应用 | 复杂状态流转 | 群体讨论决策 | 非技术人员搭 AI 应用 |

实际选择很简单：

- 你是 Python 开发者，想快速搭一个多 Agent 系统 → **CrewAI**
- 你需要精确控制每一步状态流转和错误处理 → **LangGraph**
- 你想让多个 Agent 像开会一样讨论 → **AutoGen**
- 你不写代码，想拖拽搭应用 → **Dify / Coze**

## 谁适合用 CrewAI

- **Python 开发者**：CrewAI 是纯 Python 框架，写几十行代码就能跑起一个多 Agent 系统
- **自动化工程师**：内容生产、数据分析、竞品调研这类重复性工作，用 Crew 编排最省事
- **AI 应用开发者**：需要在产品里嵌入多 Agent 能力，CrewAI 的 API 设计比较干净
- **想学 AI Agent 原理的人**：角色 / 任务 / 协作的模型很容易理解，适合入门多智能体概念

不太适合的场景：完全不会 Python 的同学建议先看 Dify 或 Coze；只需要单次 LLM 调用的简单任务没必要上多 Agent。
