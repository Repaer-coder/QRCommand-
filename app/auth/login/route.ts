import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const result = await supabase.auth.signInWithPassword({ email, password });

  if (result.error || !result.data.user) {
    return NextResponse.json(
      { error: result.error?.message ?? 'Invalid credentials.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
