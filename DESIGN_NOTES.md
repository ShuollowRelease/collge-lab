# photo-cut — 设计方向

## 模式
工具型产品：控制区走 convention（清晰、可扫读），画布台带一点 expressive（暗房气质）。

## 架构（2026 起）
- UI：**React 19 + HeroUI v3**（Tailwind CSS v4）
- 构建：Vite 6
- 拼贴引擎：`src/engine/*`（纯 Canvas，无 DOM 依赖）
- 桌面壳：Electron（可选打包）
- 无后端：照片本机处理，设置写 localStorage

## Token（HeroUI · Uber 预设）
来源：HeroUI 主题编辑器 `id="uber"`（chroma=0 / hue=0 / radius=small / Inter）
- 背景：纯灰度（light 白 · dark 近黑）
- 强调：light 黑 `oklch(15% 0 0)` · dark 白 `oklch(98% 0 0)`
- 圆角：`--radius: 0.25rem`（small）
- 字体：Inter / system-ui
- 状态色沿用 Uber 预设 semanticOverrides

## 字体
- 展示：Georgia / Songti SC / SimSun serif
- 正文：Segoe UI / PingFang SC / Microsoft YaHei / system-ui
- 本地艺术字：MaShanZheng / LongCang / GreatVibes 等（`assets/fonts`）

## 结构
```
header (品牌 + 记住设置 + 导出)
├ left rail 320px: Tabs（照片 / 外观 / 文字 / 导出）
└ right stage: 实时 canvas 预览
```

## 签名
1. 照片以「胶片框」形态排列，选中琥珀描边
2. 布局切换时预览软过渡
3. 导出前空态在画布台上用引导文案，而不是空灰块

## 目录
```
src/
  main.jsx / App.jsx     — React 入口与壳层
  styles.css             — Tailwind + HeroUI + 本地 token
  engine/constants.js    — 布局/主题/默认状态
  engine/layouts.js      — 槽位计算
  engine/draw.js         — Canvas 合成 / 导出
  engine/presets.js      — 出图预设
```
