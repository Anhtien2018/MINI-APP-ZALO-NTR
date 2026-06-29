/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIRECTUS_TOKEN: string;
  readonly VITE_GOONG_MAPTILES_KEY: string;
  readonly VITE_WEB_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
