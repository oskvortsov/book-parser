const { EPub } = require('epub2');
const natural = require('natural');
const translate = require('@iamtraction/google-translate');
const fs = require('fs');
const path = require('path');
const KnownWords = require('./known-words');

// Инициализация лемматизатора для английского языка
const tokenizer = new natural.WordTokenizer();
const { PorterStemmer, WordNet } = natural;

// Инициализация WordNet для лемматизации
const wordnet = new WordNet();

// Используем WordNet для лемматизации
class WordProcessor {
  constructor(options = {}) {
    this.wordFrequency = new Map();
    this.lemmaCache = new Map(); // Кэш для леммы
    this.excludeKnownWords = options.excludeKnownWords !== false; // По умолчанию true
    this.knownWords = this.excludeKnownWords ? KnownWords.load() : new Set();
    this.stopWords = new Set([
      // Articles
      'the', 'a', 'an',

      // Conjunctions
      'and', 'or', 'but', 'nor', 'so', 'yet',

      // Prepositions (complete list)
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
      'into', 'onto', 'upon', 'about', 'above', 'across', 'after', 'against',
      'along', 'among', 'around', 'before', 'behind', 'below', 'beneath',
      'beside', 'between', 'beyond', 'during', 'except', 'inside', 'near',
      'off', 'out', 'over', 'through', 'toward', 'towards', 'under', 'until', 'til', 'till',
      'without', 'within', 'outside', 'throughout', 'via', 'per', 'plus', 'minus',
      'despite', 'concerning', 'considering', 'regarding', 'including', 'excluding',
      'following', 'past', 'since', 'unlike', 'like', 'worth',
      // Compound prepositions
      'according', 'because', 'instead', 'ahead', 'apart', 'aside', 'away',

      // Auxiliary verbs
      'is', 'was', 'are', 'were', 'been', 'be', 'being',
      'have', 'has', 'had', 'having',
      'do', 'does', 'did', 'doing', 'done',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',

      // Personal pronouns (subject)
      'i', 'you', 'he', 'she', 'it', 'we', 'they',

      // Personal pronouns (object)
      'me', 'him', 'her', 'us', 'them',

      // Possessive pronouns
      'my', 'mine', 'your', 'yours', 'his', 'her', 'hers', 'its', 'our', 'ours', 'their', 'theirs',

      // Reflexive pronouns
      'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',

      // Demonstrative pronouns
      'this', 'that', 'these', 'those',

      // Interrogative pronouns
      'who', 'whom', 'whose', 'what', 'which',

      // Relative pronouns
      'whoever', 'whomever', 'whichever', 'whatever',

      // Indefinite pronouns
      'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'both',
      'each', 'either', 'everybody', 'everyone', 'everything',
      'few', 'many', 'most', 'much', 'neither', 'nobody', 'none', 'nothing',
      'one', 'other', 'others', 'several', 'some', 'somebody', 'someone', 'something',

      // Adverbs (common)
      'when', 'where', 'why', 'how', 'then', 'there', 'here',
      'now', 'just', 'only', 'very', 'too', 'also', 'well',
      'than', 'such', 'even', 'still', 'yet',

      // Determiners
      'every', 'own', 'same',

      // Negation
      'no', 'not', 'never',

      // Contractions (stems)
      's', 't', 'don', 've', 'll', 'd', 're', 'm'
    ]);
  }

  // Лемматизация слова с использованием WordNet
  async lemmatizeWord(word) {
    // Проверяем кэш
    if (this.lemmaCache.has(word)) {
      return this.lemmaCache.get(word);
    }

    return new Promise((resolve) => {
      // Пробуем найти лемму через WordNet
      wordnet.lookup(word, (results) => {
        let lemma;

        if (results && results.length > 0) {
          // Берем первый результат (обычно самый частый)
          lemma = results[0].lemma || word;
        } else {
          // Если WordNet не нашел, используем Porter Stemmer как fallback
          lemma = PorterStemmer.stem(word);
        }

        // Сохраняем в кэш
        this.lemmaCache.set(word, lemma);
        resolve(lemma);
      });
    });
  }

  // Нормализация слова: приведение к нижнему регистру и очистка
  normalizeWord(word) {
    // Приводим к нижнему регистру
    let normalized = word.toLowerCase();

    // Удаляем знаки препинания
    normalized = normalized.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();

    // Пропускаем стоп-слова и короткие слова
    if (this.stopWords.has(normalized) || normalized.length < 3) {
      return null;
    }

    // Пропускаем известные слова (если включена фильтрация)
    if (this.excludeKnownWords && this.knownWords.has(normalized)) {
      return null;
    }

    return normalized;
  }

  // Обработка текста (асинхронная)
  async processText(text) {
    const words = tokenizer.tokenize(text);

    // Обрабатываем слова батчами для производительности
    const batchSize = 300;

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);

      const normalizeTasks = batch.map(async (word) => {
        const normalized = this.normalizeWord(word);

        if (normalized) {
          // Лемматизируем слово
          const lemma = await this.lemmatizeWord(normalized);
          const count = this.wordFrequency.get(lemma) || 0;

          // Пропускаем известные слова (если включена фильтрация)
          const isKnownWord = this.excludeKnownWords && this.knownWords.has(lemma);
          if (isKnownWord) {
            return
          }

          this.wordFrequency.set(lemma, count + 1);
        }
      })

      await Promise.all(normalizeTasks);
    }
  }

  // Получение отсортированного списка слов по частоте
  getSortedWords(minFrequency = 1) {
    return Array.from(this.wordFrequency.entries())
      .filter(([, count]) => count >= minFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));
  }
}

// Парсинг EPUB книги
async function parseEpubBook(epubPath, options = {}) {
  return new Promise((resolve, reject) => {
    const epub = new EPub(epubPath);

    epub.on('error', reject);

    epub.on('end', async () => {
      const processor = new WordProcessor(options);
      const chapters = epub.flow;

      console.log(`📖 Найдено глав: ${chapters.length}`);

      for (let i = 0; i < chapters.length; i++) {
        try {
          const chapterData = await new Promise((res, rej) => {
            epub.getChapter(chapters[i].id, (error, text) => {
              if (error) rej(error);
              else res(text);
            });
          });

          // Удаляем HTML теги
          const cleanText = chapterData.replace(/<[^>]*>/g, ' ');
          await processor.processText(cleanText);

          console.log(`✓ Обработана глава ${i + 1}/${chapters.length}`);
        } catch (error) {
          console.error(`Ошибка при чтении главы ${i + 1}:`, error.message);
        }
      }

      resolve(processor);
    });

    epub.parse();
  });
}

// Перевод слов с английского на русский
async function translateWords(words, maxWords = 100) {
  console.log(`\n🔤 Начинаем перевод топ-${maxWords} слов...`);
  const translatedWords = [];

  for (let i = 0; i < Math.min(words.length, maxWords); i++) {
    try {
      const result = await translate(words[i].word, { from: 'en', to: 'ru' });
      translatedWords.push({
        original: words[i].word,
        translation: result.text,
        count: words[i].count
      });

      if ((i + 1) % 10 === 0) {
        console.log(`✓ Переведено ${i + 1}/${Math.min(words.length, maxWords)} слов`);
      }

      // Небольшая задержка, чтобы не перегружать API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Ошибка перевода "${words[i].word}":`, error.message);
      translatedWords.push({
        original: words[i].word,
        translation: '(ошибка перевода)',
        count: words[i].count
      });
    }
  }

  return translatedWords;
}

// Сохранение результатов
function saveResults(words, outputPath) {
  const results = {
    totalUniqueWords: words.length,
    totalWordCount: words.reduce((sum, w) => sum + w.count, 0),
    generatedAt: new Date().toISOString(),
    words: words
  };

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n💾 Результаты сохранены в: ${outputPath}`);

  // Также создаем простой текстовый файл для удобного просмотра
  const textOutput = words
    .map((w, i) => {
      if (w.translation) {
        return `${i + 1}. ${w.original} (${w.translation}) - ${w.count} раз`;
      } else {
        return `${i + 1}. ${w.original} - ${w.count} раз`;
      }
    })
    .join('\n');

  const textPath = outputPath.replace('.json', '.txt');
  fs.writeFileSync(textPath, textOutput, 'utf-8');
  console.log(`📄 Текстовая версия: ${textPath}`);
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {

  console.log(`
📚  Парсер EPUB книг с подсчетом частоты слов

    Использование:
      node index.js <путь_к_epub_файлу> [количество_слов_для_перевода] [опции]
    
    Опции:
      --no-translate              Отключить перевод (быстрый режим)
      --min-freq <число>          Минимальная частота слова (по умолчанию: 1)
      --include-known             Включить известные слова (по умолчанию: исключены)
    
    Примеры:
      node index.js ./book.epub                         # Переводит топ-100 слов
      node index.js ./book.epub 200                     # Переводит топ-200 слов
      node index.js ./book.epub 0                       # Без перевода
      node index.js ./book.epub --no-translate          # Без перевода
      node index.js ./book.epub 100 --min-freq 5        # Только слова встречающиеся >= 5 раз
      node index.js ./book.epub --no-translate --min-freq 10  # Без перевода, слова >= 10 раз
      node index.js ./book.epub --include-known         # Не исключать известные слова
    
    Управление известными словами:
      npm run swipe                # Открыть страницу для сортировки слов (Tinder-стиль)
    
    Что делает программа:
      1. Парсит EPUB файл
      2. Извлекает весь текст
      3. Нормализует слова (приводит к базовой форме)
      4. Подсчитывает частоту каждого слова
      5. Исключает известные слова из known-words.json
      6. Фильтрует по минимальной частоте (опционально)
      7. Сортирует по частоте встречаемости
      8. Переводит топ N слов с английского на русский (опционально)
      9. Сохраняет результаты в JSON и TXT файлы
  `);

    process.exit(1);
  }

  const epubPath = args[0];

  // Проверяем флаг --no-translate
  const noTranslate = args.includes('--no-translate');

  // Проверяем флаг --include-known
  const includeKnown = args.includes('--include-known');
  const excludeKnownWords = !includeKnown;

  // Получаем минимальную частоту слов
  let minFrequency = 1;
  const minFreqIndex = args.indexOf('--min-freq');

  if (minFreqIndex !== -1 && args[minFreqIndex + 1]) {
    minFrequency = parseInt(args[minFreqIndex + 1]);

    if (isNaN(minFrequency) || minFrequency < 1) {
      console.error(`❌ Неверное значение для --min-freq: ${args[minFreqIndex + 1]}`);
      console.error(`   Должно быть положительное число >= 1`);
      process.exit(1);
    }
  }

  // Получаем количество слов для перевода
  let maxTranslateWords = 100;
  if (args[1] && args[1] !== '--no-translate' && !args[1].startsWith('--')) {
    maxTranslateWords = parseInt(args[1]);
  }

  // Если указано 0 или --no-translate, отключаем перевод
  const shouldTranslate = !noTranslate && maxTranslateWords > 0;

  if (!fs.existsSync(epubPath)) {
    console.error(`❌ Файл не найден: ${epubPath}`);
    process.exit(1);
  }

  try {
    const knownWordsCount = KnownWords.getWordsCount();
    console.log(`\n🚀 Начинаем обработку: ${epubPath}`);
    if (knownWordsCount > 0 && excludeKnownWords) {
      console.log(`📝 Исключаем ${knownWordsCount} известных слов из known-words.json\n`);
    }

    // Парсим книгу
    const processor = await parseEpubBook(epubPath, { excludeKnownWords });
    const allWords = processor.getSortedWords(1); // Все слова для статистики
    const sortedWords = processor.getSortedWords(minFrequency); // Отфильтрованные слова

    console.log(`\n📊 Статистика:`);
    console.log(`   Всего уникальных слов: ${allWords.length}`);

    if (minFrequency > 1) {
      console.log(`   Слов с частотой >= ${minFrequency}: ${sortedWords.length}`);
      console.log(`   Исключено редких слов: ${allWords.length - sortedWords.length}`);
    }

    console.log(`   Всего слов в книге: ${allWords.reduce((sum, w) => sum + w.count, 0)}`);
    console.log(`\n🔝 Топ-10 самых частых слов:`);
    sortedWords.slice(0, 10).forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.word} - ${w.count} раз`);
    });

    // Переводим слова (если включен перевод)
    let finalWords;
    if (shouldTranslate) {
      finalWords = await translateWords(sortedWords, maxTranslateWords);
    } else {
      console.log(`\n⏭️  Перевод пропущен`);
      // Форматируем слова без перевода
      finalWords = sortedWords.map(w => ({
        original: w.word,
        translation: null,
        count: w.count
      }));
    }

    // Сохраняем результаты
    const bookName = path.basename(epubPath, '.epub');
    const outputPath = path.join(
      path.dirname(epubPath),
      `${bookName}_words.json`
    );

    saveResults(finalWords, outputPath);

    console.log(`\n✅ Готово!`);
  } catch (error) {
    console.error(`\n❌ Ошибка:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск программы
if (require.main === module) {
  main();
}

module.exports = { parseEpubBook, WordProcessor, translateWords };

