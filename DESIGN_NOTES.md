# photo-cut — 设计方向

> AI / 自动改码请先读 [AGENTS.md](./AGENTS.md) — 禁止硬编码颜色、路径、字体与魔法数。

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
  engine/constants.js    — 布局/主题/形状/默认状态
  engine/layouts.js      — 槽位计算（含自定义网格）
  engine/grid.js         — 自定义网格几何内核
  engine/shapes.js       — 形状蒙版单位路径
  engine/draw.js         — Canvas 合成 / 导出
  engine/presets.js      — 出图预设
  components/            — Overlay / 面板 / 通用字段控件
tools/verify-all.mjs     — 一键自检（静态接线 + 语法 + 几何 + 真实浏览器交互）
```

## 自定义网格（高级编辑）
在「布局」里选 **自定义网格**，右侧出现「高级编辑」面板，画布叠一层仅预览可见的编辑层。

- **几何一律 0–1 归一化**，存于 `state.customGrid`：导出时 `resolveExportSize()` 换尺寸重画，
  以像素存储的几何会立刻失真。`tools/verify-grid.mjs` 专门守这条不变式。
- **节点共享形变**：同一交叉点（`node`）被四格共享，拖动它四格同步变形；拖分隔线则线上的节点整体平移。
  画布边缘的角没有可拖节点，故线的两端停在边缘（与美图一致）。
- **间距 = 逐边等距内缩**：每条边沿自身内法线内移 `cellGap/2`，再求相邻边交点。
  按形心比例缩放做不到这点——非正方形格子两个方向的内缩量会不等。
- **形状蒙版**：`SHAPES`（`engine/constants.js`）给 id 与中文名，几何在 `engine/shapes.js`，
  单位方块路径在绘制时映射到槽位矩形。形状与导出共用同一份实现，禁止两套。
- **外边框 / 格间距** 以 800 短边为设计基准，与 `GAP` / `RADIUS` 同规则缩放。

### 改这块之后的固定动作
先 `npm run dev`，再跑 `node tools/verify-all.mjs http://localhost:5173/`。
esbuild 只能逐文件转译：**跨文件的漏导入（如 `App.jsx` 用了 `GRID_LIMIT` 却没 import）
静态查不出来，点了那个按钮才会白屏**，所以必须有真实浏览器点一遍的那一步。
