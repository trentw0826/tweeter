/// <reference types="vite/client" />

export {};

interface AppConfig {
  VITE_API_BASE_URL?: string;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

declare global {
  var __APP_CONFIG__: AppConfig | undefined;
}
