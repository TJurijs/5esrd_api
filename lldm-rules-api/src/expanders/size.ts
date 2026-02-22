const SIZE: Record<string, string> = {
  F: 'Fine',
  D: 'Diminutive',
  T: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  H: 'Huge',
  G: 'Gargantuan',
  C: 'Colossal',
  V: 'Varies',
};

export function expandSize(code: string): string {
  return SIZE[code] ?? code;
}
