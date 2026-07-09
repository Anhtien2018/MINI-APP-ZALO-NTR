import type goongjsModule from "@goongmaps/goong-js";

declare global {
  interface Window {
    goongjs?: typeof goongjsModule;
  }
}

let loadPromise: Promise<typeof goongjsModule> | null = null;

// goong-js is ~700KB minified — under this app's forced single-IIFE build
// (see vite.config.ts), a static `import("@goongmaps/goong-js")` gets
// inlined into the main bundle and its top-level code runs on every app
// boot, even for users who never open a map. Loading the vendored UMD build
// (public/vendor/goong-js.js, window.goongjs) via a real <script> tag
// instead defers that cost until a screen that actually needs a map mounts.
export function loadGoongJs(): Promise<typeof goongjsModule> {
  if (window.goongjs) return Promise.resolve(window.goongjs);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const cssHref = "/vendor/goong-js.css";
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "/vendor/goong-js.js";
    script.async = true;
    script.onload = () => {
      if (window.goongjs) resolve(window.goongjs);
      else reject(new Error("goong-js loaded but window.goongjs is missing"));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load goong-js"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
