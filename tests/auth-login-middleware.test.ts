import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { CookieOptions, createServerClient } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';
import { POST as loginPost } from '@/app/auth/login/route';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

type ServerClientOptions = NonNullable<Parameters<typeof createServerClient>[2]>;
type MiddlewareCookies = NonNullable<ServerClientOptions['cookies']>;
type CookieDescriptor = {
  name: string;
  value: string;
  options: CookieOptions;
};

type CookieDescriptorEntry = {
  name: string;
  value: string;
};

describe('server login and middleware cookie handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards actual /auth/login Set-Cookie headers into middleware and keeps /dashboard protected route', async () => {
    const createServerClientMock = vi.mocked(createServerClient);
    let issuedCookieValues: CookieDescriptorEntry[] = [];
    let loginCallSeen = false;

    createServerClientMock.mockImplementation((_url, _key, config: { cookies: MiddlewareCookies }) => {
      if (!loginCallSeen) {
        loginCallSeen = true;
        return {
          auth: {
            async signInWithPassword() {
              const cookiesToSet: Array<CookieDescriptor> = [
                {
                  name: 'sb-access-token',
                  value: 'mock-access-token',
                  options: {
                    path: '/',
                    sameSite: 'lax',
                    httpOnly: true,
                  },
                },
                {
                  name: 'sb-refresh-token',
                  value: 'mock-refresh-token',
                  options: {
                    path: '/',
                    sameSite: 'lax',
                    httpOnly: true,
                  },
                },
              ];

              issuedCookieValues = cookiesToSet.map(({ name, value }) => ({ name, value }));
              config.cookies.setAll(cookiesToSet);

              return {
                data: {
                  user: {
                    id: 'auth-user-id',
                    email: 'test@example.com',
                  },
                  session: {
                    access_token: 'mock-access-token',
                    refresh_token: 'mock-refresh-token',
                    expires_in: 3600,
                    expires_at: Math.floor((Date.now() + 3600 * 1000) / 1000),
                    token_type: 'bearer',
                    user: { id: 'auth-user-id', email: 'test@example.com' },
                  },
                },
                error: null,
              };
            },
          },
        } as unknown as ReturnType<typeof createServerClient>;
      }

      return {
            auth: {
              async getUser() {
            const requestCookieNames = new Set(config.cookies.getAll().map((cookie: { name: string; value: string }) => cookie.name));
            const hasIssuedCookie = issuedCookieValues.some((issuedCookie) =>
              requestCookieNames.has(issuedCookie.name)
            );

            return {
              data: {
                user: hasIssuedCookie
                  ? {
                      id: 'auth-user-id',
                      email: 'test@example.com',
                    }
                  : null,
              },
              error: null,
            };
          },
        },
      } as unknown as ReturnType<typeof createServerClient>;
    });

    const response = await loginPost(
      new NextRequest('https://app.example.com/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).not.toBeNull();
    const loginCookies = response.cookies.getAll();
    expect(loginCookies.length).toBeGreaterThan(0);

    const dashboardRequest = new NextRequest('https://app.example.com/dashboard', {
      headers: {
        cookie: loginCookies
          .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
          .join('; '),
      },
    });

    const middlewareResponse = await updateSession(dashboardRequest);

    expect(middlewareResponse.status).toBe(200);
    expect(middlewareResponse.headers.get('location')).toBeNull();
  });
});
