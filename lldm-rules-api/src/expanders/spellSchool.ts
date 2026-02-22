const SCHOOL: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
  V: 'Evocation',
  P: 'Psionic',
};

export function expandSpellSchool(code: string): string {
  return SCHOOL[code] ?? code;
}
