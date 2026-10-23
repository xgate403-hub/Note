// 从 palette.css 生成 tokens.json（页面可读的列表形态），并生成索引
import { readFileSync, writeFileSync } from 'node:fs';
const css = readFileSync(process.argv[2], 'utf8');
const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim(), m[2]]);
const themeOf = sel => sel.includes('data-vision="assist"][data-theme="light"]') ? 'light-assist'
  : sel.includes('data-vision="assist"][data-theme="dark"]') ? 'dark-assist'
  : sel.includes('data-theme="dark"') ? 'dark' : 'light';
const vals = { light: {}, dark: {}, 'light-assist': {}, 'dark-assist': {} };
for (const [sel, body] of blocks) {
  const t = themeOf(sel);
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) vals[t][m[1]] = m[2].trim();
}
// 辅助主题缺的键继承各自基础主题（页面规则是继承第一主题，所以这里显式补齐）
for (const [a, base] of [['light-assist', 'light'], ['dark-assist', 'dark']]) for (const k in vals[base]) if (!(k in vals[a])) vals[a][k] = vals[base][k];
const conv = v => { const m = /^var\(--([a-z0-9-]+)\)$/.exec(v); return m ? `{${m[1]}}` : v.toLowerCase(); };
const usage = {
  bg: '页面底。明亮为暖纸白，纯黑主题为 #000000（OLED 真黑）。', surface: '卡片、代码块、面板的面。', 'surface-2': '次级面：用户气泡、工具卡头、结论框底。', 'surface-3': '悬浮 / 选中 / 标签底。',
  border: '发丝线分隔、卡片描边。', 'border-strong': '需要被看见的描边：输入框、按钮、图节点。',
  text: '正文。明亮 ≥15:1，纯黑 ≥16:1，辅助层 ≥10:1。', 'text-2': '次级说明、工具结果摘要、表头。≥4.5:1（辅助 ≥7）。', 'text-3': '时间、耗时、元信息。≥4.5:1；不承载长句。', 'text-4': '占位、禁用、行号。≥3:1；不承载必读内容。',
  accent: '唯一常驻的有彩色：动作、链接、进行中状态、结论框左边条。', 'accent-bg': '结论框 / 当前项 / 推荐项的极淡底。', 'accent-line': '主色描边、焦点环。',
  running: '进行中状态，等于 accent。', success: '完成。只用于状态图标、完成项描边与提示框。', 'success-bg': '成功提示框底。', 'success-line': '成功提示框描边。',
  warning: '等待人工 / 需注意。', 'warning-bg': '注意提示框、决策卡头底。', 'warning-line': '决策卡描边。',
  danger: '失败、破坏性操作。一条消息里最多出现一个红色块。', 'danger-bg': '失败提示框底。', 'danger-line': '失败提示框描边。', neutral: '跳过 / 取消。',
  thinking: '推理过程文字：刻意比正文低一档。', 'thinking-bg': '推理摘要块的底。', 'code-bg': '代码块与行内 code 的底。',
  'code-kw': '代码关键字（灰紫）。', 'code-fn': '函数名：用正文色，不单独上色。', 'code-str': '字符串（灰青）。', 'code-num': '数字：用次级色。', 'code-cm': '注释。',
  'diff-add-bg': 'diff 新增行底。与行首 + 号、行号颜色三重编码。', 'diff-add-fg': 'diff 新增行行号与符号。', 'diff-del-bg': 'diff 删除行底。辅助层再加斜纹。', 'diff-del-fg': 'diff 删除行行号与符号。',
  'uni-1': '独角兽点缀 1（近灰的薰衣草）。只用于 Agent 头像底。', 'uni-2': '独角兽点缀 2（近灰的薄荷）。只用于 Agent 头像底。', 'uni-3': '独角兽点缀 3（近灰的蜜桃）。只用于 Agent 头像底。',
};
const ansiUsage = n => `ANSI ${n}：日志 / 终端输出。普通色对背景 ≥5.5:1（明亮）/ ≥8:1（纯黑）。`;
const order = Object.keys(vals.light);
const colorTokens = order.map(name => ({
  name, value: Object.fromEntries(Object.keys(vals).map(t => [t, conv(vals[t][name])])),
  usage: usage[name] || (name.startsWith('ansi-') ? ansiUsage(name.slice(5)) : ''),
}));
const tokens = {
  name: 'Agent 会话设计系统', version: 2,
  color: {
    themes: [{ id: 'light', name: '明亮' }, { id: 'dark', name: '纯黑' }, { id: 'light-assist', name: '明亮 · 视觉辅助' }, { id: 'dark-assist', name: '深色 · 视觉辅助' }],
    tokens: colorTokens,
  },
  type: {
    fonts: [
      { family: 'IBM Plex Sans', file: 'fonts/IBMPlexSans-Regular.woff2', weight: '400' },
      { family: 'IBM Plex Sans', file: 'fonts/IBMPlexSans-Text.woff2', weight: '450' },
      { family: 'IBM Plex Sans', file: 'fonts/IBMPlexSans-Medium.woff2', weight: '500' },
      { family: 'IBM Plex Sans', file: 'fonts/IBMPlexSans-SemiBold.woff2', weight: '600' },
      { family: 'IBM Plex Sans', file: 'fonts/IBMPlexSans-Bold.woff2', weight: '700' },
      { family: 'IBM Plex Sans SC', file: 'fonts/IBMPlexSansSC-Regular.woff2', weight: '400' },
      { family: 'IBM Plex Sans SC', file: 'fonts/IBMPlexSansSC-Medium.woff2', weight: '450 500' },
      { family: 'IBM Plex Sans SC', file: 'fonts/IBMPlexSansSC-SemiBold.woff2', weight: '600' },
      { family: 'IBM Plex Sans SC', file: 'fonts/IBMPlexSansSC-Bold.woff2', weight: '700' },
      { family: 'Departure Mono', file: 'fonts/DepartureMono-Regular.woff2', weight: '400' },
    ],
    families: {
      sans: '"IBM Plex Sans", "IBM Plex Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      mono: '"JetBrains Mono", "IBM Plex Mono", "SF Mono", "Cascadia Mono", ui-monospace, monospace',
      pixel: '"Departure Mono", "JetBrains Mono", monospace',
    },
    groups: [
      { name: '正文（笔记本 15px / 手机 16px）', family: 'sans', styles: [
        { name: 'body', fontSize: '15px', lineHeight: 1.7, fontWeight: 400, sample: '超时来自 upload 测试：Node 22 的全局 fetch 默认保持连接。', usage: '明亮主题正文。手机 16px / 1.65。' },
        { name: 'body-on-black', fontSize: '15px', lineHeight: 1.75, fontWeight: 450, sample: '纯黑主题正文用 Plex Text 字重补偿黑底光渗。', usage: '纯黑主题正文：字重 450，行高 1.75。' },
        { name: 'body-assist', fontSize: '16px', lineHeight: 1.75, fontWeight: 500, sample: '视觉辅助层正文：更大、更粗、更松。', usage: '视觉辅助层（术后夜视弱 / 色觉缺陷）。' },
        { name: 'lead', fontSize: '17px', lineHeight: 1.55, fontWeight: 400, sample: '引导句或结论框内的第一句。' },
        { name: 'h1', fontSize: '24px', lineHeight: 1.3, fontWeight: 600, sample: '会话标题' },
        { name: 'h2', fontSize: '20px', lineHeight: 1.3, fontWeight: 600, sample: '消息内二级标题' },
        { name: 'h3', fontSize: '17px', lineHeight: 1.3, fontWeight: 600, sample: '消息内三级标题' },
        { name: 'small', fontSize: '13px', lineHeight: 1.6, fontWeight: 400, sample: '次级说明、工具意图、推理摘要' },
        { name: 'meta', fontSize: '12px', lineHeight: 1.45, fontWeight: 400, sample: '元信息：14:02 · 用时 48s', usage: '可读文本的下限。' },
      ]},
      { name: '代码与日志', family: 'mono', styles: [
        { name: 'code', fontSize: '13px', lineHeight: 1.6, fontWeight: 400, sample: 'const port = process.env.PORT ?? 4010; // 0O il1', usage: '关闭连字：font-feature-settings "liga" 0, "calt" 0。' },
        { name: 'log', fontSize: '13px', lineHeight: 1.55, fontWeight: 400, sample: '05:41:12.512 error POST /upload 500 ECONNRESET', usage: '终端 / 日志，使用 ANSI 16 色。' },
      ]},
      { name: '像素标签', family: 'pixel', styles: [
        { name: 'pixel-label', fontSize: '11px', lineHeight: 1, fontWeight: 400, letterSpacing: '0.02em', sample: 'AGENT 14:02 · DONE · 48S · CTRL+O', usage: '只排拉丁与数字短标签；11px 或 22px；关闭抗锯齿。辅助层中替换为 mono 13px。' },
      ]},
    ],
  },
  spacing: { note: '4px 基数。轮次之间 space-7 必须明显大于消息内部 space-3/4。', tokens: [
    { name: 'space-1', value: '4px', usage: '列表项间距。' }, { name: 'space-2', value: '8px', usage: '图标与文字、标签内距。' },
    { name: 'space-3', value: '12px', usage: '块内上下距、工具卡内距。' }, { name: 'space-4', value: '16px', usage: '卡片内距、轨道与正文列间距。' },
    { name: 'space-5', value: '20px', usage: '区块之间。' }, { name: 'space-6', value: '24px', usage: '轮次顶部留白。' },
    { name: 'space-7', value: '32px', usage: '轮次之间。' }, { name: 'space-8', value: '48px', usage: '会话底部留白。' },
    { name: 'measure', value: '680px', usage: '正文列最大宽度 ≈ 15px × 42 中文字。' }, { name: 'measure-narrow', value: '560px', usage: '推理文字列宽。' },
  ]},
  radius: { tokens: [
    { name: 'radius-sm', value: '6px', usage: '按钮、code 片、图节点。' }, { name: 'radius-md', value: '10px', usage: '卡片、代码块、提示框。' }, { name: 'radius-lg', value: '14px', usage: '用户气泡、侧栏面板。' },
  ]},
  shadow: { tokens: [{ name: 'shadow-sm', value: { light: '0 1px 2px rgba(20,22,26,0.06), 0 0 0 1px rgba(20,22,26,0.04)', dark: '0 0 0 1px rgba(255,255,255,0.05)', 'light-assist': '0 0 0 1px rgba(20,22,26,0.12)', 'dark-assist': '0 0 0 1px rgba(255,255,255,0.10)' }, usage: '侧栏面板。深色主题靠更亮的面而不是阴影。' }] },
  typescale: { note: '字号 / 行高 / 字重 / 描边等非颜色令牌，编译为 :root 变量。主题相关的覆盖（纯黑字重 450、辅助层 +1px）在 bundle.css。', tokens: [
    { name: 'fs-2xs', value: '11px', usage: '像素标签。' }, { name: 'fs-xs', value: '12px', usage: '元信息。' }, { name: 'fs-sm', value: '13px', usage: '次级说明。' }, { name: 'fs-md', value: '15px', usage: '正文。' },
    { name: 'fs-lg', value: '17px' }, { name: 'fs-xl', value: '20px' }, { name: 'fs-2xl', value: '24px' }, { name: 'fs-code', value: '13px', usage: '代码 / 日志。' },
    { name: 'lh-tight', value: '1.3' }, { name: 'lh-ui', value: '1.45' }, { name: 'lh-code', value: '1.6' }, { name: 'lh-body', value: '1.7', usage: '中文正文。' },
    { name: 'fw-body', value: '400', usage: '纯黑主题 450，辅助层 500。' }, { name: 'fw-medium', value: '500' }, { name: 'fw-semibold', value: '600' }, { name: 'fw-bold', value: '700', usage: '只用于 ≥20px 标题。' },
    { name: 'para-gap', value: '0.9em', usage: '段距，必须明显大于行距余量。' }, { name: 'hairline', value: '1px', usage: '辅助层 1.5px。' }, { name: 'icon-status', value: '10px', usage: '状态图标边长；辅助层 12px。' },
  ]},
  motion: undefined,
  duration: { note: '同一时刻只允许一个运动元素；光标 1Hz；spinner 1.2s/圈；prefers-reduced-motion 下归零。', tokens: [
    { name: 'dur-fast', value: '120ms' }, { name: 'dur-base', value: '200ms' }, { name: 'dur-slow', value: '400ms' }, { name: 'ease', value: 'cubic-bezier(0.2,0.6,0.2,1)' },
  ]},
};
delete tokens.motion;
writeFileSync(process.argv[3] + '/tokens.json', JSON.stringify(tokens, null, 1));
const now = new Date().toISOString();
const index = { v: 3, layout: 'files', createdOnFiles: { v: 1, at: now }, title: 'Agent 会话设计系统', namespace: 'AgentChat', libraries: [], sections: {}, groups: [], assetGroups: {}, blobs: {}, docs: { readme: 'project/README.md', sections: [] },
  lastChange: { by: 'xgate403', at: now, via: 'Claude Code', note: '从 agent-chat-readability 仓库的 palette.css / tokens.css 生成' } };
writeFileSync(process.argv[3] + '/design-system.json', JSON.stringify(index, null, 1));
console.log('tokens', colorTokens.length, 'colors');
