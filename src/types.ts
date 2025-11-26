export type RawRow = Record<string, unknown>;

export type DomainRecord = {
  domain: string;
  tld: string;
  sld: string;
  length: number;
  hasHyphen: boolean;
  hasNumber: boolean;
  hasHumanWords: boolean;
  wordScore: number;
  keywords: string[];
  score: number;
  metrics: {
    traffic?: number;
    backlinks?: number;
    price?: number;
  };
  raw: RawRow;
};

export type SortKey =
  | 'score'
  | 'length'
  | 'alphabetical'
  | 'tld'
  | 'traffic'
  | 'backlinks'
  | 'price'
  | 'trend';

export type SortDir = 'asc' | 'desc';

export type FilterState = {
  search: string;
  include: string;
  exclude: string;
  selectedTlds: string[];
  lengthMin: number;
  lengthMax: number;
  hyphens: 'any' | 'allow' | 'block';
  digits: 'any' | 'allow' | 'block';
  humanWords: 'any' | 'require';
  sortBy: SortKey;
  sortDir: SortDir;
  trendMode: 'any' | 'require';
  trendMin: number;
  maxResults: number;
  priceMax?: number;
  trafficMin?: number;
  backlinksMin?: number;
};
