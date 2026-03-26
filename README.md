# 🔗 Backlink Pilot

**One config, one command. Automated backlink submission for indie products.**

[English](#english) · [中文](#中文)

---

<a id="english"></a>

## What is this?

Backlink Pilot automates submitting your product to directory sites, awesome-lists, and search engines. Built by an AI Agent during real-world link building campaigns — battle-tested on 30+ sites.

**v2.0: Now supports [bb-browser](https://github.com/epiral/bb-browser) as execution engine — uses your real Chrome browser, bypasses anti-bot detection, Cloudflare, and OAuth issues.**

## Who is this for?

| You | How to use | Section |
|-----|-----------|---------|
| 🎯 Non-technical, want link building strategy | Read the strategy section, submit manually | [Strategy](#strategy) |
| 🤖 Have OpenClaw, want AI agent to auto-submit | Install skill, talk to Agent | [Agent](#agent-openclaw-users) |
| 🔧 Developer, want to customize | Modify source, write new adapters | [Developer](#developer) |

---

## Strategy

### Why backlinks matter

Google ranking logic: **other sites linking to you = votes for you**. More votes from authoritative sources = higher ranking.

### Best channels (by ROI)

#### 🥇 GitHub awesome-lists — highest ROI

Curated resource lists with thousands of stars. Submit an Issue, get permanently listed.

**Cost:** $0. **Time:** 5 min each.

#### 🥈 Free directory sites

| Site | Notes | Review time | Adapter |
|------|-------|-------------|---------|
| SaaSHub | SaaS directory | Same day | ✅ `saashub` |
| submitaitools.org | AI tools (DA 73) | 1-3 days | ✅ `submitaitools` |
| toolverto.com | Tools directory | 1-3 days | ✅ `toolverto` |
| uneed.best | Tools (DR 72) | Queued | ✅ `uneed` |
| 600.tools | 3 dofollow links | 1-3 days | ✅ `600tools` |
| Dang.ai | AI directory (DA 35) | 3-4 weeks | ✅ `dangai` |
| Startup88 | Startup directory | 1-2 weeks | ✅ `startup88` |

#### ❌ Avoid

| Site | Issue |
|------|-------|
| IndieHub | Looks free, costs $4.9 to publish |
| OpenHunts | Free queue is 51 weeks |
| toolify.ai | $99 to submit |
| Product Hunt | Anti-bot, manual only |

### Submission pace

- 1-3 min between different sites
- 5-10 submissions per day
- **Never submit the same product to the same site twice**

---

## Agent (OpenClaw users)

### Install

```bash
cd ~/Downloads
git clone https://github.com/s87343472/backlink-pilot.git
cd backlink-pilot && npm install
ln -s ~/Downloads/backlink-pilot ~/.openclaw/skills/backlink-pilot
```

### Configure

```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your product details
```

### Talk to Agent

- "Submit to submitaitools" → auto-submits
- "Scout https://some-directory.com" → discovers form fields
- "Generate awesome-cloudflare submission" → creates Issue body
- "Show backlink status" → shows progress

---

## Developer

### Engine Options (v2.0)

| Engine | Setup | Pros |
|--------|-------|------|
| **playwright** (default) | `npm install` | No extension needed |
| **bb-browser** (recommended) | `npm install -g bb-browser` + Chrome extension | Real browser, invisible to anti-bot, no Cloudflare/OAuth issues |

```yaml
# config.yaml
browser:
  engine: bb    # or: playwright

bb_browser:
  auto_update: true
  update_interval_hours: 24
```

### Commands

```bash
# Scout a site
node src/cli.js scout https://new-site.com --deep

# Submit to known site
node src/cli.js submit submitaitools
node src/cli.js submit submitaitools --engine bb    # use real Chrome

# Generic submit to ANY directory (bb-browser)
node src/cli.js submit https://any-directory.com/submit

# Awesome-list Issue
node src/cli.js awesome awesome-cloudflare

# Ping search engines
node src/cli.js indexnow https://your-site.com

# Batch blog comments
node src/batch-submit.js --limit 10
node src/batch-submit.js --limit 10 --engine bb     # use real Chrome

# Check status
node src/cli.js status

# Update bb-browser community adapters
node src/cli.js bb-update
```

### Project Structure

```
backlink-pilot/
├── config.example.yaml
├── SKILL.md              ← Agent skill definition
├── adapters.md            ← Site adapters & awesome-list targets
├── TROUBLESHOOTING.md     ← 20+ site debugging notes
├── src/
│   ├── cli.js             ← CLI entry point
│   ├── browser.js         ← Dual-engine: playwright + bb-browser
│   ├── bb.js              ← bb-browser wrapper (BbPage API)
│   ├── bb-update.js       ← Auto-update bb-browser adapters
│   ├── submit.js          ← Submission dispatcher
│   ├── batch-submit.js    ← Batch blog comment submitter
│   ├── config.js          ← Config loader + UTM
│   ├── tracker.js         ← Submission tracking
│   ├── captcha.js         ← CAPTCHA solvers
│   ├── indexnow.js        ← Search engine ping
│   ├── sites/             ← Site adapters
│   │   ├── generic.js     ← Universal adapter (bb-browser)
│   │   ├── submitaitools.js
│   │   ├── toolverto.js
│   │   └── ...
│   ├── scout/
│   │   └── discover.js    ← Form field discovery
│   └── awesome/
│       └── templates.js   ← Awesome-list Issue generator
```

### Writing a new adapter

1. Scout: `node src/cli.js scout https://new-site.com --deep`
2. Create `src/sites/newsite.js`:

```javascript
import { withBrowser, delay } from '../browser.js';

export default {
  name: 'new-site.com',
  url: 'https://new-site.com/submit',
  auth: 'none',
  captcha: 'none',
  engine: 'bb',  // optional: force bb-browser

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      await page.goto('https://new-site.com/submit', { waitUntil: 'networkidle' });
      await page.fill('input[name="tool_name"]', product.name);
      await page.fill('input[name="tool_url"]', product.utm_url);
      await page.click('button[type="submit"]');
      await delay(3000);
      return { url: page.url(), confirmation: 'Submitted' };
    });
  },
};
```

3. Run: `node src/cli.js submit newsite`

Or skip the adapter entirely — use generic submission:

```bash
node src/cli.js submit https://new-site.com/submit --engine bb
```

### Technical notes

- **rebrowser-playwright** patches `navigator.webdriver` at Chromium compile level. 69% success rate across 13 sites.
- **bb-browser** uses your real Chrome — 100% invisible, no fingerprint issues.
- Hard walls (playwright): Cloudflare Challenge/Turnstile, Reddit network block → use `--engine bb` or skip.
- Color CAPTCHA solved via text extraction + button matching (100% success rate).

---

## Contributing

PRs welcome:
- New site adapters
- CAPTCHA solver improvements
- Bug fixes

## License

MIT

## Credits

Built with [OpenClaw](https://openclaw.ai). Browser automation by [rebrowser-playwright](https://github.com/nickthecoder/rebrowser-playwright) and [bb-browser](https://github.com/epiral/bb-browser).

---

<a id="中文"></a>

# 中文版

**一条命令提交外链的自动化工具。**

给独立开发者用的。配置一次你的产品信息，然后自动提交到目录站、awesome-list、搜索引擎。

**v2.0：支持 [bb-browser](https://github.com/epiral/bb-browser) 执行引擎 — 用你的真实 Chrome 浏览器，绕过反爬、Cloudflare、OAuth 问题。**

> 这个工具是 AI Agent（[OpenClaw](https://openclaw.ai)）在实际外链推广中写出来的，30+ 个站点实战验证。

## 这个工具适合谁？

| 你是谁 | 怎么用 | 看哪部分 |
|--------|--------|---------|
| 🎯 不写代码，想了解外链策略 | 直接看策略篇，手动提交也能用 | [策略篇](#策略篇) |
| 🤖 有 OpenClaw，想让 Agent 自动提交 | 装好 skill，跟 Agent 说话就行 | [Agent 篇](#agent-篇) |
| 🔧 会写代码，想定制或贡献 | 改源码，写新站点适配器 | [开发者篇](#开发者篇) |

---

<a id="策略篇"></a>

## 策略篇

### 外链是什么？为什么要做？

Google 排名的底层逻辑：**别的网站链接到你 = 给你投票**。票越多、来源越权威，排名越高。

### 值得提交的渠道

#### 🥇 GitHub awesome-list — 最高效

GitHub 上有很多"awesome-xxx"仓库（精选资源列表）。提一个 Issue，维护者审核通过就永久收录。

**成本：** 0 元。每个 5 分钟。

#### 🥈 免费目录站

| 站点 | 说明 | 审核速度 | 适配器 |
|------|------|---------|--------|
| SaaSHub | SaaS 目录 | 当天批准 | ✅ `saashub` |
| submitaitools.org | AI 工具目录 (DA 73) | 1-3 天 | ✅ `submitaitools` |
| toolverto.com | 工具目录 | 1-3 天 | ✅ `toolverto` |
| uneed.best | 工具目录 (DR 72) | 排队中 | ✅ `uneed` |
| 600.tools | 工具目录，3 dofollow | 1-3 天 | ✅ `600tools` |
| Dang.ai | AI 目录 (DA 35) | 3-4 周 | ✅ `dangai` |
| Startup88 | 创业目录 (DA 34) | 1-2 周 | ✅ `startup88` |

#### ❌ 避坑

| 站点 | 坑 |
|------|-----|
| IndieHub | 看起来免费，发布要 $4.9 |
| OpenHunts | 免费排队 51 周 |
| toolify.ai | 提交要 $99 |
| Product Hunt | 有反爬机制，只能手动 |

### 提交节奏

- 不同站点之间隔 1-3 分钟
- 一天提 5-10 个就够了
- **同一产品不要重复提交到同一站点**

---

<a id="agent-篇"></a>

## Agent 篇

### 安装

```bash
cd ~/Downloads
git clone https://github.com/s87343472/backlink-pilot.git
cd backlink-pilot && npm install
ln -s ~/Downloads/backlink-pilot ~/.openclaw/skills/backlink-pilot
```

### 配置

```bash
cp config.example.yaml config.yaml
# 编辑 config.yaml 填入产品信息
```

### 跟 Agent 说话

- "帮我提交到 submitaitools" → 自动提交
- "帮我看看 https://some-directory.com 能不能自动提交" → 侦察站点
- "生成 awesome-cloudflare 的提交内容" → 生成 Issue
- "外链提交情况怎么样了" → 查看进度

---

<a id="开发者篇"></a>

## 开发者篇

### 引擎选择 (v2.0)

| 引擎 | 安装 | 优势 |
|------|------|------|
| **playwright** (默认) | `npm install` | 不需要浏览器插件 |
| **bb-browser** (推荐) | `npm install -g bb-browser` + Chrome 插件 | 真实浏览器，反爬无感，无 Cloudflare/OAuth 问题 |

```yaml
# config.yaml
browser:
  engine: bb    # 或 playwright

bb_browser:
  auto_update: true
  update_interval_hours: 24
```

### 命令速查

```bash
# 侦察
node src/cli.js scout https://new-site.com --deep

# 提交到已有适配器
node src/cli.js submit submitaitools
node src/cli.js submit submitaitools --engine bb    # 用真实 Chrome

# 通用提交（任何目录站，需要 bb-browser）
node src/cli.js submit https://any-directory.com/submit

# awesome-list Issue
node src/cli.js awesome awesome-cloudflare

# 通知搜索引擎
node src/cli.js indexnow https://你的网站.com

# 批量博客评论
node src/batch-submit.js --limit 10
node src/batch-submit.js --limit 10 --engine bb

# 查看记录
node src/cli.js status

# 更新 bb-browser 社区适配器
node src/cli.js bb-update
```

### 批量博客评论

除了目录站，还支持批量在博客评论区留下网站链接（通过评论表单的 Website 字段）。

**设计要点：**
- URL 放 Website 字段，不放评论正文
- 20 条评论模板随机轮换
- 5 个 Persona 轮换
- 全局去重（`logs/global-history.json`）
- 自动跳过有验证码、评论已关闭的页面

```bash
# 试跑
node src/batch-submit.js --dry-run --limit 5

# 真跑
node src/batch-submit.js --limit 10 --site 0
```

### 写新适配器

1. 侦察：`node src/cli.js scout https://new-site.com --deep`
2. 创建 `src/sites/newsite.js`（参考 adapters.md 模板）
3. 运行：`node src/cli.js submit newsite`

或者直接用通用适配器，不用写代码：

```bash
node src/cli.js submit https://new-site.com/submit --engine bb
```

### 技术要点

- **rebrowser-playwright** 在 Chromium 编译层面改掉 `navigator.webdriver`，13 个站测试 69% 通过率
- **bb-browser** 用你的真实 Chrome，100% 隐身
- Cloudflare Challenge/Turnstile 对 playwright 是硬墙 → 用 `--engine bb` 或跳过
- 颜色验证码：文字提取 + 按钮匹配，100% 成功率

> 完整踩坑记录：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Contributing

欢迎 PR：新站点适配器、验证码解法改进、Bug 修复。

## License

MIT

## Credits

Built with [OpenClaw](https://openclaw.ai). Browser automation by [rebrowser-playwright](https://github.com/nickthecoder/rebrowser-playwright) and [bb-browser](https://github.com/epiral/bb-browser).
