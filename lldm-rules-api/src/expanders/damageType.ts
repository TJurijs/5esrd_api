const DAMAGE: Record<string, string> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  O: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  P: 'Piercing',
  I: 'Poison',
  Y: 'Psychic',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
};

export function expandDamageType(code: string): string {
  return DAMAGE[code] ?? code;
}
