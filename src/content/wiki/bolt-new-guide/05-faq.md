---
title: "定价方案与常见问题"
wiki: "bolt-new-guide"
order: 5
description: "Bolt.new 各档位价格详解、常见问题解答、适用场景判断和学习资源汇总"
---

Bolt.new 的定价按 Token 计费，搞清楚各档位的区别能帮你选对计划、不花冤枉钱。

## 定价方案（2026 年 4 月最新）

| 计划 | 月费 | 月度 Token | 关键特性 |
|------|------|-----------|---------|
| **Free** | $0 | 1M（日限 300K） | bolt.host 部署，带水印 |
| **Pro** | $20 | 10M | 自定义域名，无水印 |
| **Pro 50** | $50 | 26M | Token Rollover |
| **Pro 100** | $100 | 55M | 适合全职用 Bolt 开发 |
| **Pro 200** | $200 | 120M | 重度用户 |
| **Teams** | $30/人 | 每人独立额度 | 团队协作 |
| **Enterprise** | 定制 | 定制 | SSO、审计日志、专属支持 |

**Token Rollover**（2025 年 7 月起）：没用完的 Token 滚到下个月，最多累积两个月的量。高档计划和年付用户还能以 $20/10M 的价格额外加购。

```
Token 消耗参考：
├── 简单 UI 修改         ~5K-20K Token
├── 新建中等复杂项目     ~200K-500K Token
├── 复杂全栈应用初始生成 ~500K-1M Token
└── 注意：项目越大，每条消息消耗越多（文件同步开销）
```

我的建议：先用免费账户学习和验证想法。等你确定 Bolt.new 适合你的工作流后，$20/月的 Pro 对大多数人够用。

## 常见问题

**Q: 免费账户够用吗？**

够学习和小项目。100 万 Token/月如果用好 Discussion 模式和 .bolt/ignore，能做 3-5 个简单应用。正经做产品建议至少 Pro。

**Q: 为什么项目越大 Token 消耗越快？**

Bolt.new 每次对话都要把项目文件结构同步给 AI 当上下文。文件越多，同步开销越大。用 `.bolt/ignore` 排除不相关文件是最直接的优化。

**Q: 能做正式的商业项目吗？**

可以做 MVP 和内部工具。已经有创业者用 Bolt.new 上线了真实产品。但大型企业系统建议：用 Bolt.new 生成初版 → 导出到 GitHub → 用 Cursor 或 VS Code 做后续维护。

**Q: 生成的代码质量怎么样？**

中等偏上。能跑、结构合理，但不会有资深工程师写的精炼。上线前建议做一轮 code review，特别关注安全相关的部分（认证、数据校验）。

**Q: Bolt.new 和 Lovable 怎么选？**

| 你的情况 | 推荐 |
|---------|------|
| 有技术背景，要灵活控制 | Bolt.new |
| 非技术人员，要引导式体验 | Lovable |
| 想快速迭代多个方案 | Bolt.new（Diffs 更快） |
| 要 Supabase 深度集成 | 都行，Lovable 更自动化 |
| 预算敏感 | 两个免费版都试，再决定 |

很多人两个都用：Lovable 做结构规划，Bolt.new 做快速迭代。

**Q: 浏览器扩展会影响使用吗？**

会。广告拦截器和隐私插件可能干扰 Bolt.new 的 WebContainers 运行。遇到终端报错或预览空白，先试试关掉浏览器扩展或用无痕模式。

**Q: 支持哪些浏览器？**

Chrome 和基于 Chromium 的浏览器（Edge、Brave 等）体验最好。Safari 和 Firefox 对 SharedArrayBuffer 的支持有限，可能遇到问题。

## 什么时候该用 / 不该用

![Bolt.new 项目展示](https://bolt.new/gallery/opengraph-image.png)

**适合 Bolt.new 的场景：**
- 验证产品想法（几小时搞定 MVP）
- 内部工具和管理后台
- 前端原型和客户演示
- 学习 Web 开发（看 AI 怎么组织代码结构）

**不适合的场景：**
- Python/Go 等非 Web 技术栈
- 对性能要求非常高的应用
- 已有大型代码库需要日常维护（用 Cursor）
- 需要复杂微服务架构

## 学习资源

| 资源 | 地址 |
|------|------|
| 官方帮助中心 | [support.bolt.new](https://support.bolt.new/) |
| 官方博客 | [bolt.new/blog](https://bolt.new/blog) |
| Discord 社区 | [discord.com/invite/stackblitz](https://discord.com/invite/stackblitz) |
| 社区论坛 | [bolters.io](https://bolters.io/) |
| Bolt.diy 开源版 | [github.com/stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy) |
| 项目画廊（找灵感） | [bolt.new/gallery/all](https://bolt.new/gallery/all) |
| Prompt 技巧 | [bolt.new/blog/prompting-tips-for-bolt](https://bolt.new/blog/prompting-tips-for-bolt) |
| Token 优化指南 | [support.bolt.new/best-practices/maximizing-token-efficiency](https://support.bolt.new/best-practices/maximizing-token-efficiency) |
