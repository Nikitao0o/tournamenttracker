export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validateLoginForm(email: string, password: string): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {}
  if (!email.trim()) {
    errors.email = 'Email обязателен для ввода'
  } else if (!isValidEmail(email)) {
    errors.email = 'Некорректный формат email адреса'
  }

  if (!password) {
    errors.password = 'Пароль обязателен для ввода'
  } else if (password.length < 6) {
    errors.password = 'Пароль должен содержать не менее 6 символов'
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
    fullErrors.nickname = 'Никнейм обязателен'
  } else if (nickname.trim().length < 2) {
    fullErrors.nickname = 'Никнейм должен содержать не менее 2 символов'
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
    errors.title = 'Название турнира обязательно'
  } else if (values.title.trim().length < 3) {
    errors.title = 'Название должно быть не менее 3 символов'
  }

  if (!values.location.trim()) {
    errors.location = 'Локация обязательна'
  }

  if (!values.prizePool.trim()) {
    errors.prizePool = 'Укажите призовой фонд (например, $1,000,000)'
  }

  if (!values.startDate) {
    errors.startDate = 'Дата начала обязательна'
  }

  if (!values.endDate) {
    errors.endDate = 'Дата окончания обязательна'
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'Дата окончания не может быть раньше даты начала'
  }

  return errors
}
