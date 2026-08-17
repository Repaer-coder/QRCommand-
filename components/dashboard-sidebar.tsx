'use client';

import Link from 'next/link';
import React from 'react';
import LegalLinks from '@/components/legal-links';
import LocaleSelector from '@/components/locale-selector';
import { hasEntitlement, type FeatureName, type PlanName } from '@/lib/plans';
import { useI18n } from '@/components/i18n-provider';
import type { WorkspaceRole } from '@/lib/workspace';

type SidebarItem = {
  key: string;
  label: string;
  href: string;
  feature?: FeatureName;
  adminOnly?: true;
  billingOnly?: true;
};

const baseItems: Omit<SidebarItem, 'label'>[] = [
  { key: 'overview', href: '/dashboard', feature: undefined },
  { key: 'library', href: '/dashboard/qr-codes', feature: undefined },
  { key: 'analytics', href: '/dashboard/analytics', feature: undefined },
  { key: 'blueprints', href: '/dashboard/blueprints', feature: 'blueprints.growth' },
  { key: 'reviews', href: '/dashboard/reviews', feature: 'blueprints.growth' },
  { key: 'locations', href: '/dashboard/locations', feature: undefined },
  { key: 'team', href: '/dashboard/team', feature: 'team.manager' },
  { key: 'automation', href: '/dashboard/automation', feature: 'automation.engine' },
  { key: 'integrations', href: '/dashboard/integrations', feature: 'integrations.advanced' },
  { key: 'ai', href: '/dashboard/ai', feature: 'ai.assistant' },
  { key: 'billing', href: '/dashboard/billing', billingOnly: true },
  { key: 'settings', href: '/dashboard/settings', adminOnly: true },
];

export default function DashboardSidebar({
  active,
  userLabel,
  role,
  workspaceName,
  plan,
}: {
  active: string;
  userLabel: string;
  role: WorkspaceRole;
  workspaceName: string;
  plan: PlanName;
}) {
  const { t } = useI18n();

  const items: SidebarItem[] = baseItems.map((item) => ({
    ...item,
    label: t(`dashboard.sidebar.${item.key}`),
  }));

  const planLabel = t(`plans.${plan}.label`);

  return (
    <aside className="sidebar">
      <Link className="sidebar-brand" href="/dashboard">
        <span className="brandmark">QC</span>
        <span>
          <b>{workspaceName}</b>
          <small>
            {planLabel} {t('dashboard.sidebar.plan')}
          </small>
        </span>
      </Link>
      <nav className="side-nav" aria-label={t('dashboard.sidebar.navigationLabel')}>
        {items.map((item) => {
          if ('feature' in item && item.feature && !hasEntitlement(plan, item.feature)) return null;
          if ('adminOnly' in item && item.adminOnly && !['owner', 'admin'].includes(role)) return null;
          if ('billingOnly' in item && item.billingOnly && !['owner', 'admin'].includes(role)) return null;
          return (
            <Link
              key={item.key}
              className={`sideitem ${active === item.key ? 'active' : ''}`}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-account">
        <span className="account-avatar">{userLabel.slice(0, 1).toUpperCase()}</span>
        <span className="account-copy">
          <b>{userLabel}</b>
          <small>
            {t('dashboard.sidebar.role')}: {t(`dashboard.sidebar.roleName.${role}`) || role}
          </small>
        </span>
        <LocaleSelector compact />
        <LegalLinks compact />
        <form action="/auth/signout" method="post">
          <button className="textbutton" type="submit">
            {t('dashboard.sidebar.signOut')}
          </button>
        </form>
      </div>
    </aside>
  );
}
