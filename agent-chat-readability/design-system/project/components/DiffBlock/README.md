# DiffBlock

代码块与 diff：文件名头、语言角标、行号、三类高亮。

## 规则

- 字体 `--font-mono` `--fs-code`，行高 `--lh-code`，**关闭连字**（所见即所复制）。
- 头部：语言角标用像素字体（`.lang`），文件名 `--text-3`，右侧操作。
- 只给 **3 类**词性上色：关键字 `--code-kw`（灰紫）、字符串 `--code-str`（灰青）、注释 `--code-cm`（灰）；函数名与数字用正文色。
- diff：新增行 `--diff-add-bg` + 行首 `+` + 行号 `--diff-add-fg`；删除行 `--diff-del-bg` + `−` + `--diff-del-fg`。辅助主题再加 4px 实色边条与斜纹，任何色觉下可辨。
- 超过 24 行默认折叠保留首尾（`.fold`）；流式接收中的代码块底边 2px `--accent-line`（`.streaming`）。
- 行号 `--text-4`，不可选中。

## 消费方提供

- 语言、文件名、带类型标记的行（ctx / add / del）与行号。
