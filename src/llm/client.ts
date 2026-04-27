import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  INTERNAL_GPT_API_KEY,
  INTERNAL_GPT_BASE_URL,
  INTERNAL_GPT_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL
} from "./env";

export type ChatProvider = "internal" | "gemini" | "openai";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmClient {
  chat(messages: LlmMessage[]): Promise<string>;
}

export function defaultProvider(): ChatProvider {
  if (OPENAI_API_KEY) return "openai";
  if (GEMINI_API_KEY) return "gemini";
  if (INTERNAL_GPT_API_KEY) return "internal";
  throw new Error("No valid API key found. Set VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_INTERNAL_GPT_API_KEY in .env");
}

class OpenAiClient implements LlmClient {
  private readonly client: OpenAI;
  private readonly model: string;
  constructor(apiKey: string, model: string) {
    this.model = model;
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  async chat(messages: LlmMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.4,
      max_completion_tokens: 1200
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI response did not include assistant content.");
    return content;
  }
}

class GeminiClient implements LlmClient {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  constructor(apiKey: string, model: string) {
    this.model = model;
    this.ai = new GoogleGenAI({ apiKey });
  }
  async chat(messages: LlmMessage[]): Promise<string> {
    const systemInstruction = messages.find((m) => m.role === "system")?.content;
    const transcript = messages
      .filter((m) => m.role !== "system")
      .map((m) => (m.role === "user" ? `User:\n${m.content}` : `Assistant:\n${m.content}`))
      .join("\n\n");
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: transcript,
      config: { systemInstruction, temperature: 0.4, maxOutputTokens: 1200 }
    });
    const content = response.text?.trim();
    if (!content) throw new Error("Gemini response did not include assistant content.");
    return content;
  }
}

interface OpenAiCompatResponse {
  choices?: Array<{ message?: { content?: string }; text?: string }>;
  output_text?: string;
  error?: { message?: string };
}

class InternalGptClient implements LlmClient {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly model: string;
  constructor(baseUrl: string, apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.url = new URL("v1/chat/completions", normalized).toString();
  }
  async chat(messages: LlmMessage[]): Promise<string> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, temperature: 0.4, max_tokens: 1200 })
    });
    const payload = (await response.json().catch(() => ({}))) as OpenAiCompatResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Internal GPT request failed with ${response.status}`);
    }
    const content =
      payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text ?? payload.output_text;
    if (!content) throw new Error("Internal GPT response did not include assistant content.");
    return content;
  }
}

export function createLlmClient(provider: ChatProvider): LlmClient {
  if (provider === "openai") {
    if (!OPENAI_API_KEY) throw new Error("VITE_OPENAI_API_KEY is required.");
    return new OpenAiClient(OPENAI_API_KEY, OPENAI_MODEL);
  }
  if (provider === "gemini") {
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY is required.");
    return new GeminiClient(GEMINI_API_KEY, GEMINI_MODEL);
  }
  if (!INTERNAL_GPT_API_KEY) throw new Error("VITE_INTERNAL_GPT_API_KEY is required.");
  return new InternalGptClient(INTERNAL_GPT_BASE_URL, INTERNAL_GPT_API_KEY, INTERNAL_GPT_MODEL);
}
