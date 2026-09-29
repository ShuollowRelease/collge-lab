import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

function copyStaticAssets() {
  return {
    name: "copy-static-assets",
    closeBundle() {
      const dist = join(root, "dist");
      if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
      for (const item of ["text.jpg", "icon", "assets"]) {
        const src = join(root, item);
        const dest = join(dist, item);
        if (existsSync(src)) cpSync(src, dest, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), copyStaticAssets()],
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
