/* Agent 会话窗口原型 · 交互与图渲染 */
(function () {
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;

  /* ---------- 主题 / 密度 / 场景 ---------- */
  const theme = qs.get('theme') || localStorage.getItem('theme') || 'light';
  root.dataset.theme = theme;
  if (qs.get('density')) root.dataset.density = qs.get('density');
  if (qs.get('capture') === '1') document.body.classList.add('capture');
  if (qs.get('mobile') === '1') document.body.classList.add('mobile');

  const scene = qs.get('scene') || 'overview';
  document.querySelectorAll('.scene').forEach(s => s.classList.toggle('active', s.dataset.scene === scene));
  document.querySelectorAll('#nav a').forEach(a => {
    const sc = new URL(a.href).searchParams.get('scene');
    a.classList.toggle('on', sc === scene);
    const u = new URL(a.href); u.searchParams.set('theme', root.dataset.theme); a.href = u.toString();
  });
  document.getElementById('themeBtn').onclick = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    const u = new URL(location.href); u.searchParams.set('theme', next); location.href = u.toString();
  };
  document.getElementById('densityBtn').onclick = () => {
    root.dataset.density = root.dataset.density === 'compact' ? '' : 'compact';
  };

  /* ---------- 对比度计算（WCAG 2.x 相对亮度） ---------- */
  const css = getComputedStyle(root);
  const v = n => css.getPropertyValue(n).trim();
  function lum(hex) {
    const m = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function ratio(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }
  function swatch(label, fg, bg, min) {
    const r = ratio(fg, bg);
    const cls = r >= min ? 'pass' : (r >= 3 ? 'warnc' : '');
    return `<div class="sw" style="background:${bg};color:${fg}"><b>${label}</b><span style="opacity:.9">${fg} on ${bg}</span><br><span class="cr ${cls}" style="color:${fg}">${r.toFixed(1)}:1 ${r >= min ? '✓' : '·'} 目标 ≥ ${min}</span></div>`;
  }
  const ts = document.getElementById('textSwatches');
  if (ts) {
    const bg = v('--bg'), sf = v('--surface');
    ts.innerHTML =
      swatch('--text 正文', v('--text'), bg, 7) +
      swatch('--text-2 次级', v('--text-2'), bg, 4.5) +
      swatch('--text-3 三级', v('--text-3'), bg, 4.5) +
      swatch('--text-4 占位', v('--text-4'), bg, 3) +
      swatch('--text on surface', v('--text'), sf, 7) +
      swatch('--thinking', v('--thinking'), v('--thinking-bg'), 4.5);
  }
  const ss = document.getElementById('semSwatches');
  if (ss) {
    const bg = v('--bg');
    ss.innerHTML = ['accent', 'success', 'warning', 'danger'].map(k =>
      swatch(`--${k}`, v('--' + k), bg, 4.5) + swatch(`--${k} on bg`, v('--' + k), v(`--${k}-bg`), 4.5)
    ).join('') + swatch('--neutral', v('--neutral'), bg, 4.5);
  }

  /* ---------- SVG 工具 ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const useIcon = (state, x, y) => { const u = el('use', { href: '#i-' + state, x, y, width: 11, height: 11, class: 'ic' }); return u; };

  /* ---------- DAG：按层从左到右（简化 Sugiyama） ---------- */
  function renderDag(host, nodes, edges, lanes) {
    const W = 108, H = 44, GX = 56, GY = 18, PAD = 16, LANE = lanes ? 22 : 0;
    const byLayer = {};
    nodes.forEach(n => (byLayer[n.layer] ||= []).push(n));
    const layers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);
    const maxRows = Math.max(...layers.map(l => byLayer[l].length));
    const totalH = maxRows * H + (maxRows - 1) * GY;
    layers.forEach(l => {
      const col = byLayer[l]; const h = col.length * H + (col.length - 1) * GY;
      col.forEach((n, i) => { n.x = PAD + l * (W + GX); n.y = PAD + LANE + (totalH - h) / 2 + i * (H + GY); });
    });
    const width = PAD * 2 + layers.length * W + (layers.length - 1) * GX;
    const height = PAD * 2 + LANE + totalH;
    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': '任务依赖图' });
    const map = Object.fromEntries(nodes.map(n => [n.id, n]));
    edges.forEach(([a, b, st]) => {
      const A = map[a], B = map[b];
      const x1 = A.x + W, y1 = A.y + H / 2, x2 = B.x, y2 = B.y + H / 2, c = (x2 - x1) / 2;
      const p = el('path', { d: `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`, class: 'g-edge ' + (st || '') });
      svg.appendChild(p);
      svg.appendChild(el('path', { d: `M${x2 - 5},${y2 - 3.5} L${x2},${y2} L${x2 - 5},${y2 + 3.5}`, class: 'g-edge ' + (st || ''), 'stroke-dasharray': '0' }));
    });
    nodes.forEach(n => {
      const g = el('g', { class: 'g-node ' + n.state, transform: `translate(${n.x},${n.y})` });
      g.appendChild(el('title', {}, `${n.label} · ${n.state}`));
      g.appendChild(el('rect', { width: W, height: H, rx: 8 }));
      g.appendChild(useIcon(n.state, 10, n.sub ? 10 : 17));
      g.appendChild(el('text', { x: 26, y: n.sub ? 19 : 26 }, n.label));
      if (n.sub) g.appendChild(el('text', { x: 12, y: 34, class: 'sub' }, n.sub));
      svg.appendChild(g);
    });
    if (lanes) lanes.forEach(([label, from, to]) => {
      const x = PAD + from * (W + GX), w = (to - from + 1) * W + (to - from) * GX;
      svg.insertBefore(el('rect', { x: x - 8, y: PAD + 2, width: w + 16, height: LANE - 6, rx: 4, class: 'g-lanebg' }), svg.firstChild);
      svg.appendChild(el('text', { x, y: PAD + 13, class: 'g-lane' }, label));
    });
    host.appendChild(svg);
    const cap = document.createElement('div'); cap.className = 'cap';
    cap.innerHTML = ['done:完成','running:进行中（唯一会动的元素）','pending:未开始（虚线）','waiting:等待人工','failed:失败'].map(s => { const [k, t] = s.split(':'); return `<span class="st ${k}"><span class="dot"><svg><use href="#i-${k}"/></svg></span>${t}</span>`; }).join('');
    host.appendChild(cap);
  }

  const dag = document.getElementById('dag1');
  if (dag) renderDag(dag, [
    { id: 'co', label: '拉取代码', sub: '2s', layer: 0, state: 'done' },
    { id: 'dep', label: '安装依赖', sub: '41s', layer: 1, state: 'done' },
    { id: 'unit', label: '单元测试', sub: '1m 12s', layer: 2, state: 'running' },
    { id: 'img', label: '构建镜像', sub: '58s', layer: 2, state: 'running' },
    { id: 'lint', label: 'Lint', sub: '9s', layer: 2, state: 'done' },
    { id: 'int', label: '集成测试', layer: 3, state: 'pending' },
    { id: 'appr', label: '人工审批', layer: 4, state: 'waiting' },
    { id: 'canary', label: '发布到灰度', layer: 5, state: 'pending' },
    { id: 'prod', label: '发布到生产', layer: 6, state: 'pending' },
  ], [
    ['co', 'dep', 'done'], ['dep', 'unit', 'active'], ['dep', 'img', 'active'], ['dep', 'lint', 'done'],
    ['unit', 'int', 'pending'], ['img', 'int', 'pending'], ['lint', 'canary', 'pending'], ['int', 'appr', 'pending'], ['appr', 'canary', 'pending'], ['canary', 'prod', 'pending'],
  ], [['构建', 0, 2], ['验证', 3, 4], ['发布', 5, 6]]);

  /* ---------- 流程图：自上而下，菱形决策 ---------- */
  function renderFlow(host) {
    const width = 560, height = 400;
    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': '告警处理流程' });
    const box = (x, y, w, h, label, state, here) => {
      const g = el('g', { class: 'g-node ' + state, transform: `translate(${x},${y})` });
      g.appendChild(el('rect', { width: w, height: h, rx: 8 }));
      g.appendChild(el('text', { x: w / 2, y: h / 2 + 4.5, 'text-anchor': 'middle' }, label));
      if (here) { const hh = el('g', { class: 'g-here', transform: `translate(${w - 2},${-2})` }); hh.appendChild(el('circle', { r: 9 })); hh.appendChild(el('text', { 'text-anchor': 'middle', y: 3.5 }, '▶')); g.appendChild(hh); }
      svg.appendChild(g); return { x, y, w, h };
    };
    const dec = (cx, cy, label) => {
      const w = 150, h = 56; const g = el('g', { class: 'g-dec' });
      g.appendChild(el('polygon', { points: `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}` }));
      g.appendChild(el('text', { x: cx, y: cy + 4.5, 'text-anchor': 'middle' }, label));
      svg.appendChild(g); return { cx, cy, w, h };
    };
    const line = (d, cls, lbl, lx, ly) => { svg.appendChild(el('path', { d, class: 'g-edge ' + (cls || ''), 'marker-end': 'url(#arr)' })); if (lbl) svg.appendChild(el('text', { x: lx, y: ly, class: 'g-lbl' }, lbl)); };
    const defs = el('defs'); const m = el('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    m.appendChild(el('path', { d: 'M1,1 L9,5 L1,9', fill: 'none', stroke: 'context-stroke', 'stroke-width': 1.4 })); defs.appendChild(m); svg.appendChild(defs);

    const cx = 180;
    box(cx - 60, 10, 120, 40, '收到告警', 'done');
    line(`M${cx},50 L${cx},72`, 'done');
    dec(cx, 100, '最近 10 分钟有部署？');
    line(`M${cx},128 L${cx},150`, 'done', '否', cx + 8, 145);
    line(`M${cx + 75},100 L${cx + 190},100 L${cx + 190},150`, 'pending', '是', cx + 110, 94);
    box(cx + 130, 150, 120, 40, '回滚最近部署', 'pending');
    dec(cx, 178, '错误率 > 5%？');
    line(`M${cx},206 L${cx},228`, 'active', '是', cx + 8, 223);
    line(`M${cx - 75},178 L${cx - 130},178 L${cx - 130},228`, 'pending', '否', cx - 110, 172);
    box(cx - 190, 228, 120, 40, '记录并继续观察', 'pending');
    box(cx - 60, 228, 120, 40, '定位异常服务', 'running', true);
    line(`M${cx},268 L${cx},290`, 'pending');
    box(cx - 60, 290, 120, 40, '通知值班并给出结论', 'pending');
    line(`M${cx + 190},190 L${cx + 190},310 L${cx + 60},310`, 'pending');
    box(cx + 130, 340, 120, 40, '结束', 'pending');
    line(`M${cx},330 L${cx},360 L${cx + 130},360`, 'pending');
    host.appendChild(svg);
    const cap = document.createElement('div'); cap.className = 'cap';
    cap.innerHTML = '<span>菱形 = 判断</span><span>圆角矩形 = 动作</span><span>绿实线 = 已走过</span><span>蓝粗线 = 当前路径</span><span>虚线 = 未来可能路径</span>';
    host.appendChild(cap);
  }
  const flow = document.getElementById('flow1');
  if (flow) renderFlow(flow);

  /* ---------- 计时器：非截图模式下走表；等宽数字避免抖动 ---------- */
  if (!document.body.classList.contains('capture')) {
    document.querySelectorAll('[data-elapsed]').forEach(e => {
      let s = +e.dataset.elapsed; const fmt = n => e.classList.contains('dur') ? n + 's' : String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
      setInterval(() => { s++; e.textContent = fmt(s); }, 1000);
    });
  }

  /* ---------- 流式输出模拟（?live=1）：按帧批量追加，不逐字 ---------- */
  if (qs.get('live') === '1' && scene === 'streaming') {
    const target = document.querySelector('[data-scene="streaming"] .prose');
    const p = document.createElement('p'); target.appendChild(p);
    const text = '测试通过后我会运行 lint。如果没有新告警，就按最小改动提交，提交信息写明 Node 22 keep-alive 的根因。';
    const caret = document.createElement('span'); caret.className = 'caret'; p.appendChild(caret);
    let i = 0, last = 0;
    function frame(t) {
      if (t - last > 48) { // 每帧 ≥ 48ms 追加 2–4 个字，而不是每个 token 立即重绘
        const n = 2 + Math.floor(Math.random() * 3);
        caret.before(document.createTextNode(text.slice(i, i + n))); i += n; last = t;
      }
      if (i < text.length) requestAnimationFrame(frame); else caret.classList.add('idle');
    }
    requestAnimationFrame(frame);
  }
})();
