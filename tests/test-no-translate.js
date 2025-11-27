/**
 * Тест функции без перевода
 */

const { WordProcessor } = require('../index.js');

console.log('=== Тест без перевода ===\n');

const processor = new WordProcessor();
const testText = `
  The quick brown fox jumps over the lazy dog.
  The dog was sleeping under a tree.
  Quick thinking saved the day.
  Running and jumping are good exercises.
  The fox runs quickly through the forest.
`;

processor.processText(testText);
const words = processor.getSortedWords();

console.log('📊 Результаты анализа:\n');
console.log(`Найдено уникальных слов: ${words.length}\n`);
console.log('Топ-10 слов по частоте:\n');

words.slice(0, 10).forEach((w, i) => {
  console.log(`   ${i + 1}. ${w.word} - ${w.count} раз`);
});

console.log('\n✅ Тест завершен!');
console.log('\nПримеры использования:');
console.log('  node index.js book.epub                     # С переводом топ-100 слов');
console.log('  node index.js book.epub 200                 # С переводом топ-200 слов');
console.log('  node index.js book.epub 0                   # Без перевода');
console.log('  node index.js book.epub --no-translate      # Без перевода');
console.log('  node index.js book.epub 100 --min-freq 5    # Только слова >= 5 раз');

