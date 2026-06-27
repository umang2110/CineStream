export interface User {
  email: string
  name: string
}

export function getSavedAccounts(): User[] {
  if (typeof window === "undefined") return []
  const saved = localStorage.getItem("saved_accounts")
  return saved ? JSON.parse(saved) : []
}

// Client-side login and register are now handled directly via API routes in the components

export function switchAccount(email: string): boolean {
   const accounts = getSavedAccounts()
   const user = accounts.find(a => a.email === email)
   if (user) {
      localStorage.setItem("user", JSON.stringify(user))
      return true
   }
   return false
}

export function removeAccount(email: string): void {
  const accounts = getSavedAccounts().filter(a => a.email !== email)
  localStorage.setItem("saved_accounts", JSON.stringify(accounts))
  const currentUser = getCurrentUser()
  if (currentUser?.email === email) {
    logout()
  }
}

export function logout(): void {
  localStorage.removeItem("user")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
