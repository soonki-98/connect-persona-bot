export interface ViewerCommentItem {
  viewerId: string;
  label: string;
  segment: string;
  would_comment: boolean;
  comment: string | null;
  reason?: string;
}

export function CommentCard({ item }: { item: ViewerCommentItem }) {
  return (
    <div className="comment-card">
      <div className="comment-card-header">
        <strong>{item.label}</strong>
        <span>
          {item.segment} · {item.viewerId}
        </span>
      </div>
      {item.would_comment && item.comment ? (
        <div className="comment-bubble">{item.comment}</div>
      ) : (
        <div className="comment-skip">댓글 안 씀</div>
      )}
      {item.reason && <div className="comment-reason">{item.reason}</div>}
    </div>
  );
}
