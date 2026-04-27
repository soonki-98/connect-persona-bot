export type PersonaType = "creator" | "viewer";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
