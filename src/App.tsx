import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DomainList } from './components/DomainList';
import { FilterPanel } from './components/FilterPanel';
import { useCsvLoader } from './hooks/useCsvLoader';
import { parseKeywords, uniqueTlds } from './lib/domain-utils';
import { DomainRecord, FilterState, SortDir, SortKey } from './types';

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
  sortDir: 'desc',
  maxResults: 500,
  priceMax: undefined,
  trafficMin: undefined,
  backlinksMin: undefined
});

const compare = (a: number | string | undefined, b: number | string | undefined) => {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

const getSorter = (key: SortKey): ((a: DomainRecord, b: DomainRecord) => number) => {
  switch (key) {
    case 'score':
      return (a, b) => compare(a.score, b.score) || compare(a.wordScore, b.wordScore) || compare(b.length, a.length);
    case 'length':
      return (a, b) => compare(a.length, b.length) || a.domain.localeCompare(b.domain);
    case 'alphabetical':
      return (a, b) => a.domain.localeCompare(b.domain);
    case 'tld':
      return (a, b) => a.tld.localeCompare(b.tld) || a.domain.localeCompare(b.domain);
    case 'traffic':
      return (a, b) => compare(a.metrics.traffic, b.metrics.traffic);
    case 'backlinks':
      return (a, b) => compare(a.metrics.backlinks, b.metrics.backlinks);
    case 'price':
      return (a, b) => compare(a.metrics.price, b.metrics.price);
    default:
      return () => 0;
  }
};

const fileName = 'Dropping_Domains_All_2025-11-25.csv';

const App = () => {
  const { data, loading, error } = useCsvLoader(fileName);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [page, setPage] = useState(1);
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
        height: Math.max(300, rect.height - 56) // leave room for header row
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const tldOptions = useMemo(() => uniqueTlds(data), [data]);

  const { visibleRecords, totalFiltered, totalPages, currentPage } = useMemo(() => {
    if (!data.length) return { visibleRecords: [], totalFiltered: 0, totalPages: 1, currentPage: 1 };

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

    const sorted = results.sort(getSorter(filters.sortBy));
    if (filters.sortDir === 'desc') {
      sorted.reverse();
    }

    const limit = Math.max(50, filters.maxResults || 500);
    const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / limit));
    const currentPage = Math.min(page, totalPagesCalc);
    const start = (currentPage - 1) * limit;
    const end = start + limit;

    return {
      visibleRecords: sorted.slice(start, end),
      totalFiltered: sorted.length,
      totalPages: totalPagesCalc,
      currentPage
    };
  }, [data, deferredSearch, filters, page]);

  // Clamp page when filters shrink result set.
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const best = visibleRecords[0];

  const handleFilterChange = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    setFilters((prev) => {
      if (prev.sortBy === key) {
        const nextDir: SortDir = prev.sortDir === 'asc' ? 'desc' : 'asc';
        return { ...prev, sortDir: nextDir };
      }
      return { ...prev, sortBy: key, sortDir: key === 'price' || key === 'length' ? 'asc' : 'desc' };
    });
    setPage(1);
  };

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
        onChange={handleFilterChange}
        tldOptions={tldOptions}
        onReset={() => {
          setFilters(createDefaultFilters());
          setPage(1);
        }}
      />

      <section className="panel list-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="panel__title">Virtualized list for huge drops</h2>
          </div>
          <div className="count">
            Showing {visibleRecords.length.toLocaleString()} of {totalFiltered.toLocaleString()} filtered (
            page {currentPage} / {totalPages})
          </div>
        </div>

        <div className="list-container" ref={listContainerRef}>
          {error && <div className="notice error">Failed to load CSV: {error}</div>}
          {!error && loading && <div className="notice">Parsing CSV…</div>}
          {!error && !loading && !visibleRecords.length && (
            <div className="notice">No domains match the current filters.</div>
          )}
          {!error && !loading && visibleRecords.length > 0 && (
            <DomainList
              records={visibleRecords}
              width={listSize.width}
              height={listSize.height}
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onChangeSort={toggleSort}
            />
          )}
        </div>

        {!error && !loading && totalFiltered > 0 && (
          <div className="pagination">
            <button className="ghost" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default App;
