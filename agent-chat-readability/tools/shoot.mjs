// 为每个场景生成截图：node tools/shoot.mjs
// 宽度：1100px ≈ 14 寸笔记本 150% 缩放下的会话区；390px ≈ 主流手机
// 依赖：Playwright 自带的 Chromium；通过 HTTPS_PROXY 加载 Google Fonts（可选）
import pkg from '/opt/node-tools/node_modules/playwright/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = pkg;

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = 'file://' + path.resolve(here, '../demo/index.html');
const out = path.resolve(here, '../screenshots');

const shots = [
  ['01-overview-light', 'overview', 'light'],
  ['02-overview-black', 'overview', 'dark'],
  ['03-streaming-light', 'streaming', 'light'],
  ['04-streaming-black', 'streaming', 'dark'],
  ['05-reasoning-summary-light', 'reasoning', 'light'],
  ['06-reasoning-summary-black', 'reasoning', 'dark'],
  ['07-reasoning-open-light', 'reasoning-open', 'light'],
  ['08-reasoning-open-black', 'reasoning-open', 'dark'],
  ['09-result-light', 'result', 'light'],
  ['10-result-black', 'result', 'dark'],
  ['11-tools-light', 'tools', 'light'],
  ['12-tools-black', 'tools', 'dark'],
  ['13-terminal-light', 'terminal', 'light'],
  ['14-terminal-black', 'terminal', 'dark'],
  ['15-plan-light', 'plan', 'light'],
  ['16-plan-black', 'plan', 'dark'],
  ['17-dag-light', 'dag', 'light'],
  ['18-dag-black', 'dag', 'dark'],
  ['19-flow-light', 'flow', 'light'],
  ['20-decision-light', 'decision', 'light'],
  ['21-decision-black', 'decision', 'dark'],
  ['22-code-light', 'code', 'light'],
  ['23-code-black', 'code', 'dark'],
  ['24-typography-light', 'typography', 'light'],
  ['25-typography-black', 'typography', 'dark'],
  ['26-color-light', 'color', 'light'],
  ['27-color-black', 'color', 'dark'],
  ['28-assist-light', 'assist', 'light', { vision: 'assist' }],
  ['29-assist-dark', 'assist', 'dark', { vision: 'assist' }],
  ['30-assist-overview-dark', 'overview', 'dark', { vision: 'assist' }],
  ['31-assist-result-light', 'result', 'light', { vision: 'assist' }],
  ['32-assist-color-light', 'color', 'light', { vision: 'assist' }],
  ['33-assist-color-dark', 'color', 'dark', { vision: 'assist' }],
  ['34-antipatterns-light', 'antipatterns', 'light'],
  ['35-mobile-overview-light', 'overview', 'light', { mobile: true }],
  ['36-mobile-result-black', 'result', 'dark', { mobile: true }],
  ['37-mobile-reasoning-black', 'reasoning', 'dark', { mobile: true }],
  ['38-mobile-assist-overview-dark', 'overview', 'dark', { mobile: true, vision: 'assist' }],
  ['39-compact-overview-light', 'overview', 'light', { density: 'compact' }],
];

const proxy = process.env.HTTPS_PROXY;
const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
for (const [name, scene, theme, opt = {}] of shots) {
  const width = opt.mobile ? 390 : (scene === 'reasoning-open' ? 1280 : 1100);
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width, height: 480 }, deviceScaleFactor: 2 });
  const u = new URL(demo);
  u.searchParams.set('scene', scene); u.searchParams.set('theme', theme); u.searchParams.set('capture', '1');
  if (opt.mobile) u.searchParams.set('mobile', '1');
  if (opt.density) u.searchParams.set('density', opt.density);
  if (opt.vision) u.searchParams.set('vision', opt.vision);
  await page.goto(u.toString());
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
  console.log('✓', name);
  await page.close();
}
await browser.close();
