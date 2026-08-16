export const pages = [
  { id: 'home', label: 'Home', public: true },
  { id: 'resources', label: 'Resources', public: true },
  { id: 'find-support', label: 'Find Support', public: true },
  { id: 'support', label: 'Online Support', public: true },
  { id: 'reviews', label: 'Reviews', public: true },
  { id: 'account', label: 'Login', public: true, hideWhenLoggedIn: true },
  { id: 'dashboard', label: 'My Dashboard', role: 'young_user' },
  { id: 'admin', label: 'Admin', role: 'admin' }
]

export function canAccess(page, user) {
  if (!page) return false
  if (page.public) return true
  return Boolean(user && user.role === page.role)
}

export function getVisiblePages(user) {
  return pages.filter(page => {
    if (page.hideWhenLoggedIn && user) return false
    return canAccess(page, user)
  })
}
