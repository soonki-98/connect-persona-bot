import type { CreatorPersona, ViewerPersona } from "./types";
import creatorPersonasRaw from "../../data/creator-personas-v2.json";
import viewerPersonasRaw from "../../data/viewer-personas-v1.json";
import maliciousPersonasRaw from "../../data/malicious-personas.json";
import maliciousViewersRaw from "../../data/malicious-viewers-v1.json";
import rawContentsRaw from "../../raw_data/contents_raw_data.json";

interface RawContentEntry {
  openProfileId: number;
  contents: string[];
}

const MAX_EXAMPLES = 3;
const MAX_EXAMPLE_LENGTH = 500;

function buildCreatorPersonasWithExamples(): CreatorPersona[] {
  const personas = creatorPersonasRaw as CreatorPersona[];
  const rawContents = rawContentsRaw as RawContentEntry[];

  const contentMap = new Map<number, string[]>();
  for (const entry of rawContents) {
    contentMap.set(entry.openProfileId, entry.contents);
  }

  return personas.map((persona) => {
    const sourceProfiles = (persona.raw_data_reference?.source_profiles ?? []) as number[];
    const examples: string[] = [];
    for (const profileId of sourceProfiles) {
      const contents = contentMap.get(profileId);
      if (contents) {
        for (const content of contents.slice(0, MAX_EXAMPLES - examples.length)) {
          examples.push(content.length > MAX_EXAMPLE_LENGTH ? content.slice(0, MAX_EXAMPLE_LENGTH) + "..." : content);
          if (examples.length >= MAX_EXAMPLES) break;
        }
      }
      if (examples.length >= MAX_EXAMPLES) break;
    }
    return { ...persona, few_shot_examples: examples };
  });
}

export function loadCreatorPersonas(): CreatorPersona[] {
  return buildCreatorPersonasWithExamples();
}

export function loadViewerPersonas(): ViewerPersona[] {
  return viewerPersonasRaw as ViewerPersona[];
}

export function loadMaliciousPersonas(): CreatorPersona[] {
  return maliciousPersonasRaw as CreatorPersona[];
}

export function loadMaliciousViewerPersonas(): ViewerPersona[] {
  return maliciousViewersRaw as ViewerPersona[];
}
