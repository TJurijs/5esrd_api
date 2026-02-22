const ATK: Record<string, string> = {
  MW: 'Melee Weapon Attack',
  RW: 'Ranged Weapon Attack',
  MS: 'Melee Spell Attack',
  RS: 'Ranged Spell Attack',
};

export function expandAttackType(code: string): string {
  return ATK[code] ?? code;
}
