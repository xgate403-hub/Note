# StatusChip

六种任务状态的统一编码，以及消息顶部的状态行。

## 六种状态

| 状态 | 图标形状 | 颜色 | 何时 |
|---|---|---|---|
| pending 未开始 | 空心圆 | `--text-3` | 计划中，依赖未满足 |
| running 进行中 | 四分之一弧（唯一会旋转的元素） | `--running` = `--accent` | 正在执行 |
| done 完成 | 实心圆 + 勾 | `--success` | 成功结束 |
| waiting 等待人工 | 空心圆 + 时钟 | `--warning` | 阻塞在用户决定 |
| failed 失败 | 实心圆 + 叉 | `--danger` | 出错，永不自动折叠 |
| skipped 已跳过 | 空心圆 + 横线 | `--neutral` | 主动跳过 |

## 规则

- 形状先于颜色：在 `light-assist` / `dark-assist` 主题里颜色换成蓝 / 橙 / 黄，形状不变。
- 图标边长 `--icon-status`（10px，辅助层 12px），文字 `--fs-xs`。
- 同一时刻页面上只允许一个 running 图标在动；截图、打印与 `prefers-reduced-motion` 下静止。
- 状态行 `.status-line`：状态 + 当前动作 + 像素字体计时（`tabular-nums`）+ 右端"停止"按钮与 `ESC` 快捷键；只在进行中显示。

## 消费方提供

- 状态值、动作文案、已用时（秒）。
