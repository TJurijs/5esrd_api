interface RawRange {
  type: string;
  distance?: { type: string; amount?: number };
}

export function expandSpellRange(range: RawRange): string {
  if (!range) return 'Unknown';
  switch (range.type) {
    case 'self': return 'Self';
    case 'touch': return 'Touch';
    case 'sight': return 'Sight';
    case 'unlimited': return 'Unlimited';
    case 'special': return 'Special';
    case 'plane': return 'Unlimited (same plane)';
    case 'point':
    case 'line':
    case 'cube':
    case 'cone':
    case 'emanation':
    case 'radius':
    case 'sphere':
    case 'hemisphere':
    case 'cylinder': {
      const dist = range.distance;
      if (!dist) return range.type;
      if (dist.type === 'self') return 'Self';
      if (dist.type === 'touch') return 'Touch';
      if (dist.type === 'sight') return 'Sight';
      if (dist.type === 'unlimited') return 'Unlimited';
      const unit = dist.amount === 1
        ? dist.type.replace(/s$/, '')
        : dist.type;
      return dist.amount !== undefined ? `${dist.amount} ${unit}` : dist.type;
    }
    default:
      return range.type;
  }
}
