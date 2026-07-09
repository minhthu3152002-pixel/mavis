// Vercel Serverless Function: gửi push qua OneSignal REST API.
// Gọi bằng GET /api/notify?type=<water1|water2|weather>&key=<CRON_SECRET>

const APP_URL = 'https://mavis-steel.vercel.app';
const HCMC_WEATHER =
  'https://api.open-meteo.com/v1/forecast?latitude=10.776&longitude=106.7' +
  '&daily=weather_code,temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=1';

// Soạn nội dung thời tiết cho hôm nay từ dữ liệu Open-Meteo.
function weatherMessage({ code, tmax, pop }) {
  const rainy =
    pop >= 50 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99);
  if (rainy) return 'Hôm nay có thể mưa đó cục cưng, nhớ mang áo mưa nha ☔';
  if (tmax >= 32) return 'Hôm nay nắng nóng á, nhớ uống nước với che nắng nha ☀️';
  if (tmax <= 23) return 'Trời hơi lạnh nè, mặc áo ấm nha cục cưng 🧥';
  return 'Thời tiết hôm nay dễ chịu, ngày đẹp cho cục cưng đó 🌤️';
}

// Gộp mọi khoảng trắng liên tiếp thành 1 space và trim đầu/cuối.
function normalizeSpace(str) {
  return String(str == null ? '' : str).replace(/\s+/g, ' ').trim();
}

async function buildNotification(type) {
  if (type === 'water1') {
    return { heading: 'Stay hydrated 💧', body: 'Uống nước đi cục cưng 🩷' };
  }
  if (type === 'water2') {
    return { heading: 'Stay hydrated 💧', body: 'Anh uống nước chưa nè 🩷' };
  }
  if (type === 'weather') {
    const res = await fetch(HCMC_WEATHER);
    const data = await res.json();
    const daily = data.daily || {};
    const body = weatherMessage({
      code: (daily.weather_code || [])[0],
      tmax: (daily.temperature_2m_max || [])[0],
      pop: (daily.precipitation_probability_max || [])[0] ?? 0,
    });
    return { heading: 'Weather 🌤️', body };
  }
  return null;
}

// Gửi push tới OneSignal. Thử lần lượt các segment và các scheme Authorization
// cho tới khi thành công.
async function sendPush({ appId, apiKey, heading, body }) {
  const segments = [['Total Subscriptions'], ['Subscribed Users']];
  const schemes = ['Key', 'Basic'];
  let lastError = null;

  for (const segment of segments) {
    for (const scheme of schemes) {
      try {
        const resp = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `${scheme} ${apiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            included_segments: segment,
            headings: { en: heading },
            contents: { en: body },
            url: APP_URL,
          }),
        });

        const result = await resp.json().catch(() => ({}));

        // 401/403 → sai scheme Authorization, thử scheme khác.
        if (resp.status === 401 || resp.status === 403) {
          lastError = { status: resp.status, segment, scheme, result };
          continue;
        }

        // Segment không hợp lệ → thử segment fallback (với cùng scheme).
        const invalidSegment =
          Array.isArray(result.errors) &&
          result.errors.some((e) => String(e).toLowerCase().includes('segment'));
        if (resp.ok && !invalidSegment) {
          return { ok: true, status: resp.status, segment, scheme, result };
        }
        lastError = { status: resp.status, segment, scheme, result };
      } catch (err) {
        console.error('OneSignal request failed', { segment, scheme, error: err });
        lastError = { error: String(err && err.message ? err.message : err), segment, scheme };
      }
    }
  }
  return { ok: false, ...lastError };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, key } = req.query || {};

    if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !apiKey) {
      return res.status(500).json({ error: 'Missing OneSignal env vars' });
    }

    const notification = await buildNotification(type);
    if (!notification) {
      return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    // Chuẩn hoá khoảng trắng; không để headings rỗng (iOS sẽ thay bằng tên app).
    const heading = normalizeSpace(notification.heading) || 'Mavis';
    const body = normalizeSpace(notification.body);

    const sent = await sendPush({ appId, apiKey, heading, body });

    if (sent.ok) {
      return res.status(200).json({
        ok: true,
        type,
        id: sent.result && sent.result.id,
        segment: sent.segment,
        result: sent.result,
      });
    }

    console.error('OneSignal push failed', sent);
    return res.status(502).json({ ok: false, type, error: sent });
  } catch (err) {
    console.error('notify handler error', err);
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
