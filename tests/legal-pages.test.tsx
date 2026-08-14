import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import TermsPage from '@/app/terms/page';
import PrivacyPage from '@/app/privacy/page';
import RefundPolicyPage from '@/app/refund-policy/page';
import AcceptableUsePage from '@/app/acceptable-use/page';
import SupportPage from '@/app/support/page';
import BillingPage from '@/app/dashboard/billing/page';
import Home from '@/app/page';
import Pricing from '@/app/pricing/page';
import LoginPage from '@/app/login/page';
import { legalPolicyLinks, legalContact } from '@/lib/legal';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  canManageBilling: (role: string) => role === 'owner' || role === 'admin',
  getWorkspaceContext: vi.fn(),
}));

describe('legal pages and links', () => {
  function asReadonlySearchParams(value: string): ReadonlyURLSearchParams {
    return new URLSearchParams(value) as unknown as ReadonlyURLSearchParams;
  }

  const legalPages = [
    { page: TermsPage, heading: 'Terms of Service', hasSupportEmail: true },
    { page: PrivacyPage, heading: 'Privacy Policy', hasSupportEmail: true },
    { page: RefundPolicyPage, heading: 'Subscription Cancellation and Refund Policy', hasSupportEmail: true },
    { page: AcceptableUsePage, heading: 'Acceptable Use Policy', hasSupportEmail: false },
    { page: SupportPage, heading: 'Support and Contact', hasSupportEmail: true },
  ];

  it('renders legal routes with required headings and operator details', () => {
    legalPages.forEach(({ page, heading, hasSupportEmail }) => {
      const html = renderToString(React.createElement(page));
      expect(html).toContain(`<h1>${heading}</h1>`);
      expect(html).toContain(legalContact.effectiveDate);
      if (hasSupportEmail) {
        expect(html).toContain(legalContact.supportEmail);
      }
    });

    const supportHtml = renderToString(React.createElement(SupportPage));
    expect(supportHtml).toContain(legalContact.operator);
  });

  it('does not render secrets in legal pages', () => {
    const secretPatterns = [/sk_[A-Za-z0-9]{10,}/, /pk_[A-Za-z0-9]{10,}/, /SUPABASE_SERVICE_ROLE_KEY/, /STRIPE_SECRET/, /api\s+secret/i];

    legalPages.forEach(({ page }) => {
      const html = renderToString(React.createElement(page));
      secretPatterns.forEach((pattern) => expect(html).not.toMatch(pattern));
    });
  });

  it('renders legal links in the public homepage footer', async () => {
    const home = await Home({ searchParams: Promise.resolve({}) });
    const html = renderToString(home);

    legalPolicyLinks.forEach((link) => {
      expect(html).toContain(`href="${link.href}"`);
      const expectedLabel =
        link.label === 'Refunds & Cancellation' ? 'Refunds &amp; Cancellation' : link.label;
      expect(html).toContain(expectedLabel);
    });
  });

  it('shows cancellation and refund language on pricing and billing', async () => {
    const pricingHtml = renderToString(React.createElement(Pricing));
    expect(pricingHtml).toContain('Subscriptions renew monthly until canceled');
    expect(pricingHtml).toContain('/refund-policy');
    expect(pricingHtml).toContain('non-refundable');

    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      })),
      auth: {},
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>;

    vi.mocked(createClient).mockResolvedValue(mockClient);

    vi.mocked(getWorkspaceContext).mockResolvedValue({
      userId: 'user-id',
      email: 'owner@example.com',
      organization: {
        id: 'org-id',
        name: 'Owner Workspace',
        plan: 'essentials',
        stripe_customer_id: null,
        business_type: null,
        onboarding_completed_at: new Date().toISOString(),
        role: 'owner',
      },
    });

    const billing = await BillingPage({ searchParams: Promise.resolve({}) });
    const billingHtml = renderToString(billing);
    expect(billingHtml).toContain('Subscriptions renew monthly until canceled');
    expect(billingHtml).toContain('/refund-policy');
    expect(billingHtml).toContain('non-refundable');
  });

  it('adds legal links to login page via auth form', () => {
    vi.mocked(useSearchParams).mockReturnValue(asReadonlySearchParams('mode=signup'));
    const loginHtml = renderToString(React.createElement(LoginPage));

    legalPolicyLinks.forEach((link) => {
      expect(loginHtml).toContain(`href="${link.href}"`);
    });

    expect(loginHtml).toContain('name="policy-consent"');
  });
});
