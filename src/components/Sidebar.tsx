import { useState } from "react";
import type { PersonaSummary } from "../App";
import type { ChatProvider } from "../llm/client";
import { PersonaItem } from "./PersonaItem";

interface Props {
  personas: PersonaSummary[];
  activePersonaId: string | null;
  provider: ChatProvider | "auto";
  autoFeedback: boolean;
  viewerSegment: string;
  viewerLimit: number;
  onSelectPersona: (persona: PersonaSummary) => void;
  onProviderChange: (p: ChatProvider | "auto") => void;
  onAutoFeedbackChange: (v: boolean) => void;
  onViewerSegmentChange: (s: string) => void;
  onViewerLimitChange: (n: number) => void;
}

export function Sidebar({
  personas,
  activePersonaId,
  provider,
  autoFeedback,
  viewerSegment,
  viewerLimit,
  onSelectPersona,
  onProviderChange,
  onAutoFeedbackChange,
  onViewerSegmentChange,
  onViewerLimitChange
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = personas.filter((p) => {
    const haystack = [p.id, p.label, p.type, p.description, p.segment ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <aside>
      <div className="brand">
        <h1>Persona Chatbot</h1>
        <div className="sub">Creator·Viewer·악성 페르소나를 선택해 대화를 실행합니다.</div>
      </div>
      <div className="toolbar">
        <label>
          Provider
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as ChatProvider | "auto")}
          >
            <option value="auto">Auto</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="internal">Internal GPT</option>
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            placeholder="persona 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="feedback-toggle">
          <input
            type="checkbox"
            checked={autoFeedback}
            onChange={(e) => onAutoFeedbackChange(e.target.checked)}
          />
          creator 응답을 viewer에게 자동 전달
        </label>
        <div className="feedback-controls">
          <label>
            Viewer Segment
            <select
              value={viewerSegment}
              onChange={(e) => onViewerSegmentChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="tech_founders">Tech founders</option>
              <option value="hr_managers">HR managers</option>
              <option value="job_seekers">Job seekers</option>
              <option value="malicious">악성 유저</option>
            </select>
          </label>
          <label>
            Viewer Count
            <select
              value={viewerLimit}
              onChange={(e) => onViewerLimitChange(Number(e.target.value))}
            >
              <option value="3">3</option>
              <option value="1">1</option>
              <option value="9">9</option>
              <option value="12">12</option>
            </select>
          </label>
        </div>
      </div>
      <div className="persona-list">
        {filtered.map((p) => (
          <PersonaItem
            key={p.id}
            persona={p}
            active={p.id === activePersonaId}
            onClick={() => onSelectPersona(p)}
          />
        ))}
      </div>
    </aside>
  );
}
