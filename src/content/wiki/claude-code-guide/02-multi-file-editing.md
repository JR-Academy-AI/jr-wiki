---
title: "多文件编辑：Claude Code 的杀手锏"
wiki: "claude-code-guide"
order: 2
description: "一句话改 10 个文件，跨文件重构不再痛苦"
---

## 为什么多文件编辑重要

改一个接口名，可能涉及 controller、service、DTO、测试、前端调用 5+ 个文件。手动改容易漏，Claude Code 一次搞定。

## 实战：重命名一个 API

```
> 把 getUserList 改名为 fetchUsers，所有引用的地方都改掉
```

Claude Code 的执行流程：
1. 用 Grep 搜索所有引用 `getUserList` 的文件
2. 逐个文件用 Edit 工具替换
3. 检查 import 路径和类型定义是否需要调整
4. 展示所有修改的 diff，等你确认

你会看到类似这样的输出：

```
Modified 6 files:
  src/controllers/user.ts    - getUserList → fetchUsers
  src/services/user.ts       - getUserList → fetchUsers
  src/routes/api.ts          - getUserList → fetchUsers
  src/types/user.d.ts        - getUserList → fetchUsers
  tests/user.test.ts         - getUserList → fetchUsers (×3)
  src/pages/UserList.tsx     - getUserList → fetchUsers
```

每个文件修改前都会显示 diff，你确认后才会写入磁盘。

![Claude Code 多文件编辑 diff 视图](https://code.claude.com/images/multi-file-editing.png)

## 实战：批量加错误处理

```
> 检查 src/services/ 下所有 fetch 调用，没有 try-catch 的都加上，错误统一用 toast 提示
```

Claude Code 会扫描目录下所有文件，找到裸的 fetch 调用，统一包上错误处理：

```typescript
// 修改前
const data = await fetch('/api/users').then(r => r.json());

// 修改后
try {
  const data = await fetch('/api/users').then(r => r.json());
} catch (error) {
  toast.error('请求失败，请稍后重试');
  throw error;
}
```

这种跨文件的模式化修改，手动做要半小时，Claude Code 2 分钟。

## CLAUDE.md：控制修改行为

在项目根目录放一个 `CLAUDE.md`，写上你的规范。Claude Code 每次启动都会读这个文件：

```markdown
# CLAUDE.md
- 错误处理用 try-catch + toast.error()
- API 调用统一放 services/ 目录
- 组件用 TypeScript + styled-components
- 测试文件和源文件放同一目录，命名 xxx.test.ts
- commit message 用英文，格式: type(scope): description
```

这样 Claude Code 改代码时会自动遵守你定的规范，不用每次都提醒。团队成员共用同一份 `CLAUDE.md`，保证一致性。

## 避坑

- 改完后跑一遍 `tsc --noEmit` 确认类型没问题
- 如果修改涉及数据库 schema，Claude Code 不会自动帮你跑 migration
- 大量文件修改建议先开个 feature 分支，确认没问题再 merge
