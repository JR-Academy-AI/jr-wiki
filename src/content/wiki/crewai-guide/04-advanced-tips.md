---
title: "进阶技巧：Flow 编排、Memory 记忆、多模型混用"
wiki: "crewai-guide"
order: 4
description: "Flow 工作流、状态管理、Agent 记忆、多 LLM 混用、性能优化、真实项目案例"
---

## Flow：编排多个 Crew 的工作流

当你的项目复杂到一个 Crew 搞不定时，**Flow** 登场。Flow 用事件驱动的方式把多个 Crew 串起来，支持条件分支、并行执行、状态共享。

```python
from crewai.flow.flow import Flow, listen, start, router
from pydantic import BaseModel

class ContentState(BaseModel):
    topic: str = ""
    research: str = ""
    article: str = ""
    quality_score: float = 0.0

class ContentPipeline(Flow[ContentState]):
    @start()
    def pick_topic(self):
        self.state.topic = "CrewAI 2026 新特性"
        return self.state.topic

    @listen(pick_topic)
    def do_research(self, topic):
        # 这里可以 kickoff 一个 research_crew
        result = research_crew.kickoff(inputs={"topic": topic})
        self.state.research = result.raw
        return self.state.research

    @router(do_research)
    def check_quality(self, research):
        # 根据研究质量决定下一步
        if len(research) > 2000:
            return "write"    # 质量够，去写文章
        return "redo"         # 内容太少，重新研究

    @listen("write")
    def write_article(self):
        result = writing_crew.kickoff(inputs={
            "topic": self.state.topic,
            "research": self.state.research
        })
        self.state.article = result.raw

    @listen("redo")
    def redo_research(self):
        # 换一个更强的模型重新研究
        result = deep_research_crew.kickoff(inputs={"topic": self.state.topic})
        self.state.research = result.raw
```

![CrewAI Flow 工作流](https://img.youtube.com/vi/LqojMBcbfJk/maxresdefault.jpg)

`@start()` 标记入口，`@listen()` 监听上一步完成事件，`@router()` 做条件路由。这套模式比写一堆 if-else 干净得多。

## Memory：让 Agent 跨任务记住东西

CrewAI 支持三种记忆：

| 记忆类型 | 作用 | 存储方式 |
|---------|------|---------|
| Short-term | 当前 Crew 运行期间的上下文 | 内存 |
| Long-term | 跨多次运行的经验积累 | 本地 SQLite |
| Entity | 记住特定实体的信息（人名、项目名等） | 本地 SQLite |

开启方式：

```python
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    memory=True,        # 开启 short-term + long-term
    embedder={          # 指定 embedding 模型（用于记忆检索）
        "provider": "openai",
        "config": {"model": "text-embedding-3-small"}
    }
)
```

Long-term Memory 的实际用途：你的 Crew 第一次跑完后，Agent 会记住哪些策略有效、哪些无效。下次再跑同类任务，它会优先采用之前成功的策略。这对反复运行的自动化任务（比如每日新闻整理）特别有用。

## 多模型混用

一个 Crew 里不同 Agent 可以用不同的 LLM——贵的模型做关键决策，便宜的做简单任务：

```python
researcher = Agent(
    role="Researcher",
    goal="...",
    backstory="...",
    llm="claude-sonnet-4-6"     # 研究用 Claude，推理能力强
)

writer = Agent(
    role="Writer",
    goal="...",
    backstory="...",
    llm="gpt-4o-mini"           # 写作用便宜模型就够了
)

reviewer = Agent(
    role="Reviewer",
    goal="...",
    backstory="...",
    llm="ollama/llama3"         # 审校用本地模型，零成本
)
```

本地模型用 Ollama 接入，不需要 API Key，适合对数据隐私有要求的场景。

## 实战案例：竞品调研 Crew

一个完整的竞品分析 Crew：

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, ScrapeWebsiteTool

search = SerperDevTool()
scrape = ScrapeWebsiteTool()

# Agent 团队
scout = Agent(
    role="Market Scout",
    goal="找到 {product} 的所有竞品及其最新动态",
    backstory="你专门追踪 SaaS 市场动态，嗅觉敏锐",
    tools=[search, scrape]
)

analyst = Agent(
    role="Competitive Analyst",
    goal="对比 {product} 和竞品的功能、定价、用户评价",
    backstory="你擅长结构化分析，报告总是有理有据",
    tools=[search]
)

strategist = Agent(
    role="Strategy Advisor",
    goal="基于竞品分析给出可执行的产品建议",
    backstory="你是产品策略顾问，建议必须落地可执行"
)

# 任务链
scan_task = Task(
    description="搜索 {product} 的主要竞品，每个竞品收集：官网、核心功能、定价、最近更新",
    expected_output="竞品清单表格，至少 5 个竞品",
    agent=scout
)

compare_task = Task(
    description="对比 {product} 和每个竞品的优劣势",
    expected_output="详细对比矩阵 + 每个维度的结论",
    agent=analyst,
    context=[scan_task]
)

advise_task = Task(
    description="给出 3 条具体的产品改进建议",
    expected_output="每条建议包含：要做什么、为什么、预期效果、优先级",
    agent=strategist,
    context=[compare_task],
    output_file="competitive_report.md"
)

# 组队启动
crew = Crew(
    agents=[scout, analyst, strategist],
    tasks=[scan_task, compare_task, advise_task],
    process=Process.sequential,
    verbose=True
)

result = crew.kickoff(inputs={"product": "CrewAI"})
```

这个 Crew 跑一次大约消耗 30k-50k tokens（视搜索结果量而定），用 GPT-4o 大概 $0.15-0.30，用 Claude Sonnet 差不多。
