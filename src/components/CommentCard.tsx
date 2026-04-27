export interface ViewerCommentItem {
  viewerId: string;
  label: string;
  segment: string;
  would_comment: boolean;
  comment: string | null;
  reason?: string;
}

function Avatar({ label }: { label: string }) {
  return <div className="avatar">{label.charAt(0).toUpperCase()}</div>;
}

export function CommentCard({ item }: { item: ViewerCommentItem }) {
  return (
    <div className="comment-card">
      <div className="card-header">
        <Avatar label={item.label} />
        <div className="card-header-info">
          <div className="card-header-name-row">
            <strong>{item.label}</strong>
            {!item.would_comment && (
              <span className="comment-skip-badge">댓글 안 씀</span>
            )}
          </div>
          <small>{item.segment} · {item.viewerId}</small>
        </div>
      </div>

      {item.would_comment && item.comment && (
        <div className="comment-bubble">{item.comment}</div>
      )}

      {item.reason && (
        <div className="comment-reason">{item.reason}</div>
      )}
    </div>
  );
}
