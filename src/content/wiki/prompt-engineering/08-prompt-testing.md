---
title: "Prompt 调试与评估：用数据衡量 Prompt 质量"
wiki: "prompt-engineering"
order: 8
description: "Prompt 写完不算完，要测、要量化、要迭代。本章讲如何搭建评估流水线，用 eval 数据集对比不同版本 Prompt 的效果"
---

![Prompt 评估流水线](https://docs.anthropic.com/images/prompt-evaluation.png)

## Prompt 不是写一次就完的

写代码有单元测试，写 Prompt 也需要测试。区别在于 AI 的输出不是二进制对错，而是一个"质量谱" —— 同一个 Prompt 跑 10 次可能出 8 次好结果、2 次差结果。

Prompt 调试的核心问题：**怎么知道改了之后是变好了还是变差了？** 靠感觉不行，需要 eval（评估）。

---

## 搭建 Eval 数据集

Eval 数据集就是一组"输入 + 期望输出"的测试用例。至少 20 条，覆盖核心场景和边界情况：

```python
EVAL_DATASET = [
    {
        "input": "用 Python 写一个二分查找",
        "expected_keywords": ["def binary_search", "left", "right", "mid"],
        "expected_not": ["import numpy", "递归"],  # 不该出现的内容
        "category": "code_generation"
    },
    {
        "input": "这段代码有什么 bug？\ndef add(a, b): return a - b",
        "expected_keywords": ["减法", "a + b", "bug"],
        "category": "code_review"
    },
    {
        "input": "用一句话解释什么是 REST API",
        "max_length": 100,  # 不超过 100 字
        "category": "explanation"
    },
]
```

数据集的黄金法则：**先从生产环境里收集真实的失败案例**，不要自己编。用户实际踩过的坑比你想象的边界情况更有价值。

---

## 自动化评估脚本

```python
import anthropic
import json

client = anthropic.Anthropic()

def run_eval(prompt_template: str, dataset: list[dict]) -> dict:
    results = {"pass": 0, "fail": 0, "details": []}

    for case in dataset:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            temperature=0,
            messages=[{"role": "user", "content": prompt_template.format(input=case["input"])}],
        )
        output = response.content[0].text

        # 检查关键词命中
        passed = True
        reasons = []

        for kw in case.get("expected_keywords", []):
            if kw.lower() not in output.lower():
                passed = False
                reasons.append(f"缺少关键词: {kw}")

        for kw in case.get("expected_not", []):
            if kw.lower() in output.lower():
                passed = False
                reasons.append(f"包含禁止内容: {kw}")

        if "max_length" in case and len(output) > case["max_length"]:
            passed = False
            reasons.append(f"超长: {len(output)} > {case['max_length']}")

        results["pass" if passed else "fail"] += 1
        results["details"].append({
            "input": case["input"][:50],
            "passed": passed,
            "reasons": reasons
        })

    results["score"] = results["pass"] / len(dataset) * 100
    return results
```

跑两个版本的 Prompt，对比 score：

```python
v1_score = run_eval(PROMPT_V1, EVAL_DATASET)
v2_score = run_eval(PROMPT_V2, EVAL_DATASET)

print(f"V1: {v1_score['score']:.0f}%  V2: {v2_score['score']:.0f}%")
# V1: 75%  V2: 90% → V2 上线
```

---

## LLM-as-Judge：用 AI 评估 AI

关键词匹配太粗糙？用另一个模型当评委，打分更细腻：

```python
JUDGE_PROMPT = """
评估以下 AI 回答的质量，从 1-5 分打分：

<criteria>
- 准确性：信息是否正确（2分）
- 完整性：是否覆盖了关键点（1.5分）
- 简洁性：是否有废话或冗余（1分）
- 格式：是否符合要求（0.5分）
</criteria>

<question>{question}</question>
<answer>{answer}</answer>

严格按 JSON 输出：{{"score": 数字, "breakdown": {{"accuracy": 数字, "completeness": 数字, "conciseness": 数字, "format": 数字}}, "reason": "一句话"}}
"""

def llm_judge(question: str, answer: str) -> dict:
    response = client.messages.create(
        model="claude-opus-4-6",  # 用更强的模型当评委
        max_tokens=256,
        temperature=0,
        messages=[{"role": "user", "content": JUDGE_PROMPT.format(question=question, answer=answer)}],
    )
    return json.loads(response.content[0].text)
```

LLM-as-Judge 的局限：评委本身也可能犯错。重要决策建议**抽样 10% 做人工复核**，校准 AI 评委的偏差。

---

## Prompt 版本管理

生产环境的 Prompt 要像代码一样做版本管理：

```
prompts/
├── code_review/
│   ├── v1.txt          # 初版
│   ├── v2.txt          # 加了 XML 结构
│   ├── v3.txt          # 优化了 Few-shot 示例
│   └── eval_results.json  # 每个版本的测试分数
├── content_writer/
│   ├── v1.txt
│   └── v2.txt
└── run_eval.py         # 评估脚本
```

每次改 Prompt 之前先跑 eval，改完再跑。分数降了就回滚，分数升了才部署。这比"我觉得新版更好"靠谱得多。
