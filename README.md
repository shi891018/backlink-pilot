# 🔗 Backlink Pilot

**一条命令提交外链的自动化工具。**

给独立开发者用的。配置一次你的产品信息，然后自动提交到目录站、awesome-list、搜索引擎。

> 这个工具是 AI Agent（[OpenClaw](https://openclaw.ai)）在实际外链推广中写出来的，30+ 个站点实战验证，8 个站点适配器。

---

## 这个工具适合谁？

| 你是谁 | 怎么用 | 看哪部分 |
|--------|--------|---------|
| 🎯 不写代码，想了解外链策略 | 直接看策略篇，手动提交也能用 | [策略篇](#-策略篇不写代码也能用) |
| 🤖 有 OpenClaw，想让 Agent 自动提交 | 装好 skill，跟 Agent 说话就行 | [Agent 篇](#-agent-篇openclaw-用户) |
| 🔧 会写代码，想定制或贡献 | 改源码，写新站点适配器 | [开发者篇](#-开发者篇改源码) |

---

# 🎯 策略篇（不写代码也能用）

## 外链是什么？为什么要做？

Google 排名的底层逻辑：**别的网站链接到你 = 给你投票**。票越多、来源越权威，排名越高。

"外链"就是让别的网站放上你的链接。

## 值得提交的渠道（按投入产出比排序）

### 🥇 GitHub awesome-list —— 最高效

GitHub 上有很多"awesome-xxx"仓库（精选资源列表）。比如 awesome-cloudflare 有 12k stars，awesome-indie 有 10k stars。

**做法：** 去仓库提一个 Issue，说"请把我的项目加上"。维护者审核通过就永久收录。

**成本：** 0 元。每个 5 分钟。

### 🥈 免费目录站

AI 工具目录、SaaS 目录、独立开发者导航站。填个表就能提交。

**实测好用的：**

| 站点 | 说明 | 审核速度 | 适配器 |
|------|------|---------|--------|
| SaaSHub | SaaS 目录 | 当天批准 | ✅ `saashub` |
| submitaitools.org | AI 工具目录 (DA 73) | 1-3 天 | ✅ `submitaitools` |
| toolverto.com | 工具目录 | 1-3 天 | ✅ `toolverto` |
| uneed.best | 工具目录 (DR 72) | 排队中 | ✅ `uneed` |
| bai.tools | AI 工具目录 | ~30 天 | ✅ `baitools` |
| 600.tools | 工具目录，3 dofollow | 1-3 天 | ✅ `600tools` |
| Dang.ai | AI 目录 (DA 35) | 3-4 周 | ✅ `dangai` |
| Startup88 | 创业目录 (DA 34) | 1-2 周 | ✅ `startup88` |
| StartupStash | 创业资源目录 | 1-2 周 | ⚡ Typeform |
| CurateClick | 精选工具目录 | 1 周 | ⚡ 手动 |

### 🥉 社区（必须手动）

Hacker News (Show HN)、Reddit、V2EX。**不能自动化**，只能自己发。

### ❌ 避坑

| 站点 | 坑 |
|------|-----|
| IndieHub | 看起来免费，发布要 $4.9 |
| OpenHunts | 免费排队 51 周 |
| toolify.ai | 提交要 $99 |
| Product Hunt | 有反爬机制，只能手动 |

## 提交节奏

- 不同站点之间隔 1-3 分钟
- 一天提 5-10 个就够了
- **同一产品不要重复提交到同一站点**

**核心原则：先看看站点要不要钱，再注册账号。**

---

# 🤖 Agent 篇（OpenClaw 用户）

**前置条件：你已经跑起了 [OpenClaw](https://openclaw.ai)。**

## 第 1 步：安装

在 OpenClaw 所在机器上跑：

```bash
cd ~/Downloads
git clone https://github.com/s87343472/backlink-pilot.git
cd backlink-pilot
npm install
```

> ⚠️ 首次 `npm install` 会下载 Chromium（~150MB）。中国大陆可能需要代理。

## 第 2 步：链接到 OpenClaw

```bash
ln -s ~/Downloads/backlink-pilot ~/.openclaw/skills/backlink-pilot
```

重启 OpenClaw，它会自动发现这个 skill。

## 第 3 步：配置你的产品

```bash
cd ~/Downloads/backlink-pilot
cp config.example.yaml config.yaml
```

编辑 `config.yaml`：

```yaml
product:
  name: "你的产品名"
  url: "https://你的网站.com"
  description: "一句话描述，160 字以内"
  long_description: |
    详细描述，给需要长文本的站点用。
  email: "你的邮箱@example.com"
  categories:
    - developer-tools
  pricing: free

# 需要登录的站点（可选）
credentials:
  saashub:
    email: "注册邮箱"
    password: "密码"
```

> ⚠️ config.yaml 包含密码，已被 .gitignore 排除，不会上传到 git。

## 第 4 步：跟 Agent 说话

现在你可以直接用中文指挥 Agent：

**侦察站点：**
> "帮我看看 https://some-directory.com 能不能自动提交"

**提交：**
> "帮我提交到 submitaitools"

**批量提交（Agent 会自己控制节奏）：**
> "帮我提交到 submitaitools、toolverto、saashub，每个隔 2 分钟"

**生成 awesome-list Issue：**
> "生成 awesome-cloudflare 的提交内容"

**查看进度：**
> "外链提交情况怎么样了"

**就这样。你说中文，Agent 执行。**

## 也可以手动跑命令

不想通过 Agent 也行，直接跑 CLI：

```bash
cd ~/Downloads/backlink-pilot

# 侦察
node src/cli.js scout https://new-site.com --deep

# 提交
node src/cli.js submit submitaitools
node src/cli.js submit toolverto

# 生成 awesome-list Issue
node src/cli.js awesome awesome-cloudflare

# 通知搜索引擎
node src/cli.js indexnow https://你的网站.com

# 看提交记录
node src/cli.js status
```

---

# 🔧 开发者篇（改源码）

## 项目结构

```
backlink-pilot/
├── config.example.yaml    ← 配置模板
├── SKILL.md               ← OpenClaw 调用指南
├── TROUBLESHOOTING.md     ← 20+ 站点踩坑记录
├── src/
│   ├── cli.js             ← CLI 入口
│   ├── browser.js         ← 隐身浏览器（rebrowser-playwright）
│   ├── captcha.js         ← 验证码自动解
│   ├── config.js          ← 配置加载 + UTM 生成
│   ├── submit.js          ← 提交调度（自动匹配适配器）
│   ├── tracker.js         ← 提交记录（YAML）
│   ├── indexnow.js        ← 搜索引擎通知
│   ├── sites/             ← 站点适配器（每站一个文件）
│   │   ├── submitaitools.js   ← 带颜色验证码自动解
│   │   ├── toolverto.js       ← 最简单的，3 个字段
│   │   ├── saashub.js         ← 需要登录
│   │   ├── uneed.js           ← 需要登录
│   │   └── baitools.js        ← Google OAuth
│   ├── scout/
│   │   └── discover.js    ← 站点侦察
│   └── awesome/
│       └── templates.js   ← awesome-list Issue 生成（10 个仓库）
```

## 给新站点写适配器：3 步

### 1. 侦察表单字段

```bash
node src/cli.js scout https://new-site.com --deep
```

输出示例：
```
📝 Form 1 (4 fields):
  * [text] tool_name
  * [url] tool_url
    [textarea] tool_desc
    [email] contact
```

### 2. 写适配器

创建 `src/sites/newsite.js`：

```javascript
import { withBrowser, delay } from '../browser.js';
import { solveColorCaptcha } from '../captcha.js';

export default {
  name: 'new-site.com',
  url: 'https://new-site.com/submit',
  auth: 'none',    // none | email | oauth
  captcha: 'none', // none | color

  async submit(product, config) {
    return withBrowser(config, async ({ page }) => {
      await page.goto('https://new-site.com/submit', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await delay(1500);

      // 字段名从 scout 拿到的
      await page.fill('input[name="tool_name"]', product.name);
      await page.fill('input[name="tool_url"]', product.utm_url);
      await page.fill('textarea[name="tool_desc"]', product.description);
      await page.fill('input[name="contact"]', product.email);

      await solveColorCaptcha(page); // 有验证码就解
      await page.click('button[type="submit"]');
      await delay(3000);

      const body = await page.textContent('body');
      return {
        url: page.url(),
        confirmation: /thank|success/i.test(body) ? '成功' : '需手动确认',
      };
    });
  },
};
```

### 3. 用

```bash
node src/cli.js submit newsite
```

## 技术要点

### 为什么用 rebrowser 不用普通 Playwright？

普通 Playwright 的 `navigator.webdriver = true`，一查就知道是机器人。rebrowser 在 Chromium 编译层面改掉了。13 个站测试 69% 通过率。

### 验证码怎么解的？

一些站用颜色验证码："点击 **teal** 颜色的按钮"。不是 AI 识图，就是字符串匹配：读文字 → 提取颜色 → 点按钮。100% 成功率。

### 什么过不去？

- **Cloudflare Challenge**（"正在检查您的浏览器"）—— 硬墙
- **Cloudflare Turnstile** —— 硬墙
- **Reddit 网络层封杀** —— 无解

遇到就跳过，标记手动。

> 完整踩坑记录：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Contributing

欢迎 PR：
- 新站点适配器
- 验证码解法改进
- Bug 修复

## License

MIT

## Credits

Built with [OpenClaw](https://openclaw.ai). Browser automation by [rebrowser-playwright](https://github.com/nickthecoder/rebrowser-playwright).
