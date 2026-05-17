// Vercel Serverless Function — SMS via Fast2SMS
// File location: api/send-sms.js

const FAST2SMS_API_KEY = 'YQOdkCcTVMXELrvgisKpP8hS3mq7bj2651Wfyn9UDIGeaoFtuxIufzGv6P3p1k4N9Fg8CZwUSH5O2jxE';
const OWNER_PHONE = '9030410080';

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, phone, total, slot, deliveryFrom, planType, mealDetail, payId } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing phone or name' });
    }

    const slotTxt  = slot === 'lunch' ? 'Lunch 11:30AM-12:30PM' : 'Dinner 7:30-9PM';
    const delivery = deliveryFrom || 'tomorrow';

    // Customer SMS
    const custMsg = `Hi ${name}! Payment of Rs.${total} confirmed for MacroMeeeals. Plan: ${planType}. Slot: ${slotTxt}. Starts: ${delivery}. Call 9030410080.`;

    // Owner SMS
    const ownMsg = `NEW ORDER! ${name} | +91${phone} | ${planType} | Rs.${total} | ${slotTxt} | From: ${delivery} | PayID: ${payId}`;

    const [custRes, ownRes] = await Promise.all([
      sendFast2SMS(phone, custMsg),
      sendFast2SMS(OWNER_PHONE, ownMsg)
    ]);

    console.log('Customer SMS:', custRes);
    console.log('Owner SMS:', ownRes);

    return res.status(200).json({ success: true, customer: custRes, owner: ownRes });

  } catch (err) {
    console.error('SMS error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function sendFast2SMS(mobile, message) {
  const url = 'https://www.fast2sms.com/dev/bulkV2'
            + '?authorization=' + FAST2SMS_API_KEY
            + '&route=q'
            + '&message=' + encodeURIComponent(message)
            + '&language=english'
            + '&flash=0'
            + '&numbers=' + mobile;

  const r = await fetch(url);
  return await r.json();
}
