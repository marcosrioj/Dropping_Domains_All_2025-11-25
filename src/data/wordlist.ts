import wordsRaw from './english-words.txt?raw';

const WORDS = new Set(
  wordsRaw
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 2)
);

export const inDictionary = (word: string): boolean => WORDS.has(word.toLowerCase());
