/**
 * Тест фильтрации по минимальной частоте
 */

const { WordProcessor } = require('../index.js');

console.log('=== Тест фильтрации по минимальной частоте ===\n');

const processor = new WordProcessor();
const testText = `
  The cat sat on the mat. The cat was happy.
  The dog ran in the park. The dog was tired.
  A bird flew in the sky. The bird was free.
  The mat was soft and warm.
`;

processor.processText(testText);

console.log('📝 Тестовый текст обработан\n');

// Проверяем разные минимальные частоты
const frequencies = [1, 2, 3, 4];

frequencies.forEach(minFreq => {
  const words = processor.getSortedWords(minFreq);
  console.log(`📊 Минимальная частота >= ${minFreq}:`);
  console.log(`   Найдено слов: ${words.length}`);

  if (words.length > 0) {
    console.log('   Список слов:');
    words.forEach(w => {
      console.log(`      ${w.word} - ${w.count} раз`);
    });
  } else {
    console.log('   (нет слов с такой частотой)');
  }
  console.log();
});

// Демонстрация практического применения
console.log('💡 Практическое применение:\n');
console.log('   --min-freq 1  → Все слова (включая редкие)');
console.log('   --min-freq 2  → Слова встречающиеся минимум 2 раза');
console.log('   --min-freq 5  → Частые слова (>= 5 раз)');
console.log('   --min-freq 10 → Очень частые слова (>= 10 раз)');
console.log();

console.log('🎯 Рекомендации:');
console.log('   • Для изучения языка: --min-freq 2-3 (убирает уникальные слова)');
console.log('   • Для базового словаря: --min-freq 5-10 (только важные слова)');
console.log('   • Для анализа стиля: --min-freq 1 (все слова)');
console.log();

console.log('✅ Тест завершен!');

