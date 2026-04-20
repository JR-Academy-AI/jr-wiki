---
title: "实战方案集：6 个开箱即用的自动化工作流"
wiki: "n8n-workflow-automation"
order: 7
description: "6 个可以直接复制使用的 n8n 工作流：竞品监控、简历筛选、发票处理、库存预警、内容审核、多渠道通知"
---

前面几章讲了节点、AI Agent、Code Node 的用法，这章直接给方案——每个工作流都带完整节点链和关键配置，改几个参数就能跑。

![n8n 工作流模板可以直接导入编辑器使用](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot.png)

## 方案 1：竞品网站变更监控

**场景**：每天检查竞品官网是否有新动态（新功能上线、价格变更），有变化就发通知。

**节点链**：Schedule Trigger → HTTP Request → Code（提取 + 对比）→ IF → Slack

```javascript
// Code 节点：提取页面关键内容，和昨天的快照对比
const cheerio = require('cheerio');
const html = $input.first().json.data;
const $ = cheerio.load(html);

const currentContent = $('.pricing-table').text().trim();
const previousHash = $node["Get Previous Hash"].json.hash || '';
const crypto = require('crypto');
const currentHash = crypto.createHash('md5').update(currentContent).digest('hex');

return [{
  json: {
    changed: currentHash !== previousHash,
    currentHash,
    snapshot: currentContent.substring(0, 500),
    checkedAt: new Date().toISOString()
  }
}];
```

把 `currentHash` 存到数据库或 Google Sheet，下次对比用。IF 节点判断 `{{ $json.changed }}` 为 true 时走 Slack 通知分支。

---

## 方案 2：简历自动筛选 + 评分

**场景**：收到简历邮件 → AI 读取简历 → 按 JD 打分 → 分数 ≥ 7 的自动约面试。

**节点链**：Email Trigger → Extract Attachments → OpenAI（评分）→ IF（≥7）→ Gmail（发面试邀请）+ Google Sheets（记录）

```
OpenAI 节点 System Prompt:
你是一个技术招聘助手。根据以下 JD 给简历打分（1-10），输出 JSON：
{"score": 8, "strengths": ["..."], "concerns": ["..."], "summary": "一句话评价"}

JD: 3年+ Node.js/TypeScript 经验，熟悉 AWS，有 CI/CD 实战经验。

简历内容：
{{ $json.resumeText }}
```

IF 节点条件：`{{ $json.score }} >= 7`。高分走面试邀请，低分存档到 Google Sheets 备查。

---

## 方案 3：发票 OCR + 自动入账

**场景**：供应商发票邮件 → OCR 提取金额和供应商 → 自动录入财务系统。

**节点链**：Email Trigger → Extract PDF → HTTP Request（OCR API）→ Code（解析）→ HTTP Request（财务系统 API）

```javascript
// Code 节点：从 OCR 结果提取发票关键字段
const ocrText = $input.first().json.text;

const invoiceNumber = ocrText.match(/发票号[码]?[：:]\s*(\d+)/)?.[1] || '';
const amount = ocrText.match(/[金合]计[（(]?税[）)]?[：:]\s*[¥￥]?([\d,.]+)/)?.[1] || '';
const vendor = ocrText.match(/销售方[：:]\s*(.+?)[\n\r]/)?.[1]?.trim() || '';
const date = ocrText.match(/开票日期[：:]\s*([\d-]+)/)?.[1] || '';

return [{
  json: {
    invoiceNumber,
    amount: parseFloat(amount.replace(/,/g, '')),
    vendor,
    date,
    raw: ocrText.substring(0, 200)
  }
}];
```

OCR 服务推荐用百度 OCR 或腾讯 OCR 的发票识别接口，识别率比通用 OCR 高得多。

---

## 方案 4：库存预警 + 自动补货

**场景**：每小时检查库存，低于阈值自动通知采购 + 生成补货单。

**节点链**：Schedule（每小时）→ PostgreSQL（查库存）→ IF（< 阈值）→ Slack + HTTP Request（下采购单）

```sql
-- PostgreSQL 节点查询
SELECT 
  p.name, p.sku, 
  i.quantity, i.reorder_threshold,
  s.name AS supplier, s.email AS supplier_email
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN suppliers s ON s.id = p.supplier_id
WHERE i.quantity < i.reorder_threshold
ORDER BY (i.quantity::float / i.reorder_threshold) ASC;
```

IF 节点判断结果数组长度 > 0。Slack 消息里用 Loop Over Items 把所有低库存商品列成表格。

---

## 方案 5：用户生成内容（UGC）审核

**场景**：用户提交评论/帖子 → AI 审核内容合规性 → 合规的自动发布，违规的进人工队列。

**节点链**：Webhook（接收 UGC）→ OpenAI（审核）→ Switch（合规/可疑/违规）→ 三条分支

```
OpenAI System Prompt:
你是内容审核员。判断用户内容是否合规，输出 JSON：
{"verdict": "pass|review|reject", "category": "spam|abuse|adult|normal", "confidence": 0.95}

规则：
- 广告/垃圾信息 → reject
- 轻微擦边但不确定 → review（送人工）
- 正常内容 → pass

用户内容：
{{ $json.body.content }}
```

Switch 节点按 `{{ $json.verdict }}` 分三条路：
- `pass` → 直接调用发布 API
- `review` → 写入 Airtable「待审核」视图 + 通知运营
- `reject` → 记录到违规日志 + 通知用户

---

## 方案 6：多渠道统一通知中心

**场景**：一个 Webhook 入口，根据紧急程度分发到不同渠道。

**节点链**：Webhook → Switch（level）→ 四个分支

```javascript
// Webhook 接收格式
POST /notify
{
  "level": "critical|warning|info",
  "title": "数据库连接数告警",
  "message": "当前连接数 95/100",
  "source": "monitoring"
}
```

Switch 节点按 `{{ $json.body.level }}` 分发：

| 级别 | 渠道 | 说明 |
|------|------|------|
| **critical** | 电话（Twilio）+ Slack + 邮件 | 三个节点并行发送 |
| **warning** | Slack + 邮件 | 两个节点并行 |
| **info** | 仅 Slack | 单节点 |

```javascript
// Twilio 节点：紧急电话通知
// 配置 Twilio Credential 后
To: +86138xxxxxxxx
Body: "紧急告警：{{ $json.body.title }}。{{ $json.body.message }}"
```

所有通知统一记录到 PostgreSQL，方便事后审计和统计各渠道触达率。

---

## 导入现成模板

n8n 官方模板库有 900+ 工作流可以一键导入：

```bash
# 在 n8n 编辑器里：
# 1. 点击左侧菜单 Templates
# 2. 搜索关键词（如 "slack notification"）
# 3. 点击 Use this workflow → 自动导入到你的编辑器
# 4. 修改 Credential 和参数 → 激活
```

也可以用 API 批量导入：

```bash
# 导入 JSON 格式的工作流
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @my-workflow.json
```
