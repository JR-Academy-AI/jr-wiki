---
title: "Agentic Prompt 设计：让 AI 自主完成多步任务"
wiki: "prompt-engineering"
order: 7
description: "2026 年 AI Agent 已经是主流开发范式。本章讲如何用 ReAct、Reflection、工具调用等模式设计 Prompt，让 AI 像真正的自动化 Agent 一样工作"
---

## 单次 Prompt 和 Agentic Prompt 的区别

之前几章讲的都是"单次 Prompt"：你问一个问题，AI 给一个答案，结束。

**Agentic Prompt** 完全不同。你给 AI 一个目标，AI 自己规划步骤、调用工具、检查结果、纠正错误，直到完成任务。

```
单次模式：
用户 → [Prompt] → AI → 答案

Agentic 模式：
用户 → [目标] → AI → 规划 → 工具调用 → 观察结果 → 继续/调整 → ... → 最终答案
```

2026 年的主流 AI 开发框架（Claude Agents SDK、LangGraph、AutoGen）都是这个模式。理解 Agentic Prompt 设计，是从"会用 AI"到"会用 AI 做产品"的关键跨越。

---

## ReAct 模式：思考 → 行动 → 观察

ReAct 是 Agentic Prompt 的基础架构，全称 Reasoning + Acting。

核心结构：
```
Thought: 我需要先了解当前情况，然后决定下一步
Action: 调用工具 [tool_name]，参数是 [params]
Observation: 工具返回了 [result]
Thought: 根据结果，我需要...
Action: ...
... (循环直到完成)
Final Answer: [最终结果]
```

### 在 System Prompt 里定义 ReAct 框架

```python
import anthropic

REACT_SYSTEM_PROMPT = """你是一个自主执行任务的 AI Agent。

完成任务时，严格按照以下格式思考和行动：

Thought: [分析当前情况，决定下一步]
Action: [工具名称]
Action Input: [工具参数，JSON 格式]
Observation: [工具返回的结果]

（重复以上循环，直到任务完成）

Final Answer: [最终答案，面向用户，简洁清晰]

可用工具：
- search_web(query: str) → 搜索网络，返回摘要
- read_file(path: str) → 读取文件内容
- write_file(path: str, content: str) → 写入文件
- run_code(code: str, lang: str) → 执行代码，返回输出

规则：
1. 每次只执行一个 Action
2. 没有足够信息时，先用工具收集信息，不要猜测
3. 遇到错误，分析原因，调整策略重试
4. 不确定的地方，优先做验证再继续
"""

client = anthropic.Anthropic()

def run_agent(user_task: str):
    messages = [{"role": "user", "content": user_task}]
    
    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=REACT_SYSTEM_PROMPT,
            messages=messages,
        )
        
        text = response.content[0].text
        
        # 如果 AI 给出了最终答案，结束循环
        if "Final Answer:" in text:
            return text.split("Final Answer:")[-1].strip()
        
        # 否则解析 Action，执行工具，把结果加回上下文
        messages.append({"role": "assistant", "content": text})
        observation = execute_action(text)  # 你的工具执行逻辑
        messages.append({"role": "user", "content": f"Observation: {observation}"})
```

---

## 工具调用 Prompt：让 AI 知道何时用工具

工具调用（Function Calling / Tool Use）是 Agentic 系统的核心。写 Prompt 时，要让 AI 清楚知道：
1. 有哪些工具
2. 每个工具适合什么场景
3. 工具用不了时怎么办

### 工具定义：用 Claude Tools API

```python
tools = [
    {
        "name": "search_database",
        "description": """搜索产品数据库，返回匹配的产品列表。
        适用场景：用户询问产品信息、库存、价格时。
        不适用：用户问通用知识、公司政策、操作指南。""",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词，尽量具体（产品名/型号/类别）"
                },
                "max_results": {
                    "type": "integer",
                    "description": "返回结果数量，默认 5，最多 20",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_order_status",
        "description": """查询订单状态。
        适用场景：用户提供了订单号，询问物流/配送状态。
        不适用：没有订单号时不要调用此工具，先向用户索取。""",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "订单号，格式：ORD-XXXXXXXX"
                }
            },
            "required": ["order_id"]
        }
    }
]

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "我的订单 ORD-20260415001 到哪了？"}]
)

# 处理工具调用
if response.stop_reason == "tool_use":
    tool_use = next(b for b in response.content if b.type == "tool_use")
    tool_result = execute_tool(tool_use.name, tool_use.input)
    
    # 把工具结果发回，让 AI 生成最终回复
    messages = [
        {"role": "user", "content": "我的订单 ORD-20260415001 到哪了？"},
        {"role": "assistant", "content": response.content},
        {
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": str(tool_result)
            }]
        }
    ]
    final_response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages
    )
```

**工具描述的关键**：要写清楚**不适用**的场景。AI 不知道"这个工具什么时候不该用"，你不说清楚它就会乱调用。

---

## Reflection 模式：让 AI 自我审查

Reflection（反思）是让 AI 生成初稿 → 自我批评 → 改进输出的模式。研究表明，这个模式能把代码任务准确率从 80% 提升到 91%。

```python
REFLECTION_SYSTEM_PROMPT = """你是一个严格的代码审查专家。

工作流程：
1. 首先写出初版代码（用 <draft> 标签包裹）
2. 然后以审查者身份批评自己的代码（用 <critique> 标签），检查：
   - 是否有 bug 或边界情况遗漏
   - 性能是否有明显问题
   - 安全性问题（SQL 注入、XSS 等）
   - 代码是否符合任务要求
3. 根据批评，写出改进版（用 <final> 标签包裹）

示例格式：
<draft>
# 初版代码...
</draft>

<critique>
问题1：没有处理空输入的情况
问题2：循环里有 N+1 查询问题
</critique>

<final>
# 修改后的代码...
</final>
"""

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    system=REFLECTION_SYSTEM_PROMPT,
    messages=[{
        "role": "user",
        "content": "写一个 Python 函数，从 PostgreSQL 查询用户列表，支持分页和搜索"
    }]
)

# 提取最终版本
import re
final_code = re.search(r'<final>(.*?)</final>', response.content[0].text, re.DOTALL)
```

**什么时候用 Reflection**：
- 生成的代码会直接上生产（质量要求高）
- 复杂的分析报告（需要自我验证逻辑）
- 写作任务（让 AI 自己检查是否偏题）

**不适合 Reflection**：简单查询、格式转换等任务，加 Reflection 只是浪费 token。

---

## 规划 Prompt：让 AI 先做计划再执行

对于复杂任务，让 AI 先输出计划，你审查后再执行，比直接让它闷头干好得多：

```
你是一个软件开发 Agent。

任务：[用户描述的需求]

第一步，先输出你的执行计划，格式如下：

## 执行计划

### 理解
[用一句话说明你理解这个任务的目标是什么]

### 步骤
1. [步骤描述] — 预期结果：[你期望得到什么]
2. [步骤描述] — 预期结果：[你期望得到什么]
...

### 风险
[可能遇到的问题，以及你的应对策略]

### 需要确认的问题
[如果有信息缺失，在这里列出，不要猜测]

---
输出计划后，等待用户确认再开始执行。
```

这个模式的价值：**在 AI 开始做之前发现方向错误**。尤其是在 AI Agent 有权限操作数据库、发邮件、提交代码的场景，先看计划再确认，避免事后无法回滚的错误。

---

## 自我纠错 Prompt：处理工具失败和意外情况

真实的 Agentic 系统一定会遇到工具调用失败、输出格式不对、API 超时等情况。在 System Prompt 里预先定义错误处理行为：

```python
ERROR_HANDLING_PROMPT = """
遇到以下情况时，按对应策略处理：

**工具调用失败（网络错误/超时）**
→ 等待 2 秒后重试，最多重试 2 次
→ 两次都失败：告诉用户具体是什么工具失败了，建议手动操作

**工具返回了意外格式**
→ 不要假设数据结构，先用 Thought 记录你看到了什么
→ 尝试从返回值中提取你需要的信息
→ 如果确实无法解析，停下来向用户说明

**任务中途发现需要用户输入的信息**
→ 立即停下，明确列出你需要的信息，不要猜测或跳过
→ 格式：「继续任务需要以下信息：\n1. [信息名]：[用途]\n2. ...」

**发现任务可能有副作用（删除数据、发消息、扣钱等）**
→ 停下来描述你即将执行的操作和后果
→ 明确询问用户确认，不要自行判断"这应该是安全的"
"""
```

---

## 一个完整的 Agentic Agent 示例

把以上模式组合起来，一个实际可用的代码审查 Agent：

```python
import anthropic
import subprocess

client = anthropic.Anthropic()

tools = [
    {
        "name": "read_file",
        "description": "读取代码文件内容",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "文件路径"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "run_tests",
        "description": "运行测试套件，返回测试结果。只有当代码改动完成后才调用。",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_command": {"type": "string", "description": "测试命令，如 pytest tests/"}
            },
            "required": ["test_command"]
        }
    }
]

AGENT_SYSTEM = """你是一个代码审查 Agent。

任务流程：
1. 读取用户指定的文件
2. 分析代码质量：安全性、性能、可维护性
3. 如果有测试，运行测试验证现有功能
4. 输出审查报告

审查报告格式：
## 总体评分：X/10

## 严重问题（必须修复）
- [问题] → [修复建议 + 代码示例]

## 警告（建议修复）
- [问题] → [建议]

## 亮点
- [代码做得好的地方]

遇到工具调用失败，最多重试 1 次，失败后在报告里注明"[工具名] 调用失败，以下分析基于静态审查"。
"""

def execute_tool(name: str, inputs: dict) -> str:
    if name == "read_file":
        try:
            with open(inputs["path"]) as f:
                return f.read()
        except FileNotFoundError:
            return f"错误：文件 {inputs['path']} 不存在"
    elif name == "run_tests":
        result = subprocess.run(
            inputs["test_command"].split(),
            capture_output=True, text=True, timeout=60
        )
        return result.stdout + result.stderr

def code_review_agent(file_path: str):
    messages = [{"role": "user", "content": f"请审查 {file_path} 这个文件"}]
    
    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=AGENT_SYSTEM,
            tools=tools,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":
            return response.content[0].text
        
        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })
            messages.append({"role": "user", "content": tool_results})

# 使用
report = code_review_agent("src/api/auth.py")
print(report)
```

---

## Agentic Prompt 的三条核心原则

**1. 定义好边界，不要定义每一步**

好的 Agent System Prompt 告诉 AI 目标、工具、错误处理规则，但不把每一步都写死。写死了等于你在替 AI 思考，失去了 Agent 的意义。

**2. 让 AI 在不确定时停下来问，而不是猜**

```python
# 在 System Prompt 里加上这段
"""
当你需要做一个可能不可逆的操作，或者任务信息不完整时：
停下来，用 <clarification> 标签列出你需要的信息，等用户回复。
不要猜测，不要跳过，不要假设。
"""
```

**3. 给 AI 一个"放弃"的出口**

真实环境里有些任务 AI 无法完成（权限不够、信息缺失、超出能力范围）。要在 Prompt 里允许 AI 说"我做不了"：

```
如果你判断这个任务超出了你的能力范围，或者继续会有未知风险，
直接说：「这个任务我无法自主完成，原因是：[原因]，建议：[替代方案]」
不要强行完成一个你没有把握的任务。
```

没有这个出口，AI 会在卡住时乱猜，产生你不可预知的结果。
