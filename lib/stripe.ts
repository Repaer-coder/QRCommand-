import Stripe from 'stripe';
export const stripe=process.env.STRIPE_SECRET_KEY?new Stripe(process.env.STRIPE_SECRET_KEY):null;
export const prices={starter:process.env.STRIPE_STARTER_PRICE_ID,business:process.env.STRIPE_BUSINESS_PRICE_ID,enterprise:process.env.STRIPE_ENTERPRISE_PRICE_ID} as const;
