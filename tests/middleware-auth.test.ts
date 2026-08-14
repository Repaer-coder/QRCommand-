import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { CookieOptions, createServerClient } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';
import type { WorkspaceContext } from '@/lib/workspace';
import { getWorkspaceContext } from '@/lib/workspace';

type CookieState = {
  name: string;
  value: string;
};

type MiddlewareClientCookies = {
  getAll: () => CookieState[];
  setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => void;
};

type MiddlewareClientOptions = {
  cookies: MiddlewareClientCookies;
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  getWorkspaceContext: vi.fn(),
}));

describe('auth middleware session protection', () => {
  const paidContext: WorkspaceContext = {
    userId: 'auth-user-id',
    email: 'test@example.com',
    organization: {
      id: 'org-id',
      name: 'Owner Workspace',
      plan: 'essentials',
      stripe_customer_id: null,
      business_type: null,
      onboarding_completed_at: new Date().toISOString(),
      role: 'owner',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWorkspaceContext).mockResolvedValue(paidContext);
  });

  it('allows /dashboard when a refreshed cookie is written into the request before auth check', async () => {
    const createServerClientMock = vi.mocked(createServerClient);

    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return {
            data: {
              user: { id: 'auth-user-id', email: 'test@example.com' },
            },
            error: null,
          };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const request = new NextRequest('https://app.example.com/dashboard', {
      headers: {
        cookie: 'sb-access-token=initial-token',
      },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('keeps a protected /dashboard request authenticated after cookie refresh is reflected back into request state', async () => {
    const createServerClientMock = vi.mocked(createServerClient);

    createServerClientMock.mockImplementation((_url, _key, config: MiddlewareClientOptions) => {
      return {
        auth: {
          async getUser() {
            const hasActiveToken = config.cookies
              .getAll()
              .some((cookie: { name: string; value: string }) => cookie.name === 'sb-refresh-token');

            if (hasActiveToken) {
              const hasSessionCookie = config.cookies
                .getAll()
                .some((cookie: { name: string; value: string }) => cookie.name === 'sb-access-token');
              if (!hasSessionCookie) {
                config.cookies.setAll([
                  {
                    name: 'sb-access-token',
                    value: 'refreshed-token',
                    options: {
                      path: '/',
                      httpOnly: true,
                      sameSite: 'lax',
                    },
                  },
                ]);
              }

              const rehydrated = config.cookies
                .getAll()
                .some((cookie: { name: string; value: string }) => cookie.name === 'sb-access-token');

              return {
                data: {
                  user: rehydrated ? { id: 'auth-user-id', email: 'test@example.com' } : null,
                },
                error: null,
              };
            }

            return { data: { user: null }, error: null };
          },
        },
      } as unknown as ReturnType<typeof createServerClient>;
    });

    const request = new NextRequest('https://app.example.com/dashboard', {
      headers: {
        cookie: 'sb-refresh-token=refresh-token',
      },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects to /login when no auth session is available for protected routes', async () => {
    const createServerClientMock = vi.mocked(createServerClient);

    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return { data: { user: null }, error: null };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const request = new NextRequest('https://app.example.com/dashboard');
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://app.example.com/login?next=%2Fdashboard');
  });

  it('does not redirect /api/webhooks/stripe, even without a Supabase session', async () => {
    const createServerClientMock = vi.mocked(createServerClient);
    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return { data: { user: null }, error: new Error('no session') };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const request = new NextRequest('https://app.example.com/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to /login for onboarding', async () => {
    const createServerClientMock = vi.mocked(createServerClient);
    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return { data: { user: null }, error: null };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const request = new NextRequest('https://app.example.com/onboarding');
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://app.example.com/login?next=%2Fonboarding');
  });

  it('redirects authenticated unpaid users from dashboard routes to billing', async () => {
    vi.mocked(getWorkspaceContext).mockResolvedValue({
      userId: 'auth-user-id',
      email: 'test@example.com',
      organization: {
        id: 'org-id',
        name: 'Owner Workspace',
        plan: 'free',
        stripe_customer_id: null,
        business_type: null,
        onboarding_completed_at: new Date().toISOString(),
        role: 'owner',
      },
    });

    const createServerClientMock = vi.mocked(createServerClient);
    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return {
            data: {
              user: { id: 'auth-user-id', email: 'test@example.com' },
            },
            error: null,
          };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const response = await updateSession(
      new NextRequest('https://app.example.com/dashboard/qr-codes', {
        headers: {
          cookie: 'sb-access-token=initial-token',
        },
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://app.example.com/dashboard/billing');
  });

  it('allows platform owner users through unpaid dashboard paths', async () => {
    const previousOwner = process.env.PLATFORM_OWNER_EMAIL;
    process.env.PLATFORM_OWNER_EMAIL = 'owner-platform@example.com';
    try {
      vi.mocked(getWorkspaceContext).mockResolvedValue({
        userId: 'auth-user-id',
        email: 'owner-platform@example.com',
        organization: {
          id: 'org-id',
          name: 'Owner Workspace',
          plan: 'free',
          stripe_customer_id: null,
          business_type: null,
          onboarding_completed_at: new Date().toISOString(),
          role: 'owner',
        },
      });

      const createServerClientMock = vi.mocked(createServerClient);
      createServerClientMock.mockImplementation(() => ({
        auth: {
          async getUser() {
            return {
              data: {
                user: { id: 'auth-user-id', email: 'owner-platform@example.com' },
              },
              error: null,
            };
          },
        },
      }) as unknown as ReturnType<typeof createServerClient>);

      const response = await updateSession(
        new NextRequest('https://app.example.com/dashboard/analytics', {
          headers: {
            cookie: 'sb-access-token=initial-token',
          },
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
      const billingResponse = await updateSession(
        new NextRequest('https://app.example.com/dashboard/settings', {
          headers: {
            cookie: 'sb-access-token=initial-token',
          },
        })
      );
      expect(billingResponse.status).toBe(200);
      expect(billingResponse.headers.get('location')).toBeNull();
    } finally {
      process.env.PLATFORM_OWNER_EMAIL = previousOwner;
    }
  });

  it('allows authenticated paid users from dashboard routes', async () => {
    vi.mocked(getWorkspaceContext).mockResolvedValue({
      userId: 'auth-user-id',
      email: 'paid-user@example.com',
      organization: {
        id: 'org-id',
        name: 'Owner Workspace',
        plan: 'essentials',
        stripe_customer_id: 'cus_paid',
        business_type: null,
        onboarding_completed_at: new Date().toISOString(),
        role: 'owner',
      },
    });

    const createServerClientMock = vi.mocked(createServerClient);
    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return {
            data: {
              user: { id: 'auth-user-id', email: 'paid-user@example.com' },
            },
            error: null,
          };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const response = await updateSession(
      new NextRequest('https://app.example.com/dashboard/analytics', {
        headers: {
          cookie: 'sb-access-token=initial-token',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not redirect unpaid users from /dashboard/billing', async () => {
    const createServerClientMock = vi.mocked(createServerClient);
    createServerClientMock.mockImplementation(() => ({
      auth: {
        async getUser() {
          return {
            data: {
              user: { id: 'auth-user-id', email: 'test@example.com' },
            },
            error: null,
          };
        },
      },
    }) as unknown as ReturnType<typeof createServerClient>);

    const response = await updateSession(
      new NextRequest('https://app.example.com/dashboard/billing', {
        headers: {
          cookie: 'sb-access-token=initial-token',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
