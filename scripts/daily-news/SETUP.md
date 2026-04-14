# 每日AI新闻抓取系统 · 安装说明

一个 Python 脚本：每天 3 点自动从 Google News RSS 抓 20 条新闻（10 全球 AI + 10 澳洲 IT/AI），
调 Claude Sonnet 4 生成中文一句话简介与 150 字摘要，落盘到 `~/news/news_YYYY_MM_DD.md`。

## 目录

```
scripts/daily-news/
├── fetch_news.py       # 主脚本
├── requirements.txt    # 依赖
└── SETUP.md            # 本文件
```

## 一步步跑起来

### 1. 确认 Python 版本

需要 Python 3.9+。

```bash
python3 --version
```

### 2. 建虚拟环境并装依赖

建议把虚拟环境放在 `~/news-venv`，之后 crontab 直接引用它。

```bash
python3 -m venv ~/news-venv
source ~/news-venv/bin/activate
pip install -r ~/jr-wiki/scripts/daily-news/requirements.txt
deactivate
```

（如果你的 jr-wiki 仓库不在 `~/jr-wiki`，把上面路径换掉即可。）

### 3. 准备 Anthropic API Key

到 https://console.anthropic.com/ 拿一个 `sk-ant-xxx` 形式的 key。**不要**写进代码里。

把它写入 `~/.news_env`，权限收紧，只有自己能读：

```bash
cat > ~/.news_env <<'EOF'
export ANTHROPIC_API_KEY="sk-ant-你的key"
EOF
chmod 600 ~/.news_env
```

### 4. 手动跑一次验证

```bash
source ~/.news_env
source ~/news-venv/bin/activate
python ~/jr-wiki/scripts/daily-news/fetch_news.py
deactivate
```

正常应看到：

```
[2026-04-14] 开始抓取 Google News RSS …
  全球 AI：拿到 10 条
  澳洲 IT/AI：拿到 10 条
调用 Claude 生成简介与摘要 …
完成：/home/you/news/news_2026_04_14.md  （全球 10 / 澳洲 10）
```

打开 `~/news/news_YYYY_MM_DD.md` 检查格式。

### 5. 装 crontab 每天 3 点跑

编辑当前用户 crontab：

```bash
crontab -e
```

追加以下一行（把 `<USER>` 换成你自己的用户名，或用 `$HOME` 变量；
crontab 里不要用 `~`，它不一定会被展开）：

```cron
0 3 * * * . $HOME/.news_env && $HOME/news-venv/bin/python $HOME/jr-wiki/scripts/daily-news/fetch_news.py >> $HOME/news/cron.log 2>&1
```

保存退出后确认：

```bash
crontab -l
```

### 6. 查日志

```bash
tail -f ~/news/cron.log
```

每条被跳过的新闻会留下 `[skip] #N 处理失败: ...` 行，方便事后排查。

## crontab 一键命令

如果想不开编辑器直接追加，可用：

```bash
( crontab -l 2>/dev/null; echo '0 3 * * * . $HOME/.news_env && $HOME/news-venv/bin/python $HOME/jr-wiki/scripts/daily-news/fetch_news.py >> $HOME/news/cron.log 2>&1' ) | crontab -
```

再核对：

```bash
crontab -l
```

## 常见问题

**Q: 抓到的条数少于 10？**
Google News RSS 本身就可能返回少于 10 条，属于正常。脚本会按实际条数写入。

**Q: 某条新闻处理失败怎么办？**
脚本单条 try/except，失败会在 stderr 打印 `[skip] ...` 跳过，其余继续生成。

**Q: 想改抓取数量 / 关键词 / 模型？**
打开 `fetch_news.py`，顶部 `配置` 区块可直接改 `MAX_PER_CATEGORY`、`GLOBAL_KEYWORDS`、`AU_KEYWORDS`、`MODEL`。

**Q: 想换时区？**
cron 用的是系统时区。`timedatectl` 可查看，`sudo timedatectl set-timezone Australia/Sydney` 可切换。

**Q: cron 不触发？**
1. `systemctl status cron`（或 `crond`）确认服务在跑；
2. `grep CRON /var/log/syslog` 看有没有被调度；
3. cron 环境极简，所有路径务必用绝对路径或 `$HOME`，不要用 `~`。
