// ========== КОНФИГУРАЦИЯ УРОВНЕЙ ==========
const levels = [
    {
        name: "Таверна «Удача»",
        icon: "fa-mug-hot",
        expRequired: 100,
        quests: generateQuests(1, 20)
    },
    {
        name: "Лес костей",
        icon: "fa-tree",
        expRequired: 150,
        quests: generateQuests(2, 20)
    },
    {
        name: "Гора блэкджека",
        icon: "fa-mountain",
        expRequired: 200,
        quests: generateQuests(3, 20)
    },
    {
        name: "Пещера слотов",
        icon: "fa-cave",
        expRequired: 250,
        quests: generateQuests(4, 20)
    },
    {
        name: "Тронный зал джекпота",
        icon: "fa-crown",
        expRequired: 300,
        quests: generateQuests(5, 20)
    }
];

// Генератор заданий для уровня (уровни 1-5)
function generateQuests(level, count) {
    const quests = [];
    for (let i = 0; i < count; i++) {
        const type = getRandomQuestType(level);
        quests.push({
            id: i,
            type: type,
            text: getQuestText(type, level, i),
            completed: false,
            dynamicData: null // для хранения текущего рандомного условия
        });
    }
    return quests;
}

function getRandomQuestType(level) {
    // Распределение: 60% фикс, 20% рандом, 20% викторина
    const r = Math.random();
    if (r < 0.6) return 'fixed';
    if (r < 0.8) return 'random';
    return 'quiz';
}

function getQuestText(type, level, index) {
    const tasks = {
        1: [
            "Сделайте 20 спинов в любом слоте по 20$",
            "Поставьте на красное в рулетке и выиграйте",
            "Сыграйте 5 партий в блэкджек, не проиграв более 2 раз",
            "Купите бонус за 1000$ в любом слоте",
            "Выполните 3 любых задания из списка зрителей"
        ],
        2: [
            "Удвойте ставку в блэкджеке и выиграйте",
            "Наберите 2000$ выигрыша за 10 спинов",
            "Поймайте бонусную игру в Gates of Olympus",
            "Сделайте ставку на зеро в рулетке",
            "Выиграйте 2 раунда подряд в покере"
        ],
        3: [
            "Выбейте множитель х50 в бонусной игре",
            "Сделайте 50 спинов по 50$ не проиграв 70% банка",
            "Получите блэкджек 2 раза подряд",
            "Купите бонус за 2500$ и окупите его",
            "Выиграйте 5 раундов в рулетке подряд"
        ],
        4: [
            "Поймайте х1000 в Sweet Bonanza",
            "Сделайте 100 спинов со средней ставкой 100$ и ROI > 80%",
            "Выбейте 3 бонусные игры за 30 минут",
            "Удвойте ставку 4 раза подряд в блэкджеке и выиграйте",
            "Соберите стрит-флеш в видеопокере"
        ],
        5: [
            "Выиграйте джекпот в любом слоте",
            "Наберите 10000$ за один спин",
            "Выполните 3 самых сложных задания из предыдущих уровней за 1 час",
            "Поймайте ретриггер в бонусной игре 3 раза подряд",
            "Сделайте накид создателю (по желанию)"
        ]
    };
    const levelTasks = tasks[level] || tasks[1];
    return levelTasks[index % levelTasks.length] + ` (задание #${index+1})`;
}

// Состояние игры
let game = {
    currentLevel: 0,      // 0-4
    currentQuestIndex: 0,
    exp: 0,
    soulShards: 0,
    completedQuests: [],   // массив объектов {level, questId}
    levelCompleted: [false, false, false, false, false]
};

let currentQuestObj = null;
let currentDynamic = null; // для рандомных заданий
let waitingForRandomize = false;

// DOM
const playerLevelSpan = document.getElementById('player-level');
const soulShardsSpan = document.getElementById('soul-shards');
const expFill = document.getElementById('exp-fill');
const expCurrentSpan = document.getElementById('exp-current');
const expNextSpan = document.getElementById('exp-next');
const levelMapDiv = document.getElementById('level-map');
const currentLevelBadge = document.getElementById('current-level-badge');
const questCounterSpan = document.getElementById('quest-counter');
const questTextDiv = document.getElementById('quest-text');
const questTypeDiv = document.getElementById('quest-type');
const dynamicArea = document.getElementById('dynamic-area');
const completeBtn = document.getElementById('complete-quest');
const nextBtn = document.getElementById('next-quest');
const resetProgressBtn = document.getElementById('reset-progress');
const levelCompleteModal = document.getElementById('level-complete-modal');
const gameCompleteModal = document.getElementById('game-complete-modal');
const nextLevelBtnModal = document.getElementById('next-level-btn');
const restartGameBtn = document.getElementById('restart-game');
const hintModal = document.getElementById('hint-modal');
const hintTextSpan = document.getElementById('hint-text');
const closeHintBtn = document.getElementById('close-hint');

// Сохранение
function saveGame() {
    localStorage.setItem('knightRpg', JSON.stringify(game));
}

function loadGame() {
    const saved = localStorage.getItem('knightRpg');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            game = { ...game, ...loaded };
        } catch(e) {}
    }
    // Инициализация completedQuests, если пусто
    if (!game.completedQuests) game.completedQuests = [];
    if (!game.levelCompleted) game.levelCompleted = [false, false, false, false, false];
    // Если currentLevel не корректен
    if (game.currentLevel >= levels.length) game.currentLevel = levels.length-1;
    normalizeProgress();
    updateUI();
    loadCurrentQuest();
}

function normalizeProgress() {
    // Проверяем, что не выполнено больше заданий, чем есть
    for (let lvl=0; lvl<levels.length; lvl++) {
        const completedCount = game.completedQuests.filter(q => q.level === lvl).length;
        if (completedCount === levels[lvl].quests.length && !game.levelCompleted[lvl]) {
            game.levelCompleted[lvl] = true;
        }
    }
    // Автоматическое открытие следующего уровня, если текущий завершён
    if (game.levelCompleted[game.currentLevel] && game.currentLevel+1 < levels.length) {
        game.currentLevel++;
    }
    if (game.currentLevel >= levels.length) game.currentLevel = levels.length-1;
}

function updateUI() {
    // Опыт и уровень
    const levelData = levels[game.currentLevel];
    const expNeeded = levelData.expRequired;
    expCurrentSpan.innerText = game.exp;
    expNextSpan.innerText = expNeeded;
    let percent = (game.exp / expNeeded) * 100;
    percent = Math.min(100, Math.max(0, percent));
    expFill.style.width = `${percent}%`;
    playerLevelSpan.innerText = game.currentLevel + 1;
    soulShardsSpan.innerText = game.soulShards;
    currentLevelBadge.innerText = `Уровень ${game.currentLevel+1}: ${levelData.name}`;
    
    // Счётчик выполненных заданий на текущем уровне
    const completedCount = getCompletedQuestsCount(game.currentLevel);
    const totalQuests = levels[game.currentLevel].quests.length;
    questCounterSpan.innerText = `Заданий выполнено: ${completedCount} / ${totalQuests}`;
    
    // Кнопка "Следующее задание" активна только если есть выполненные и не все завершены
    const canNext = (completedCount > game.currentQuestIndex) && (game.currentQuestIndex < totalQuests);
    nextBtn.disabled = !canNext;
    
    // Рендер карты уровней
    renderLevelMap();
}

function getCompletedQuestsCount(level) {
    return game.completedQuests.filter(q => q.level === level).length;
}

function renderLevelMap() {
    levelMapDiv.innerHTML = '';
    for (let i=0; i<levels.length; i++) {
        const level = levels[i];
        const completedCount = getCompletedQuestsCount(i);
        const total = level.quests.length;
        const isCompleted = (completedCount === total);
        const isActive = (i === game.currentLevel);
        const isLocked = (i > game.currentLevel) && !game.levelCompleted[i-1];
        
        const div = document.createElement('div');
        div.className = `level-item ${isLocked ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
        if (!isLocked) {
            div.addEventListener('click', () => switchLevel(i));
        }
        div.innerHTML = `
            <div class="level-icon"><i class="fas ${level.icon}"></i></div>
            <div class="level-info">
                <div class="level-title">Уровень ${i+1}: ${level.name}</div>
                <div class="progress-dots">
                    ${Array(total).fill().map((_, idx) => {
                        const isQuestCompleted = game.completedQuests.some(q => q.level === i && q.questId === idx);
                        return `<div class="dot ${isQuestCompleted ? 'completed' : ''}"></div>`;
                    }).join('')}
                </div>
            </div>
            <div class="level-status">
                ${isCompleted ? '<i class="fas fa-check-circle" style="color:#d4af37"></i>' : `${completedCount}/${total}`}
            </div>
        `;
        levelMapDiv.appendChild(div);
    }
}

function switchLevel(levelIdx) {
    if (levelIdx === game.currentLevel) return;
    if (levelIdx > game.currentLevel && !game.levelCompleted[levelIdx-1]) {
        alert('Сначала завершите предыдущий уровень!');
        return;
    }
    game.currentLevel = levelIdx;
    // Устанавливаем текущий индекс задания на следующее невыполненное
    const completed = getCompletedQuestsCount(levelIdx);
    game.currentQuestIndex = completed;
    if (game.currentQuestIndex >= levels[levelIdx].quests.length) {
        game.currentQuestIndex = levels[levelIdx].quests.length - 1;
    }
    saveGame();
    updateUI();
    loadCurrentQuest();
}

function loadCurrentQuest() {
    const level = levels[game.currentLevel];
    if (!level) return;
    const quests = level.quests;
    const idx = game.currentQuestIndex;
    if (idx >= quests.length) {
        // Все задания выполнены, но уровень ещё не завершён? Проверим
        if (getCompletedQuestsCount(game.currentLevel) === quests.length) {
            completeLevel();
        }
        return;
    }
    currentQuestObj = quests[idx];
    if (currentQuestObj.completed) {
        // Подтягиваем следующий
        moveToNextQuest();
        return;
    }
    renderCurrentQuest();
}

function renderCurrentQuest() {
    const q = currentQuestObj;
    questTextDiv.innerText = q.text;
    let typeText = '';
    if (q.type === 'fixed') typeText = '📜 Фиксированное задание';
    else if (q.type === 'random') typeText = '🎲 Случайное задание (нажмите "Сгенерировать")';
    else typeText = '❓ Вопрос (ответьте письменно)';
    questTypeDiv.innerText = typeText;
    
    dynamicArea.innerHTML = '';
    if (q.type === 'random') {
        const randomBtn = document.createElement('button');
        randomBtn.className = 'random-btn';
        randomBtn.innerHTML = '<i class="fas fa-dice"></i> Сгенерировать новое задание';
        randomBtn.onclick = () => generateRandomQuest();
        dynamicArea.appendChild(randomBtn);
        if (q.dynamicData) {
            const p = document.createElement('p');
            p.innerHTML = `🎲 Текущее условие: ${q.dynamicData}`;
            dynamicArea.appendChild(p);
        }
    } else if (q.type === 'quiz') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Введите ваш ответ...';
        input.className = 'dynamic-input';
        input.id = 'quiz-answer';
        dynamicArea.appendChild(input);
    }
    // Сохраняем dynamic данные в глобальной переменной
    waitingForRandomize = (q.type === 'random' && !q.dynamicData);
}

function generateRandomQuest() {
    if (!currentQuestObj || currentQuestObj.type !== 'random') return;
    const randomTasks = [
        "Сделайте 30 спинов и выиграйте хотя бы 500$",
        "Сыграйте в рулетку 3 раза на зеро",
        "Удвойте ставку в блэкджеке и выиграйте",
        "Поймайте бонус в Sweet Bonanza",
        "Выиграйте 2 раунда в покере подряд",
        "Получите множитель х20 в слоте"
    ];
    const randomTask = randomTasks[Math.floor(Math.random() * randomTasks.length)];
    currentQuestObj.dynamicData = randomTask;
    saveGame();
    renderCurrentQuest();
}

function completeQuest() {
    if (!currentQuestObj) return;
    if (currentQuestObj.completed) {
        alert('Это задание уже выполнено');
        return;
    }
    // Проверка для рандомного: нужно сгенерировать
    if (currentQuestObj.type === 'random' && !currentQuestObj.dynamicData) {
        alert('Сначала сгенерируйте задание кнопкой ниже');
        return;
    }
    
    // Начисляем опыт и осколки
    const levelIdx = game.currentLevel;
    const expGain = 20 + levelIdx * 5;
    game.exp += expGain;
    game.soulShards += 5 + levelIdx;
    
    // Отмечаем выполненным
    currentQuestObj.completed = true;
    game.completedQuests.push({
        level: levelIdx,
        questId: currentQuestObj.id
    });
    
    // Проверка на повышение уровня (опыт)
    let levelUp = false;
    while (game.exp >= levels[game.currentLevel].expRequired && game.currentLevel < levels.length-1) {
        game.exp -= levels[game.currentLevel].expRequired;
        game.currentLevel++;
        levelUp = true;
        // Проверяем, не завершён ли новый уровень
    }
    if (levelUp) {
        // При переходе уровня сбрасываем текущий индекс задания на начало
        game.currentQuestIndex = 0;
        // Проверяем, все ли задания были выполнены на предыдущем уровне? В любом случае идёт дальше
    } else {
        // Переход к следующему заданию вручную через кнопку "Следующее задание"
        // Но сначала нужно обновить UI
    }
    saveGame();
    updateUI();
    
    // Автоматически переходим к следующему невыполненному заданию, если есть
    const nextUncompleted = getNextUncompletedQuestIndex();
    if (nextUncompleted !== -1) {
        game.currentQuestIndex = nextUncompleted;
        saveGame();
        loadCurrentQuest();
    } else {
        // Уровень завершён
        completeLevel();
    }
    updateUI();
}

function getNextUncompletedQuestIndex() {
    const level = levels[game.currentLevel];
    for (let i=0; i<level.quests.length; i++) {
        if (!level.quests[i].completed) return i;
    }
    return -1;
}

function completeLevel() {
    const levelIdx = game.currentLevel;
    game.levelCompleted[levelIdx] = true;
    saveGame();
    
    if (levelIdx + 1 < levels.length) {
        // Открываем следующий уровень
        levelCompleteModal.classList.remove('hidden');
        document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${levelIdx+1}: ${levels[levelIdx].name}.<br>Открыт уровень ${levelIdx+2}!`;
    } else {
        // Игра завершена
        gameCompleteModal.classList.remove('hidden');
    }
    updateUI();
}

function moveToNextQuest() {
    const nextIdx = getNextUncompletedQuestIndex();
    if (nextIdx !== -1 && nextIdx > game.currentQuestIndex) {
        game.currentQuestIndex = nextIdx;
        saveGame();
        loadCurrentQuest();
        updateUI();
    } else if (nextIdx === -1) {
        completeLevel();
    } else {
        alert('Нет доступных заданий');
    }
}

function resetProgress() {
    if (confirm('Сбросить весь прогресс игры? Все уровни и осколки будут удалены.')) {
        localStorage.removeItem('knightRpg');
        location.reload();
    }
}

function handleHint() {
    // Подсказка для зрителей (команда !помощь)
    let hint = '';
    if (currentQuestObj && !currentQuestObj.completed) {
        if (currentQuestObj.type === 'quiz') {
            hint = 'Попробуй ответить на вопрос, используя логику или подсказки в интернете.';
        } else if (currentQuestObj.type === 'random') {
            hint = 'Сгенерируй задание, затем выполни его в казино.';
        } else {
            hint = 'Просто выполни задание, описанное выше, и нажми "Выполнено".';
        }
    } else {
        hint = 'Сначала выбери активное задание.';
    }
    hintTextSpan.innerText = hint;
    hintModal.classList.remove('hidden');
}

// Обработчики
completeBtn.addEventListener('click', completeQuest);
nextBtn.addEventListener('click', moveToNextQuest);
resetProgressBtn.addEventListener('click', resetProgress);
nextLevelBtnModal.addEventListener('click', () => {
    levelCompleteModal.classList.add('hidden');
    if (game.currentLevel+1 < levels.length) {
        game.currentLevel++;
        game.currentQuestIndex = 0;
        saveGame();
        updateUI();
        loadCurrentQuest();
    }
});
restartGameBtn.addEventListener('click', () => {
    resetProgress();
});
closeHintBtn.addEventListener('click', () => hintModal.classList.add('hidden'));

// Имитация команды из чата (можно вызвать через консоль, если нужно)
window.handleHint = handleHint;

// Загрузка игры
loadGame();