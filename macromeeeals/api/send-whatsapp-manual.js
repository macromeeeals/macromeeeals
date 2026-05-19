// Vercel Serverless Function — Manual WhatsApp triggers from dashboard
// File location: api/send-whatsapp-manual.js

const META_ACCESS_TOKEN    = 'EAANGNLzcUSgBRUvd41vDyYfYJX3GE3mpH2QkRjJzdkrO4gUQxmzLJcrhJ7MS9X3kWgH0IMkcnW0VSIyhci7FeWhF6Y2wk74lZBV1OFFtU6JHAgBaJGmAPifnRSgnYZB3XNnQhJxVLE4oZCmif0gO9hyhs4d1hQMMGVYSG7WZBuox5h9mS1R8ZCEOjzsgpMidrf4stFOtsRcSSUyL7HWFqf9lwRZAYZBSYPXeDQXt3AqG6pcwmZAaqlH6xxrmrHsLkdCZBYy9Sr6OkE0iZBm294ZCuBT4n3f';
const META_PHONE_NUMBER_ID = '1098945799970291';
const META_API_URL         = `https://graph.facebook.com/v25.0/${META_PHONE_NUMBER_ID}/messages`;

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, phone, template } = req.body;

    if (!phone || !name || !template) {
      return res.status(400).json({ error: 'Missing name, phone or template' });
    }

    const dest = phone.startsWith('91') ? phone : '91' + phone;

    /*
     * Supported templates:
     *
     * mm_out_for_delivery  → params: [name]
     *   "Hi {{1}}! 🛵 Your MacroMeeeals order is out for delivery right now!..."
     *
     * mm_order_delivered   → params: [name]
     *   "Hi {{1}}! 🎉 Your MacroMeeeals meal has been delivered successfully!..."
     *
     * mm_daily_lunch       → params: [name]
     *   "Good morning {{1}}! ☀️ Your MacroMeeeals lunch is on its way today!..."
     *
     * mm_daily_dinner      → params: [name]
     *   "Good evening {{1}}! 🌆 Your MacroMeeeals dinner is on its way today!..."
     */
    const ALLOWED = ['mm_out_for_delivery', 'mm_order_delivered', 'mm_daily_lunch', 'mm_daily_dinner'];
    if (!ALLOWED.includes(template)) {
      return res.status(400).json({ error: 'Template not allowed: ' + template });
    }

    const result = await sendMeta(dest, template, [name]);
    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error('Manual WA error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function sendMeta(to, templateName, params) {
  const response = await fetch(META_API_URL, {
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
  const data = await response.json();
  console.log(`WA [${templateName}] → ${to}:`, JSON.stringify(data));
  return data;
}
