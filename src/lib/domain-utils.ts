import { DomainRecord, RawRow } from '../types';

const DOMAIN_KEYS = ['domain', 'Domain', 'Domain Name', 'name', 'Name', 'url', 'URL'];
const TRAFFIC_KEYS = ['traffic', 'Traffic', 'search_volume', 'SearchVolume'];
const BACKLINK_KEYS = ['backlinks', 'Backlinks', 'refdomains', 'RefDomains', 'refs'];
const PRICE_KEYS = ['price', 'Price', 'bid', 'Bid', 'min_bid', 'MinBid'];

type ScoreInput = {
  length: number;
  hasHyphen: boolean;
  hasNumber: boolean;
  vowelRatio: number;
  traffic?: number;
  backlinks?: number;
};

const numberFrom = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[, ]/g, ''));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const pickNumber = (row: RawRow, keys: string[]): number | undefined => {
  for (const key of keys) {
    const candidate = numberFrom(row[key]);
    if (candidate !== undefined) {
      return candidate;
    }
  }
  return undefined;
};

const tokenizeDomain = (sld: string): string[] =>
  sld
    .replace(/[^a-z0-9-]/gi, ' ')
    .split(/[-\d\s]+/g)
    .filter(Boolean)
    .map((part) => part.toLowerCase());

const scoreDomain = (input: ScoreInput): number => {
  const base = Math.max(0, 120 - input.length * 4);
  const vowelBoost = input.vowelRatio * 14;
  const hyphenPenalty = input.hasHyphen ? 12 : 0;
  const digitPenalty = input.hasNumber ? 8 : 0;
  const trafficBoost = input.traffic ? Math.log10(1 + input.traffic) * 10 : 0;
  const backlinksBoost = input.backlinks ? Math.log10(1 + input.backlinks) * 8 : 0;
  const score = base + vowelBoost + trafficBoost + backlinksBoost - hyphenPenalty - digitPenalty;
  return Math.round(score * 100) / 100;
};

export const stripComments = (chunk: string): string =>
  chunk
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trimStart();
      if (!trimmed) return false;
      return !trimmed.startsWith('#') && !trimmed.startsWith('//') && !trimmed.startsWith(';');
    })
    .join('\n');

const extractDomain = (row: RawRow): string | null => {
  for (const key of DOMAIN_KEYS) {
    const candidate = row[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
};

const normalizeDomain = (value: string): string => {
  const cleaned = value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  return cleaned;
};

export const buildDomainRecord = (row: RawRow): DomainRecord | null => {
  const domainValue = extractDomain(row);
  if (!domainValue) return null;

  const domain = normalizeDomain(domainValue);
  const parts = domain.split('.');
  if (parts.length < 2) return null;

  const tld = parts.pop() as string;
  const sld = parts.join('.');
  if (!sld) return null;

  const lettersOnly = sld.replace(/[^a-z]/gi, '');
  const vowelCount = (lettersOnly.match(/[aeiou]/gi) ?? []).length;
  const vowelRatio = lettersOnly ? vowelCount / lettersOnly.length : 0;

  const metrics = {
    traffic: pickNumber(row, TRAFFIC_KEYS),
    backlinks: pickNumber(row, BACKLINK_KEYS),
    price: pickNumber(row, PRICE_KEYS)
  };

  const length = sld.length;
  const hasHyphen = domain.includes('-');
  const hasNumber = /\d/.test(domain);

  return {
    domain,
    tld,
    sld,
    length,
    hasHyphen,
    hasNumber,
    keywords: tokenizeDomain(sld),
    score: scoreDomain({
      length,
      hasHyphen,
      hasNumber,
      vowelRatio,
      traffic: metrics.traffic,
      backlinks: metrics.backlinks
    }),
    metrics,
    raw: row
  };
};

export const uniqueTlds = (records: DomainRecord[]): { tld: string; count: number }[] => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    counts.set(record.tld, (counts.get(record.tld) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([tld, count]) => ({ tld, count }))
    .sort((a, b) => b.count - a.count || a.tld.localeCompare(b.tld));
};

export const parseKeywords = (value: string): string[] =>
  value
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
