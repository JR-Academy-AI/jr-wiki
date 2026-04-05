---
title: "Hooks 自动化：让 Claude Code 在对的时机干对的事"
wiki: "claude-code-guide"
order: 4
description: "用 Hooks 在 Claude Code 执行动作前后自动触发脚本，实现代码格式化、测试、安全检查全自动化"
---

## 什么是 Hooks

Hooks 是 2026 年初发布的功能，让你在 Claude Code 执行特定动作**前后**自动触发自定义脚本。

Claude Code 改了文件？自动跑 lint。  
Claude Code 要写某个敏感文件？先问你要不要允许。

配置在 `~/.claude/settings.json`（全局）或 `.claude/settings.json`（项目级）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_TOOL_INPUT_FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

## 两种 Hook 时机

| 时机 | 触发点 | 能否阻止操作 | 典型用途 |
|------|--------|------------|---------|
| **PreToolUse** | Claude **要执行**某操作之前 | ✅ 可以 | 安全门控、保护文件、强制审批 |
| **PostToolUse** | Claude **执行完**某操作之后 | ❌ 不能（已完成） | 格式化、跑测试、发通知 |

## 实战 1：改完代码自动格式化

每次 Claude Code 写文件，自动跑 Prettier：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_TOOL_INPUT_FILE_PATH 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

`$CLAUDE_TOOL_INPUT_FILE_PATH` 是 Claude Code 自动注入的环境变量，值是本次操作的文件路径。

## 实战 2：提交前自动跑测试

PreToolUse 拦截 Bash 命令，凡是含 `git commit` 的先跑测试：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/pre-commit-check.sh"
          }
        ]
      }
    ]
  }
}
```

`~/.claude/hooks/pre-commit-check.sh`：

```bash
#!/bin/bash
# 读取 Claude Code 传入的 JSON，判断是否是 git commit 命令
input=$(cat)
command=$(echo "$input" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('command',''))")

if echo "$command" | grep -q "git commit"; then
  echo "检测到 git commit，先跑测试..."
  npm test
  if [ $? -ne 0 ]; then
    echo "测试失败，阻止提交" >&2
    exit 1  # 非零退出码 = 阻止 Claude Code 继续执行
  fi
fi
```

退出码非零 → PreToolUse Hook 阻止 Claude Code 执行后续操作。这是唯一能"拦截"的时机。

## 实战 3：保护 .env 文件不被改动

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"\nimport json, sys\nd = json.load(sys.stdin)\npath = d.get('file_path', '')\nif '.env' in path and '.env.' not in path:\n    print(f'拒绝修改敏感文件: {path}', file=sys.stderr)\n    sys.exit(1)\n\""
          }
        ]
      }
    ]
  }
}
```

## Hook 脚本收到的 JSON 格式

Claude Code 通过 stdin 传入上下文，你可以读取：

```python
import json, sys

data = json.load(sys.stdin)
print(data.keys())
# 常见字段:
# - tool_name: "Write" / "Edit" / "Bash" / ...
# - file_path: 操作的文件路径
# - command: Bash 执行的命令
# - session_id: 当前会话 ID
```

## 常见坑

**坑 1：PostToolUse 里用了退出码 1 试图阻止操作**  
→ 不行。PostToolUse 已经执行完，退出码只影响 Claude Code 是否报错，不能撤销操作。

**坑 2：Hook 脚本没有可执行权限**  
```bash
chmod +x ~/.claude/hooks/your-hook.sh
```

**坑 3：matcher 写错，Hook 没触发**  
matcher 是正则表达式，工具名包括：`Write`、`Edit`、`Bash`、`Read`、`Glob`、`Grep`、`Agent`。  
用 `"matcher": "Write|Edit"` 匹配写操作，`"matcher": ".*"` 匹配所有工具。

## 推荐的项目级配置

在项目 `.claude/settings.json` 放这个，团队所有人共享：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "npx prettier --write $CLAUDE_TOOL_INPUT_FILE_PATH 2>/dev/null || true" },
          { "type": "command", "command": "npx eslint --fix $CLAUDE_TOOL_INPUT_FILE_PATH 2>/dev/null || true" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/protect-sensitive-files.js" }
        ]
      }
    ]
  }
}
```

一旦配置好，Claude Code 做任何修改都会自动走你团队的质量门控，不需要每次提醒它。
