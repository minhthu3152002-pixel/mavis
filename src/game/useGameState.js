// ===== Giai đoạn 1: hook quản lý state game =====
// Lưu ở localStorage key RIÊNG 'mavis_game' — KHÔNG đụng key chăm sóc cũ.
// Mọi thứ bọc try/catch: nếu hệ mới lỗi thì app vẫn chạy y như cũ.

import { useCallback, useEffect, useState } from 'react';
import { ACTIVITY_POINTS, STAT_MAX, computeLevel } from './config';

const STORAGE_KEY = 'mavis_game';

const defaultState = () => ({
  stats: { iq: 0, eq: 0, physical: 0 },
  coins: 0,
  maxLevelReached: 1,
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw);
    return {
      stats: {
        iq: p?.stats?.iq || 0,
        eq: p?.stats?.eq || 0,
        physical: p?.stats?.physical || 0,
      },
      coins: p?.coins || 0,
      maxLevelReached: p?.maxLevelReached || 1,
    };
  } catch {
    return defaultState();
  }
}

const clampStat = (v) => Math.max(0, Math.min(STAT_MAX, v));

export function useGameState() {
  const [state, setState] = useState(loadState);

  // Lưu localStorage mỗi khi state đổi.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    // TODO(giai đoạn sau): nếu đã đăng nhập (Supabase) thì đồng bộ 'mavis_game' lên cloud.
  }, [state]);

  const level = computeLevel(state.stats);

  // Bằng chứng chạy đúng (giai đoạn 1, chưa có UI): log mỗi khi chỉ số đổi.
  useEffect(() => {
    try { console.log('[mavis-game] stats', state.stats, '| level', level); } catch {}
  }, [state.stats, level]);

  const addPoints = useCallback((activityKey) => {
    try {
      const pts = ACTIVITY_POINTS[activityKey];
      if (!pts) return; // key không có trong config -> không làm gì
      setState((prev) => {
        const stats = { ...prev.stats };
        for (const [k, v] of Object.entries(pts)) {
          if (k in stats) stats[k] = clampStat((stats[k] || 0) + v);
        }
        const lv = computeLevel(stats);
        const maxLevelReached = Math.max(prev.maxLevelReached || 1, lv);
        return { ...prev, stats, maxLevelReached };
      });
    } catch (e) {
      console.warn('[mavis-game] addPoints error', e);
    }
  }, []);

  const addCoins = useCallback((n) => {
    try {
      setState((prev) => ({ ...prev, coins: (prev.coins || 0) + (Number(n) || 0) }));
    } catch (e) {
      console.warn('[mavis-game] addCoins error', e);
    }
  }, []);

  return {
    stats: state.stats,
    coins: state.coins,
    level,
    maxLevelReached: state.maxLevelReached,
    addPoints,
    addCoins,
  };
}
