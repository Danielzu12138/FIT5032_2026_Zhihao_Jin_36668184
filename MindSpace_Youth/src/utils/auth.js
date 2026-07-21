export function findCurrentUser(users, currentUserEmail) {
  return users.find(user => user.email === currentUserEmail) || null
}

export function roleLabel(role) {
  return role === 'admin' ? 'Admin staff' : 'Young user'
}
