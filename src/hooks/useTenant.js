import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SUPER_ADMIN_EMAIL } from '../lib/constants'

export function useTenant() {
  const { user } = useAuth()
  const [currentChurch, setCurrentChurch] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [allChurches, setAllChurches] = useState([])
  const [loading, setLoading] = useState(true)

  const loadChurch = useCallback(async (churchId = null) => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    if (user.email === SUPER_ADMIN_EMAIL) {
      const { data: churches } = await supabase.from('churches').select('*')
      setAllChurches(churches || [])
      const target = churchId
        ? churches?.find(c => c.id === churchId)
        : churches?.[0]
      setCurrentChurch(target || null)
      setUserRole('owner')
    } else {
      const { data: memberships } = await supabase
        .from('church_members')
        .select('*, churches(*)')
        .eq('user_id', user.id)

      if (memberships?.length) {
        const target = churchId
          ? memberships.find(m => m.church_id === churchId)
          : memberships[0]
        setCurrentChurch(target?.churches || null)
        setUserRole(target?.role || null)
        setAllChurches(memberships.map(m => m.churches))
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadChurch() }, [loadChurch])

  const switchChurch = (churchId) => loadChurch(churchId)

  const refreshChurch = async () => {
    if (!currentChurch) return
    const { data } = await supabase.from('churches').select('*').eq('id', currentChurch.id).single()
    if (data) setCurrentChurch(data)
  }

  return { currentChurch, userRole, allChurches, loading, switchChurch, refreshChurch }
}
