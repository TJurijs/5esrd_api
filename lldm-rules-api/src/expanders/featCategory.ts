const FEAT_CAT: Record<string, string> = {
  D: 'Dragonmark',
  G: 'General',
  O: 'Origin',
  FS: 'Fighting Style',
  'FS:P': 'Fighting Style (Paladin)',
  'FS:R': 'Fighting Style (Ranger)',
  EB: 'Epic Boon',
};

export function expandFeatCategory(code: string): string {
  return FEAT_CAT[code] ?? code;
}
