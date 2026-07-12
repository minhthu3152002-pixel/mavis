// ===== Giai đoạn 1: nền dữ liệu cho hệ chỉ số / level / xu =====
// File config điểm số. Chỉ dữ liệu, KHÔNG đụng logic chăm sóc cũ.

export const STAT_MAX = 100;
export const LEVEL_MAX = 50;

// Map: key hoạt động -> điểm cộng vào từng chỉ số (iq / eq / physical).
// Dễ thêm/sửa sau theo catalog. Key không có ở đây sẽ bị addPoints bỏ qua.
export const ACTIVITY_POINTS = {
  food:   { eq: 3 },
  water:  { eq: 1 },
  coffee: { eq: 2 },
  love:   { eq: 4 },
  flower: { eq: 3 },
  money:  { eq: 2 },
  pet:    { eq: 3 },
  sleep:  { physical: 3 },
  matcha: { eq: 5 },
  sport:  { physical: 4 },
  gym:    { physical: 5 },
  scare:  { eq: 1 },
  study:  { iq: 5 }, // ví dụ cho hoạt động tương lai
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// level = clamp(floor(((iq + eq + physical) / 3) / 2), 1, 50)
export function computeLevel(stats) {
  const iq = stats?.iq || 0;
  const eq = stats?.eq || 0;
  const physical = stats?.physical || 0;
  return clamp(Math.floor(((iq + eq + physical) / 3) / 2), 1, LEVEL_MAX);
}
