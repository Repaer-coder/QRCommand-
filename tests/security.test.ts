import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/paths';
import { normalizeHttpUrl } from '@/lib/security';

describe('navigation and destination safety', () => {
  it('accepts only local return paths', () => {
    expect(safeReturnPath('/dashboard/qr-codes')).toBe('/dashboard/qr-codes');
    expect(safeReturnPath('//attacker.example')).toBe('/dashboard');
    expect(safeReturnPath('/\\attacker.example')).toBe('/dashboard');
    expect(safeReturnPath('https://attacker.example')).toBe('/dashboard');
  });

  it('accepts HTTP destinations without embedded credentials', () => {
    expect(normalizeHttpUrl('https://example.com/menu')).toBe('https://example.com/menu');
    expect(normalizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeHttpUrl('https://user:pass@example.com')).toBeNull();
  });
});
