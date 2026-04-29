---
title: "n8n 是什么：自动化工具的新选择"
wiki: "n8n-workflow-automation"
order: 1
description: "n8n 的定位、核心优势，以及与 Zapier、Make 的全面对比"
---

n8n 是一个开源的工作流自动化平台，让你用可视化节点连接各种应用，自动完成重复性任务——不管是发邮件、同步数据库、还是调用 AI，都能在一个界面里搞定。

![n8n workflow canvas](https://n8n.io/images/n8n-screenshot.png)

## n8n 解决的核心问题

每个开发者和职场人都有一堆"我应该自动化但一直没做"的任务：

- 客户填了表单 → 手动复制到 CRM → 手动发欢迎邮件
- 代码 push 成功 → 手动去 Slack 发通知
- 每天早上手动汇总几个渠道的数据到 Excel

n8n 让你用节点（Node）把这些步骤连起来，触发一次，全程自动。

## n8n vs Zapier vs Make：完整对比（2026）

| 维度 | n8n（自托管） | n8n Cloud | Zapier | Make |
|------|-------------|-----------|--------|------|
| **入门价格** | **免费**（服务器 $5–20/月） | €24/月（Starter） | $19.99/月 | $10.59/月（Core） |
| **免费配额** | 无限执行 | 无免费计划（14天试用） | 100 tasks/月 | 1,000 ops/月 |
| **计费单位** | — | 每次 workflow 执行 | 每个步骤（task） | 每个模块（operation） |
| **10步骤跑 1,000 次/月** | **免费** | 消耗 1,000 executions（Starter 够用） | 消耗 10,000 tasks（需 $49+/月套餐） | 消耗 10,000 ops（Core $10.59/月） |
| **集成数量** | 1,000+ 原生 + 无限 HTTP | 同左 | 6,000+ | 1,500+ |
| **AI Agent** | 原生 LangChain，70+ AI 节点 | 同左 | Zapier Agents（受限） | Maia（受限） |
| **代码能力** | **JS / Python，支持 npm** | 同左 | 极简 JS 片段 | 受限 |
| **数据主权** | **完全自控** | 数据在 n8n 欧洲服务器 | 数据在 Zapier 美国服务器 | 数据在 Make 服务器 |
| **学习曲线** | 中（开发者友好） | 同左 | 低 | 中低 |
| **适合人群** | 开发者 / 技术团队 | 技术团队 + 不想运维 | 非技术人员 | 中间层 |

### 计费模型：最容易踩坑的差异

三个平台的计费逻辑完全不同，用相同的使用量算出来的费用天差地别。

**Zapier 按 task 收费**：工作流里每个步骤都算一个 task。一个 10 步骤的 Zap 跑一次 = 10 tasks。每月跑 1,000 次 = 消耗 10,000 tasks，Professional 计划 750 tasks 根本不够，需要升级到更贵的套餐。

**Make 按 operation 收费**：和 Zapier 类似，每个模块算一个 operation。1,000 次运行 × 10 步骤 = 10,000 operations，Core 计划（$10.59/月）刚好够——但复杂场景步骤数多，很快超限。

**n8n 按执行次数收费（云端）或完全免费（自托管）**：整个 workflow 不管几个节点，跑一次只算一次执行。同样是 10 步骤跑 1,000 次，只消耗 1,000 executions，Starter（€24/月，2,500 executions）完全够用。自托管版本没有任何执行次数限制。

**结论**：步骤越多、运行越频繁，Zapier 的账单涨得越快。n8n 的计费模型对工程师友好得多。

## 自托管 vs 云端：决策树

这是很多人对 n8n 最大的疑问。按以下条件决策：

```
你需要 n8n，那就问自己：

1. 是否有 VPS / Docker 使用经验？
   ├── 没有 → 用 n8n Cloud（Starter €24/月，省去运维麻烦）
   └── 有 → 继续往下

2. 数据是否有合规要求（GDPR / 不能出服务器）？
   ├── 是 → 必须自托管
   └── 否 → 继续往下

3. 每月执行量大概多少？
   ├── < 2,500 次 → n8n Cloud Starter 够用（€24/月）
   ├── 2,500–10,000 次 → n8n Cloud Pro（€60/月）或自托管（$10/月 VPS）
   └── > 10,000 次 → 自托管，省钱省限制

4. 需要深度定制（自定义节点 / 私有 npm 包）？
   └── 是 → 自托管
```

### 自托管的实际成本

用 Docker 跑 n8n，最简单的启动命令：

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

本地测试用这个就够了。生产环境需要持久化 + 重启策略 + 反向代理，推荐 docker-compose：

```yaml
# docker-compose.yml（最小生产可用配置）
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=yourdomain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://yourdomain.com/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

一台 2 核 2GB RAM 的 VPS（Hetzner 最低档 €4.5/月，Digital Ocean $12/月）完全够跑几十个中等复杂度的工作流。对比 n8n Cloud Pro 的 €60/月，一年能省下 €660 以上。

### 自托管的注意事项

- **Webhook 需要公网域名**：Webhook 触发型工作流（GitHub push 触发、表单提交触发）需要 n8n 实例能被外部访问，必须配域名 + SSL（用 Nginx + Certbot 即可）。
- **版本更新需手动维护**：云端自动更新，自托管需要定期执行 `docker pull n8nio/n8n:latest && docker-compose up -d`，大版本升级前一定看 changelog。
- **单点故障**：社区版不支持多实例水平扩展，实例挂了 webhook 失效。高可用场景考虑加外部队列（Redis）或直接用 n8n Cloud。

## n8n 最大的差异化优势

**1. 自托管免费，真·无限制**

社区版跑在你自己的服务器上，任务数、workflow 数、用户数全无限制。Zapier 750 tasks/月要 $19.99，n8n 你可以跑几百万次都是免费的——成本只是 VPS 费。

**2. 真实代码能力**

n8n 的 Code Node 支持完整的 JavaScript 和 Python，还能直接 `require()` npm 包。Zapier 的 Code 步骤只支持极简的 JS 片段，碰到稍微复杂的逻辑就得想别的办法。

**3. AI Agent 原生集成**

n8n 2.0 内置 LangChain，有 70+ AI 专属节点，构建 AI Agent 不需要写一行代码。接 OpenAI、Claude、Mistral、Ollama（本地模型）都原生支持，不需要中间层。

**4. HTTP Node 连接任何 API**

没有内置集成的服务怎么办？n8n 的 HTTP Request 节点能调用任何 REST API，支持 OAuth、Bearer Token、Basic Auth，配置完全可视化。这意味着 n8n 的"1,000+ 集成"在实际使用中是无上限的。

## 什么时候选 n8n？

**选 n8n 的场景：**
- 你或团队有基本的技术能力（会看 JSON、会写简单 JS）
- 工作流需要处理数据逻辑、条件分支、循环迭代
- 需要接入自建 API 或内部数据库
- 想做 AI Agent 工作流（接 OpenAI、Claude、本地模型）
- 不想让数据经过第三方服务器（GDPR、隐私合规）
- 使用量大，Zapier 账单让你肉疼

**选 Zapier 的场景：**
- 完全非技术人员，不想碰任何代码
- 需要连接很冷门的 SaaS 工具（Zapier 6,000+ 集成确实更广）
- 快速验证想法，不在乎成本

**选 Make 的场景：**
- 介于两者之间：比 Zapier 便宜，比 n8n 上手容易
- 场景复杂度中等，但不需要写代码

## n8n 的"公平代码"许可

n8n 使用 [Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)——不是 MIT，但也不是商业闭源：

- 个人和团队内部使用：**完全免费**
- 给客户提供 n8n 托管服务（managed service 形式）：需要商业许可
- 查看源码、修改代码：允许

对 99% 的使用场景来说，把它当免费开源软件用即可。唯一需要注意的是：如果你的商业模式是"帮客户搭建并托管 n8n"，才需要付商业许可费。自己团队内部用，不受这个限制。
