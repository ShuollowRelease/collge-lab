/**
 * 一键跑完全部自检：
 *   1. 静态接线 —— 相对导入的具名导出是否真实存在（跨文件漏导出 / 改名）
 *   2. 语法解析 —— 每个源文件都能被 esbuild 转译
 *   3. 几何不变式 —— 归一化、内缩、节点夹取、形状、绘制/导出一致性
 *   4. 端到端交互 —— 真实浏览器点完所有按钮，确认 App 不崩、画布有变化
 *
 * 用法：
 *   node tools/verify-all.mjs                      # 用正在运行的 vite dev（:5173）
 *   node tools/verify-all.mjs <url> [chrome.exe]
 *
 * 第 4 步需要本地有 Chrome；缺少时只跳过该步并给出提示。
 */
import { execFileSync, spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, dirname, resolve } from "path";
import { createRequire } from "module";

const url = process.argv[2] || "http://localhost:5173/";
const chromeArg = process.argv[3];
const root = process.cwd();
const steps = [];

const run = (label, cmd, args) => {
  process.stdout.write(`\n▶ ${label}\n`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root });
  steps.push({ label, ok: r.status === 0 });
  return r.status === 0;
};

/* ---------------- 1. 静态接线 ---------------- */
const require = createRequire(import.meta.url);
const srcFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== "node_modules") walk(p);
    } else if (/\.jsx?$/.test(p)) srcFiles.push(p);
  }
})("src");

const wiring = [];
const relImport = /import\s*\{([^}]+)\}\s*from\s*["'](\.[^"']+)["']/g;
for (const f of srcFiles) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(relImport)) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    const target = resolve(dirname(f), m[2]);
    const hit = [target, `${target}.js`, `${target}.jsx`, join(target, "index.js")].find(existsSync);
    if (!hit) {
      wiring.push(`${f} -> ${m[2]} 文件不存在`);
      continue;
    }
    const tsrc = readFileSync(hit, "utf8");
    for (const n of names) {
      const re = new RegExp(
        `export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${n}\\b|export\\s*\\{[^}]*\\b${n}\\b`
      );
      if (!re.test(tsrc)) wiring.push(`${n} 未从 ${m[2]} 导出（${f}）`);
    }
  }
}
// App.jsx 使用的顶层标识符必须在 constants 里存在（防漏 import 后点击才炸）
const appSrc = readFileSync("src/App.jsx", "utf8");
const constantsSrc = readFileSync("src/engine/constants.js", "utf8");
for (const id of ["GRID_LIMIT", "DEFAULT_SHAPE_ID", "UNDO_MAX"]) {
  if (new RegExp(`\\b${id}\\b`).test(appSrc) && !new RegExp(`export\\s+(?:const|function)\\s+${id}\\b`).test(constantsSrc)) {
    wiring.push(`App.jsx 使用了 ${id}，但 constants.js 未导出`);
  }
}
process.stdout.write("\n▶ 静态接线自检\n");
if (wiring.length) {
  wiring.forEach((w) => console.log(`  ✗ ${w}`));
  steps.push({ label: "静态接线自检", ok: false });
} else {
  console.log(`  ✓ ${srcFiles.length} 个源文件，具名导出全部存在`);
  steps.push({ label: "静态接线自检", ok: true });
}

/* ---------------- 2. 语法解析 ---------------- */
const esbuild = "node_modules/@esbuild/win32-x64/esbuild.exe";
if (existsSync(esbuild)) {
  const bad = [];
  for (const f of srcFiles) {
    const r = spawnSync(esbuild, [f, "--outfile=" + join(process.env.TEMP || ".", "pc-parse-out.js")], {
      cwd: root,
      stdio: "ignore",
    });
    if (r.status !== 0) bad.push(f);
  }
  process.stdout.write("\n▶ 语法解析\n");
  if (bad.length) {
    bad.forEach((b) => console.log(`  ✗ ${b}`));
    steps.push({ label: "语法解析", ok: false });
  } else {
    console.log(`  ✓ ${srcFiles.length} 个源文件解析通过`);
    steps.push({ label: "语法解析", ok: true });
  }
} else {
  console.log("\n▶ 语法解析：未找到 esbuild，跳过");
}

/* ---------------- 3. 几何不变式 ---------------- */
if (existsSync("tools/verify-grid.mjs")) run("几何不变式自检", process.execPath, ["tools/verify-grid.mjs"]);
if (existsSync("tools/verify-freeform.mjs")) run("自由不规则拼接自检", process.execPath, ["tools/verify-freeform.mjs"]);
if (existsSync("tools/verify-capabilities.mjs")) run("预设能力与动态面板自检", process.execPath, ["tools/verify-capabilities.mjs"]);

/* ---------------- 4. 端到端交互 ---------------- */
const chrome = chromeArg || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (existsSync(chrome)) {
  run("端到端交互验证（真实浏览器）", process.execPath, ["tools/verify-interactions.mjs", url, chrome]);
} else {
  console.log("\n▶ 端到端交互验证：未找到 Chrome，跳过。请手动跑 tools/verify-interactions.mjs");
  steps.push({ label: "端到端交互验证", ok: true, skipped: true });
}

/* ---------------- 汇总 ---------------- */
const pad = Math.max(...steps.map((s) => s.label.length));
console.log("\n" + "═".repeat(pad + 20));
for (const s of steps) {
  console.log(`${s.ok ? "✓" : "✗"} ${s.label.padEnd(pad)}${s.skipped ? "  (跳过)" : ""}`);
}
const failed = steps.filter((s) => !s.ok).length;
console.log("═".repeat(pad + 20));
console.log(failed ? `✗ ${failed} 个环节未通过` : "✓ 全部自检通过");
process.exit(failed ? 1 : 0);
