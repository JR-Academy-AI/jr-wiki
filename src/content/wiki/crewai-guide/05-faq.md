---
title: "常见问题：定价、踩坑、选型指南"
wiki: "crewai-guide"
order: 5
description: "CrewAI 定价方案、常见报错和解决方法、和其他工具的选型对比、学习资源"
---

## 定价：开源免费 + 企业版付费

CrewAI 的核心框架是 **MIT 开源**，本地跑完全免费。你只需要为 LLM API 调用付费（OpenAI、Anthropic 等的费用）。

CrewAI 同时提供托管平台 [crewai.com](https://crewai.com)：

| 方案 | 价格 | 包含 |
|------|------|------|
| Free | $0/月 | 50 次 Crew 执行，基础监控 |
| Pro | 按量付费 | 更多执行次数，详细日志，团队协作 |
| Enterprise | 联系销售 | 私有部署，SSO，专属支持 |

```bash
# 本地跑 = 框架免费 + LLM API 费用
# 以 GPT-4o 为例，一个 3-Agent Crew 单次运行大约：
# - 输入 ~20k tokens × $0.0025/1k = $0.05
# - 输出 ~10k tokens × $0.01/1k  = $0.10
# - 合计约 $0.15/次
# 用 Ollama 本地模型则完全免费
```

![CrewAI 开源仓库](https://img.youtube.com/vi/UV81LAb_x1A/maxresdefault.jpg)

## 常见踩坑和解决方法

**1. Agent 陷入循环，反复输出同样的内容**

这是最常见的问题。解决方法：

```python
agent = Agent(
    role="...",
    goal="...",
    backstory="...",
    max_iter=5,              # 限制最大迭代次数
    max_retry_limit=2        # 工具调用失败最多重试 2 次
)
```

同时检查 `expected_output` 是否足够具体——模糊的目标容易让 Agent 反复尝试。

**2. Token 费用超预期**

多 Agent 协作时 token 消耗是单次调用的 3-10 倍，因为每个 Agent 都有自己的 system prompt + 上下文。控制方法：

- 简单任务用便宜模型（`gpt-4o-mini`、`claude-haiku-4-5-20251001`）
- 关键决策才用强模型
- 设置 `max_iter` 避免无限循环
- 用 `verbose=True` 观察 token 实际消耗

**3. `ModuleNotFoundError: No module named 'crewai_tools'`**

安装时漏了 tools 包：

```bash
pip install 'crewai[tools]'
```

**4. Agent 之间互相推诿，任务没人做**

通常是 `allow_delegation=True` 加上角色描述不清晰导致的。解决方法：给每个 Agent 明确的、不重叠的职责范围，或者在关键 Agent 上设 `allow_delegation=False`。

**5. Ollama 本地模型连不上**

确保 Ollama 服务在跑，然后配置：

```python
agent = Agent(
    role="...",
    goal="...",
    backstory="...",
    llm="ollama/llama3.1"  # 格式：ollama/模型名
)
```

## 选型决策树

不确定该不该用 CrewAI？按这个流程走：

```
你的任务需要多个 AI 角色协作吗？
├── 不需要，一个 LLM 调用就够 → 直接用 API，不用框架
└── 需要
    ├── 你会写 Python 吗？
    │   ├── 不会 → 用 Dify 或 Coze（可视化拖拽）
    │   └── 会
    │       ├── 需要精确控制状态流转？ → LangGraph
    │       └── 想快速搭建、角色分工清晰？ → CrewAI ✅
    └── 补充
        ├── 预算有限 → CrewAI + Ollama 本地模型（零 API 费）
        └── 企业级需求 → CrewAI Enterprise 或 LangGraph + LangSmith
```

## CrewAI vs 直接写 Prompt Chain

有人会问："我用 Python 自己调 API，写几个函数串起来不也行吗？"

可以，但 CrewAI 帮你处理了这些你迟早要自己写的东西：

- **Agent 角色隔离**：每个 Agent 有独立的 system prompt 和上下文，不会互相污染
- **自动重试和容错**：工具调用失败自动重试，Agent 卡住自动切换策略
- **委派机制**：Agent 发现自己不擅长的任务可以自动转给更合适的队友
- **Memory 和学习**：跨运行记忆，越用越好
- **监控和调试**：verbose 日志、callback hooks、token 消耗追踪

## 学习资源

| 资源 | 链接 | 说明 |
|------|------|------|
| 官方文档 | [docs.crewai.com](https://docs.crewai.com) | 最权威，更新最快 |
| GitHub 仓库 | [github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 源码 + examples 目录 |
| YouTube 官方 | 搜索 "CrewAI tutorial" | João Moura 亲自讲解 |
| 社区论坛 | [community.crewai.com](https://community.crewai.com) | 提问和看别人的项目 |
| CrewAI 认证 | [crewai.com](https://crewai.com) | 官方认证课程，10 万+ 开发者参加 |

上手建议：先跑通第二章的入门项目，然后改 Agent 角色和 Task 描述来做你自己的场景，比看再多教程都有用。
