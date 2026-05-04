---
title: "常见问题、定价与选型建议"
wiki: "kiro-guide"
order: 5
description: "Kiro 完整定价对比、已知问题与解决方案、到底适不适合你"
---

## 常见问题

### Spec 太繁琐了，简单改动也要走完整流程？

不用。Kiro 有两种模式：

![Kiro 实战演示](https://img.youtube.com/vi/7lxqNBevHc0/maxresdefault.jpg)

- **Spec-Driven**：走完整的 requirements → design → tasks 流程，适合新功能开发
- **直接 Chat**：跟其他 AI IDE 一样，直接在 Chat 里说"改这个 bug"，Agent 立刻干活

一行 CSS 修改、快速 bug fix、简单重构——直接 Chat 就行，别浪费时间写 spec。spec 留给涉及多文件、需要设计决策、多人协作的功能。

```bash
# 判断要不要写 Spec 的决策树：
# 1. 改动超过 3 个文件？ → Spec
# 2. 需要新增 API 或数据模型？ → Spec
# 3. 会影响其他人的代码？ → Spec
# 4. 以上都不是？ → 直接 Chat
```

### Credits 用得太快怎么办？

一个常见抱怨是 credits 一天就烧完了。省 credits 的方法：

1. **Spec 里把需求写清楚**——模糊的描述 Agent 会多次试错，浪费 credit
2. **用 Steering 文件**——避免每次对话重复描述技术栈和规范
3. **小改动用 Chat 不用 Spec**——spec 生成本身消耗 credits
4. **Autopilot 慎用**——自动模式下 Agent 可能多跑几步你不需要的操作

### 自动补全比 Cursor 差很多？

确实。Kiro 的自动补全功能目前弱于 Cursor 的 Tab 引擎。Cursor 能预测你下一步要编辑的位置，Kiro 还做不到。

如果你重度依赖实时补全写代码，Kiro 体验会比 Cursor 差。但如果你的工作流是"想清楚再写"——用 spec 规划好，然后让 Agent 整块生成——补全的重要性就没那么高了。

### VS Code 插件能用吗？

大部分能。Kiro 用 Open VSX 市场，社区维护的主流插件（ESLint、Prettier、GitLens、Thunder Client 等）都有。但微软独占的插件（比如官方 C# 扩展、Remote - SSH）可能缺失或需要用替代品。

### Agent 做错了怎么回滚？

Kiro 支持操作级回滚。在 Chat 面板里每步操作都有 `Revert` 按钮，点一下就恢复。Autopilot 模式下用 `View all changes` 查看完整 diff，可以整体 revert。

保底方案还是 Git：

```bash
# 查看 Agent 改了什么
git diff --stat

# 回滚单个文件
git checkout -- src/components/Login.tsx

# 回滚所有改动
git stash
```

## 完整定价（2026 年 5 月）

| 计划 | 月费 | Credits/月 | 适合谁 |
|------|------|-----------|--------|
| Free | $0 | 50 + 新用户 500 奖励 | 体验评估 |
| Pro | $20 | 1,000 | 个人开发者日常使用 |
| Pro+ | $40 | 2,000 | 高频使用 / 多项目并行 |
| Power | $200 | 10,000 | 团队 / 企业 / 全天候 Agent |

超额使用：$0.04/credit，默认关闭需手动开启，月底结算。

横向对比：

| IDE | 免费额度 | Pro 月费 | 核心区别 |
|-----|---------|---------|---------|
| Kiro | 50 credits | $20 | Spec 驱动 + AWS 集成 |
| Cursor | 50 premium 请求 | $20 | 最快补全 + Background Agent |
| Windsurf | 有免费层 | $20 | 免费补全 + Cascade |
| Claude Code | 按 API 用量 | ~$20 (Max) | 终端 + 深度推理 |

## 已知坑与规避方法

| 问题 | 现象 | 解决 |
|------|------|------|
| 内存泄漏 | RAM 占用持续攀升到 80GB+ | 定期重启 Kiro，关注 GitHub Issue #7709 更新 |
| 高峰期卡顿 | "model experiencing high volume of traffic" | 避开北美工作时间（UTC 14:00-22:00），或等几分钟重试 |
| WSL2 路径 | 生成 Windows 风格 UNC 路径 | 改用原生 Linux 或 macOS 开发 |
| 终端卡住 | Shell 定制化配置导致 "Working..." 不动 | 在 settings 里把 shell 改为 `/bin/bash` 或 `/bin/zsh` 纯净版 |
| Hook 冲突 | 多个 Hook 匹配同一个文件 | 当前每次保存只触发一个 Hook，用 `filePatterns` 精确控制范围 |

## 到底适不适合你？

### 强烈推荐 Kiro 的场景

- 你的团队超过 3 人，需要需求对齐和文档化
- 你大量使用 AWS 服务（Lambda、CDK、DynamoDB）
- 你做 to-B 产品，客户要求需求可追溯
- 你受够了 AI Agent "想到哪写到哪"的随机性

### 可能不适合的场景

- 你是独立开发者，追求写代码的手感和速度
- 你不用 AWS（Kiro 的 AWS 集成优势浪费了）
- 你需要极强的实时补全（Cursor 目前更好）
- 你习惯终端工作流（Claude Code 更适合）

### 组合使用的最佳方案

```bash
# 方案 A：Kiro + Claude Code
# Kiro 负责 spec 和功能开发，Claude Code 负责大型重构和代码审查

# 方案 B：Kiro + Cursor
# Kiro 做新功能的 spec 规划，Cursor 做日常编码和 debug

# 方案 C：全 Kiro
# 团队统一用 Kiro，spec 当需求文档，Steering 当编码规范
# 适合已经在 AWS 生态的团队
```

Kiro 不是"最好的 AI IDE"，而是"最有结构的 AI IDE"。如果你觉得现在的 AI 编程工具太随意、产出不可控，Kiro 的 spec 工作流是目前最好的解药。
