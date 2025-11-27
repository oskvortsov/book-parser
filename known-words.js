/**
 * Модуль для хранения и управления известными словами
 */

const fs = require('fs');
const path = require('path');

// Путь к файлу с известными словами (в корне проекта)
const KNOWN_WORDS_FILE = path.join(__dirname, 'known-words.json');

/**
 * Загрузить список известных слов
 * @returns {Set<string>} Set с известными словами
 */
function loadKnownWords() {
  try {
    if (fs.existsSync(KNOWN_WORDS_FILE)) {
      const data = fs.readFileSync(KNOWN_WORDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return new Set(parsed.words || []);
    }
  } catch (error) {
    console.warn('⚠️ Не удалось загрузить known-words.json:', error.message);
  }
  return new Set();
}

/**
 * Сохранить список известных слов
 * @param {Set<string>|Array<string>} words - Слова для сохранения
 */
function saveKnownWords(words) {
  const wordsArray = Array.isArray(words) ? words : Array.from(words);
  const data = {
    updatedAt: new Date().toISOString(),
    count: wordsArray.length,
    words: wordsArray.sort()
  };
  fs.writeFileSync(KNOWN_WORDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Добавить слова к известным
 * @param {Array<string>} words - Новые известные слова
 * @returns {Set<string>} Обновленный Set
 */
function addKnownWords(words) {
  const known = loadKnownWords();
  words.forEach(word => known.add(word.toLowerCase()));
  saveKnownWords(known);
  return known;
}

/**
 * Удалить слово из известных
 * @param {string} word - Слово для удаления
 * @returns {Set<string>} Обновленный Set
 */
function removeKnownWord(word) {
  const known = loadKnownWords();
  known.delete(word.toLowerCase());
  saveKnownWords(known);
  return known;
}

/**
 * Проверить, является ли слово известным
 * @param {string} word - Слово для проверки
 * @returns {boolean}
 */
function isKnownWord(word) {
  const known = loadKnownWords();
  return known.has(word.toLowerCase());
}

/**
 * Получить количество известных слов
 * @returns {number}
 */
function getKnownWordsCount() {
  return loadKnownWords().size;
}

/**
 * Очистить все известные слова
 */
function clearKnownWords() {
  saveKnownWords([]);
}

module.exports = {
  loadKnownWords,
  saveKnownWords,
  addKnownWords,
  removeKnownWord,
  isKnownWord,
  getKnownWordsCount,
  clearKnownWords,
  KNOWN_WORDS_FILE
};
