export interface MonsterSpeed {
  walk?: number;
  fly?: number;
  swim?: number;
  burrow?: number;
  climb?: number;
  canHover?: boolean;
}

export interface MonsterAbilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterAction {
  name: string;
  description: string;
}

export interface Monster {
  name: string;
  source: string;
  size: string[];
  type: string;
  alignment: string;
  ac: number;
  acNote?: string;
  hp: number | string;
  hpFormula?: string;
  speed: MonsterSpeed;
  abilities: MonsterAbilities;
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageImmunities?: string[];
  damageResistances?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses: string[];
  passivePerception: number;
  languages: string[];
  cr: string;
  traits: MonsterAction[];
  actions: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
  mythicActions?: MonsterAction[];
  srd52: boolean;
}
