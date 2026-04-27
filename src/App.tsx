import { useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatPanel } from "./components/ChatPanel";
import { ViewerPanel } from "./components/ViewerPanel";
import type { ViewerFeedbackItem } from "./components/FeedbackCard";
import type { ViewerCommentItem } from "./components/CommentCard";
import {
  loadCreatorPersonas,
  loadMaliciousPersonas,
  loadViewerPersonas,
  loadMaliciousViewerPersonas
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

export interface FeedbackRound {
  roundId: string;
  contentPreview: string;
  feedbackItems: ViewerFeedbackItem[];
  commentItems: ViewerCommentItem[];
  feedbackLoading: boolean;
  commentsLoading: boolean;
}

type FeedbackStore = Record<string, FeedbackRound[]>;

const allCreators: CreatorPersona[] = [
  ...loadCreatorPersonas(),
  ...loadMaliciousPersonas()
];
const allViewers: ViewerPersona[] = [
  ...loadViewerPersonas(),
  ...loadMaliciousViewerPersonas()
];

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
      description: `${p.segment_id} · ${p.professional_context.role_family} · ${p.professional_context.seniority}`,
      personaCategory: p.persona_category ?? "normal"
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
  return filtered.slice(0, Math.max(1, Math.min(12, limit)));
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

function updateRound(
  store: FeedbackStore,
  personaId: string,
  roundId: string,
  patch: Partial<FeedbackRound>
): FeedbackStore {
  return {
    ...store,
    [personaId]: (store[personaId] ?? []).map((r) =>
      r.roundId === roundId ? { ...r, ...patch } : r
    )
  };
}

export default function App() {
  const [activePersona, setActivePersona] = useState<PersonaSummary | null>(null);
  const [conversationStore, setConversationStore] = useState<
    Record<string, { messages: ChatMessage[]; history: LlmMessage[] }>
  >({});
  const messages = activePersona ? (conversationStore[activePersona.id]?.messages ?? []) : [];
  const history = activePersona ? (conversationStore[activePersona.id]?.history ?? []) : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<ChatProvider | "auto">("auto");
  const [autoFeedback, setAutoFeedback] = useState(true);
  const [viewerSegment, setViewerSegment] = useState("all");
  const [viewerLimit, setViewerLimit] = useState(3);
  const [feedbackStore, setFeedbackStore] = useState<FeedbackStore>({});
  const [statusText, setStatusText] = useState("ready");

  const feedbackRounds = activePersona ? (feedbackStore[activePersona.id] ?? []) : [];

  const selectPersona = useCallback((p: PersonaSummary) => {
    setActivePersona(p);
    setError("");
  }, []);

  const evaluateWithViewers = useCallback(
    async (content: string, personaId: string, roundId: string) => {
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
        setFeedbackStore((prev) =>
          updateRound(prev, personaId, roundId, { feedbackItems: results, feedbackLoading: false })
        );
      } catch (e) {
        setFeedbackStore((prev) =>
          updateRound(prev, personaId, roundId, {
            feedbackItems: [
              {
                viewerId: "error",
                label: "오류",
                segment: "",
                raw: e instanceof Error ? e.message : String(e)
              }
            ],
            feedbackLoading: false
          })
        );
      }
    },
    [provider, viewerSegment, viewerLimit]
  );

  const simulateComments = useCallback(
    async (content: string, personaId: string, roundId: string) => {
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
        setFeedbackStore((prev) =>
          updateRound(prev, personaId, roundId, { commentItems: results, commentsLoading: false })
        );
      } catch (e) {
        setFeedbackStore((prev) =>
          updateRound(prev, personaId, roundId, {
            commentItems: [
              {
                viewerId: "error",
                label: "오류",
                segment: "",
                would_comment: false,
                comment: null,
                reason: e instanceof Error ? e.message : String(e)
              }
            ],
            commentsLoading: false
          })
        );
      }
    },
    [provider, viewerSegment, viewerLimit]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activePersona || !text.trim() || busy) return;

      const selected = findPersona(activePersona.id);
      if (!selected) return;

      setConversationStore((prev) => ({
        ...prev,
        [activePersona.id]: {
          messages: [...(prev[activePersona.id]?.messages ?? []), { role: "user", content: text }],
          history: prev[activePersona.id]?.history ?? [],
        },
      }));
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
        setConversationStore((prev) => ({
          ...prev,
          [activePersona.id]: {
            messages: [...(prev[activePersona.id]?.messages ?? []), { role: "assistant", content: response }],
            history: [...updatedHistory, assistantMsg],
          },
        }));
        setStatusText(resolvedProvider);

        if (selected.type === "creator" && autoFeedback) {
          const roundId = `${activePersona.id}_${Date.now()}`;
          const contentPreview = response.slice(0, 100);
          setFeedbackStore((prev) => ({
            ...prev,
            [activePersona.id]: [
              ...(prev[activePersona.id] ?? []),
              {
                roundId,
                contentPreview,
                feedbackItems: [],
                commentItems: [],
                feedbackLoading: true,
                commentsLoading: true
              }
            ]
          }));
          evaluateWithViewers(response, activePersona.id, roundId);
          simulateComments(response, activePersona.id, roundId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [activePersona, busy, provider, conversationStore, autoFeedback, evaluateWithViewers, simulateComments]
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
          <ViewerPanel feedbackRounds={feedbackRounds} />
        </div>
      </main>
    </div>
  );
}
