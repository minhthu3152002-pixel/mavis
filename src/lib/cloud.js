import { supabase } from './supabase'

// Gói tiến độ cần đồng bộ (streak/level đều suy ra từ care_days).
export function buildState(careDays, petName) {
  return { v: 1, care_days: careDays, pet_name: petName }
}

// Đọc pet_state từ cloud. Trả về { state, updated_at } hoặc null.
export async function fetchPetState(userId) {
  try {
    const { data, error } = await supabase
      .from('pet_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data ?? null
  } catch (e) {
    console.warn('fetchPetState error', e)
    return null
  }
}

// Ghi (upsert) pet_state lên cloud.
export async function savePetState(userId, state) {
  try {
    const { error } = await supabase
      .from('pet_state')
      .upsert(
        { user_id: userId, state, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) throw error
  } catch (e) {
    console.warn('savePetState error', e)
  }
}
