// POST { pin } -> { token, keyId }
const { issueToken, body, safeEqual, need, handler } = require('./_pay');

const fails = new Map(); // best-effort per-instance throttle: ip -> { n, until }

module.exports = handler('POST', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const f = fails.get(ip);
  if (f && f.until > Date.now()) {
    return res.status(429).json({ error: 'Too many wrong attempts. Try again in a few minutes.' });
  }

  const pin = String(body(req).pin || '');
  if (!safeEqual(pin, need('PAYMENT_TAB_PIN'))) {
    const n = ((f && f.n) || 0) + 1;
    fails.set(ip, { n, until: n >= 5 ? Date.now() + 10 * 60 * 1000 : 0 });
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: 'Wrong password' });
  }

  fails.delete(ip);
  res.status(200).json({ token: issueToken(), keyId: need('RAZORPAY_KEY_ID') });
});
