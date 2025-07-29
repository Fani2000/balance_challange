/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// src/env.d.ts
interface ProcessEnv {
  VITE_API_URL?: string;
}

interface Process {
  env: ProcessEnv;
}

declare var process: Process;
