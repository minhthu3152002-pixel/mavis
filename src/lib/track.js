import { supabase } from './supabase'

// device_id ẩn danh, ổn định theo máy (dùng cho cả guest lẫn member).
function deviceId() {
  try {
    let id = localStorage.getItem('mavis_device')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('mavis_device', id)
    }
    return id
  } catch {
    return null
  }
}

export async function track(action, props = {}, petName = '') {
  try {
    const device_id = deviceId()
    let user_id = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      user_id = user?.id ?? null
    } catch { /* guest hoặc lỗi mạng -> user_id null */ }
    await supabase.from('events').insert({ device_id, user_id, pet_name: petName, action, props })
  } catch (e) {
    console.warn('track error', e)
  }
}
