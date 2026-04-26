---
title: "Workflow DSL 实战：5 个可直接导入的生产级模板"
wiki: "dify-guide"
order: 8
description: "Dify Workflow 的 DSL 导入导出机制详解，附 5 个生产环境验证过的 Workflow 模板——客服分流、内容审核、数据清洗、研究报告、多语言翻译"
---

Dify 的 Workflow 支持 DSL（Domain Specific Language）格式导入导出——你可以把别人搭好的工作流下载下来一键导入，也可以把自己的工作流分享给团队。这章给 5 个经过生产验证的模板，直接导入就能用。

![Dify Workflow 编辑画布](https://raw.githubusercontent.com/langgenius/dify/main/images/GitHub_README_if.png)

## DSL 是什么

DSL 是 Dify 定义的 YAML 格式标准，一个 `.yml` 文件包含完整的应用配置：节点拓扑、模型参数、变量定义、Prompt 模板。

导出不包含敏感信息（API Key、数据库密码），导入后需要重新配。

**导出**：应用编排页面 → 左上角菜单 → Export DSL
**导入**：Studio → Import DSL File → 选 `.yml` 文件

也可以通过 API 批量操作：

```bash
# 导出所有应用的 DSL
curl -s "http://localhost/v1/apps" \
  -H "Authorization: Bearer ${CONSOLE_API_KEY}" \
  | python3 -c "
import sys, json, requests
apps = json.load(sys.stdin)['data']
for app in apps:
    dsl = requests.get(f'http://localhost/v1/apps/{app[\"id\"]}/export',
        headers={'Authorization': f'Bearer ${CONSOLE_API_KEY}'})
    with open(f'{app[\"name\"]}.yml', 'w') as f:
        f.write(dsl.text)
    print(f'Exported: {app[\"name\"]}')
"
```

## 模板 1：智能客服分流

用户消息进来先分类意图，不同意图走不同处理分支：

```
Start
  → LLM (Question Classifier)
    → [产品咨询]  → Knowledge Retrieval → LLM (回答) → Answer
    → [退换货]    → HTTP Request (查订单API) → LLM (组织回复) → Answer
    → [投诉/紧急] → Human Input (转人工) → Answer
    → [闲聊]      → LLM (闲聊回复) → Answer
```

Question Classifier 的 Prompt 核心：

```text
你是一个意图分类器。根据用户消息判断属于以下哪个类别：
1. 产品咨询 — 关于产品功能、价格、规格的问题
2. 退换货 — 退货、换货、退款相关
3. 投诉/紧急 — 用户情绪负面或要求升级处理
4. 闲聊 — 打招呼、闲聊、与业务无关

只输出类别编号，不要输出其他内容。
```

Question Classifier 节点可以直接输出分支标签，Dify 根据输出自动走对应分支——不需要自己写 If/Else 判断。

## 模板 2：内容审核管道

UGC 平台用——用户提交内容后自动审核，通过的直接发布，不通过的标记原因：

```yaml
# DSL 核心结构（简化版）
app:
  name: 内容审核管道
  mode: workflow
graph:
  nodes:
    - id: start
      type: start
      data:
        variables:
          - name: content
            type: string
            required: true
    - id: check_sensitive
      type: llm
      data:
        model:
          provider: openai
          name: gpt-4o-mini    # 审核用便宜模型就够
        prompt_template: |
          审核以下用户内容，检查是否包含：
          1. 色情/暴力
          2. 政治敏感
          3. 广告/垃圾信息
          4. 个人隐私泄露

          内容：{{content}}

          输出 JSON：{"pass": true/false, "reason": "...", "category": "..."}
    - id: parse_result
      type: code
      data:
        code: |
          import json
          result = json.loads(arg1)
          return {"pass": result["pass"], "reason": result.get("reason", "")}
    - id: branch
      type: if_else
      data:
        conditions:
          - variable: "{{parse_result.pass}}"
            comparison: "is"
            value: "true"
    - id: publish
      type: http_request
      data:
        method: POST
        url: "https://api.internal/content/publish"
    - id: flag
      type: http_request
      data:
        method: POST
        url: "https://api.internal/content/flag"
```

用 `gpt-4o-mini` 做审核——成本是 GPT-4o 的 1/30，审核这种分类任务精度差距不大。每条审核成本不到 ¥0.001。

## 模板 3：结构化数据清洗

把非结构化文本（邮件、客户反馈、聊天记录）批量转成结构化 JSON：

```python
# 用 Dify Workflow API 批量跑
import requests, json, csv

API_KEY = "app-xxxxxxxxxxxx"
BASE = "http://localhost/v1"

with open("raw_feedback.csv") as f:
    reader = csv.DictReader(f)
    results = []
    for row in reader:
        resp = requests.post(f"{BASE}/workflows/run",
            headers={"Authorization": f"Bearer {API_KEY}",
                     "Content-Type": "application/json"},
            json={
                "inputs": {"raw_text": row["feedback"]},
                "user": "batch-processor",
                "response_mode": "blocking",
            })
        output = resp.json()["data"]["outputs"]
        results.append(output)

with open("structured_feedback.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
```

Workflow 里的 LLM 节点 Prompt 让模型输出固定 JSON schema：

```text
从以下客户反馈中提取结构化信息，严格按 JSON 格式输出：
{
  "sentiment": "positive|neutral|negative",
  "product": "提到的产品名",
  "issue_type": "bug|feature_request|complaint|praise",
  "summary": "一句话摘要",
  "priority": "high|medium|low"
}

反馈原文：{{raw_text}}
```

## 模板 4：Deep Research 报告生成

给一个主题，自动搜索 → 筛选 → 摘要 → 合成完整报告：

```
Start (输入: research_topic)
  → LLM (生成 5 个搜索关键词)
    → Iteration (遍历关键词)
      → Google Search Tool (搜索)
      → LLM (评估相关性 + 提取要点)
    → LLM (合并所有要点，生成大纲)
      → LLM (按大纲逐段扩写)
        → Template (Jinja2 拼装最终报告)
          → Answer
```

Iteration 节点是关键——它对数组的每个元素重复执行一段子流程。5 个关键词 × 每个搜索 3 条结果 = 15 条信息源，足够写一篇 2000 字的调研报告。

整个流程 30-60 秒跑完。手动做同样的事至少 2 小时。

## 模板 5：多语言翻译 + 质检

```
Start (输入: source_text, source_lang, target_langs[])
  → Iteration (遍历 target_langs)
    → LLM (翻译)
    → LLM (质检: 检查术语一致性、语法、文化适配)
    → If/Else (质检通过?)
      → [通过] → 收集结果
      → [不通过] → LLM (修正) → 收集结果
  → Template (汇总所有语言版本)
    → Answer
```

质检 LLM 的 Prompt 要给清楚标准：

```text
你是专业翻译质检员。检查以下翻译是否存在问题：

原文（{{source_lang}}）：{{source_text}}
译文（{{target_lang}}）：{{translated_text}}

检查项：
1. 关键术语翻译是否准确（技术术语不要意译）
2. 数字、日期、单位是否正确转换
3. 语法是否通顺
4. 是否存在文化不适配的表达

输出 JSON：{"pass": true/false, "issues": ["问题1", "问题2"]}
```

## 社区模板去哪找

[Awesome-Dify-Workflow](https://github.com/svcvit/Awesome-Dify-Workflow) 维护了 100+ 社区贡献的 DSL 模板，按场景分类。复制 DSL 文件的 Raw URL，在 Dify 里选"Import from URL"直接导入。

实际使用中的建议：**先导入跑通，再改 Prompt 适配你的业务场景**——别从零搭，站在社区的肩膀上。
