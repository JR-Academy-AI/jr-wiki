---
title: "常见问题、定价与选型建议"
wiki: "cline-guide"
order: 5
description: "Cline 完整定价分析、常见坑和解决方案、Cline vs Cursor vs Claude Code 到底选哪个"
---

## 常见问题

### Cline 改错代码了怎么办？

Cline 内置 **Checkpoint** 机制——每步操作前自动保存工作区快照。在对话面板找到出问题的那一步，点 Restore Checkpoint 回滚。比手动 `git stash` 精准，因为它恢复的是那个确切时间点的状态。

![Cline FAQ 与定价](https://img.youtube.com/vi/fSvBDMdbuJI/maxresdefault.jpg)

如果整轮对话都不满意，用 git 回滚更干净：

```bash
# 看 Cline 改了哪些文件
git diff --name-only

# 回滚单个文件
git checkout -- src/components/Header.tsx

# 全部回滚到上次 commit
git checkout -- .
```

**最佳实践**：每完成一个小任务就 commit 一次。这样即使后续任务搞砸了，也能精确回退。

### 上下文窗口满了怎么办？

Cline 的有效上下文大约是模型标称值的 50-70%。超过后 AI 的回答质量会明显下降——开始忘记之前说过的话、重复犯同样的错。

解决方案：

1. **拆任务**——一个大功能拆成多个小任务，每个开新对话
2. **`.clinerules` 里加 handoff 规则**——告诉 Cline 上下文用到 50% 时主动总结并建议开新对话
3. **精准引用**——`@` 具体文件而不是整个文件夹
4. **频繁 commit**——新对话可以通过 git log 了解之前做了什么

```markdown
<!-- .clinerules/context-management.md -->
# 上下文管理规则

当上下文使用超过 50% 时：
1. 总结当前进度和待办事项
2. 列出已修改的文件清单
3. 建议用户开新对话继续
```

### API 报错 "rate limit exceeded"？

你的 API Provider 对请求频率有限制。处理方式：

- **Anthropic**：默认 RPM（每分钟请求数）较低，去 console 申请提升
- **OpenRouter**：聚合多 provider，自动负载均衡，限流少
- **本地模型**：没有限流问题，但速度取决于你的 GPU

### Cline 能用中文对话吗？

完全支持。Prompt 用中文、`.clinerules` 用中文、代码注释用中文都没问题。Cline 只是调用底层模型的 API，Claude/GPT/Gemini 都支持中文。唯一建议：变量名和函数名还是用英文。

### JetBrains 能用吗？

能。Cline 从 2026 年开始支持 JetBrains 系列 IDE（IntelliJ、WebStorm、PyCharm 等）。功能和 VS Code 版基本一致，但 VS Code 版更新更快、社区支持更好。

## 定价详解

Cline 本身完全免费。你的成本 = 你选的模型的 API 费用。

| 方案 | 月费 | 说明 |
|------|------|------|
| **Cline 扩展** | $0 | 开源免费，永远免费 |
| **BYO API Key** | 按量付费 | 用多少付多少，完全透明 |
| **Cline API** | 按量付费 | 官方聚合代理，一个 key 用所有模型 |
| **Cline Teams** | 联系销售 | SSO + 权限管理 + 用量审计 |

### 各模型实际成本参考

```
模型                  输入 $/百万 token   输出 $/百万 token   日均成本估算
──────────────────────────────────────────────────────────────────────
Claude Sonnet 4.6      $3                $15               $3-5
Claude Opus 4.6        $15               $75               $15-30
GPT-4o                 $2.5              $10               $2-4
Gemini 2.5 Flash       $0.15             $0.60             $0.30-0.50
DeepSeek V3            $0.27             $1.10             $0.30-0.80
本地 Ollama            $0                $0                电费
──────────────────────────────────────────────────────────────────────

# 日均成本基于中等强度使用（每天 10-20 个任务）
```

**我的建议**：起步用 Claude Sonnet，日均 $3-5 能覆盖大部分开发工作。简单任务切 Gemini Flash 省钱，复杂架构上 Opus 解决。一个月下来比 Cursor Pro 的 $20 可能还便宜——前提是你不用 YOLO 模式跑大项目。

### Cline vs Cursor vs Claude Code 定价对比

```
Cline（BYO Claude Sonnet）:
  ✓ 扩展免费
  ✓ 按量付费，不用不花钱
  ✓ 可以用最便宜的模型压成本
  ✗ 没有免费额度，第一天就要花钱
  ✗ 费用不可预测，重度使用可能超 $20

Cursor Pro $20/月:
  ✓ 固定月费，预算可控
  ✓ 包含 Tab 补全（Cline 没有）
  ✓ Background Agent（云端异步）
  ✗ 用量超了还是要加钱
  ✗ 闭源，不能审计代码

Claude Code（API 按量付费）:
  ✓ 100 万 token 上下文，复杂项目最强
  ✓ 推理能力碾压其他
  ✗ 终端操作，没有 GUI
  ✗ 只支持 Anthropic 模型
```

## 选型决策树

```
你想用 AI 辅助编程？
├── 想留在 VS Code、不换编辑器？
│   ├── 预算敏感 / 想用本地模型 → Cline ✅
│   ├── 想要开箱即用 + Tab 补全 → Cursor
│   └── 想要开源可审计 → Cline ✅
├── 更习惯终端操作？
│   └── Claude Code
├── 想花最少的钱？
│   ├── Cline + Gemini Flash（几乎免费）✅
│   └── Windsurf 免费版
└── 团队统一工具？
    ├── 要审计和合规 → Cline Teams ✅
    └── 要最强生态 → Cursor Business
```

## 最佳实践总结

1. **写好 `.clinerules`**——花 10 分钟定义编码规范，后面每次生成的代码都合规
2. **模型分级用**——简单任务用便宜模型，复杂任务切好模型，别一直开着 Opus
3. **先 Plan 后 Act**——复杂任务先用 Plan 模式理清思路，再切 Act 执行
4. **小步提交**——每完成一个小功能就 `git commit`，给自己留回退点
5. **用 MCP 扩展能力**——连数据库、连 Jira、连浏览器，Cline 的能力边界取决于你装了什么工具
6. **控制上下文**——精准 `@` 引用，及时开新对话，别让上下文溢出
