/**
 * 布局缩略图。
 * 颜色取自画布主题（THEMES），不再内联字面色值；
 * 底色走 CSS 令牌，保证深浅色主题下都不刺眼。
 */
export default function LayoutThumb({ cells, themes }) {
  return (
    <svg className="thumb" viewBox="0 0 100 100" aria-hidden>
      <rect width="100" height="100" fill="var(--surface-tertiary)" />
      {cells.map((c, i) => (
        <rect
          key={i}
          x={c[0]}
          y={c[1]}
          width={c[2]}
          height={c[3]}
          rx="2"
          fill={i === 0 ? themes.accent : themes.sub}
        />
      ))}
    </svg>
  );
}
