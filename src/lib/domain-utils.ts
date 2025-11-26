import { inDictionary } from '../data/wordlist';
import { DomainRecord, RawRow } from '../types';

const DOMAIN_KEYS = ['domain', 'Domain', 'Domain Name', 'name', 'Name', 'url', 'URL'];
const TRAFFIC_KEYS = ['traffic', 'Traffic', 'search_volume', 'SearchVolume'];
const BACKLINK_KEYS = ['backlinks', 'Backlinks', 'refdomains', 'RefDomains', 'refs'];
const PRICE_KEYS = ['price', 'Price', 'bid', 'Bid', 'min_bid', 'MinBid'];
const COMMON_WORDS = new Set([
  'meta',
  'solar',
  'cloud',
  'green',
  'eco',
  'fresh',
  'prime',
  'first',
  'daily',
  'today',
  'news',
  'press',
  'story',
  'world',
  'city',
  'local',
  'shop',
  'store',
  'mart',
  'market',
  'home',
  'house',
  'rent',
  'hub',
  'base',
  'core',
  'grid',
  'space',
  'lab',
  'labs',
  'works',
  'build',
  'forge',
  'foundry',
  'craft',
  'made',
  'make',
  'code',
  'dev',
  'studio',
  'team',
  'group',
  'club',
  'zone',
  'land',
  'earth',
  'water',
  'sea',
  'blue',
  'sky',
  'air',
  'stone',
  'rock',
  'gold',
  'silver',
  'black',
  'white',
  'bright',
  'clear',
  'glass',
  'light',
  'wave',
  'spark',
  'fire',
  'nova',
  'star',
  'north',
  'south',
  'east',
  'west',
  'center',
  'central',
  'alpha',
  'beta',
  'prime',
  'plus',
  'max',
  'ultra',
  'mega',
  'micro',
  'nano',
  'pico',
  'data',
  'info',
  'guide',
  'learn',
  'teach',
  'school',
  'class',
  'coach',
  'mentor',
  'smart',
  'wise',
  'bright',
  'clean',
  'fast',
  'quick',
  'speed',
  'rapid',
  'turbo',
  'hyper',
  'auto',
  'car',
  'drive',
  'ride',
  'fly',
  'air',
  'sky',
  'bird',
  'bee',
  'lion',
  'bear',
  'wolf',
  'fox',
  'hawk',
  'eagle',
  'tiger',
  'dragon',
  'panther',
  'panda',
  'owl',
  'mint',
  'seed',
  'tree',
  'forest',
  'field',
  'farm',
  'root',
  'grow',
  'bloom',
  'petal',
  'leaf',
  'stone',
  'river',
  'mount',
  'peak',
  'valley'
]);
const COMMON_PREFIXES = ['bio', 'eco', 'hyper', 'ultra', 'micro', 'macro', 'nano', 'astro', 'aero', 'agri', 'crypto', 'block', 'chain', 'quant', 'meta', 'auto', 'pro', 'smart'];
const COMMON_SUFFIXES = [
  'able',
  'age',
  'bot',
  'core',
  'craft',
  'dock',
  'drive',
  'drop',
  'flow',
  'form',
  'gate',
  'grid',
  'hub',
  'ify',
  'ify',
  'lab',
  'labs',
  'land',
  'lane',
  'link',
  'ly',
  'mate',
  'matic',
  'nest',
  'node',
  'nova',
  'pad',
  'pilot',
  'point',
  'port',
  'rise',
  'root',
  'scale',
  'ship',
  'spark',
  'stack',
  'star',
  'state',
  'station',
  'storm',
  'stream',
  'street',
  'supply',
  'sync',
  'verse',
  'view',
  'wave',
  'works',
  'yard'
];

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
    .filter((part) => part.length >= 3) // ignore tiny fragments to keep “human words” meaningful
    .map((part) => part.toLowerCase());

const humanLikeWordScore = (tokens: string[]): { hasHumanWords: boolean; score: number } => {
  let score = 0;
  let hasHuman = false;

  const looksLikeWord = (word: string): boolean => inDictionary(word) || COMMON_WORDS.has(word);

  const compoundScore = (word: string): number => {
    // Try to split a long token into two dictionary words.
    if (word.length < 6) return 0;
    for (let i = 3; i <= word.length - 3; i++) {
      const left = word.slice(0, i);
      const right = word.slice(i);
      if (looksLikeWord(left) && looksLikeWord(right)) return 5;
    }
    return 0;
  };

  for (const token of tokens) {
    if (token.length < 3) continue;
    const lower = token.toLowerCase();
    const vowelCount = (lower.match(/[aeiou]/g) ?? []).length;
    const consonantCount = lower.length - vowelCount;
    const vowelRatio = vowelCount / lower.length;
    const longConsonantRun = /[bcdfghjklmnpqrstvwxyz]{4,}/.test(lower);
    const dictHit = looksLikeWord(lower);

    let tokenScore = 0;

    if (dictHit) {
      tokenScore += 12;
      hasHuman = true;
    } else {
      tokenScore += compoundScore(lower);
    }

    if (vowelRatio >= 0.25 && vowelRatio <= 0.8) {
      tokenScore += 4;
      hasHuman = true;
    }
    if (vowelCount > 0 && consonantCount > 0 && lower.length >= 5) {
      tokenScore += 2;
    }
    if (COMMON_PREFIXES.some((prefix) => lower.startsWith(prefix) && lower.length - prefix.length >= 3)) {
      tokenScore += 2;
      hasHuman = true;
    }
    if (COMMON_SUFFIXES.some((suffix) => lower.endsWith(suffix) && lower.length - suffix.length >= 2)) {
      tokenScore += 2;
      hasHuman = true;
    }
    if (longConsonantRun) {
      tokenScore -= 4;
    }

    score += Math.max(0, tokenScore);
  }

  if (hasHuman && tokens.length > 1) {
    score += 4; // boost for multi-word expressions
  }

  return { hasHumanWords: hasHuman, score };
};

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

  const tokens = tokenizeDomain(sld);
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
  const { hasHumanWords, score: wordScore } = humanLikeWordScore(tokens);

  return {
    domain,
    tld,
    sld,
    length,
    hasHyphen,
    hasNumber,
    hasHumanWords,
    wordScore,
    keywords: tokens,
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
