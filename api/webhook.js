import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const carId = session.metadata.carId;

    console.log('Payment successful for car:', carId);

    try {
      // Update car status
      const { error: carError } = await supabase
        .from('cars')
        .update({ 
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (carError) {
        console.error('Error updating car:', carError);
      }

      // Create reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          car_id: carId,
          session_id: session.id,
          customer_email: session.customer_details?.email || session.customer_email,
          customer_name: session.metadata?.customerName,
          customer_phone: session.metadata?.customerPhone,
          amount_total: session.amount_total,
          currency: session.currency,
          status: 'paid'
        });

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }

  res.status(200).json({ received: true });
}