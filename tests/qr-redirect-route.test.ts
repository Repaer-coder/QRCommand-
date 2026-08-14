import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/r/[slug]/route';
import { createPublicClient } from '@/lib/supabase/public';

vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: vi.fn(),
}));

type ScanRpcResponse = {
  data: Array<{ resolved_destination?: string | null }>;
  error: null;
};

const createPublicClientMock = vi.mocked(createPublicClient);

function mockPublicClientWithDestination(resolvedDestination: ScanRpcResponse['data']) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: resolvedDestination,
      error: null,
    } as ScanRpcResponse),
  } as unknown as ReturnType<typeof createPublicClient>;
}

describe('qr redirect route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects an active campaign to the saved destination', async () => {
    createPublicClientMock.mockReturnValue(mockPublicClientWithDestination([{ resolved_destination: 'https://example.com/landing-page' }]));

    const response = await GET(new NextRequest('https://app.example.com/r/welcome-flow'), {
      params: Promise.resolve({ slug: 'welcome-flow' }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/landing-page');
  });

  it('does not redirect to destination for an inactive campaign', async () => {
    createPublicClientMock.mockReturnValue(mockPublicClientWithDestination([]));

    const response = await GET(new NextRequest('https://app.example.com/r/seasonal-campaign'), {
      params: Promise.resolve({ slug: 'seasonal-campaign' }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://app.example.com/?error=not-found');
  });
});
