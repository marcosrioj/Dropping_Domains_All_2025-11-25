import wordsRaw from './english-words.txt?raw';

const WORDS = wordsRaw
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length > 2);

const WORD_SET = new Set(WORDS);
const WORD_RANK = new Map<string, number>();

// Assign a simple popularity rank: earlier words get higher scores.
for (let i = 0; i < WORDS.length; i++) {
  const word = WORDS[i];
  WORD_RANK.set(word, WORDS.length - i);
}

export const inDictionary = (word: string): boolean => WORD_SET.has(word.toLowerCase());

export const getWordRank = (word: string): number => {
  const rank = WORD_RANK.get(word.toLowerCase());
  return rank ?? 0;
};
