import { Button, Label, Switch } from "@heroui/react";

import { FieldSlider, FieldSelect } from "./fields.jsx";
import FreeformEditorPanel from "./FreeformEditorPanel.jsx";
import { SHAPES, SHAPE_GROUPS, SHAPE_FITS, DEFAULT_SHAPE_ID, GRID_LIMIT } from "../engine/constants.js";
import { shapeThumbPoints } from "../engine/shapes.js";

/**
 * 自定义网格 · 高级编辑面板。
 *
 * 纯展示 + 回调：几何全部由 App 经 engine/grid.js 维护，
 * 本组件不自己算布局，也不写死颜色 / 尺寸（颜色走 styles.css 令牌）。
 */
export default function GridEditorPanel({
  grid,
  shapePick,
  selectedCount,
  shapedCount,
  multi,
  canUndo,
  canRedo,
  hasPhotos,
  hasGrid,
  onToggleEdit,
  onStep,
  onReset,
  onUndo,
  onRedo,
  onPadChange,
  onGapChange,
  onMultiChange,
  onPickShape,
  onFitChange,
  onApplyToSelected,
  onApplyToAll,
  onClearShapes,
  onShuffle,
  onModeChange,
  freeformGeometry,
  freeformTool,
  onFreeformToolChange,
  onFreeformRegionPick,
  selectedRegion,
  onFreeformRegionSettingChange,
  onFreeformSeamChange,
  onFreeformClear,
  photos = [],
}) {
  const pick = shapePick || {};
  const activeShape = pick.shape || DEFAULT_SHAPE_ID;

  if (grid.mode === "freeform") {
    return (
      <div className="panel-section">
        <h2>楂樼骇缂栬緫</h2>
        <FieldSelect
          label="编辑模式"
          value="freeform"
          onChange={onModeChange}
          options={[{ value: "grid", label: "规则网格" }, { value: "freeform", label: "自由不规则" }]}
        />
        <Switch isSelected={!!grid.on} onChange={onToggleEdit} className="mb-3">
          <Switch.Control><Switch.Thumb /></Switch.Control>
          <Switch.Content><Label>自由拼接编辑</Label></Switch.Content>
        </Switch>
        <FreeformEditorPanel
          graph={grid.freeform}
          geo={freeformGeometry}
          photos={photos}
          tool={freeformTool}
          selectedRegion={selectedRegion}
          canUndo={canUndo}
          canRedo={canRedo}
          onToolChange={onFreeformToolChange}
          onRegionPick={onFreeformRegionPick}
          onRegionSettingChange={onFreeformRegionSettingChange}
          onSeamChange={onFreeformSeamChange}
          onUndo={onUndo}
          onRedo={onRedo}
          onClear={onFreeformClear}
        />
      </div>
    );
  }

  return (
    <div className="panel-section">
      <h2>高级编辑</h2>

      <FieldSelect
        label="编辑模式"
        value={grid.mode || "grid"}
        onChange={onModeChange}
        options={[{ value: "grid", label: "规则网格" }, { value: "freeform", label: "自由不规则" }]}
      />

      <Switch isSelected={!!grid.on} onChange={onToggleEdit} className="mb-3">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>网格编辑</Label>
        </Switch.Content>
      </Switch>

      <div className="apply-row">
        <span className="apply-label">行列</span>
        <div className="apply-buttons">
          <Button size="sm" variant="ghost" isDisabled={grid.rows >= GRID_LIMIT} onPress={() => onStep("row", 1)}>
            加行
          </Button>
          <Button size="sm" variant="ghost" isDisabled={grid.rows <= 1} onPress={() => onStep("row", -1)}>
            减行
          </Button>
          <Button size="sm" variant="ghost" isDisabled={grid.cols >= GRID_LIMIT} onPress={() => onStep("col", 1)}>
            加列
          </Button>
          <Button size="sm" variant="ghost" isDisabled={grid.cols <= 1} onPress={() => onStep("col", -1)}>
            减列
          </Button>
        </div>
      </div>

      <div className="apply-row">
        <span className="apply-label">几何</span>
        <div className="apply-buttons">
          <Button size="sm" variant="ghost" onPress={onReset}>
            重置网格
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!canUndo} onPress={onUndo}>
            撤销
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!canRedo} onPress={onRedo}>
            重做
          </Button>
        </div>
      </div>

      <FieldSlider
        label="外边框"
        min={0}
        max={80}
        value={grid.outerPad}
        onChange={onPadChange}
        format={(v) => `${v}px`}
      />
      <FieldSlider
        label="格间距"
        min={0}
        max={80}
        value={grid.cellGap}
        onChange={onGapChange}
        format={(v) => `${v}px`}
      />
      <div className="hint-text">
        拖动白线移动整条分隔线，拖动蓝色节点只调整该交点；在画布上点选格子后再套形状。
      </div>

      <Switch isSelected={multi} onChange={onMultiChange} className="mb-3">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>多选格子</Label>
        </Switch.Content>
      </Switch>

      <div className="apply-row">
        <span className="apply-label">形状</span>
        <div className="apply-buttons">
          <Button size="sm" variant="ghost" isDisabled={!selectedCount} onPress={() => onApplyToSelected(activeShape)}>
            应用到所选
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!hasGrid} onPress={() => onApplyToAll(activeShape)}>
            全部应用
          </Button>
          <Button size="sm" variant="ghost" onPress={onClearShapes}>
            清除形状
          </Button>
        </div>
      </div>

      <div className="hint-text">
        已选 {selectedCount} 格 · 已套形状 {shapedCount} 格
      </div>

      {SHAPE_GROUPS.map((group) => (
        <div className="shape-block" key={group.id}>
          <div className="shape-block-label">{group.label}</div>
          <div className="shape-grid">
            {group.items.map((id) => (
              <button
                key={id}
                type="button"
                className={`shape-card ${activeShape === id ? "is-active" : ""}`}
                title={SHAPES[id]?.name || id}
                onClick={() => onPickShape(id)}
              >
                <svg viewBox="0 0 100 100" aria-hidden>
                  <polygon points={shapeThumbPoints(id).map((p) => p.join(",")).join(" ")} />
                </svg>
                <span>{SHAPES[id]?.name || id}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <FieldSelect
        label="形状填充"
        value={pick.fit || "cover"}
        onChange={onFitChange}
        options={Object.values(SHAPE_FITS).map((f) => ({ value: f.id, label: f.label }))}
      />

      <div className="apply-row">
        <span className="apply-label">照片</span>
        <div className="apply-buttons">
          <Button size="sm" variant="ghost" isDisabled={!hasPhotos} onPress={onShuffle}>
            随机交换位置
          </Button>
        </div>
      </div>
    </div>
  );
}
