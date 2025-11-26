import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { buildDomainRecord, stripComments } from '../lib/domain-utils';
import { DomainRecord, RawRow } from '../types';

type UseCsvLoaderResult = {
  data: DomainRecord[];
  loading: boolean;
  error: string | null;
};

export const useCsvLoader = (fileName: string): UseCsvLoaderResult => {
  const [data, setData] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const parserRef = useRef<Papa.Parser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const rows: DomainRecord[] = [];
    setLoading(true);
    setError(null);

    parserRef.current = Papa.parse<RawRow>(`/${fileName}`, {
      download: true,
      header: true,
      worker: false,
      skipEmptyLines: true,
      dynamicTyping: true,
      comments: '#',
      fastMode: true,
      chunkSize: 512 * 1024,
      beforeFirstChunk: stripComments,
      step: (result) => {
        if (cancelled) return;
        const record = buildDomainRecord(result.data);
        if (record) {
          rows.push(record);
        }
      },
      complete: () => {
        if (cancelled) return;
        setData(rows);
        setLoading(false);
      },
      error: (err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      parserRef.current?.abort();
    };
  }, [fileName]);

  return { data, loading, error };
};
