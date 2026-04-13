---
title: "调试与测试：用 Claude Code 快速定位问题"
wiki: "claude-code-guide"
order: 6
description: "从报错信息到修复代码，Claude Code 的调试和测试工作流"
---

## 从报错到修复的最短路径

拿到一个报错信息，直接贴给 Claude Code：

```
> 运行 npm test 报错：TypeError: Cannot read properties of undefined (reading 'map')，在 src/components/UserList.tsx:42
```

Claude Code 会读取 `UserList.tsx`，分析第 42 行的上下文，找到 `users` 可能为 `undefined` 的情况，然后给出修复：

```typescript
// 修复前
const rows = users.map(u => <UserRow key={u.id} user={u} />);

// 修复后
const rows = (users ?? []).map(u => <UserRow key={u.id} user={u} />);
```

不只是加个 `??`，Claude Code 会追溯数据来源——API 返回格式是否变了、初始 state 定义是否正确、loading 状态是否缺失——给出根因分析。

![Claude Code 调试流程](https://code.claude.com/images/debugging-workflow.png)

## 用日志定位问题

把日志直接 pipe 进 Claude Code 做分析：

```bash
# 分析最近的错误日志
tail -500 /var/log/app/error.log | claude -p "分析这些错误日志，找出最频繁的错误和可能的原因"

# 分析 Docker 容器日志
docker logs my-app --tail 200 2>&1 | claude -p "这个容器为什么在反复重启"

# 分析 CI 构建失败
cat build-output.log | claude -p "构建为什么失败了，怎么修"
```

`-p` 模式不会启动交互式会话，分析完直接输出结果到 stdout。适合集成进 shell 脚本或 CI pipeline。

## 自动写测试

让 Claude Code 为现有代码补测试：

```
> 给 src/services/auth.ts 写单元测试，覆盖正常登录、密码错误、账号锁定三个场景
```

Claude Code 会：
1. 读取 `auth.ts` 的实现代码和类型定义
2. 识别项目用的测试框架（Jest / Vitest / Mocha）
3. 生成测试文件 `auth.test.ts`
4. 自动跑 `npm test` 验证测试能通过

生成的测试不是随便写的 mock，Claude Code 会参考项目里已有的测试风格。如果你的测试都用 `describe/it` + `expect`，它不会突然切到 `test()` + `assert`。

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const result = await authService.login('user@test.com', 'correct-password');
      expect(result.token).toBeDefined();
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw on wrong password', async () => {
      await expect(
        authService.login('user@test.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw on locked account', async () => {
      await expect(
        authService.login('locked@test.com', 'any-password')
      ).rejects.toThrow('Account locked');
    });
  });
});
```

## 跑测试 + 自动修复

这个组合命令特别好用：

```
> 跑一下所有测试，失败的帮我修
```

Claude Code 执行 `npm test`，如果有失败的 case，它会读取测试代码和源代码，判断是测试写错了还是业务逻辑有 bug，然后修复对应的文件。修复后会自动重跑测试确认全绿。

## 排查性能问题

```
> src/pages/Dashboard.tsx 渲染很慢，帮我分析一下可能的原因
```

Claude Code 会检查常见的性能问题：不必要的 re-render、缺少 `useMemo`/`useCallback`、在渲染循环里发请求、大列表没做虚拟化等。给出具体的修改建议和代码。
