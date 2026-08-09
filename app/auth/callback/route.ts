import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeReturnPath } from '@/lib/paths';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const safePath = safeReturnPath(url.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }
  return NextResponse.redirect(new URL(safePath, url.origin));
}
