const ITEM_PROP: Record<string, string> = {
  '2H': 'Two-Handed',
  'A': 'Ammunition',
  'AF': 'Futuristic Ammunition',
  'BF': 'Burst Fire',
  'ER': 'Extended Reach',
  'F': 'Finesse',
  'H': 'Heavy',
  'L': 'Light',
  'LD': 'Loading',
  'OTH': 'Other',
  'R': 'Reach',
  'RLD': 'Reload',
  'S': 'Special',
  'T': 'Thrown',
  'V': 'Versatile',
  'Vst': 'Vestige of Divergence',
};

export function expandItemProperty(code: string): string {
  return ITEM_PROP[code] ?? code;
}
