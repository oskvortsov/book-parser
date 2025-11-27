/**
 * Демонстрация работы нормализации и лемматизации
 */

const { WordProcessor } = require('../index.js');

console.log('=== Демонстрация нормализации слов ===\n');

// Создаем процессор
const processor = new WordProcessor();

// Примеры текстов для демонстрации
const examples = [
  {
    title: 'Разные формы одного глагола',
    text: 'running runs ran runner runners'
  },
  {
    title: 'Сравнительные степени',
    text: 'good better best bad worse worst'
  },
  {
    title: 'Различный регистр',
    text: 'Book BOOK book BooK books BOOKS'
  },
  {
    title: 'С знаками препинания',
    text: 'Hello! Hello? Hello. "Hello" Hello, hello;'
  },
  {
    title: 'Временные формы',
    text: 'looking looked looks look'
  }
];

examples.forEach(example => {
  console.log(`📝 ${example.title}:`);
  console.log(`   Исходный текст: "${example.text}"`);

  const testProcessor = new WordProcessor();
  testProcessor.processText(example.text);
  const words = testProcessor.getSortedWords();

  console.log('   Результат нормализации:');
  words.forEach(w => {
    console.log(`      ${w.word} → встречается ${w.count} раз`);
  });
  console.log();
});

// Демонстрация фильтрации стоп-слов
console.log('=== Фильтрация стоп-слов ===\n');
const textWithStopWords = 'The cat and the dog were running in the park with a ball';
console.log(`📝 Исходный текст: "${textWithStopWords}"`);

const stopProcessor = new WordProcessor();
stopProcessor.processText(textWithStopWords);
const filteredWords = stopProcessor.getSortedWords();

console.log('   Оставшиеся слова (стоп-слова удалены):');
filteredWords.forEach(w => {
  console.log(`      ${w.word}`);
});

// Статистика
console.log('\n=== Статистика ===');
const allWords = textWithStopWords.split(' ');
console.log(`   Всего слов в тексте: ${allWords.length}`);
console.log(`   Уникальных слов после фильтрации: ${filteredWords.length}`);
console.log(`   Удалено стоп-слов: ${allWords.length - filteredWords.reduce((s, w) => s + w.count, 0)}`);

console.log('\n✅ Демонстрация завершена!');

