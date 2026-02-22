export interface Item {
  name: string;
  source: string;
  type: string;
  rarity: string;
  weight?: number;
  value?: string;
  attunement?: string;
  wondrous: boolean;
  properties: string[];
  damage?: string;
  damageType?: string;
  range?: string;
  ac?: number;
  bonusAttack?: string;
  bonusSpellAttack?: string;
  bonusSpellSaveDc?: string;
  bonusAc?: string;
  recharge?: string;
  charges?: number;
  description: string;
  srd52: boolean;
}
