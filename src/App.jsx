import { useEffect, useMemo, useRef, useState } from 'react';

import coffee from './assets/hamsters/coffee.png';
import love from './assets/hamsters/love.png';
import food from './assets/hamsters/food.png';
import money from './assets/hamsters/money.png';
import hello from './assets/hamsters/hello.png';
import flower from './assets/hamsters/flower.png';

// ---- Cấu hình hoạt động: mỗi nút đổi ảnh + thả một câu ngẫu nhiên ----
const ACTIONS = [
  {
    key: 'coffee', label: 'Cho uống cà phê', emoji: '☕', img: coffee,
    lines: [
      'Cà phê nè anh ơi, tỉnh táo làm việc nha ☕',
      'Uống cà phê rồi ôm em một cái nha 🥰',
      'Làm ít thôi cục cưng, mệt thì nghỉ 5 phút ☕',
    ],
  },
  {
    key: 'love', label: 'Nói yêu', emoji: '💕', img: love,
    lines: [
      'Em thương anh nhiều lắm đó ❤️',
      'Anh là cục cưng số một của em 🥺',
      'I love you cục cưng 💕',
      'Có anh là ngày của em vui rồi 🫶',
    ],
  },
  {
    key: 'food', label: 'Cho ăn', emoji: '🍟', img: food,
    lines: [
      'Ăn cơm chưa cục cưng? Không được bỏ bữa nha 🍚',
      'Snack cho anh nè, đói là quạu đó nha 🍟',
      'Ăn cho khỏe rồi thương em nhiều nhiều 😋',
    ],
  },
  {
    key: 'money', label: 'Cho tiền', emoji: '💵', img: money,
    lines: [
      'Tiền tiêu vặt cho cục cưng nè 💵',
      'Cầm lấy mua trà sữa uống nha 🧋',
      'Của anh hết á, đừng tiết kiệm quá 🥰',
    ],
  },
  {
    key: 'hello', label: 'Hello', emoji: '👋', img: hello,
    lines: [
      'Hi cục cưng ❤️',
      'Anh ơi em nhớ anh nè 👋',
      'Hôm nay của anh sao rồi? 🥰',
    ],
  },
  {
    key: 'flower', label: 'Tặng hoa', emoji: '🌼', img: flower,
    lines: [
      'Tặng anh nè, thương anh nhiều 🌼',
      'Hoa cho người thương của em 💐',
      'Đẹp trai của em nhận hoa nha 🌸',
    ],
  },
];

const WATER_TIMES = [9, 11, 14, 16, 20]; // giờ nhắc uống nước
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayKey = () => new Date().toISOString().slice(0, 10);

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

export default function App() {
  const [current, setCurrent] = useState(ACTIONS[4]); // mặc định: hello
  const [message, setMessage] = useState('hi cục cưng ❤️');
  const [count, setCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavis_counts')) || {}; } catch { return {}; }
  });
  const [wobble, setWobble] = useState(false);
  const weather = useWeather();
  const water = useWater();
  const { hearts, burst } = useHearts();
  const wobbleTimer = useRef(null);
  const [notifPerm, setNotifPerm] = useState(notifPermission);

  useEffect(() => {
    try { localStorage.setItem('mavis_counts', JSON.stringify(count)); } catch {}
  }, [count]);

  const enableNotify = () => {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.Notifications.requestPermission();
      setNotifPerm(notifPermission());
    });
  };

  const showNotifCta = notifPerm !== 'granted';
  const iosNeedsInstall = showNotifCta && isIOS() && !isStandalone();

  const hour = new Date().getHours();
  const dueWater = useMemo(
    () => WATER_TIMES.filter((h) => hour >= h && !water.done.includes(h)),
    [hour, water.done]
  );

  const doAction = (action) => {
    setCurrent(action);
    setMessage(rand(action.lines));
    setCount((c) => ({ ...c, [action.key]: (c[action.key] || 0) + 1 }));
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
    clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setWobble(false), 600);
    if (action.key === 'love' || action.key === 'flower') burst(7);
    else burst(3);
  };

  const petHead = () => {
    setMessage('hi cục cưng ❤️');
    burst(5);
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
    clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setWobble(false), 600);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Mavis nè</div>
        <div className={`weather ${weather ? 'on' : ''}`}>
          {weather
            ? <><span className="w-emoji">{weather.emoji}</span><span className="w-text">{weather.text}</span></>
            : <span className="w-text muted">đang xem thời tiết cho anh…</span>}
        </div>
      </header>

      <main className="stage-wrap">
        {dueWater.length > 0 && (
          <button className="water-nudge" onClick={() => water.drink(dueWater[0])}>
            💧 Đến giờ uống nước rồi cục cưng — bấm khi uống xong nha
          </button>
        )}

        <div className="stage">
          <div className="halo" />
          <img
            src={current.img}
            alt="Mavis"
            className={`hamster ${wobble ? 'wobble' : ''}`}
            onClick={petHead}
            draggable={false}
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

        <div className="water-row" aria-label="Nhắc uống nước">
          {WATER_TIMES.map((h) => {
            const drunk = water.done.includes(h);
            const due = hour >= h && !drunk;
            return (
              <button
                key={h}
                className={`drop ${drunk ? 'drunk' : ''} ${due ? 'due' : ''}`}
                onClick={() => water.drink(h)}
                title={`${h}:00`}
              >
                <span className="drop-ico">💧</span>
                <span className="drop-time">{h}h</span>
              </button>
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
      </main>

      <nav className="actions">
        {ACTIONS.map((a) => (
          <button key={a.key} className="action" onClick={() => doAction(a)}>
            <span className="a-emoji">{a.emoji}</span>
            <span className="a-label">{a.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
