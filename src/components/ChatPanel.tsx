import { useEffect, useRef } from "react";
import type { ChatMessage } from "../llm/types";
import type { PersonaSummary } from "../App";

interface Props {
  activePersona: PersonaSummary | null;
  messages: ChatMessage[];
  busy: boolean;
  error: string;
  onSend: (text: string) => void;
}

export function ChatPanel({ activePersona, messages, busy, error, onSend }: Props) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (activePersona && !busy) {
      inputRef.current?.focus();
    }
  }, [activePersona, busy]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || busy || !activePersona) return;
    const text = input.value;
    input.value = "";
    onSend(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      form?.requestSubmit();
    }
  }

  const emptyText = activePersona
    ? activePersona.personaCategory === "malicious"
      ? "이 악성 페르소나가 작성할 글이나 댓글을 시뮬레이션합니다. 플랫폼 모더레이션 정책 테스트 목적으로 사용하세요."
      : activePersona.type === "creator"
        ? "이 creator persona에게 콘텐츠 방향, 초안, 관점에 대해 물어보세요."
        : "이 viewer persona에게 초안 반응, 신뢰 요소, 불편한 지점을 물어보세요."
    : "persona를 선택한 뒤 메시지를 입력하세요.";

  return (
    <>
      <div className="messages" ref={messagesRef}>
        {messages.length === 0 ? (
          <div className="empty">{emptyText}</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              {m.content}
            </div>
          ))
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          placeholder="메시지를 입력하세요. Shift+Enter로 줄바꿈, Enter로 전송"
          disabled={busy || !activePersona}
          onKeyDown={handleKeyDown}
        />
        <button className="send" type="submit" disabled={busy || !activePersona}>
          Send
        </button>
      </form>
    </>
  );
}
