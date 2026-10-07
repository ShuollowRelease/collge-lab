import { Input, Label, ListBox, Select, Slider, TextField } from "@heroui/react";

/**
 * 面板通用字段控件。
 * 只做「标签 + 控件」的统一排版，颜色 / 尺寸全部来自 styles.css 令牌，
 * 供 App 与各编辑面板共用，避免同一种字段写两遍。
 */

export function FieldSelect({ label, value, onChange, options }) {
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

export function FieldSlider({ label, value, min, max, step = 1, onChange, format }) {
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

export function FieldText({ label, value, onChange, placeholder, maxLength = 60 }) {
  return (
    <div className="field-row">
      <Label className="text-xs text-[color:var(--muted)]">{label}</Label>
      <TextField value={value} onChange={onChange} className="w-full" aria-label={label}>
        <Input placeholder={placeholder} maxLength={maxLength} variant="secondary" />
      </TextField>
    </div>
  );
}
