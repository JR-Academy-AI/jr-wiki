---
title: "监控告警与生产运维"
wiki: "n8n-workflow-automation"
order: 8
description: "生产环境的 n8n 怎么监控、怎么排错、怎么保证工作流不掉线"
---

![n8n 执行日志界面](https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/_images/advanced-ai/ai-intro-logs.png)

工作流上了生产，最怕的不是报错——是悄悄失败没人知道。这章讲怎么建一套监控体系，让问题第一时间暴露。

## 执行历史与日志

n8n 默认保存所有执行记录，包括每个节点的输入输出。但时间长了数据库会膨胀，生产环境要做取舍：

```bash
# docker-compose.yml 环境变量
EXECUTIONS_DATA_MAX_AGE=168           # 只保留 7 天（单位：小时）
EXECUTIONS_DATA_PRUNE=true            # 自动清理过期记录
EXECUTIONS_DATA_SAVE_ON_ERROR=all     # 失败的全部保存
EXECUTIONS_DATA_SAVE_ON_SUCCESS=none  # 成功的不保存（省空间）
EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true  # 手动测试的保存
```

这套配置适合大多数场景：成功的不存（反正跑得好不需要看），失败的全存方便排查。

## 告警工作流

创建一个专门的 **Error Workflow**，所有生产工作流的 Settings → Error Workflow 都指向它：

```javascript
// Error Workflow 的 Code 节点：格式化报警内容
const error = $json;
const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Australia/Sydney' });

const alert = {
  title: `⚠️ 工作流失败: ${error.workflow.name}`,
  content: [
    `**时间**: ${timestamp}`,
    `**错误**: ${error.execution.error.message}`,
    `**节点**: ${error.execution.lastNodeExecuted}`,
    `**执行ID**: ${error.execution.id}`,
    `**链接**: ${error.execution.url}`
  ].join('\n')
};

return [{ json: alert }];
```

后面接 Slack 或飞书 Webhook 节点把 alert 推出去。报警内容包含执行链接，点开就能看到完整的节点级别调试信息。

## 健康检查

n8n 本身暴露了 `/healthz` 端点，返回 `{ status: "ok" }`。配合外部监控：

```bash
# 用 uptime-kuma 或任何 HTTP 监控工具
curl -s https://n8n.yourcompany.com/healthz | jq .status
# 输出: "ok"

# 或者用 Docker 自带的 healthcheck
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/healthz"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

`/healthz` 只检测 n8n 进程是否存活，不检测数据库连接。如果需要更深层的检查，写一个定时工作流去 ping 数据库，失败就报警。

## 常见生产问题排查

**问题：Webhook 触发不了**

90% 是 `WEBHOOK_URL` 没配对。n8n 在容器里跑时，Webhook 的对外地址不是 `localhost:5678`，要设成实际域名：

```bash
WEBHOOK_URL=https://n8n.yourcompany.com
```

检查方法：打开任意 Webhook 节点，看底部显示的 URL 是不是你期望的域名。

**问题：工作流跑着跑着内存爆了**

通常是 Loop Over Items 处理了几万条数据，全部 items 堆在内存里。解决方案：

1. 在 Loop 前用 Code 节点做分批（batch），每批 500 条
2. 开启 `N8N_DEFAULT_BINARY_DATA_MODE=filesystem`，让大文件写磁盘不占内存
3. 给容器设内存上限 `mem_limit: 2g`，OOM 比卡死好排查

**问题：定时工作流漏跑**

Schedule Trigger 依赖 n8n 进程在线。如果在 Cron 触发时 n8n 正在重启，这次执行就丢了。应对：

1. 用 Queue Mode（Redis），任务持久化不丢
2. 或者用外部 Cron（系统 crontab / GitHub Actions）通过 Webhook 触发，比 n8n 内置的 Schedule 更可靠

## 备份策略

```bash
#!/bin/bash
# 每天凌晨 2 点跑，crontab: 0 2 * * * /opt/scripts/backup-n8n.sh
DATE=$(TZ='Australia/Sydney' date +%Y-%m-%d)
BACKUP_DIR="/backups/n8n/${DATE}"
mkdir -p "$BACKUP_DIR"

docker exec n8n n8n export:workflow --all --output=/tmp/workflows.json
docker exec n8n n8n export:credentials --all --output=/tmp/credentials.json
docker cp n8n:/tmp/workflows.json "$BACKUP_DIR/"
docker cp n8n:/tmp/credentials.json "$BACKUP_DIR/"

# 只保留最近 30 天
find /backups/n8n -maxdepth 1 -mtime +30 -exec rm -rf {} +

echo "[$DATE] n8n backup done: $(ls $BACKUP_DIR | wc -l) files"
```

Credential 的导出文件包含加密后的密钥，恢复时需要同一个 `N8N_ENCRYPTION_KEY`。换机器部署前先把这个 key 备份好。
