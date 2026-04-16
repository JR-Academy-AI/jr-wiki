# 每日 AI 新闻自动抓取系统 —— 配置说明

每天凌晨 3 点自动抓取 20 条新闻（10 条全球 AI + 10 条澳洲 IT/AI），调用 Claude 生成中文简介与摘要，按日期保存到 `~/news/news_YYYY_MM_DD.md`。

---

## 一、前置要求

- Python 3.9 或以上
- 一个 Anthropic API Key（从 https://console.anthropic.com 申请）
- Linux/macOS（需要 `cron`；Windows 请用任务计划程序）

---

## 二、一步步配置

### 1. 把代码放到一个固定路径

建议放在 `~/daily-news-fetcher/`：

```bash
mkdir -p ~/daily-news-fetcher
cp daily_news.py requirements.txt ~/daily-news-fetcher/
cd ~/daily-news-fetcher
```

### 2. 创建并激活 Python 虚拟环境

```bash
cd ~/daily-news-fetcher
python3 -m venv .venv
source .venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置 API Key

把 API Key 写到 `~/.daily-news-fetcher.env`（单独一个文件，避免污染全局环境）：

```bash
cat > ~/.daily-news-fetcher.env <<'EOF'
export ANTHROPIC_API_KEY="sk-ant-api03-你的真实Key"
EOF
chmod 600 ~/.daily-news-fetcher.env
```

### 5. 手动跑一次，验证能正常生成

```bash
source ~/.daily-news-fetcher.env
source ~/daily-news-fetcher/.venv/bin/activate
python ~/daily-news-fetcher/daily_news.py
```

成功后应看到：

```
=== Wrote /home/<你>/news/news_YYYY_MM_DD.md (10 global + 10 AU) ===
```

并在 `~/news/` 下出现当日的 markdown 文件。

### 6. 配置 crontab（每天凌晨 3 点运行）

打开 crontab 编辑器：

```bash
crontab -e
```

粘贴下面这一行到最下面（**请把 `<你的用户名>` 替换为 `echo $HOME` 的实际值**）：

```cron
0 3 * * * bash -c 'source $HOME/.daily-news-fetcher.env && source $HOME/daily-news-fetcher/.venv/bin/activate && python $HOME/daily-news-fetcher/daily_news.py >> $HOME/news/daily_news.log 2>&1'
```

字段含义：`0 3 * * *` = 每天 03:00 运行。日志会追加写入 `~/news/daily_news.log`。

保存退出后，用下面的命令确认已生效：

```bash
crontab -l
```

### 7.（可选）让 cron 今晚就跑一次做测试

在 crontab 里临时加一行（把时间改成 2 分钟后），观察是否产生文件和日志：

```cron
*/2 * * * * bash -c 'source $HOME/.daily-news-fetcher.env && source $HOME/daily-news-fetcher/.venv/bin/activate && python $HOME/daily-news-fetcher/daily_news.py >> $HOME/news/daily_news.log 2>&1'
```

验证完记得删掉这一行，保留每日 3 点的那一行即可。

---

## 三、常见问题

| 现象 | 原因 / 排查 |
|------|--------|
| `ANTHROPIC_API_KEY environment variable is not set` | crontab 没有先 `source` 那个 env 文件，或 env 文件路径写错 |
| 只生成了 5 条澳洲新闻 | Google News 对澳洲关键词返回的条目本来就少，脚本会按抓到的数量输出；想要更多可以在 `daily_news.py` 里加新的 `AUSTRALIA_QUERIES` 关键词 |
| 某条新闻摘要生成失败 | 脚本会 `[SKIP]` 跳过，不影响整体运行；失败原因在 `daily_news.log` 里 |
| cron 没触发 | `systemctl status cron`（Ubuntu）/ `sudo launchctl list \| grep cron`（mac），确认 cron 守护进程在跑；macOS 还需在「系统设置 → 隐私与安全性 → 完全磁盘访问权限」里给 `cron` 授权 |
| 429 rate limit | anthropic SDK 会自动重试 2 次；如果还是超限，把 `daily_news.py` 里 `time.sleep(0.5)` 改成 `time.sleep(1.5)` |

---

## 四、文件清单

```
~/daily-news-fetcher/
├── daily_news.py         # 主脚本
├── requirements.txt      # Python 依赖
└── .venv/                # 虚拟环境（装依赖后生成）

~/.daily-news-fetcher.env # 只保存 ANTHROPIC_API_KEY，权限 600

~/news/
├── news_2026_04_16.md    # 每日生成
├── news_2026_04_17.md
└── daily_news.log        # cron 运行日志
```
