import Stripe from 'stripe';
import { type PaidPlanName, type PlanName } from '@/lib/plans';

export const prices = {
  essentials: process.env.STRIPE_ESSENTIALS_PRICE_ID ?? process.env.STRIPE_STARTER_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID ?? process.env.STRIPE_BUSINESS_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  pro_plus_ai: process.env.STRIPE_PRO_PLUS_AI_PRICE_ID ?? process.env.STRIPE_ENTERPRISE_PRICE_ID,
} as const;

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function resolvePlanFromPrice(priceId: string | null): PlanName {
  if (priceId && priceId === prices.essentials) return 'essentials';
  if (priceId && priceId === prices.premium) return 'premium';
  if (priceId && priceId === prices.pro) return 'pro';
  if (priceId && priceId === prices.pro_plus_ai) return 'pro_plus_ai';
  return 'free';
}

export function resolvePrice(plan: PaidPlanName): string | null {
  return prices[plan] ?? null;
}

export function getAppUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (req) return new URL(req.url).origin;
  return 'http://localhost:3000';
}
