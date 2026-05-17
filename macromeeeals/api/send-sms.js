// Vercel Serverless Function — SMS via MSG91
// File location: api/send-sms.js

const MSG91_AUTH_KEY  = '515365A6y03DG45qUI69ffd6e9P1';
const MSG91_SENDER_ID = 'MACROM';
const MSG91_TEMPLATE  = '69ffd82162190f1f980740f6';

export default async function handler(req, res) {

  /* CORS headers */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  /* Handle preflight */
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, total, slot, deliveryFrom, planType, mealDetail, payId } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Missing phone or name' });
    }

    const slotTxt  = slot === 'lunch' ? 'Lunch 11:30AM-12:30PM' : 'Dinner 7:30-9PM';
    const delivery = deliveryFrom || 'tomorrow';

    // Customer: payment confirmation + plan details
    const custMsg = `Hi ${name}! Payment of Rs.${total} confirmed for MacroMeeeals. Plan: ${planType}. Slot: ${slotTxt}. Starts: ${delivery}. Payment ID: ${payId}. Call 9030410080. -MacroMeeeals`;

    // Owner: full new order alert
    const ownMsg  = `NEW ORDER! ${name} | +91${phone} | ${planType || 'Plan'} | ${mealDetail || '—'} | Rs.${total} | ${slotTxt} | From: ${delivery} | PayID: ${payId} -MacroMeeeals`;

    const [custRes, ownRes] = await Promise.all([
      sendMSG91(phone, custMsg),
      sendMSG91('9030410080', ownMsg)
    ]);

    console.log('Customer SMS:', custRes);
    console.log('Owner SMS:', ownRes);

    return res.status(200).json({ success: true, customer: custRes, owner: ownRes });

  } catch (err) {
    console.error('SMS function error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function sendMSG91(mobile, message) {
  const url = `https://api.msg91.com/api/v2/sendsms`
            + `?authkey=${encodeURIComponent(MSG91_AUTH_KEY)}`
            + `&mobiles=91${mobile}`
            + `&message=${encodeURIComponent(message)}`
            + `&sender=${MSG91_SENDER_ID}`
            + `&route=4`
            + `&DLT_TE_ID=${MSG91_TEMPLATE}`
            + `&country=91`;

  const res = await fetch(url);
  return await res.text();
}
