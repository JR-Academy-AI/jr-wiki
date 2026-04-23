---
title: "Cascade 调试排错实战"
wiki: "windsurf-guide"
order: 6
description: "用 Cascade 定位 Bug、修复报错、处理多文件问题的完整调试工作流"
---

## 调试的核心思路：让 Cascade 自己跑闭环

传统 debug 流程是你看报错、猜原因、改代码、再跑。Cascade 能把这个循环自动化——它跑命令、读报错、定位代码、改文件、再跑命令验证，直到通过。

![Windsurf Cascade 调试工作流](https://img.youtube.com/vi/bVNNvWq6dKo/maxresdefault.jpg)

关键操作：在 Cascade Code 模式下描述问题，让它自己动手。别切 Chat 模式只问"为什么报错"——直接让它修。

## 场景一：TypeScript 类型报错连环修

前端项目最常见的问题——改了一个接口定义，十几个文件跟着报错：

```typescript
// 你改了 User 接口，加了一个必填字段
interface User {
  id: string
  name: string
  email: string
  department: string  // 新加的字段
}

// 结果 12 个文件报 TS2741: Property 'department' is missing
```

跟 Cascade 说：

```
跑一下 tsc --noEmit，把所有类型报错都修了。
新加的 department 字段，现有数据没有的地方给默认值 "未分配"。
```

Cascade 会：
1. 在终端执行 `tsc --noEmit`
2. 解析所有报错，按文件分组
3. 逐个文件修复，添加默认值
4. 再跑一次 `tsc --noEmit` 确认全绿

一个 prompt 搞定本来要手动改 12 个文件的活。

## 场景二：API 联调排错

后端返回的数据结构和前端期望的不一样，页面白屏：

```bash
# 终端里能看到 console.error：
# TypeError: Cannot read properties of undefined (reading 'map')
#   at UserList (src/pages/UserList.tsx:24:31)
```

给 Cascade 的 prompt 要具体：

```
UserList 页面白屏了，终端报 Cannot read properties of undefined reading map。
看一下 API 返回的数据结构和前端代码的预期是不是对不上。
如果对不上，以 API 返回为准改前端代码。
```

Cascade 的处理逻辑：
1. 读 `UserList.tsx` 第 24 行附近的代码
2. 找到对应的 API 请求，检查返回数据的类型定义
3. 如果有 mock 数据或 API 文档（`.http` 文件、Swagger），一并参考
4. 修复前端的数据访问路径，加上空值保护

```typescript
// 修复前：假设 API 返回 { users: [...] }
const users = data.users.map(u => <UserCard key={u.id} user={u} />)

// 修复后：API 实际返回 { data: { items: [...] } }
const users = (data?.data?.items ?? []).map(u => <UserCard key={u.id} user={u} />)
```

## 场景三：测试失败批量修复

跑 `npm test` 或 `vitest`，一堆测试挂了。逐个修太慢，直接让 Cascade 批量处理：

```bash
# 在 Cascade 里说：
# "跑 vitest run，把失败的测试都修了。
#  如果是测试本身过时了就更新断言，
#  如果是业务代码的 bug 就修业务代码。"
```

Cascade 会区分两种情况：
- **测试过时**（你改了功能但没更新测试）→ 更新 `expect` 断言
- **真实 bug**（代码逻辑有问题）→ 修源码而不是测试

```typescript
// 测试过时的例子——Cascade 更新断言：
// 修复前
expect(formatPrice(100)).toBe('$100.00')
// 修复后（你改了 formatPrice 的货币符号逻辑）
expect(formatPrice(100)).toBe('A$100.00')

// 真实 bug 的例子——Cascade 修源码：
// calculateDiscount 返回负数的边界情况
export function calculateDiscount(price: number, rate: number): number {
  return Math.max(0, price * (1 - rate))  // 加了 Math.max 防负数
}
```

## 调试效率技巧

**缩小范围**：Cascade 上下文有限。别说"项目跑不起来帮我看看"，要说"src/api/auth.ts 的 login 函数返回 401，看看 token 生成逻辑"。

**给线索**：如果你已经猜到问题在哪，直接告诉 Cascade。"我怀疑是 middleware 的执行顺序问题"比"接口报错了"有效得多。

**用 checkpoint 兜底**：Cascade 改完代码后，先跑测试再 Accept。如果改坏了，点 Revert 回到上一个 checkpoint，换个思路重新 prompt。
