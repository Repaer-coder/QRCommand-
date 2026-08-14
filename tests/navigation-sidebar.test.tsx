import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import DashboardSidebar from '@/components/dashboard-sidebar';

describe('dashboard sidebar navigation', () => {
  it('removes legacy restaurant and social modules', () => {
    const html = renderToString(
      React.createElement(DashboardSidebar, {
        active: 'overview',
        userLabel: 'owner@example.com',
        role: 'owner',
        workspaceName: 'Owner Workspace',
        plan: 'premium',
      })
    );

    expect(html).not.toContain('Restaurant hub');
    expect(html).not.toContain('Social conversion');
    expect(html).not.toContain('/dashboard/restaurant');
    expect(html).not.toContain('/dashboard/social');
    expect(html).toContain('Reviews');
    expect(html).toContain('/dashboard/reviews');
    expect(html).toContain('Blueprints');
    expect(html).toContain('/dashboard/blueprints');
  });
});
