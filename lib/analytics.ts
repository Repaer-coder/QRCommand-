import type { SupabaseClient } from '@supabase/supabase-js';

export interface AnalyticsSnapshot {
  generatedAt: string;
  periodDays: number;
  totals: { campaigns: number; activeCampaigns: number; scans: number; periodScans: number; locations: number };
  daily: { date: string; scans: number }[];
  campaigns: { id: string; name: string; status: string; locationId: string | null; scans: number; periodScans: number }[];
  devices: { label: string; scans: number }[];
  locations: { id: string; name: string; scans: number }[];
}

function countBy(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value || 'unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, scans]) => ({ label, scans }))
    .sort((a, b) => b.scans - a.scans);
}

export function buildDailySeries(scannedAt: string[], periodDays: number, now = new Date()) {
  const counts = new Map<string, number>();
  for (const value of scannedAt) {
    const date = new Date(value).toISOString().slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (periodDays - index - 1));
    const label = date.toISOString().slice(0, 10);
    return { date: label, scans: counts.get(label) ?? 0 };
  });
}

export async function getAnalyticsSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  periodDays = 30
): Promise<AnalyticsSnapshot> {
  const safeDays = Math.min(Math.max(periodDays, 1), 90);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - safeDays + 1);
  since.setUTCHours(0, 0, 0, 0);

  const [{ data: codeRows, error: codeError }, { data: locationRows, error: locationError }] = await Promise.all([
    supabase
      .from('qr_codes')
      .select('id,name,status,scan_count,location_id')
      .eq('organization_id', organizationId)
      .neq('status', 'archived'),
    supabase.from('locations').select('id,name').eq('organization_id', organizationId),
  ]);
  if (codeError) throw new Error(codeError.message);
  if (locationError) throw new Error(locationError.message);

  const codes = (codeRows ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    scan_count: number | null;
    location_id: string | null;
  }>;
  const codeIds = codes.map((code) => code.id);
  let scans: Array<{ qr_code_id: string; scanned_at: string; device_type: string | null }> = [];
  if (codeIds.length) {
    const scanResult = await supabase
      .from('scan_events')
      .select('qr_code_id,scanned_at,device_type')
      .in('qr_code_id', codeIds)
      .gte('scanned_at', since.toISOString())
      .order('scanned_at', { ascending: true })
      .limit(10000);
    if (scanResult.error) throw new Error(scanResult.error.message);
    scans = scanResult.data ?? [];
  }

  const periodByCode = new Map<string, number>();
  for (const scan of scans) {
    periodByCode.set(scan.qr_code_id, (periodByCode.get(scan.qr_code_id) ?? 0) + 1);
  }
  const locations = (locationRows ?? []) as Array<{ id: string; name: string }>;
  const scansByLocation = new Map<string, number>();
  for (const code of codes) {
    if (code.location_id) {
      scansByLocation.set(code.location_id, (scansByLocation.get(code.location_id) ?? 0) + (code.scan_count ?? 0));
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    periodDays: safeDays,
    totals: {
      campaigns: codes.length,
      activeCampaigns: codes.filter((code) => code.status === 'active').length,
      scans: codes.reduce((sum, code) => sum + (code.scan_count ?? 0), 0),
      periodScans: scans.length,
      locations: locations.length,
    },
    daily: buildDailySeries(scans.map((scan) => scan.scanned_at), safeDays),
    campaigns: codes
      .map((code) => ({
        id: code.id,
        name: code.name,
        status: code.status,
        locationId: code.location_id,
        scans: code.scan_count ?? 0,
        periodScans: periodByCode.get(code.id) ?? 0,
      }))
      .sort((a, b) => b.scans - a.scans),
    devices: countBy(scans.map((scan) => scan.device_type)),
    locations: locations
      .map((location) => ({ ...location, scans: scansByLocation.get(location.id) ?? 0 }))
      .sort((a, b) => b.scans - a.scans),
  };
}
