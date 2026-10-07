import { Button, Label } from "@heroui/react";

import { FieldSelect, FieldSlider } from "./fields.jsx";

const TOOLS = [
  { id: "select", label: "选择 / 拖动" },
  { id: "node", label: "新增节点" },
  { id: "connect", label: "连接节点" },
  { id: "insert", label: "在线段插入" },
  { id: "delete", label: "删除节点 / 线" },
];

export default function FreeformEditorPanel({
  graph,
  geo,
  photos,
  tool,
  selectedRegion,
  canUndo,
  canRedo,
  onToolChange,
  onRegionPick,
  onRegionSettingChange,
  onSeamChange,
  onUndo,
  onRedo,
  onClear,
}) {
  const regions = geo?.regions || [];
  const activeRegion = regions.find((region) => region.id === selectedRegion) || regions[0] || null;
  const activeId = activeRegion?.id || "";
  const setting = graph.regionSettings?.[activeId] || {};
  const currentCrop = setting.mode === "shared" ? setting.sharedCrop || setting.crop || {} : setting.crop || {};
  const updateCrop = (changes) => {
    const nextCrop = { ...currentCrop, ...changes };
    onRegionSettingChange(
      activeId,
      setting.mode === "shared" ? { sharedCrop: nextCrop, crop: nextCrop } : { crop: nextCrop }
    );
  };
  const photoOptions = photos.length
    ? photos.map((photo, index) => ({ value: photo.id, label: `${index + 1}. ${photo.name || photo.id}` }))
    : [{ value: "", label: "请先导入图片" }];

  return (
    <>
      <div className="freeform-tool-grid">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`freeform-tool${tool === item.id ? " is-active" : ""}`}
            onClick={() => onToolChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="apply-row">
        <span className="apply-label">结构</span>
        <div className="apply-buttons">
          <Button size="sm" variant="ghost" isDisabled={!canUndo} onPress={onUndo}>
            撤销
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!canRedo} onPress={onRedo}>
            重做
          </Button>
          <Button size="sm" variant="ghost" onPress={onClear}>
            清空重建
          </Button>
        </div>
      </div>

      <div className="hint-text">
        先选工具再在画布操作：节点会吸附到外框和附近节点；相交线段会自动拆分为共享节点，只有闭合区域会被用于出图。
      </div>

      {!!geo?.openEdges?.length && (
        <div className="freeform-warning" role="status">
          {geo.openEdges.length} 条线段尚未形成闭合区域，当前不会进入预览或导出。
        </div>
      )}

      <FieldSelect
        label="缝合方式"
        value={graph.seam?.mode || "gap"}
        onChange={(value) => onSeamChange({ mode: value })}
        options={[
          { value: "gap", label: "普通分隔" },
          { value: "stitch", label: "缝线" },
        ]}
      />
      <FieldSlider
        label={graph.seam?.mode === "stitch" ? "缝线宽度" : "间隔宽度"}
        min={0}
        max={20}
        value={Math.round((graph.seam?.width || 0) * 1000)}
        onChange={(value) => onSeamChange({ width: value / 1000 })}
        format={(value) => `${value / 10}%`}
      />
      {graph.seam?.mode === "stitch" && (
        <>
          <FieldSelect
            label="缝线样式"
            value={graph.seam?.style || "solid"}
            onChange={(value) => onSeamChange({ style: value })}
            options={[
              { value: "solid", label: "实线" },
              { value: "dashed", label: "虚线" },
              { value: "dotted", label: "点线" },
            ]}
          />
          <FieldSelect
            label="缝线颜色"
            value={graph.seam?.color || "background"}
            onChange={(value) => onSeamChange({ color: value })}
            options={[
              { value: "background", label: "主题背景" },
              { value: "foreground", label: "主题文字" },
              { value: "accent", label: "主题强调" },
              { value: "card", label: "主题卡片" },
            ]}
          />
          <FieldSlider
            label="缝线透明度"
            min={10}
            max={100}
            value={Math.round((graph.seam?.opacity ?? 1) * 100)}
            onChange={(value) => onSeamChange({ opacity: value / 100 })}
            format={(value) => `${value}%`}
          />
        </>
      )}

      <div className="freeform-region-settings">
        <div className="field-label">
          <Label>区域图片</Label>
          <span className="mono text-[color:var(--accent)]">{regions.length} 个闭合区域</span>
        </div>
        {regions.length > 0 ? (
          <>
            <FieldSelect
              label="当前区域"
              value={activeId}
              onChange={onRegionPick}
              options={regions.map((region, index) => ({ value: region.id, label: `区域 ${index + 1}` }))}
            />
            <FieldSelect
              label="图片模式"
              value={setting.mode || "independent"}
              onChange={(value) => onRegionSettingChange(activeId, { mode: value })}
              options={[
                { value: "independent", label: "独立图片" },
                { value: "shared", label: "整图切割" },
              ]}
            />
            <FieldSelect
              label={setting.mode === "shared" ? "整图来源" : "区域图片"}
              value={setting.mode === "shared" ? setting.sourceId || setting.photoId || photos[0]?.id || "" : setting.photoId || photos[0]?.id || ""}
              onChange={(value) =>
                onRegionSettingChange(
                  activeId,
                  setting.mode === "shared" ? { sourceId: value || null, photoId: value || null } : { photoId: value || null }
                )
              }
              options={photoOptions}
            />
            <FieldSelect
              label="适配方式"
              value={setting.fit || "cover"}
              onChange={(value) => onRegionSettingChange(activeId, { fit: value })}
              options={[
                { value: "cover", label: "填充区域" },
                { value: "contain", label: "完整显示" },
              ]}
            />
            <FieldSlider
              label="区域缩放"
              min={40}
              max={300}
              value={Math.round((currentCrop.zoom || 1) * 100)}
              onChange={(value) => updateCrop({ zoom: value / 100 })}
              format={(value) => `${(value / 100).toFixed(2)}×`}
            />
            <FieldSlider
              label="水平平移"
              min={-100}
              max={100}
              value={Math.round((currentCrop.ox || 0) * 100)}
              onChange={(value) => updateCrop({ ox: value / 100 })}
            />
            <FieldSlider
              label="垂直平移"
              min={-100}
              max={100}
              value={Math.round((currentCrop.oy || 0) * 100)}
              onChange={(value) => updateCrop({ oy: value / 100 })}
            />
          </>
        ) : (
          <div className="hint-text">请先用节点和连线围出一个闭合区域。</div>
        )}
      </div>
    </>
  );
}
