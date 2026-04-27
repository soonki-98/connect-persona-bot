export interface ViewerFeedbackItem {
  viewerId: string;
  label: string;
  segment: string;
  fit_assessment?: string;
  first_impression?: string;
  action_probabilities?: {
    like?: number;
    comment?: number;
    save?: number;
    share?: number;
    scroll_past?: number;
  };
  resonance?: string[];
  friction?: string[];
  raw?: string;
}

function Avatar({ label }: { label: string }) {
  return <div className="avatar">{label.charAt(0).toUpperCase()}</div>;
}

interface ActionBarProps {
  icon: string;
  label: string;
  pct: number | undefined;
}

function ActionBar({ icon, label, pct }: ActionBarProps) {
  const value = Math.min(100, Math.max(0, Number(pct) || 0));
  return (
    <div className="action-row">
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
      <div className="action-track">
        <div className="action-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="action-pct">{value}</span>
    </div>
  );
}

export function FeedbackCard({ item }: { item: ViewerFeedbackItem }) {
  const ap = item.action_probabilities;

  return (
    <div className="feedback-card">
      <div className="card-header">
        <Avatar label={item.label} />
        <div className="card-header-info">
          <strong>{item.label}</strong>
          <small>{item.segment} · {item.viewerId}</small>
        </div>
      </div>

      {item.raw ? (
        <div className="tag-raw">{item.raw}</div>
      ) : (
        <>
          {item.fit_assessment && (
            <div className="feedback-fit">{item.fit_assessment}</div>
          )}
          {item.first_impression && (
            <div className="feedback-impression">{item.first_impression}</div>
          )}

          {ap && (
            <div className="action-bars">
              <ActionBar icon="👍" label="좋아요" pct={ap.like} />
              <ActionBar icon="💬" label="댓글" pct={ap.comment} />
              <ActionBar icon="🔖" label="저장" pct={ap.save} />
              <ActionBar icon="📤" label="공유" pct={ap.share} />
              <ActionBar icon="↓" label="스크롤" pct={ap.scroll_past} />
            </div>
          )}

          {((item.resonance?.length ?? 0) > 0 || (item.friction?.length ?? 0) > 0) && (
            <div className="feedback-tags">
              {item.resonance?.map((r, i) => (
                <span key={i} className="tag tag-green">{r}</span>
              ))}
              {item.friction?.map((f, i) => (
                <span key={i} className="tag tag-red">{f}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
