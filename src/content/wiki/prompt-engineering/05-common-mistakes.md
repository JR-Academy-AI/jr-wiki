---
title: "踩坑合集：90% 的人都犯过的 Prompt 错误"
wiki: "prompt-engineering"
order: 5
description: "真实项目中最常见的 Prompt 失败模式，每个坑都附上根因分析和修复方案"
---

## 为什么好人写出烂 Prompt？

Prompt 写得差，不是因为笨，是因为有几个反直觉的地方：**AI 不会补全你的意图，不会忽略你的格式错误，也不会告诉你它猜错了**。它只会用你给的输入生成看起来合理的输出，而"看起来合理"不等于"你想要的"。

下面是真实项目里最常见的 8 个坑。

---

## 坑 1：任务描述模糊，AI 开始猜

```
❌ "帮我优化这段代码"

→ AI 不知道：优化性能？可读性？安全性？包大小？
→ 结果：AI 随机选一个方向，可能不是你要的
```

**根因：** 你脑子里有完整上下文，但没写进 Prompt。

```
✅ "优化这段 Python 函数的执行速度，目标是处理 100 万条记录时
   运行时间从 30 秒降到 5 秒以内，可以引入任何标准库但不能改函数签名"
```

**修复原则：** 把"我自己知道但没写"的信息都写进去。

---

## 坑 2：给了太多规则，AI 丢失重点

这个坑和坑 1 相反 —— 有人知道"要具体"之后，把所有想到的要求都塞进去：

```
❌ 
请写一篇文章，要求：专业、易懂、有趣、有深度、有数据支撑、
要有故事性、结构清晰、逻辑严密、不要太长也不要太短、
适合分享到朋友圈、同时也要适合专业读者、中英文都要有、
要有配图建议、结尾要有金句...
```

研究表明，LLM 在超过 3000 token 的指令下推理能力开始下降。更重要的是，**相互矛盾的要求**（"适合朋友圈"vs"适合专业读者"，"不太长"vs"有深度"）会让 AI 无法决策。

```
✅ 写一篇面向产品经理的 AI 工具推荐文章
   - 1200 字，微信公众号风格
   - 推荐 3 个工具，每个说清楚：它解决什么问题、有哪些坑
   - 不需要专业技术背景就能读懂
```

**修复原则：** 选出最重要的 3-5 个要求，砍掉其余的。

---

## 坑 3：忘记告诉 AI "不要做什么"

AI 有填充冲动 —— 当它不确定时，倾向于输出看起来完整的内容，哪怕你没要求。

```python
# ❌ 常见结果：AI 生成了代码 + 大段解释 + "以下是代码" 的前言 + "希望这对你有帮助" 的结尾
prompt = "用 Python 写一个快速排序函数"

# ✅ 加上否定约束
prompt = """
用 Python 写一个快速排序函数。
只输出代码，不要解释，不要注释，不要示例调用。
"""
```

常用的否定约束：
- "不要解释代码"
- "不要加前言和结尾客套话"
- "不要猜测缺失的信息，直接告诉我你需要什么"
- "不要改动我没有提到的部分"

---

## 坑 4：把模型当神，不验证输出

```python
# ❌ 危险做法：直接用 AI 的输出
result = llm.generate("提取这段合同里的金额，返回数字")
amount = float(result)  # 如果 AI 输出 "金额为 50 万元" 而不是 "500000"，直接崩溃

# ✅ 在 Prompt 里限定格式 + 代码里做验证
result = llm.generate("""
提取合同金额，只输出阿拉伯数字（单位：元），例如：500000
不要输出任何其他文字
""")

try:
    amount = float(result.strip())
except ValueError:
    # 让 AI 重试，或者 fallback 到人工处理
    raise ValueError(f"AI 输出格式不符合预期: {result}")
```

**规则：** 生产环境里永远不要假设 AI 的输出格式是正确的。

---

## 坑 5：不同模型用同一套 Prompt

2026 年主流模型有明显的"个性差异"，同一个 Prompt 在不同模型上效果差距很大：

| 模型 | 最佳结构 | 特点 |
|------|---------|------|
| **Claude** | XML 标签 | 对指令字面意思很忠实，不乱加 |
| **GPT-4o** | 自然语言 + Markdown | 善于补全意图，有时过度发挥 |
| **Gemini 2.5** | 结构化 JSON 或 Markdown | 擅长多模态、长文档 |

```python
# ❌ 同一套 Prompt 跑所有模型
PROMPT = "你是一个代码审查专家，请审查以下代码..."

# ✅ 针对模型适配
CLAUDE_PROMPT = """
<role>代码审查专家</role>
<task>审查以下代码的安全性</task>
<code>{code}</code>
"""

GPT_PROMPT = """
你是一个代码审查专家。
请审查以下代码的安全性，列出所有潜在的 SQL 注入、XSS 和权限绕过风险。

代码：
{code}
"""
```

**建议：** 针对主力模型优化 Prompt，换模型时做 A/B 测试。

---

## 坑 6：单次对话塞太多任务

```
❌ "帮我：1. 分析这 5 篇文章的主题 2. 找出共同观点 3. 写一篇综合摘要 
   4. 翻译成英文 5. 给出 10 个 SEO 关键词"

→ AI 会完成所有步骤，但每步质量都打折扣
→ 最容易出问题的是第一步：如果分析错了，后面全错
```

拆成 Prompt Chain：

```python
# Step 1: 分析每篇文章
articles_analysis = [
    analyze_article(article) for article in articles
]

# Step 2: 综合分析（用上一步的输出）
synthesis = find_common_themes(articles_analysis)

# Step 3: 写摘要
summary = write_summary(synthesis)

# Step 4: 翻译（独立任务）
english_summary = translate(summary, target="en")

# Step 5: SEO 关键词（基于最终稿）
keywords = extract_keywords(english_summary)
```

每步可以验证、可以重试，错误不会级联传播。

---

## 坑 7：Prompt 写死了，没法迭代

```python
# ❌ Prompt 硬编码在业务逻辑里，分散在代码各处
def process_resume(text):
    response = llm.generate(f"分析这份简历：{text}，给出评分")
    ...

def write_report(data):
    response = llm.generate(f"根据 {data} 写一份报告，要专业")
    ...
```

当你需要改 Prompt，得翻遍整个代码库。生产环境的正确做法：

```python
# ✅ Prompt 集中管理，版本化
# prompts/v2/resume_analysis.txt
"""
<task>简历分析</task>
<criteria>技术匹配度、经验年限、项目质量</criteria>
<resume>{resume_text}</resume>
<output>JSON，包含 score(0-100)、strengths(list)、gaps(list)</output>
"""

# prompts/loader.py
def load_prompt(name: str, version: str = "latest") -> str:
    return Path(f"prompts/{version}/{name}.txt").read_text()

# 业务代码
def process_resume(text):
    prompt = load_prompt("resume_analysis").format(resume_text=text)
    response = llm.generate(prompt)
    ...
```

把 Prompt 当配置管理，不当代码的一部分。可以随时 A/B 测试不同版本。

---

## 坑 8：用激烈措辞"威胁"AI

这个坑专门针对 Claude：

```
❌ "YOU MUST follow these rules EXACTLY! NEVER deviate! 
   This is CRITICAL and EXTREMELY IMPORTANT!!!"

→ 效果反而更差：Claude 3.x+ 对过激语言会产生防御性反应，
  更容易过度谨慎或者添加大量免责声明
```

Claude 的训练目标是"有帮助、无害、诚实"。当你用威胁性语言，模型会把你的请求当成高风险信号，触发更多内部审查。

```
✅ "请严格按照以下格式输出，这对下游处理很重要："
   → 平静说明原因，比感叹号更有效

✅ "如果输入不符合预期，直接返回 {\"error\": \"invalid input\"}，不要猜测"
   → 告诉 AI 该怎么处理边界情况，而不是威胁它不要犯错
```

---

## 快速诊断清单

在提交 Prompt 之前，过一遍这 8 个问题：

- [ ] 任务足够具体？（坑1）
- [ ] 要求不超过 5 条，没有矛盾？（坑2）
- [ ] 写了"不要做什么"？（坑3）
- [ ] 输出格式有明确约束 + 代码端有验证？（坑4）
- [ ] 针对目标模型优化了结构？（坑5）
- [ ] 复杂任务拆成多步？（坑6）
- [ ] Prompt 集中管理，不硬编码？（坑7）
- [ ] 没有使用激烈/威胁性语言？（坑8，主要针对 Claude）

全部打勾，Prompt 质量至少在及格线以上。
