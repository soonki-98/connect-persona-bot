import { FeedbackCard } from "./FeedbackCard";
import type { FeedbackRound } from "../App";

interface Props {
  feedbackRounds: FeedbackRound[];
}

function RoundSection({ round }: { round: FeedbackRound }) {
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

export function ViewerPanel({ feedbackRounds }: Props) {
  const reversed = [...feedbackRounds].reverse();
  const isEmpty = feedbackRounds.length === 0;

  return (
    <aside className="viewer-panel">
      <div className="viewer-panel-title">반응 수치</div>

      <div className="viewer-tab-content">
        {isEmpty ? (
          <div className="viewer-help">
            creator가 글을 작성하면 viewer persona의 반응 수치가 표시됩니다.
          </div>
        ) : (
          reversed.map((round, idx) =>
            idx === 0 ? (
              <div key={round.roundId} className="feedback-round feedback-round--latest">
                <RoundSection round={round} />
              </div>
            ) : (
              <details key={round.roundId} className="feedback-round feedback-round--archived">
                <summary className="feedback-round-summary">
                  이전 글 — {round.contentPreview}
                </summary>
                <RoundSection round={round} />
              </details>
            )
          )
        )}
      </div>
    </aside>
  );
}
