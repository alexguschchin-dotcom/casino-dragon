const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_LEVEL = 30;
const DEFAULT_BALANCE = 1500000;
const RANKS = ['Юнга', 'Матрос', 'Боцман', 'Капитан', 'Адмирал'];
const REPUTATION_PER_RANK = 10;

// ================== ПУЛ ЗАДАНИЙ ==================
const taskTemplates = [
  // ⭐ 1 звезда (класс F) — 42 задания
  { difficulty: 1, texts: [
    'Приключение F1: Сделать 20 спинов в Pirate Bonanza 2 по 3000 дублонов.',
    'Приключение F2: Купить бонус в Pirate‘s Pub за 50 000 дублонов. Напиться рома.',
    'Приключение F3: Купить обычный бонус в Pirate Bonanza 2 за 50 000 дублонов.',
    'Приключение F4: Выдать двум юнгам по 3000 дублонов. Записать в судовой журнал.',
    'Приключение F5: Узнать, водятся ли минотавры на острове 40 спинов по 1000 дублонов.',
    'Приключение F6: Купить топовый бонус Pirate Bonanza 2 за 75 000 дублонов.',
    'Приключение F7: Сделать 40 спинов по 1000 дублонов в Pirate gold delux.',
    'Приключение F8: Купить бонус в Pirate gold deluxe за 70 000 дублонов.',
    'Приключение F9: Отправляемся на рубалку! Выбить бонус в big bass float my boat по 1000 дублонов.',
    'Приключение F10: Исследовать воды амазонки! Купить два бонуса в big bass amazon xtreme за 50000 дублонов.',
    'Приключение F11: В ходе плавания мы встретили викингов! Победить их окупив бонус в Le viking за 60 000 дублонов.',
    'Приключение F12: Увидеть х64 в wild skullz (черепа и кости).',
    'Приключение F13: Удивите старого пирата! Купите бонус в Pirate‘s Pub и окупитесь!',
    'Приключение F14: В ходе путешествия мы наткнулись на группу бандитов! Победить их купив 2 бонуса в Duel at Dawn за 40000 дублонов.',
    'Приключение F15: Наш корабль сломался! Отправиться в путишествие до следующего отсрова на поезде. Купить Money Train 3 за 50 000 дублонов.',
    'Приключение F16: Карточная игра! Дважды победить своего соперника в blackjack (рука 40000).',
    'Приключение F17: На пиратском судне появилась рулетка! Выбить правильное число в рулетке и доказать что ты настоящий пират.',
    'Приключение F18: Жадные содаты забрали вашего юнгу! Выдать 5-м солдатам по 2000 дублонов.',
    'Приключение F19: В ходе плавания вы натыкаетесь на поселение вампиров! Показать им кто главный окупив бонус в Vampy party (от 30000 дублонов).',
    'Приключение F20: Собака на пиратском корабле! поймать ее и пустить на шашлык окупив бонус в The dog house muttlet crew за 50000 дублонов.',
    'Приключение F21: Вам скучно! сделайте 30 спинов в Dog House Multihold по 2000 дублонов.',
    'Приключение F22: Купить топ-бонус в Big Bass Secrets и поймать 4 скаттеров.',
    'Приключение F23: Выпустить кракена! Поймать функцию в Release the Kraken по ставке 1000 дублонов.',
    'Приключение F24: Отдых в порту! Послушать музыку в in jazz (любой бонус).',
    'Приключение F25: Рыбалка вместе в енотом! Выбить обычный бонус в Le Fisherman (ставка 2000 дублонов).',
    'Приключение F26: Поймать wild на 5-й барабан в Wild West Gold Megaways (бонус 50 000 дублонов).',
    'Приключение F27: 30 спинов в Wild West Gold Megaways по 1000 дублонов.',
    'Приключение F28: Купить два бонуса в Jawsome Pirates за 40 000 дублонов',
    'Приключение F29: Вы посетили дом удовольствий! проведите 3 минуты в Geisha делая то что вам хочется.',
    'Приключение F30: Узнать правду о Dog House Royale Hunt — королевский ли там куш?',
    'Приключение F31: Учебная рыбалка! Выбить бонус в любом Рыбаке по 2000 дублонов.',
    'Приключение F32: Ограбить грабницу фараона! Окупите бонус в le Pharaon за 40 000 дублонов.',
    'Приключение F33: За ваши грехи на вас обратил вниманние  Зевс! Избегите его гнева не окупив бонус в Gates of olympus.',
    'Приключение F34: Атака наблюдателей! Сделать бездепозитное колесо на 10 000 дублонов.',
    'Приключение F35: Атака наблюдателей! Сделать депозитное колесо на 15 000 дублонов.',
    'Приключение F36: Атака наблюдателей! Сделать депозитное колесо на 10 000 дублонов (два победителя).',
    'Приключение F37: Вы попали на древний остров! Сделайте 30 спинов по 1000 дублонов в Medusa\'s stone.',
    'Приключение F38: Удача для юнги! выдать 5 000 дублонов двум юнгам.',
    'Приключение F39: Вы тайный любитель сладкого! Купите бонус в sugar rush за 50000 рублей.',
    'Приключение F40: Поиграйте с котом пиратом! Купите два бонуса за 40 000 дублонов в Hot ross.',
    'Приключение F41: Даже пират должен учиться! Проведите 2 минуты в Book of time.'
  ]},

  // ⭐⭐ 2 звезды (класс D) — 27 заданий
  { difficulty: 2, texts: [
    'Вылазка D1: Поставить 50 000 дублонов в Crazy Time и выйти в плюс (или за борт).',
    'Вылазка D2: Окупить бонус в Pirate‘s Pub (ставка от 30 000 дублонов).',
    'Вылазка D3: Напиться пива! Купить 3 бонуса в Benny the Beer за 90 000 дублонов.',
    'Вылазка D4: Выбить бонус в Benny the Beer по 2000 дублонов.',
    'Вылазка D5: Наш корабль сломался! Отправиться в путишествие до следующего острова на поезде. Купить Money Train 3 за 75 000 дублонов.',
    'Вылазка D6: Наш корабль сломался! Отправиться в путишествие до следующего острова на поезде. Купить Money Train 4 за 75 000 дублонов.',
    'Вылазка D7: Отомстить ковбоям что гнали нас с суши на море! Окупить два бонуса в le cowboy за 75 000 дублонов.',
    'Вылазка D8: Выдать 5 000 дублонов одному зрителю — сделать его счастливым.',
    'Вылазка D9: Наблюдение за боем! Узнать какой боец лучше в big bass boxing (бонус за 50000 дублонов).',
    'Вылазка D10: Купить две радуги в Le cowboy за 75 000 дублонов.',
    'Вылазка D11: Поставить 40 000 дублонов на 5 и 30 000 дублонов на 10 в Crazy Time.',
    'Вылазка D12: Вам понравилось путешествие в поезде! Покупать бонуски в Money Train 3 за 50 000 дублонов пока не почувствуешь золотые монеты.',
    'Вылазка D13: Выбить бонус в Pirate‘s Pub (ставка от 1000).',
    'Вылазка D14: Купить бонус в Pirate Bonanza за 75 000 и окупиться (3 попытки).',
    'Вылазка D15: Испытание от призрака! Выбить 2 шторы в angel vs sinner (2 попытки).',
    'Вылазка D16: Выбить бонус в Pirate Bonanza по ставке 2 000 дублонов.',
    'Вылазка D17: Бонус Six Six Six за 50 000 дублонов — пробить больше 10 спинов (3 попытки).',
    'Вылазка D18: Даже пираты хотят подарков! Окупить бонус в Le Santa за 50 000 дублонов в х2.',
    'Вылазка D19: Бездепозитное колесо на 20 000 дублонов (5 минут).',
    'Вылазка D20: Депозитное колесо на 25 000 дублонов (3 минуты).',
    'Вылазка D21: Депозитное колесо для зрителей 20 000 дублонов (1 минута).',
    'Вылазка D22: Наблюдение за древними. Купить бонус в Densho за 10 000 дублонов.',
    'Вылазка D23: Вам приглянулась принцесса! Попробуйте забрать ее из замка выбив бонус за 30 спинов в  Cloud Princess по ставке 3000.',
    'Вылазка D24: Мы попали в шторим! Выбраться из него купив 3 бонуски в big bass halloween (ставка от 50 000).',
    'Вылазка D25: Охота за сокровищами! Выбить дракона на любом барабане в Dragon Money Treasures.',
    'Вылазка D26: В ходе путешествия мы попали на неизвестный остров на котором была пирамида! Выбить больше 10 спинов в Мумии топовой бонуске от 50 000.',
    'Вылазка D27: Устроить конкурс для зрителей на 10 000 дублонов — первые 5 "йо-хо-хо" получают накид.'
  ]},

  // ⭐⭐⭐ 3 звезды (класс C) — 28 заданий
  { difficulty: 3, texts: [
    'Плавание C1: Поймать 4 вилда в линию в Pirates pub в бонуске от 50 000.',
    'Плавание C2: Испытание от короля моря! Окупите бонус в Realese the kraken за 100 000.',
    'Плавание C3: Испытать удачи короля пиратов! Выбить бонус в fortune of giza (Ставка от 2000).',
    'Плавание C4: Нападение осьминога! Отбейтесь от него купив 2 бонуски в Realese the kraken megaways за 100 000.',
    'Плавание C5: На неизвестной отсрове вы обнаруживаете дом Минотавра, вы потривожили его сон! Пусть он устанет прыгнув в общем 50 раз в бонуске за 60 000.',
    'Плавание C6: 100 спинов в Gates of Olympus по 4000 дублонов — битва с богами.',
    'Плавание C7: Наш корабль сломался! Отправиться в путишествие до следующего острова на поезде. Купить Money Train 3 за 100 000 дублонов и окупиться.',
    'Плавание C8: Выиграть 200 000 дублонов в любом слоте за одну бонуску.',
    'Плавание C9: Поставить 70 000 дублонов на чёрное и победить.',
    'Плавание C10: 30 спинов в Undead fortune по 9 000 дублонов — избежать смерти.',
    'Плавание C11: Солдаты захватили вашего Штурмана! Без него нельзя продолжить путешествие! Выдать 5 солдатам по 5 000 дублонов.',
    'Плавание C12: Наш корабль сломался! Отправиться в путишествие до следующего острова на поезде. Купить Money Train 4 за 100 000 дублонов и окупиться.',
    'Плавание C13: Вы наткнулись не безумца что хочет взорвать ваш корабль! Не дайте ему это сделать окупив бонус в Fire in the Hole 2 (ставка от 80к).',
    'Плавание C14: Выбить топовый бонус с обычки в Big Bass Secrets of the Golden Lake по любой ставке.',
    'Плавание C15: Наказать короля енотов! Выбить бонус в Le King за 50 спинов (ставка от 2000 дублонов).',
    'Плавание C16: Дойти до метки 4x4 в Sky Bounty (бонус от 70 000 дублонов).',
    'Плавание C17: Ваша любовь к сладкому проявилась! Купить 2 топовых бонуса в sugar rush 1000 (ставка от 100 000).',
    'Плавание C18: Бонус Six Six Six, пробить >10 спинов (ставка от 10 000 дублонов).',
    'Плавание C19: Окупить бонус в Frkn Bananas в бонуске за 80 000 (макс.2 попытки).',
    'Плавание C20: Выдать трем зрителям по 7500 дублонов.',
    'Плавание C21: Получить минимум 8x в Madame Destiny Megaways в бонусе от 50 000 (2 попытки).',
    'Плавание C22: Дойти до х3 в Big Bass Mission Fishin в бонуске от 50 000.',
    'Плавание C23: Выдать четырем зрителям по 6000 дублонов.',
    'Плавание C24: Выбить x1000 в Big Bass Bonanza 1000 (бонус 40 000 дублонов).',
    'Плавание C25: Поймать x200 в Wild West Gold (бонус 100 000 дублонов).',
    'Плавание C26: Сделать депозитное колесо для больших деперов на 5 минут.',
    'Плавание C27: Сделать депозитное колесо для среднех деперов на 10 минут.',
    'Плавание C28: Сделать бездепозитное колесо для на 3 минуты только для тех кто на стриме.'
  ]},

  // ⭐⭐⭐⭐ 4 звезды (класс B) — 20 заданий
  { difficulty: 4, texts: [
    'Шторм B1: Поймать бонус в Sweet Bonanza.',
    'Шторм B2: Выбить множитель x50 в Sweet Bonanza.',
    'Шторм B3: Выбить три бонуса в Pirates pub (ставка от 1000 дублонов).',
    'Шторм B4: Трём зрителям выдать по 5000 дублонов — благотворительность от капитана.',
    'Шторм B5: Особый приказ — пропуск одного задания.',
    'Шторм B6: Разыграть в Telegram бонус за 200 000 дублонов.',
    'Шторм B7: Исследование гробниц! Выбить топовый бонус в «Мумии» в рандомке за 90 000 (3 попытки).',
    'Шторм B8: Купить два топовых бонуса в Мумии за 100 000 дублонов.',
    'Шторм B9: Поймать «под иксом» любую ставку в Crazy Time.',
    'Шторм B10: Познать милость Зевса! Поймать x20 в Gates of Olympus.',
    'Шторм B11: Найти самое рыбное место, вам нужно кормить экипаж! Выбить три бонуса в одном Рыбаке.',
    'Шторм B12: 80 спинов в Le Fisherman по 200 дублонов или выбить топ-бонус.',
    'Шторм B13: 5 зрителей получают по 3 000 дублонов.',
    'Шторм B14: Прогулка с вампирами. Выбить бонус в The Vampires 2 по 4000 дублонов.',
    'Шторм B15: Ставка 150 000 дублонов в любой лайв-игре.',
    'Шторм B16: Купить бонус в Dog House Megaways за 160 000 дублонов и окупиться.',
    'Шторм B17: Проверка удачи! Выиграть x200 в любом слоте с первой попытки.',
    'Шторм B18: Поймать ретригер в dig dig digger (бонус от 80000 дублонов).',
    'Шторм B19: 50 спинов в Le Bandit по 3 000 дублонов и выбить любой бонус.',
    'Шторм B20: На корабль напал убийца! Выбить снайпера в Money Train 4 и устранить его (ставка от 50 000 дублонов).'
  ]},

  // ⭐⭐⭐⭐⭐ 5 звезд (класс A) — 10 заданий
  { difficulty: 5, texts: [
    'Капитанское A1: Получить х3 от суммы покупки бонуса в Pirates pub.',
    'Капитанское A2: Вы — безумный капитан! All-in в Pirates bonanza.',
    'Капитанское A3: Купить 3 "радуги" в Pirates bonanza 2 за 175 000 дублонов .',
    'Капитанское A4: Исследование! Выбить 14 спинов в dog house royal hunt в бонусе от 100 000.',
    'Капитанское A5: Безумное колесо! Выбить Crazy Time.',
    'Капитанское A6: Выбить бонуc в Pirate pub c 4 скаттерами (ставка 1 000 дублонов).',
    'Капитанское A7: Депозитное колесо для больших деперов 5 победителей по 10к.',
    'Капитанское A8: Раздать 5 наблюдателям по 8000 дублонов.',
    'Капитанское A9: Путешествие класса люкс! Купить бонус в Money Train 4 за 250 000 дублонов дважды.',
    'Капитанское A10: Создатель получает накид.'
  ]},

  // ⭐⭐⭐⭐⭐⭐ 6 звезд (класс S) — 2 задания
  { difficulty: 6, texts: [
    'Проклятие S1: Ограбить логово ковбоев! Пробить Hot Mode в Le cowboy (любая ставка).',
    'Проклятие S2: All in в Pirates pub.'
  ]}
];

// ================== ПУЛ ШТРАФОВ ==================
const penaltyTemplates = [
  'Наказание: сделать 25 приседаний',
  'Наказание: отжаться 15 раз',
  'Наказание: спеть пиратскую песню (загуглить если не знаешь)',
  'Наказание: Читать скороговорку про корабль пока Вика не будет довольна',
  'Наказание: Следующие 5 минут говорить с пиратским акцентом',
  'Наказание: рассказать пиратский анекдот',
  'Наказание: Закрыть один глаз на 10 минут',
  'Наказание: станцевать джигу',
  'Наказание: сделать 10 прыжков с криком "Йо-хо-хо!"',
  'Наказание: Следующее задание ты выберешь самое сложное из тех что выпадет',
  'Наказание: издать звук попугая 10 раз',
  'Наказание: В конце каждого предложения говорить "салаги" штраф на 10 минут',
  'Наказание: показать пантомиму "поиск клада"',
  'Наказание: приседать, считая дублоны (30 секунд)',
  'Наказание: Вика управляет стримом 3 минуты',
  'Наказание: рассказать стих о море',
  'Наказание: нарисовать череп на камеру',
  'Наказание: показать 5 эмоций капитана которые сражается с захватчиками',
  'Наказание: Выбрать человека в чате и замутить его до конца стрима',
  'Наказание: поморгать 100 раз подряд'
];

// ================== ТРОФЕИ ==================
const trophyTypes = [
  { name: 'Половина', emoji: '½', bonus: 'half' },
  { name: 'Треть', emoji: '⅓', bonus: 'third' }
];

function createInitialPools() {
  const tasks = [];
  const counts = [100, 60, 30, 20, 10, 2];
  for (let star = 1; star <= 6; star++) {
    const template = taskTemplates.find(t => t.difficulty === star);
    if (!template) continue;
    for (let i = 0; i < counts[star-1]; i++) {
      const text = template.texts[i % template.texts.length];
      tasks.push({
        id: `task_${Date.now()}_${Math.random()}`,
        description: text,
        difficulty: star
      });
    }
  }
  const penalties = penaltyTemplates.map((text, index) => ({
    id: `penalty_${Date.now()}_${Math.random()}_${index}`,
    description: text,
    difficulty: 0,
    isPenalty: true
  }));
  return { tasks: shuffle(tasks), penalties: shuffle(penalties) };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const initial = createInitialPools();
let questState = {
  level: 1,
  availableTasks: initial.tasks,
  penaltyPool: initial.penalties,
  currentBalance: DEFAULT_BALANCE,
  balanceHistory: [{ timestamp: Date.now(), desc: 'Стартовый баланс', change: DEFAULT_BALANCE, balance: DEFAULT_BALANCE }],
  successCount: 0,
  failCount: 0,
  penaltyCount: 0,
  mapCells: Array(MAX_LEVEL).fill('locked'),
  rank: 0,
  reputation: 0,
  inventory: [],
  pathChoice: null,
  pathLevel: 0,
  riskMode: { active: false, untilLevel: 0 },
  currentMultiplier: 1,
  currentDivider: 1,
  nextIsRaid: false,
  isCursedIsland: false,
  skipNextPenalty: false,
  needReroll: false,
  penaltyMode: false
};

function addRandomTrophy(state) {
  const type = trophyTypes[Math.floor(Math.random() * trophyTypes.length)].name;
  const existing = state.inventory.find(t => t.type === type);
  if (existing) {
    existing.count++;
  } else {
    state.inventory.push({ type, count: 1 });
  }
}

function checkRankUp(state) {
  const needed = (state.rank + 1) * REPUTATION_PER_RANK;
  while (state.reputation >= needed && state.rank < RANKS.length - 1) {
    state.rank++;
    state.reputation -= needed;
  }
}

function giveTrophyIfMilestone(state) {
  if (state.level % 5 === 0 && state.level <= MAX_LEVEL) {
    addRandomTrophy(state);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Пират подключён');
  socket.emit('state', questState);

  socket.on('completeTask', (taskId, change, multiplier) => {
    const taskIndex = questState.availableTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) questState.availableTasks.splice(taskIndex, 1);

    questState.currentBalance += change;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Задание выполнено (x${multiplier})`,
      change: change,
      balance: questState.currentBalance
    });
    questState.successCount++;

    if (questState.level <= MAX_LEVEL) {
      questState.mapCells[questState.level - 1] = 'open';
    }

    questState.reputation += 1;
    checkRankUp(questState);
    giveTrophyIfMilestone(questState);

    questState.penaltyMode = false;
    questState.currentDivider = 1;

    if (questState.level < MAX_LEVEL) {
      questState.level++;
      questState.nextIsRaid = (questState.level % 5 === 0);
      questState.isCursedIsland = [7, 13, 21].includes(questState.level);
    }

    io.emit('state', questState);
  });

  socket.on('penaltyWithBalance', (taskId, newBalance) => {
    const taskIndex = questState.availableTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) questState.availableTasks.splice(taskIndex, 1);

    const change = newBalance - questState.currentBalance;
    questState.currentBalance = newBalance;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: 'Задание провалено',
      change: change,
      balance: questState.currentBalance
    });
    questState.failCount++;

    questState.penaltyMode = true;

    io.emit('state', questState);
  });

  socket.on('applyPenaltyTask', (taskId, newBalance) => {
    const penaltyIndex = questState.penaltyPool.findIndex(p => p.id === taskId);
    if (penaltyIndex !== -1) questState.penaltyPool.splice(penaltyIndex, 1);

    const change = newBalance - questState.currentBalance;
    questState.currentBalance = newBalance;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: 'Наказание выполнено',
      change: change,
      balance: questState.currentBalance
    });
    questState.penaltyCount++;

    if (questState.isCursedIsland) {
      questState.mapCells[questState.level - 1] = 'skull';
      questState.isCursedIsland = false;
    } else {
      if (questState.mapCells[questState.level - 1] === 'locked') {
        questState.mapCells[questState.level - 1] = 'skull';
      }
    }

    questState.reputation += 1;
    checkRankUp(questState);
    giveTrophyIfMilestone(questState);

    questState.penaltyMode = false;
    questState.currentDivider = 1;

    if (questState.level < MAX_LEVEL) {
      questState.level++;
      questState.nextIsRaid = (questState.level % 5 === 0);
      questState.isCursedIsland = [7, 13, 21].includes(questState.level);
    }

    io.emit('state', questState);
  });

  socket.on('raidComplete', (success) => {
    if (success) {
      questState.currentBalance += 5000;
      questState.balanceHistory.push({ timestamp: Date.now(), desc: 'Рейд успешен', change: 5000, balance: questState.currentBalance });
      questState.successCount++;
      questState.reputation += 2;
      if (Math.random() < 0.3) addRandomTrophy(questState);

      if (questState.level <= MAX_LEVEL) {
        questState.mapCells[questState.level - 1] = 'open';
      }
    } else {
      questState.currentBalance -= 1000;
      questState.balanceHistory.push({ timestamp: Date.now(), desc: 'Рейд провален', change: -1000, balance: questState.currentBalance });
      questState.failCount++;
      questState.reputation += 0.5;
    }
    checkRankUp(questState);
    giveTrophyIfMilestone(questState);

    questState.penaltyMode = false;
    questState.currentDivider = 1;

    if (questState.level < MAX_LEVEL) {
      questState.level++;
      questState.nextIsRaid = (questState.level % 5 === 0);
      questState.isCursedIsland = [7, 13, 21].includes(questState.level);
    }

    io.emit('state', questState);
  });

  socket.on('useTrophy', (trophyType) => {
    const trophyIndex = questState.inventory.findIndex(t => t.type === trophyType);
    if (trophyIndex === -1) return;
    const trophy = questState.inventory[trophyIndex];
    if (trophy.count <= 0) return;

    trophy.count--;
    if (trophy.count === 0) questState.inventory.splice(trophyIndex, 1);

    const trophyDef = trophyTypes.find(t => t.name === trophyType);
    if (trophyDef) {
      switch (trophyDef.bonus) {
        case 'half': questState.currentDivider = 2; break;
        case 'third': questState.currentDivider = 3; break;
      }
    }

    io.emit('state', questState);
  });

  socket.on('choosePath', (choice) => {
    questState.pathChoice = choice;
    questState.pathLevel = questState.level;
    if (choice === 'risk') {
      questState.riskMode = { active: true, untilLevel: questState.level + 9 };
    } else {
      questState.riskMode = { active: false, untilLevel: 0 };
    }
    io.emit('state', questState);
  });

  socket.on('setBalance', (newBalance) => {
    if (!isNaN(newBalance) && newBalance >= 0) {
      questState.currentBalance = newBalance;
      questState.balanceHistory.push({
        timestamp: Date.now(),
        desc: 'Дублоны изменены вручную',
        change: 0,
        balance: newBalance
      });
      io.emit('state', questState);
    }
  });

  socket.on('prizeDraw', (data) => {
    const { amount, winners } = data;
    const total = amount * winners.length;
    questState.currentBalance -= total;
    questState.balanceHistory.push({
      timestamp: Date.now(),
      desc: `Розыгрыш: ${amount}₽ x ${winners.length}`,
      change: -total,
      balance: questState.currentBalance
    });
    io.emit('state', questState);
  });

  socket.on('addBalance', (description, amount) => {
    questState.currentBalance += amount;
    questState.balanceHistory.push({ timestamp: Date.now(), desc: description, change: amount, balance: questState.currentBalance });
    io.emit('state', questState);
  });

  socket.on('reset', (newBalance) => {
    const start = (newBalance !== undefined && !isNaN(newBalance)) ? newBalance : DEFAULT_BALANCE;
    const initial = createInitialPools();
    questState = {
      level: 1,
      availableTasks: initial.tasks,
      penaltyPool: initial.penalties,
      currentBalance: start,
      balanceHistory: [{ timestamp: Date.now(), desc: 'Стартовый баланс', change: start, balance: start }],
      successCount: 0,
      failCount: 0,
      penaltyCount: 0,
      mapCells: Array(MAX_LEVEL).fill('locked'),
      rank: 0,
      reputation: 0,
      inventory: [],
      pathChoice: null,
      pathLevel: 0,
      riskMode: { active: false, untilLevel: 0 },
      currentMultiplier: 1,
      currentDivider: 1,
      nextIsRaid: false,
      isCursedIsland: false,
      skipNextPenalty: false,
      needReroll: false,
      penaltyMode: false
    };
    io.emit('state', questState);
  });

  socket.on('loadSavedGame', (savedState) => {
    questState = savedState;
    io.emit('state', questState);
  });

  socket.on('disconnect', () => console.log('Пират отплыл'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Пиратский сервер на порту ${PORT}`);
});
