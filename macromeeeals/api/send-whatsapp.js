// Vercel Serverless Function — WhatsApp via Meta Cloud API
// File location: api/send-whatsapp.js

const META_ACCESS_TOKEN    = 'EAANGNLzcUSgBRUvd41vDyYfYJX3GE3mpH2QkRjJzdkrO4gUQxmzLJcrhJ7MS9X3kWgH0IMkcnW0VSIyhci7FeWhF6Y2wk74lZBV1OFFtU6JHAgBaJGmAPifnRSgnYZB3XNnQhJxVLE4oZCmif0gO9hyhs4d1hQMMGVYSG7WZBuox5h9mS1R8ZCEOjzsgpMidrf4stFOtsRcSSUyL7HWFqf9lwRZAYZBSYPXeDQXt3AqG6pcwmZAaqlH6xxrmrHsLkdCZBYy9Sr6OkE0iZBm294ZCuBT4n3f';
const META_PHONE_NUMBER_ID = '1098945799970291';
const META_API_URL         = `https://graph.facebook.com/v25.0/${META_PHONE_NUMBER_ID}/messages`;
const OWNER_PHONE          = '919030410080';

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, phone, plan, meal, slot, total, payId, startDate } = req.body;
    if (!phone || !name) return res.status(400).json({ error: 'Missing phone or name' });

    const dest = '91' + phone;

    // MSG 1 — Bill receipt (immediate)
    // Template: mm_bill_receipt
    // Hi {{1}}, your MacroMeeeals payment of {{2}} is confirmed!
    // Plan: {{3}} | Meal: {{4}} | Slot: {{5}} | Payment ID: {{6}}
    // Your order starts on {{7}}. Thank you! 🙏
    const msg1 = sendMeta(dest, 'mm_bill_receipt', [name, total, plan, meal, slot, payId, startDate]);

    // MSG 2 — We received your order (5s delay)
    // Template: mm_order_received
    // Hi {{1}}! 🎉 We've received your order (Ref: {{2}}).
    // Our kitchen team is preparing your fresh meals.
    // Questions? Just reply here. — Team MacroMeeeals 💪
    const msg2 = delay(5000).then(() => sendMeta(dest, 'mm_order_received', [name, payId]));

    // MSG 3 — Order starts tomorrow (10s delay)
    // Template: mm_order_starts
    // Hi {{1}}! 🚀 Your MacroMeeeals journey begins on {{2}}!
    // Slot: {{3}}. We'll be at your door fresh & on time.
    // Fuel your fitness! 🔥 — Team MacroMeeeals
    const msg3 = delay(10000).then(() => sendMeta(dest, 'mm_order_starts', [name, startDate, slot]));

    // OWNER ALERT (2s delay)
    // Template: mm_owner_alert
    // 🔔 NEW ORDER!
    // 👤 {{1}} | 📱 {{2}}
    // 📦 {{3}} — {{4}}
    // 🕐 {{5}} | 💰 {{6}} ✅
    // 🔖 {{7}} | 📅 Starts: {{8}}
    const ownerMsg = delay(2000).then(() =>
      sendMeta(OWNER_PHONE, 'mm_owner_alert', [name, dest, plan, meal, slot, total, payId, startDate])
    );

    const result1 = await msg1;
    msg2.catch(e => console.error('msg2 failed:', e));
    msg3.catch(e => console.error('msg3 failed:', e));
    ownerMsg.catch(e => console.error('owner alert failed:', e));

    return res.status(200).json({ success: true, result: result1 });

  } catch (err) {
    console.error('WhatsApp error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sendMeta(to, templateName, params) {
  const res = await fetch(META_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: params.map(p => ({ type: 'text', text: String(p) }))
        }]
      }
    })
  });
  const data = await res.json();
  console.log(`WA [${templateName}] → ${to}:`, JSON.stringify(data));
  return data;
}
