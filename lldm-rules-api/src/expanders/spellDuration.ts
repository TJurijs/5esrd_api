interface RawDuration {
  type: string;
  duration?: { type: string; amount?: number };
  concentration?: boolean;
  ends?: string[];
}

export function expandSpellDuration(durations: RawDuration[]): string {
  if (!durations?.length) return 'Unknown';
  const d = durations[0];
  let base: string;
  switch (d.type) {
    case 'instant': base = 'Instantaneous'; break;
    case 'special': base = 'Special'; break;
    case 'permanent': base = 'Permanent'; break;
    case 'timed': {
      const amt = d.duration?.amount ?? 1;
      const unit = d.duration?.type ?? 'round';
      const unitStr = amt === 1 ? unit : `${unit}s`;
      base = `${amt} ${unitStr}`;
      break;
    }
    default: base = d.type;
  }
  if (d.concentration) base = `Concentration, up to ${base}`;
  return base;
}
