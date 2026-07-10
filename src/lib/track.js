import { supabase } from './supabase'

export async function track(action, props = {}, petName = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('events').insert({ user_id: user.id, pet_name: petName, action, props })
  } catch (e) { console.warn('track error', e) }
}
