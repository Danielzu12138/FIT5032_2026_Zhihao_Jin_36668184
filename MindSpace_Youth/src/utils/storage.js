export const STORAGE_KEYS = {
  users: 'mindspace_users',
  session: 'mindspace_session',
  bookings: 'mindspace_bookings',
  ratings: 'mindspace_ratings',
  saved: 'mindspace_saved_resources'
}

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function seedStorage() {
  const existingUsers = readStorage(STORAGE_KEYS.users, null)
  if (!existingUsers) {
    writeStorage(STORAGE_KEYS.users, [
      {
        name: 'Demo Young User',
        email: 'user@mindspace.test',
        password: 'Password123',
        role: 'young_user'
      },
      {
        name: 'Demo Admin',
        email: 'admin@mindspace.test',
        password: 'Admin12345',
        role: 'admin'
      }
    ])
  }

  const existingRatings = readStorage(STORAGE_KEYS.ratings, null)
  if (!existingRatings) {
    writeStorage(STORAGE_KEYS.ratings, [
      {
        service: 'Online wellbeing check-in',
        score: 5,
        comment: 'The booking process felt private and simple.',
        user: 'Demo Young User'
      },
      {
        service: 'Study stress support',
        score: 4,
        comment: 'Clear advice and easy language.',
        user: 'Anonymous user'
      }
    ])
  }
}
