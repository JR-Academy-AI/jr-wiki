---
title: "省 Token 攻略与高级玩法"
wiki: "bolt-new-guide"
order: 4
description: "Token 优化实战技巧、Prompt 工程模板、Bolt.diy 开源版部署、Expo 移动应用开发"
---

Bolt.new 按 Token 计费，用得好和用得差，同样的预算能做的事情差 3-5 倍。这章的内容都是实战攒下来的经验。

## Token 优化：从 3 条 prompt 用完额度到 12 条

免费账户每月 100 万 Token，一个中等项目一次对话可能吃掉 30 万。但掌握技巧后，有用户做到了同样额度跑 12 条以上有效 prompt（原来只能跑 3-4 条）。

**最有效的 5 个技巧：**

1. **先 Discussion 后 Build**：用 Discussion 模式（不动代码）聊清楚方案，再切 Build 执行。Discussion 的 Token 消耗只有 Build 的 1/10

2. **用好 .bolt/ignore**：

```
# .bolt/ignore — 排除 AI 不需要看的文件
node_modules/
dist/
.next/
*.lock
public/assets/images/
```

项目越大这招越管用，因为 Bolt.new 每次对话都要把项目文件同步给 AI 当上下文。

3. **一次加一个功能**：不要在一条 prompt 里塞 5 个需求。逐个添加，确认没问题再继续

4. **UI 改动合并，功能改动分开**：「把按钮改蓝色、标题字号加大、加圆角」可以一条 prompt；「加支付功能」和「加用户系统」必须分开发

5. **善用 Enhance Prompt**：一条写得好的初始 prompt 胜过后面 10 条修修补补

## Prompt 工程：Mega Prompt 模板

Bolt.new 社区总结了一种 "Mega Prompt" 写法——把所有关键信息一次性给足，AI 理解准确率远高于「帮我做一个管理后台」：

```
应用类型：SaaS 仪表盘
技术栈：Next.js + TypeScript + Tailwind CSS + shadcn/ui + Supabase

核心功能：
1. 用户注册/登录（Supabase Auth，支持 Google OAuth）
2. 仪表盘首页：关键指标卡片 + 折线趋势图（用 Recharts）
3. 数据管理页面：表格 + 搜索筛选 + CRUD 操作
4. 用户设置页面：头像上传、密码修改、通知偏好

设计要求：
- 深色主题为主，支持切换浅色
- 左侧固定导航栏，顶部面包屑
- 响应式设计，手机上导航栏变成底部 Tab
- 所有表单加 loading 状态和错误提示
```

这种结构化 prompt 生成的项目，后续需要修补的地方会少很多。

## Bolt.diy：不受 Token 限制的开源版

如果你不想被官方的 Token 额度卡脖子，Bolt.diy 是官方开源版本，最大优势是可以接入任意 LLM。

![Bolt.diy 开源版](https://github.com/stackblitz-labs/bolt.diy/raw/main/public/social_preview_index.jpg)

支持 **19+ 模型提供商**：OpenAI、Anthropic、Google Gemini、DeepSeek、Groq、Mistral，甚至本地跑的 Ollama 和 LM Studio。每个 prompt 可以用不同模型。

```bash
# 方式一：本地安装
git clone https://github.com/stackblitz-labs/bolt.diy
cd bolt.diy
cp .env.example .env   # 填入你的 API key
pnpm install
pnpm run dev            # 打开 http://localhost:5173

# 方式二：Docker
docker compose --profile development up

# 方式三：一键部署到 Railway 或 Easypanel
```

Bolt.diy 额外有语音输入、文件锁定、代码搜索等社区贡献的功能。缺点是没有 Supabase 一键集成和 bolt.host 托管——这些是 Bolt.new 商业版的卖点。

## 移动应用：Expo 集成

Bolt.new 内置 Expo 模板，直接生成 React Native 跨平台移动应用：

1. 选 Expo 模板或在 prompt 里写「用 Expo 做移动应用」
2. AI 生成代码后，手机装 **Expo Go** 扫 QR 码即可实时预览
3. 正式发布用 EAS（Expo Application Services）打包，提交到 App Store 和 Google Play

适合做内部工具、MVP 验证这类移动应用。不适合重度动画或对原生性能要求很高的场景。

## 调试技巧

遇到 AI 陷入修复循环（改了 A 坏了 B，修了 B 又坏了 A）时：

1. 先回退到上一个正常版本（不消耗 Token）
2. 用 Discussion 模式让 AI 分析问题根因
3. 要求 AI 加详细的 console.log 日志
4. 拿到日志信息后，一次性描述清楚问题和期望行为

不要反复点「修复」按钮——每次都消耗 Token，而且没有新信息输入，AI 可能会重复犯同样的错误。
