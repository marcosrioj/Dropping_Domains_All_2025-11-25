import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { DomainRecord } from '../types';

type Props = {
  records: DomainRecord[];
  width: number;
  height: number;
};

export const DomainList = ({ records, width, height }: Props) => {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const record = records[index];
    return (
      <div className="list-row" style={style}>
        <div className="list-row__title">
          <div className="pill">{record.tld}</div>
          <strong className="domain">{record.domain}</strong>
        </div>
        <div className="list-row__meta">
          <span>len {record.length}</span>
          <span>{record.hasHyphen ? 'hyphen' : 'clean'}</span>
          <span>{record.hasNumber ? 'digits' : 'letters'}</span>
        </div>
        <div className="list-row__score">
          <div className="score">{record.score}</div>
          <div className="metrics">
            {record.metrics.traffic !== undefined && (
              <span>traffic {record.metrics.traffic.toLocaleString()}</span>
            )}
            {record.metrics.backlinks !== undefined && (
              <span>links {record.metrics.backlinks.toLocaleString()}</span>
            )}
            {record.metrics.price !== undefined && <span>${record.metrics.price}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="list-shell">
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
