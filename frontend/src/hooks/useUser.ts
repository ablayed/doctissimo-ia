import { useState } from 'react'

const STORAGE_KEY = 'doctissimo-user'

export function useUser() {
  const [pseudo, setPseudo] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  const register = (newPseudo: string) => {
    localStorage.setItem(STORAGE_KEY, newPseudo)
    setPseudo(newPseudo)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPseudo(null)
  }

  return { pseudo, register, logout, isRegistered: !!pseudo }
}
