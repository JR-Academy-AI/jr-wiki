---
title: "核心功能深度解析"
wiki: "openhands-guide"
order: 3
description: "CodeAct Agent 工作原理、事件流架构、终端/浏览器/文件编辑能力、GitHub 自动修 Issue、上下文压缩机制"
---

## CodeAct Agent：OpenHands 的大脑

OpenHands 的默认 Agent 叫 **CodeAct**——它通过 function calling 和环境交互。每一步它可以做四件事：

1. **对话** — 问你问题或汇报进度
2. **跑命令** — 在 Docker 沙箱里执行 bash
3. **编辑文件** — 创建、修改、删除代码
4. **操作浏览器** — 打开网页、点击按钮、填表单

这不是简单的"生成代码然后粘贴"。它是一个真正的 Agent Loop：

```
你的指令 → Agent 思考 → 执行 Action → 观察结果 → 继续思考 → 下一个 Action → ... → 完成
```

![OpenHands 终端执行界面](https://raw.githubusercontent.com/OpenHands/docs/main/openhands/static/img/terminal-tab.png)

## 五大核心能力

### 1. 终端执行（CmdRunAction）

OpenHands 有完整的 bash 终端访问权限——在 Docker 沙箱里。这意味着它可以：

```bash
# 安装依赖
npm install express zod

# 跑测试
pytest tests/ -v

# 查看日志
tail -f /var/log/app.log

# Git 操作
git checkout -b feature/add-auth
git add . && git commit -m "feat: add JWT authentication"
```

它跑完命令会看到输出，报错了会自动分析原因并尝试修复。这个"跑→看→修"的循环是它能自主解决复杂问题的关键。

### 2. 文件编辑（FileEditAction）

不是生成整个文件然后覆盖——OpenHands 做的是精确编辑。它能定位到具体行号，做最小化修改：

```python
# Agent 的编辑操作示例（你不需要写这些，它自己做）
FileEditAction(
    path="src/auth/middleware.py",
    command="str_replace",
    old_str="def verify_token(token):",
    new_str="def verify_token(token: str) -> dict:"
)
```

改完文件后它会验证语法正确，能跑通。

### 3. 浏览器自动化（BrowseURLAction）

这是 OpenHands 独有的能力——大多数编码工具做不到。Agent 可以：
- 打开文档页面查 API 用法
- 访问你的本地开发服务器验证功能
- 在网页上填表单测试 UI
- 截图看渲染效果

```python
# Agent 内部执行（自动进行）
BrowseURLAction(url="http://localhost:3000/api/health")
# → Observation: {"status": "ok", "timestamp": 1714600000}
```

### 4. Jupyter/Python 执行（IPythonRunCellAction）

需要做数据分析、跑 Python 脚本、测试算法？Agent 有内置的 IPython 环境：

```python
import pandas as pd
df = pd.read_csv("data/users.csv")
print(f"Total users: {len(df)}")
print(f"Active users: {len(df[df['status'] == 'active'])}")
```

适合数据处理、快速验证逻辑、调试 Python 代码。

### 5. GitHub 自动修 Issue（Resolver）

这是实际生产中最实用的功能。设置一次，之后给 Issue 加个标签就能自动修：

```yaml
# .github/workflows/openhands-resolver.yml
name: OpenHands Issue Resolver
on:
  issues:
    types: [labeled]
  issue_comment:
    types: [created]

jobs:
  resolve:
    if: github.event.label.name == 'fix-me' ||
        contains(github.event.comment.body, '@openhands-agent')
    runs-on: ubuntu-latest
    steps:
      - uses: All-Hands-AI/openhands-resolver@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          llm-api-key: ${{ secrets.LLM_API_KEY }}
          llm-model: anthropic/claude-sonnet-4-20250514
```

工作流：
1. 团队成员发现 bug → 创建 Issue 描述问题
2. 加上 `fix-me` 标签
3. OpenHands 自动阅读 Issue、分析代码、写修复
4. 提交 Draft PR
5. 人工 Review → Merge

## 上下文压缩（Condenser）

长任务对话会很快撑爆 token 窗口。OpenHands 的 Condenser 机制解决这个问题：

```toml
# config.toml
[condenser]
type = "llm"           # 用 LLM 总结历史
max_size = 80          # 超过 80 条事件触发压缩
```

| 压缩策略 | 说明 | 适合场景 |
|---------|------|---------|
| `noop` | 不压缩 | 短任务 |
| `observation_masking` | 隐藏旧的输出 | 中等任务 |
| `recent` | 只保留最近 N 条 | 快速但会忘记早期上下文 |
| `llm` | 用便宜模型总结中间历史 | 长任务（推荐） |
| `amortized` | 分摊压缩，边跑边压 | 超长任务 |

## 卡住检测

Agent 重复做同样的操作超过 4 次？系统会自动终止并报告，防止无限烧 token。你可以通过 `MAX_ITERATIONS` 设置硬上限：

```toml
[core]
max_iterations = 50    # 最多 50 步操作就停下
```

这在无人值守（headless/CI）场景下特别重要——不设上限的话，一个复杂 bug 可能让 Agent 死循环几十分钟。
