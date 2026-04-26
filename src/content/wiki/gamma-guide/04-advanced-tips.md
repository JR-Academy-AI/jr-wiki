---
title: "Gamma 进阶：API 自动化、MCP 集成和真实项目案例"
wiki: "gamma-guide"
order: 4
description: "Gamma REST API 批量生成演示、MCP Server 让 Claude 直接调 Gamma、Zapier/Make 自动化工作流、开发者实战案例"
---

Gamma 不只是一个"做 PPT 的网页工具"。它在 2026 年 1 月正式开放了 REST API，还上线了 MCP Server。这意味着你可以写代码让 AI 自动生成演示文稿，或者把 Gamma 集成进任何自动化工作流。这一章是给想玩得更深的开发者写的。

![Gamma API 开发者文档](https://img.youtube.com/vi/g_VsVTzsxYM/maxresdefault.jpg)

## Gamma REST API

API 基地址：`https://public-api.gamma.app/v1.0/`

需要 Pro 及以上套餐才能拿到 API Key。获取方式：Workspace Settings → Developer → Generate API Key。

### 基本生成流程

Gamma 的 API 是异步的——你提交生成请求，拿到一个 ID，然后轮询直到完成：

```bash
# 第一步：提交生成请求
curl -X POST https://public-api.gamma.app/v1.0/generations \
  -H "X-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "React vs Vue.js 技术选型指南",
    "outputLanguage": "zh-CN",
    "contentType": "presentation",
    "numCards": 8,
    "textDensity": "detailed",
    "tone": "professional",
    "audience": "有 1-2 年经验的前端开发者"
  }'

# 返回：{ "generationId": "abc123", "status": "processing" }

# 第二步：每 5 秒轮询一次状态
curl https://public-api.gamma.app/v1.0/generations/abc123 \
  -H "X-API-KEY: your_api_key"

# 完成后返回：
# {
#   "status": "completed",
#   "gammaUrl": "https://gamma.app/docs/abc123",
#   "exportUrl": "https://gamma.app/api/export/abc123.pdf"
# }
```

### 用 Node.js 批量生成

如果你需要为不同客户批量生成报告，可以这样写：

```javascript
const GAMMA_API = 'https://public-api.gamma.app/v1.0';
const API_KEY = process.env.GAMMA_API_KEY;

async function generatePresentation(topic, audience) {
  const res = await fetch(`${GAMMA_API}/generations`, {
    method: 'POST',
    headers: {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      audience,
      outputLanguage: 'zh-CN',
      contentType: 'presentation',
      numCards: 8,
    }),
  });
  const { generationId } = await res.json();

  // 轮询等完成
  while (true) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetch(
      `${GAMMA_API}/generations/${generationId}`,
      { headers: { 'X-API-KEY': API_KEY } }
    );
    const result = await poll.json();
    if (result.status === 'completed') return result;
    if (result.status === 'failed') throw new Error('生成失败');
  }
}

// 批量生成：给每个客户定制一份季度报告
const clients = ['Acme Corp', 'Startup Inc', 'BigTech Ltd'];
const reports = await Promise.all(
  clients.map(c =>
    generatePresentation(
      `${c} 2026 Q1 项目进展报告`,
      `${c} 的管理层和投资人`
    )
  )
);
```

### Template API

如果你有一套固定格式（比如周报模板），可以用 Template API——基于现有 Gamma 换内容，图片风格自动匹配原模板：

```bash
curl -X POST https://public-api.gamma.app/v1.0/generations/from-template \
  -H "X-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "templateGammaId": "your_template_id",
    "topic": "2026 年第 16 周前端团队周报",
    "audience": "产品经理和技术总监",
    "imageOptions": {
      "model": "flux_fast",
      "style": "minimalist"
    }
  }'
```

## MCP Server：让 Claude 直接用 Gamma

Gamma 上线了 MCP（Model Context Protocol）Server，这意味着你可以在 Claude Desktop、ChatGPT 或其他支持 MCP 的 AI 工具里直接让 AI 调用 Gamma 生成内容。

MCP Server 支持 4 个能力：
1. **生成内容** — 创建新的演示文稿 / 文档 / 网站
2. **读取现有内容** — 查看已有 Gamma 的结构和文字
3. **浏览主题** — 列出工作台里的可用主题
4. **整理到文件夹** — 把生成的内容归类

使用场景：你在 Claude 里讨论技术方案，讨论到一半直接说"把刚才的架构方案做成一份 Gamma 演示文稿"，Claude 通过 MCP 调 Gamma API 帮你生成，不用切换工具。

开发者文档里还提供了 `llms.txt` 和 `llms-full.txt`（在 `developers.gamma.app`），方便 AI 工具理解 Gamma 的 API 能力。

## Zapier / Make 自动化

Gamma 和 Zapier、Make（原 Integromat）、n8n 都有集成。几个实用的自动化场景：

| 触发事件 | 自动动作 |
|---------|---------|
| 周五下午 5 点 | 从 Jira 拉本周完成的 ticket → Gamma 生成周报 |
| 新客户签约（CRM 触发） | 自动生成一份欢迎 deck 发给客户 |
| GitHub Release 发布 | 自动生成版本更新说明演示 |
| 每月 1 号 | 从 Google Analytics 拉数据 → 生成月度运营报告 |

## 开发者实战案例

### 案例 1：Sprint Demo 演示

每两周给 stakeholder 做 sprint demo，手动做 PPT 要花半天。用 Gamma：

1. 从 Jira API 拉这个 sprint 完成的 story
2. 喂给 Gamma API，prompt 写："本 sprint 完成了以下功能：[story 列表]，生成一份给产品经理和客户看的 demo 演示"
3. 生成后用 Agent 微调措辞
4. 分享链接给团队

整个过程从半天缩到 15 分钟。

### 案例 2：技术博客配套演示

写完一篇技术博客后，用 Gamma 的 Paste 模式把博客内容粘进去，自动变成一份演示文稿。发到 Twitter / LinkedIn 上的传播效果比纯文字链接好很多。

### 案例 3：开源项目 README 可视化

把 README.md 的内容导入 Gamma，生成一份项目介绍演示。嵌入到项目文档站点里，比纯文字 README 更直观，Star 转化率更高。

## 网站发布功能

Gamma 还能把卡片内容发布成独立网站。进编辑器右上角 → Publish as site → 拿到一个 `*.gamma.site` 域名（或绑自定义域名）。

```
功能清单：
✓ 自定义域名（Pro 起）
✓ 响应式布局（自动适配手机）
✓ 密码保护
✓ Google Analytics / Meta Pixel 集成
✓ SEO 设置（标题、描述、OpenGraph 图片）
✓ 表单嵌入（收集访客信息）
```

对于个人作品集、项目展示页、活动着陆页这类不需要复杂后端的场景，Gamma Site 比自己搭站省事太多。
