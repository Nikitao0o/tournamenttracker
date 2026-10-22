export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validateLoginForm(email: string, password: string): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {}
  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address format'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  return errors
}

export function validateRegisterForm(
  email: string,
  nickname: string,
  password: string,
): { email?: string; nickname?: string; password?: string } {
  const errors = validateLoginForm(email, password)
  const fullErrors: { email?: string; nickname?: string; password?: string } = { ...errors }

  if (!nickname.trim()) {
    fullErrors.nickname = 'Nickname is required'
  } else if (nickname.trim().length < 2) {
    fullErrors.nickname = 'Nickname must be at least 2 characters'
  }

  return fullErrors
}

export function validateTournamentForm(values: {
  title: string
  prizePool: string
  startDate: string
  endDate: string
  location: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.title.trim()) {
    errors.title = 'Tournament title is required'
  } else if (values.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters'
  }

  if (!values.location.trim()) {
    errors.location = 'Location is required'
  }

  if (!values.prizePool.trim()) {
    errors.prizePool = 'Prize pool is required (e.g. $1,000,000)'
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required'
  }

  if (!values.endDate) {
    errors.endDate = 'End date is required'
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'End date cannot be earlier than start date'
  }

  return errors
}
