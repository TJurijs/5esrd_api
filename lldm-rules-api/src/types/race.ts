export interface Race {
  name: string;
  source: string;
  size: string[];
  speed: number;
  abilityBoosts?: string[];
  traits: Array<{ name: string; description: string }>;
  languages: string[];
  description: string;
  srd52: boolean;
}
