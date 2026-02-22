export interface Language {
  name: string;
  source: string;
  type: string;
  typicalSpeakers: string[];
  script?: string;
  description?: string;
  srd52: boolean;
}
