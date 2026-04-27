import { useState } from "react";
import { FeedbackCard, type ViewerFeedbackItem } from "./FeedbackCard";
import { CommentCard, type ViewerCommentItem } from "./CommentCard";

interface Props {
  feedbackItems: ViewerFeedbackItem[];
  commentItems: ViewerCommentItem[];
  feedbackLoading: boolean;
  commentsLoading: boolean;
}

export function ViewerPanel({ feedbackItems, commentItems, feedbackLoading, commentsLoading }: Props) {
  const [tab, setTab] = useState<"feedback" | "comments">("feedback");

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

      {tab === "feedback" && (
        <div className="viewer-tab-content">
          {feedbackLoading ? (
            <div className="feedback-card viewer-help">viewer persona가 분석 중입니다...</div>
          ) : feedbackItems.length === 0 ? (
            <div className="viewer-help">
              creator가 글을 작성하면 viewer persona의 반응 수치가 표시됩니다.
            </div>
          ) : (
            <div className="viewer-feedback-list">
              {feedbackItems.map((item) => (
                <FeedbackCard key={item.viewerId} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "comments" && (
        <div className="viewer-tab-content">
          {commentsLoading ? (
            <div className="feedback-card viewer-help">viewer persona가 분석 중입니다...</div>
          ) : commentItems.length === 0 ? (
            <div className="viewer-help">
              creator가 글을 작성하면 viewer persona가 달 법한 댓글이 표시됩니다.
            </div>
          ) : (
            <div className="viewer-feedback-list">
              {commentItems.map((item) => (
                <CommentCard key={item.viewerId} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
