---
title: "快速上手：安装 CrewAI 并跑通第一个 Crew"
wiki: "crewai-guide"
order: 2
description: "环境要求、安装步骤、项目脚手架、第一个多 Agent 项目从 0 到跑通"
---

## 环境准备

CrewAI 要求 **Python 3.10 ~ 3.13**，包管理用的是 [uv](https://github.com/astral-sh/uv)（Rust 写的超快 Python 包管理器，CrewAI CLI 内部依赖它）。

```bash
# 确认 Python 版本
python3 --version  # 需要 3.10+

# 安装 CrewAI（会自动安装 uv）
pip install crewai

# 带内置工具包一起装
pip install 'crewai[tools]'

# 验证
crewai version
```

![CrewAI CLI 初始化项目](https://img.youtube.com/vi/Jl6BuoXcZPE/maxresdefault.jpg)

安装完你会得到一个 `crewai` 命令行工具，它能帮你生成项目骨架、跑 Crew、训练 Agent。

## 创建第一个项目

CrewAI 提供脚手架命令，一行搞定项目结构：

```bash
crewai create crew my_research_team
cd my_research_team
```

生成的目录结构：

```
my_research_team/
├── pyproject.toml          # 项目依赖
├── .env                    # API Key 放这里
├── README.md
├── src/
│   └── my_research_team/
│       ├── __init__.py
│       ├── main.py         # 入口：kickoff()
│       ├── crew.py         # Crew 定义（@CrewBase 装饰器）
│       ├── config/
│       │   ├── agents.yaml # Agent 配置
│       │   └── tasks.yaml  # Task 配置
│       └── tools/
│           └── custom_tool.py
```

CrewAI 的一个设计亮点是 **YAML 配置 + Python 代码分离**：Agent 和 Task 的角色描述写在 YAML 里，编排逻辑写在 Python 里。运营同事改 YAML 调角色描述，开发同事改 Python 调逻辑，互不干扰。

## 配置 Agent 和 Task

打开 `config/agents.yaml`，定义你的 Agent 团队：

```yaml
researcher:
  role: "Senior Tech Researcher"
  goal: "找到关于 {topic} 最新、最准确的信息"
  backstory: >
    你是一个资深技术研究员，擅长从海量信息中提取关键洞察。
    你的研究结果会被团队其他成员引用，所以准确性至关重要。

writer:
  role: "Tech Blog Writer"
  goal: "把研究结果写成一篇通俗易懂的中文技术博客"
  backstory: >
    你是一个技术博客写手，文风直接不啰嗦。
    你的读者是有一定基础的开发者，不需要过度解释基础概念。
```

再打开 `config/tasks.yaml`：

```yaml
research_task:
  description: >
    对 {topic} 做一次全面调研，覆盖：最新进展、核心功能、
    和竞品的区别、社区评价。输出结构化的调研报告。
  expected_output: "一份包含 10 个要点的调研报告，每个要点附信息来源"
  agent: researcher

writing_task:
  description: >
    基于调研报告，写一篇 1500 字的中文技术博客。
    要求：有代码示例、有对比表格、语气轻松但专业。
  expected_output: "一篇可以直接发布的 Markdown 格式博客文章"
  agent: writer
```

## 配置 API Key

在 `.env` 文件里填入你的 LLM API Key：

```bash
# 默认用 OpenAI
OPENAI_API_KEY=sk-xxxxxxxx

# 也可以用 Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

CrewAI 默认使用 GPT-4o，但你可以在 Agent 配置里指定任何支持的模型（后面高级章节会讲多模型混用）。

## 启动你的第一个 Crew

```bash
# 安装依赖
crewai install

# 运行！
crewai run
```

终端会实时打印每个 Agent 的思考过程和输出：

```
[Researcher] 🔍 Starting research on "CrewAI framework"...
[Researcher] I'll search for the latest information...
[Researcher] ✅ Task completed. Found 10 key insights.

[Writer] ✍️ Writing blog post based on research...
[Writer] ✅ Blog post completed. 1,523 words.
```

第一次跑可能要等 1-2 分钟（取决于你的 LLM 响应速度）。输出会保存在终端里，你也可以在 `crew.py` 里配置输出到文件。

## 常见新手问题

**Q: 必须用 OpenAI 吗？**
不是。CrewAI 支持 OpenAI、Anthropic、Google Gemini、本地 Ollama 模型等。后面第四章会讲怎么切换。

**Q: `crewai create crew` 和 `crewai create flow` 有什么区别？**
`crew` 创建一个 Agent 团队项目；`flow` 创建一个包含多个 Crew 的工作流项目。新手先从 `crew` 开始。

**Q: YAML 里的 `{topic}` 是什么？**
占位符。运行时通过 `crew.kickoff(inputs={"topic": "CrewAI"})` 传入实际值。
