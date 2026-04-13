---
title: "Sub-agent 并行执行：让多个 Claude 同时干活"
wiki: "claude-code-guide"
order: 8
description: "用 sub-agent 把大任务拆成子任务并行执行，效率翻倍"
---

## 什么是 Sub-agent

Claude Code 可以派出多个 sub-agent（子代理）同时处理不同的子任务。主 agent 拆分任务、收集产出，sub-agent 各自独立工作，互不干扰。

举个例子，你说：

```
> 重构整个 auth 模块：把 session-based 改成 JWT，同时更新所有相关的测试和文档
```

Claude Code 可能会这样拆分：

1. **Agent A**：修改 `src/services/auth.ts` 的实现
2. **Agent B**：更新 `tests/auth.test.ts` 的测试用例
3. **Agent C**：更新 `docs/auth.md` 的文档

三个 agent 并行执行，完成后主 agent 汇总检查，确认没有冲突。

![Sub-agent 并行执行架构](https://code.claude.com/images/subagents-architecture.png)

## 触发并行执行

不需要特殊语法，Claude Code 会自动判断哪些任务可以并行。不过你可以显式提示：

```
> 同时做这三件事：
> 1. 给 src/utils/ 下所有函数加 JSDoc 注释
> 2. 检查 src/components/ 下有没有未使用的 import
> 3. 把 src/styles/ 里的 px 单位换成 rem
```

Claude Code 识别到三个任务互不依赖，会派三个 sub-agent 并行处理。

## worktree 隔离模式

当 sub-agent 需要修改文件时，Claude Code 可以用 git worktree 做隔离。每个 sub-agent 在独立的 worktree 里工作，改完后合并回主分支。

这避免了多个 agent 同时改同一个文件导致冲突的问题。类似于多人协作时各自开分支开发。

```
Agent A → worktree: /tmp/claude-worktree-a/ (改 auth 模块)
Agent B → worktree: /tmp/claude-worktree-b/ (改测试文件)
Agent C → 主 worktree (改文档，不涉及代码冲突)
```

## 用 Agent SDK 自定义编排

如果你需要更精细的控制，可以用 Claude Code 的 Agent SDK 编写自定义的编排逻辑：

```typescript
import { Agent } from '@anthropic-ai/claude-code';

const codeReviewer = new Agent({
  name: 'code-reviewer',
  prompt: '审查代码质量，检查安全问题和性能问题',
  tools: ['Read', 'Grep', 'Glob'],  // 只读权限，不能改文件
});

const testWriter = new Agent({
  name: 'test-writer',
  prompt: '为缺少测试的函数编写单元测试',
  tools: ['Read', 'Write', 'Bash'],  // 可以写文件和跑命令
});

// 并行执行两个 agent
const [reviewResult, testResult] = await Promise.all([
  codeReviewer.run('审查 src/services/ 目录'),
  testWriter.run('给 src/utils/date.ts 写测试'),
]);
```

每个 agent 可以独立配置可用工具（tools）和权限范围，确保安全边界。

## 适合用 sub-agent 的场景

| 场景 | 效果 |
|------|------|
| 跨模块重构 | 多个模块同时改，效率提升 2-3x |
| 批量代码审查 | 多个文件同时 review |
| 测试 + 文档同步 | 改代码的同时更新测试和文档 |
| 多语言翻译 | 同时生成多个语言的翻译文件 |

不适合的场景：任务有前后依赖关系（比如先建表再写 API），这种情况 Claude Code 会自动按顺序执行，不会强行并行。
