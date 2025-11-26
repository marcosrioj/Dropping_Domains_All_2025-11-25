import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DomainList } from './components/DomainList';
import { FilterPanel } from './components/FilterPanel';
import { useCsvLoader } from './hooks/useCsvLoader';
import { parseKeywords, uniqueTlds } from './lib/domain-utils';
import { DomainRecord, FilterState, SortKey } from './types';

const createDefaultFilters = (): FilterState => ({
  search: '',
  include: '',
  exclude: '',
  selectedTlds: [],
  lengthMin: 1,
  lengthMax: 32,
  hyphens: 'any',
  digits: 'any',
  humanWords: 'any',
  sortBy: 'score',
  maxResults: 500,
  priceMax: undefined,
  trafficMin: undefined,
  backlinksMin: undefined
});

const sorters: Record<SortKey, (a: DomainRecord, b: DomainRecord) => number> = {
  score: (a, b) => b.score - a.score || b.wordScore - a.wordScore || a.length - b.length,
  length: (a, b) => a.length - b.length || a.domain.localeCompare(b.domain),
  alphabetical: (a, b) => a.domain.localeCompare(b.domain),
  tld: (a, b) => a.tld.localeCompare(b.tld) || a.domain.localeCompare(b.domain),
  traffic: (a, b) => (b.metrics.traffic ?? -Infinity) - (a.metrics.traffic ?? -Infinity),
  backlinks: (a, b) => (b.metrics.backlinks ?? -Infinity) - (a.metrics.backlinks ?? -Infinity),
  price: (a, b) => (a.metrics.price ?? Infinity) - (b.metrics.price ?? Infinity)
};

const fileName = 'Dropping_Domains_All_2025-11-25.csv';

const App = () => {
  const { data, loading, error } = useCsvLoader(fileName);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const deferredSearch = useDeferredValue(filters.search.toLowerCase());

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listSize, setListSize] = useState({ width: 1200, height: 560 });

  useLayoutEffect(() => {
    const element = listContainerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setListSize({
        width: rect.width,
        height: Math.max(320, rect.height - 8)
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const tldOptions = useMemo(() => uniqueTlds(data), [data]);

  const { visibleRecords, totalFiltered } = useMemo(() => {
    if (!data.length) return { visibleRecords: [], totalFiltered: 0 };

    const includeTerms = parseKeywords(filters.include);
    const excludeTerms = parseKeywords(filters.exclude);
    const tldSet = new Set(filters.selectedTlds.map((tld) => tld.replace(/^\./, '')));
    const searchTerm = deferredSearch.trim();

    const results: DomainRecord[] = [];
    for (const record of data) {
      if (filters.lengthMin && record.length < filters.lengthMin) continue;
      if (filters.lengthMax && record.length > filters.lengthMax) continue;
      if (filters.hyphens === 'block' && record.hasHyphen) continue;
      if (filters.hyphens === 'allow' && !record.hasHyphen) continue;
      if (filters.digits === 'block' && record.hasNumber) continue;
      if (filters.digits === 'allow' && !record.hasNumber) continue;
      if (filters.priceMax !== undefined) {
        if (record.metrics.price !== undefined && record.metrics.price > filters.priceMax) continue;
      }
      if (filters.humanWords === 'require' && !record.hasHumanWords) continue;
      if (filters.trafficMin !== undefined) {
        if ((record.metrics.traffic ?? 0) < filters.trafficMin) continue;
      }
      if (filters.backlinksMin !== undefined) {
        if ((record.metrics.backlinks ?? 0) < filters.backlinksMin) continue;
      }
      if (tldSet.size && !tldSet.has(record.tld)) continue;

      const haystack = record.domain.toLowerCase();

      if (searchTerm && !haystack.includes(searchTerm)) continue;
      if (includeTerms.length && includeTerms.some((term) => !haystack.includes(term))) continue;
      if (
        excludeTerms.length &&
        excludeTerms.some((term) => haystack.includes(term) || record.keywords.some((k) => k.includes(term)))
      )
        continue;

      results.push(record);
    }

    const sorted = results.sort(sorters[filters.sortBy]);
    const limit = Math.max(50, filters.maxResults || 500);
    return { visibleRecords: sorted.slice(0, limit), totalFiltered: sorted.length };
  }, [data, deferredSearch, filters]);

  const best = visibleRecords[0];

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Dropping domains — 2025-11-25</p>
        <h1>Domain opportunity scanner</h1>
        <p className="lede">
          Load the provided CSV and apply zero-lag filters to find short, clean, and high-signal domains. Comment
          lines are stripped automatically so only valid rows are parsed.
        </p>

        <div className="stat-row">
          <div className="stat">
            <p className="eyebrow">Total loaded</p>
            <strong>{loading ? 'Loading…' : data.length.toLocaleString()}</strong>
          </div>
          <div className="stat">
            <p className="eyebrow">Filtered now</p>
            <strong>{loading ? '—' : totalFiltered.toLocaleString()}</strong>
          </div>
          <div className="stat">
            <p className="eyebrow">Top pick</p>
            <strong>{best ? `${best.domain} (${best.score})` : '—'}</strong>
          </div>
        </div>
      </header>

      <FilterPanel
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        tldOptions={tldOptions}
        onReset={() => setFilters(createDefaultFilters())}
      />

      <section className="panel list-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="panel__title">Virtualized list for huge drops</h2>
          </div>
          <div className="count">
            Showing {visibleRecords.length.toLocaleString()} of {totalFiltered.toLocaleString()} filtered (
            {data.length.toLocaleString()} loaded)
          </div>
        </div>

        <div className="list-container" ref={listContainerRef}>
          {error && <div className="notice error">Failed to load CSV: {error}</div>}
          {!error && loading && <div className="notice">Parsing CSV…</div>}
          {!error && !loading && !visibleRecords.length && (
            <div className="notice">No domains match the current filters.</div>
          )}
          {!error && !loading && visibleRecords.length > 0 && (
            <DomainList records={visibleRecords} width={listSize.width} height={listSize.height} />
          )}
        </div>
      </section>
    </main>
  );
};

export default App;
