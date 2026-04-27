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

interface ProgressBarProps {
  label: string;
  pct: number | undefined;
}

function ProgressBar({ label, pct }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, Number(pct) || 0));
  return (
    <div className="action-row">
      <span className="action-label">{label}</span>
      <div className="action-track">
        <div className="action-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="action-pct">{value}%</span>
    </div>
  );
}

export function FeedbackCard({ item }: { item: ViewerFeedbackItem }) {
  return (
    <div className="feedback-card">
      <div className="feedback-card-header">
        <strong>{item.label}</strong>
        <span>
          {item.segment} · {item.viewerId}
        </span>
      </div>
      {item.raw ? (
        <div className="tag-raw">{item.raw}</div>
      ) : (
        <>
          {item.fit_assessment && <div className="feedback-fit">{item.fit_assessment}</div>}
          {item.first_impression && (
            <div className="feedback-impression">{item.first_impression}</div>
          )}
          {item.action_probabilities && (
            <div className="action-bar">
              <ProgressBar label="좋아요" pct={item.action_probabilities.like} />
              <ProgressBar label="댓글" pct={item.action_probabilities.comment} />
              <ProgressBar label="저장" pct={item.action_probabilities.save} />
              <ProgressBar label="공유" pct={item.action_probabilities.share} />
              <ProgressBar label="스크롤" pct={item.action_probabilities.scroll_past} />
            </div>
          )}
          {((item.resonance?.length ?? 0) > 0 || (item.friction?.length ?? 0) > 0) && (
            <div className="feedback-tags">
              {item.resonance?.map((r, i) => (
                <span key={i} className="tag tag-green">
                  {r}
                </span>
              ))}
              {item.friction?.map((f, i) => (
                <span key={i} className="tag tag-red">
                  {f}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
