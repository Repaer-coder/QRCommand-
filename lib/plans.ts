export const planNames = ['free', 'essentials', 'premium', 'pro', 'pro_plus_ai'] as const;
export type PlanName = (typeof planNames)[number];
export type PaidPlanName = Exclude<PlanName, 'free'>;

export const featureNames = [
  'qr.core',
  'analytics.basic',
  'locations.basic',
  'blueprints.growth',
  'analytics.advanced',
  'team.manager',
  'restaurant.hub',
  'automation.engine',
  'workflows.advanced',
  'integrations.advanced',
  'analytics.pro',
  'ai.assistant',
  'ai.insights',
  'ai.builder',
  'ai.actions',
] as const;

export type FeatureName = (typeof featureNames)[number];

export interface PlanDefinition {
  key: PlanName;
  label: string;
  description: string;
  displayPrice: string;
  limits: { qrCodes: number | null; locations: number | null; members: number | null };
}

export const plans: Record<PlanName, PlanDefinition> = {
  free: {
    key: 'free',
    label: 'Free',
    description: 'Evaluate the core QR workflow before subscribing.',
    displayPrice: '$0',
    limits: { qrCodes: 5, locations: 1, members: 1 },
  },
  essentials: {
    key: 'essentials',
    label: 'Essentials',
    description: 'Dynamic campaigns, locations, and basic scan analytics.',
    displayPrice: '$19',
    limits: { qrCodes: 25, locations: 1, members: 1 },
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    description: 'Growth blueprints, advanced analytics, teams, and multi-location operations.',
    displayPrice: '$49',
    limits: { qrCodes: 250, locations: 25, members: 25 },
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    description: 'Safe automation, reusable workflows, integrations, and audit history.',
    displayPrice: '$99',
    limits: { qrCodes: 2000, locations: 250, members: 250 },
  },
  pro_plus_ai: {
    key: 'pro_plus_ai',
    label: 'Pro Plus AI',
    description: 'Evidence-grounded insights, drafts, reporting, and approved AI actions.',
    displayPrice: '$149',
    limits: { qrCodes: null, locations: null, members: null },
  },
};

const rank: Record<PlanName, number> = {
  free: 0,
  essentials: 1,
  premium: 2,
  pro: 3,
  pro_plus_ai: 4,
};

const minimumPlan: Record<FeatureName, PlanName> = {
  'qr.core': 'free',
  'analytics.basic': 'essentials',
  'locations.basic': 'essentials',
  'blueprints.growth': 'premium',
  'analytics.advanced': 'premium',
  'team.manager': 'premium',
  'restaurant.hub': 'premium',
  'automation.engine': 'pro',
  'workflows.advanced': 'pro',
  'integrations.advanced': 'pro',
  'analytics.pro': 'pro',
  'ai.assistant': 'pro_plus_ai',
  'ai.insights': 'pro_plus_ai',
  'ai.builder': 'pro_plus_ai',
  'ai.actions': 'pro_plus_ai',
};

export function normalizePlan(value: string | null | undefined): PlanName {
  if (value === 'starter') return 'essentials';
  if (value === 'business') return 'premium';
  if (value === 'enterprise') return 'pro_plus_ai';
  return planNames.includes(value as PlanName) ? (value as PlanName) : 'free';
}

export function hasEntitlement(plan: PlanName, feature: FeatureName) {
  return rank[plan] >= rank[minimumPlan[feature]];
}

export function hasReachedLimit(current: number, limit: number | null) {
  return limit !== null && current >= limit;
}

export function getPlanLabel(plan: PlanName) {
  return plans[plan].label;
}
