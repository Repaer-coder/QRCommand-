import Link from 'next/link';
import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  Gauge,
  GitBranch,
  LayoutGrid,
  QrCode,
  Settings,
  Sparkles,
  Users,
  Utensils,
  Webhook,
} from 'lucide-react';
import { hasEntitlement, plans, type FeatureName, type PlanName } from '@/lib/plans';
import type { WorkspaceRole } from '@/lib/workspace';

const items = [
  { key: 'overview', label: 'Overview', href: '/dashboard', icon: Gauge },
  { key: 'library', label: 'QR library', href: '/dashboard/qr-codes', icon: QrCode },
  { key: 'analytics', label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { key: 'blueprints', label: 'Blueprints', href: '/dashboard/blueprints', icon: LayoutGrid, feature: 'blueprints.growth' },
  { key: 'restaurant', label: 'Restaurant hub', href: '/dashboard/restaurant', icon: Utensils, feature: 'restaurant.hub' },
  { key: 'reviews', label: 'Reviews', href: '/dashboard/reviews', icon: Sparkles, feature: 'blueprints.growth' },
  { key: 'social', label: 'Social conversion', href: '/dashboard/social', icon: GitBranch, feature: 'blueprints.growth' },
  { key: 'locations', label: 'Locations', href: '/dashboard/locations', icon: Building2 },
  { key: 'team', label: 'Team', href: '/dashboard/team', icon: Users, feature: 'team.manager' },
  { key: 'automation', label: 'Automation', href: '/dashboard/automation', icon: GitBranch, feature: 'automation.engine' },
  { key: 'integrations', label: 'Integrations', href: '/dashboard/integrations', icon: Webhook, feature: 'integrations.advanced' },
  { key: 'ai', label: 'AI command', href: '/dashboard/ai', icon: Bot, feature: 'ai.assistant' },
  { key: 'billing', label: 'Billing', href: '/dashboard/billing', icon: CreditCard, billingOnly: true },
  { key: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings, adminOnly: true },
] as const;

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
  return (
    <aside className="sidebar">
      <Link className="sidebar-brand" href="/dashboard">
        <span className="brandmark">QC</span>
        <span>
          <b>{workspaceName}</b>
          <small>{plans[plan].label} workspace</small>
        </span>
      </Link>
      <nav className="side-nav" aria-label="Workspace navigation">
        {items.map((item) => {
          if ('feature' in item && item.feature && !hasEntitlement(plan, item.feature as FeatureName)) return null;
          if ('adminOnly' in item && item.adminOnly && !['owner', 'admin'].includes(role)) return null;
          if ('billingOnly' in item && item.billingOnly && !['owner', 'admin'].includes(role)) return null;
          const Icon = item.icon;
          return (
            <Link key={item.key} className={`sideitem ${active === item.key ? 'active' : ''}`} href={item.href}>
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-account">
        <span className="account-avatar">{userLabel.slice(0, 1).toUpperCase()}</span>
        <span className="account-copy">
          <b>{userLabel}</b>
          <small>{role}</small>
        </span>
        <form action="/auth/signout" method="post">
          <button className="textbutton" type="submit">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
