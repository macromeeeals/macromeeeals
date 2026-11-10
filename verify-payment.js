// POST { razorpay_order_id, razorpay_payment_id, razorpay_signature } + Bearer token
const crypto = require('crypto');
const { requireToken, body, rzp, handler, safeEqual, need } = require('./_pay');

module.exports = handler('POST', async (req, res) => {
  requireToken(req);
  const b = body(req);
  const orderId = String(b.razorpay_order_id || '');
  const paymentId = String(b.razorpay_payment_id || '');
  const expected = crypto.createHmac('sha256', need('RAZORPAY_KEY_SECRET'))
    .update(orderId + '|' + paymentId).digest('hex');

  if (!orderId || !paymentId || !safeEqual(String(b.razorpay_signature || ''), expected)) {
    return res.status(400).json({ verified: false, error: 'Payment signature did not match. Check the Razorpay dashboard before trusting this payment.' });
  }

  const p = await rzp('/payments/' + encodeURIComponent(paymentId));
  res.status(200).json({ verified: true, paymentId, status: p.status, method: p.method, amount: p.amount });
});
