import type { CreatorPersona, ViewerPersona } from "../personas/types";
import type { PersonaType } from "./types";

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return "- none specified";
  return values.map((value) => `- ${value}`).join("\n");
}

export function buildCreatorSystemPrompt(persona: CreatorPersona): string {
  if (persona.persona_category === "malicious") {
    return buildMaliciousCreatorSystemPrompt(persona);
  }

  const lines = [
    "당신은 리멤버 커넥트에서 활동하는 직장인입니다.",
    "아래 프로필을 기반으로 이 인물이 실제로 작성할 법한 글과 의견을 생성합니다.",
    "실제 플랫폼에 게시될 것처럼 자연스럽게 응답하세요.",
    "이 페르소나를 그대로 연기하되, 특정 개인의 실명·연락처·내부 정보는 노출하지 마세요.",
    "",
    "프로필:",
    `- Persona ID: ${persona.persona_id}`,
    `- 이름(레이블): ${persona.persona_label}`,
    `- 전문 분야: ${persona.expertise_domain}`,
    `- 전문성 수준: ${persona.expertise_depth}`,
    `- 콘텐츠 목표: ${persona.content_goal}`,
    `- 어조: ${persona.writing_style.tone}`,
    `- 글 구조 선호: ${persona.writing_style.structure_preference}`,
    "",
    "자주 다루는 주제:",
    formatList(persona.content_characteristics?.typical_topics),
    "",
    "다루지 않는 주제:",
    formatList(persona.content_characteristics?.avoided_topics),
    "",
    "문체 특성:",
    formatList(persona.content_characteristics?.style_markers)
  ];

  if (persona.few_shot_examples && persona.few_shot_examples.length > 0) {
    lines.push(
      "",
      "아래는 이 페르소나가 실제로 작성한 글 예시입니다. 문체·길이·구조를 참고하세요.",
      ...persona.few_shot_examples.map((ex, i) => `\n[예시 ${i + 1}]\n${ex}`)
    );
  }

  lines.push(
    "",
    "행동 지침:",
    "- 콘텐츠 아이디어, 초안, 포지셔닝, 독자 반응에 대해 실질적인 도움을 제공하세요.",
    "- 이 페르소나의 전문 분야와 경험을 기반으로 답하세요.",
    "- 콘텐츠 조언 시 이 페르소나가 강조할 것과 피할 것을 설명하세요.",
    "- 한국어로 답하되, 사용자가 다른 언어를 요청하면 그에 따르세요."
  );

  return lines.join("\n");
}

export function buildMaliciousCreatorSystemPrompt(persona: CreatorPersona): string {
  return [
    "당신은 리멤버 커넥트 콘텐츠 모더레이션 시뮬레이터입니다.",
    "아래 문제 유형 사용자가 실제로 작성할 법한 글/댓글을 시뮬레이션합니다.",
    "목적: 플랫폼 콘텐츠 정책 수립 및 모더레이션 규칙 테스트.",
    "실제로 게시되면 신고·삭제될 수 있는 수준을 사실적으로 표현하되,",
    "실제 존재하는 특정 개인·단체를 직접 지목하거나 심각한 범죄를 조장하는 내용은 제외하세요.",
    "",
    "유형:",
    `- ID: ${persona.persona_id}`,
    `- 레이블: ${persona.persona_label}`,
    `- 악성 유형: ${persona.malicious_type ?? "general"}`,
    "",
    "이 유형이 주로 작성하는 콘텐츠:",
    formatList(persona.content_characteristics?.typical_topics),
    "",
    "문체 특성:",
    formatList(persona.content_characteristics?.style_markers),
    "",
    "행동 지침:",
    "- 사용자가 글 또는 댓글 작성을 요청하면 이 유형의 패턴을 충실히 재현하세요.",
    "- 실제 플랫폼에서 운영자가 삭제하거나 사용자가 신고할 만한 수준을 목표로 하세요.",
    "- 한국어로 답하되, 사용자가 다른 언어를 요청하면 그에 따르세요."
  ].join("\n");
}

export function buildViewerSystemPrompt(persona: ViewerPersona): string {
  return [
    "당신은 리멤버 커넥트의 뷰어 페르소나입니다.",
    "아래 프로필을 기반으로 이 독자 유형이 실제로 보일 반응을 시뮬레이션합니다.",
    "실제 사용자를 그대로 복제하는 것이 아닌, 이 viewer 아키타입의 가설적 반응을 표현하세요.",
    "",
    "프로필:",
    `- Persona ID: ${persona.persona_id}`,
    `- 레이블: ${persona.persona_label}`,
    `- 세그먼트: ${persona.segment_id}`,
    `- 직무 유형: ${persona.professional_context.role_family}`,
    `- 직급: ${persona.professional_context.seniority}`,
    `- 산업: ${persona.professional_context.industry}`,
    "",
    "동기:",
    formatList(persona.motivation),
    "",
    "정보 니즈 (관심 분야):",
    formatList(persona.information_needs),
    "",
    "반응 규칙:",
    formatList(persona.reaction_rules),
    "",
    "불편 트리거:",
    formatList(persona.annoyance_triggers),
    "",
    "신뢰 기준:",
    formatList(persona.trust_criteria),
    "",
    "평가 원칙:",
    "- 점수는 글의 객관적 품질이 아니라 '내가 실제로 이 글에 반응할 것인가'를 기준으로 매깁니다.",
    "- 이 글의 주제가 나의 정보 니즈·직업적 맥락과 관련 없으면, 글이 잘 쓰여 있어도 relevance는 낮아야 합니다.",
    "- 관심 없는 분야의 글은 scroll_past 확률을 높이고 저장·공유·댓글 확률을 낮추세요.",
    "- 평가 결과는 이 persona의 반응을 재현하는 것이지, 글의 전반적 품질 평점이 아닙니다.",
    "",
    "행동 지침:",
    "- 공감되는 요소, 무관하게 느껴지는 요소, 불신을 유발하는 요소를 설명하세요.",
    "- 초안 콘텐츠가 공유되면 이 viewer로서 반응하세요.",
    "- 스크롤, 좋아요, 저장, 댓글, 공유 같은 예상 행동을 필요 시 언급하세요.",
    "- 한국어로 답하되, 사용자가 다른 언어를 요청하면 그에 따르세요."
  ].join("\n");
}

export function buildSystemPrompt(personaType: PersonaType, persona: CreatorPersona | ViewerPersona): string {
  return personaType === "creator"
    ? buildCreatorSystemPrompt(persona as CreatorPersona)
    : buildViewerSystemPrompt(persona as ViewerPersona);
}

export function buildViewerFeedbackPrompt(content: string, viewer: ViewerPersona): string {
  const infoNeeds = viewer.information_needs.join(", ");
  const prefs = viewer.content_preferences as Record<string, boolean | string>;
  const prefLines: string[] = [];
  if (prefs.values_data_evidence === true) prefLines.push("데이터·근거 중시");
  if (prefs.values_data_evidence === false) prefLines.push("데이터보다 경험담 선호");
  if (prefs.prefers_actionable_over_theoretical === true) prefLines.push("실용적 조언 선호");
  if (prefs.prefers_actionable_over_theoretical === false) prefLines.push("이론·인사이트 선호");
  if (prefs.tolerates_strong_opinions === false) prefLines.push("강한 주장에 거부감");
  if (prefs.tolerates_strong_opinions === true) prefLines.push("강한 주장 수용");

  const rubric = (viewer.evaluation_rubric ?? []).map((r, i) => `${i + 1}. ${r}`).join("\n");

  const jsonSchema = JSON.stringify(
    {
      fit_assessment:
        "이 글의 주제가 내 관심사·직업과 얼마나 맞는지 한 줄 평가 (예: '금융 영업 글 — 내 IT 창업 맥락과 거의 무관함')",
      first_impression: "한 줄 첫 반응",
      action_probabilities: {
        like: "0~100 정수",
        comment: "0~100 정수",
        save: "0~100 정수",
        share: "0~100 정수",
        scroll_past: "0~100 정수"
      },
      resonance: ["공감·신뢰 요소 최대 2개"],
      friction: ["불편·신뢰 저하 요소 최대 2개"]
    },
    null,
    2
  );

  return [
    "다음 글을 당신의 페르소나 관점에서 평가하세요.",
    "",
    `당신의 관심 분야: ${infoNeeds}`,
    `당신의 직업: ${viewer.professional_context.role_family} (${viewer.professional_context.industry}, ${viewer.professional_context.seniority})`,
    prefLines.length > 0 ? `콘텐츠 선호: ${prefLines.join(" / ")}` : "",
    "",
    "평가 전에 먼저 판단하세요: 이 글의 주제가 당신의 관심 분야와 얼마나 관련됩니까?",
    "관련성이 낮다면 — 글이 잘 쓰여 있어도 — scroll_past 확률이 높고 저장·공유·댓글 확률은 낮아야 합니다.",
    "",
    "당신의 평가 기준:",
    rubric,
    "",
    "<content>",
    content,
    "</content>",
    "",
    "JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):",
    jsonSchema
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildCommentSimulationPrompt(content: string, viewer: ViewerPersona): string {
  const infoNeeds = viewer.information_needs.join(", ");
  return [
    "다음 글을 읽고 이 viewer persona가 실제로 달 법한 댓글을 작성하세요.",
    "",
    `당신의 관심 분야: ${infoNeeds}`,
    `당신의 직업: ${viewer.professional_context.role_family} (${viewer.professional_context.industry})`,
    "",
    "이 글의 주제가 당신의 관심 분야와 관련 없다면, 댓글을 달 가능성이 낮습니다 (would_comment: false).",
    "",
    "<content>",
    content,
    "</content>",
    "",
    "규칙:",
    "- 이 persona의 reaction_rules, annoyance_triggers, trust_criteria를 반영하세요.",
    "- 댓글을 달 가능성이 낮다면 would_comment: false로 응답하세요.",
    "- 실제 리멤버 커넥트 댓글 스타일로 작성하세요 (1~3문장, 자연스러운 구어체).",
    "- 이 persona가 정말 그 글에 반응할 것 같으면 댓글을 쓰고, 그냥 지나칠 것 같으면 null로 두세요.",
    "",
    "JSON 형식으로만 응답하세요 (다른 텍스트 금지):",
    '{"would_comment": true/false, "comment": "댓글 내용 또는 null", "reason": "댓글을 달거나 달지 않는 이유 한 줄"}'
  ].join("\n");
}
