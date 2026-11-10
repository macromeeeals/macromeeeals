// Shared helpers for the Payments tab. The leading underscore keeps Vercel
// from exposing this file as its own endpoint.
const crypto = require('crypto');

const SESSION_MS = 15 * 60 * 1000;      // unlock lasts 15 minutes
const MAX_INR = Number(process.env.PAYMENT_MAX_INR) || 500000;

function need(name) {
  const v = process.env[name];
  if (!v) { const e = new Error('Server is missing ' + name); e.status = 500; throw e; }
  return v;
}

function hmac(data) {
  return crypto.createHmac('sha256', need('PAYMENT_SESSION_SECRET')).update(data).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function issueToken() {
  const exp = String(Date.now() + SESSION_MS);
  return exp + '.' + hmac(exp);
}

function requireToken(req) {
  const h = req.headers['authorization'] || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !safeEqual(sig, hmac(exp)) || Number(exp) < Date.now()) {
    const e = new Error('Session expired. Unlock again.'); e.status = 401; throw e;
  }
}

function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; }
}

function toPaise(v) {
  const n = Number(v);
  if (!isFinite(n) || n < 1) { const e = new Error('Amount must be ₹1 or more'); e.status = 400; throw e; }
  if (n > MAX_INR) { const e = new Error('Amount is above the ₹' + MAX_INR.toLocaleString('en-IN') + ' limit'); e.status = 400; throw e; }
  return Math.round(n * 100);
}

function clean(v, max) { return String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max); }

function phone(v) {
  const d = String(v || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? '+91' + d : '';
}

async function rzp(path, method, payload) {
  const auth = Buffer.from(need('RAZORPAY_KEY_ID') + ':' + need('RAZORPAY_KEY_SECRET')).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1' + path, {
    method: method || 'GET',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((data.error && data.error.description) || 'Razorpay request failed');
    e.status = r.status >= 500 ? 502 : 400;
    throw e;
  }
  return data;
}

// Wraps a handler: method check, JSON errors, no caching.
function handler(method, fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== method) return res.status(405).json({ error: 'Method not allowed' });
    try { await fn(req, res); }
    catch (e) { res.status(e.status || 500).json({ error: e.message || 'Something went wrong' }); }
  };
}

module.exports = { issueToken, requireToken, body, toPaise, clean, phone, rzp, handler, safeEqual, need, hmac };
