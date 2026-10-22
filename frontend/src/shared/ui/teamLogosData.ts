// Векторные SVG-логотипы команд (всегда доступны, не зависят от сети)
export const TEAM_LOGOS: Record<string, { svg: string; bg: string; color: string; short: string }> = {
  'team-spirit': {
    bg: '#000000',
    color: '#ffffff',
    short: 'TS',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="%230f1115"/><path d="M22 65 C30 50 45 42 60 48 C68 38 60 28 50 25 C65 24 82 35 78 55 C74 72 52 80 32 75 Z" fill="%23ffffff"/><circle cx="58" cy="38" r="4" fill="%2369f0ae"/></svg>`,
  },
  'team-vitality': {
    bg: '#111111',
    color: '#ffe600',
    short: 'VIT',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="%23141414"/><path d="M22 28 L50 80 L78 28 L64 28 L50 56 L36 28 Z" fill="%23ffe600"/><polygon points="43,24 57,24 50,34" fill="%23ffe600"/></svg>`,
  },
  'team-furia': {
    bg: '#000000',
    color: '#ffffff',
    short: 'FUR',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="%23090a0d"/><path d="M25 72 C25 45 40 30 75 28 C72 38 65 42 60 48 C70 52 75 62 70 72 C58 75 42 76 25 72 Z" fill="%23ffffff"/><circle cx="48" cy="46" r="4" fill="%23f04b3a"/></svg>`,
  },
  'team-mouz': {
    bg: '#e30613',
    color: '#ffffff',
    short: 'MOUZ',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="%231c0204"/><path d="M30 32 C20 45 20 65 35 75 C45 68 50 55 50 45 C50 55 55 68 65 75 C80 65 80 45 70 32 C60 40 54 48 50 48 C46 48 40 40 30 32 Z" fill="%23e30613"/><circle cx="50" cy="62" r="5" fill="%23ffffff"/></svg>`,
  },
}

export function getTeamLogoData(teamIdentifier: string) {
  const normalized = teamIdentifier.toLowerCase().trim().replace(/\s+/g, '-')
  if (TEAM_LOGOS[normalized]) return TEAM_LOGOS[normalized]
  if (normalized.includes('spirit')) return TEAM_LOGOS['team-spirit']
  if (normalized.includes('vitality')) return TEAM_LOGOS['team-vitality']
  if (normalized.includes('furia')) return TEAM_LOGOS['team-furia']
  if (normalized.includes('mouz')) return TEAM_LOGOS['team-mouz']
  return undefined
}
