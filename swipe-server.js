#!/usr/bin/env node

/**
 * Сервер для Word Swiper - интерфейс сортировки слов в стиле Tinder
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { addKnownWords, loadKnownWords, getKnownWordsCount } = require('./known-words');

const PORT = process.env.PORT || 3000;

// Находим все файлы *_words.json в текущей директории и поддиректориях
function findWordFiles(dir = process.cwd()) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('_words.json')) {
        files.push(path.join(dir, entry.name));
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findWordFiles(path.join(dir, entry.name)));
      }
    }
  } catch (error) {
    console.error(`Ошибка чтения директории ${dir}:`, error.message);
  }
  
  return files;
}

// Обработка HTTP запросов
function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Главная страница
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'swipe', 'index.html');
    
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end('HTML file not found');
    }
    return;
  }

  // API: Список файлов слов
  if (url.pathname === '/api/files') {
    const files = findWordFiles();
    const relativeFiles = files.map(f => path.relative(process.cwd(), f));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(relativeFiles));
    return;
  }

  // API: Получить слова из файла
  if (url.pathname === '/api/words') {
    const fileName = url.searchParams.get('file');
    
    if (!fileName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File parameter required' }));
      return;
    }

    const filePath = path.resolve(process.cwd(), fileName);
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Фильтруем уже известные слова
      const knownWords = loadKnownWords();
      const filteredWords = (data.words || []).filter(w => 
        !knownWords.has(w.original?.toLowerCase())
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        words: filteredWords,
        totalWords: data.words?.length || 0,
        filteredOut: (data.words?.length || 0) - filteredWords.length
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API: Сохранить известные слова
  if (url.pathname === '/api/known-words' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const words = data.words || [];
        
        if (words.length > 0) {
          addKnownWords(words);
          console.log(`✓ Добавлено ${words.length} известных слов`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          added: words.length,
          total: getKnownWordsCount()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // API: Получить известные слова
  if (url.pathname === '/api/known-words' && req.method === 'GET') {
    const knownWords = loadKnownWords();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      count: knownWords.size,
      words: Array.from(knownWords).sort()
    }));
    return;
  }

  // 404 для остальных маршрутов
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Запуск сервера
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  const knownCount = getKnownWordsCount();
  
  console.log(`
🎴 Word Swiper запущен!

   Откройте в браузере: http://localhost:${PORT}
   
   📝 Известных слов: ${knownCount}
   
   Используйте стрелки ← → или кнопки для сортировки слов
   ← = Знаю (будет исключено при следующем парсинге)
   → = Оставить в списке
   
   Нажмите Ctrl+C для остановки
`);

  // Автоматически открываем браузер
  const openCommand = process.platform === 'darwin' ? 'open' :
                      process.platform === 'win32' ? 'start' : 'xdg-open';
  
  require('child_process').exec(`${openCommand} http://localhost:${PORT}`, (err) => {
    if (err) {
      console.log('   ⚠️ Не удалось открыть браузер автоматически');
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Word Swiper остановлен\n');
  process.exit(0);
});
