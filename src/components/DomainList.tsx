import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DomainRecord, SortDir, SortKey } from '../types';

type Props = {
  records: DomainRecord[];
  width: number;
  height: number;
  sortBy: SortKey;
  sortDir: SortDir;
  onChangeSort: (key: SortKey) => void;
};

const headers: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Score' },
  { key: 'alphabetical', label: 'Domain' },
  { key: 'length', label: 'Len' },
  { key: 'tld', label: 'TLD' },
  { key: 'traffic', label: 'Traffic' },
  { key: 'backlinks', label: 'Links' },
  { key: 'price', label: 'Price' }
];

export const DomainList = ({ records, width, height, sortBy, sortDir, onChangeSort }: Props) => {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const record = records[index];
    const traffic = record.metrics.traffic;
    const backlinks = record.metrics.backlinks;
    const price = record.metrics.price;

    return (
      <div className="list-row" style={style}>
        <div className="list-row__domain">
          <div className="pill">{record.tld}</div>
          <div className="domain">{record.domain}</div>
        </div>
        <div className="score">{record.score}</div>
        <div className="meta">{record.length}</div>
        <div className="meta">{record.tld}</div>
        <div className="meta">{traffic !== undefined ? traffic.toLocaleString() : '—'}</div>
        <div className="meta">{backlinks !== undefined ? backlinks.toLocaleString() : '—'}</div>
        <div className="meta">{price !== undefined ? `$${price}` : '—'}</div>
      </div>
    );
  };

  return (
    <div className="list-shell">
      <div className="list-header">
        {headers.map((h) => {
          const active = sortBy === h.key;
          return (
            <button
              key={h.key}
              className={`list-header__cell ${active ? 'active' : ''}`}
              onClick={() => onChangeSort(h.key)}
            >
              {h.label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          );
        })}
      </div>
      <FixedSizeList
        itemCount={records.length}
        itemSize={72}
        width={width}
        height={height}
        className="list"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};
