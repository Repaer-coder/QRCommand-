import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeReturnPath } from '@/lib/paths';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const safePath = safeReturnPath(url.searchParams.get('next'));
  const supabase = await createClient();

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }

  if (url.searchParams.has('error')) {
    return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }

  return NextResponse.redirect(new URL(safePath, url.origin), 303);
}
