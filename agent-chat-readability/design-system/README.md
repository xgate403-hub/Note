# Design System Artifact 源文件

发布在 https://claude.ai/artifact/8iAM1UJduZSoEag426FEJQ（Design System 类型，私密）。

- `gen-tokens.mjs`：从 `../demo/palette.css` 生成 `project/tokens.json`（页面可读的列表形态，4 个主题）与索引。用法：`node gen-tokens.mjs ../demo/palette.css project`
- `project/README.md`：品牌手册（原则、色彩、字体、间距、图标、内容规则、流式）
- `project/components/bundle.css`：组件样式 = `demo.css` + 复合令牌 + 主题相关覆盖（辅助主题用 `data-theme="light-assist|dark-assist"`）
- `project/components/<Comp>/`：8 个组件的实时预览与指南，`Cover/` 为封面
- 字体不入库，发布时从 `../demo/fonts/` 取

改了色板或组件样式后：重新生成 tokens.json，把变更的文件发布到同一 Artifact（索引最后发）。
