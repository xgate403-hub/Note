// 色板生成器：参数化（OKLCH 色相等距 + 统一色度 + 用对比度目标反解明度）
// 思路与 4bit terminal color scheme designer 相同，但以 WCAG 对比度为约束而不是手调。
// 运行：node tools/palette.mjs  → 写出 demo/palette.css 并打印对比度报告
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- 颜色数学 ---------- */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function oklchToLinear(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
const inGamut = rgb => rgb.every(v => v >= -0.0005 && v <= 1.0005);
const gam = x => { x = clamp(x); return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; };
const hex = rgb => '#' + rgb.map(v => Math.round(gam(v) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function oklch(L, C, h) { // 超出色域时降低色度而不是裁剪（保持色相与明度）
  let c = C; let rgb = oklchToLinear(L, c, h);
  while (!inGamut(rgb) && c > 0) { c -= 0.002; rgb = oklchToLinear(L, c, h); }
  return hex(rgb);
}
const lum = h => { const m = h.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// 反解明度：在给定色相/色度下，找到与背景对比度 ≈ target 的 L
function solve(bgHex, h, C, target, dir /* 'darker'|'lighter' */) {
  let lo = dir === 'darker' ? 0.05 : 0.40, hi = dir === 'darker' ? 0.80 : 0.99;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2; const c = cr(oklch(mid, C, h), bgHex);
    if (dir === 'darker') { if (c < target) hi = mid; else lo = mid; } else { if (c < target) lo = mid; else hi = mid; }
  }
  return oklch(dir === 'darker' ? lo : hi, C, h);
}

/* ---------- 参数 ---------- */
// 色相（OKLCH）：独角兽主色为薰衣草紫 285°，语义色与之拉开 ≥ 60°
const HUE = { accent: 285, success: 162, warning: 78, danger: 18, unicornMint: 170, unicornPeach: 45 };
const ANSI_HUE = { red: 25, green: 145, yellow: 92, blue: 258, magenta: 328, cyan: 200 };
const report = [];
const out = [];
const line = (k, v, note = '') => out.push(`  ${k}: ${v};${note ? ' /* ' + note + ' */' : ''}`);
const check = (label, fg, bg, min) => report.push([label, fg, bg, cr(fg, bg), min]);

/* ================= 明亮主题 ================= */
{
  const bg = '#F8F7F4';
  out.push(':root, :root[data-theme="light"] {');
  out.push('  /* 明亮主题：暖纸白底，低色度语义色，由 palette.mjs 生成 */');
  const fixed = { '--bg': bg, '--surface': '#FFFFFF', '--surface-2': '#F0EFEB', '--surface-3': '#E7E6E1', '--border': '#DCDAD3', '--border-strong': '#BFBDB6', '--text': '#1F2126', '--text-2': '#4D525B', '--text-3': '#676D77', '--text-4': '#838891' };
  for (const k in fixed) line(k, fixed[k]);
  ['--text', 7].concat() && check('text', fixed['--text'], bg, 7); check('text-2', fixed['--text-2'], bg, 4.5); check('text-3', fixed['--text-3'], bg, 4.5); check('text-4', fixed['--text-4'], bg, 3);
  for (const [k, h, C, t] of [['accent', HUE.accent, .11, 5.3], ['success', HUE.success, .09, 5.0], ['warning', HUE.warning, .10, 5.0], ['danger', HUE.danger, .11, 5.0]]) {
    const fg = solve(bg, h, C, t, 'darker'); const bgc = oklch(0.958, 0.026, h); const ln = oklch(0.80, 0.07, h);
    line(`--${k}`, fg); line(`--${k}-bg`, bgc); line(`--${k}-line`, ln);
    check(k, fg, bg, 4.5); check(`${k} on ${k}-bg`, fg, bgc, 4.5);
  }
  line('--running', 'var(--accent)'); line('--neutral', fixed['--text-3']);
  line('--thinking', '#5D636D'); line('--thinking-bg', '#F1F0EC'); check('thinking', '#5D636D', '#F1F0EC', 4.5);
  line('--code-bg', '#F1F0EC');
  const codebg = '#F1F0EC';
  for (const [k, h, C, t] of [['kw', 300, .10, 5.2], ['str', 165, .08, 5.2]]) { const c = solve(codebg, h, C, t, 'darker'); line(`--code-${k}`, c); check(`code-${k}`, c, codebg, 4.5); }
  line('--code-fn', 'var(--text)'); line('--code-num', 'var(--text-2)');
  line('--code-cm', '#646A74'); check('code-cm', '#646A74', codebg, 4.5);
  line('--diff-add-bg', oklch(0.955, 0.025, HUE.success)); line('--diff-add-fg', 'var(--success)'); line('--diff-del-bg', oklch(0.955, 0.02, HUE.danger)); line('--diff-del-fg', 'var(--danger)');
  // 独角兽点缀：只用于 Agent 头像底色，近灰的极低色度三色
  line('--uni-1', oklch(0.90, 0.035, HUE.accent)); line('--uni-2', oklch(0.92, 0.03, HUE.unicornMint)); line('--uni-3', oklch(0.93, 0.03, HUE.unicornPeach));
  // ANSI 16 色（日志用）：普通色对比 ≥5.5，亮色 ≥4.6
  const ansi = { black: '#2B2D32', 'bright-black': '#5C6068', white: solve(bg, 260, .01, 4.7, 'darker'), 'bright-white': solve(bg, 260, .01, 3.2, 'darker') };
  for (const k in ANSI_HUE) { ansi[k] = solve(bg, ANSI_HUE[k], .10, 5.6, 'darker'); ansi['bright-' + k] = solve(bg, ANSI_HUE[k], .11, 4.6, 'darker'); }
  for (const k in ansi) { line(`--ansi-${k}`, ansi[k]); check(`ansi-${k}`, ansi[k], bg, k.startsWith('bright-white') ? 3 : 4.5); }
  out.push('}');
}

/* ================= 纯黑主题 ================= */
{
  const bg = '#000000';
  out.push(':root[data-theme="dark"] {');
  out.push('  /* 纯黑主题：OLED 真黑底；文字为暖灰白而非纯白，面用更亮的灰表达层级 */');
  const fixed = { '--bg': bg, '--surface': '#111114', '--surface-2': '#1A1A1F', '--surface-3': '#24242A', '--border': '#2E2E35', '--border-strong': '#47474F', '--text': '#E9E7E1', '--text-2': '#B3B5BB', '--text-3': '#8B8E96', '--text-4': '#636770' };
  for (const k in fixed) line(k, fixed[k]);
  check('text', fixed['--text'], bg, 7); check('text-2', fixed['--text-2'], bg, 4.5); check('text-3', fixed['--text-3'], bg, 4.5); check('text-4', fixed['--text-4'], bg, 3);
  for (const [k, h, C, t] of [['accent', HUE.accent, .11, 9], ['success', HUE.success, .10, 9], ['warning', HUE.warning, .10, 10.5], ['danger', HUE.danger, .10, 8]]) {
    const fg = solve(bg, h, C, t, 'lighter'); const bgc = oklch(0.23, 0.03, h); const ln = oklch(0.44, 0.07, h);
    line(`--${k}`, fg); line(`--${k}-bg`, bgc); line(`--${k}-line`, ln);
    check(k, fg, bg, 4.5); check(`${k} on ${k}-bg`, fg, bgc, 4.5);
  }
  line('--running', 'var(--accent)'); line('--neutral', fixed['--text-3']);
  line('--thinking', '#A3A6AD'); line('--thinking-bg', '#0E0E11'); check('thinking', '#A3A6AD', '#0E0E11', 4.5);
  const codebg = '#141418'; line('--code-bg', codebg);
  for (const [k, h, C, t] of [['kw', 300, .10, 8], ['str', 165, .08, 9]]) { const c = solve(codebg, h, C, t, 'lighter'); line(`--code-${k}`, c); check(`code-${k}`, c, codebg, 4.5); }
  line('--code-fn', 'var(--text)'); line('--code-num', 'var(--text-2)');
  line('--code-cm', '#858A92'); check('code-cm', '#858A92', codebg, 4.5);
  line('--diff-add-bg', oklch(0.24, 0.035, HUE.success)); line('--diff-add-fg', 'var(--success)'); line('--diff-del-bg', oklch(0.22, 0.02, HUE.danger)); line('--diff-del-fg', 'var(--danger)');
  line('--uni-1', oklch(0.30, 0.025, HUE.accent)); line('--uni-2', oklch(0.32, 0.02, HUE.unicornMint)); line('--uni-3', oklch(0.33, 0.02, HUE.unicornPeach));
  const ansi = { black: '#1C1C20', 'bright-black': '#868991', white: '#D3D1CB', 'bright-white': '#F1EFE9' };
  for (const k in ANSI_HUE) { ansi[k] = solve(bg, ANSI_HUE[k], .10, 8, 'lighter'); ansi['bright-' + k] = solve(bg, ANSI_HUE[k], .11, 11, 'lighter'); }
  for (const k in ansi) { line(`--ansi-${k}`, ansi[k]); check(`ansi-${k}`, ansi[k], bg, k === 'black' ? 0 : 4.5); }
  out.push('}');
}

/* ================= 视觉辅助层（叠加在两个主题上） =================
   目标人群：屈光手术后夜视变弱（对比敏感度下降、眩光/光晕）、红绿色觉缺陷。
   做法：对比度上调到 ≥7（正文 ≥10）、语义色改为“蓝 / 橙 / 黄”高亮度差组合、去掉纯黑底。 */
{
  const bg = '#FBFAF7';
  out.push(':root[data-vision="assist"][data-theme="light"], :root[data-vision="assist"]:not([data-theme]) {');
  out.push('  /* 辅助 · 明亮：底略提亮、文字更深、所有层级 ≥7:1 */');
  const fixed = { '--bg': bg, '--surface': '#FFFFFF', '--surface-2': '#EEEDE8', '--surface-3': '#E2E1DB', '--border': '#B8B6AE', '--border-strong': '#8E8C85', '--text': '#111317', '--text-2': '#33373E', '--text-3': '#484D55', '--text-4': '#5F646C' };
  for (const k in fixed) line(k, fixed[k]);
  check('A text', fixed['--text'], bg, 10); check('A text-2', fixed['--text-2'], bg, 7); check('A text-3', fixed['--text-3'], bg, 7); check('A text-4', fixed['--text-4'], bg, 4.5);
  // 语义：完成=蓝 / 失败=朱红橙 / 等待=深黄 / 进行中=紫（与蓝靠亮度与形状区分）
  for (const [k, h, C, t] of [['accent', 300, .14, 7.9], ['success', 245, .13, 7.9], ['warning', 85, .12, 7.9], ['danger', 40, .16, 7.9]]) {
    const fg = solve(bg, h, C, t, 'darker'); const bgc = oklch(0.955, 0.025, h); const ln = oklch(0.70, 0.10, h);
    line(`--${k}`, fg); line(`--${k}-bg`, bgc); line(`--${k}-line`, ln); check('A ' + k, fg, bg, 7); check(`A ${k} on bg`, fg, bgc, 7);
  }
  line('--thinking', '#3F444C'); line('--thinking-bg', '#EEEDE8'); line('--code-bg', '#EEEDE8');
  line('--diff-add-bg', oklch(0.94, 0.04, 245)); line('--diff-del-bg', oklch(0.94, 0.04, 40));
  out.push('}');
}
{
  const bg = '#121316';
  out.push(':root[data-vision="assist"][data-theme="dark"] {');
  out.push('  /* 辅助 · 深色：不用纯黑（减少光晕/星芒），文字明度略降、字重上调，蓝色改为天蓝避免蓝光聚焦困难 */');
  const fixed = { '--bg': bg, '--surface': '#1A1B1F', '--surface-2': '#222328', '--surface-3': '#2B2C32', '--border': '#4A4C54', '--border-strong': '#6B6E77', '--text': '#F1EFE9', '--text-2': '#CBCDD2', '--text-3': '#AEB1B8', '--text-4': '#8A8E96' };
  for (const k in fixed) line(k, fixed[k]);
  check('A text', fixed['--text'], bg, 10); check('A text-2', fixed['--text-2'], bg, 7); check('A text-3', fixed['--text-3'], bg, 7); check('A text-4', fixed['--text-4'], bg, 4.5);
  for (const [k, h, C, t] of [['accent', 300, .10, 9.3], ['success', 215, .10, 9.4], ['warning', 90, .11, 12], ['danger', 45, .13, 9.3]]) {
    const fg = solve(bg, h, C, t, 'lighter'); const bgc = oklch(0.27, 0.03, h); const ln = oklch(0.55, 0.08, h);
    line(`--${k}`, fg); line(`--${k}-bg`, bgc); line(`--${k}-line`, ln); check('A ' + k, fg, bg, 7); check(`A ${k} on bg`, fg, bgc, 7);
  }
  line('--thinking', '#C0C3C9'); line('--thinking-bg', '#17181C'); line('--code-bg', '#1A1B1F');
  line('--diff-add-bg', oklch(0.30, 0.04, 215)); line('--diff-del-bg', oklch(0.30, 0.04, 45));
  out.push('}');
}

const css = `/* 由 tools/palette.mjs 生成，请勿手改。参数见脚本顶部。 */\n` + out.join('\n') + '\n';
writeFileSync(path.join(here, '../demo/palette.css'), css);
let bad = 0;
for (const [label, fg, bg, r, min] of report) { const ok = r >= min; if (!ok) bad++; console.log(`${ok ? 'ok ' : 'LOW'} ${label.padEnd(26)} ${fg} on ${bg}  ${r.toFixed(2)}  (≥${min})`); }
console.log(bad ? `\n${bad} 项未达标` : '\n全部达标');
