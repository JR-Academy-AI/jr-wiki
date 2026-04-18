---
title: "什么是 Prompt"
wiki: "prompt-engineering"
order: 1
description: "Prompt 的定义、组成结构和为什么写好 Prompt 直接决定 AI 输出质量"
---

![Prompt Engineering 概念](https://docs.anthropic.com/images/prompt-engineering-overview.png)

## Prompt = 你给 AI 的指令

Prompt 就是你输入给大语言模型（LLM）的文本。模型根据这段文本生成回复，你写的内容直接决定输出质量。

一个 Prompt 一般包含这几个部分：

| 组成 | 说明 | 示例 |
|------|------|------|
| **角色** | 告诉 AI 它是谁 | "你是一个资深前端工程师" |
| **任务** | 要完成什么 | "把这段代码从 class component 重构为 hooks" |
| **上下文** | 背景信息 | "项目用 React 18 + TypeScript" |
| **约束** | 输出格式和限制 | "只输出代码，不要解释" |

## 好 Prompt vs 坏 Prompt

```
❌ 坏: "帮我写个网站"
→ AI 不知道什么网站、什么技术栈、什么功能，只能猜

✅ 好: "用 Next.js 14 App Router + TypeScript 写一个博客首页，
包含文章列表（标题+摘要+日期），数据从 /api/posts 获取，
用 Tailwind CSS，响应式布局，移动端单列桌面端双列"
→ 技术栈、功能、数据源、样式、布局全部明确
```

关键区别：**具体性**。AI 不会读心，你省略的每一个细节它都要猜，猜错概率和你省略的信息量成正比。

## Prompt 当函数写

把 Prompt 看成一个函数：有输入参数、有返回值格式、有边界条件。这是工程师写 Prompt 的天然优势。

```python
# 用编程思维理解 Prompt 结构
def generate_code_review(
    language: str,       # 角色/上下文
    code: str,           # 输入数据
    focus: str = "安全性", # 任务约束
    format: str = "markdown" # 输出格式
) -> str:
    """
    角色 = 函数名 + docstring
    任务 = 函数体
    上下文 = 参数
    约束 = 返回值类型
    """
    ...
```

实际 Prompt 对应写法：

```
你是一个有 8 年经验的 {language} 工程师（角色 = 函数签名）
审查以下代码的 {focus}（任务 = 函数调用）
代码：{code}（上下文 = 参数传入）
用 {format} 格式输出（约束 = 返回值类型）
```

每省略一个"参数"，AI 就自己填一个默认值 —— 这个默认值往往不是你要的。

## Prompt 不是"跟 AI 聊天"

很多人把写 Prompt 当聊天，用模糊的自然语言。实际上 Prompt 更接近**写 specification** —— 你在定义一个任务的输入、输出、约束条件。

工程师写 Prompt 的优势在于：习惯了定义清晰的接口和约束。把 Prompt 当成函数签名来写，输入参数明确、返回值格式确定、边界条件处理清楚。

## Token 基础：AI 怎么读你的 Prompt

LLM 不是一个字一个字读 Prompt 的，它先把文本切成 token（词元），再处理。理解 token 能帮你控制成本和长度：

```bash
# 粗略估算：中文 1 个字 ≈ 1-2 tokens，英文 1 个单词 ≈ 1 token
"用 Python 写一个快速排序" → 约 12 tokens
"Write a quicksort in Python" → 约 7 tokens

# Claude Opus 4.6 定价参考
# 输入: $15 / 1M tokens  输出: $75 / 1M tokens
# 一个 500 字的 Prompt ≈ 700 tokens ≈ $0.01
```

写 Prompt 时的实际影响：**英文技术术语不需要翻译成中文**，直接用原词既省 token 又更精确。比如 "React component" 比 "React 组件" 更准确，因为模型训练数据里英文技术文档远多于中文。
