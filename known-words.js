/**
 * Модуль для хранения и управления известными словами
 */

const fs = require('fs');
const path = require('path');

/**
 * Класс для управления известными словами
 */
class KnownWords {
  // Путь к файлу с известными словами (в корне проекта)
  static KNOWN_WORDS_FILE = path.join(__dirname, 'known-words.json');

  /**
   * Загрузить список известных слов
   * @returns {Set<string>} Set с известными словами
   */
  static load() {
    try {
      if (fs.existsSync(this.KNOWN_WORDS_FILE)) {
        const data = fs.readFileSync(this.KNOWN_WORDS_FILE, 'utf-8');
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
  static save(words) {
    const wordsArray = Array.isArray(words) ? words : Array.from(words);
    const data = {
      updatedAt: new Date().toISOString(),
      count: wordsArray.length,
      words: wordsArray.sort()
    };
    fs.writeFileSync(this.KNOWN_WORDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Добавить слова к известным
   * @param {Array<string>} words - Новые известные слова
   * @returns {Set<string>} Обновленный Set
   */
  static add(words) {
    const known = this.load();
    words.forEach(word => known.add(word.toLowerCase()));
    this.save(known);
    return known;
  }

  /**
   * Удалить слово из известных
   * @param {string} word - Слово для удаления
   * @returns {Set<string>} Обновленный Set
   */
  static remove(word) {
    const known = this.load();
    known.delete(word.toLowerCase());
    this.save(known);
    return known;
  }

  /**
   * Проверить, является ли слово известным
   * @param {string} word - Слово для проверки
   * @returns {boolean}
   */
  static isKnown(word) {
    const known = this.load();
    return known.has(word.toLowerCase());
  }

  /**
   * Получить количество известных слов
   * @returns {number}
   */
  static getWordsCount() {
    return this.load().size;
  }

  /**
   * Очистить все известные слова
   */
  static clear() {
    this.save([]);
  }
}

module.exports = KnownWords;
