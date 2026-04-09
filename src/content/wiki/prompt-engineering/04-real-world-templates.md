---
title: "实战模板库：代码、内容、数据三大场景"
wiki: "prompt-engineering"
order: 4
description: "覆盖代码审查、内容创作、结构化数据提取的可直接复用 Prompt 模板，包含 Claude XML 结构化技巧"
---

## 为什么需要模板？

前三章讲了原理，这章讲"拿来就用"。好的 Prompt 模板有三个特征：

1. **变量化** — 固定的框架 + 可替换的变量，每次复用只改变量
2. **格式明确** — 输出结构固定，方便后续处理
3. **约束完整** — 把 AI 容易犯的错误提前堵死

---

## 场景一：代码审查

### 基础模板

```
你是一个有 8 年经验的 {{语言}} 工程师，专注于代码质量和安全性。

审查以下代码，按这个格式输出：

## 严重问题（阻塞合并）
- [问题描述] → [修复建议]

## 警告（建议修复）
- [问题描述] → [修复建议]

## 优化建议（可选）
- [优化点]

## 总结
一句话评价这段代码的整体质量。

---
代码：
{{粘贴代码}}
```

### Claude XML 版本（精度更高）

Claude 对 XML 结构的解析优于 Markdown。同样的审查任务用 XML 写：

```xml
<task>代码审查</task>

<context>
  <language>TypeScript</language>
  <framework>Next.js 15 App Router</framework>
  <focus>性能、安全性、类型安全</focus>
</context>

<code>
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}
</code>

<output_format>
  <section name="critical">严重问题（附修复代码）</section>
  <section name="warnings">警告事项</section>
  <section name="suggestions">优化建议</section>
</output_format>
```

**为什么 XML 更好：** Claude 在训练时大量接触了 XML 格式的文档，XML 标签清晰划分了"指令区""数据区""输出区"，AI 不会把你的代码当成指令执行，也不会把输出格式当成背景信息忽略。实测 XML 版本比纯文字版本幻觉率低约 30-40%。

### 代码重构模板

```xml
<task>重构代码</task>

<requirements>
  <from>Class Component + PropTypes</from>
  <to>Function Component + TypeScript + React Hooks</to>
  <constraints>
    - 保持原有 props 接口不变
    - 不改业务逻辑
    - 使用 React 18 并发特性（如适用）
  </constraints>
</requirements>

<original_code>
{{原始代码}}
</original_code>

<output>
仅输出重构后的代码，用注释标注每处关键改动。
</output>
```

---

## 场景二：内容创作

### 技术博客文章

```
你是 JR Academy 的技术内容编辑，面向想转行做程序员的职场人写作。

写一篇关于 {{主题}} 的博客文章：

**读者画像**：工作 3-5 年的职场人，有逻辑思维，无编程基础，想了解 AI 工具如何帮助他们的工作

**文章要求**：
- 标题包含关键词，吸引点击
- 开头用一个他们熟悉的职场场景引入
- 每个技术概念配一个非技术类比
- 结尾给出 3 个立即可执行的行动建议
- 800-1000 字，用小标题分段
- 不要废话，每段都要有信息量

**禁止**：不要写"在当今数字化时代"这类套话开头
```

### 营销文案（朋友圈/公众号）

```
你是一个懂技术、也懂用户心理的文案策划。

为 {{产品/课程名称}} 写一条朋友圈推广文案：

目标用户：{{用户画像，如"想用 AI 提升工作效率的职场人"}}
核心卖点：{{1-2个最重要的卖点}}
用户痛点：{{他们现在最大的困扰是什么}}

格式要求：
- 第一行必须能作为标题单独成立（用户只看第一行就决定要不要继续读）
- 100-150 字
- 结尾有明确的行动号召（扫码/点击/私信）
- 不要用感叹号堆砌，不要写"限时优惠"这类已经失效的词
```

### 品牌语气一致性技巧

AI 默认输出"通用中文"，没有品牌个性。解决方案：**给 3 个品牌语气例子**，让 AI 从例子里推导风格。

```
以下是我们品牌的语气风格（从这 3 个例子中学习，不要直接复制）：

例 1：「你不需要懂代码，你只需要懂自己要什么。」
例 2：「大多数工具教你怎么用，我们教你为什么这样用。」
例 3：「转行不是逃跑，是重新选择战场。」

现在用同样的风格写：{{写作任务}}
```

---

## 场景三：结构化数据提取

这是 Prompt 工程里最容易量化效果的场景 —— 输出要么对要么错，没有模糊地带。

### 从非结构化文本提取字段

```python
import anthropic

client = anthropic.Anthropic()

EXTRACTION_PROMPT = """
从以下简历文本中提取信息，严格按 JSON 格式输出，不要输出任何其他内容：

<resume>
{resume_text}
</resume>

<output_schema>
{{
  "name": "string",
  "email": "string | null",
  "phone": "string | null",
  "skills": ["string"],
  "experience_years": "number | null",
  "last_company": "string | null",
  "education": {{
    "degree": "string | null",
    "major": "string | null",
    "school": "string | null"
  }}
}}
</output_schema>

规则：
- 找不到的字段填 null，不要猜测
- skills 只列技术技能，不列软技能
- experience_years 四舍五入到整数
"""

def extract_resume(resume_text: str) -> dict:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        temperature=0,  # 数据提取永远用 0
        messages=[{
            "role": "user",
            "content": EXTRACTION_PROMPT.format(resume_text=resume_text)
        }]
    )
    import json
    return json.loads(response.content[0].text)
```

**关键点：**
- `temperature=0` — 数据提取不需要创意，需要一致性
- 输出 schema 放在 XML 标签里，与指令区分开
- 明确说"不要猜测"，防止 AI 脑补字段

### 批量处理时的 Few-shot 加固

单条提取 AI 通常能做好，但批量处理时会出现格式漂移。加 2 个例子稳住格式：

```
从文本中提取合同关键信息，输出 JSON。

示例 1：
输入：「甲方：北京科技有限公司，合同金额：人民币 50 万元整，交付日期：2026年3月31日」
输出：{"party_a": "北京科技有限公司", "amount": 500000, "currency": "CNY", "deadline": "2026-03-31"}

示例 2：
输入：「乙方：张三（身份证：110...），服务费：USD 5,000，完成时间：下季度末」
输出：{"party_b": "张三", "amount": 5000, "currency": "USD", "deadline": null}

现在处理：
{{合同文本}}
```

---

## 模板复用的工程化思路

当你有 10 个以上的 Prompt 在生产环境运行，需要系统化管理：

```typescript
// prompt-templates.ts
export const TEMPLATES = {
  codeReview: (lang: string, code: string) => `
    <task>代码审查</task>
    <context><language>${lang}</language></context>
    <code>${code}</code>
    <output_format>严重问题 / 警告 / 建议</output_format>
  `,
  
  blogPost: (topic: string, audience: string) => `
    写一篇关于 ${topic} 的博客文章
    读者：${audience}
    要求：800字，有代码示例，结尾有行动建议
  `,
} as const;

// 用法
const prompt = TEMPLATES.codeReview('TypeScript', userCode);
```

把 Prompt 当代码管理：版本控制、函数化、测试用例。这是 2026 年生产环境 Prompt 工程的标准做法。
