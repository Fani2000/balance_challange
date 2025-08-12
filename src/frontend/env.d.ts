/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// src/env.d.ts
interface ProcessEnv {
  BACKEND_URL?: string;
}

interface Process {
  env: ProcessEnv;
}

declare var process: Process;
