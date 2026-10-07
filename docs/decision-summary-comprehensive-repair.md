# photo-cut 综合修复决策摘要

本次修改只涉及本地工作区，未执行 Git 提交、推送、分支操作或远程仓库修改。

## 产品决策

- `yt-short` 本次只修复右侧互动栏，不新增底部 footer 控制栏。
- 预设能力集中在 `PRESET_DETAILS.capabilities`，未声明的字段按布局能力表和默认能力回退；只有 `lastPreset.patch.layout` 与当前布局一致时才覆盖能力。
- 非角点边界节点可以移动、连接和删除；删除时同时删除其连接线。四个 `frame-*` 角点始终锁定。
- 网页互动图标使用内联 SVG；Canvas 预览和导出继续使用 `drawIcon24`。

## 能力字段

`signature`、`text`、`freeform`、`player`、`videoControls`、`interactionStats`、`texture`、`gap`、`light`、`progressTrack`、`sharedCrop` 由 `resolveLayoutCapabilities` 统一解析。`resolvePanelAvailability` 继续结合照片数量、媒体时长和互动数据决定面板与控件是否显示，隐藏只影响界面，不清空设置。

## 签名行为

签名绘制、导出和画布拖动辅助点共同读取 `signature.enabled` 与布局能力。关闭开关后使用条件渲染和绘制短路移除签名及辅助点；文字、字体、位置、图片资源和自定义字体元数据保留，重新开启即可恢复。

## 边界节点行为

自由拼接节点继续使用 0 到 1 的归一化坐标。命中四条边时记录 `boundary: top/right/bottom/left`，相同位置复用已有节点；移动边界节点时只改变所属边方向坐标，接近角点时合并到锁定 frame 节点。读取旧图或临时相交边时，`buildFreeformGeometry` 先统一拆分和去重，再输出 `nodes`、`edges`、`regions`、`sharedEdges`。

## yt-short 互动栏

互动栏包含点赞、评论、分享和收藏。点赞、收藏复用现有状态，评论和分享使用 `ui.ytCommented`、`ui.ytShared` 并进入设置持久化。点赞、评论、分享没有对应 `ytStats` 数据时隐藏该项目；`showCounts` 关闭时保留图标而隐藏数量。布局比例集中在 `YT_SHORT_CHROME`，网页层与 Canvas 层共享同一套数据可用性判断。

## 验证结果

已通过：

- `npm run build`
- `node tools/verify-grid.mjs`（14/14）
- `node tools/verify-freeform.mjs`（12/12，包含四边节点复用、拆分、拖动、角点合并和删除）
- `node tools/verify-capabilities.mjs`（6/6）
- `node tools/verify-all.mjs` 的静态接线、语法解析、网格、自由拼接和能力阶段
- `node --check electron/main.js`
- `node --check electron/preload.js`
- `node --check src/engine/systemFileApi.js`
- `node tools/verify-interactions.mjs`（Chrome + Vite，41/41；包含签名开关、进度条宽度、yt-short 互动栏和静态面板隐藏）
- `node tools/verify-all.mjs http://127.0.0.1:5173/`（全部阶段通过，端到端 41/41）

真实浏览器验证依赖本机可用的 Chrome 和运行中的 Vite 服务；本次已在本机完成上述检查。
