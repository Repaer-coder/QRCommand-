import { describe, expect, it } from 'vitest';
import { featureNames, hasEntitlement, hasReachedLimit, normalizePlan } from '@/lib/plans';

describe('central plan entitlements', () => {
  it('normalizes inherited plan names', () => {
    expect(normalizePlan('starter')).toBe('essentials');
    expect(normalizePlan('business')).toBe('premium');
    expect(normalizePlan('enterprise')).toBe('pro_plus_ai');
    expect(normalizePlan('unknown')).toBe('free');
  });

  it('keeps entitlements monotonic across paid tiers', () => {
    const tiers = ['essentials', 'premium', 'pro', 'pro_plus_ai'] as const;
    for (const feature of featureNames) {
      let granted = false;
      for (const tier of tiers) {
        const current = hasEntitlement(tier, feature);
        if (granted) expect(current, `${feature} regressed at ${tier}`).toBe(true);
        granted ||= current;
      }
    }
  });

  it('enforces finite and unlimited limits', () => {
    expect(hasReachedLimit(5, 5)).toBe(true);
    expect(hasReachedLimit(4, 5)).toBe(false);
    expect(hasReachedLimit(999999, null)).toBe(false);
  });

  it('requires essentials or higher for core QR feature', () => {
    expect(hasEntitlement('free', 'qr.core')).toBe(false);
    expect(hasEntitlement('essentials', 'qr.core')).toBe(true);
  });
});
