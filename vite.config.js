import { defineConfig } from "vite";
import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

function copyStaticAssets() {
  return {
    name: "copy-static-assets",
    closeBundle() {
      const dist = join(__dirname, "dist");
      if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
      const items = ["text.jpg", "icon", "assets"];
      for (const item of items) {
        const src = join(__dirname, item);
        const dest = join(dist, item);
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true });
        }
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyStaticAssets()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: { index: "index.html" },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
