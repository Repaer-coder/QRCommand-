import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/qr/route';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  getWorkspaceContext: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const getWorkspaceContextMock = vi.mocked(getWorkspaceContext);

type CountQueryResult = { count: number; error: null };
type SingleQueryResult = { data: { id: string; slug: string }; error: null };
type QrInsertPayload = {
  organization_id: string;
  location_id: string | null;
  name: string;
  slug: string;
  destination_url: string;
  qr_type: 'restaurant' | 'reviews' | 'social' | 'website' | 'lead' | 'coupon' | 'event' | 'wifi';
  style: { fg: string; bg: string };
  created_by: string;
};

type QrQuery = {
  select: () => QrQuery;
  eq: () => QrQuery;
  neq: () => Promise<CountQueryResult>;
  insert: (payload: QrInsertPayload) => {
    select: () => {
      single: () => Promise<SingleQueryResult>;
    };
  };
};

describe('qr campaign API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts an Instagram destination URL and stores it on /api/qr campaign create', async () => {
    const destinationUrl = 'https://www.instagram.com/NikoliKlump/';

    const query: QrQuery = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      neq: vi.fn(async () => ({ count: 0, error: null })),
      insert: vi.fn((payload: QrInsertPayload) => {
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { id: 'qr-id-1', slug: payload.slug },
              error: null,
            })),
          })),
        };
      }),
    };

    createClientMock.mockResolvedValue({
      from: vi.fn(() => query),
    } as never);

    getWorkspaceContextMock.mockResolvedValue({
      userId: 'user-id',
      email: 'owner@example.com',
      organization: {
        id: 'org-id',
        name: 'Owner Workspace',
        plan: 'essentials',
        stripe_customer_id: null,
        business_type: null,
        onboarding_completed_at: null,
        role: 'owner',
      },
    });

    const response = await POST(
      new NextRequest('https://app.example.com/api/qr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Instagram campaign',
          type: 'social',
          destinationUrl,
          slug: 'instagram-profile',
          style: { fg: '#07111f', bg: '#ffffff' },
          locationId: null,
        }),
      })
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload).toEqual({ id: 'qr-id-1', slug: 'instagram-profile' });
    expect(query.insert).toHaveBeenCalled();
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-id',
        name: 'Instagram campaign',
        slug: 'instagram-profile',
        qr_type: 'social',
        destination_url: destinationUrl,
      })
    );
  });
});
