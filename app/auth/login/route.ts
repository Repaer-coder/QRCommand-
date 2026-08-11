import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string } | null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Missing email or password.' },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  const result = await supabase.auth.signInWithPassword({ email, password });

  if (result.error || !result.data.user) {
    return NextResponse.json(
      { error: result.error?.message ?? 'Invalid credentials.' },
      { status: 401 }
    );
  }

  return response;
}
