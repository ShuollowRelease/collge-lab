# photo-cut — 设计方向

## 模式
工具型产品：控制区走 convention（清晰、可扫读），画布台带一点 expressive（暗房气质）。

## Token
- `--ink` #E8E4D9 — 主文字
- `--panel` #1C1B18 — 左栏底
- `--stage` #0E0D0C — 画布台
- `--amber` #C9A227 — 强调 / 选中 / 焦点环
- `--muted` #8A857A — 次级文字
- `--rule` #2E2C27 — 分割线
- `--danger` #C45C4A — 错误
- 拼贴主题另见 app 内 themes

## 字体
- 展示：Georgia / Songti SC / SimSun serif — 仅品牌与少量大号数字
- 正文：Segoe UI / PingFang SC / Microsoft YaHei / system-ui
- 等宽：Consolas — 尺寸与导出信息

## 结构
```
header (品牌 + 导出)
├ left rail 320px: 照片条 → 设置分区（布局/质感/文字/导出）
└ right stage: 实时 canvas 预览
```

## 签名
1. 照片以「胶片框」形态排列，选中琥珀描边
2. 布局切换时预览软过渡
3. 导出前空态在画布台上用引导文案，而不是空灰块

## 技术约束（为桌面化预留）
- 纯静态：`index.html` + `styles.css` + `app.js`
- 照片仅在浏览器内存中处理（File API + Canvas），无网络请求
- 无构建步骤即可运行；后续可直接包进 Electron / Tauri
