import { useState } from "react";
import { FeedbackCard } from "./FeedbackCard";
import { CommentCard } from "./CommentCard";
import type { FeedbackRound } from "../App";

interface Props {
  feedbackRounds: FeedbackRound[];
}

function RoundSection({ round, tab }: { round: FeedbackRound; tab: "feedback" | "comments" }) {
  if (tab === "feedback") {
    if (round.feedbackLoading) {
      return <div className="feedback-card viewer-help">viewer persona가 분석 중입니다...</div>;
    }
    return (
      <div className="viewer-feedback-list">
        {round.feedbackItems.map((item) => (
          <FeedbackCard key={item.viewerId} item={item} />
        ))}
      </div>
    );
  }

  if (round.commentsLoading) {
    return <div className="feedback-card viewer-help">viewer persona가 분석 중입니다...</div>;
  }
  return (
    <div className="viewer-feedback-list">
      {round.commentItems.map((item) => (
        <CommentCard key={item.viewerId} item={item} />
      ))}
    </div>
  );
}

export function ViewerPanel({ feedbackRounds }: Props) {
  const [tab, setTab] = useState<"feedback" | "comments">("feedback");

  const reversed = [...feedbackRounds].reverse();
  const isEmpty = feedbackRounds.length === 0;

  return (
    <aside className="viewer-panel">
      <div className="viewer-tabs">
        <button
          type="button"
          className={`viewer-tab ${tab === "feedback" ? "active" : ""}`}
          onClick={() => setTab("feedback")}
        >
          반응 수치
        </button>
        <button
          type="button"
          className={`viewer-tab ${tab === "comments" ? "active" : ""}`}
          onClick={() => setTab("comments")}
        >
          댓글 시뮬레이션
        </button>
      </div>

      <div className="viewer-tab-content">
        {isEmpty ? (
          <div className="viewer-help">
            {tab === "feedback"
              ? "creator가 글을 작성하면 viewer persona의 반응 수치가 표시됩니다."
              : "creator가 글을 작성하면 viewer persona가 달 법한 댓글이 표시됩니다."}
          </div>
        ) : (
          reversed.map((round, idx) =>
            idx === 0 ? (
              <div key={round.roundId} className="feedback-round feedback-round--latest">
                <RoundSection round={round} tab={tab} />
              </div>
            ) : (
              <details key={round.roundId} className="feedback-round feedback-round--archived">
                <summary className="feedback-round-summary">
                  이전 글 — {round.contentPreview}
                </summary>
                <RoundSection round={round} tab={tab} />
              </details>
            )
          )
        )}
      </div>
    </aside>
  );
}
