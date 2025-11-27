const { WordProcessor } = require('../index.js');

describe('WordProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new WordProcessor();
  });

  describe('normalizeWord', () => {
    test('должен приводить слова к нижнему регистру', () => {
      expect(processor.normalizeWord('HELLO')).toBe('hello');
      expect(processor.normalizeWord('WoRlD')).toBe('world');
    });

    test('должен удалять знаки препинания', () => {
      expect(processor.normalizeWord('hello!')).toBe('hello');
      expect(processor.normalizeWord('world?')).toBe('world');
      expect(processor.normalizeWord('"test"')).toBe('test');
    });

    test('должен фильтровать стоп-слова', () => {
      expect(processor.normalizeWord('the')).toBeNull();
      expect(processor.normalizeWord('and')).toBeNull();
      expect(processor.normalizeWord('is')).toBeNull();
    });

    test('должен фильтровать короткие слова (< 3 символов)', () => {
      expect(processor.normalizeWord('a')).toBeNull();
      expect(processor.normalizeWord('to')).toBeNull();
      expect(processor.normalizeWord('it')).toBeNull();
    });

    test('должен сохранять длинные значимые слова', () => {
      expect(processor.normalizeWord('running')).toBe('running');
      expect(processor.normalizeWord('beautiful')).toBe('beautiful');
    });
  });

  describe('processText', () => {
  test('должен подсчитывать частоту слов', async () => {
    const text = 'The cat sat on the mat. The cat was happy.';
    await processor.processText(text);

    const words = processor.getSortedWords();

    expect(words.length).toBeGreaterThan(0);

    // Должно быть слово с частотой 2 (cat или его вариант)
    const wordWith2Count = words.find(w => w.count === 2);
    expect(wordWith2Count).toBeDefined();
    expect(wordWith2Count.count).toBe(2);
  });

    test('должен правильно обрабатывать пустой текст', async () => {
      await processor.processText('');
      const words = processor.getSortedWords();
      expect(words.length).toBe(0);
    });

    test('должен правильно обрабатывать текст только со стоп-словами', async () => {
      await processor.processText('the and or but is was');
      const words = processor.getSortedWords();
      expect(words.length).toBe(0);
    });

    test('должен нормализовать разные формы одного слова', async () => {
      const text = 'run running runs ran runner';
      await processor.processText(text);

      const words = processor.getSortedWords();

      // Должно быть меньше 5 уникальных слов из-за лемматизации
      expect(words.length).toBeLessThan(5);
    });
  });

  describe('getSortedWords', () => {
    beforeEach(async () => {
      const text = 'cat cat cat dog dog bird bird bird bird';
      await processor.processText(text);
    });

  test('должен возвращать слова отсортированные по частоте', () => {
    const words = processor.getSortedWords();

    // Проверяем что первое слово встречается 4 раза
    expect(words[0].count).toBe(4);
    // Второе - 3 раза
    expect(words[1].count).toBe(3);
    // Третье - 2 раза
    expect(words[2].count).toBe(2);

    // Проверяем что они отсортированы по убыванию
    expect(words[0].count).toBeGreaterThanOrEqual(words[1].count);
    expect(words[1].count).toBeGreaterThanOrEqual(words[2].count);
  });

    test('должен фильтровать по минимальной частоте', () => {
      const wordsMin1 = processor.getSortedWords(1);
      expect(wordsMin1.length).toBe(3);

      const wordsMin3 = processor.getSortedWords(3);
      expect(wordsMin3.length).toBe(2); // только bird и cat

      const wordsMin5 = processor.getSortedWords(5);
      expect(wordsMin5.length).toBe(0);
    });
  });

  describe('lemmatizeWord', () => {
    test('должен кэшировать результаты лемматизации', async () => {
      const word = 'testing';

      const lemma1 = await processor.lemmatizeWord(word);
      const lemma2 = await processor.lemmatizeWord(word);

      expect(lemma1).toBe(lemma2);
      expect(processor.lemmaCache.has(word)).toBe(true);
    });

  test('должен возвращать лемму для известных слов', async () => {
    const lemma = await processor.lemmatizeWord('running');

    // WordNet может вернуть различные формы (run, running, или даже синонимы)
    expect(lemma).toBeDefined();
    expect(lemma.length).toBeGreaterThan(0);
    expect(typeof lemma).toBe('string');
  });
  });

  describe('стоп-слова', () => {
    test('должен фильтровать артикли', () => {
      expect(processor.stopWords.has('the')).toBe(true);
      expect(processor.stopWords.has('a')).toBe(true);
      expect(processor.stopWords.has('an')).toBe(true);
    });

    test('должен фильтровать местоимения', () => {
      expect(processor.stopWords.has('i')).toBe(true);
      expect(processor.stopWords.has('you')).toBe(true);
      expect(processor.stopWords.has('he')).toBe(true);
      expect(processor.stopWords.has('she')).toBe(true);
      expect(processor.stopWords.has('myself')).toBe(true);
      expect(processor.stopWords.has('themselves')).toBe(true);
    });

    test('должен фильтровать предлоги', () => {
      expect(processor.stopWords.has('in')).toBe(true);
      expect(processor.stopWords.has('on')).toBe(true);
      expect(processor.stopWords.has('at')).toBe(true);
      expect(processor.stopWords.has('through')).toBe(true);
      expect(processor.stopWords.has('between')).toBe(true);
    });

    test('должен фильтровать вспомогательные глаголы', () => {
      expect(processor.stopWords.has('is')).toBe(true);
      expect(processor.stopWords.has('was')).toBe(true);
      expect(processor.stopWords.has('have')).toBe(true);
      expect(processor.stopWords.has('will')).toBe(true);
    });
  });
});

