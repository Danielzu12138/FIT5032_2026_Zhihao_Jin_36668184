export function sanitizeInput(value, maxLength = 200) {
  return String(value)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isFutureDateTime(date, time) {
  const selectedDate = new Date(date + 'T' + time)
  return !Number.isNaN(selectedDate.getTime()) && selectedDate > new Date()
}
