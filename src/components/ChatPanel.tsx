import { useEffect, useRef } from "react";
import type { ChatMessage } from "../llm/types";
import type { PersonaSummary, FeedbackRound } from "../App";
import type { ViewerCommentItem } from "./CommentCard";

interface Props {
  activePersona: PersonaSummary | null;
  messages: ChatMessage[];
  feedbackRounds: FeedbackRound[];
  busy: boolean;
  error: string;
  onSend: (text: string) => void;
}

function ConnectPost({ content, persona }: {
  content: string;
  persona: PersonaSummary;
}) {
  const initial = persona.label.charAt(0).toUpperCase();
  return (
    <div className="connect-post">
      <div className="connect-post-header">
        <div className="connect-avatar">{initial}</div>
        <div className="connect-author-info">
          <strong className="connect-author-name">{persona.label}</strong>
          <span className="connect-author-meta">{persona.description}</span>
        </div>
      </div>
      <div className="connect-post-body">{content}</div>
    </div>
  );
}

function ConnectComment({ item }: { item: ViewerCommentItem }) {
  const initial = item.label.charAt(0).toUpperCase();
  return (
    <div className="connect-comment">
      <div className="connect-comment-avatar">{initial}</div>
      <div className="connect-comment-body">
        <div className="connect-comment-name-row">
          <strong className="connect-comment-name">{item.label}</strong>
          <span className="connect-comment-segment">{item.segment}</span>
        </div>
        {item.comment && (
          <div className="connect-comment-text">{item.comment}</div>
        )}
        {item.reason && (
          <div className="connect-comment-reason">{item.reason}</div>
        )}
      </div>
    </div>
  );
}

function ConnectCommentsArea({ round }: { round: FeedbackRound | undefined }) {
  if (!round) return null;
  if (round.commentsLoading) {
    return <div className="connect-comments-loading">댓글 시뮬레이션 중...</div>;
  }
  const visible = round.commentItems.filter((c) => c.would_comment);
  if (visible.length === 0) return null;
  return (
    <div className="connect-comments-area">
      {visible.map((item) => (
        <ConnectComment key={item.viewerId} item={item} />
      ))}
    </div>
  );
}

export function ChatPanel({ activePersona, messages, feedbackRounds, busy, error, onSend }: Props) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, feedbackRounds]);

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

  const isCreator = activePersona?.type === "creator";

  const emptyText = activePersona
    ? activePersona.personaCategory === "malicious"
      ? "이 악성 페르소나가 작성할 글이나 댓글을 시뮬레이션합니다. 플랫폼 모더레이션 정책 테스트 목적으로 사용하세요."
      : isCreator
        ? "이 creator persona에게 콘텐츠 방향, 초안, 관점에 대해 물어보세요."
        : "이 viewer persona에게 초안 반응, 신뢰 요소, 불편한 지점을 물어보세요."
    : "persona를 선택한 뒤 메시지를 입력하세요.";

  return (
    <>
      <div className="messages" ref={messagesRef}>
        {messages.length === 0 ? (
          <div className="empty">{emptyText}</div>
        ) : (
          messages.map((m, i) => {
            if (m.role === "assistant" && isCreator && m.roundId) {
              const round = feedbackRounds.find((r) => r.roundId === m.roundId);
              return (
                <div key={i} className="connect-post-group">
                  <ConnectPost content={m.content} persona={activePersona!} />
                  <ConnectCommentsArea round={round} />
                </div>
              );
            }
            return (
              <div key={i} className={`message ${m.role}`}>
                {m.content}
              </div>
            );
          })
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
