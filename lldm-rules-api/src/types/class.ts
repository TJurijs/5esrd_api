export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface Subclass {
  name: string;
  source: string;
  shortName: string;
  features: ClassFeature[];
}

export interface ClassData {
  name: string;
  source: string;
  hitDie: number;
  primaryAbility: string[];
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: string[];
  skillCount: number;
  features: ClassFeature[];
  subclasses: Subclass[];
  srd52: boolean;
}
