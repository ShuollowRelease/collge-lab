import { Button, Tooltip } from "@heroui/react";

const ICONS = {
  light: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

const LABELS = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};

const ORDER = ["light", "dark", "system"];

export default function ThemeToggle({ mode, onChange }) {
  return (
    <div
      className="inline-flex items-center rounded-full border p-1 gap-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-secondary)" }}
      role="group"
      aria-label="界面主题"
    >
      {ORDER.map((key) => {
        const active = mode === key;
        return (
          <Tooltip key={key} content={LABELS[key]}>
            <Button
              isIconOnly
              size="sm"
              variant={active ? "secondary" : "ghost"}
              aria-label={LABELS[key]}
              aria-pressed={active}
              onPress={() => onChange(key)}
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--accent-foreground)" : "var(--muted)",
                minWidth: 28,
                height: 28,
                borderRadius: 999,
              }}
            >
              {ICONS[key]}
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}
