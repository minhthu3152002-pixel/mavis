import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { track } from './track'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Đánh dấu đã lấy xong session ban đầu, tránh nhấp nháy màn đăng nhập.
  const [ready, setReady] = useState(false)

  // Lấy session ban đầu + lắng nghe thay đổi đăng nhập.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setReady(true)
      // Ghi 'login' một lần cho mỗi phiên trình duyệt (2 instance hook nên cần guard).
      try {
        if (event === 'SIGNED_IN' && !sessionStorage.getItem('mavis_login_tracked')) {
          sessionStorage.setItem('mavis_login_tracked', '1')
          track('login', {}, '')
        }
        if (event === 'SIGNED_OUT') sessionStorage.removeItem('mavis_login_tracked')
      } catch { /* bỏ qua nếu sessionStorage không dùng được */ }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Mỗi khi có user, nạp profile tương ứng.
  useEffect(() => {
    if (!ready) return
    const user = session?.user
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile(data ?? null)
        setLoading(false)
      })
    return () => { active = false }
  }, [ready, session])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

  const signOut = () => supabase.auth.signOut()

  const saveUsername = async (name) => {
    const user = session?.user
    if (!user) return
    await supabase
      .from('profiles')
      .upsert({ id: user.id, username: name.trim(), email: user.email })
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(data ?? null)
  }

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    saveUsername,
  }
}
