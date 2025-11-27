const { WordProcessor } = require('../index.js');

describe('Фильтрация предлогов и стоп-слов', () => {
  let processor;

  beforeEach(() => {
    processor = new WordProcessor();
  });

  describe('Предлоги', () => {
    test('должен фильтровать базовые предлоги', async () => {
      const text = 'The cat sat on the mat in the house';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('on');
      expect(wordTexts).not.toContain('in');
    });

    test('должен фильтровать составные предлоги', async () => {
      const text = 'He walked through the park during the evening';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('through');
      expect(wordTexts).not.toContain('during');
    });

    test('должен фильтровать направленные предлоги', async () => {
      const text = 'From here toward the mountains via train';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('from');
      expect(wordTexts).not.toContain('toward');
      expect(wordTexts).not.toContain('via');
    });

    test('должен фильтровать пространственные предлоги', async () => {
      const text = 'The book is between the lamp and beside the table';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('between');
      expect(wordTexts).not.toContain('beside');
    });
  });

  describe('Местоимения', () => {
    test('должен фильтровать личные местоимения', async () => {
      const text = 'I saw him and she saw me';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('him');
      expect(wordTexts).not.toContain('she');
      expect(wordTexts).not.toContain('me');
    });

    test('должен фильтровать притяжательные местоимения', async () => {
      const text = 'my book your pen his car her house';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('my');
      expect(wordTexts).not.toContain('your');
      expect(wordTexts).not.toContain('his');
      expect(wordTexts).not.toContain('her');
    });

    test('должен фильтровать возвратные местоимения', async () => {
      const text = 'I did it myself and they did it themselves';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('myself');
      expect(wordTexts).not.toContain('themselves');
    });

    test('должен фильтровать неопределенные местоимения', async () => {
      const text = 'somebody said something about everyone and everything';
      await processor.processText(text);

      const words = processor.getSortedWords();
      const wordTexts = words.map(w => w.word);

      expect(wordTexts).not.toContain('somebody');
      expect(wordTexts).not.toContain('something');
      expect(wordTexts).not.toContain('everyone');
      expect(wordTexts).not.toContain('everything');
    });
  });

  describe('Комплексный тест', () => {
    test('должен оставлять только значимые слова', async () => {
      const text = `
        The quick brown fox jumps over the lazy dog.
        He ran through the forest with his friends.
        They were looking at the beautiful sunset.
      `;

      await processor.processText(text);
      const words = processor.getSortedWords();

      // Должны остаться только существительные, прилагательные, значимые глаголы
      const significantWords = ['fox', 'dog', 'forest', 'friend', 'sunset', 'quick', 'brown', 'lazy', 'beautiful'];
      const wordTexts = words.map(w => w.word);

      // Хотя бы некоторые значимые слова должны присутствовать (с учетом лемматизации)
      const hasSignificantWords = significantWords.some(word =>
        wordTexts.some(w => w.includes(word.substring(0, 4)))
      );

      expect(hasSignificantWords).toBe(true);

      // Стоп-слова не должны присутствовать
      expect(wordTexts).not.toContain('the');
      expect(wordTexts).not.toContain('with');
      expect(wordTexts).not.toContain('his');
      expect(wordTexts).not.toContain('they');
      expect(wordTexts).not.toContain('were');
    });
  });

  describe('Проверка списка стоп-слов', () => {
    test('список стоп-слов должен содержать все категории', () => {
      // Артикли
      expect(processor.stopWords.size).toBeGreaterThan(50);

      // Проверяем наличие разных категорий
      const categories = {
        articles: ['the', 'a', 'an'],
        conjunctions: ['and', 'or', 'but'],
        prepositions: ['in', 'on', 'at', 'through'],
        pronouns: ['i', 'you', 'he', 'she', 'myself', 'themselves'],
        auxiliaries: ['is', 'was', 'have', 'will']
      };

      Object.entries(categories).forEach(([category, words]) => {
        words.forEach(word => {
          expect(processor.stopWords.has(word)).toBe(true);
        });
      });
    });
  });
});

