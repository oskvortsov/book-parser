/**
 * Пример использования book-parser как модуля
 */

const { parseEpubBook, WordProcessor, translateWords } = require('../index.js');

async function exampleUsage() {
  try {
    // Пример 1: Базовое использование
    console.log('=== Пример 1: Парсинг книги ===');
    const processor = await parseEpubBook('./example.epub');
    const words = processor.getSortedWords();

    console.log(`\nНайдено уникальных слов: ${words.length}`);
    console.log('Топ-5 слов:');
    words.slice(0, 5).forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.word} - ${w.count} раз`);
    });

    // Пример 2: Перевод топ-10 слов
    console.log('\n=== Пример 2: Перевод слов ===');
    const translated = await translateWords(words, 10);

    console.log('\nПереведенные слова:');
    translated.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.original} → ${w.translation} (${w.count})`);
    });

    // Пример 3: Собственная обработка
    console.log('\n=== Пример 3: Кастомная обработка ===');
    const customProcessor = new WordProcessor();
    customProcessor.processText('Running runs runner. Better best. Looking looked looks.');

    const customWords = customProcessor.getSortedWords();
    console.log('\nРезультат нормализации:');
    customWords.forEach(w => {
      console.log(`  ${w.word} - ${w.count}`);
    });

  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

// Запуск примера (раскомментируйте, если есть тестовый epub файл)
// exampleUsage();

module.exports = { exampleUsage };

