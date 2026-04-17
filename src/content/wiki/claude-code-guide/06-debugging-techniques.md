---
title: "调试技巧：让 Claude Code 帮你定位 Bug"
wiki: "claude-code-guide"
order: 6
description: "错误日志直接丢给 Claude Code，从排查到修复一条龙"
---

## 给 Claude Code 错误信息

最有效的调试方式：把错误日志直接丢进去。

```bash
# 方式一：直接在对话里粘贴
> 我跑 npm run build 报了这个错：
> TypeError: Cannot read properties of undefined (reading 'map')
> at UserList (src/components/UserList.tsx:23:18)

# 方式二：管道输入（适合长日志）
npm run build 2>&1 | claude -p "分析这个构建错误的原因，给出修复方案"

# 方式三：从日志文件读取
> 帮我看一下 @logs/error.log 最近的报错，找到根因
```

![调试工作流](https://code.claude.com/images/og-image.png)

Claude Code 拿到错误信息后会自动定位到源文件，分析调用链，找到 root cause。

## 实战：排查运行时错误

```
> 用户反馈说点击"提交订单"按钮没反应，帮我查一下 OrderForm 组件
```

Claude Code 的排查路径：

1. 读取 `OrderForm.tsx`，找到 submit handler
2. 追踪整个调用链：组件 → service → API endpoint
3. 检查每一层的错误处理是否有遗漏
4. 定位问题（比如 `await` 缺失导致 Promise 未处理）
5. 修复并验证

## 用 Extended Thinking 处理复杂 Bug

碰到逻辑复杂、涉及多个模块的 bug，开启 extended thinking 让 Claude 深度分析：

```bash
# 在 Claude Code 里按 Option+T (macOS) 或 Alt+T 开启 thinking mode
# 或者启动时指定
claude --permission-mode plan
```

在 thinking mode 下，Claude 会先做完整的代码分析，画出依赖关系，然后再给出修复方案。按 `Ctrl+O` 能看到它的推理过程。

适合用 thinking mode 的场景：
- 竞态条件（race condition）
- 内存泄漏
- 跨服务的数据不一致
- 性能瓶颈定位

## 把 Claude Code 集成到测试流程

用管道把测试输出直接给 Claude 分析：

```bash
# 跑测试，失败的话自动分析原因
npm test 2>&1 | claude -p "分析失败的测试，找到 root cause 并修复"

# 只看特定测试文件的失败
npx vitest run src/services/auth.test.ts 2>&1 | claude -p "这个测试为什么失败了？"
```

更自动化的做法——写个脚本循环修复：

```bash
#!/bin/bash
MAX_ATTEMPTS=3
for i in $(seq 1 $MAX_ATTEMPTS); do
  npm test && echo "测试通过" && exit 0
  npm test 2>&1 | claude -p "测试失败了，读取相关源码，修复 bug。只改源码，不改测试。"
done
echo "修复 $MAX_ATTEMPTS 次仍然失败，需要人工介入"
```

## 调试 API 接口

后端接口出问题时，可以结合 MCP 工具一起调试：

```
> 帮我查一下 /api/orders 接口为什么返回 500
> 用 PostgreSQL MCP 看一下 orders 表最近 10 条记录的状态
> 再对比一下代码里的查询逻辑
```

如果接了数据库 MCP Server，Claude Code 能直接执行 SQL 验证数据，比手动切换终端、数据库客户端效率高得多。

## 常见调试模式

| 场景 | 推荐方式 |
|------|---------|
| 构建报错 | 管道输入 build 输出，让 Claude 分析 |
| 运行时错误 | 粘贴错误日志 + 堆栈信息 |
| 测试失败 | 管道输入测试结果，自动定位修复 |
| 性能问题 | 用 thinking mode 分析代码路径 |
| UI 问题 | 截图粘贴（`Ctrl+V`），让 Claude 看界面 |
| 数据问题 | 接 PostgreSQL MCP，直接查数据库 |
