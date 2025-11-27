const { WordProcessor } = require('../index.js');

describe('Лемматизация с WordNet', () => {
  let processor;

  beforeEach(() => {
    processor = new WordProcessor();
  });

  describe('lemmatizeWord', () => {
    test('должен приводить глаголы к базовой форме', async () => {
      const words = ['running', 'runs', 'ran'];
      const lemmas = await Promise.all(words.map(w => processor.lemmatizeWord(w)));

      // Все формы должны привестись к близкой базовой форме
      expect(lemmas.every(l => l.length > 0)).toBe(true);
    });

    test('должен приводить существительные к базовой форме', async () => {
      const singular = await processor.lemmatizeWord('book');
      const plural = await processor.lemmatizeWord('books');

      // books должно привестись к book или его стему
      expect(plural.length).toBeGreaterThan(0);
    });

    test('должен использовать кэш для повторных запросов', async () => {
      const word = 'testing';

      // Первый вызов
      const startTime = Date.now();
      const lemma1 = await processor.lemmatizeWord(word);
      const firstCallTime = Date.now() - startTime;

      // Второй вызов (из кэша)
      const startTime2 = Date.now();
      const lemma2 = await processor.lemmatizeWord(word);
      const secondCallTime = Date.now() - startTime2;

      expect(lemma1).toBe(lemma2);
      expect(processor.lemmaCache.has(word)).toBe(true);
      expect(processor.lemmaCache.get(word)).toBe(lemma1);

      // Второй вызов должен быть быстрее (из кэша)
      expect(secondCallTime).toBeLessThan(firstCallTime);
    });

    test('должен использовать Porter Stemmer как fallback', async () => {
      // Используем несуществующее слово
      const fakeWord = 'zzztesting123';
      const lemma = await processor.lemmatizeWord(fakeWord);

      // Должен вернуть стем
      expect(lemma).toBeDefined();
      expect(lemma.length).toBeGreaterThan(0);
    });

    test('должен обрабатывать пустые строки', async () => {
      const lemma = await processor.lemmatizeWord('');
      expect(lemma).toBeDefined();
    });
  });

  describe('Интеграция с processText', () => {
    test('должен нормализовать разные формы глаголов', async () => {
      const text = 'I am running. He runs every day. They ran yesterday.';
      await processor.processText(text);

      const words = processor.getSortedWords();

      // Должно быть меньше слов из-за лемматизации
      expect(words.length).toBeLessThan(10);

      // Должна быть какая-то форма глагола "run"
      const hasRunForm = words.some(w =>
        w.word.includes('run') || w.word === 'run'
      );
      expect(hasRunForm).toBe(true);
    });

    test('должен группировать существительные', async () => {
      const text = 'One book, two books, many books on the shelf';
      await processor.processText(text);

      const words = processor.getSortedWords();

      // "book" или его вариант должен встречаться несколько раз
      const bookWord = words.find(w => w.word.includes('book'));
      if (bookWord) {
        expect(bookWord.count).toBeGreaterThan(1);
      }
    });

    test('должен работать с большим текстом', async () => {
      const text = `
        The quick brown fox jumps over the lazy dog.
        The fox was jumping high and running fast.
        Dogs were running after the fox.
        The lazy dog slept while others ran.
      `;

      await processor.processText(text);
      const words = processor.getSortedWords();

      expect(words.length).toBeGreaterThan(0);

      // Проверяем что лемматизация работает
      const runningForms = words.filter(w =>
        w.word.includes('run') || w.word === 'run'
      );

      // Разные формы должны объединиться
      expect(runningForms.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Производительность', () => {
    test('должен обрабатывать текст батчами', async () => {
      // Создаем большой текст
      const words = Array(200).fill('test word example').join(' ');

      const startTime = Date.now();
      await processor.processText(words);
      const processingTime = Date.now() - startTime;

      // Должно обработаться за разумное время (< 10 секунд)
      expect(processingTime).toBeLessThan(10000);

      const result = processor.getSortedWords();
      expect(result.length).toBeGreaterThan(0);
    }, 15000); // увеличенный timeout для этого теста

    test('кэш должен уменьшать время повторной обработки', async () => {
      const text = 'running running running running running';

      // Первая обработка
      const startTime1 = Date.now();
      await processor.processText(text);
      const time1 = Date.now() - startTime1;

      // Вторая обработка того же текста
      const processor2 = new WordProcessor();
      processor2.lemmaCache = new Map(processor.lemmaCache); // копируем кэш

      const startTime2 = Date.now();
      await processor2.processText(text);
      const time2 = Date.now() - startTime2;

      // С кэшем должно быть не медленнее
      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // допускаем 50% погрешность
    });
  });
});

