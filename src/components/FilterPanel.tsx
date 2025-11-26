import { FilterState, SortKey } from '../types';

type Props = {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  tldOptions: { tld: string; count: number }[];
  onReset: () => void;
};

const hyphenOptions = [
  { label: 'Any hyphens', value: 'any' },
  { label: 'No hyphens', value: 'block' },
  { label: 'Must have hyphen', value: 'allow' }
] as const;

const digitOptions = [
  { label: 'Any digits', value: 'any' },
  { label: 'No digits', value: 'block' },
  { label: 'Must have digits', value: 'allow' }
] as const;

const sortLabels: Record<SortKey, string> = {
  score: 'Smart score',
  length: 'Length (short first)',
  alphabetical: 'Alphabetical',
  tld: 'TLD',
  traffic: 'Traffic',
  backlinks: 'Backlinks',
  price: 'Price (low first)'
};

export const FilterPanel = ({ filters, onChange, tldOptions, onReset }: Props) => {
  const toggleTld = (value: string) => {
    const next = new Set(filters.selectedTlds);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange({ selectedTlds: Array.from(next) });
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Filters</p>
          <h2 className="panel__title">Find high-signal domains fast</h2>
        </div>
        <button className="ghost" onClick={onReset}>
          Reset
        </button>
      </header>

      <div className="filter-grid">
        <label className="field">
          <span>Search</span>
          <input
            type="search"
            value={filters.search}
            placeholder="brand, ai, solar, coffee..."
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Must include (comma separated)</span>
          <input
            type="text"
            value={filters.include}
            placeholder="eco, ai, cloud"
            onChange={(e) => onChange({ include: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Exclude keywords</span>
          <input
            type="text"
            value={filters.exclude}
            placeholder="adult, spam, trademark..."
            onChange={(e) => onChange({ exclude: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Length (min)</span>
          <input
            type="number"
            min={1}
            value={filters.lengthMin}
            onChange={(e) => onChange({ lengthMin: Number(e.target.value) || 0 })}
          />
        </label>

        <label className="field">
          <span>Length (max)</span>
          <input
            type="number"
            min={filters.lengthMin}
            value={filters.lengthMax}
            onChange={(e) => onChange({ lengthMax: Number(e.target.value) || 0 })}
          />
        </label>

        <label className="field">
          <span>Hyphens</span>
          <select
            value={filters.hyphens}
            onChange={(e) => onChange({ hyphens: e.target.value as FilterState['hyphens'] })}
          >
            {hyphenOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Digits</span>
          <select
            value={filters.digits}
            onChange={(e) => onChange({ digits: e.target.value as FilterState['digits'] })}
          >
            {digitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Max price</span>
          <input
            type="number"
            min={0}
            placeholder="optional"
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              onChange({ priceMax: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </label>

        <label className="field">
          <span>Min traffic</span>
          <input
            type="number"
            min={0}
            placeholder="optional"
            value={filters.trafficMin ?? ''}
            onChange={(e) =>
              onChange({ trafficMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </label>

        <label className="field">
          <span>Min backlinks</span>
          <input
            type="number"
            min={0}
            placeholder="optional"
            value={filters.backlinksMin ?? ''}
            onChange={(e) =>
              onChange({ backlinksMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </label>

        <label className="field">
          <span>Sort by</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as SortKey })}
          >
            {Object.entries(sortLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Max results</span>
          <input
            type="number"
            min={50}
            value={filters.maxResults}
            onChange={(e) => onChange({ maxResults: Number(e.target.value) || 200 })}
          />
        </label>
      </div>

      <div className="chips">
        <div className="chip-label">Top TLDs</div>
        <div className="chip-row">
          {tldOptions.slice(0, 18).map((item) => {
            const active = filters.selectedTlds.includes(item.tld);
            return (
              <button
                key={item.tld}
                className={`chip ${active ? 'chip--active' : ''}`}
                onClick={() => toggleTld(item.tld)}
              >
                {item.tld} <span className="chip__count">{item.count.toLocaleString()}</span>
              </button>
            );
          })}
          <button className="ghost" onClick={() => onChange({ selectedTlds: [] })}>
            Clear TLDs
          </button>
        </div>
      </div>
    </section>
  );
};
