---
title: "定时任务与数据同步实战"
wiki: "n8n-workflow-automation"
order: 7
description: "用 Schedule Trigger 和 Cron 表达式构建定时任务，实现跨平台数据同步和定期报告"
---

![n8n 定时任务与数据同步](https://img.youtube.com/vi/geR9PeCuHK4/maxresdefault.jpg)

n8n 不只是处理事件触发的工作流——定时跑的后台任务才是企业自动化的主力。数据库同步、日报生成、过期数据清理，这些每天都要做但没人愿意手动做的事情，交给 Schedule Trigger。

## Schedule Trigger 配置

Schedule Trigger 支持两种模式：

**简单模式（UI 选择）：**

```
Trigger Interval: Hours
Every: 2
```

每 2 小时触发一次。够用就选这个，不用记 Cron 语法。

**Cron 模式（精确控制）：**

```
Trigger: Cron
Expression: 0 9 * * 1-5
```

| Cron 表达式 | 含义 |
|------------|------|
| `0 9 * * 1-5` | 工作日早上 9:00 |
| `*/30 * * * *` | 每 30 分钟 |
| `0 0 1 * *` | 每月 1 号凌晨 |
| `0 18 * * 5` | 每周五下午 6:00 |
| `0 9,18 * * *` | 每天 9:00 和 18:00 |

注意 n8n 用的是服务器本地时区。Docker 部署时通过环境变量设置：

```bash
# docker-compose.yml
environment:
  - GENERIC_TIMEZONE=Asia/Shanghai
  - TZ=Asia/Shanghai
```

## 实战 1：Google Sheets → PostgreSQL 每日同步

运营团队在 Google Sheets 里维护客户信息，每天凌晨自动同步到数据库。

```
Schedule Trigger（0 2 * * *，凌晨 2 点）
    ↓
Google Sheets: Read（读取整个工作表）
    ↓
Code: 数据清洗 + 去重
    ↓
PostgreSQL: Upsert（有则更新，无则插入）
```

Code 节点做数据清洗：

```javascript
const seen = new Set();
const cleaned = [];

for (const item of $input.all()) {
  const email = (item.json.email || '').trim().toLowerCase();
  if (!email || seen.has(email)) continue;
  seen.add(email);
  
  cleaned.push({
    json: {
      email,
      name: (item.json.name || '').trim(),
      phone: (item.json.phone || '').replace(/[^0-9+]/g, ''),
      source: 'google_sheets',
      synced_at: new Date().toISOString()
    }
  });
}

return cleaned;
```

PostgreSQL 节点用 **Upsert** 操作，以 `email` 为冲突键：

```
Operation: Upsert
Schema: public
Table: customers
Conflict Column: email
Columns: name, phone, source, synced_at
```

## 实战 2：过期数据自动清理

每周日凌晨清理 30 天前的执行历史和临时文件：

```
Schedule Trigger（0 3 * * 0，周日凌晨 3 点）
    ↓
PostgreSQL: DELETE FROM executions WHERE created_at < NOW() - INTERVAL '30 days'
    ↓
HTTP Request: 调用对象存储 API 删除过期文件
    ↓
Slack: 发送清理报告
```

```javascript
// Code 节点：生成清理报告
const dbResult = $node["PostgreSQL"].json;
const storageResult = $node["HTTP Request"].json;

return [{
  json: {
    message: `🧹 周日自动清理完成\n` +
      `- 数据库: 删除 ${dbResult.affectedRows} 条过期记录\n` +
      `- 对象存储: 清理 ${storageResult.deletedCount} 个过期文件\n` +
      `- 执行时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
  }
}];
```

## 实战 3：多平台库存同步

电商场景：Shopify、有赞、自建商城的库存要保持一致。

```
Schedule Trigger（*/15 * * * *，每 15 分钟）
    ↓
HTTP Request: GET Shopify 库存
    ↓
HTTP Request: GET 有赞库存
    ↓
Merge: 按 SKU 合并两个数据源
    ↓
Code: 对比差异，找出不一致的 SKU
    ↓
IF: 有差异?
  ├── True → HTTP Request: 更新有赞库存 → Slack 通知
  └── False → NoOp（什么都不做）
```

```javascript
// Code 节点：对比库存差异
const shopify = $node["Shopify 库存"].json;
const youzan = $node["有赞库存"].json;

const diffs = [];
for (const [sku, shopifyQty] of Object.entries(shopify)) {
  const youzanQty = youzan[sku] || 0;
  if (shopifyQty !== youzanQty) {
    diffs.push({
      json: { sku, shopify: shopifyQty, youzan: youzanQty, diff: shopifyQty - youzanQty }
    });
  }
}

return diffs.length > 0 ? diffs : [{ json: { noDiff: true } }];
```

## 定时任务的注意事项

**1. 幂等性**

定时任务可能因为网络波动重跑，确保重复执行不会产生副作用。用 Upsert 代替 Insert，用"最后同步时间"做增量查询。

**2. 执行超时**

默认 workflow 执行没有超时限制，但长时间运行会占用资源。在 Settings 里设置：

```bash
# 单个 workflow 最大执行时间（秒）
EXECUTIONS_TIMEOUT=300
```

**3. 错误告警**

定时任务没人盯着，出错了必须立刻知道。给每个定时工作流配一个 Error Workflow（参考第 5 章），发 Slack 或邮件告警。
