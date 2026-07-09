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

// -------- Care log (timestamp lần cuối mỗi hoạt động trong ngày) --------
function useCareLog() {
  const key = `mavis_care_${todayKey()}`;
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(log)); } catch {}
  }, [key, log]);
  const mark = (what) => setLog((l) => ({ ...l, [what]: Date.now() }));
  return { log, mark };
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
  current, message, wobble, hearts, doAction, petHead,
  showNotifCta, iosNeedsInstall, enableNotify,
}) {
  return (
    <div className="tab-view home">
      <div className="stage-wrap">
        <div className="stage">
          <div className="halo" />
          <img
            src={current.img}
            alt="Mít"
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

// ---------------------------- Care tab ----------------------------
function CareTab({ weather, water, hour, dueWater, careLog }) {
  const checklist = [
    { key: 'food', emoji: '🍚', label: 'Đã cho ăn', done: !!careLog.food },
    { key: 'water', emoji: '💧', label: 'Đã uống nước', done: water.done.length > 0 },
    { key: 'pet', emoji: '🫶', label: 'Đã vuốt ve', done: !!careLog.pet },
  ];

  return (
    <div className="tab-view care">
      <div className={`weather ${weather ? 'on' : ''}`}>
        {weather
          ? <><span className="w-emoji">{weather.emoji}</span><span className="w-text">{weather.text}</span></>
          : <span className="w-text muted">đang xem thời tiết cho anh…</span>}
      </div>

      {dueWater.length > 0 && (
        <button className="water-nudge" onClick={() => water.drink(dueWater[0])}>
          💧 Đến giờ uống nước rồi cục cưng — bấm khi uống xong nha
        </button>
      )}

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
                onClick={() => water.drink(h)}
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
  const [current, setCurrent] = useState(ACTIONS[4]); // mặc định: hello
  const [message, setMessage] = useState('hi cục cưng ❤️');
  const [count, setCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mavis_counts')) || {}; } catch { return {}; }
  });
  const [wobble, setWobble] = useState(false);
  const weather = useWeather();
  const water = useWater();
  const care = useCareLog();
  const { hearts, burst } = useHearts();
  const wobbleTimer = useRef(null);
  const [notifPerm, setNotifPerm] = useState(notifPermission);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('mavis_onboarded'); } catch { return false; }
  });

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

  const doAction = (action) => {
    setCurrent(action);
    setMessage(rand(action.lines));
    setCount((c) => ({ ...c, [action.key]: (c[action.key] || 0) + 1 }));
    care.mark(action.key);
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
    clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setWobble(false), 600);
    if (action.key === 'love' || action.key === 'flower') burst(7);
    else burst(3);
  };

  const petHead = () => {
    setMessage('hi cục cưng ❤️');
    care.mark('pet');
    burst(5);
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
    clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setWobble(false), 600);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Mít nè</div>
      </header>

      {tab === 'home' && (
        <HomeTab
          current={current}
          message={message}
          wobble={wobble}
          hearts={hearts}
          doAction={doAction}
          petHead={petHead}
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
          careLog={care.log}
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
