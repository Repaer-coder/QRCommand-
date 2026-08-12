import { isIP } from 'node:net';
import { resolve4, resolve6 } from 'node:dns/promises';

const SURROUNDING_URL_WHITESPACE = /^(?:\u200B|\u200C|\u200D|\u2060|\uFEFF)+|(?:\u200B|\u200C|\u200D|\u2060|\uFEFF)+$/gu;

function normalizeUrlInput(value: string) {
  return value.trim().replace(SURROUNDING_URL_WHITESPACE, '');
}

export function normalizeHttpUrl(value: string) {
  try {
    const normalized = normalizeUrlInput(value);
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isPrivateIp(address: string) {
  if (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) {
    return true;
  }
  const parts = address.split('.').map(Number);
  if (parts.length !== 4) return false;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  );
}

export async function validatePublicHttpsUrl(value: string) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return null;
  const url = new URL(normalized);
  if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname.endsWith('.local')) return null;

  const addresses = isIP(url.hostname)
    ? [url.hostname]
    : [...(await resolve4(url.hostname).catch(() => [])), ...(await resolve6(url.hostname).catch(() => []))];
  if (!addresses.length || addresses.some(isPrivateIp)) return null;
  return normalized;
}

export function getRequestIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '';
}
