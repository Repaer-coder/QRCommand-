import { createHash } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { getRequestIp, normalizeHttpUrl } from '@/lib/security';

function parseDevice(userAgent: string | null) {
  if (!userAgent) return 'unknown';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function parseBrowser(userAgent: string | null) {
  if (!userAgent) return 'unknown';
  if (/edg/i.test(userAgent)) return 'edge';
  if (/chrome/i.test(userAgent)) return 'chrome';
  if (/safari/i.test(userAgent)) return 'safari';
  if (/firefox/i.test(userAgent)) return 'firefox';
  return 'other';
}

function parseOs(userAgent: string | null) {
  if (!userAgent) return 'unknown';
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad/i.test(userAgent)) return 'ios';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macos';
  if (/windows/i.test(userAgent)) return 'windows';
  if (/linux/i.test(userAgent)) return 'linux';
  return 'other';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) return NextResponse.redirect(new URL('/?error=not-found', request.url));
  const supabase = createPublicClient();
  if (!supabase) return NextResponse.redirect(new URL('/?error=service-unavailable', request.url));

  const userAgent = request.headers.get('user-agent');
  const requestIp = getRequestIp(request.headers);
  const salt = process.env.QR_COMMAND_IP_SALT;
  const ipHash = requestIp && salt ? createHash('sha256').update(`${salt}:${requestIp}`).digest('hex') : null;
  const { data, error } = await supabase.rpc('record_qr_scan', {
    scan_slug: slug,
    scan_country: request.headers.get('x-vercel-ip-country'),
    scan_region: request.headers.get('x-vercel-ip-country-region'),
    scan_city: request.headers.get('x-vercel-ip-city'),
    scan_device: parseDevice(userAgent),
    scan_browser: parseBrowser(userAgent),
    scan_os: parseOs(userAgent),
    scan_referrer: request.headers.get('referer'),
    scan_ip_hash: ipHash,
  });

  const result = data?.[0] as { resolved_destination?: string } | undefined;
  const destination = result?.resolved_destination ? normalizeHttpUrl(result.resolved_destination) : null;
  if (error || !destination) return NextResponse.redirect(new URL('/?error=not-found', request.url));
  return NextResponse.redirect(destination, 302);
}
