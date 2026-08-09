import { describe, expect, it } from 'vitest';
import { buildDailySeries } from '@/lib/analytics';

describe('canonical analytics series', () => {
  it('fills missing dates with zero and counts real events', () => {
    const now = new Date('2026-08-07T12:00:00.000Z');
    const result = buildDailySeries([
      '2026-08-05T01:00:00.000Z',
      '2026-08-07T01:00:00.000Z',
      '2026-08-07T02:00:00.000Z',
    ], 3, now);
    expect(result).toEqual([
      { date: '2026-08-05', scans: 1 },
      { date: '2026-08-06', scans: 0 },
      { date: '2026-08-07', scans: 2 },
    ]);
  });
});
