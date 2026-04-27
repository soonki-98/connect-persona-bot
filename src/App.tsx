import { useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatPanel } from "./components/ChatPanel";
import { ViewerPanel } from "./components/ViewerPanel";
import type { ViewerFeedbackItem } from "./components/FeedbackCard";
import type { ViewerCommentItem } from "./components/CommentCard";
import {
  loadCreatorPersonas,
  loadMaliciousPersonas,
  loadViewerPersonas
} from "./personas/data";
import type { CreatorPersona, ViewerPersona } from "./personas/types";
import {
  createLlmClient,
  defaultProvider,
  type ChatProvider,
  type LlmMessage
} from "./llm/client";
import {
  buildSystemPrompt,
  buildViewerFeedbackPrompt,
  buildCommentSimulationPrompt
} from "./llm/prompts";
import type { ChatMessage, PersonaType } from "./llm/types";

export interface PersonaSummary {
  id: string;
  type: PersonaType;
  label: string;
  description: string;
  segment?: string;
  personaCategory?: string;
}

const allCreators: CreatorPersona[] = [
  ...loadCreatorPersonas(),
  ...loadMaliciousPersonas()
];
const allViewers: ViewerPersona[] = loadViewerPersonas();

function buildPersonaSummaries(): PersonaSummary[] {
  return [
    ...allCreators.map((p) => ({
      id: p.persona_id,
      type: "creator" as const,
      label: p.persona_label,
      description: `${p.expertise_domain} · ${p.writing_style.tone} · ${p.writing_style.structure_preference}`,
      personaCategory: p.persona_category ?? "normal"
    })),
    ...allViewers.map((p) => ({
      id: p.persona_id,
      type: "viewer" as const,
      label: p.persona_label,
      segment: p.segment_id,
      description: `${p.segment_id} · ${p.professional_context.role_family} · ${p.professional_context.seniority}`
    }))
  ];
}

const ALL_PERSONAS = buildPersonaSummaries();

function resolveProvider(p: ChatProvider | "auto"): ChatProvider {
  if (p === "auto") return defaultProvider();
  return p;
}

function selectViewers(segment: string, limit: number): ViewerPersona[] {
  const filtered =
    segment && segment !== "all"
      ? allViewers.filter((v) => v.segment_id === segment)
      : allViewers;
  return filtered.slice(0, Math.max(1, Math.min(9, limit)));
}

function findPersona(id: string): { type: PersonaType; persona: CreatorPersona | ViewerPersona } | undefined {
  const creator = allCreators.find((p) => p.persona_id === id);
  if (creator) return { type: "creator", persona: creator };
  const viewer = allViewers.find((p) => p.persona_id === id);
  if (viewer) return { type: "viewer", persona: viewer };
  return undefined;
}

function parseJson<T>(text: string): T | null {
  try {
    const match = text.match(/\{[\s\S]*\}/)?.[0] ?? text;
    return JSON.parse(match) as T;
  } catch {
    return null;
  }
}

export default function App() {
  const [activePersona, setActivePersona] = useState<PersonaSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<LlmMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<ChatProvider | "auto">("auto");
  const [autoFeedback, setAutoFeedback] = useState(true);
  const [viewerSegment, setViewerSegment] = useState("all");
  const [viewerLimit, setViewerLimit] = useState(3);
  const [feedbackItems, setFeedbackItems] = useState<ViewerFeedbackItem[]>([]);
  const [commentItems, setCommentItems] = useState<ViewerCommentItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [statusText, setStatusText] = useState("ready");

  const selectPersona = useCallback((p: PersonaSummary) => {
    setActivePersona(p);
    setMessages([]);
    setHistory([]);
    setFeedbackItems([]);
    setCommentItems([]);
    setError("");
  }, []);

  const evaluateWithViewers = useCallback(
    async (content: string) => {
      setFeedbackLoading(true);
      const resolvedProvider = resolveProvider(provider);
      const client = createLlmClient(resolvedProvider);
      const viewers = selectViewers(viewerSegment, viewerLimit);
      try {
        const results = await Promise.all(
          viewers.map(async (viewer) => {
            const systemPrompt = buildSystemPrompt("viewer", viewer);
            const userPrompt = buildViewerFeedbackPrompt(content, viewer);
            const msgs: LlmMessage[] = [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ];
            const response = await client.chat(msgs);
            const parsed = parseJson<Record<string, unknown>>(response);
            return {
              viewerId: viewer.persona_id,
              label: viewer.persona_label,
              segment: viewer.segment_id,
              ...(parsed ?? { raw: response })
            } as ViewerFeedbackItem;
          })
        );
        setFeedbackItems(results);
      } catch (e) {
        setFeedbackItems([
          {
            viewerId: "error",
            label: "오류",
            segment: "",
            raw: e instanceof Error ? e.message : String(e)
          }
        ]);
      } finally {
        setFeedbackLoading(false);
      }
    },
    [provider, viewerSegment, viewerLimit]
  );

  const simulateComments = useCallback(
    async (content: string) => {
      setCommentsLoading(true);
      const resolvedProvider = resolveProvider(provider);
      const client = createLlmClient(resolvedProvider);
      const viewers = selectViewers(viewerSegment, viewerLimit);
      try {
        const results = await Promise.all(
          viewers.map(async (viewer) => {
            const systemPrompt = buildSystemPrompt("viewer", viewer);
            const userPrompt = buildCommentSimulationPrompt(content, viewer);
            const msgs: LlmMessage[] = [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ];
            const response = await client.chat(msgs);
            const parsed = parseJson<Record<string, unknown>>(response);
            return {
              viewerId: viewer.persona_id,
              label: viewer.persona_label,
              segment: viewer.segment_id,
              ...(parsed ?? { would_comment: false, comment: null, reason: response })
            } as ViewerCommentItem;
          })
        );
        setCommentItems(results);
      } catch (e) {
        setCommentItems([
          {
            viewerId: "error",
            label: "오류",
            segment: "",
            would_comment: false,
            comment: null,
            reason: e instanceof Error ? e.message : String(e)
          }
        ]);
      } finally {
        setCommentsLoading(false);
      }
    },
    [provider, viewerSegment, viewerLimit]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activePersona || !text.trim() || busy) return;

      const selected = findPersona(activePersona.id);
      if (!selected) return;

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setBusy(true);
      setError("");

      const resolvedProvider = resolveProvider(provider);
      const client = createLlmClient(resolvedProvider);

      const systemPrompt = buildSystemPrompt(selected.type, selected.persona);
      const newUserMsg: LlmMessage = { role: "user", content: text };
      const updatedHistory: LlmMessage[] = [...history, newUserMsg];
      const llmMessages: LlmMessage[] = [
        { role: "system", content: systemPrompt },
        ...updatedHistory
      ];

      try {
        const response = await client.chat(llmMessages);
        const assistantMsg: LlmMessage = { role: "assistant", content: response };
        setHistory([...updatedHistory, assistantMsg]);
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
        setStatusText(resolvedProvider);

        if (selected.type === "creator" && autoFeedback) {
          evaluateWithViewers(response);
          simulateComments(response);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [activePersona, busy, provider, history, autoFeedback, evaluateWithViewers, simulateComments]
  );

  return (
    <div className="app">
      <Sidebar
        personas={ALL_PERSONAS}
        activePersonaId={activePersona?.id ?? null}
        provider={provider}
        autoFeedback={autoFeedback}
        viewerSegment={viewerSegment}
        viewerLimit={viewerLimit}
        onSelectPersona={selectPersona}
        onProviderChange={setProvider}
        onAutoFeedbackChange={setAutoFeedback}
        onViewerSegmentChange={setViewerSegment}
        onViewerLimitChange={setViewerLimit}
      />
      <main>
        <header className="chat-header">
          <div className="chat-title">
            <strong>{activePersona?.label ?? "Persona를 선택하세요"}</strong>
            <span>
              {activePersona?.description ?? "왼쪽 목록에서 대화할 persona를 고릅니다."}
            </span>
          </div>
          <div className="status">{busy ? "thinking..." : statusText}</div>
        </header>
        <div className="workspace">
          <section className="messages-section">
            <ChatPanel
              activePersona={activePersona}
              messages={messages}
              busy={busy}
              error={error}
              onSend={sendMessage}
            />
          </section>
          <ViewerPanel
            feedbackItems={feedbackItems}
            commentItems={commentItems}
            feedbackLoading={feedbackLoading}
            commentsLoading={commentsLoading}
          />
        </div>
      </main>
    </div>
  );
}
