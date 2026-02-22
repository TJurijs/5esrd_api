export interface Feat {
  name: string;
  source: string;
  category: string;
  prerequisite?: string;
  repeatable?: boolean;
  abilityBoost?: string[];
  description: string;
  srd52: boolean;
}
