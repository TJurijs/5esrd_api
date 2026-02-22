const ALIGN: Record<string, string> = {
  L: 'Lawful',
  C: 'Chaotic',
  N: 'Neutral',
  NX: 'Neutral',
  NY: 'Neutral',
  G: 'Good',
  E: 'Evil',
  U: 'Unaligned',
  A: 'Any Alignment',
};

export function expandAlignment(codes: string[]): string {
  if (!codes || codes.length === 0) return 'Unaligned';
  const parts = codes.map(c => ALIGN[c] ?? c);
  return [...new Set(parts)].join(' ');
}
