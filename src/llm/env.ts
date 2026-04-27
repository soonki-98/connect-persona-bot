export const INTERNAL_GPT_BASE_URL =
  import.meta.env.VITE_INTERNAL_GPT_BASE_URL ?? "https://rmbrgpt.bizops.rememberapp.co.kr/";
export const INTERNAL_GPT_API_KEY = import.meta.env.VITE_INTERNAL_GPT_API_KEY as string | undefined;
export const INTERNAL_GPT_MODEL =
  import.meta.env.VITE_INTERNAL_GPT_MODEL ?? "Product.Anthropic Claude 4.6 Sonnet";

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? "gemini-3-flash-preview";

export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
export const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4.1-mini";
