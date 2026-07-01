import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
