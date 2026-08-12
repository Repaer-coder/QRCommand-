import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { WorkspaceContext, WorkspaceContextError } from '@/lib/workspace';
import { createClient as createServerClient } from '@/lib/supabase/server';

void React;

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  getWorkspaceContext: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { redirect } from 'next/navigation';
import { getWorkspaceContext } from '@/lib/workspace';
import DashboardLayout from '@/app/dashboard/layout';
import OnboardingPage from '@/app/onboarding/page';

const getWorkspaceContextMock = vi.mocked(getWorkspaceContext);
const createClientMock = vi.mocked(createServerClient);

describe('workspace-aware route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createServerClient>>);
  });

  it('routes an authenticated user without auth errors to onboarding, not login', async () => {
    const context = {
      userId: 'user-id',
      email: 'owner@example.com',
      organization: {
        id: 'org-id',
        name: 'Owner Workspace',
        plan: 'free',
        stripe_customer_id: null,
        business_type: null,
        onboarding_completed_at: null,
        role: 'owner' as const,
      },
    } satisfies WorkspaceContext;

    getWorkspaceContextMock.mockResolvedValue(context);
    const result = await OnboardingPage();

    expect(redirect).not.toHaveBeenCalledWith('/login?next=/onboarding');
    expect(result).toBeDefined();
  });

  it('does not treat workspace initialization failures as authentication failures', async () => {
    getWorkspaceContextMock.mockResolvedValue({
      authenticated: true,
      error: 'Unable to initialize workspace.',
      workspaceError: 'Unable to initialize workspace.',
      stage: 'organization_create',
    } satisfies WorkspaceContextError);

    await DashboardLayout({ children: 'content' });
    expect(redirect).toHaveBeenCalledWith('/onboarding');
    expect(redirect).not.toHaveBeenCalledWith('/login?next=/onboarding');
    expect(redirect).not.toHaveBeenCalledWith('/login?next=/dashboard');
  });

  it('still redirects unauthenticated users to /login', async () => {
    getWorkspaceContextMock.mockResolvedValue({
      authenticated: false,
      error: 'You must be signed in.',
      workspaceError: 'You must be signed in.',
      stage: 'auth',
    } satisfies WorkspaceContextError);

    await DashboardLayout({ children: 'content' });
    expect(redirect).toHaveBeenCalledWith('/login?next=/dashboard');
  });
});
