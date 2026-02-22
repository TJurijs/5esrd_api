export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material?: string;
  royalty?: boolean;
}

export interface Spell {
  name: string;
  source: string;
  level: number;
  school: string;
  castingTime: string;
  castingTimeCondition?: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  classes?: string[];
  damageTypes: string[];
  savingThrow: string[];
  areaTags: string[];
  miscTags: string[];
  srd52: boolean;
}
