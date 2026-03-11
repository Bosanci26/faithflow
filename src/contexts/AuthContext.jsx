import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SUPER_ADMIN_EMAIL } from '../lib/constants'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password, metadata) =>
    supabase.auth.signUp({ email, password, options: { data: metadata } })

  const signOut = () => supabase.auth.signOut()

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
