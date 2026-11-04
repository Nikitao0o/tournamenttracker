export function ensureTeamRecord<T>(
  records: Record<string, T>,
  name: string,
  createDefault: () => T,
): void {
  if (!name || name === 'TBD') return
  if (!records[name]) {
    records[name] = createDefault()
  }
}
