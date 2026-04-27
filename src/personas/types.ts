export const evaluationDimensions = [
  "relevance",
  "insight_depth",
  "actionability",
  "clarity",
  "engagement_potential"
] as const;

export type EvaluationDimension = (typeof evaluationDimensions)[number];

export type ScoreMap = Record<EvaluationDimension, number>;

export interface CreatorPersona {
  persona_id: string;
  persona_label: string;
  expertise_domain: string;
  expertise_depth: string;
  content_goal: string;
  writing_style: {
    tone: string;
    avg_length: string;
    uses_data: boolean;
    uses_personal_stories: boolean;
    structure_preference: string;
  };
  posting_pattern: Record<string, unknown>;
  target_audience: string[];
  content_constraints: Record<string, unknown>;
  content_characteristics?: {
    typical_topics?: string[];
    avoided_topics?: string[];
    credibility_signals?: string[];
    style_markers?: string[];
  };
  raw_data_reference?: Record<string, unknown>;
  few_shot_examples?: string[];
  persona_category?: "normal" | "malicious";
  malicious_type?: "defamation" | "spam" | "borderline";
}

export interface ViewerPersona {
  persona_id: string;
  persona_label: string;
  segment_id: string;
  professional_context: {
    seniority: string;
    role_family: string;
    industry: string;
    years_experience: number;
  };
  motivation: string[];
  content_preferences: Record<string, boolean | string>;
  information_needs: string[];
  reaction_rules: string[];
  annoyance_triggers: string[];
  trust_criteria: string[];
  action_weights: ScoreMap;
  evaluation_rubric: string[];
  persona_category?: "normal" | "malicious";
  malicious_viewer_type?: "defamation" | "spam" | "harassment";
}
