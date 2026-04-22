---
title: "从 v0 到生产环境"
wiki: "v0-guide"
order: 8
description: "v0 生成的代码上线前要做什么：安全审查、性能优化、自定义域名、监控告警，附完整 checklist"
---

## v0 生成 ≠ 生产就绪

v0 能在 10 分钟生成一个能跑的应用，但"能跑"和"能上线"之间还有几步要走。AI 生成的代码可能有安全漏洞、性能问题、硬编码的测试数据。这一章是上线前的 checklist。

![Vercel 生产部署](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fdashboard-redesign.png&w=1920&q=75)

## 安全审查

v0 生成的代码经常在这些地方留坑，逐项检查：

```typescript
// ❌ v0 经常生成的问题代码
const res = await fetch(`/api/user/${userId}`)  // 没有权限校验

// ✅ 加上认证检查
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.id !== params.id) return Response.json({ error: 'Forbidden' }, { status: 403 })
  // ...
}
```

必查清单：

| 项目 | 检查内容 |
|------|---------|
| API 路由 | 每个路由都有认证和权限检查 |
| 环境变量 | 敏感 key 不在客户端代码里暴露（不带 `NEXT_PUBLIC_` 前缀） |
| SQL 注入 | 用 Supabase SDK 或 Prisma，不拼接 SQL 字符串 |
| XSS | `dangerouslySetInnerHTML` 的内容经过消毒处理 |
| CORS | API 路由只允许你的域名 |

## 性能优化

v0 默认不做性能优化。上线前至少检查这几项：

```typescript
// 1. 图片优化——用 next/image 替换 <img>
import Image from 'next/image'
<Image src="/hero.png" width={1200} height={600} alt="Hero" priority />

// 2. 动态导入——大组件按需加载
import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('@/components/chart'), { ssr: false })

// 3. 数据缓存——频繁请求的数据加 revalidate
export const revalidate = 3600 // 1 小时缓存

// 4. Metadata——SEO 必备
export const metadata = {
  title: '我的应用',
  description: '用 v0 构建的全栈应用',
  openGraph: { images: ['/og.png'] }
}
```

跑一次 Lighthouse 看分数。v0 生成的代码通常 Performance 在 70-85 分，经过上面的优化能到 90+。

```bash
# 本地构建后检查 bundle 大小
npm run build
# 关注 First Load JS 列，单个路由不要超过 200KB
```

## 自定义域名

v0 部署后默认给 `xxx.vercel.app` 域名。绑定自己的域名：

1. 在 v0 界面点 Deploy → Settings → Domains
2. 添加你的域名，比如 `app.yourcompany.com`
3. 在域名注册商（Cloudflare、阿里云等）添加 CNAME 记录指向 `cname.vercel-dns.com`
4. Vercel 自动申请 SSL 证书，几分钟后生效

```bash
# 验证 DNS 解析
dig app.yourcompany.com CNAME
# 应该返回 cname.vercel-dns.com

# 验证 SSL
curl -I https://app.yourcompany.com
# 应该返回 HTTP/2 200
```

## 监控与日志

生产环境必须能看到出了什么问题：

```typescript
// next.config.mjs — 开启 Vercel Analytics 和 Speed Insights
import { withVercelAnalytics } from '@vercel/analytics'

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: { fetches: { fullUrl: true } }
}

export default nextConfig
```

```bash
# Vercel CLI 查看生产日志
npx vercel logs --follow

# 查看最近的部署状态
npx vercel ls
```

在 Vercel Dashboard → Logs 可以实时看到 Serverless Function 的请求日志和错误。建议接入 Sentry 或 LogRocket 做错误追踪——v0 生成的代码不会自带这些。

## 上线 Checklist

```
□ 所有 API 路由有认证检查
□ 环境变量不暴露到客户端
□ 图片用 next/image 优化
□ Lighthouse Performance > 85
□ 自定义域名 + SSL 生效
□ 错误监控已接入
□ 备份数据库（Supabase Dashboard → Backups）
□ 去掉 v0 生成的 placeholder 数据和 Lorem ipsum
```
