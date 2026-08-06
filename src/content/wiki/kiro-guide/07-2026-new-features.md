---
title: "2026 新功能速递：Tangents、Opus 5、Cloud Automations"
wiki: "kiro-guide"
order: 7
description: "Kiro 2026 年重要更新：Tangents 分支对话、Claude Opus 5 接入、Pro Max 计划、Cloud Automations 自动 PR、MCP OAuth 改进"
---

## 概览：Kiro 2026 的演进方向

Kiro 从 2025 年 11 月 GA 到 2026 年，每月都有迭代。整体方向是三条线：

1. **更强的模型支持**——接入更强的 Claude，让 Spec-Driven 能处理更复杂的任务
2. **更灵活的对话体验**——Tangents 让上下文管理更直观
3. **更自治的后台工作**——Cloud Automations 和 Kiro Crew 让 Agent 在你不在时继续工作

---

## Tangents：分支对话，不再怕跑偏

**2026 年 Q2 上线**

最常见的 AI 编程痛点之一：对话进行到一半，你想探索一个备选方案，但切换一次就丢了之前的上下文。

Tangents 解决这个问题——像 Git 分支一样开辟**侧支对话**：

```bash
# 在主对话里，想探索一个备选方案：
/tangent oauth-alternative
# → 创建名为 "oauth-alternative" 的 Tangent，继承当前完整对话历史

# 在 Tangent 里随意探索，主对话完全不受影响
# 探索完：
/tangent root
# → 一键跳回主对话，Tangent 里的内容保留，随时可以回去看

# 查看所有 Tangent：
/tangent ls
# 输出可视化对话树，每个分支都有标签
```

**使用场景**：

- 主方案用 PostgreSQL，想顺手评估一下 DynamoDB 能不能做
- 当前 spec 实现了 80%，想快速验证一个"如果换 GraphQL"的可行性
- Team Lead 让你看某个功能，你对某个细节好奇，开个 Tangent 深挖，主线不丢

Tangents 存在于整个 session 周期，不会自动清理。一个复杂功能开发完，你会有一棵完整的"决策树"，记录了你考虑过的每个方向。

---

## /context：上下文窗口可视化

随 Tangents 一起上线的还有 `/context` 命令的改进——新增**按工具分类的 token 用量明细**：

```
/context

上下文用量：42,340 / 200,000 tokens（21%）

按来源分：
  对话历史          18,200 tokens
  Steering 文件      3,100 tokens
  Knowledge Base     8,400 tokens
  附件（2 个 PDF）  12,640 tokens

按工具分：
  kiro-spec          6,200 tokens
  aws-mcp-server     4,100 tokens
  supabase-power     2,800 tokens
```

知道是哪个 MCP 工具吃掉了大量 token，就知道该关掉哪个来节省 credit。特别是装了多个 Powers 的项目，这个明细非常实用。

---

## Claude Opus 5：更难的任务能搞定了

**2026 年 7 月上线**

Kiro 接入了 Claude Opus 5，覆盖 IDE、CLI、Web 三端：

```
Chat 面板右下角 → 点模型名 → 选 claude-opus-5
或 CLI：kiro chat --model claude-opus-5
```

相比之前的默认模型，Opus 5 在 Kiro 里的具体提升：

| 场景 | 之前 | Opus 5 之后 |
|------|------|------------|
| 复杂 Spec 生成 | 有时需求拆解不完整 | 更准确的 EARS 格式需求 |
| 多文件重构 | 偶尔前后不一致 | 更好的跨文件一致性 |
| Agent Hooks 逻辑 | 简单事件处理 | 能处理有依赖关系的 Hook 链 |
| 并行多 Agent 协调 | Kiro Crew 中偶有冲突 | 冲突明显减少 |

**什么时候用 Opus 5**：大型 Spec（10 个以上需求）、涉及多个 AWS 服务的架构、Kiro Crew 的 Team Lead 角色。

**什么时候用默认模型**：日常 Chat、小 bug fix、简单 Spec。Opus 5 每次交互消耗的 credit 更多，别把预算全烧在简单任务上。

---

## Pro Max 计划：高频用户的新选择

**2026 年 Q1 推出**

之前 Pro（$20/月，1000 credits）和 Power（$200/月，10,000 credits）之间差距太大。现在中间加了 **Pro Max**：

| 计划 | 月费 | Credits/月 | 适合谁 |
|------|------|-----------|--------|
| Free | $0 | 50（新用户奖励 500，14 天内用完） | 体验 |
| Pro | $20 | 1,000 | 个人日常 |
| Pro+ | $40 | 2,000 | 高频个人用户 |
| **Pro Max** | **$100** | **5,000** | 重度用户 / 小团队 |
| Power | $200 | 10,000 | 团队 / 全天候 Agent |

**超额费率**：$0.04/credit（默认关闭，需手动开启，月底结算）

**学生计划**：Kiro 有专门的学生优惠（`kiro.dev/students`），验证学生身份后有折扣，Australia 的学生用 `.edu.au` 邮箱申请。

**首次升级奖励**：从 Free 升到任何付费计划，首月给 $20 credit 抵扣（仅限 Google / GitHub 登录，不适用 AWS Identity Center）。

---

## Cloud Automations：让 Agent 定时帮你提 PR

**2026 年上半年上线的 Kiro Web 功能**

不需要 Kiro Crew 那么复杂的配置，Cloud Automations 是在 Kiro Web 界面直接设置定时任务：

```
Kiro Web → 左侧 Automations → New Automation

1. 给任务起名：Daily dependency check
2. 选仓库：my-org/backend（支持 GitHub 和 GitLab）
3. 描述任务：Check for outdated npm packages, update minor versions, run tests
4. 设置频率：每周一 09:00 AEST
5. 保存 → 完成
```

每次触发时，Kiro 在云端 sandbox 里：
1. Clone 仓库
2. 执行你描述的任务（AI Agent 理解自然语言描述）
3. 跑测试确认没有破坏
4. **自动提 PR**，标题 + 描述自动生成

你的工作是 review PR，不是盯着 Agent 跑。

**适合的定时任务类型**：
- 依赖版本更新
- 安全漏洞扫描 + 修复
- 代码质量报告
- 文档同步（把代码注释同步到 Wiki）
- 测试覆盖率检查

**Webhook 触发**：除了 cron，还可以配置 Webhook——GitHub 合并 PR 时触发文档更新，监控系统报警时触发 incident 排查。

---

## MCP OAuth 改进：不再卡在登录界面

**2026 年分多次迭代**

MCP 是 Kiro 生态的核心，但 OAuth 认证一直是痛点——token 过期或 auth flow 卡住时，以前要重启整个 IDE。现在有专门的命令处理：

```bash
# 强制重新认证（token 过期或失效时）
/mcp auth figma-mcp

# 取消卡住的 auth flow（打开了浏览器窗口但一直没响应）
/mcp cancel-auth figma-mcp

# 彻底清除存储的凭据（换账号或 token 混乱时）
/mcp logout figma-mcp
```

配置严格 OAuth 的 MCP Server（比如 Figma）现在也支持：

```json
// .kiro/mcp/figma.json
{
  "name": "figma",
  "type": "oauth",
  "clientId": "your-figma-client-id",
  "clientSecret": "your-figma-client-secret",
  "redirectUri": "http://localhost:7878/callback",
  "skipDCR": true    // 跳过 Dynamic Client Registration，用你自己的 client ID
}
```

这对需要对接 Figma、Stripe、企业内部系统等 MCP Server 的团队影响很大——OAuth 配置以前是高频故障点，现在有明确的操作路径。

---

## 小结：2026 的 Kiro 是什么

| 时间线 | 事件 |
|--------|------|
| 2025-07 | Kiro 公开预览 |
| 2025-11 | Kiro GA |
| 2026-04 | Kiro CLI 2.0 发布 |
| 2026-Q1 | Pro Max 计划上线，Cloud Automations 上线 |
| 2026-Q2 | Tangents 功能上线，/context token 明细 |
| 2026-07 | Claude Opus 5 接入 |
| 2026-08-04 | **Kiro Crew 开源发布** |

Kiro 的路线图越来越清晰：从"帮个人写代码更有结构"（spec 工作流）进化到"帮团队自动化工程工作"（Crew + Cloud Automations）。如果你在 2025 年底试用过觉得功能太简单，2026 年中后的版本已经是一个完全不同量级的产品。
