export interface Background {
  name: string;
  source: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  equipment: string;
  description: string;
  features: Array<{ name: string; description: string }>;
  srd52: boolean;
}
