// bb.js — bb-browser execution layer
// Wraps bb-browser CLI as subprocess calls, exposes Playwright-like page API

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

let _bbTimeout = 30000;

function setBbTimeout(ms) {
  if (ms && ms > 0) _bbTimeout = ms;
}

// On Windows, execFileSync can't run .cmd files (EINVAL).
// Find bb-browser's actual cli.js and invoke via node, or fall back to execSync.
function resolveBbCliPath() {
  if (process.platform !== 'win32') return null;
  const candidates = [
    process.env.APPDATA && `${process.env.APPDATA}\\npm\\node_modules\\bb-browser\\dist\\cli.js`,
    // npm prefix -g fallback
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

const BB_CLI_PATH = resolveBbCliPath();

function bb(...args) {
  try {
    if (BB_CLI_PATH) {
      // Windows: invoke bb-browser cli.js via node directly (avoids .cmd EINVAL issue)
      return execFileSync(process.execPath, [BB_CLI_PATH, ...args], {
        encoding: 'utf-8',
        timeout: _bbTimeout,
      }).trim();
    }
    return execFileSync('bb-browser', args, {
      encoding: 'utf-8',
      timeout: _bbTimeout,
    }).trim();
  } catch (e) {
    const msg = e.stderr?.trim() || e.message;
    if (msg.includes('ECONNREFUSED') || msg.includes('No page target') || msg.includes('connect')) {
      throw new Error(
        `bb-browser cannot connect to Chrome. Make sure it is running:\n` +
        `  1. Run: bb-browser status\n` +
        `  2. If no Chrome is running: bb-browser open about:blank\n` +
        `  3. Try again`
      );
    }
    if (msg.includes('超时') || msg.includes('timeout') || msg.includes('ETIMEDOUT') || e.killed) {
      throw new Error(
        `bb-browser command timed out (${args.join(' ')}). Chrome may be unresponsive.\n` +
        `  Try: kill the Chrome process and restart with bb-browser open about:blank`
      );
    }
    throw new Error(`bb-browser ${args[0]}: ${msg}`);
  }
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/**
 * Check if bb-browser is available on the system
 */
export function isBbAvailable() {
  if (BB_CLI_PATH) return true;
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    execFileSync(cmd, ['bb-browser'], { encoding: 'utf-8' });
    return true;
  } catch { return false; }
}

/**
 * Playwright-like page wrapper around bb-browser CLI
 */
export class BbPage {
  constructor(config = {}) {
    this._config = config;
    this._tabIdx = null;
    this._openedTabs = []; // track tab indices for cleanup

    // Apply timeout from config
    if (config.browser?.timeout) setBbTimeout(config.browser.timeout);

    // Verify Chrome is reachable — use 'tab list' instead of 'status'
    // because 'status' can return "running" even when commands timeout
    try {
      bb('tab', 'list');
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('超时') || msg.includes('timeout') || msg.includes('Timeout')) {
        throw new Error(
          `bb-browser Chrome is not responding (commands timeout).\n` +
          `  Try restarting Chrome:\n` +
          `    1. Kill the managed Chrome: kill $(cat ~/.bb-browser/browser/cdp-port 2>/dev/null && lsof -ti :19825)\n` +
          `    2. Relaunch: bb-browser open about:blank\n` +
          `    3. Retry your command.`
        );
      }
      throw new Error(
        `bb-browser Chrome is not running.\n` +
        `  Start it with: bb-browser open about:blank\n` +
        `  Then retry your command.`
      );
    }
  }

  /** Run bb-browser command, automatically targeting this session's tab via --tab */
  _bb(...args) {
    if (this._tabIdx !== null && this._tabIdx !== undefined) {
      return bb('--tab', String(this._tabIdx), ...args);
    }
    return bb(...args);
  }

  async goto(url, _opts = {}) {
    bb('open', url, '--tab');
    // Wait for page to settle before querying tab list
    await new Promise(r => setTimeout(r, 2500));

    // Find the new tab's index from the live tab list
    // Output format: "* [2] https://example.com - Page Title"  (* = active/current)
    const list = bb('tab', 'list');

    // 1. Active tab (marked with *) is always the newly opened tab
    const activeLine = list.split('\n').find(l => l.trimStart().startsWith('*'));
    if (activeLine) {
      const m = activeLine.match(/\[(\d+)\]/);
      if (m) {
        const tabIdx = parseInt(m[1]);
        this._tabIdx = tabIdx;
        if (!this._openedTabs.includes(tabIdx)) this._openedTabs.push(tabIdx);
        return;
      }
    }

    // 2. Fallback: highest index (newest tab)
    const entries = [...list.matchAll(/\[(\d+)\]/g)];
    if (entries.length) {
      const tabIdx = Math.max(...entries.map(m => parseInt(m[1])));
      this._tabIdx = tabIdx;
      if (!this._openedTabs.includes(tabIdx)) this._openedTabs.push(tabIdx);
    }
  }

  /**
   * Close all tabs opened during this session
   */
  async cleanup() {
    // Close in reverse order to avoid index shifting
    for (const tabIdx of [...this._openedTabs].reverse()) {
      try { bb('tab', 'close', String(tabIdx)); } catch {}
    }
    this._openedTabs = [];
  }

  async fill(selectorOrRef, value) {
    if (selectorOrRef.startsWith('@')) {
      this._bb('fill', selectorOrRef, value);
    } else {
      // CSS selector — find element via eval, then use ref from snapshot
      const ref = await this._resolveRef(selectorOrRef);
      if (ref) this._bb('fill', ref, value);
      else throw new Error(`Element not found: ${selectorOrRef}`);
    }
  }

  async click(selectorOrRef) {
    if (selectorOrRef.startsWith('@')) {
      this._bb('click', selectorOrRef);
    } else {
      // CSS selector — use evalClick with full user-event simulation
      // This dispatches mousedown/mouseup/click to work with React/Vue components
      await this.evalClickReal(selectorOrRef);
    }
  }

  /**
   * Check a checkbox/radio by ref or CSS selector.
   * Uses JavaScript to force-set checked=true and dispatch change event,
   * which is more reliable than a synthetic click for some form frameworks.
   */
  async check(selectorOrRef) {
    let js;
    if (selectorOrRef.startsWith('@')) {
      // bb-browser click works for most checkboxes; if not checked yet, force via eval
      this._bb('click', selectorOrRef);
      await new Promise(r => setTimeout(r, 200));
    } else {
      js = `(function(){
        var el = document.querySelector('${escapeJs(selectorOrRef)}');
        if (el && !el.checked) {
          el.checked = true;
          el.dispatchEvent(new Event('change', {bubbles:true}));
          el.dispatchEvent(new Event('click', {bubbles:true}));
        }
      })()`;
      this._bb('eval', js);
    }
  }

  async type(selectorOrRef, text, _opts = {}) {
    // bb-browser fill handles typing in real browser
    await this.fill(selectorOrRef, text);
  }

  async textContent(selector) {
    return this._bb('eval', `document.querySelector('${escapeJs(selector)}')?.textContent || ''`);
  }

  async content() {
    return this._bb('eval', 'document.documentElement.outerHTML');
  }

  url() {
    return this._bb('eval', 'window.location.href');
  }

  async screenshot(path) {
    if (path) this._bb('screenshot', path);
    else this._bb('screenshot');
  }

  /**
   * Get interactive snapshot — returns parsed accessibility tree text
   */
  async snapshot() {
    return this._bb('snapshot', '-i');
  }

  /**
   * Playwright-compatible $(selector) — returns BbElementHandle or null
   */
  async $(selector) {
    // Handle Playwright-specific :has-text() selector
    if (selector.includes(':has-text(')) {
      return this._queryHasText(selector);
    }
    const exists = bb('eval',
      `!!document.querySelector('${escapeJs(selector)}')`);
    if (exists === 'true') return new BbElementHandle(this, selector);
    return null;
  }

  /**
   * Playwright-compatible locator(selector)
   */
  locator(selector) {
    return new BbLocator(this, selector);
  }

  // --- Internal helpers ---

  async _resolveRef(selector) {
    // Take snapshot and find matching element ref
    const snap = await this.snapshot();
    // Try direct eval to check existence first
    const exists = this._bb('eval',
      `!!document.querySelector('${escapeJs(selector)}')`);
    if (exists !== 'true') return null;

    // Use eval to click/fill by selector directly
    // bb-browser supports CSS selectors via eval workaround
    return null; // fall through to eval-based approach
  }

  async _queryHasText(selector) {
    // Parse "button:has-text("Submit")" → tag=button, text=Submit
    const match = selector.match(/^(\w+):has-text\(["'](.+?)["']\)$/);
    if (!match) return null;
    const [, tag, text] = match;
    const exists = this._bb('eval',
      `!!Array.from(document.querySelectorAll('${tag}')).find(el => el.textContent.includes('${escapeJs(text)}'))`);
    if (exists === 'true') return new BbElementHandle(this, selector, { tag, text });
    return null;
  }

  /**
   * Execute JS directly in page and fill/click by CSS selector
   */
  async evalFill(selector, value) {
    this._bb('eval', `(() => {
      const el = document.querySelector('${escapeJs(selector)}');
      if (!el) return;
      el.focus();
      el.value = '${escapeJs(value)}';
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
    })()`);
  }

  async evalClick(selector) {
    this._bb('eval', `document.querySelector('${escapeJs(selector)}')?.click()`);
  }

  /**
   * Click with full user-event simulation (mousedown → mouseup → click)
   * Required for React/Vue components that don't respond to .click()
   */
  async evalClickReal(selector) {
    this._bb('eval', `(() => {
      const el = document.querySelector('${escapeJs(selector)}');
      if (!el) return;
      el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true,cancelable:true}));
      el.dispatchEvent(new MouseEvent('mouseup', {bubbles:true,cancelable:true}));
      el.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true}));
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = el.type === 'radio' ? true : !el.checked;
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.dispatchEvent(new Event('input', {bubbles:true}));
      }
    })()`);
  }

  async evalClickByText(tag, text) {
    this._bb('eval', `Array.from(document.querySelectorAll('${tag}')).find(el => el.textContent.includes('${escapeJs(text)}'))?.click()`);
  }
}

/**
 * Element handle wrapping bb-browser eval calls
 */
export class BbElementHandle {
  constructor(page, selector, opts = {}) {
    this._page = page;
    this._selector = selector;
    this._tag = opts.tag;
    this._text = opts.text;
    this._index = opts.index; // set by BbLocator.all() for nth-element access
  }

  // Returns a JS expression that resolves to the DOM element
  _elExpr() {
    if (this._index !== undefined) {
      return `document.querySelectorAll('${escapeJs(this._selector)}')[${this._index}]`;
    }
    if (this._tag && this._text) {
      return `Array.from(document.querySelectorAll('${this._tag}')).find(e => e.textContent.includes('${escapeJs(this._text)}'))`;
    }
    return `document.querySelector('${escapeJs(this._selector)}')`;
  }

  async isVisible() {
    return this._page._bb('eval',
      `(() => {
        const el = ${this._elExpr()};
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })()`
    ) === 'true';
  }

  async textContent() {
    return this._page._bb('eval', `${this._elExpr()}?.textContent || ''`);
  }

  async getAttribute(attr) {
    return this._page._bb('eval', `${this._elExpr()}?.getAttribute('${escapeJs(attr)}') || null`);
  }

  async click() {
    if (this._tag && this._text && this._index === undefined) {
      await this._page.evalClickByText(this._tag, this._text);
    } else {
      this._page._bb('eval', `(() => {
        const el = ${this._elExpr()};
        if (!el) return;
        el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true,cancelable:true}));
        el.dispatchEvent(new MouseEvent('mouseup', {bubbles:true,cancelable:true}));
        el.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true}));
        if (el.type === 'radio' || el.type === 'checkbox') {
          el.checked = el.type === 'radio' ? true : !el.checked;
          el.dispatchEvent(new Event('change', {bubbles:true}));
          el.dispatchEvent(new Event('input', {bubbles:true}));
        }
      })()`);
    }
  }

  async fill(value) {
    this._page._bb('eval', `(() => {
      const el = ${this._elExpr()};
      if (!el) return;
      el.focus();
      el.value = '${escapeJs(value)}';
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
    })()`);
  }

  async evaluate(fn) {
    return this._page._bb('eval', `(${fn.toString()})(${this._elExpr()})`);
  }
}

/**
 * Locator wrapping bb-browser eval calls
 */
export class BbLocator {
  constructor(page, selector) {
    this._page = page;
    this._selector = selector;
  }

  first() {
    return new BbElementHandle(this._page, this._selector);
  }

  async all() {
    const countStr = this._page._bb('eval',
      `document.querySelectorAll('${escapeJs(this._selector)}').length`);
    const count = parseInt(countStr, 10) || 0;
    return Array.from({ length: count }, (_, i) =>
      new BbElementHandle(this._page, this._selector, { index: i })
    );
  }

  async isVisible() {
    return this._page._bb('eval',
      `(() => {
        const el = document.querySelector('${escapeJs(this._selector)}');
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })()`
    ) === 'true';
  }

  async fill(value) {
    await this._page.evalFill(this._selector, value);
  }

  async click() {
    await this._page.evalClickReal(this._selector);
  }
}
