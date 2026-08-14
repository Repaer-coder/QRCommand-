import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEntitlement, isPlatformOwnerEmail } from '@/lib/plans';
import { getWorkspaceContext } from '@/lib/workspace';

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isStripeWebhook = path === '/api/webhooks/stripe';
  if (isStripeWebhook) {
    return NextResponse.next({
      request,
      headers: request.headers,
    });
  }

  const response = NextResponse.next({
    request,
    headers: request.headers,
  });

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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const protectedRoute =
    path.startsWith('/dashboard') || path === '/onboarding';
  if (protectedRoute && (error || !user)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url, { headers: response.headers });
  }

  if (path.startsWith('/dashboard') && path !== '/dashboard/billing') {
    const context = await getWorkspaceContext(supabase);
    if ('error' in context) {
      return NextResponse.redirect(new URL('/onboarding', request.url), { headers: response.headers });
    }
    if (!context.organization.onboarding_completed_at) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      return NextResponse.redirect(onboardingUrl, { headers: response.headers });
    }
    if (!isPlatformOwnerEmail(context.email) && !hasEntitlement(context.organization.plan, 'qr.core')) {
      const billingUrl = request.nextUrl.clone();
      billingUrl.pathname = '/dashboard/billing';
      return NextResponse.redirect(billingUrl, { headers: response.headers });
    }
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
