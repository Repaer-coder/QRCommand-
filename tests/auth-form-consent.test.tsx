import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import AuthForm from '@/components/auth-form';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('auth-form signup consent requirement', () => {
  function asReadonlySearchParams(value: string): ReadonlyURLSearchParams {
    return new URLSearchParams(value) as unknown as ReadonlyURLSearchParams;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires policy consent on signup', () => {
    vi.mocked(useSearchParams).mockReturnValue(asReadonlySearchParams('mode=signup'));
    const html = renderToString(React.createElement(AuthForm));

    expect(html).toContain('name="policy-consent"');
    expect(html).toContain('I agree to the');
    expect(html).toContain('and acknowledge');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/acceptable-use"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/refund-policy"');
    expect(html).toContain('target="_blank"');
  });

  it('does not render policy consent checkbox for sign in', () => {
    vi.mocked(useSearchParams).mockReturnValue(asReadonlySearchParams('mode=signin'));
    const html = renderToString(React.createElement(AuthForm));

    expect(html).not.toContain('name="policy-consent"');
  });
});
