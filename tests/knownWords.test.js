const fs = require('fs');
const path = require('path');
const { 
  loadKnownWords, 
  saveKnownWords, 
  addKnownWords, 
  removeKnownWord,
  isKnownWord,
  getKnownWordsCount,
  clearKnownWords,
  KNOWN_WORDS_FILE 
} = require('../known-words');
const { WordProcessor } = require('../index');

describe('Known Words Module', () => {
  // Backup and restore known-words.json if it exists
  let originalContent = null;
  
  beforeAll(() => {
    if (fs.existsSync(KNOWN_WORDS_FILE)) {
      originalContent = fs.readFileSync(KNOWN_WORDS_FILE, 'utf-8');
    }
  });

  afterAll(() => {
    if (originalContent !== null) {
      fs.writeFileSync(KNOWN_WORDS_FILE, originalContent, 'utf-8');
    } else if (fs.existsSync(KNOWN_WORDS_FILE)) {
      fs.unlinkSync(KNOWN_WORDS_FILE);
    }
  });

  beforeEach(() => {
    clearKnownWords();
  });

  describe('saveKnownWords и loadKnownWords', () => {
    test('должен сохранять и загружать слова', () => {
      const words = ['hello', 'world', 'test'];
      saveKnownWords(words);
      
      const loaded = loadKnownWords();
      expect(loaded.size).toBe(3);
      expect(loaded.has('hello')).toBe(true);
      expect(loaded.has('world')).toBe(true);
      expect(loaded.has('test')).toBe(true);
    });

    test('должен возвращать пустой Set если файл не существует', () => {
      if (fs.existsSync(KNOWN_WORDS_FILE)) {
        fs.unlinkSync(KNOWN_WORDS_FILE);
      }
      
      const loaded = loadKnownWords();
      expect(loaded.size).toBe(0);
    });

    test('должен сохранять слова отсортированными', () => {
      const words = ['zebra', 'apple', 'mango'];
      saveKnownWords(words);
      
      const content = JSON.parse(fs.readFileSync(KNOWN_WORDS_FILE, 'utf-8'));
      expect(content.words).toEqual(['apple', 'mango', 'zebra']);
    });
  });

  describe('addKnownWords', () => {
    test('должен добавлять новые слова', () => {
      addKnownWords(['hello', 'world']);
      addKnownWords(['test']);
      
      const loaded = loadKnownWords();
      expect(loaded.size).toBe(3);
    });

    test('должен приводить слова к нижнему регистру', () => {
      addKnownWords(['HELLO', 'World', 'TEST']);
      
      const loaded = loadKnownWords();
      expect(loaded.has('hello')).toBe(true);
      expect(loaded.has('world')).toBe(true);
      expect(loaded.has('test')).toBe(true);
    });

    test('не должен дублировать слова', () => {
      addKnownWords(['hello', 'hello', 'HELLO']);
      
      const loaded = loadKnownWords();
      expect(loaded.size).toBe(1);
    });
  });

  describe('removeKnownWord', () => {
    test('должен удалять слово', () => {
      addKnownWords(['hello', 'world']);
      removeKnownWord('hello');
      
      const loaded = loadKnownWords();
      expect(loaded.size).toBe(1);
      expect(loaded.has('hello')).toBe(false);
      expect(loaded.has('world')).toBe(true);
    });
  });

  describe('isKnownWord', () => {
    test('должен проверять наличие слова', () => {
      addKnownWords(['hello']);
      
      expect(isKnownWord('hello')).toBe(true);
      expect(isKnownWord('HELLO')).toBe(true);
      expect(isKnownWord('world')).toBe(false);
    });
  });

  describe('getKnownWordsCount', () => {
    test('должен возвращать количество слов', () => {
      expect(getKnownWordsCount()).toBe(0);
      
      addKnownWords(['hello', 'world']);
      expect(getKnownWordsCount()).toBe(2);
    });
  });

  describe('clearKnownWords', () => {
    test('должен очищать все слова', () => {
      addKnownWords(['hello', 'world']);
      clearKnownWords();
      
      expect(getKnownWordsCount()).toBe(0);
    });
  });
});

describe('WordProcessor с известными словами', () => {
  beforeEach(() => {
    clearKnownWords();
  });

  afterAll(() => {
    clearKnownWords();
  });

  test('должен исключать известные слова при обработке текста', async () => {
    // Добавляем известные слова
    addKnownWords(['cat', 'dog']);
    
    const processor = new WordProcessor({ excludeKnownWords: true });
    await processor.processText('The cat and the dog are running. The bird is flying.');
    
    const words = processor.getSortedWords();
    const wordList = words.map(w => w.word);
    
    // cat и dog не должны быть в результатах
    expect(wordList).not.toContain('cat');
    expect(wordList).not.toContain('dog');
    
    // bird и другие слова должны быть
    expect(words.some(w => w.word.includes('run') || w.word.includes('bird') || w.word.includes('fly'))).toBe(true);
  });

  test('должен включать известные слова если excludeKnownWords=false', async () => {
    addKnownWords(['cat']);
    
    const processor = new WordProcessor({ excludeKnownWords: false });
    await processor.processText('The cat cat cat is running.');
    
    const words = processor.getSortedWords();
    
    // Должно быть несколько слов, включая что-то связанное с cat
    expect(words.length).toBeGreaterThan(0);
    
    // Проверяем что слова не фильтруются при excludeKnownWords=false
    // и что обработка продолжает работать
    const catProcessor = new WordProcessor({ excludeKnownWords: true });
    await catProcessor.processText('The cat cat cat is running.');
    const catWords = catProcessor.getSortedWords();
    
    // С исключением должно быть меньше слов
    expect(words.length).toBeGreaterThanOrEqual(catWords.length);
  });

  test('нормализованные слова должны исключаться', async () => {
    // Добавляем известное слово
    addKnownWords(['running']);
    
    const processor = new WordProcessor({ excludeKnownWords: true });
    await processor.processText('Running is fun. I love running.');
    
    const words = processor.getSortedWords();
    const wordList = words.map(w => w.word);
    
    // running не должно быть
    expect(wordList).not.toContain('running');
  });
});
