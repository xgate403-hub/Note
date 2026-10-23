// 为每个场景生成截图：node tools/shoot.mjs
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
  ['02-overview-dark', 'overview', 'dark'],
  ['03-streaming-light', 'streaming', 'light'],
  ['04-streaming-dark', 'streaming', 'dark'],
  ['05-tools-light', 'tools', 'light'],
  ['06-tools-dark', 'tools', 'dark'],
  ['07-plan-light', 'plan', 'light'],
  ['08-plan-dark', 'plan', 'dark'],
  ['09-dag-light', 'dag', 'light'],
  ['10-dag-dark', 'dag', 'dark'],
  ['11-flow-light', 'flow', 'light'],
  ['12-decision-light', 'decision', 'light'],
  ['13-decision-dark', 'decision', 'dark'],
  ['14-code-light', 'code', 'light'],
  ['15-code-dark', 'code', 'dark'],
  ['16-typography-light', 'typography', 'light'],
  ['17-color-light', 'color', 'light'],
  ['18-color-dark', 'color', 'dark'],
  ['19-antipatterns-light', 'antipatterns', 'light'],
  ['20-overview-mobile-light', 'overview', 'light', { mobile: true }],
  ['21-streaming-mobile-dark', 'streaming', 'dark', { mobile: true }],
  ['22-overview-compact-light', 'overview', 'light', { density: 'compact' }],
];

const proxy = process.env.HTTPS_PROXY;
const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
for (const [name, scene, theme, opt = {}] of shots) {
  const width = opt.mobile ? 390 : 1100;
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width, height: 480 }, deviceScaleFactor: 2 });
  const u = new URL(demo);
  u.searchParams.set('scene', scene); u.searchParams.set('theme', theme); u.searchParams.set('capture', '1');
  if (opt.mobile) u.searchParams.set('mobile', '1');
  if (opt.density) u.searchParams.set('density', opt.density);
  await page.goto(u.toString());
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
  console.log('✓', name);
  await page.close();
}
await browser.close();
