---
title: "从唯一到零：Anthropic 被五角大楼踢出局的 65 天"
description: "2026年5月，五角大楼与7家AI公司签署最高密级合同，唯独排除Anthropic。而65天前，Claude是那套系统里唯一跑着的AI。一场关于自主武器红线、法院判词与政治代价的深度复盘。"
publishDate: 2026-05-04
tags:
  - ai-news
  - ai-analysis
  - anthropic
  - ai-governance
author: "JR Academy AI 编辑部"
keywords: "Anthropic五角大楼, Claude军事AI, AI自主武器, AI监管, 国防AI合同2026"
---

2026 年 5 月 1 日，五角大楼宣布了它的 AI 供应商名单：SpaceX、OpenAI、谷歌、Nvidia、Reflection AI、微软、AWS。这 7 家公司的模型，将进驻存放战争计划、追踪对手目标的最高密级数字网络。名单上没有 Anthropic——而就在 65 天前，Claude 是那套网络里**唯一**跑着的 AI。

## Anthropic 是怎么进去的，又是怎么出来的

先搭台子。

GenAI.mil 是五角大楼内部 AI 平台，2025 年末上线，运营五个月后已有超过 **130 万国防部人员**使用，产生了数千万条 prompt。放到企业 SaaS 里，这是顶级客户。

Anthropic 进这个平台，靠的是品牌溢价：在安全性和"宪法 AI"（Constitutional AI）上最严格的边界，配合最高级别的保密承诺。当 OpenAI 2024 年还在和军方讨价还价的时候，Anthropic 已经独占了五角大楼分类网络的准入。那时选 Anthropic，是因为它够"安全"——这里的"安全"是国家安全意义上的：不泄密，不被渗透，不出幺蛾子。

问题出在 2026 年初。

五角大楼升级了合同条款，要求 Anthropic 授权国防部将 Claude 用于**一切合法目的**。翻译成具体场景，就是全自主武器（无需人类审批的杀伤决策）和大规模国内监控。

2026 年 2 月 26 日，Dario Amodei 在 Anthropic 官网发声明：Anthropic 曾主动把模型部署到国防部和情报机构，但"不能昧着良心"同意上述两类用途。

**这是一条写进公开声明的红线。**

---

## 65 天里发生了什么

**2 月 27 日**，声明发出不到 24 小时，特朗普下令所有联邦机构停用 Anthropic 的 AI 技术。国防部长 Pete Hegseth 将 Anthropic 列为"供应链风险"。

"供应链风险"这个术语，本来是用来对付华为、中兴的——用来切断外国公司对美国基础设施的渗透。现在，它被贴到了一家总部在旧金山的美国 AI 公司身上。

**3 月初**，一封 Amodei 的内部备忘录泄露，语气比公开声明激烈。国防部副部长 Emil Michael 随即在社交媒体发文：Amodei "是个骗子，患有上帝综合征，只想靠个人意志控制美国军队。"Amodei 隔天道了歉——为泄漏的语气，不为核心立场。

**3 月 26 日**，加州联邦法官 Rita Lin 在 43 页裁定书里给出了罕见的措辞：

> "没有任何法律依据支持这种奥威尔式的逻辑——一家美国公司仅仅因为对政府合同条款表达异议，就被打成潜在敌人和破坏者。"

Lin 进一步写道，这属于"典型的违宪第一修正案报复"。Anthropic 拿到初步禁令，"供应链风险"标签暂时被叫停。

这本来是一场胜利。但 **4 月 8 日**，华盛顿特区联邦上诉法院否决了 Anthropic 的紧急上诉，维持五角大楼的黑名单。同天，五角大楼首席技术官表示：无论加州法院怎么说，禁令依然有效。

**4 月 17 日**，Amodei 亲赴白宫，希望当面谈判。

**5 月 1 日**，7 家公司的名单发布。Anthropic 不在其中。

---

## 另外 7 家，同意了什么

这才是核心。

SpaceX、OpenAI、谷歌、Nvidia、Reflection AI、微软、AWS——这 7 家公司签的协议，允许国防部将其 AI 用于"合法作战用途"（lawful operational use）。它们的模型将被部署到 **Impact Level 6 和 Level 7** 网络，这是美国军方数字系统的最高两级，专门处理战争计划和情报追踪。

说白了：这 7 家公司接受了 Anthropic 拒绝的那个条件——或者非常接近的版本。

历史对比有参考价值。谷歌 2018 年因为 Project Maven（给无人机打击提供 AI 图像分析）遭到内部员工大规模抗议，被迫撤出，并修改了 AI 原则，明确禁止"对人造成或直接助长伤害的武器或其他技术"。2026 年，它回来了，签了。OpenAI 2024 年修改使用政策，删除了明确禁止军事用途的条款，为这一天做了铺垫。

Reflection AI 值得单独说一句。这是家 2025 年底才成立的 AI 初创，创始人来自前谷歌 DeepMind 核心团队，成立不到一年就拿到了和 OpenAI、谷歌并列的五角大楼顶级合同。真相是：国防 AI 市场的进入门槛，从来不是技术积累，是政治意愿。

---

## 全自主武器到底意味着什么

用一个类比拆开这件事。

传统的精确打击流程，是这样的：卫星锁定目标 → 情报分析员确认 → 指挥官审批 → 操作员执行。每一步都有人在回路里（human in the loop），有人要签字，有人可以叫停，出了事有人负责。

全自主武器是另一套逻辑：AI 锁定目标 → AI 判断威胁等级 → AI 决定打击 → 打了。从识别到执行，可以是毫秒级响应——正好在人类反应时间窗口之外。没有人在回路里，没有授权节点，没有撤回键。

Anthropic 的判断是：把这种决策权交给任何一个系统——无论多先进——都不应该由 AI 公司单方面授权。

这是一条技术判断背后的伦理判断。

---

## 一个信号，不是结局

有一个细节不该被忽略：2026 年 4 月 19 日，Axios 报道，NSA（美国国家安全局）在五角大楼黑名单生效后，仍在继续使用 Anthropic 的 Mythos 网络安全工具。

我的判断是：这不是意外，是碎片化。五角大楼和 NSA 是两套官僚体系，用同一张黑名单管不了所有人。情报机构在用 Anthropic，恰恰说明 Anthropic 的技术没有问题——被踢出的是政治决定，不是技术评估。

但政治的代价是真实的。130 万 DoD 用户，IL6 / IL7 网络的准入，以及接下来国防 AI 部署浪潮里的先发优势——这些不会等 Anthropic 打完官司再回来。合同一旦跑起来，替换成本会让换供应商的代价指数级上升。

---

## 这件事说明了什么

Anthropic 这个案例让一件事变得清晰："安全"这个词，在当前的政治环境里有两套互相矛盾的含义。

Anthropic 所说的"安全"，是 AI 伦理意义上的：不制造不受控的杀伤工具，不参与对本国公民的大规模监控。这套逻辑的受众，是 AI 安全研究者和技术政策圈。

五角大楼所说的"安全"，是指挥链条意义上的：服从指令，不自作主张，不拿价值观挑战上级。在这套逻辑里，一家拒绝"一切合法目的"的公司，就是不服从的供应商，就是潜在威胁。

这两套定义无法共存——无论换哪个政府，大概率都一样。历史上，任何想在国防体系里保留独立伦理判断的供应商，最终都面临同样的选择：要么妥协，要么出局。Anthropic 的特殊之处，是它在 AI 被写进战争计划的节点上，选择了公开画线，而不是私下谈判后悄悄放弃。

其他 7 家公司，选择了合同。Anthropic 选择了留住那条线。两种选择都有代价，只是代价的种类不同。

Judge Rita Lin 的那句"奥威尔式"，是 2026 年法律文书里最诚实的句子之一。它说中了问题的本质——然后上诉法院推翻了她的禁令，五角大楼的名单照常发布。

原则不一定能赢，但它会被记住。

---

钱不会说谎，但原则也不会消失。

---

## 数据来源

- [Pentagon strikes deals with 7 Big Tech companies after shunning Anthropic — CNN Business](https://www.cnn.com/2026/05/01/tech/pentagon-ai-anthropic)
- [Pentagon inks AI procurement deals with seven companies, leaves out Anthropic — SiliconAngle](https://siliconangle.com/2026/05/01/pentagon-inks-ai-procurement-deals-seven-companies-leaves-anthropic/)
- [Pentagon freezes out Anthropic as it signs deals with AI rivals — Defense News](https://www.defensenews.com/news/pentagon-congress/2026/05/01/pentagon-freezes-out-anthropic-as-it-signs-deals-with-ai-rivals/)
- [Pentagon makes agreements with 7 companies to add AI to classified networks — Nextgov/FCW](https://www.nextgov.com/artificial-intelligence/2026/05/pentagon-makes-agreements-7-companies-add-ai-classified-networks/413264/)
- [Pentagon formally designates Anthropic a supply chain risk — CBS News](https://www.cbsnews.com/news/pentagon-anthropic-supply-chain-risk-feud-ai-guardrails/)
- [Anthropic wins preliminary injunction, judge cites 'First Amendment retaliation' — CNBC](https://www.cnbc.com/2026/03/26/anthropic-pentagon-dod-claude-court-ruling.html)
- [Judge blocks Pentagon's effort to 'punish' Anthropic — CNN Business](https://edition.cnn.com/2026/03/26/business/anthropic-pentagon-injunction-supply-chain-risk)
- [Anthropic loses appeals court bid to temporarily block Pentagon blacklisting — CNBC](https://www.cnbc.com/2026/04/08/anthropic-pentagon-court-ruling-supply-chain-risk.html)
- [Scoop: NSA using Anthropic's Mythos despite Defense Department blacklist — Axios](https://www.axios.com/2026/04/19/nsa-anthropic-mythos-pentagon)
- [Where things stand with the Department of War — Anthropic](https://www.anthropic.com/news/where-stand-department-war)
- [Statement from Dario Amodei on discussions with the Pentagon — Anthropic](https://www.anthropic.com/news/statement-department-of-war)
- [Pentagon official claims Anthropic CEO Dario Amodei has 'God-complex' — The Hill](https://thehill.com/policy/defense/5758772-pentagon-emil-michael-anthropic-dario-amodei-criticism/)
- [Anthropic CEO Dario Amodei heads to White House hoping to end Pentagon AI fight — Breitbart](https://www.breitbart.com/tech/2026/04/17/anthropic-ceo-dario-amodei-heads-to-white-house-hoping-to-end-pentagon-ai-fight/)
- [Pentagon AI deals bring NVIDIA, Microsoft tools to classified systems — Interesting Engineering](https://interestingengineering.com/ai-robotics/pentagon-nvidia-microsoft-aws-ai-deal)
