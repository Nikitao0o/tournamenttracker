export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatDateShort(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatScore(scoreA?: number, scoreB?: number) {
  if (scoreA === undefined || scoreB === undefined) {
    return 'vs'
  }

  return `${scoreA}-${scoreB}`
}