import { randomUUID } from 'node:crypto';
import type { AnalyticsSnapshot } from '@/lib/analytics';

export interface InsightResult {
  executive_summary: string;
  insights: Array<{ title: string; summary: string; severity: 'info' | 'opportunity' | 'warning'; evidence: string[] }>;
  recommendations: Array<{ title: string; rationale: string; confidence: 'low' | 'medium' | 'high'; supporting_metrics: string[]; proposed_action: { type: 'none' | 'pause_campaign' | 'activate_campaign'; campaign_id: string | null } }>;
}
export interface CampaignDraftResult {
  name: string;
  campaign_type: 'restaurant' | 'reviews' | 'social' | 'website' | 'lead' | 'coupon' | 'event' | 'wifi';
  destination_requirement: string;
  call_to_action: string;
  placement_ideas: string[];
  tracking_plan: string[];
  rationale: string;
}

const insightSchema = { type: 'object', additionalProperties: false, required: ['executive_summary', 'insights', 'recommendations'], properties: { executive_summary: { type: 'string' }, insights: { type: 'array', maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['title', 'summary', 'severity', 'evidence'], properties: { title: { type: 'string' }, summary: { type: 'string' }, severity: { type: 'string', enum: ['info', 'opportunity', 'warning'] }, evidence: { type: 'array', items: { type: 'string' }, maxItems: 5 } } } }, recommendations: { type: 'array', maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['title', 'rationale', 'confidence', 'supporting_metrics', 'proposed_action'], properties: { title: { type: 'string' }, rationale: { type: 'string' }, confidence: { type: 'string', enum: ['low', 'medium', 'high'] }, supporting_metrics: { type: 'array', items: { type: 'string' }, maxItems: 5 }, proposed_action: { type: 'object', additionalProperties: false, required: ['type', 'campaign_id'], properties: { type: { type: 'string', enum: ['none', 'pause_campaign', 'activate_campaign'] }, campaign_id: { type: ['string', 'null'] } } } } } } } } as const;
const campaignDraftSchema = { type: 'object', additionalProperties: false, required: ['name', 'campaign_type', 'destination_requirement', 'call_to_action', 'placement_ideas', 'tracking_plan', 'rationale'], properties: { name: { type: 'string' }, campaign_type: { type: 'string', enum: ['restaurant', 'reviews', 'social', 'website', 'lead', 'coupon', 'event', 'wifi'] }, destination_requirement: { type: 'string' }, call_to_action: { type: 'string' }, placement_ideas: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 }, tracking_plan: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 }, rationale: { type: 'string' } } } as const;

function outputText(body: Record<string, unknown>) {
  if (typeof body.output_text === 'string') return body.output_text;
  const output = Array.isArray(body.output) ? body.output : [];
  for (const item of output as Array<{ content?: Array<{ type?: string; text?: string }> }>) {
    const text = item.content?.find((content) => content.type === 'output_text')?.text;
    if (text) return text;
  }
  return null;
}

async function requestStructured<T>(name: string, instructions: string, input: string, schema: object) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');
  const model = process.env.OPENAI_MODEL || 'gpt-5.6-sol';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'x-client-request-id': randomUUID() },
    body: JSON.stringify({ model, store: false, reasoning: { effort: 'low' }, instructions, input, text: { verbosity: 'medium', format: { type: 'json_schema', name, strict: true, schema } } }),
    signal: AbortSignal.timeout(30000),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const apiError = body.error as { message?: string } | undefined;
    throw new Error(apiError?.message || `OpenAI request failed with HTTP ${response.status}.`);
  }
  const text = outputText(body);
  if (!text) throw new Error('The AI provider returned no structured output.');
  return { data: JSON.parse(text) as T, model: typeof body.model === 'string' ? body.model : model, requestId: response.headers.get('x-request-id'), usage: (body.usage ?? {}) as { input_tokens?: number; output_tokens?: number } };
}

export function generateInsights(snapshot: AnalyticsSnapshot, businessContext: { name: string; businessType: string | null }) {
  return requestStructured<InsightResult>('qr_command_insights', 'You are QR Command\'s business optimization analyst. Use only supplied canonical metrics. A scan is engagement, not conversion or revenue. State uncertainty, cite supporting numbers in evidence strings, and never invent financial impact. Proposed actions may only pause or activate a supplied campaign using its exact ID. Use none when no consequential action is justified.', JSON.stringify({ business: businessContext, analytics: snapshot }), insightSchema);
}
export function generateCampaignDraft(goal: string, snapshot: AnalyticsSnapshot, businessContext: { name: string; businessType: string | null }) {
  return requestStructured<CampaignDraftResult>('qr_command_campaign_draft', 'Create a practical QR campaign draft for the stated business goal. This is a draft only and must not mutate data. Ground it in supplied business context and canonical analytics, avoid revenue claims, and make destination requirements explicit.', JSON.stringify({ goal, business: businessContext, analytics: snapshot }), campaignDraftSchema);
}
