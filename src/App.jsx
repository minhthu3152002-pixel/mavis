import { useEffect, useMemo, useRef, useState } from 'react';

// Bộ hamster cũ — dùng làm fallback khi thiếu ảnh mit_*.
import coffee from './assets/hamsters/coffee.png';
import love from './assets/hamsters/love.png';
import food from './assets/hamsters/food.png';
import money from './assets/hamsters/money.png';
import hello from './assets/hamsters/hello.png';
import flower from './assets/hamsters/flower.png';

// ---- Ảnh Mít: nạp mọi ảnh có sẵn trong assets (mit_* và item_*) ----
const MIT_URLS = {
  ...import.meta.glob('./assets/hamsters/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('./assets/mit/*.png', { eager: true, query: '?url', import: 'default' }),
};
const MIT_IMAGES = {};
for (const [path, url] of Object.entries(MIT_URLS)) {
  const name = path.split('/').pop().replace(/\.png$/, '');
  MIT_IMAGES[name] = url;
}
const FALLBACK_IMG = {
  mit_happy: hello, mit_hello: hello, mit_sleepy: hello, mit_sleeping: hello,
  mit_need_pet: hello, mit_petted: hello, mit_sad: hello,
  mit_thirsty: hello, mit_drinking: hello,
  mit_hungry: food, mit_starving: food, mit_eating: food,
  mit_coffee: coffee, mit_love: love, mit_flower: flower, mit_money: money,
  mit_welcome: hello, mit_install: hello, mit_notify: hello, mit_thanks: hello, mit_guide: hello,
  mit_matcha: coffee, mit_gym: hello, mit_sport: hello, mit_scared: hello, mit_wake: hello,
};
const mitImg = (name) => MIT_IMAGES[name] || FALLBACK_IMG[name] || hello;
const itemImg = (name) => MIT_IMAGES[name] || null;

function reactionVariants(base) {
  const list = Object.keys(MIT_IMAGES).filter(
    (n) => n === base || n.startsWith(base + '_')
  );
  return list.length ? list : [base];
}

// Thay {name} bằng tên bé cưng.
const fill = (s, name) => (s || '').replaceAll('{name}', name);

// ---- Hoạt động: món đồ kéo-thả + ảnh phản ứng + câu "before/after" ----
const ACTIVITIES = [
  {
    key: 'food', label: 'Cho ăn', emoji: '🍚', item: 'item_food', reaction: 'mit_eating',
    before: ['{name} đói bụng quá à 🥺', 'Bụng {name} kêu rồi nè, cho ăn đi anh 🍚'],
    after: ['Ngon quá, cảm ơn cục cưng 😋', '{name} no rồi, thương anh 🩷'],
  },
  {
    key: 'water', label: 'Uống nước', emoji: '💧', item: 'item_water', reaction: 'mit_drinking',
    before: ['{name} khát nước á 💧', 'Cho {name} ngụm nước với anh ơi 🥺'],
    after: ['Mát ghê, {name} khỏe lại rồi 💧', 'Uống nước xong {name} vui liền 😊'],
  },
  {
    key: 'coffee', label: 'Cà phê', emoji: '☕', item: 'item_coffee', reaction: 'mit_coffee',
    before: ['{name} thèm cà phê buổi sáng á ☕'],
    after: ['Tỉnh táo rồi nè, làm việc thôi ☕', 'Cà phê ngon, anh giỏi quá 🥰'],
  },
  {
    key: 'love', label: 'Nói yêu', emoji: '💗', item: 'item_heart', reaction: 'mit_love',
    after: ['Em thương anh nhiều lắm ❤️', '{name} yêu cục cưng nhất trên đời 💕'],
  },
  {
    key: 'flower', label: 'Tặng hoa', emoji: '🌼', item: 'item_flower', reaction: 'mit_flower',
    before: ['Lâu rồi {name} chưa được tặng hoa 🥺🌼'],
    after: ['Hoa đẹp quá, {name} vui xỉu 🌸', 'Anh lãng mạn ghê, {name} thương 💐'],
  },
  {
    key: 'money', label: 'Cho tiền', emoji: '💵', item: 'item_money', reaction: 'mit_money',
    after: [
      'Tiền cho {name} đi shopping nè 💵🛍️',
      'Cầm đi mua đồ cưng đi {name} 🛍️',
      '{name} đi shopping đây, cảm ơn cục cưng 💖',
      'Có tiền là {name} vui liền, đi mua trà sữa nha 🧋',
    ],
  },
  {
    key: 'pet', label: 'Vuốt ve', emoji: '🫶', item: 'item_hand', reaction: 'mit_petted',
    before: ['{name} nhớ bàn tay của anh 🤲'],
    after: ['Được vuốt đầu thích ghê 🥰', '{name} lăn qua lăn lại nè hihi'],
  },
  {
    key: 'sleep', label: 'Đi ngủ', emoji: '😴', item: 'item_sleep', reaction: 'mit_sleeping',
    before: ['{name} buồn ngủ rồi anh ơi 😴', 'Khuya rồi, ru {name} ngủ nha 🌙'],
    after: ['Ngủ ngon nha, mai gặp anh 😴🩷', '{name} ôm gối ngủ đây, mơ thấy anh nè 💤'],
  },
  {
    key: 'matcha', label: 'Matcha', emoji: '🍵', item: 'item_matcha', reaction: 'mit_matcha',
    after: ['Matcha thơm béo, {name} ghiền luôn 🍵', 'Được cho nhiều matcha, {name} sướng rơn 💚', 'Ly matcha mát lành, cảm ơn cục cưng 🍵'],
  },
  {
    key: 'sport', label: 'Thể thao', emoji: '⚽', item: 'item_sport', reaction: 'mit_sport',
    before: ['{name} muốn ra sân quẫy tí 🎾'],
    after: ['Chơi thể thao đã ghê anh ơi 🎾', '{name} vận động khỏe người luôn 🏃'],
  },
  {
    key: 'gym', label: 'Tập gym', emoji: '🏋️', item: 'item_gym', reaction: 'mit_gym',
    before: ['{name} muốn tập gym cho khỏe nè 💪'],
    after: ['Tập xong lên cơ, {name} khỏe re 💪', 'Đổ mồ hôi tí mà vui ghê, cảm ơn anh 🥵🩷'],
  },
  {
    key: 'scare', label: 'Hù ma', emoji: '👻', reaction: 'mit_scared',
    after: ['Á á có ma!! {name} sợ muốn xỉu 😱', 'Hù {name} chi zậy anh, tim đập thình thịch 👻', '{name} sợ ma lắm nha, ôm cái đi 🥺'],
  },
];
const ACT_BY_KEY = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a]));

const HELLO_LINES = ['Hi cục cưng ❤️', 'Anh ơi hôm nay sao rồi 🥰'];

// Câu bong bóng lúc rảnh, theo mood.
function moodLines(moodName) {
  switch (moodName) {
    case 'mit_hungry':
    case 'mit_starving':
    case 'mit_sad': return ACT_BY_KEY.food.before;
    case 'mit_thirsty': return ACT_BY_KEY.water.before;
    case 'mit_need_pet': return ACT_BY_KEY.pet.before;
    case 'mit_sleepy': return ACT_BY_KEY.sleep.before;
    case 'mit_sleeping': return ACT_BY_KEY.sleep.after;
    default: return HELLO_LINES;
  }
}

const WATER_TIMES = [9, 11, 14, 16, 20]; // giờ nhắc uống nước
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayKey = () => new Date().toISOString().slice(0, 10);

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
const HCMC = { lat: 10.776, lon: 106.7 };

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

// -------- Tên bé cưng (localStorage, mặc định "Mít") --------
function usePetName() {
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('mavis_pet_name') || 'Mít'; } catch { return 'Mít'; }
  });
  useEffect(() => {
    try { localStorage.setItem('mavis_pet_name', name); } catch {}
  }, [name]);
  return [name, setName];
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
  if (hour >= 5 && hour < 9 && !ate && !drank) return 'mit_wake';
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

function computeStreak(days) {
  const complete = (dk) =>
    countOn(days, 'food', dk) > 0 && countOn(days, 'water', dk) > 0 && countOn(days, 'pet', dk) > 0;
  let d = new Date();
  if (!complete(localDayKey(d))) d = new Date(d.getTime() - 864e5);
  let s = 0;
  while (complete(localDayKey(d))) {
    s++;
    d = new Date(d.getTime() - 864e5);
  }
  return s;
}

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
  { key: 'home', icon: '🏠' },
  { key: 'care', icon: '💧', label: 'Chăm sóc' },
  { key: 'guide', icon: '📖', label: 'Hướng dẫn' },
];

// Vòng tròn tiến độ kiểu activity ring của iOS.
function Ring({ icon, label, filled }) {
  const R = 19;
  const C = 2 * Math.PI * R;
  return (
    <div className={`ring ${filled ? 'done' : ''}`}>
      <div className="ring-wrap">
        <svg viewBox="0 0 46 46" className="ring-svg">
          <circle cx="23" cy="23" r={R} className="ring-track" />
          <circle
            cx="23" cy="23" r={R} className="ring-prog"
            style={{ strokeDasharray: C, strokeDashoffset: filled ? 0 : C }}
          />
        </svg>
        <span className="ring-ico">{icon}</span>
      </div>
      <span className="ring-label">{label}</span>
    </div>
  );
}

// ---------------------------- Home tab ----------------------------
function HomeTab({
  imgSrc, imgName, bubbleText, wobble, hearts, hot, stageRef, onPet,
  rings, dragHint,
  onItemDown, onItemMove, onItemUp,
  showNotifCta, iosNeedsInstall, enableNotify,
}) {
  return (
    <div className="tab-view home">
      <div className="stage-wrap">
        <div className="bubble" key={bubbleText}>{bubbleText}</div>

        <div ref={stageRef} className={`stage ${hot ? 'hot' : ''}`}>
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

        <div className="rings">
          <Ring icon="🍚" label="Ăn" filled={rings.ate} />
          <Ring icon="💧" label="Nước" filled={rings.drank} />
          <Ring icon="🫶" label="Vuốt ve" filled={rings.petted} />
          <Ring icon={<span className="ring-num">{rings.streak}</span>} label="chuỗi 🔥" filled={rings.streak > 0} />
        </div>

        <div className="drag-hint">{dragHint}</div>

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
function CareTab({ weather, water, hour, dueWater, days, onWaterExtra, petName, onRename }) {
  const [nameDraft, setNameDraft] = useState(petName);
  const checklist = [
    { key: 'food', emoji: '🍚', label: 'Đã cho ăn', done: doneToday(days, 'food') },
    { key: 'water', emoji: '💧', label: 'Đã uống nước', done: doneToday(days, 'water') || water.done.length > 0 },
    { key: 'pet', emoji: '🫶', label: 'Đã vuốt ve', done: doneToday(days, 'pet') },
    { key: 'coffee', emoji: '☕', label: 'Đã cà phê', done: doneToday(days, 'coffee') },
    { key: 'flower', emoji: '🌼', label: 'Đã tặng hoa', done: doneToday(days, 'flower') },
    { key: 'sleep', emoji: '😴', label: 'Đã cho đi ngủ', done: doneToday(days, 'sleep') },
    { key: 'matcha', emoji: '🍵', label: 'Đã uống matcha', done: doneToday(days, 'matcha') },
    { key: 'gym', emoji: '🏋️', label: 'Đã tập gym', done: doneToday(days, 'gym') },
    { key: 'sport', emoji: '⚽', label: 'Đã chơi thể thao', done: doneToday(days, 'sport') },
  ];
  const streak = computeStreak(days);
  const flowers = flowersThisWeek(days);
  const drinkSlot = (h) => { water.drink(h); onWaterExtra(); };

  return (
    <div className="tab-view care">
      <div className="card">
        <div className="care-title">Tên bé cưng</div>
        <div className="name-row">
          <input
            className="name-input"
            value={nameDraft}
            placeholder="Mít"
            maxLength={16}
            onChange={(e) => setNameDraft(e.target.value)}
          />
          <button className="name-save" onClick={() => onRename((nameDraft.trim() || 'Mít'))}>
            Lưu
          </button>
        </div>
      </div>

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

      <div className="card">
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

      <div className="card">
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
  { emoji: '💵', text: 'Cho tiền khi rảnh' },
];

function GuideTab({ onOpenOnboarding, petName }) {
  return (
    <div className="tab-view guide">
      <div className="guide-hero">
        <img className="guide-hero-img" src={mitImg('mit_guide')} alt="" draggable={false} />
        <div className="guide-hero-title">Cách chăm {petName}</div>
      </div>

      <div className="card">
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

// -------------------------- Onboarding (bottom sheet) --------------------------
function Onboarding({ petName, onSetName, notifPerm, onEnableNotify, onClose }) {
  const [step, setStep] = useState(1);
  const [nameDraft, setNameDraft] = useState(petName === 'Mít' ? '' : petName);
  const total = 5;
  const standalone = isStandalone();
  const granted = notifPerm === 'granted';

  const commitName = () => onSetName(nameDraft.trim() || 'Mít');
  const next = () => {
    if (step === 2) commitName();
    setStep((s) => Math.min(total, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));
  const finish = () => { commitName(); onClose(); };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet">
        <div className="grabber" />

        <div className="sheet-body">
          {step === 1 && (
            <>
              <img className="sheet-img" src={mitImg('mit_welcome')} alt="" />
              <h2 className="sheet-title">Chào mừng bạn!</h2>
              <p className="sheet-text">
                Đây là app nhỏ xíu để anh chăm bé cưng mỗi ngày — cho ăn, uống nước,
                vuốt ve và nhận những lời nhắc dễ thương 🩷
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <img className="sheet-img" src={mitImg('mit_hello')} alt="" />
              <h2 className="sheet-title">Đặt tên cho bé cưng</h2>
              <p className="sheet-text">Bỏ trống thì bé tên là Mít nha 🐹</p>
              <input
                className="sheet-input"
                value={nameDraft}
                placeholder="Mít"
                maxLength={16}
                onChange={(e) => setNameDraft(e.target.value)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <img className="sheet-img" src={mitImg('mit_install')} alt="" />
              <h2 className="sheet-title">Thêm vào Màn hình chính</h2>
              <p className="sheet-text">
                iOS: bấm nút Chia sẻ → “Thêm vào MH chính”.<br />
                Android: bấm ⋮ → “Cài đặt ứng dụng”.
              </p>
              {standalone && <div className="ob-done">✓ Đã mở từ Màn hình chính rồi, tuyệt vời!</div>}
            </>
          )}

          {step === 4 && (
            <>
              <img className="sheet-img" src={mitImg('mit_notify')} alt="" />
              <h2 className="sheet-title">Bật thông báo</h2>
              <p className="sheet-text">
                Cho phép thông báo để {nameDraft.trim() || 'Mít'} nhắc anh uống nước và báo thời tiết mỗi ngày nha.
              </p>
              {granted
                ? <div className="ob-done">✓ Đã bật thông báo rồi 🩷</div>
                : <button className="notify-enable" onClick={onEnableNotify}>Bật thông báo 🔔</button>}
            </>
          )}

          {step === 5 && (
            <>
              <img className="sheet-img" src={mitImg('mit_thanks')} alt="" />
              <h2 className="sheet-title">Cảm ơn anh 🩷</h2>
              <p className="sheet-text">
                Welcome anh đến với app vibe code đầu tiên của em 🥹 Hãy chăm sóc {nameDraft.trim() || 'Mít'} nhé 🩷
              </p>
            </>
          )}
        </div>

        <div className="sheet-dots">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`dot ${i === step ? 'on' : ''}`} />
          ))}
        </div>

        <div className="sheet-actions">
          {step > 1 && step < total && (
            <button className="btn-pill btn-ghost" onClick={back}>Quay lại</button>
          )}
          {step < total && (
            <button className="btn-pill btn-primary" onClick={next}>Tiếp tục</button>
          )}
          {step === total && (
            <button className="btn-pill btn-primary" onClick={finish}>Bắt đầu</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [petName, setPetName] = usePetName();
  const [message, setMessage] = useState(() => rand(HELLO_LINES)); // câu after/hello (template)
  const [idleMsg, setIdleMsg] = useState(() => rand(HELLO_LINES)); // câu theo mood lúc rảnh
  const [reaction, setReaction] = useState('mit_hello');
  const [moodImg, setMoodImg] = useState(null);
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
  const [drag, setDrag] = useState(null);
  const [hot, setHot] = useState(false);

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

  const mood = pickMood(care.days, hour);
  // Cập nhật câu lúc rảnh khi mood đổi.
  useEffect(() => {
    setIdleMsg(rand(moodLines(mood)));
    setMoodImg(rand(reactionVariants(mood)));
  }, [mood]);

  const triggerActivity = (act) => {
    care.mark(act.key);
    setMessage(rand(act.after));
    setReaction(rand(reactionVariants(act.reaction)));
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

  const overStage = (x, y) => {
    const el = stageRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const pad = 18;
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

  const imgName = reaction || moodImg || mood;
  const imgSrc = mitImg(imgName);
  const ghostImg = drag ? itemImg(drag.item) : null;
  const bubbleText = fill(reaction ? message : idleMsg, petName);
  const dragHint = fill('Kéo món đồ thả vào {name} nha 👇', petName);

  const ate = doneToday(care.days, 'food');
  const drank = doneToday(care.days, 'water') || water.done.length > 0;
  const petted = doneToday(care.days, 'pet');
  const streak = computeStreak(care.days);

  const headerTitle = tab === 'home' ? `${petName} nè` : tab === 'care' ? 'Chăm sóc' : 'Hướng dẫn';

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar-title">{headerTitle}</div>
        <div className="streak-pill">🔥 {streak}</div>
      </header>

      {tab === 'home' && (
        <HomeTab
          imgSrc={imgSrc}
          imgName={imgName}
          bubbleText={bubbleText}
          wobble={wobble}
          hearts={hearts}
          hot={hot}
          stageRef={stageRef}
          onPet={onPet}
          rings={{ ate, drank, petted, streak }}
          dragHint={dragHint}
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
          petName={petName}
          onRename={setPetName}
        />
      )}

      {tab === 'guide' && <GuideTab onOpenOnboarding={openOnboarding} petName={petName} />}

      <nav className="tabbar" aria-label="Điều hướng">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="t-emoji">{t.icon}</span>
            <span className="t-label">{t.key === 'home' ? petName : t.label}</span>
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
          petName={petName}
          onSetName={setPetName}
          notifPerm={notifPerm}
          onEnableNotify={enableNotify}
          onClose={closeOnboarding}
        />
      )}
    </div>
  );
}
