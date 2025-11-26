# Dropping Domains Explorer

A React + Vite tool for slicing through large drop lists with zero-lag filters and virtualized rendering.

## Quick start

```bash
npm install
npm run dev
# open the URL from the terminal (default http://localhost:5173)
```

### Data file

- Place `Dropping_Domains_All_2025-11-25.csv` in `public/`. A small sample is already there.
- Comment lines starting with `#`, `//`, or `;` are stripped automatically before parsing.
- The loader expects a header row. It will try to detect the domain column using common names: `domain`, `Domain`, `Domain Name`, `name`, `url`.

### Features

- Streamed CSV parsing (Papaparse chunking; worker disabled to allow comment stripping).
- Automatic comment removal and basic numeric detection (traffic, backlinks, price).
- Derived domain metrics (length, hyphen/digit flags, vowel ratio, smart score).
- Rich filters: search, include/exclude keywords, TLD chips, length range, hyphen/digit policy, human-word requirement (20k English wordlist + prefix/suffix/compound heuristics; ignores tokens <3 chars), min traffic/backlinks, max price, and result cap.
- Sorting by score, length, alpha, TLD, traffic, backlinks, or price.
- Virtualized result list (react-window) so only visible rows render.

### Notes

- Replace the sample CSV with the real drop list when ready.
- The smart score favors short, clean, vowel-balanced names and boosts known traffic/backlink metrics.
- To tweak scoring or parsing, see `src/lib/domain-utils.ts` and `src/hooks/useCsvLoader.ts`.
