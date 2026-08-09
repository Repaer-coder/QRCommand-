import { NextResponse } from 'next/server';
export function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return NextResponse.json(
    { status: configured ? 'ok' : 'configuration_required', timestamp: new Date().toISOString() },
    { status: configured ? 200 : 503, headers: { 'cache-control': 'no-store' } }
  );
}
