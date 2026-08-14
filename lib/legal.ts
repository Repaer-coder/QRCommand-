export const legalContact = {
  operator: 'Nikoli Pillot-klumpp',
  supportEmail: 'stogepit115@gmail.com',
  governingState: 'Florida',
  governingCountry: 'United States of America',
  effectiveDate: 'August 14, 2026',
} as const;

export const legalPolicyLinks = [
  { href: '/terms', label: 'Terms of Service', pageTitle: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy', pageTitle: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refunds & Cancellation', pageTitle: 'Subscription Cancellation and Refund Policy' },
  { href: '/acceptable-use', label: 'Acceptable Use', pageTitle: 'Acceptable Use Policy' },
  { href: '/support', label: 'Support', pageTitle: 'Support and Contact' },
] as const;

export type LegalPolicyLink = (typeof legalPolicyLinks)[number];

export const legalNotice = 'The English version of these policies is the controlling legal version. Any translation is provided for convenience.';
