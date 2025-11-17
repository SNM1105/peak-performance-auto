import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { carId, customerInfo } = req.body;

  console.log('Received checkout request:', { carId, customerInfo });

  try {
    const { data: car, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();

    if (error || !car) {
      console.error('Car not found:', error);
      return res.status(404).json({ error: 'Car not found' });
    }

    if (car.status !== 'available') {
      return res.status(400).json({ error: 'Car not available' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: { name: `Deposit for ${car.name}` },
          unit_amount: car.deposit_amount * 100,
        },
        quantity: 1
      }],
      metadata: { 
        carId: String(carId),
        customerName: customerInfo?.name || '',
        customerPhone: customerInfo?.phone || ''
      },
      customer_email: customerInfo?.email || '',
      success_url: `${process.env.APP_URL}/success.html?carId=${carId}`,
      cancel_url: `${process.env.APP_URL}/cancel.html?carId=${carId}`,
    });

    console.log('Checkout session created:', session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}