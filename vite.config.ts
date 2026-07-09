import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// goong-js is ~700KB minified. Under this app's forced single-IIFE build
// (see rollupOptions below), a normal `import("@goongmaps/goong-js")` gets
// inlined into the main bundle and runs on every app boot, not just when a
// map actually mounts. Vendoring its UMD build into public/ lets
// src/utils/loadGoongJs.ts fetch it via a real <script> tag on demand
// instead, straight from node_modules so it always matches the installed
// package version.
const goongJsSrcDir = path.resolve(__dirname, "node_modules/@goongmaps/goong-js/dist");
const goongJsDestDir = path.resolve(__dirname, "public/vendor");
fs.mkdirSync(goongJsDestDir, { recursive: true });
for (const file of ["goong-js.js", "goong-js.css"]) {
  fs.copyFileSync(path.join(goongJsSrcDir, file), path.join(goongJsDestDir, file));
}

export default defineConfig({
  plugins: [
    react(),
    {
      // Vite's HTML plugin always tags the entry script as type="module",
      // regardless of the actual Rollup output format — strip it so the
      // generated tag matches the classic IIFE bundle we build above.
      name: "strip-module-script-type",
      transformIndexHtml(html) {
        return html.replace(/ type="module" crossorigin/g, "");
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Zalo Mini App's WebView loads scripts as classic scripts, not ES modules —
    // it can't handle `export`/`import`/dynamic `import()` syntax, so force a
    // single non-module IIFE bundle instead of Vite's default ESM + code-splitting.
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
