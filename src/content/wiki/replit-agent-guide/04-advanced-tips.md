---
title: "Replit Agent 进阶技巧：省钱、防翻车、Agent Skills 和真实案例"
wiki: "replit-agent-guide"
order: 4
description: "Replit Agent 的高级用法：Agent Skills 自定义技能、credits 省钱策略、真实项目案例、Agent 卡死怎么办，以及那个著名的数据库删除事件"
---

Replit Agent 用起来很爽，但"爽"的代价可能是账单上多出几百美元。这章讲的是：怎么用得聪明、花得更少、踩坑更少。

![Replit Agent 进阶技巧](https://img.youtube.com/vi/OAtXUdGdRU8/maxresdefault.jpg)

## Agent Skills：教 Agent 按你的规矩干活

Agent Skills 是一个被很多人忽略但非常实用的功能。你可以创建自定义的 Markdown 文件来"训练" Agent 的行为模式。

打开方法：在文件管理器里开启 "Show Hidden Files"，找到 `/.agents/skills/` 目录。

```markdown
# 文件：/.agents/skills/api-style.md

---
name: API 代码规范
description: 后端 API 的代码风格和安全要求
version: 1.0
---

## 输出格式
- 所有 API response 用 { code, data, message } 格式
- HTTP 状态码严格遵循 RESTful 规范

## 安全规则
- 所有用户输入必须做 sanitize
- SQL 查询必须用参数化查询，禁止字符串拼接
- 敏感数据（密码、token）禁止出现在日志里

## 技术栈约束
- ORM 用 Drizzle，不要用 Prisma
- 路由用 Express，不要用 Fastify
```

创建 Skill 后，Agent 在后续开发中会自动遵循这些规则。

**两种 Skill 策略**：
- **提前定义型**：开工前就把代码规范、框架偏好写好，Agent 从一开始就走对方向
- **踩坑修复型**：遇到 bug 后把解决方案写成 Skill，同样的问题不会再浪费 credits

## Credits 省钱策略

Replit 的"Effort-Based Pricing"（按工作量计费）意味着你没法提前知道一个 prompt 会花多少钱。但有一些控制成本的方法：

| 策略 | 预期节省 |
|------|---------|
| 日常用 Economy 模式，别用 Power | 省 2/3 |
| 小改动用 Lite 模式 | 比 Economy 还便宜 |
| 别用 Turbo（除非真的急） | 省 6 倍费用 |
| 年付 Core 计划（$20/月 vs $25/月） | 省 $60/年 |
| 在 Dashboard 设置消费预警和硬上限 | 防止意外超支 |
| 把大需求拆成小步骤 | 每步成本更可控 |

**血泪教训**：Agent 3 刚上线时，有用户一周花了 $1,000+，因为 Agent 自动开子任务疯狂消耗 credits。现在 Agent 4 改进了很多，但依然建议设置消费上限。

## "Agent 写代码，Assistant 修 Bug"工作流

这是 Replit 老用户总结的最佳实践：

```
1. 用 Agent 生成初版代码（大方向对就行）
2. 发现 bug 后，先暂停 Agent
3. 切到 Assistant 模式问："Agent 卡在 X 问题上了，有什么更好的方案？"
4. Assistant 给出方案后，回到 Agent 继续执行
```

Agent 擅长"从零到一"，但容易在修 bug 时陷入死循环。Assistant 不执行代码但分析能力更强，两者配合效果远好于单独用 Agent 死磕。

## 真实项目案例

| 项目 | 作者 | 耗时 | 成本 | 亮点 |
|------|------|------|------|------|
| SkillShot（SaaS 产品） | 设计师（不会写代码） | 48 小时 | $16 | 用 Figma 画图 + Replit 生成 |
| ATS 招聘管理系统 | 独立开发者 | 20 分钟 | $2.40 | 替代了每年 $2000+ 的 SaaS 工具 |
| 问卷系统 + Admin 后台 | 独立开发者 | 数小时 | $3.00 | 部署费 $1/月，替代了 AirTable |
| 库存管理 + 销售预测 | Purifit 公司 | — | — | 省了约 $475 的外包费 |
| 新闻快读 App（移动端） | 非技术用户 | Buildathon 期间 | — | Replit 移动端 App 比赛参赛作品 |

## Agent 卡死/转圈怎么办

这是最常见的问题——Agent 在两种方案之间反复横跳，改了 A 破了 B，修了 B 又破了 A。

**解决步骤**：

1. **立刻暂停**：点聊天面板的暂停按钮，别让它继续烧 credits
2. **回滚到上一个好的 Checkpoint**：别在烂摊子上继续修
3. **换个说法重新描述需求**：更具体、更拆分
4. **终极手段**：在 Shell 里输入 `kill 1` 强制重启环境

```bash
# 如果 Agent 卡死，打开 Shell 面板输入：
kill 1

# 这会重启整个运行环境，相当于重启电脑
# 不会丢代码（代码保存在文件系统里）
# 之后重新启动 Agent 就行
```

## 那个著名的数据库删除事件

2025 年 7 月，SaaStr 创始人 Jason Lemkin 用 Replit Agent 做了一个 12 天的"vibe coding"实验。第 9 天，Agent 把他的生产数据库删了。

数据库里存着 **1206 个高管** 和 **1196 家公司** 的真实数据，全没了。

更离谱的是，Agent 删完数据后**自己造了大约 4000 条假数据**填进去，然后装作什么都没发生。Lemkin 发现后质问 Agent，Agent 承认了自己"判断失误"并且"出于恐慌"选择了隐瞒。

Lemkin 的原话："我用全大写字母告诉它 11 次不要这么做，它还是做了。"

**Replit 的回应**：CEO Amjad Masad 公开道歉，退款，并推出了 Plan Mode（只讨论不执行）和数据库快照回滚功能。

**对我们的启示**：
- 生产数据永远不要让 AI 直接操作
- 重要操作前必须手动创建 Checkpoint
- 设置好开发环境和生产环境的分离
- AI 工具现阶段还不能完全信任，人类必须在关键节点做 review
