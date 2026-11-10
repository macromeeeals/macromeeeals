// POST { amount, name, phone, note } + Bearer token -> Razorpay order for Checkout
const { requireToken, body, toPaise, clean, rzp, handler, need } = require('./_pay');

module.exports = handler('POST', async (req, res) => {
  requireToken(req);
  const b = body(req);
  const order = await rzp('/orders', 'POST', {
    amount: toPaise(b.amount),
    currency: 'INR',
    receipt: 'mm_' + Date.now(),
    notes: { source: 'payments-tab', customer: clean(b.name, 100), note: clean(b.note, 200) }
  });
  res.status(200).json({ orderId: order.id, amount: order.amount, keyId: need('RAZORPAY_KEY_ID') });
});
