# photo-cut · AI 修改约束

本文件约束自动化修改（Copilot / Claude / MiMo 等）。**目标：可配置、可复用、不写死。**

---

## 1. 禁止硬编码（最高优先级）

任何改动都不得把下列内容写死在业务代码里。应先查找已有常量 / 配置 / 主题 token，再引用。

| 类型 | 错误做法 | 正确做法 |
|------|----------|----------|
| 颜色 | `fillStyle = "#C9A227"`、`color: #E8E4D9` | UI 用 `var(--amber)` / `var(--ink)`；画布用 `th.accent` / `th.ink`（`THEMES`） |
| 尺寸 | `width: 320px`、`Math.round(W * 0.12)` 散落各处 | 用 CSS 变量（`--rail-w` 等）或已有比例常量；新比例集中定义 |
| 路径 | `"D:/program/photo cut/..."`、写死 `collge-lab` | 相对路径 / `document.baseURI` / `import.meta` / 配置项 |
| 字体 | `font = '500 12px "Xingkai SC"'` 字面量 | `FONTS` / `SIG_FONTS` / `fontStack()`，在 `src/engine/constants.js` 或 `app.js` 常量区维护 |
| 文案 | 界面字符串散落在 JS 逻辑里 | 集中在 HTML 或文案常量；中文 UI 与现有面板语气一致 |
| 布局名 / 预设 id | `"player"`、`"gold"` 内联 | `LAYOUTS` / `PRESETS` / `SIG_POS` 等已有字典 |
| 默认值 | `opacity: 0.9` 多处重复 | `defaultSignature()` / `defaultXxx()` 工厂，或 `state` 默认对象 |
| 魔法数字 | `0.3`、`400`、`12` 无名常量 | 命名常量（如 `SIG_FREE_THRESHOLD`、`UNDO_MAX`）并注释单位与含义 |

### 颜色来源优先级

1. CSS 变量：`--ink` `--panel` `--stage` `--amber` `--muted` `--rule` `--danger`（见 `styles.css` `:root`，与 `DESIGN_NOTES.md` 一致）
2. 画布主题：`THEMES[state.theme]` → `th.ink` / `th.accent` / `th.sub` / `th.bg` / `th.card`
3. 功能色板：签名预设色、灯光色、播放钮色 — 走 UI 控件绑定的 `state.*`，不要在绘制函数里写死

### 允许写死的例外（需注释原因）

- Canvas 渐变的**语义 stop 名**（金/银）若业务即为固定材质，可集中在**单一常量表**（如 `GRADIENT_GOLD = [...]`），禁止在 `draw*` 函数内就地字面量。
- 安全尺寸上限（如导出 8000px）可定义为具名常量。
- 与第三方品牌色无关的一次性 debug 样式不得合入。

---

## 2. 修改前必查

1. **先搜常量**：`THEMES`、`FONTS`、`SIG_FONTS`、`GAP`、`RADIUS`、`RATIOS`、`PRESETS`、`defaultSignature`、`collectSettings`。
2. **UI 颜色/间距**：只改 `styles.css` 的 token 或组件规则，不要在 `index.html` 内联 `style="color:#fff"`。
3. **新状态字段**：必须同时更新 — `state` 默认值、`collectSettings`、`applySettings`、`syncControlsFromState`（若需要持久化/撤销）。
4. **绘制**：导出与预览共用 `paintCollage`；预览专用叠层只画在 `render()`，禁止进导出路径。
5. **不改无关行为**：导出主流程、布局算法、裁剪逻辑无需求勿动。

---

## 3. 工程约束

- 不引入新依赖；继续原生 Canvas + 现有 React/Vite 结构。
- 中文文案、面板命名与现有 UI 一致。
- 完成后自检：`node --check`（或构建）通过；能预览的路径不要求手工点开，但不得留下语法/引用错误。
- 禁止把机器绝对路径写进源码或文档示例（文档可用 `photo-cut/` 相对说明）。

---

## 4. 抽取规则（何时提取常量）

出现下列情况时**先提取再写逻辑**，不要复制粘贴第二处：

- 同一颜色 / 比例 / 字体栈出现第 2 次
- 同一魔法数在两个绘制函数中重复
- 新功能需要默认对象（与 `defaultSignature` 同类）

提取位置：

| 用途 | 位置 |
|------|------|
| 主题色 / 字体 / 布局字典 | `src/engine/constants.js`（若拆分）或 `app.js` 顶部常量区 |
| CSS 颜色、间距、圆角 | `styles.css` `:root` |
| 产品命名、窗口标题 | `package.json`、`electron-builder.json`、`electron/main.js`、`index.html` — 保持一处语义、多处引用 |

---

## 5. 反例（本仓库真实踩坑）

1. 在 `styles.css` 末尾追加一长串写死的 `#1C1B18` / `#C9A227` 覆盖 — 应改为覆盖 `:root` token，组件规则继续 `var(--*)`。
2. 脚本或 verify 里写死 `file:///D:/program/photo cut/collge-lab/...` — 目录已改名即失效；应使用相对项目根解析。
3. 画布签名色渐变 stop 写在 `drawSignature` 分支内 — 应集中为命名常量表。

---

## 6. 验收（给 AI 自检用）

- [ ] 新代码中无无说明的字面量颜色 / 路径 / 字体栈
- [ ] UI 色均来自 CSS 变量或 `THEMES`
- [ ] 新 `state` 字段已进入 settings 持久化链（如需要）
- [ ] 未改动导出与预览不一致的行为
- [ ] 文档与源码中无本机绝对路径


---

# 改动统一性操作文档（基于当前代码库摸底）

> 本节是在既有 AI 修改约束之上追加的项目协作规则。历史聊天记录只作为背景资料；实际规则以当前代码和本文件为准。

## 1. 项目概览

- 技术栈：React 19、React DOM、Vite 6、原生 Canvas、HeroUI、Tailwind CSS Vite 插件；桌面发行由 Electron 33 与 electron-builder 负责。
- 主入口：根目录 `index.html` 加载 `src/main.jsx`；`src/main.jsx` 挂载 `src/App.jsx`，并加载 `src/styles.css`。
- 核心目录：
  - `src/App.jsx`：拼贴编辑器页面、状态、交互、设置持久化、预览与导出调用。
  - `src/engine/`：常量、主题、布局、网格、预设、Canvas 绘制和图标等纯逻辑。
  - `src/components/`：面板和字段级 React 组件。
  - `src/hooks/`：可复用 React hooks，例如 `useUiTheme.js`。
  - `react/`：独立播放器和社交组件演示，组件与同名 CSS 配对。
  - `demos/`：播放器 HTML/JS/CSS 演示页面。
  - `electron/`：桌面窗口入口与 preload。
  - `tools/`：静态接线、构建和浏览器交互自检脚本。
- 资源目录：`assets/`、`icon/`；构建输出为 `dist/`，临时验证产物为 `.verify/` 或 `output/`。
- 常用命令：`npm run dev` 启动 Vite；`npm run build` 构建；`npm run preview` 预览构建；`npm run electron:dev` 启动桌面开发环境；`npm run electron:build` 构建桌面包；`node tools/verify-all.mjs` 执行综合自检（需要已运行的 Vite 服务）。修改后至少运行与改动范围匹配的构建或 `node --check`。
- 根目录的历史 `app.js` 与 `styles.css` 属于旧版/兼容资源。新功能默认进入 `src/`；只有确认调用链仍依赖旧文件时才修改它们。

## 2. 命名规范

- JavaScript 变量、函数、hook 使用 camelCase，例如 `paintCollage`、`customGridGeometry`、`useUiTheme`。
- React 组件、组件文件和默认导出使用 PascalCase，例如 `GridEditorPanel.jsx`、`ThemeToggle.jsx`、`LayoutThumb.jsx`。
- 引擎模块文件使用小写 kebab-free 名称，例如 `constants.js`、`layouts.js`、`draw.js`；同一领域的字典使用全大写，例如 `THEMES`、`LAYOUTS`、`PRESETS`、`RATIOS`。
- CSS 类名采用小写短横线，例如 `field-row`、`field-label`、`is-dragging-sig`；播放器演示的类名以组件前缀组织，例如 `yt-player`。
- 状态字段使用语义 camelCase，并沿用已有领域词汇，例如 `customGrid`、`activeId`、`exportFormat`、`signature`。新增字段必须进入默认状态和需要的设置同步链。
- 路由和入口没有独立路由库；不要虚构路由命名规则。新增页面入口应在现有 HTML 或 React 挂载点中明确注册。

## 3. 代码风格

- 使用 ES modules；React 文件使用 JSX。导入顺序为：React/第三方库、引擎或 hooks、组件、当前文件 CSS；同组导入按已有文件的自然顺序维护。
- 项目没有统一格式化配置文件；保持现有两空格缩进、双引号、语句分号和尾随逗号风格。不要为了格式化顺手重排无关文件。
- 注释以中文为主，说明“为什么”以及单位/边界；已有模块注释密度较高，新逻辑应在复杂算法、坐标换算、持久化兼容处补充短注释。
- UI 文案使用中文并贴合现有面板语气；可复用文案集中在 HTML、预设或常量，不把同一句提示散落在多个事件处理器中。
- 错误处理采用局部保护：可恢复的本地存储、图片加载和导出错误使用 `try/catch` 或空值判断，并通过现有 toast/状态反馈；不要吞掉需要修复的异常。
- 日志仅用于开发诊断；提交代码不得新增无意义的 `console.log`。浏览器自检脚本用步骤标签和退出状态报告结果。

## 4. 架构模式

- 页面层：`src/App.jsx` 负责组合面板、持有 state、处理用户事件，并调用引擎函数；不要把 Canvas 几何算法复制进组件事件中。
- 引擎层：`src/engine/constants.js` 放主题、字体、比例、限制和默认工厂；`layouts.js` 负责尺寸与布局几何；`grid.js` 负责网格归一化、分隔线和节点运算；`draw.js` 负责预览与导出共用的 Canvas 绘制；`presets.js` 负责预设字典。
- 组件层：`src/components/fields.jsx` 提供字段包装，面板组件组合这些字段；新增相同交互先扩展公共字段组件，再由面板传入值和回调。
- 数据流：用户操作 → `App.jsx` 的 `patch/setState` → 归一化或默认工厂 → `paintCollage`/组件渲染；设置通过 localStorage 的 `SETTINGS_KEY` 持久化，图片对象不写入设置。
- 依赖方向：组件可依赖 hooks 和 engine；engine 不依赖 React 组件；绘制函数只接收状态和尺寸，不读取 DOM。
- 标准新增功能样板：先在 `constants.js` 增加默认值/字典；在对应 engine 模块增加纯函数；在 `App.jsx` 接入 state、持久化和事件；在 `src/components/` 增加或复用面板；在 `src/styles.css` 使用 token 完成样式；最后运行构建与相关 `tools/verify-*.mjs`。预览与导出必须共用同一绘制入口。

## 5. 复用清单

新增代码必须优先复用以下现有能力：

- 主题与字体：`THEMES`、`FONTS`、`SIG_FONTS`、`themeOf`、`fontStack`。
- 状态与默认值：`defaultState`、`defaultCustomGrid`、`defaultShapePick`、已有 `patch` 和 `normalizeGrid`。
- 布局与绘制：`previewSize`、`customGridGeometry`、`paintCollage`、`exportImage`、`drawIcon24`。
- 网格操作：`evenDividers`、`respaceDividers`、`remapShapes`、`pruneNodes` 及现有 undo/redo 栈。
- UI 字段：`FieldSelect`、`FieldSlider`、`FieldText`；主题切换使用 `useUiTheme` 与 `ThemeToggle`。
- 禁止为已有能力再写第二套主题解析、尺寸换算、Canvas 图标、网格归一化、字段布局或 localStorage 读写。

## 6. 禁止事项（Anti-patterns）

- 颜色写死：错误 `color: #C9A227` → 正确使用 `var(--amber)`；Canvas 使用 `themeOf(state)` 返回的主题字段。
- 字体写死：错误在绘制函数内写 `"Xingkai SC"` → 正确通过 `FONTS`/ `SIG_FONTS` 和 `fontStack()` 取得。
- 重复布局算法：错误在组件内重新计算网格像素 → 正确调用 `previewSize`、`customGridGeometry` 或 `computeSlots`。
- 预览导出分叉：错误只在 React effect 画签名 → 正确把导出内容放进 `paintCollage` 共用路径，预览专属辅助层只放在 render。
- 状态孤岛：错误只在 `useState` 增加字段 → 正确同步 `defaultState`、读取合并、保存过滤/序列化和控件回填。
- 组件重复：错误为每个面板复制 select/slider/input 包装 → 正确复用 `src/components/fields.jsx`。
- 路径写死：错误写机器绝对路径或旧项目名 → 正确使用相对路径、`document.baseURI`、`import.meta` 或配置。
- 无关重构：错误借功能修改顺手批量改旧版 `app.js` → 正确只改当前调用链需要的最小文件。
- 验证缺失：错误只说明“看起来没问题” → 正确运行 `npm run build` 或对应自检，并记录结果与未覆盖项。

## 7. 改动流程

1. 每次动手前先读取本文件，并在工作记录中声明遵守的章节；先搜索相关常量、默认工厂和复用函数。
2. 先确认调用链和实际入口，再做最小范围的一件事；不因风格偏好批量重写旧代码。
3. 新场景优先采用最接近的既有模式；若出现本文件未覆盖的命名、分层或复用决策，完成改动后把规则补入对应章节，并在交付说明中指出新增规则。
4. 涉及新状态时检查默认值、持久化、恢复和控件同步；涉及绘制时检查预览与导出是否仍走同一入口。
5. 完成后执行与改动匹配的构建/语法/交互自检，并逐条核对第 6 节；报告实际执行的命令、结果和任何未验证项。
6. 文档与代码必须同步：目录、命令、命名和架构发生变化时，在同一改动中更新本文件；不得留下已知不实描述。


## 长线功能补充规则（2026-10）

- 本地二进制资源（自定义字体、签名图）走 `src/engine/assetStore.js` 的 IndexedDB 封装；设置状态只保存可恢复的元数据或小型 data URL，不在组件中重复打开数据库。
- 签名文字、签名图片和拖动辅助点都必须使用 `paintCollage` 的共用绘制数据；辅助点只存在预览 DOM 层，不得进入导出画布。
- 播放器进度、缓冲和社交统计属于 `state.ui` / `state.*Stats`，Canvas 绘制从状态读取，禁止在 `draw.js` 内写死播放百分比或互动数量。
- 预设入口使用 `PRESET_GROUPS` 与 `PRESET_DETAILS` 提供用途、画幅和说明；新增预设必须同时补充补丁和说明元数据。

## 自由不规则拼接规则（2026-10）

- `state.customGrid.mode === "freeform"` 才启用自由图；旧版没有该字段或值为 `"grid"` 时继续走规则网格 `colsX` / `rowsY` / `nodes` 数据。
- 自由图数据放在 `state.customGrid.freeform`：`nodes` 与 `edges` 使用 0–1 归一化坐标，矩形外框由固定 frame 节点组成，闭合区域由 `buildFreeformGeometry` 从平面图计算，不得写死区域数量或布局。
- 新增、连接、插入、移动和删除操作必须调用 `src/engine/freeform.js` 的纯函数；交点自动转成共享节点并拆分边，禁止在 React 组件内复制相交或多边形算法。
- 区域图片模式、图片引用、裁剪参数放在 `freeform.regionSettings[regionId]`；整图切割使用 `sourceId` 标识共享图片组，并由 `sharedCrop` 提供组级裁剪规则；普通分隔和缝线放在 `freeform.seam`。这些字段随现有 `customGrid` 设置链保存和恢复。
- `buildFreeformGeometry` 必须返回 `openEdges` 诊断，界面需提示未形成闭合区域的开放线段，并在绘制与导出时跳过无效区域。
- 自由区域绘制必须继续经过 `paintCollage`：区域图片按真实多边形裁剪，整图切割模式在同一画布坐标下绘制后再裁剪；节点、边和选中辅助层只能存在预览 SVG。
