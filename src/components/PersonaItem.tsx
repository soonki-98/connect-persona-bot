import type { PersonaSummary } from "../App";

interface Props {
  persona: PersonaSummary;
  active: boolean;
  onClick: () => void;
}

export function PersonaItem({ persona, active, onClick }: Props) {
  const isMalicious = persona.personaCategory === "malicious";
  return (
    <button
      type="button"
      className={[
        "persona-button",
        active ? "active" : "",
        isMalicious ? "malicious" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <div className="persona-top">
        <span className={isMalicious ? "pill-danger" : "pill"}>
          {isMalicious ? "⚠ 악성" : persona.type}
        </span>
        <span className="persona-name">{persona.label}</span>
      </div>
      <div className="persona-desc">{persona.description}</div>
    </button>
  );
}
