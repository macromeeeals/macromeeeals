// POST { amount, name, phone, note } + Bearer token -> Razorpay Payment Link (UPI + cards)
const { requireToken, body, toPaise, clean, phone, rzp, handler } = require('./_pay');

module.exports = handler('POST', async (req, res) => {
  requireToken(req);
  const b = body(req);
  const customer = {};
  if (clean(b.name, 100)) customer.name = clean(b.name, 100);
  if (phone(b.phone)) customer.contact = phone(b.phone);

  const link = await rzp('/payment_links', 'POST', {
    amount: toPaise(b.amount),
    currency: 'INR',
    accept_partial: false,
    reference_id: 'mm_' + Date.now(),
    description: clean(b.note, 200) || 'MacroMeeeals payment',
    customer,
    notify: { sms: false, email: false },
    reminder_enable: false,
    expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    notes: { source: 'payments-tab' }
  });
  res.status(200).json({ id: link.id, url: link.short_url, amount: link.amount, status: link.status });
});
