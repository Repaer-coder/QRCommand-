import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import { updateSession } from '@/lib/supabase/middleware';
import { POST as loginPost } from '@/app/auth/login/route';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

type CookieState = {
  name: string;
  value: string;
};

type ServerClientOptions = NonNullable<Parameters<typeof createServerClient>[2]>;
type MiddlewareCookies = NonNullable<ServerClientOptions['cookies']>;
type CookieSetArgs = Parameters<MiddlewareCookies['setAll']>[0];
type LoginClient = Awaited<ReturnType<typeof createClient>>;

describe('server login and middleware cookie handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts middleware with auth cookies issued by /auth/login', async () => {
    const createServerClientMock = vi.mocked(createServerClient);
    const createClientMock = vi.mocked(createClient);
    const issuedCookies: CookieState[] = [];
    const cookiesToSet: CookieSetArgs = [
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

    createClientMock.mockResolvedValue({
      auth: {
        async signInWithPassword() {
          issuedCookies.push(
            ...cookiesToSet.map(({ name, value }: CookieSetArgs[number]) => ({
              name,
              value,
            }))
          );

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
    } as unknown as LoginClient);

    createServerClientMock.mockImplementationOnce((_url, _key, config: { cookies: MiddlewareCookies }) => ({
      auth: {
        async getUser() {
          const hasAccessToken = config.cookies
            .getAll()
            .some((cookie: CookieState) => cookie.name === 'sb-access-token');

          return {
            data: {
              user: hasAccessToken
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
    }) as unknown as ReturnType<typeof createServerClient>);

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

    const dashboardRequest = new NextRequest('https://app.example.com/dashboard', {
      headers: {
        cookie: issuedCookies
          .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
          .join('; '),
      },
    });

    const middlewareResponse = await updateSession(dashboardRequest);

    expect(middlewareResponse.status).toBe(200);
    expect(middlewareResponse.headers.get('location')).toBeNull();
  });
});
