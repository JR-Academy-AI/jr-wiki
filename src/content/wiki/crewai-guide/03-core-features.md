---
title: "核心功能：Agent、Task、Crew、Tool 深度拆解"
wiki: "crewai-guide"
order: 3
description: "每个核心概念的完整参数、执行模式、内置工具清单、自定义工具写法"
---

## Agent 的全部配置项

CrewAI 的 Agent 不只是"一个 prompt"——它有角色设定、工具绑定、委派能力和记忆。除了 YAML 配置，你也可以直接用 Python 定义：

```python
from crewai import Agent
from crewai_tools import SerperDevTool, ScrapeWebsiteTool

researcher = Agent(
    role="Senior Tech Researcher",
    goal="找到最准确、最新的技术信息",
    backstory="你是一个有 10 年经验的技术分析师...",
    tools=[SerperDevTool(), ScrapeWebsiteTool()],
    llm="gpt-4o",           # 可以每个 Agent 用不同模型
    max_iter=5,              # 最多重试 5 次
    memory=True,             # 开启记忆
    allow_delegation=True,   # 允许把子任务委派给其他 Agent
    verbose=True             # 打印思考过程
)
```

![CrewAI Agent 协作流程](https://img.youtube.com/vi/sPzc6hMg7So/maxresdefault.jpg)

几个关键参数说明：

- **`backstory`** 不是装饰——它直接影响 Agent 的行为。一个"谨慎的安全审计员"和一个"激进的增长黑客"面对同样的任务会给出完全不同的答案。
- **`allow_delegation`** 设为 True 后，Agent 发现自己搞不定的事会自动找团队里更合适的 Agent 帮忙。
- **`max_iter`** 防止 Agent 陷入死循环，5-10 是比较合理的值。

## Task 的设计要点

Task 是你给 Agent 下达的具体指令。写好 Task 的关键是 **`expected_output` 要具体**：

```python
from crewai import Task

research_task = Task(
    description="调研 {topic} 的最新动态，包括版本更新、社区反馈、竞品对比",
    expected_output="结构化 Markdown 报告，包含 10 个要点，每点附来源链接",
    agent=researcher,
    output_file="research_report.md"  # 自动保存到文件
)

# Task 之间可以传递上下文
writing_task = Task(
    description="基于调研报告撰写技术博客",
    expected_output="1500 字中文技术博客，Markdown 格式",
    agent=writer,
    context=[research_task]  # 自动获取 research_task 的输出作为输入
)
```

`context` 参数是 CrewAI 的精华之一：你不需要手动把上一个 Task 的结果复制粘贴给下一个 Agent，框架自动传递。

## Crew 的两种执行模式

**顺序执行（Sequential）**——Task 按定义顺序逐个执行：

```python
from crewai import Crew, Process

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,  # 先研究，再写文章
    verbose=True
)

result = crew.kickoff(inputs={"topic": "CrewAI framework"})
print(result.raw)  # 最终输出
```

**层级执行（Hierarchical）**——自动分配一个 Manager Agent 来调度任务：

```python
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, review_task],
    process=Process.hierarchical,  # Manager 自动决定谁先做什么
    manager_llm="gpt-4o"
)
```

层级模式适合任务之间有复杂依赖、需要动态调度的场景。

## 内置工具清单

`crewai[tools]` 自带一批开箱即用的工具：

| 工具 | 用途 | 需要的 API Key |
|------|------|---------------|
| `SerperDevTool` | Google 搜索 | SERPER_API_KEY |
| `ScrapeWebsiteTool` | 抓取网页内容 | 无 |
| `FileReadTool` | 读取本地文件 | 无 |
| `DirectoryReadTool` | 列出目录文件 | 无 |
| `PDFSearchTool` | 搜索 PDF 内容 | 无 |
| `CodeInterpreterTool` | 执行 Python 代码 | 无 |
| `GithubSearchTool` | 搜索 GitHub 仓库 | GITHUB_TOKEN |

## 自定义工具

写一个自定义工具只需要 `@tool` 装饰器：

```python
from crewai.tools import tool

@tool("Calculate Token Cost")
def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> str:
    """根据模型和 token 数量计算 API 调用费用"""
    prices = {
        "gpt-4o": (0.0025, 0.01),
        "claude-sonnet-4-6": (0.003, 0.015),
    }
    if model not in prices:
        return f"未知模型: {model}"
    input_price, output_price = prices[model]
    cost = (input_tokens / 1000) * input_price + (output_tokens / 1000) * output_price
    return f"预估费用: ${cost:.4f}"
```

把工具传给 Agent 就行，Agent 会根据 Task 需要自动决定是否调用：

```python
cost_analyst = Agent(
    role="Cost Analyst",
    goal="分析和优化 AI API 调用成本",
    backstory="...",
    tools=[calculate_cost]
)
```

CrewAI 的工具系统兼容 LangChain Tools，如果你之前写过 LangChain 工具可以直接复用。
