/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Any non-empty value ("local"); real auth happens server-side. */
  readonly VITE_LLM_API_KEY: string;
  /** OpenAI-compatible base URL (default the local Cursor-SDK backend). */
  readonly VITE_LLM_BASE_URL?: string;
  /** Model id passed through to the backend (default "auto"). */
  readonly VITE_LLM_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
