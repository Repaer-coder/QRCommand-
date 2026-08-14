export interface GrowthBlueprintTemplate {
  key: string;
  name: string;
  industry: string;
  audience: string;
  outcome: string;
  description: string;
  items: string[];
  recommendedModules: string[];
  suggestedQrCampaignTypes: string[];
  lifecycleStages: string[];
}

export const blueprintTemplates: GrowthBlueprintTemplate[] = [
  {
    key: 'restaurant-revenue-loop',
    name: 'Restaurant Revenue Loop',
    industry: 'Restaurants',
    audience: 'Restaurant operators',
    outcome: 'Menu to order to review to loyalty',
    description: 'Turn first-time diners into returning customers with one QR campaign family.',
    items: ['Table-specific menus', 'Featured-item campaign', 'Review follow-up', 'Return-visit reward'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['website', 'lead', 'coupon'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'local-reputation-engine',
    name: 'Local Reputation Engine',
    industry: 'Local business',
    audience: 'Local storefronts',
    outcome: 'Visit to review to referral',
    description: 'Generate review velocity and social proof with repeatable destination paths.',
    items: ['Review smart link', 'Private feedback path', 'Referral prompt', 'Location comparison'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['social', 'website'],
    lifecycleStages: ['acquire', 'engage', 'advocate'],
  },
  {
    key: 'social-conversion-hub',
    name: 'Social Conversion Hub',
    industry: 'Creators & brands',
    audience: 'Audience growth teams',
    outcome: 'Scan to follow to action',
    description: 'Convert social followers with a single scan point and tracked landing flow.',
    items: ['Social destination', 'Product spotlight', 'Offer campaign', 'Engagement tracking'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['social', 'event', 'website'],
    lifecycleStages: ['acquire', 'convert', 'expand'],
  },
  {
    key: 'beauty-spa-journey',
    name: 'Beauty Spa Journey',
    industry: 'Beauty and wellness',
    audience: 'Salon owners',
    outcome: 'Discovery to booking to repeat appointments',
    description: 'Guide guests from scan to booking with reminders and offer follow-up.',
    items: ['Service menu', 'Specialist booking', 'Follow-up offer', 'Review capture'],
    recommendedModules: ['qr.core', 'analytics.basic', 'locations.basic'],
    suggestedQrCampaignTypes: ['website', 'lead', 'coupon'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'gym-retention-system',
    name: 'Gym Retention System',
    industry: 'Health & fitness',
    audience: 'Gym operators',
    outcome: 'Walk-in trial to class booking to membership renewal',
    description: 'Link on-site QR prompts to recurring visits and membership reminders.',
    items: ['Trial sign-up', 'Class schedule', 'Member newsletter', 'Renewal campaign'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['lead', 'event', 'website'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'ecommerce-crosssell-loop',
    name: 'Ecommerce Cross-sell Loop',
    industry: 'Ecommerce',
    audience: 'Store teams',
    outcome: 'Scan to purchase to loyalty program',
    description: 'Turn physical materials into sales funnels with sequential upsell prompts.',
    items: ['Product spotlight', 'Bundled offer', 'Cart capture', 'Review and feedback'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['website', 'coupon', 'social'],
    lifecycleStages: ['acquire', 'convert', 'expand'],
  },
  {
    key: 'retail-traffic-booster',
    name: 'Retail Traffic Booster',
    industry: 'Retail',
    audience: 'Store managers',
    outcome: 'Store visit to mobile capture to repeat purchase',
    description: 'Improve foot traffic with QR-triggered offers and loyalty re-engagement.',
    items: ['In-store sign-in', 'Flash coupon', 'Product spotlight', 'Review incentive'],
    recommendedModules: ['qr.core', 'analytics.basic', 'locations.basic'],
    suggestedQrCampaignTypes: ['coupon', 'lead', 'website'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'hotel-checkin-upgrade',
    name: 'Hotel Check-in Upgrade',
    industry: 'Hospitality',
    audience: 'Guest experience teams',
    outcome: 'Arrival to service upsell to positive review',
    description: 'Drive guest engagement from arrival points through post-stay feedback loops.',
    items: ['Welcome menu', 'Concierge highlights', 'Service upsell', 'Post-stay follow-up'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['website', 'coupon', 'social'],
    lifecycleStages: ['onboard', 'upgrade', 'advocate'],
  },
  {
    key: 'real-estate-lead-router',
    name: 'Real Estate Lead Router',
    industry: 'Real estate',
    audience: 'Agents and brokers',
    outcome: 'Walk-in lead to booking to closed opportunity',
    description: 'Route local leads straight into qualification and consultation workflows.',
    items: ['Listing gallery', 'Lead capture', 'Consultation CTA', 'Market update signup'],
    recommendedModules: ['qr.core', 'analytics.basic', 'team.manager'],
    suggestedQrCampaignTypes: ['lead', 'event', 'website'],
    lifecycleStages: ['acquire', 'qualify', 'convert'],
  },
  {
    key: 'legal-practice-onboarding',
    name: 'Legal Practice Onboarding',
    industry: 'Legal',
    audience: 'Legal offices',
    outcome: 'Consultation request to discovery to case intake',
    description: 'Standardize intake flow with secure consent capture and next-step prompts.',
    items: ['Service area page', 'Initial intake form', 'Consult request', 'Follow-up reminder'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['lead', 'website'],
    lifecycleStages: ['acquire', 'qualify', 'convert'],
  },
  {
    key: 'dentistry-care-journey',
    name: 'Dental Care Journey',
    industry: 'Healthcare',
    audience: 'Dental clinics',
    outcome: 'Appointment discover to book to retention reminders',
    description: 'Move patients from walk-up to recurring care with one predictable funnel.',
    items: ['Service overview', 'Appointment booking', 'Pre-visit checklists', 'Reminder campaign'],
    recommendedModules: ['qr.core', 'analytics.basic', 'locations.basic'],
    suggestedQrCampaignTypes: ['lead', 'website', 'social'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'co-working-activation',
    name: 'Co-working Activation',
    industry: 'Coworking',
    audience: 'Workspace operators',
    outcome: 'Tour to trial trial to full membership',
    description: 'Capture prospects at your space and nurture them into long-term members.',
    items: ['Tour booking', 'Amenities list', 'Community highlights', 'Membership CTA'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['lead', 'website', 'event'],
    lifecycleStages: ['acquire', 'convert', 'expand'],
  },
  {
    key: 'education-course-funnel',
    name: 'Education Course Funnel',
    industry: 'Education',
    audience: 'Course creators',
    outcome: 'Scan to signup to completion to referral',
    description: 'Guide learners from campaign page through conversion and completion loop.',
    items: ['Course landing', 'Enrollment flow', 'Progress reminder', 'Referral invite'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['website', 'lead', 'social'],
    lifecycleStages: ['acquire', 'nurture', 'expand'],
  },
  {
    key: 'event-attendance-accelerator',
    name: 'Event Attendance Accelerator',
    industry: 'Events',
    audience: 'Event teams',
    outcome: 'Promotion to RSVP to attendance',
    description: 'Improve event attendance with a clear scan-to-rsvp loop and reminders.',
    items: ['Speaker highlights', 'RSVP capture', 'Venue logistics', 'Live update channel'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['event', 'social', 'website'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'nonprofit-donor-retention',
    name: 'Nonprofit Donor Retention',
    industry: 'Nonprofit',
    audience: 'Fundraising teams',
    outcome: 'Donor interest to giving to recurring support',
    description: 'Convert in-person interest into recurring giving and volunteer action.',
    items: ['Story landing', 'Impact dashboard', 'Donation flow', 'Volunteer onboarding'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['website', 'lead', 'social'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
  {
    key: 'travel-experience-loop',
    name: 'Travel Experience Loop',
    industry: 'Travel & tourism',
    audience: 'Tour operators',
    outcome: 'Tour discovery to booking to review',
    description: 'Turn onsite interest into booked journeys with one consistent campaign system.',
    items: ['Attraction highlights', 'Itinerary snippet', 'Trip quote', 'Guest review ask'],
    recommendedModules: ['qr.core', 'analytics.basic'],
    suggestedQrCampaignTypes: ['website', 'lead', 'social'],
    lifecycleStages: ['acquire', 'convert', 'advocate'],
  },
  {
    key: 'agency-project-onboarding',
    name: 'Agency Project Onboarding',
    industry: 'Services',
    audience: 'Agency teams',
    outcome: 'Lead discovery to proposal to project kickoff',
    description: 'Simplify commercial conversations from first scan to signed project.',
    items: ['Service page', 'Discovery scheduling', 'Case studies', 'Proposal CTA'],
    recommendedModules: ['qr.core', 'analytics.basic', 'analytics.advanced'],
    suggestedQrCampaignTypes: ['lead', 'website'],
    lifecycleStages: ['acquire', 'qualify', 'convert'],
  },
  {
    key: 'consulting-retainer-play',
    name: 'Consulting Retainer Play',
    industry: 'Professional services',
    audience: 'Consulting firms',
    outcome: 'Opportunity to proposal to recurring contract',
    description: 'Nurture inbound queries into recurring retainer relationships.',
    items: ['Value proposition', 'Booking cadence', 'Client qualification', 'Follow-up cadence'],
    recommendedModules: ['qr.core', 'analytics.basic', 'team.manager'],
    suggestedQrCampaignTypes: ['lead', 'website'],
    lifecycleStages: ['acquire', 'qualify', 'convert'],
  },
  {
    key: 'automotive-service-binder',
    name: 'Automotive Service Binder',
    industry: 'Automotive',
    audience: 'Auto dealerships',
    outcome: 'Drive in visit to service booking to retention',
    description: 'Connect showroom and service moments to booked appointments and follow-up.',
    items: ['Service menu', 'Maintenance reminders', 'Appointment booking', 'Loyalty incentive'],
    recommendedModules: ['qr.core', 'analytics.basic', 'locations.basic'],
    suggestedQrCampaignTypes: ['lead', 'website', 'coupon'],
    lifecycleStages: ['acquire', 'convert', 'retain'],
  },
] as const satisfies GrowthBlueprintTemplate[];

export function getBlueprintTemplate(templateKey: string) {
  return blueprintTemplates.find((template) => template.key === templateKey);
}

export function getBlueprintIndustries(): string[] {
  return Array.from(new Set(blueprintTemplates.map((template) => template.industry)).values()).sort();
}

export function getBlueprintOutcomes(): string[] {
  return Array.from(new Set(blueprintTemplates.map((template) => template.outcome)).values()).sort();
}

export function filterBlueprintTemplates(options: { search?: string; industry?: string; outcome?: string } = {}) {
  const search = options.search?.trim().toLowerCase() ?? '';
  const selectedIndustry = options.industry?.trim().toLowerCase() ?? '';
  const selectedOutcome = options.outcome?.trim().toLowerCase() ?? '';

  return blueprintTemplates.filter((template) => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search) ||
      template.audience.toLowerCase().includes(search) ||
      template.outcome.toLowerCase().includes(search) ||
      template.industry.toLowerCase().includes(search);

    const matchesIndustry = !selectedIndustry || template.industry.toLowerCase() === selectedIndustry;
    const matchesOutcome = !selectedOutcome || template.outcome.toLowerCase() === selectedOutcome;
    return matchesSearch && matchesIndustry && matchesOutcome;
  });
}
