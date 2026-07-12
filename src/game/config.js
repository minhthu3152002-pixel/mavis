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

// % tiến độ tới level kế tiếp (0..100). progress = (avg % 2) / 2 * 100.
export function levelProgress(stats) {
  const iq = stats?.iq || 0;
  const eq = stats?.eq || 0;
  const physical = stats?.physical || 0;
  const avg = (iq + eq + physical) / 3;
  return clamp((avg % 2) / 2 * 100, 0, 100);
}

// Số "điểm" (tổng chỉ số) còn thiếu để lên level kế. null nếu đã max.
export function pointsToNextLevel(stats) {
  const iq = stats?.iq || 0;
  const eq = stats?.eq || 0;
  const physical = stats?.physical || 0;
  const level = computeLevel(stats);
  if (level >= LEVEL_MAX) return null;
  const avg = (iq + eq + physical) / 3;
  const targetAvg = (level + 1) * 2; // avg cần đạt để lên level kế
  return Math.max(0, Math.ceil((targetAvg - avg) * 3));
}

// ===== Giai đoạn 2: mở khoá hoạt động theo chuỗi (streak) =====
// Mốc chuỗi -> danh sách key hoạt động được mở. Key khớp ACTIVITIES (chỉnh sau).
export const STREAK_UNLOCKS = {
  3: ['run'],
  5: ['coffee', 'matcha'],
  7: ['flower', 'study'],
};

// Mốc chuỗi cần để mở 1 hoạt động (0 = luôn mở, tầng cơ bản).
export function requiredStreakFor(key) {
  try {
    for (const [days, keys] of Object.entries(STREAK_UNLOCKS)) {
      if (keys.includes(key)) return Number(days);
    }
  } catch { /* lỗi thì coi như luôn mở */ }
  return 0;
}

export function isActivityUnlocked(key, streak) {
  return (streak || 0) >= requiredStreakFor(key);
}
