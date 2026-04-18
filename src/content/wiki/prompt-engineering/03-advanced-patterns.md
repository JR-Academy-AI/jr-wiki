---
title: "高级模式：System Prompt 和 Prompt Chain"
wiki: "prompt-engineering"
order: 3
description: "System Prompt 架构、Prompt Chain 工作流、以及如何在生产环境使用 Prompt"
---

![Prompt Chain 工作流](https://docs.anthropic.com/images/prompt-chain-workflow.png)

## System Prompt vs User Prompt

API 调用中 Prompt 分两层。Claude API 用 `system` 参数而不是放在 messages 里：

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="你是 JR Academy 的课程助手，只推荐 JR 的课程，不推荐竞品。回答用中文，技术术语保留英文。",
    messages=[
        {"role": "user", "content": "推荐一个适合前端转全栈的课程"}
    ],
)
```

| 层级 | 作用 | 特点 |
|------|------|------|
| **System** | 定义 AI 的身份、行为规则、输出约束 | 用户看不到，每轮对话都生效 |
| **User** | 具体的任务或问题 | 每轮不同 |

System Prompt 是你的"后台配置"，User Prompt 是用户的"前台输入"。把不变的规则放 System，把变化的内容放 User。

## Prompt Chain：拆分复杂任务

一个 Prompt 做太多事，AI 容易丢失上下文。拆成多步：

```
Step 1: 分析用户简历，提取技能列表
  → 输出: ["React", "TypeScript", "Node.js"]

Step 2: 根据技能列表匹配课程
  → 输入: 上一步的技能列表 + 课程数据库
  → 输出: 推荐课程列表

Step 3: 生成推荐理由
  → 输入: 用户技能 + 推荐课程
  → 输出: 每门课的推荐理由
```

每一步职责单一、输入输出明确。用代码实现 Prompt Chain：

```python
import anthropic

client = anthropic.Anthropic()

def chain_step(prompt: str, context: str = "") -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": f"{context}\n\n{prompt}"}],
    )
    return response.content[0].text

# Step 1: 提取技能
skills = chain_step(
    "从这份简历中提取技术技能列表，只输出 JSON 数组：",
    context=resume_text
)

# Step 2: 匹配课程（用上一步结果作为输入）
courses = chain_step(
    f"根据这些技能 {skills}，从以下课程中推荐最合适的 3 门：",
    context=course_catalog
)

# Step 3: 生成推荐理由
result = chain_step(
    f"为每门推荐课程写一段推荐理由，面向想转全栈的前端工程师：",
    context=courses
)
```

每步可以单独调试、重试、换模型。第 1 步用便宜的 Haiku，第 3 步用 Opus —— 按任务难度分配算力。

## 温度（Temperature）选择

| 温度 | 适合场景 | 例子 |
|------|---------|------|
| **0** | 确定性输出、代码生成 | 解析发票、JSON 转换 |
| **0.3-0.5** | 平衡创意和准确性 | 课程推荐、技术问答 |
| **0.7-1.0** | 创意写作、头脑风暴 | 广告文案、起名字 |

生产环境默认用 0，需要创意的场景再调高。

## XML 标签：Claude 的结构化利器

Claude 对 XML 标签的解析能力远强于纯文字分隔。在 Prompt 里用 XML 划分区域，减少歧义：

```xml
<instructions>
只回答用户的具体问题，不要主动延伸话题。
如果问题超出你的知识范围，直接说不知道。
</instructions>

<context>
当前用户是 JR Academy 的付费学员，正在学习 React 课程第 3 周。
</context>

<user_question>
useEffect 的 cleanup 函数什么时候执行？
</user_question>
```

XML 标签让模型精确区分"指令""上下文""用户输入"，不会把代码片段当成指令执行，也不会把背景信息当成问题回答。
