import { afterEach, describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/lib/encryption';

const originalKey = process.env.INTEGRATION_ENCRYPTION_KEY;
afterEach(() => { process.env.INTEGRATION_ENCRYPTION_KEY = originalKey; });

describe('integration secret encryption', () => {
  it('round trips secrets with authenticated encryption', () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const encrypted = encryptSecret('signing-secret');
    expect(encrypted).not.toContain('signing-secret');
    expect(decryptSecret(encrypted)).toBe('signing-secret');
  });

  it('requires an exact 32-byte key', () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(8).toString('base64');
    expect(() => encryptSecret('value')).toThrow(/32 bytes/);
  });
});
