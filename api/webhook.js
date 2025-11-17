import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const carId = session.metadata.carId;

    console.log('Payment completed for car:', carId);

    try {
      // Update car status
      await supabase
        .from('cars')
        .update({ status: 'reserved' })
        .eq('id', carId);

      // Create reservation
      await supabase.from('reservations').insert({
        car_id: parseInt(carId),
        session_id: session.id,
        customer_email: session.customer_details?.email || session.customer_email,
        customer_name: session.metadata?.customerName,
        customer_phone: session.metadata?.customerPhone,
        amount_total: session.amount_total,
        currency: session.currency,
        status: 'paid'
      });

      console.log('Database updated successfully');
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
  }

  res.status(200).json({ received: true });
}

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}