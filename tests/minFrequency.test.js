const { WordProcessor } = require('../index.js');

describe('Фильтрация по минимальной частоте', () => {
  let processor;

  beforeAll(async () => {
    processor = new WordProcessor();
    const testText = `
      The cat sat on the mat. The cat was happy.
      The dog ran in the park. The dog was tired.
      A bird flew in the sky. The bird was free.
      The mat was soft and warm.
    `;
    await processor.processText(testText);
  });

  test('должен возвращать все слова с min-freq = 1', () => {
    const words = processor.getSortedWords(1);
    expect(words.length).toBeGreaterThan(0);
  });

  test('должен фильтровать слова с min-freq = 2', () => {
    const allWords = processor.getSortedWords(1);
    const frequentWords = processor.getSortedWords(2);

    expect(frequentWords.length).toBeLessThan(allWords.length);

    // Все слова в результате должны встречаться >= 2 раз
    frequentWords.forEach(word => {
      expect(word.count).toBeGreaterThanOrEqual(2);
    });
  });

  test('должен возвращать пустой массив для очень высокой частоты', () => {
    const words = processor.getSortedWords(100);
    expect(words.length).toBe(0);
  });

  test('слова должны быть отсортированы по частоте даже после фильтрации', () => {
    const words = processor.getSortedWords(1);

    for (let i = 0; i < words.length - 1; i++) {
      expect(words[i].count).toBeGreaterThanOrEqual(words[i + 1].count);
    }
  });

  test('должен правильно считать исключенные слова', () => {
    const allWords = processor.getSortedWords(1);
    const filteredWords = processor.getSortedWords(2);

    const excluded = allWords.length - filteredWords.length;
    expect(excluded).toBeGreaterThanOrEqual(0);
  });
});

describe('Практические примеры min-freq', () => {
  test('для изучения языка (min-freq = 2-3)', async () => {
    const processor = new WordProcessor();
    const text = 'unique word appears once, but common word appears multiple times, word word word';

    await processor.processText(text);

    const allWords = processor.getSortedWords(1);
    const learningWords = processor.getSortedWords(2);

    expect(learningWords.length).toBeLessThan(allWords.length);
    expect(learningWords.every(w => w.count >= 2)).toBe(true);
  });

  test('для базового словаря (min-freq = 5)', async () => {
    const processor = new WordProcessor();
    const text = 'test test test test test common common common common common rare';

    await processor.processText(text);

    const basicVocab = processor.getSortedWords(5);

    expect(basicVocab.length).toBeGreaterThan(0);
    expect(basicVocab.every(w => w.count >= 5)).toBe(true);
  });
});

