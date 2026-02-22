const RECHARGE: Record<string, string> = {
  round: 'Every Round',
  restShort: 'Short Rest',
  restLong: 'Long Rest',
  dawn: 'Dawn',
  dusk: 'Dusk',
  midnight: 'Midnight',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  decade: 'Decade',
  century: 'Century',
  special: 'Special',
};

export function expandItemRecharge(code: string): string {
  return RECHARGE[code] ?? code;
}
