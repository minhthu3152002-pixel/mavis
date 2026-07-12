import { useState } from 'react'
import { useAuth } from '../lib/useAuth'

export default function AuthGate({ children }) {
  const { user, profile, loading, signInWithGoogle, saveUsername } = useAuth()
  const [name, setName] = useState('')

  if (loading) {
    return (
      <div className="auth-screen">
        <p className="sheet-text muted">Đang tải...</p>
      </div>
    )
  }

  // Chưa đăng nhập -> màn đăng nhập Google.
  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="sheet-title">Mavis nè 🐹</h1>
          <p className="sheet-text">Đăng nhập để chăm bé cưng nha 🩷</p>
          <button className="btn-pill btn-primary" onClick={signInWithGoogle}>
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    )
  }

  // Đã đăng nhập nhưng chưa có username -> màn đặt tên.
  if (!profile || !profile.username) {
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
          />
          <button
            className="btn-pill btn-primary"
            disabled={!name.trim()}
            onClick={() => saveUsername(name)}
          >
            Lưu
          </button>
        </div>
      </div>
    )
  }

  return children
}
