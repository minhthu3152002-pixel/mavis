import { useEffect, useMemo, useRef, useState } from 'react';

// Bộ hamster cũ — dùng làm fallback khi chưa có ảnh mit_* trong src/assets/mit/
import coffee from './assets/hamsters/coffee.png';
import love from './assets/hamsters/love.png';
import food from './assets/hamsters/food.png';
import money from './assets/hamsters/money.png';
import hello from './assets/hamsters/hello.png';
import flower from './assets/hamsters/flower.png';

// ---- Ảnh Mít: nạp mọi ảnh có sẵn trong assets (mit_* và item_*) ----
// Quét cả src/assets/hamsters/ và src/assets/mit/ để không phụ thuộc chỗ đặt file.
const MIT_URLS = {
  ...import.meta.glob('./assets/hamsters/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('./assets/mit/*.png', { eager: true, query: '?url', import: 'default' }),
};
const MIT_IMAGES = {};
for (const [path, url] of Object.entries(MIT_URLS)) {
  const name = path.split('/').pop().replace(/\.png$/, '');
  MIT_IMAGES[name] = url;
}
// Fallback ảnh mood/reaction về bộ hamster cũ khi chưa có ảnh mit_* thật.
const FALLBACK_IMG = {
  mit_happy: hello, mit_hello: hello, mit_sleepy: hello, mit_sleeping: hello,
  mit_need_pet: hello, mit_petted: hello, mit_sad: hello,
  mit_thirsty: hello, mit_drinking: hello,
  mit_hungry: food, mit_starving: food, mit_eating: food,
  mit_coffee: coffee, mit_love: love, mit_flower: flower, mit_money: money,
};
const mitImg = (name) => MIT_IMAGES[name] || FALLBACK_IMG[name] || hello;
const itemImg = (name) => MIT_IMAGES[name] || null; // null → hiển thị emoji

// ---- Hoạt động: món đồ kéo-thả + ảnh phản ứng + câu nói ----
const ACTIVITIES = [
  {
    key: 'food', label: 'Cho ăn', emoji: '🍚', item: 'item_food', reaction: 'mit_eating',
    lines: [
      'Ăn cơm chưa cục cưng? Không được bỏ bữa nha 🍚',
      'Snack cho Mít nè, đói là quạu đó nha 🍟',
      'Ăn cho khỏe rồi thương anh nhiều nhiều 😋',
    ],
  },
  {
    key: 'water', label: 'Uống nước', emoji: '💧', item: 'item_water', reaction: 'mit_drinking',
    lines: [
      'Uống nước rồi nè, mát ghê 💧',
      'Cảm ơn anh, Mít hết khát rồi 🥤',
      'Nước ngon, anh cũng uống với Mít nha 💗',
    ],
  },
  {
    key: 'coffee', label: 'Cà phê', emoji: '☕', item: 'item_coffee', reaction: 'mit_coffee',
    lines: [
      'Cà phê nè anh ơi, tỉnh táo làm việc nha ☕',
      'Uống cà phê rồi ôm Mít một cái nha 🥰',
      'Làm ít thôi cục cưng, mệt thì nghỉ 5 phút ☕',
    ],
  },
  {
    key: 'love', label: 'Nói yêu', emoji: '💗', item: 'item_heart', reaction: 'mit_love',
    lines: [
      'Em thương anh nhiều lắm đó ❤️',
      'Anh là cục cưng số một của Mít 🥺',
      'I love you cục cưng 💕',
      'Có anh là ngày của Mít vui rồi 🫶',
    ],
  },
  {
    key: 'flower', label: 'Tặng hoa', emoji: '🌼', item: 'item_flower', reaction: 'mit_flower',
    lines: [
      'Tặng anh nè, thương anh nhiều 🌼',
      'Hoa cho người thương của Mít 💐',
      'Đẹp trai của Mít nhận hoa nha 🌸',
    ],
  },
  {
    key: 'money', label: 'Cho tiền', emoji: '💵', item: 'item_money', reaction: 'mit_money',
    lines: [
      'Tiền tiêu vặt cho cục cưng nè 💵',
      'Cầm lấy mua trà sữa uống nha 🧋',
      'Của anh hết á, đừng tiết kiệm quá 🥰',
    ],
  },
  {
    key: 'pet', label: 'Vuốt ve', emoji: '🫶', item: 'item_hand', reaction: 'mit_petted',
    lines: [
      'Được vuốt ve thích ghê 🥰',
      'Mít thương anh nhất 🫶',
      'Xoa đầu Mít thêm cái nữa đi 💕',
    ],
  },
  {
    key: 'sleep', label: 'Đi ngủ', emoji: '😴', item: 'item_sleep', reaction: 'mit_sleeping',
    lines: [
      'Mít đi ngủ đây, ngủ ngon nha anh 😴',
      'Chúc anh mơ đẹp 🌙',
      'Zzz… thương anh 💤',
    ],
  },
];
const ACT_BY_KEY = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a]));

const HELLO_LINES = ['Hi cục cưng ❤️', 'Mít nhớ anh nè 👋', 'Hôm nay của anh sao rồi? 🥰'];

const WATER_TIMES = [9, 11, 14, 16, 20]; // giờ nhắc uống nước
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayKey = () => new Date().toISOString().slice(0, 10);

// Ngày local (YYYY-MM-DD) cho care log — theo giờ máy để khớp mood/giờ.
function localDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ---------------- Push notifications (OneSignal) ----------------
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent || '');
const isStandalone = () => {
  try {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  } catch { return false; }
};
const notifPermission = () => {
  try { return typeof Notification !== 'undefined' ? Notification.permission : 'default'; }
  catch { return 'default'; }
};

// ---------------- Weather (Open-Meteo, không cần API key) ----------------
const HCMC = { lat: 10.776, lon: 106.7 }; // fallback: TP.HCM

function weatherMessage(code, temp) {
  const rainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95);
  if (rainy) return { emoji: '☔', text: 'Có thể có mưa đó cục cưng, nhớ mang áo mưa nha' };
  if (temp >= 32) return { emoji: '☀️', text: 'Hôm nay nắng nóng á, nhớ uống nước với che nắng nha' };
  if (temp <= 23) return { emoji: '🧥', text: 'Trời hơi lạnh nè, mặc áo ấm nha cục cưng' };
  return { emoji: '🌤️', text: 'Thời tiết dễ chịu, ngày đẹp cho cục cưng đó' };
}

function useWeather() {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    let done = false;
    const load = ({ lat, lon }) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (done || !d.current) return;
          const t = Math.round(d.current.temperature_2m);
          const m = weatherMessage(d.current.weather_code, t);
          setWeather({ ...m, temp: t });
        })
        .catch(() => {});
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => load({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => load(HCMC),
        { timeout: 6000 }
      );
    } else {
      load(HCMC);
    }
    return () => { done = true; };
  }, []);
  return weather;
}

// ---------------- Water tracker (localStorage, reset mỗi ngày) ----------------
function useWater() {
  const key = `mavis_water_${todayKey()}`;
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(done)); } catch {}
  }, [key, done]);
  const drink = (h) => setDone((d) => (d.includes(h) ? d : [...d, h]));
  return { done, drink };
}

// -------- Care state: đếm số lần mỗi hoạt động theo từng ngày --------
function useCareDays() {
  const [days, setDays] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavis_care_days')) || {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem('mavis_care_days', JSON.stringify(days)); } catch {}
  }, [days]);
  const mark = (key) => setDays((prev) => {
    const k = localDayKey();
    const day = { ...prev[k] };
    day[key] = (day[key] || 0) + 1;
    return { ...prev, [k]: day };
  });
  return { days, mark };
}

const countOn = (days, key, dk) => (days[dk] && days[dk][key]) || 0;
const doneToday = (days, key) => countOn(days, key, localDayKey()) > 0;

// Mood: chọn ảnh Mít theo trạng thái, ưu tiên từ trên xuống.
function pickMood(days, hour) {
  const today = localDayKey();
  const yest = localDayKey(new Date(Date.now() - 864e5));
  const night = hour >= 21 || hour < 5;
  const ate = countOn(days, 'food', today) > 0;
  const drank = countOn(days, 'water', today) > 0;
  const petted = countOn(days, 'pet', today) > 0;
  const slept = countOn(days, 'sleep', today) > 0;

  if (slept && night) return 'mit_sleeping';
  if (night) return 'mit_sleepy';
  if (!ate && hour >= 14) {
    const ateYest = countOn(days, 'food', yest) > 0;
    return ateYest ? 'mit_hungry' : 'mit_starving';
  }
  if (!drank && hour >= 14) return 'mit_thirsty';
  if (!petted && hour >= 18) return 'mit_need_pet';
  if (!ate && !drank && !petted && hour >= 16) return 'mit_sad';
  if (ate && drank && petted) return 'mit_happy';
  return 'mit_happy';
}

// Streak: số ngày liên tiếp đủ 3 nhu cầu cốt lõi (ăn, nước, vuốt ve).
function computeStreak(days) {
  const complete = (dk) =>
    countOn(days, 'food', dk) > 0 && countOn(days, 'water', dk) > 0 && countOn(days, 'pet', dk) > 0;
  let d = new Date();
  if (!complete(localDayKey(d))) d = new Date(d.getTime() - 864e5); // hôm nay chưa xong → tính tới hôm qua
  let s = 0;
  while (complete(localDayKey(d))) {
    s++;
    d = new Date(d.getTime() - 864e5);
  }
  return s;
}

// Số lần tặng hoa trong tuần này (tuần bắt đầu thứ Hai).
function flowersThisWeek(days) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon = 0
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dow);
  let n = 0;
  for (const [dk, rec] of Object.entries(days)) {
    const d = new Date(`${dk}T00:00:00`);
    if (!Number.isNaN(d.getTime()) && d >= start) n += rec.flower || 0;
  }
  return n;
}

// ------------------------------- Hearts -------------------------------
let heartId = 0;
function useHearts() {
  const [hearts, setHearts] = useState([]);
  const burst = (n = 5) => {
    const batch = Array.from({ length: n }, () => ({
      id: heartId++,
      x: 40 + Math.random() * 20,
      d: 0.6 + Math.random() * 0.5,
      s: 0.7 + Math.random() * 0.7,
      e: ['❤️', '🩷', '💕', '💗'][Math.floor(Math.random() * 4)],
    }));
    setHearts((h) => [...h, ...batch]);
    setTimeout(() => {
      setHearts((h) => h.filter((x) => !batch.find((b) => b.id === x.id)));
    }, 1400);
  };
  return { hearts, burst };
}

// =========================== Tabs ===========================
const TABS = [
  { key: 'home', emoji: '🐹', label: 'Mít' },
  { key: 'care', emoji: '💧', label: 'Chăm sóc' },
  { key: 'guide', emoji: '📖', label: 'Hướng dẫn' },
];

// ---------------------------- Home tab ----------------------------
function HomeTab({
  imgSrc, imgName, message, wobble, hearts, hot, stageRef, onPet,
  onItemDown, onItemMove, onItemUp,
  showNotifCta, iosNeedsInstall, enableNotify,
}) {
  return (
    <div className="tab-view home">
      <div className="stage-wrap">
        <div ref={stageRef} className={`stage ${hot ? 'hot' : ''}`}>
          <div className="halo" />
          <img
            src={imgSrc}
            alt="Mít"
            className={`hamster ${wobble ? 'wobble' : ''}`}
            onClick={onPet}
            draggable={false}
            key={imgName}
          />
          <div className="hearts">
            {hearts.map((h) => (
              <span key={h.id} style={{ left: `${h.x}%`, animationDuration: `${h.d}s`, transform: `scale(${h.s})` }}>
                {h.e}
              </span>
            ))}
          </div>
        </div>

        <div className="bubble" key={message}>{message}</div>

        <div className="drag-hint">Kéo món đồ thả vào Mít nha 👇</div>

        <div className="drag-tray" aria-label="Món đồ chăm Mít">
          {ACTIVITIES.map((a) => {
            const img = itemImg(a.item);
            return (
              <div
                key={a.key}
                className="drag-item"
                onPointerDown={(e) => onItemDown(e, a)}
                onPointerMove={onItemMove}
                onPointerUp={onItemUp}
                onPointerCancel={onItemUp}
              >
                {img
                  ? <img className="di-img" src={img} alt="" draggable={false} />
                  : <span className="di-emoji">{a.emoji}</span>}
                <span className="di-label">{a.label}</span>
              </div>
            );
          })}
        </div>

        {showNotifCta && (
          iosNeedsInstall ? (
            <p className="notify-hint">
              Trên iPhone: thêm app vào Màn hình chính trước, rồi mở lại từ icon để bật thông báo nha 💧
            </p>
          ) : (
            <button className="notify-enable" onClick={enableNotify}>
              Bật nhắc uống nước 🔔
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ---------------------------- Care tab ----------------------------
function CareTab({ weather, water, hour, dueWater, days, onWaterExtra }) {
  const checklist = [
    { key: 'food', emoji: '🍚', label: 'Đã cho ăn', done: doneToday(days, 'food') },
    { key: 'water', emoji: '💧', label: 'Đã uống nước', done: doneToday(days, 'water') || water.done.length > 0 },
    { key: 'pet', emoji: '🫶', label: 'Đã vuốt ve', done: doneToday(days, 'pet') },
    { key: 'coffee', emoji: '☕', label: 'Đã cà phê', done: doneToday(days, 'coffee') },
    { key: 'flower', emoji: '🌼', label: 'Đã tặng hoa', done: doneToday(days, 'flower') },
    { key: 'sleep', emoji: '😴', label: 'Đã cho đi ngủ', done: doneToday(days, 'sleep') },
  ];
  const streak = computeStreak(days);
  const flowers = flowersThisWeek(days);

  const drinkSlot = (h) => { water.drink(h); onWaterExtra(); };

  return (
    <div className="tab-view care">
      <div className={`weather ${weather ? 'on' : ''}`}>
        {weather
          ? <><span className="w-emoji">{weather.emoji}</span><span className="w-text">{weather.text}</span></>
          : <span className="w-text muted">đang xem thời tiết cho anh…</span>}
      </div>

      {dueWater.length > 0 && (
        <button className="water-nudge" onClick={() => drinkSlot(dueWater[0])}>
          💧 Đến giờ uống nước rồi cục cưng — bấm khi uống xong nha
        </button>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">🔥 {streak}</div>
          <div className="stat-label">ngày liên tiếp đủ chăm</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">🌼 {flowers}</div>
          <div className="stat-label">lần tặng hoa tuần này</div>
        </div>
      </div>

      <div className="care-section">
        <div className="care-title">Nhắc uống nước</div>
        <div className="water-row" aria-label="Nhắc uống nước">
          {WATER_TIMES.map((h) => {
            const drunk = water.done.includes(h);
            const due = hour >= h && !drunk;
            return (
              <button
                key={h}
                className={`drop ${drunk ? 'drunk' : ''} ${due ? 'due' : ''}`}
                onClick={() => drinkSlot(h)}
                title={`${h}:00`}
              >
                <span className="drop-ico">💧</span>
                <span className="drop-time">{h}h</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="care-section">
        <div className="care-title">Hôm nay đã chăm gì</div>
        <ul className="checklist">
          {checklist.map((c) => (
            <li key={c.key} className={`check-item ${c.done ? 'done' : ''}`}>
              <span className="check-box">{c.done ? '✅' : '⬜'}</span>
              <span className="check-emoji">{c.emoji}</span>
              <span className="check-label">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------- Guide tab ----------------------------
const GUIDE_GOALS = [
  { emoji: '💧', text: 'Uống nước ≥ 1 lần/ngày' },
  { emoji: '🍚', text: 'Cho ăn ≥ 1 lần/ngày' },
  { emoji: '🫶', text: 'Vuốt ve mỗi ngày' },
  { emoji: '☕', text: 'Cà phê buổi sáng' },
  { emoji: '💕', text: 'Nói yêu mỗi ngày' },
  { emoji: '🌼', text: 'Tặng hoa ≥ 2 lần/tuần' },
  { emoji: '😴', text: 'Đưa đi ngủ mỗi tối' },
  { emoji: '💵', text: 'Cho Mít tiền khi rảnh' },
];

function GuideTab({ onOpenOnboarding }) {
  return (
    <div className="tab-view guide">
      <div className="care-section">
        <div className="care-title">Cách chăm Mít</div>
        <ul className="goal-list">
          {GUIDE_GOALS.map((g, i) => (
            <li key={i} className="goal-item">
              <span className="goal-emoji">{g.emoji}</span>
              <span className="goal-text">{g.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className="guide-cta" onClick={onOpenOnboarding}>
        Xem lại hướng dẫn cài đặt
      </button>
    </div>
  );
}

// -------------------------- Onboarding popup --------------------------
function Onboarding({ notifPerm, onEnableNotify, onClose }) {
  const [step, setStep] = useState(1);
  const total = 4;
  const standalone = isStandalone();
  const granted = notifPerm === 'granted';
  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="onboard-overlay" role="dialog" aria-modal="true">
      <div className="onboard-card">
        <div className="onboard-dots">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`dot ${i === step ? 'on' : ''}`} />
          ))}
        </div>

        <div className="onboard-body">
          {step === 1 && (
            <>
              <div className="ob-emoji">🐹</div>
              <h2 className="ob-title">Chào mừng đến với Mít!</h2>
              <p className="ob-text">
                Đây là app nhỏ xíu để anh chăm sóc Mít mỗi ngày — cho ăn, uống nước,
                vuốt ve và nhận những lời nhắc dễ thương 🩷
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="ob-emoji">📲</div>
              <h2 className="ob-title">Thêm Mít vào Màn hình chính</h2>
              <p className="ob-text">
                iOS: bấm nút Chia sẻ → “Thêm vào MH chính”.<br />
                Android: bấm ⋮ → “Cài đặt ứng dụng”.
              </p>
              <p className="ob-text">Rồi mở Mít lại từ icon vừa thêm nha.</p>
              {standalone && <div className="ob-done">✓ Đã mở từ Màn hình chính rồi, tuyệt vời!</div>}
            </>
          )}

          {step === 3 && (
            <>
              <div className="ob-emoji">🔔</div>
              <h2 className="ob-title">Bật thông báo</h2>
              <p className="ob-text">
                Cho phép thông báo để Mít nhắc anh uống nước và báo thời tiết mỗi ngày nha.
              </p>
              {granted
                ? <div className="ob-done">✓ Đã bật thông báo rồi 🩷</div>
                : <button className="notify-enable" onClick={onEnableNotify}>Bật thông báo 🔔</button>}
            </>
          )}

          {step === 4 && (
            <>
              <div className="ob-emoji">🩷</div>
              <h2 className="ob-title">Mít chào anh</h2>
              <p className="ob-text">
                Welcome anh đến với app vibe code đầu tiên của em 🥹 Hãy chăm sóc Mít nhé 🩷
              </p>
            </>
          )}
        </div>

        <div className="onboard-actions">
          {step > 1 && step < total && (
            <button className="ob-back" onClick={back}>Quay lại</button>
          )}
          {step < total && (
            <button className="ob-next" onClick={next}>Tiếp tục</button>
          )}
          {step === total && (
            <button className="ob-next" onClick={onClose}>Bắt đầu</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [message, setMessage] = useState(() => rand(HELLO_LINES));
  const [reaction, setReaction] = useState('mit_hello'); // ảnh phản ứng tạm thời (null → theo mood)
  const [wobble, setWobble] = useState(false);
  const weather = useWeather();
  const water = useWater();
  const care = useCareDays();
  const { hearts, burst } = useHearts();
  const wobbleTimer = useRef(null);
  const reactionTimer = useRef(null);
  const [notifPerm, setNotifPerm] = useState(notifPermission);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('mavis_onboarded'); } catch { return false; }
  });

  // Drag & drop
  const stageRef = useRef(null);
  const dragAct = useRef(null);
  const [drag, setDrag] = useState(null); // { key, item, emoji, x, y }
  const [hot, setHot] = useState(false);

  // Chào khi mở app: hiện mit_hello ~2.5s rồi về mood.
  useEffect(() => {
    const t = setTimeout(() => setReaction(null), 2500);
    return () => clearTimeout(t);
  }, []);

  const enableNotify = () => {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
      setNotifPerm(notifPermission());
    });
  };

  const closeOnboarding = () => {
    try { localStorage.setItem('mavis_onboarded', '1'); } catch {}
    setShowOnboarding(false);
  };
  const openOnboarding = () => setShowOnboarding(true);

  const showNotifCta = notifPerm !== 'granted';
  const iosNeedsInstall = showNotifCta && isIOS() && !isStandalone();

  const hour = new Date().getHours();
  const dueWater = useMemo(
    () => WATER_TIMES.filter((h) => hour >= h && !water.done.includes(h)),
    [hour, water.done]
  );

  // Kích hoạt một hoạt động: ghi nhận + hiện ảnh phản ứng ~2.5s + câu nói.
  const triggerActivity = (act) => {
    care.mark(act.key);
    setMessage(rand(act.lines));
    setReaction(act.reaction);
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
    clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setWobble(false), 600);
    clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(null), 2500);
    if (act.key === 'love' || act.key === 'flower') burst(7);
    else burst(3);
  };

  const onPet = () => triggerActivity(ACT_BY_KEY.pet);

  // ---- Drag & drop bằng pointer events (chạy cả chuột lẫn cảm ứng) ----
  const overStage = (x, y) => {
    const el = stageRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const pad = 16;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };

  const onItemDown = (e, act) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragAct.current = act;
    setDrag({ key: act.key, item: act.item, emoji: act.emoji, x: e.clientX, y: e.clientY });
    setHot(overStage(e.clientX, e.clientY));
  };
  const onItemMove = (e) => {
    if (!dragAct.current) return;
    const x = e.clientX;
    const y = e.clientY;
    setDrag((d) => (d ? { ...d, x, y } : d));
    setHot(overStage(x, y));
  };
  const onItemUp = (e) => {
    const act = dragAct.current;
    if (!act) return;
    const over = overStage(e.clientX, e.clientY);
    dragAct.current = null;
    setDrag(null);
    setHot(false);
    if (over) triggerActivity(act);
  };

  const mood = pickMood(care.days, hour);
  const imgName = reaction || mood;
  const imgSrc = mitImg(imgName);
  const ghostImg = drag ? itemImg(drag.item) : null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Mít nè</div>
      </header>

      {tab === 'home' && (
        <HomeTab
          imgSrc={imgSrc}
          imgName={imgName}
          message={message}
          wobble={wobble}
          hearts={hearts}
          hot={hot}
          stageRef={stageRef}
          onPet={onPet}
          onItemDown={onItemDown}
          onItemMove={onItemMove}
          onItemUp={onItemUp}
          showNotifCta={showNotifCta}
          iosNeedsInstall={iosNeedsInstall}
          enableNotify={enableNotify}
        />
      )}

      {tab === 'care' && (
        <CareTab
          weather={weather}
          water={water}
          hour={hour}
          dueWater={dueWater}
          days={care.days}
          onWaterExtra={() => care.mark('water')}
        />
      )}

      {tab === 'guide' && <GuideTab onOpenOnboarding={openOnboarding} />}

      <nav className="tabbar" aria-label="Điều hướng">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="t-emoji">{t.emoji}</span>
            <span className="t-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {ghostImg
            ? <img src={ghostImg} alt="" draggable={false} />
            : <span>{drag.emoji}</span>}
        </div>
      )}

      {showOnboarding && (
        <Onboarding
          notifPerm={notifPerm}
          onEnableNotify={enableNotify}
          onClose={closeOnboarding}
        />
      )}
    </div>
  );
}
