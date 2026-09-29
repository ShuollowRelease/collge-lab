import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Select,
  Slider,
  Switch,
  Tabs,
  TextField,
  Input,
  Label,
  ListBox,
  Separator,
} from "@heroui/react";

import { LAYOUTS, RATIOS, THEMES, defaultState, FONTS } from "./engine/constants.js";
import { paintCollage, exportImage, themeOf } from "./engine/draw.js";
import { previewSize } from "./engine/layouts.js";
import { PRESET_GROUPS, PRESETS } from "./engine/presets.js";
import { useUiTheme } from "./hooks/useUiTheme.js";
import ThemeToggle from "./components/ThemeToggle.jsx";

const SETTINGS_KEY = "photo-cut-settings-v3";

function LayoutThumb({ cells }) {
  return (
    <svg className="thumb" viewBox="0 0 100 100" aria-hidden>
      <rect width="100" height="100" fill="#121110" />
      {cells.map((c, i) => (
        <rect key={i} x={c[0]} y={c[1]} width={c[2]} height={c[3]} rx="2" fill={i === 0 ? "#c9a227" : "#3a372f"} />
      ))}
    </svg>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div className="field-row">
      <Label className="text-xs text-[color:var(--muted)]">{label}</Label>
      <Select
        selectedKey={value}
        onSelectionChange={(k) => onChange(String(k))}
        variant="secondary"
        className="w-full"
        aria-label={label}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {options.map((op) => (
              <ListBox.Item key={op.value} id={op.value}>
                {op.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

function FieldSlider({ label, value, min, max, step = 1, onChange, format }) {
  return (
    <div className="field-row">
      <div className="field-label">
        <span>{label}</span>
        <span className="mono text-[color:var(--accent)]">{format ? format(value) : value}</span>
      </div>
      <Slider
        minValue={min}
        maxValue={max}
        step={step}
        value={value}
        onChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        aria-label={label}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}

function FieldText({ label, value, onChange, placeholder, maxLength = 60 }) {
  return (
    <div className="field-row">
      <Label className="text-xs text-[color:var(--muted)]">{label}</Label>
      <TextField value={value} onChange={onChange} className="w-full" aria-label={label}>
        <Input placeholder={placeholder} maxLength={maxLength} variant="secondary" />
      </TextField>
    </div>
  );
}

export default function App() {
  const { mode: uiTheme, setTheme: setUiTheme } = useUiTheme();
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return { ...defaultState(), ...saved, photos: [], signature: { ...defaultState().signature, ...(saved.signature || {}) } };
      }
    } catch {
      /* ignore */
    }
    return defaultState();
  });
  const [tab, setTab] = useState("photos");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const dropRef = useRef(null);
  const previewWrapRef = useRef(null);

  const patch = useCallback((p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })), []);

  const photos = state.photos;
  const activePhoto = photos.find((p) => p.id === state.activeId) || photos[0] || null;

  const size = useMemo(() => previewSize(state, 760, 640), [state.ratio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size.w, size.h);
    paintCollage(ctx, state, size.w, size.h);
  }, [state, size.w, size.h]);

  useEffect(() => {
    const { photos: _photos, ...rest } = state;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const addFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      const loaded = await Promise.all(
        files.map(
          (file, idx) =>
            new Promise((resolve) => {
              const url = URL.createObjectURL(file);
              const img = new Image();
              img.onload = () =>
                resolve({
                  id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  img,
                  url,
                  crop: { zoom: 1, ox: 0, oy: 0 },
                });
              img.onerror = () => resolve(null);
              img.src = url;
            })
        )
      );
      const next = loaded.filter(Boolean);
      setState((s) => {
        const photos = [...s.photos, ...next];
        return { ...s, photos, activeId: s.activeId || next[0]?.id || null };
      });
    },
    []
  );

  const onExport = useCallback(async () => {
    if (!state.photos.length) {
      setToast("请先添加照片");
      return;
    }
    setBusy(true);
    try {
      const { blob, width, height } = await exportImage(state, size.w, size.h);
      if (!blob) throw new Error("export failed");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `photo-cut-${Date.now()}.${state.exportFormat === "png" ? "png" : "jpg"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setToast(`已导出 ${width}×${height}`);
    } catch (e) {
      setToast(e?.message || "导出失败");
    } finally {
      setBusy(false);
    }
  }, [state, size.w, size.h]);

  const applyPreset = (id) => {
    const p = PRESETS[id];
    if (!p) return;
    patch((s) => ({ ...s, ...p.patch, lastPreset: id }));
  };

  const th = themeOf(state);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <div className="brand">
            photo<span>-cut</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="text-xs text-[color:var(--muted)]">React + HeroUI · 本机拼贴</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle mode={uiTheme} onChange={setUiTheme} />
          <Button variant="ghost" size="sm" onPress={() => patch(defaultState())}>
            重置
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              const { photos: _p, ...rest } = state;
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
              setToast("已记住设置");
            }}
          >
            记住设置
          </Button>
          <Button variant="primary" size="sm" onPress={onExport} isDisabled={!photos.length || busy}>
            {busy ? "导出中…" : "导出"}
          </Button>
        </div>
      </header>

      <div className="workspace">
        <aside className="rail">
          <Tabs
            selectedKey={tab}
            onSelectionChange={setTab}
            className="px-2 pt-2"
            aria-label="设置分区"
          >
            <Tabs.ListContainer>
              <Tabs.List>
                <Tabs.Tab id="photos">照片</Tabs.Tab>
                <Tabs.Tab id="look">外观</Tabs.Tab>
                <Tabs.Tab id="text">文字</Tabs.Tab>
                <Tabs.Tab id="export">导出</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="photos">
              <div className="panel-section">
                <h2>出图预设</h2>
                <div className="preset-grid">
                  {PRESET_GROUPS.flatMap((g) => g.items).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`preset-chip ${state.lastPreset === id ? "is-active" : ""}`}
                      onClick={() => applyPreset(id)}
                    >
                      {PRESETS[id]?.name || id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-section">
                <h2>照片</h2>
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="secondary" onPress={() => fileRef.current?.click()}>
                    选择图片
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={!photos.length}
                    onPress={() => patch({ photos: [], activeId: null })}
                  >
                    清空
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div
                  ref={dropRef}
                  className="dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    dropRef.current?.classList.add("is-over");
                  }}
                  onDragLeave={() => dropRef.current?.classList.remove("is-over")}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropRef.current?.classList.remove("is-over");
                    addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  {photos.length ? `${photos.length} 张照片 · 可继续拖入` : "拖入或选择照片"}
                </div>

                {photos.length > 0 && (
                  <div className="filmstrip mt-3">
                    {photos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`film-thumb ${state.activeId === p.id ? "is-active" : ""}`}
                        onClick={() => patch({ activeId: p.id })}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activePhoto && (
                <div className="panel-section">
                  <h2>当前照片</h2>
                  <div className="text-xs text-[color:var(--muted)] mb-2 truncate">{activePhoto.name}</div>
                  <FieldSlider
                    label="缩放"
                    min={100}
                    max={300}
                    value={Math.round((activePhoto.crop?.zoom || 1) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, zoom: v / 100 } } : p
                        ),
                      }))
                    }
                    format={(v) => `${(v / 100).toFixed(2)}×`}
                  />
                  <FieldSlider
                    label="水平偏移"
                    min={-100}
                    max={100}
                    value={Math.round((activePhoto.crop?.ox || 0) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, ox: v / 100 } } : p
                        ),
                      }))
                    }
                  />
                  <FieldSlider
                    label="垂直偏移"
                    min={-100}
                    max={100}
                    value={Math.round((activePhoto.crop?.oy || 0) * 100)}
                    onChange={(v) =>
                      patch((s) => ({
                        ...s,
                        photos: s.photos.map((p) =>
                          p.id === activePhoto.id ? { ...p, crop: { ...p.crop, oy: v / 100 } } : p
                        ),
                      }))
                    }
                  />
                </div>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="look">
              <div className="panel-section">
                <h2>布局</h2>
                <div className="layout-grid">
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className={`layout-card ${state.layout === l.id ? "is-active" : ""}`}
                      onClick={() => patch({ layout: l.id })}
                    >
                      <LayoutThumb cells={l.thumb} />
                      <div className="name">{l.name}</div>
                      <div className="hint">{l.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-section">
                <h2>画布</h2>
                <FieldSelect
                  label="比例"
                  value={state.ratio}
                  onChange={(v) => patch({ ratio: v })}
                  options={Object.keys(RATIOS).map((k) => ({ value: k, label: k }))}
                />
                <FieldSelect
                  label="主题"
                  value={state.theme}
                  onChange={(v) => patch({ theme: v })}
                  options={Object.entries(THEMES).map(([k, t]) => ({ value: k, label: k }))}
                />
                <FieldSelect
                  label="列数"
                  value={state.cols}
                  onChange={(v) => patch({ cols: v })}
                  options={[
                    { value: "auto", label: "自动" },
                    { value: "4", label: "4" },
                    { value: "5", label: "5" },
                    { value: "6", label: "6" },
                    { value: "7", label: "7" },
                  ]}
                />
                <FieldSelect
                  label="背景"
                  value={state.bgMode}
                  onChange={(v) => patch({ bgMode: v })}
                  options={[
                    { value: "solid", label: "纯色" },
                    { value: "gradient", label: "渐变" },
                    { value: "photo", label: "照片底" },
                  ]}
                />
                {state.bgMode === "photo" && (
                  <FieldSlider
                    label="淡影浓度"
                    min={5}
                    max={60}
                    value={Math.round((state.ghost || 0.35) * 100)}
                    onChange={(v) => patch({ ghost: v / 100 })}
                    format={(v) => (v / 100).toFixed(2)}
                  />
                )}
              </div>

              <div className="panel-section">
                <h2>质感与光</h2>
                <FieldSelect
                  label="间距"
                  value={state.gap}
                  onChange={(v) => patch({ gap: v })}
                  options={[
                    { value: "none", label: "无" },
                    { value: "narrow", label: "窄" },
                    { value: "standard", label: "标准" },
                    { value: "wide", label: "宽" },
                  ]}
                />
                <FieldSelect
                  label="圆角"
                  value={state.radius}
                  onChange={(v) => patch({ radius: v })}
                  options={[
                    { value: "none", label: "直角" },
                    { value: "soft", label: "柔和" },
                    { value: "medium", label: "中等" },
                    { value: "large", label: "大圆角" },
                  ]}
                />
                <FieldSelect
                  label="颗粒"
                  value={state.grain}
                  onChange={(v) => patch({ grain: v })}
                  options={[
                    { value: "none", label: "无" },
                    { value: "grain", label: "颗粒" },
                    { value: "paper", label: "纸纹" },
                    { value: "both", label: "两者" },
                  ]}
                />
                <FieldSelect
                  label="光效"
                  value={state.light}
                  onChange={(v) => patch({ light: v })}
                  options={[
                    { value: "none", label: "无" },
                    { value: "warm", label: "暖光" },
                    { value: "cool", label: "冷光" },
                    { value: "vignette", label: "暗角" },
                    { value: "softbox", label: "柔光箱" },
                  ]}
                />
                {state.light !== "none" && (
                  <>
                    <FieldSlider
                      label="光效强度"
                      min={0}
                      max={100}
                      value={Math.round((state.lightStrength || 0.45) * 100)}
                      onChange={(v) => patch({ lightStrength: v / 100 })}
                      format={(v) => (v / 100).toFixed(2)}
                    />
                    <div className="field-row">
                      <Label className="text-xs text-[color:var(--muted)]">光色</Label>
                      <div className="flex items-center gap-2">
                        <input
                          className="color-swatch"
                          type="color"
                          value={state.lightColor}
                          onChange={(e) => patch({ lightColor: e.target.value })}
                        />
                        <span className="mono text-[color:var(--muted)]">
                          {state.lightColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="text">
              <div className="panel-section">
                <h2>文字版式</h2>
                <FieldSelect
                  label="样式"
                  value={state.textStyle}
                  onChange={(v) => patch({ textStyle: v })}
                  options={[
                    { value: "head-footer", label: "头尾" },
                    { value: "edition", label: "编辑" },
                    { value: "center", label: "居中大字" },
                    { value: "top", label: "顶部" },
                  ]}
                />
                <FieldText label="标题" value={state.title} onChange={(v) => patch({ title: v })} placeholder="Enter 可换行，最多 3 行" />
                <FieldText label="副标题" value={state.subtitle} onChange={(v) => patch({ subtitle: v })} placeholder="右上角小字" maxLength={40} />
                <FieldText label="页脚" value={state.footer} onChange={(v) => patch({ footer: v })} placeholder="Through the Lens" maxLength={40} />
                <FieldText label="副页脚" value={state.subfooter} onChange={(v) => patch({ subfooter: v })} placeholder="© 2026" maxLength={40} />
                <FieldSelect
                  label="主字体"
                  value={state.font}
                  onChange={(v) => patch({ font: v })}
                  options={Object.keys(FONTS).map((k) => ({ value: k, label: k }))}
                />
                <FieldSelect
                  label="辅助字体"
                  value={state.fontSub}
                  onChange={(v) => patch({ fontSub: v })}
                  options={Object.keys(FONTS).map((k) => ({ value: k, label: k }))}
                />
                <Switch
                  isSelected={!!state.glow}
                  onChange={(v) => patch({ glow: v })}
                  className="mb-2"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>标题发光</Label>
                  </Switch.Content>
                </Switch>
              </div>

              <div className="panel-section">
                <h2>签名</h2>
                <Switch
                  isSelected={!!state.signature?.enabled}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, enabled: v } }))}
                  className="mb-2"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>显示签名</Label>
                  </Switch.Content>
                </Switch>
                <FieldText
                  label="签名文字"
                  value={state.signature?.text || ""}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, text: v } }))}
                  placeholder="你的签名"
                  maxLength={20}
                />
                <FieldSlider
                  label="大小"
                  min={4}
                  max={16}
                  value={Math.round((state.signature?.size || 0.08) * 100)}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, size: v / 100 } }))}
                />
                <FieldSlider
                  label="旋转"
                  min={-30}
                  max={30}
                  value={state.signature?.rotate ?? -6}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, rotate: v } }))}
                />
                <FieldSlider
                  label="不透明度"
                  min={10}
                  max={100}
                  value={Math.round((state.signature?.opacity ?? 0.72) * 100)}
                  onChange={(v) => patch((s) => ({ ...s, signature: { ...s.signature, opacity: v / 100 } }))}
                />
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="export">
              <div className="panel-section">
                <h2>导出与出片</h2>
                <FieldSelect
                  label="尺寸"
                  value={state.exportSize}
                  onChange={(v) => patch({ exportSize: v })}
                  options={[
                    { value: "ig", label: "社媒 1080" },
                    { value: "x", label: "高清 2160" },
                    { value: "original", label: "原始 2×" },
                  ]}
                />
                <FieldSelect
                  label="格式"
                  value={state.exportFormat}
                  onChange={(v) => patch({ exportFormat: v })}
                  options={[
                    { value: "jpg", label: "JPG" },
                    { value: "png", label: "PNG" },
                  ]}
                />
                <FieldSlider
                  label="目标体积"
                  min={1}
                  max={8}
                  value={state.maxMB || 2}
                  onChange={(v) => patch({ maxMB: v })}
                  format={(v) => `${v} MB`}
                />
                <Button className="w-full mt-2" variant="primary" onPress={onExport} isDisabled={!photos.length || busy}>
                  {busy ? "导出中…" : "导出图片"}
                </Button>
                <div className="text-[11px] text-[color:var(--muted)] mt-3 leading-relaxed">
                  当前拼贴主题：背景 {th.bg} · 文字 {th.ink} · 强调 {th.accent}
                </div>
              </div>
            </Tabs.Panel>
          </Tabs>
        </aside>

        <section className="stage" aria-label="拼贴预览">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[color:var(--border)]">
            <div className="text-xs text-[color:var(--muted)]">
              {LAYOUTS.find((l) => l.id === state.layout)?.name || state.layout} · {state.ratio} · {state.theme}
            </div>
            <div className="text-[11px] font-mono text-[color:var(--muted)]">
              {size.w}×{size.h}
            </div>
          </div>
          <div className="stage-inner" ref={previewWrapRef}>
            <div className="canvas-frame">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[color:var(--overlay)] border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
