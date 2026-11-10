// GET ?id=plink_xxx + Bearer token -> { status, amountPaid }
const { requireToken, rzp, handler } = require('./_pay');

module.exports = handler('GET', async (req, res) => {
  requireToken(req);
  const id = String(req.query.id || '');
  if (!/^plink_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Bad link id' });
  const l = await rzp('/payment_links/' + id);
  res.status(200).json({ status: l.status, amountPaid: l.amount_paid });
});
