import { useEffect, useState } from 'react';
import { getWordRank } from '../data/wordlist';

type TrendResult = {
  scores: Map<string, number>;
  loading: boolean;
};

const tokenize = (domain: string): string[] =>
  domain
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]/gi, ' ')
    .split(/[-\d\s]+/g)
    .filter((part) => part.length >= 3)
    .map((part) => part.toLowerCase());

const offlineTrendScore = (domain: string): number => {
  const tokens = tokenize(domain);
  if (!tokens.length) return 0;
  let score = 0;
  for (const token of tokens) {
    const rank = getWordRank(token);
    if (rank > 0) {
      score += rank;
    } else if (/^[a-z]+$/.test(token)) {
      score += 50;
    }
  }
  // Shorter base names get a small boost
  const sld = domain.replace(/\.[^.]+$/, '');
  score += Math.max(0, 20 - sld.length);
  return Math.round(score);
};

export const useTrendScores = (domains: string[], maxLookups = 400): TrendResult => {
  const [scores, setScores] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const unique = Array.from(new Set(domains)).slice(0, maxLookups);
    const map = new Map<string, number>();
    unique.forEach((d) => map.set(d, offlineTrendScore(d)));
    setScores(map);
  }, [domains.join('|'), maxLookups]);

  return { scores, loading: false };
};
