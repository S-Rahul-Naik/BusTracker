/// <reference types="vite/client" />

declare const __BASE_PATH__: string;
declare const __IS_PREVIEW__: boolean;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
