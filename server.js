
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ================== НАСТРОЙКИ ==================
const MAX_LEVEL = 30;
const DEFAULT_BALANCE = 1500000;
const PENALTY_BURN_RANGE = [15, 20]; // штраф сжигает 15-20 лёгких заданий

// ================== ПУЛ ЗАДАНИЙ (ПИРАТСКАЯ ТЕМА) ==================
const taskTemplates = [
  // ⭐ 1 звезда (класс F) — 42 задания
  { difficulty: 1, texts: [
    'Приключение F1: Сделать 20 спинов в Sweet Bonanza по 400 дублонов. Отметить на карте.',
    'Приключение F2: Купить бонус в Pirate‘s Pub за 5 000 дублонов. Напиться рома.',
    'Приключение F3: Купить бонус в Gates of Olympus за 30 000 дублонов. Разгневать Зевса.',
    'Приключение F4: Выдать двум юнгам по 500 дублонов. Записать в судовой журнал.',
    'Приключение F5: Узнать, водятся ли минотавры на острове (спины по 200 дублонов).',
    'Приключение F6: 30 спинов в Coin Up (ставка 500 дублонов). Набить трюмы монетами.',
    'Приключение F7: Протестировать две подзорные трубы в Le King по 6 000 дублонов.',
    'Приключение F8: Узнать, можно ли найти клад в Wild West Gold за 4800 дублонов.',
    'Приключение F9: Купить бонус в RIP City за 8 000 дублонов, увидеть трёх котов-пиратов.',
    'Приключение F10: Купить топ-бонус в Coin Volcano за 7500 дублонов, извержение золота.',
    'Приключение F11: Исследовать пирамиду Клеопатры (бонус за 8000 дублонов).',
    'Приключение F12: Увидеть х64 в wild skullz (черепа и кости).',
    'Приключение F13: Удивите старого пирата! Купите бонус в gates of olympus и окупитесь!',
    'Приключение F14: Узнать мощность поезда Money Train 4 (бонус за 5000 дублонов).',
    'Приключение F15: Купить бонус в Money Train 3 за 5 000 дублонов, записать результаты.',
    'Приключение F16: Проверка на смелость! Поставьте 10000 дублонов в любой live игре.',
    'Приключение F17: Узнать вероятность встретить 10-ку в Crazy Time (5 ставок по 1000 дублонов).',
    'Приключение F18: Проверка на жадность! Выдать трём зрителям по 1000 дублонов.',
    'Приключение F19: Узнать шанс бонуса в RIP City, 30 спинов по 300 дублонов.',
    'Приключение F20: Купить топ-бонус в «Мумии» за 10 000 дублонов, не попасться в ловушку.',
    'Приключение F21: Узнать шанс бонуса в Dog House Multihold, 30 спинов по 500 дублонов.',
    'Приключение F22: Купить топ-бонус в Big Bass Secrets и поймать 4 скаттеров.',
    'Приключение F23: Проверить бонус в Release the Kraken за 8 000 дублонов — выпустить кракена.',
    'Приключение F24: Отдых в порту! Послушать музыку в in jazz (любой бонус).',
    'Приключение F25: Выбить обычный бонус в Le Fisherman (ставка 300 дублонов).',
    'Приключение F26: Поймать wild на 5-й барабан в Wild West Gold Megaways (бонус 6 000 дублонов).',
    'Приключение F27: 30 спинов в Wild West Gold Megaways по 400 дублонов.',
    'Приключение F28: Купить все 3 бонуски 3 Buzzing Wilds — какая лучше?',
    'Приключение F29: Ограбить вампиров! Окупить бонус в Vampy party.',
    'Приключение F30: Узнать правду о Dog House Royale Hunt — королевский ли там куш?',
    'Приключение F31: Учебная рыбалка! Выбить бонус в любом Рыбаке по 500 дублонов.',
    'Приключение F32: Нападение пиратов! Окупить бонус в Dog House Muttley Crew.',
    'Приключение F33: Протестировать два компаса в Ze Zeus за 6 000 дублонов.',
    'Приключение F34: Атака наблюдателей! Сделать бездепозитное колесо на 5 000 дублонов.',
    'Приключение F35: Атака наблюдателей! Сделать депозитное колесо на 5 000 дублонов.',
    'Приключение F36: Атака наблюдателей! Сделать депозитное колесо на 5 000 дублонов (один победитель).',
    'Приключение F37: Узнать шанс выпадения 5 в Crazy Time (три ставки по 5 000 дублонов).',
    'Приключение F38: Удача для юнги! выдать 3 000 дублонов.',
    'Приключение F39: Попробовать сахар в sugar rush (бонус за 8 000 дублонов).',
    'Приключение F40: Узнать мудрость богов! Купить бонус в Wisdom of Athena за 8000 дублонов.',
    'Приключение F41: Изучение кошачьих! поймать ретригер в Fonzo‘s Feline Fortune (бонус 4800 дублонов).'
  ]},

  // ⭐⭐ 2 звезды (класс D) — 27 заданий
  { difficulty: 2, texts: [
    'Вылазка D1: Поставить 5 000 дублонов в Crazy Time и выйти в плюс (или за борт).',
    'Вылазка D2: 20 спинов в Hot Fiesta по 625 дублонов — сосчитать пиньяты.',
    'Вылазка D3: Купить бонус в wanted Dead or a wild 2 за 8 000 дублонов — не умереть от скуки.',
    'Вылазка D4: Исследование сладких фруктов! Купить бонус в sweet bonanza — найти x10.',
    'Вылазка D5: Купить бонус в Gates of Olympus за 9600 дублонов — задобрить Зевса.',
    'Вылазка D6: Поставить 7 000 дублонов на любое число в рулетке — проверить интуицию.',
    'Вылазка D7: 20 спинов в Le Cowboy по 600 дублонов — почувствовать себя ковбоем.',
    'Вылазка D8: Выдать 3 000 дублонов одному зрителю — сделать его счастливым.',
    'Вылазка D9: Наблюдение за боем! Узнать кто круче в big bass boxing (бонус за 9600 дублонов).',
    'Вылазка D10: Купить бонус в Yeti quest за 8000 дублонов — понаблюдать за йети.',
    'Вылазка D11: Поставить 5 000 дублонов на 5 и 5 000 дублонов на 10 в Crazy Time — и окупиться.',
    'Вылазка D12: Покупать бонуски в Money Train 3 за 10 000 дублонов — доехать до станции "Прибыль".',
    'Вылазка D13: Ограбить банк! Получить x2 от суммы покупки бонуски в iron bank.',
    'Вылазка D14: Испытать удачу! Выбить топ-бонус в Мумии за 7200 дублонов (2 попытки).',
    'Вылазка D15: Испытание от призрака! Выбить 2 шторы в angel vs sinner (2 попытки).',
    'Вылазка D16: Бонус Sugar Rush за 6 400 дублонов, выбить >3 скаттеров (3 попытки).',
    'Вылазка D17: Бонус Six Six Six за 10 000 дублонов — пробить больше 10 спинов (3 попытки).',
    'Вылазка D18: Окупить бонус в Le Santa за 5 000 дублонов.',
    'Вылазка D19: Бездепозитное колесо на 7 000 дублонов (5 минут).',
    'Вылазка D20: Депозитное колесо на 5 000 дублонов (3 минуты).',
    'Вылазка D21: Депозитное колесо для зрителей 3 000 дублонов (1 минута).',
    'Вылазка D22: Наблюдение за древними. Купить бонус в Densho за 10 000 дублонов.',
    'Вылазка D23: Купить бонус в Cloud Princess за 10 000 дублонов.',
    'Вылазка D24: Пройти до x2 в любом «Рыбаке» с первой попытки.',
    'Вылазка D25: Поймать линию вилдов в Hand of Midas 2 (бонус 4 800 дублонов).',
    'Вылазка D26: Пройти до лягушки 4x4 в Wild Hop Drop (ставка 4 800 дублонов).',
    'Вылазка D27: Устроить конкурс для зрителей на 5 000 дублонов — первые 5 "мяу" получают накид.'
  ]},

  // ⭐⭐⭐ 3 звезды (класс C) — 28 заданий
  { difficulty: 3, texts: [
    'Плавание C1: 30 спинов в Gates of Olympus по 1 000 дублонов.',
    'Плавание C2: Два бонуса в Hot Fiesta за 10 000 дублонов каждый — устроить фиесту (хотя бы 1 окупной).',
    'Плавание C3: 30 спинов в Fortune of Giza (ставка 800 дублонов).',
    'Плавание C4: Две «радуги» в Le Bandit по 10000 дублонов (одна окупается).',
    'Плавание C5: 30 спинов в Minotauros по 800 дублонов.',
    'Плавание C6: 100 спинов в Gates of Olympus по 500 дублонов — битва с богами.',
    'Плавание C7: Окупить бонус в Sweet Bonanza за 16 000 дублонов.',
    'Плавание C8: Выиграть 20 000 дублонов в любом слоте за одну бонуску.',
    'Плавание C9: Поставить 20 000 дублонов на чёрное и победить.',
    'Плавание C10: 30 спинов в Undead fortune по 9 000 дублонов — избежать смерти.',
    'Плавание C11: Выдать 2 000 дублонов пяти зрителям — щедрость.',
    'Плавание C12: Бонус в Money Train 4 за 20 000 дублонов — экспресс до богатства.',
    'Плавание C13: Поймать множитель x25 в Sweet Bonanza (бонус от 8 000 дублонов).',
    'Плавание C14: Поставить 30 000 дублонов в рулетке.',
    'Плавание C15: Выбить бонус в Le King за 50 спинов (ставка от 900 дублонов).',
    'Плавание C16: Дойти до метки 4x4 в Sky Bounty (бонус от 10 000 дублонов).',
    'Плавание C17: Выбить Super Scatter в Sweet Bonanza Super Scatter (бонус от 8 000 дублонов).',
    'Плавание C18: Бонус Six Six Six, пробить >10 спинов (ставка от 10 000 дублонов).',
    'Плавание C19: Окупить бонус в Frkn Bananas (ставка 12 000 дублонов, макс.2 попытки).',
    'Плавание C20: Исследование вероятности топ-бонуса в San Quentin с рандомки (2 попытки).',
    'Плавание C21: Получить минимум 8x в Madame Destiny Megaways (бонус 9600 дублонов, 2 попытки).',
    'Плавание C22: Бонус в любом «Рыбаке», дойти до x3 (ставка от 10 000 дублонов).',
    'Плавание C23: Окупить бонус за 16 000 дублонов во Fruit Party.',
    'Плавание C24: Выбить x1000 в Big Bass Bonanza 1000 (бонус 8 000 дублонов).',
    'Плавание C25: Поймать x200 в Wild West Gold (бонус 12 000 дублонов).',
    'Плавание C26: Поймать бонус в Big Bass Splash (ставка 1 000 дублонов) за 40 спинов.',
    'Плавание C27: Поймать 2 шторы в Angel vs Sinner (бонус 10 000 дублонов).',
    'Плавание C28: Топовый бонус в Sugar Rush 1000 за 24 000 дублонов.'
  ]},

  // ⭐⭐⭐⭐ 4 звезды (класс B) — 20 заданий
  { difficulty: 4, texts: [
    'Шторм B1: Поймать бонус в Sweet Bonanza.',
    'Шторм B2: Выбить множитель x50 в Sweet Bonanza.',
    'Шторм B3: Выбить три бонуса в Le Bunny (ставка от 500 дублонов) — исследование енотов.',
    'Шторм B4: Трём зрителям выдать по 2 500 дублонов — благотворительность.',
    'Шторм B5: Особый приказ — пропуск одного задания.',
    'Шторм B6: Разыграть в Telegram бонус за 20 000 дублонов.',
    'Шторм B7: Топовый бонус в «Мумии» (ставка 20 000 дублонов) — больше 10 спинов (3 попытки).',
    'Шторм B8: Исследование динамита. Окупить бонус в fire in the hole 2 (2 попытки).',
    'Шторм B9: Поймать «под иксом» любую ставку в Crazy Time.',
    'Шторм B10: Познать милость Зевса! Поймать x20 в Gates of Olympus (бонус 9600 дублонов).',
    'Шторм B11: Найти самое рыбное место! Выбить три бонуса в одном Рыбаке.',
    'Шторм B12: 80 спинов в Le Fisherman по 900 дублонов или выбить топ-бонус.',
    'Шторм B13: Проверка на жадность! 5 зрителей получают по 2 500 дублонов.',
    'Шторм B14: Прогулка с вампирами. Выбить бонус в The Vampires 2 по 500 дублонов.',
    'Шторм B15: Ставка 50 000 дублонов в лайв-игре.',
    'Шторм B16: Купить бонус в Dog House Megaways за 20 000 дублонов и окупиться.',
    'Шторм B17: Проверка удачи! Выиграть x200 в любом слоте с первой попытки.',
    'Шторм B18: Поймать ретригер в dig dig digger (бонус от 10000 дублонов).',
    'Шторм B19: 50 спинов в Le Bandit по 1 000 дублонов и выбить любой бонус.',
    'Шторм B20: На корабль напал убийца! Выбить снайпера в Money Train 4 (ставка от 10 000 дублонов).'
  ]},

  // ⭐⭐⭐⭐⭐ 5 звезд (класс A) — 10 заданий
  { difficulty: 5, texts: [
    'Капитанское A1: Выбить множитель x100 в Sweet Bonanza.',
    'Капитанское A2: Вы — капитан! All-in в Le Bandit.',
    'Капитанское A3: All-in в Hot Fiesta.',
    'Капитанское A4: Исследование! Выбить 14 спинов в dog house royal hunt (бонус 8000 дублонов).',
    'Капитанское A5: Невозможное! Выбить Crazy Time и узнать его мощь.',
    'Капитанское A6: Выбить 2 топ-бонуса в Jelly Slice (ставка 1 000 дублонов).',
    'Капитанское A7: Поймать x100 в Sweet bonanza.',
    'Капитанское A8: Поймать ретригер в sugar rush 1000 (топ-бонус).',
    'Капитанское A9: Купить бонус в Money Train 4 за 60 000 дублонов — поезд в никуда.',
    'Капитанское A10: Создатель получает накид (личное сообщение).'
  ]},

  // ⭐⭐⭐⭐⭐⭐ 6 звезд (класс S) — 2 задания
  { difficulty: 6, texts: [
    'Проклятие S1: Пробить Hot Mode в Le cowboy (любая ставка).',
    'Проклятие S2: Выбить красную луну в The vampires 2.'
  ]}
];

// ================== ПУЛ ШТРАФОВ ==================
const penaltyTemplates = [
  'Наказание: сделать 5 приседаний',
  'Наказание: отжаться 10 раз',
  'Наказание: спеть пиратскую песню',
  'Наказание: прочитать скороговорку про корабль',
  'Наказание: показать морское животное',
  'Наказание: рассказать пиратский анекдот',
  'Наказание: написать комплимент каждому зрителю в чате',
  'Наказание: станцевать джигу',
  'Наказание: сделать 10 прыжков с криком "Йо-хо-хо!"',
  'Наказание: простоять в позе "смотровая бочка" 1 минуту',
  'Наказание: издать звук попугая',
  'Наказание: надеть пиратскую треуголку',
  'Наказание: показать пантомиму "поиск клада"',
  'Наказание: приседать, считая дублоны (30 секунд)',
  'Наказание: сделать комплимент своему кораблю',
  'Наказание: рассказать стих о море',
  'Наказание: нарисовать череп на камеру',
  'Наказание: показать 5 эмоций капитана',
  'Наказание: сделать массаж лицу (после шторма)',
  'Наказание: поморгать 30 раз подряд маяком'
];

// ================== ТРОФЕИ ==================
const trophyTypes = [
  { name: 'Золотая монета', emoji: '💰', bonus: 'multiplier+1' },
  { name: 'Череп', emoji: '💀', bonus: 'skipPenalty' },
  { name: 'Компас', emoji: '🧭', bonus: 'reroll' },
  { name: 'Подзорная труба', emoji: '🔭', bonus: 'peek' },
  { name: 'Попугай', emoji: '🦜', bonus: 'extraChat' }
];

function createInitialPool() {
  const pool = [];
  const counts = [100, 60, 30, 20, 10, 2];
  for (let star = 1; star <= 6; star++) {
    const template = taskTemplates.find(t => t.difficulty === star);
    if (!template) continue;
    for (let i = 0; i < counts[star-1]; i++) {
      const text = template.texts[i % template.texts.length];
      pool.push({
        id: `task_${Date.now()}_${Math.random()}`,
        description: text,
        difficulty: star
      });
    }
  }
  return shuffle(pool);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function applyPenalty(pool) {
  const lightTasks = pool.filter(t => t.difficulty >= 1 && t.difficulty <= 3);
  if (lightTasks.length === 0) return 0;

  const burnCount = Math.floor(Math.random() * (PENALTY_BURN_RANGE[1] - PENALTY_BURN_RANGE[0] + 1)) + PENALTY_BURN_RANGE[0];
  const actualBurn = Math.min(burnCount, lightTasks.length);

  const weights = { 1: 5, 2: 3, 3: 2 };
  const totalWeight = 10;

  let remainingLight = [...lightTasks];

  for (let i = 0; i < actualBurn; i++) {
    if (remainingLight.length === 0) break;

    const rand = Math.random() * totalWeight;
    let chosenStar = 1;
    if (rand < 5) chosenStar = 1;
    else if (rand < 8) chosenStar = 2;
    else chosenStar = 3;

    const candidates = remainingLight.filter(t => t.difficulty === chosenStar);
    if (candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length);
      const taskToBurn = candidates[idx];
      
      const poolIndex = pool.findIndex(t => t.id === taskToBurn.id);
      if (poolIndex !== -1) pool.splice(poolIndex, 1);
      
      const lightIndex = remainingLight.findIndex(t => t.id === taskToBurn.id);
      if (lightIndex !== -1) remainingLight.splice(lightIndex, 1);
    } else {
      const anyTask = remainingLight[Math.floor(Math.random() * remainingLight.length)];
      const poolIndex = pool.findIndex(t => t.id === anyTask.id);
      if (poolIndex !== -1) pool.splice(poolIndex, 1);
      const lightIndex = remainingLight.findIndex(t => t.id === anyTask.id);
      if (lightIndex !== -1) remainingLight.splice(lightIndex, 1);
    }
  }

  return actualBurn;
}

// ================== Состояние ==================
let questState = {
  level: 1,
  availableTasks: createInitialPool(),
  penaltyPool: [],
  currentCards: [],
  selectedTaskId: null,
  currentBalance: DEFAULT_BALANCE,
  balanceHistory: [],
  penaltiesLog: [],
  rank: 0,
  reputation: 0,
  inventory: []
};

questState.balanceHistory.push({
  timestamp: Date.now(),
  desc: 'Стартовый баланс',
  change: DEFAULT_BALANCE,
  balance: DEFAULT_BALANCE
});

// ================== Сервер ==================
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Клиент подключён');
  socket.emit('state', questState);

  // Успешное выполнение обычного задания
  socket.on('completeTask', (taskId, change, multiplier) => {
    const taskIndex = questState.availableTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      questState.availableTasks.splice(taskIndex, 1);
    }

    questState.currentBalance += change;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Задание выполнено (x${multiplier})`,
      change: change,
      balance: questState.currentBalance
    });

    // Повышение репутации и ранга
    questState.reputation += 1;
    if (questState.reputation >= (questState.rank + 1) * 10) {
      questState.rank = Math.min(questState.rank + 1, 4);
    }

    // Шанс на трофей 20%
    if (Math.random() < 0.2) {
      const trophy = { type: 'Сундук', count: 1 }; // Простой трофей
      questState.inventory.push(trophy);
    }

    // Увеличиваем уровень
    questState.level = Math.min(questState.level + 1, MAX_LEVEL);
    io.emit('state', questState);
  });

  // Провал обычного задания (штраф)
  socket.on('penaltyWithBalance', (taskId, newBalance) => {
    const change = newBalance - questState.currentBalance;
    questState.currentBalance = newBalance;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Штраф (не выполнено)`,
      change: change,
      balance: questState.currentBalance
    });

    // Перемещаем задание в penaltyPool
    const taskIndex = questState.availableTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const failedTask = questState.availableTasks[taskIndex];
      questState.penaltyPool.push(failedTask);
      questState.availableTasks.splice(taskIndex, 1);
    }

    // Применяем штраф: сжигаем лёгкие задания
    const burned = applyPenalty(questState.availableTasks);
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Штраф: сгорело ${burned} лёгких заданий`,
      change: 0,
      balance: questState.currentBalance
    });

    // Увеличиваем уровень
    questState.level = Math.min(questState.level + 1, MAX_LEVEL);
    io.emit('state', questState);
  });

  // Успешное выполнение штрафного задания
  socket.on('applyPenaltyTask', (taskId, newBalance) => {
    const change = newBalance - questState.currentBalance;
    questState.currentBalance = newBalance;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Наказание выполнено`,
      change: change,
      balance: questState.currentBalance
    });

    // Удаляем задание из penaltyPool
    const taskIndex = questState.penaltyPool.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      questState.penaltyPool.splice(taskIndex, 1);
    }

    // Повышение репутации и ранга (штраф тоже даёт репутацию)
    questState.reputation += 1;
    if (questState.reputation >= (questState.rank + 1) * 10) {
      questState.rank = Math.min(questState.rank + 1, 4);
    }

    // Шанс на трофей 20%
    if (Math.random() < 0.2) {
      const trophy = { type: 'Сундук', count: 1 };
      questState.inventory.push(trophy);
    }

    // Увеличиваем уровень
    questState.level = Math.min(questState.level + 1, MAX_LEVEL);
    io.emit('state', questState);
  });

  socket.on('prizeDraw', (data) => {
    const { amount, winners } = data;
    const total = amount * winners.length;
    questState.currentBalance -= total;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Розыгрыш: ${amount}₽ x ${winners.length} (${winners.join(', ')})`,
      change: -total,
      balance: questState.currentBalance
    });
    io.emit('state', questState);
  });

  socket.on('addBalance', (description, amount) => {
    questState.currentBalance += amount;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: description,
      change: amount,
      balance: questState.currentBalance
    });
    io.emit('state', questState);
  });

  socket.on('reset', (newBalance) => {
    const startBalance = (newBalance !== undefined && !isNaN(newBalance)) ? newBalance : DEFAULT_BALANCE;
    questState = {
      level: 1,
      availableTasks: createInitialPool(),
      penaltyPool: [],
      currentCards: [],
      selectedTaskId: null,
      currentBalance: startBalance,
      balanceHistory: [{
        timestamp: Date.now(),
        desc: 'Стартовый баланс',
        change: startBalance,
        balance: startBalance
      }],
      penaltiesLog: [],
      rank: 0,
      reputation: 0,
      inventory: []
    };
    io.emit('state', questState);
  });

  socket.on('loadSavedGame', (savedState) => {
    questState = {
      level: savedState.level || 1,
      availableTasks: savedState.availableTasks || createInitialPool(),
      penaltyPool: savedState.penaltyPool || [],
      currentCards: savedState.currentCards || [],
      selectedTaskId: savedState.selectedTaskId || null,
      currentBalance: savedState.currentBalance,
      balanceHistory: savedState.balanceHistory,
      penaltiesLog: savedState.penaltiesLog || [],
      rank: savedState.rank || 0,
      reputation: savedState.reputation || 0,
      inventory: savedState.inventory || []
    };
    io.emit('state', questState);
    console.log('Загружено сохранение с уровня', questState.level);
  });

  socket.on('disconnect', () => console.log('Клиент отключён'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
