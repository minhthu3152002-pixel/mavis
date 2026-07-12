import { useState } from 'react'
import { useAuth } from '../lib/useAuth'
import { track } from '../lib/track'

const getGuestName = () => {
  try { return localStorage.getItem('mavis_username') || '' } catch { return '' }
}

export default function AuthGate({ children }) {
  const { user, profile, loading, saveUsername } = useAuth()
  const [guestName, setGuestName] = useState(getGuestName)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // Member ưu tiên username từ profile; guest dùng username localStorage.
  const username = profile?.username || guestName

  // Chỉ chờ khi đang xác định member VÀ chưa có tên guest sẵn (tránh chặn guest).
  if (loading && !guestName) {
    return (
      <div className="auth-screen">
        <p className="sheet-text muted">Đang tải...</p>
      </div>
    )
  }

  // Chưa có username -> màn đặt tên (KHÔNG bắt đăng nhập).
  if (!username) {
    const onSave = async () => {
      const v = name.trim()
      if (!v || saving) return
      setSaving(true)
      try {
        if (user) {
          await saveUsername(v) // member -> lưu vào profile Supabase
        } else {
          try { localStorage.setItem('mavis_username', v) } catch {}
          setGuestName(v)
          track('guest_start', {}, '')
        }
      } finally {
        setSaving(false)
      }
    }
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="sheet-title">Đặt tên của bạn</h1>
          <p className="sheet-text">Cho bé cưng biết gọi anh là gì nè 🩷</p>
          <input
            className="sheet-input"
            value={name}
            placeholder="Tên của bạn"
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
          />
          <button
            className="btn-pill btn-primary"
            disabled={!name.trim() || saving}
            onClick={onSave}
          >
            Lưu
          </button>
        </div>
      </div>
    )
  }

  return children
}
