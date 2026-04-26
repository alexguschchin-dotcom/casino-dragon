// ================================
//        ГЛОБАЛЬНЫЕ ДАННЫЕ
// ================================

// Структура уровней и заданий
const levelsData = [
    {   // Уровень 1: Таверна "Удача"
        name: "Таверна «Удача»",
        icon: "fa-mug-hot",
        expNeeded: 100,
        background: "linear-gradient(145deg, #2a1a0a, #1a0e05)",
        questCount: 20,
        quests: []
    },
    {   // Уровень 2: Лес костей
        name: "Лес костей",
        icon: "fa-tree",
        expNeeded: 150,
        background: "linear-gradient(145deg, #1a2a1a, #0e1a0e)",
        questCount: 20,
        quests: []
    },
    {   // Уровень 3: Гора блэкджека
        name: "Гора блэкджека",
        icon: "fa-mountain",
        expNeeded: 200,
        background: "linear-gradient(145deg, #2a2a1a, #1a1a0a)",
        questCount: 20,
        quests: []
    },
    {   // Уровень 4: Пещера слотов
        name: "Пещера слотов",
        icon: "fa-cave",
        expNeeded: 250,
        background: "linear-gradient(145deg, #1a1a2a, #0a0a1a)",
        questCount: 20,
        quests: []
    },
    {   // Уровень 5: Тронный зал джекпота
        name: "Тронный зал джекпота",
        icon: "fa-crown",
        expNeeded: 300,
        background: "linear-gradient(145deg, #3a2a1a, #2a1a0a)",
        questCount: 20,
        quests: []
    }
];

// Библиотека случайных заданий по типам
const questLibrary = {
    fixed: [
        "Сделайте 20 спинов в {slot} по 20$",
        "Поставьте на {color} в рулетке и выиграйте",
        "Сыграйте 5 партий в блэкджек, проиграв не более 2",
        "Купите бонус за {price} в любом слоте",
        "Сделайте 3 депозита по {deposit}",
        "Выиграйте 3 раунда подряд в {game}",
        "Поймайте бонусную игру в {slot2}",
        "Удвойте ставку в блэкджеке и выиграйте",
        "Наберите {win} выигрыша за 10 спинов",
        "Сделайте ставку на {number} в рулетке"
    ],
    random: [
        "выбейте множитель x{mult} в бонусной игре",
        "получите блэкджек {count} раза подряд",
        "выполните {tasks} любых заданий из чата",
        "сделайте {spins} спинов на слоте с множителем",
        "поймайте ретриггер в бонусе {times} раза"
    ],
    quiz: [
        "Какой символ в слотах заменяет другие? (Wild/Scatter/Bonus)",
        "Что означает RTP? (Return to Player/Real Time Play/Random)",
        "Сколько чисел в европейской рулетке? (36/37/38)",
        "Назовите самый популярный слот в мире (Starburst/Book of Dead/Sweet Bonanza)",
        "Кто написал роман «Игрок»? (Достоевский/Толстой/Чехов)",
        "В каком городе находится казино Монте-Карло? (Монако/Франция/Италия)",
        "Что такое «анте» в покере? (начальная ставка/доп. бонус/штраф)",
        "Какой фильм о казино считается классикой? (Казино/Оушен/С широко закрытыми глазами)",
        "Сколько очков даёт туз в блэкджеке? (1 или 11/10/11)",
        "Как называется комбинация 2,3,4,5,6 одной масти? (Стрит-флеш/Флеш/Стрит)"
    ]
};

// Параметры генерации
const slotsList = ["Dog house", "Sweet Bonanza", "Gates of Olympus", "Sugar Rush", "Le Bandit"];
const colors = ["красное", "чёрное"];
const games = ["рулетку", "блэкджек", "покер", "слоты"];
const prices = ["500$", "1000$", "2000$", "5000$"];
const deposits = ["100$", "500$", "1000$"];
const wins = ["500$", "1000$", "2000$", "5000$"];
const numbers = ["7", "12", "21", "33", "зеро"];

// Генерация заданий для уровня
function generateQuestsForLevel(levelIdx) {
    const level = levelsData[levelIdx];
    const quests = [];
    for (let i = 0; i < level.questCount; i++) {
        const type = determineQuestType(levelIdx, i);
        let text = "";
        let correctAnswer = null;
        
        if (type === "fixed") {
            const template = questLibrary.fixed[Math.floor(Math.random() * questLibrary.fixed.length)];
            text = template
                .replace("{slot}", slotsList[Math.floor(Math.random() * slotsList.length)])
                .replace("{color}", colors[Math.floor(Math.random() * colors.length)])
                .replace("{price}", prices[Math.floor(Math.random() * prices.length)])
                .replace("{deposit}", deposits[Math.floor(Math.random() * deposits.length)])
                .replace("{game}", games[Math.floor(Math.random() * games.length)])
                .replace("{slot2}", slotsList[Math.floor(Math.random() * slotsList.length)])
                .replace("{win}", wins[Math.floor(Math.random() * wins.length)])
                .replace("{number}", numbers[Math.floor(Math.random() * numbers.length)]);
        } 
        else if (type === "random") {
            const template = questLibrary.random[Math.floor(Math.random() * questLibrary.random.length)];
            text = template
                .replace("{mult}", String(Math.floor(Math.random() * 20 + 5)))
                .replace("{count}", String(Math.floor(Math.random() * 3 + 2)))
                .replace("{tasks}", String(Math.floor(Math.random() * 5 + 1)))
                .replace("{spins}", String(Math.floor(Math.random() * 50 + 20)))
                .replace("{times}", String(Math.floor(Math.random() * 3 + 1)));
        } 
        else if (type === "quiz") {
            const idx = Math.floor(Math.random() * questLibrary.quiz.length);
            const qText = questLibrary.quiz[idx];
            // Простой парсер для извлечения ответа (сильно упрощённо, но для демо хватит)
            if (qText.includes("Wild")) correctAnswer = "wild";
            else if (qText.includes("Return to Player")) correctAnswer = "return to player";
            else if (qText.includes("37")) correctAnswer = "37";
            else if (qText.includes("Starburst")) correctAnswer = "starburst";
            else if (qText.includes("Достоевский")) correctAnswer = "достоевский";
            else if (qText.includes("Монако")) correctAnswer = "монако";
            else if (qText.includes("начальная ставка")) correctAnswer = "анте";
            else if (qText.includes("Казино")) correctAnswer = "казино";
            else if (qText.includes("1 или 11")) correctAnswer = "1 или 11";
            else if (qText.includes("Стрит-флеш")) correctAnswer = "стрит-флеш";
            text = qText;
        }
        
        quests.push({
            id: i,
            type: type,
            text: text,
            completed: false,
            correctAnswer: correctAnswer,
            dynamicData: null  // для хранения сгенерированного случайного условия
        });
    }
    return quests;
}

function determineQuestType(levelIdx, questIndex) {
    // На первых уровнях больше фикс, на высоких – сложные типы
    if (levelIdx === 0) {
        if (questIndex < 12) return "fixed";
        else if (questIndex < 17) return "random";
        else return "quiz";
    } else if (levelIdx === 1) {
        if (questIndex < 10) return "fixed";
        else if (questIndex < 16) return "random";
        else return "quiz";
    } else if (levelIdx === 2) {
        if (questIndex < 8) return "fixed";
        else if (questIndex < 14) return "random";
        else return "quiz";
    } else if (levelIdx === 3) {
        if (questIndex < 6) return "fixed";
        else if (questIndex < 12) return "random";
        else return "quiz";
    } else {
        if (questIndex < 4) return "fixed";
        else if (questIndex < 10) return "random";
        else return "quiz";
    }
}

// Заполняем задания для всех уровней
for (let i=0; i<levelsData.length; i++) {
    levelsData[i].quests = generateQuestsForLevel(i);
}

// Состояние игры
let game = {
    currentLevel: 0,
    currentQuestIndex: 0,
    exp: 0,
    soulShards: 0,
    completedQuests: [],   // {level, questId}
    levelCompleted: [false, false, false, false, false],
    settings: {
        soundEnabled: true,
        hintsEnabled: true
    }
};

let currentQuestObj = null;
let pendingRandomize = false;

// DOM элементы
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
const themeToggle = document.getElementById('theme-toggle'); // необязательно, но добавим позже

// ================================
//        СОХРАНЕНИЕ / ЗАГРУЗКА
// ================================
function saveGame() {
    const toSave = {
        currentLevel: game.currentLevel,
        currentQuestIndex: game.currentQuestIndex,
        exp: game.exp,
        soulShards: game.soulShards,
        completedQuests: game.completedQuests,
        levelCompleted: game.levelCompleted,
        settings: game.settings
    };
    localStorage.setItem('knightRpg', JSON.stringify(toSave));
}

function loadGame() {
    const saved = localStorage.getItem('knightRpg');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            game.currentLevel = data.currentLevel;
            game.currentQuestIndex = data.currentQuestIndex;
            game.exp = data.exp;
            game.soulShards = data.soulShards;
            game.completedQuests = data.completedQuests;
            game.levelCompleted = data.levelCompleted;
            game.settings = data.settings || { soundEnabled: true, hintsEnabled: true };
        } catch(e) { console.warn(e); }
    }
    // Инициализация массивов если нет
    if (!game.completedQuests) game.completedQuests = [];
    if (!game.levelCompleted) game.levelCompleted = [false, false, false, false, false];
    // Переносим флаг завершённости заданий в объекты quests
    for (let lvl=0; lvl<levelsData.length; lvl++) {
        for (let q of levelsData[lvl].quests) {
            const found = game.completedQuests.some(cq => cq.level === lvl && cq.questId === q.id);
            q.completed = found;
        }
    }
    // Проверяем завершённость уровней
    for (let lvl=0; lvl<levelsData.length; lvl++) {
        const allCompleted = levelsData[lvl].quests.every(q => q.completed);
        if (allCompleted && !game.levelCompleted[lvl]) {
            game.levelCompleted[lvl] = true;
        }
    }
    // Корректировка текущего уровня
    if (game.currentLevel >= levelsData.length) game.currentLevel = levelsData.length-1;
    while (game.currentLevel > 0 && !game.levelCompleted[game.currentLevel-1]) {
        game.currentLevel--;
    }
    // Текущий индекс задания - следующий невыполненный
    const curLevelQuests = levelsData[game.currentLevel].quests;
    let nextUncompleted = curLevelQuests.findIndex(q => !q.completed);
    if (nextUncompleted === -1) nextUncompleted = curLevelQuests.length-1;
    game.currentQuestIndex = nextUncompleted;
    saveGame();
    updateUI();
    loadCurrentQuest();
}

// ================================
//          ОБНОВЛЕНИЕ UI
// ================================
function updateUI() {
    const level = levelsData[game.currentLevel];
    // Опыт
    const expNeeded = level.expNeeded;
    expCurrentSpan.innerText = game.exp;
    expNextSpan.innerText = expNeeded;
    let percent = (game.exp / expNeeded) * 100;
    percent = Math.min(100, Math.max(0, percent));
    expFill.style.width = `${percent}%`;
    playerLevelSpan.innerText = game.currentLevel + 1;
    soulShardsSpan.innerText = game.soulShards;
    currentLevelBadge.innerText = `Уровень ${game.currentLevel+1}: ${level.name}`;
    
    // Счётчик выполненных заданий
    const completedCount = levelsData[game.currentLevel].quests.filter(q => q.completed).length;
    const total = levelsData[game.currentLevel].quests.length;
    questCounterSpan.innerText = `Заданий выполнено: ${completedCount} / ${total}`;
    
    // Кнопка "Следующее задание" активна только если есть выполненное и не все завершены
    const canNext = (completedCount > 0 && completedCount < total);
    nextBtn.disabled = !canNext;
    
    // Отрисовка карты уровней
    renderLevelMap();
    
    // Смена фона в зависимости от уровня
    document.body.style.background = levelsData[game.currentLevel].background;
}

function renderLevelMap() {
    levelMapDiv.innerHTML = '';
    for (let i=0; i<levelsData.length; i++) {
        const level = levelsData[i];
        const completedCount = level.quests.filter(q => q.completed).length;
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
                        const isQuestCompleted = level.quests[idx].completed;
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

function switchLevel(newLevel) {
    if (newLevel === game.currentLevel) return;
    if (newLevel > game.currentLevel && !game.levelCompleted[newLevel-1]) {
        alert("Сначала завершите предыдущий уровень!");
        return;
    }
    game.currentLevel = newLevel;
    // Обновляем текущий индекс на первый невыполненный
    const quests = levelsData[game.currentLevel].quests;
    let nextIdx = quests.findIndex(q => !q.completed);
    if (nextIdx === -1) nextIdx = quests.length-1;
    game.currentQuestIndex = nextIdx;
    saveGame();
    updateUI();
    loadCurrentQuest();
}

// ================================
//          ЗАГРУЗКА ЗАДАНИЯ
// ================================
function loadCurrentQuest() {
    const level = levelsData[game.currentLevel];
    const quest = level.quests[game.currentQuestIndex];
    if (!quest) return;
    currentQuestObj = quest;
    if (quest.completed) {
        // Если вдруг уже выполнено, перейти к следующему
        moveToNextQuest();
        return;
    }
    renderCurrentQuest();
}

function renderCurrentQuest() {
    const q = currentQuestObj;
    questTextDiv.innerText = q.text;
    
    let typeText = "";
    if (q.type === "fixed") typeText = "📜 Фиксированное задание";
    else if (q.type === "random") typeText = "🎲 Случайное задание (нужно сгенерировать)";
    else typeText = "❓ Викторина (введите ответ)";
    questTypeDiv.innerText = typeText;
    
    dynamicArea.innerHTML = "";
    if (q.type === "random") {
        // Если нет сгенерированного условия, показываем кнопку
        if (!q.dynamicData) {
            const genBtn = document.createElement("button");
            genBtn.className = "random-btn";
            genBtn.innerHTML = '<i class="fas fa-dice"></i> Сгенерировать задание';
            genBtn.onclick = () => generateRandomQuestCondition();
            dynamicArea.appendChild(genBtn);
            pendingRandomize = true;
        } else {
            const p = document.createElement("p");
            p.innerHTML = `<i class="fas fa-dice"></i> Условие: ${q.dynamicData}`;
            dynamicArea.appendChild(p);
            pendingRandomize = false;
        }
    } else if (q.type === "quiz") {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Введите ответ...";
        input.className = "dynamic-input";
        input.id = "quizAnswerInput";
        dynamicArea.appendChild(input);
    }
}

function generateRandomQuestCondition() {
    if (!currentQuestObj || currentQuestObj.type !== "random") return;
    const possible = [
        `выбейте множитель x${Math.floor(Math.random()*30+10)}`,
        `получите блэкджек ${Math.floor(Math.random()*3+2)} раза подряд`,
        `сделайте ${Math.floor(Math.random()*50+30)} спинов по 20$`,
        `поймайте бонус в ${slotsList[Math.floor(Math.random()*slotsList.length)]}`,
        `выиграйте ${Math.floor(Math.random()*500+200)}$ в рулетке`,
        `удвойте ставку и выиграйте ${Math.floor(Math.random()*3+1)} раза`
    ];
    const cond = possible[Math.floor(Math.random() * possible.length)];
    currentQuestObj.dynamicData = cond;
    saveGame();
    renderCurrentQuest();
}

// ================================
//       ВЫПОЛНЕНИЕ ЗАДАНИЯ
// ================================
function completeQuest() {
    if (!currentQuestObj) return;
    if (currentQuestObj.completed) {
        alert("Это задание уже выполнено!");
        return;
    }
    // Проверка для рандома: нужно сначала сгенерировать условие
    if (currentQuestObj.type === "random" && !currentQuestObj.dynamicData) {
        alert("Сначала сгенерируйте задание кнопкой ниже!");
        return;
    }
    // Для викторины проверяем ответ
    if (currentQuestObj.type === "quiz") {
        const input = document.getElementById("quizAnswerInput");
        if (!input) {
            alert("Поле ответа не найдено");
            return;
        }
        const userAnswer = input.value.trim().toLowerCase();
        const correct = currentQuestObj.correctAnswer;
        if (!correct || userAnswer !== correct) {
            alert(`❌ Неправильно! Правильный ответ: ${correct}. Задание не засчитано.`);
            return;
        }
    }
    
    // Начисление наград
    const levelIdx = game.currentLevel;
    const expGain = 20 + levelIdx * 5;
    const shardGain = 5 + levelIdx * 2;
    game.exp += expGain;
    game.soulShards += shardGain;
    
    // Отметка выполнения
    currentQuestObj.completed = true;
    game.completedQuests.push({
        level: levelIdx,
        questId: currentQuestObj.id
    });
    
    // Проверка на завершение уровня
    const allCompleted = levelsData[levelIdx].quests.every(q => q.completed);
    if (allCompleted && !game.levelCompleted[levelIdx]) {
        game.levelCompleted[levelIdx] = true;
    }
    
    // Проверка на повышение уровня (по опыту)
    let levelUp = false;
    while (game.exp >= levelsData[game.currentLevel].expNeeded && game.currentLevel < levelsData.length-1) {
        game.exp -= levelsData[game.currentLevel].expNeeded;
        game.currentLevel++;
        levelUp = true;
        // При переходе уровня сохраняем, но не переключаем индекс
    }
    if (levelUp) {
        // Корректируем currentQuestIndex на первый невыполненный
        const newLevelQuests = levelsData[game.currentLevel].quests;
        let nextIdx = newLevelQuests.findIndex(q => !q.completed);
        if (nextIdx === -1) nextIdx = newLevelQuests.length-1;
        game.currentQuestIndex = nextIdx;
        saveGame();
        updateUI();
        loadCurrentQuest();
        alert(`✨ Поздравляем! Вы достигли уровня ${game.currentLevel+1}! ✨`);
        return;
    }
    
    // Иначе переходим к следующему невыполненному заданию
    saveGame();
    updateUI();
    const nextUncompleted = levelsData[levelIdx].quests.findIndex((q, idx) => !q.completed && idx > game.currentQuestIndex);
    if (nextUncompleted !== -1) {
        game.currentQuestIndex = nextUncompleted;
        saveGame();
        loadCurrentQuest();
    } else {
        // Все задания уровня выполнены
        if (allCompleted) {
            if (levelIdx + 1 < levelsData.length) {
                levelCompleteModal.classList.remove('hidden');
                document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${levelIdx+1}: ${levelsData[levelIdx].name}.<br>Открыт уровень ${levelIdx+2}!`;
            } else {
                gameCompleteModal.classList.remove('hidden');
            }
        } else {
            // Есть невыполненные, но мы на последнем? перейти к следующему
            moveToNextQuest();
        }
    }
    updateUI();
}

function moveToNextQuest() {
    const level = game.currentLevel;
    const nextUncompleted = levelsData[level].quests.findIndex(q => !q.completed);
    if (nextUncompleted !== -1) {
        game.currentQuestIndex = nextUncompleted;
        saveGame();
        loadCurrentQuest();
        updateUI();
    } else {
        // Все выполнены, но уровень возможно не завершён? завершаем
        if (!game.levelCompleted[level]) {
            game.levelCompleted[level] = true;
            saveGame();
            updateUI();
            if (level + 1 < levelsData.length) {
                levelCompleteModal.classList.remove('hidden');
                document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${level+1}: ${levelsData[level].name}.<br>Открыт уровень ${level+2}!`;
            } else {
                gameCompleteModal.classList.remove('hidden');
            }
        }
    }
}

// ================================
//        СБРОС И ПОМОЩЬ
// ================================
function resetProgress() {
    if (confirm('Сбросить весь прогресс игры? Все уровни и осколки будут удалены.')) {
        localStorage.removeItem('knightRpg');
        location.reload();
    }
}

function showHint() {
    if (!currentQuestObj || currentQuestObj.completed) {
        hintTextSpan.innerText = "Сначала выберите активное задание.";
        hintModal.classList.remove('hidden');
        return;
    }
    let hint = "";
    if (currentQuestObj.type === "fixed") {
        hint = "Просто выполните описанное действие в казино и нажмите «Выполнено».";
    } else if (currentQuestObj.type === "random") {
        if (currentQuestObj.dynamicData) {
            hint = `Сейчас задание: ${currentQuestObj.dynamicData}. Выполните его и нажмите «Выполнено».`;
        } else {
            hint = "Сначала сгенерируйте случайное задание кнопкой ниже.";
        }
    } else if (currentQuestObj.type === "quiz") {
        hint = `Подсказка: правильный ответ начинается с буквы "${currentQuestObj.correctAnswer[0]}".`;
    }
    hintTextSpan.innerHTML = hint;
    hintModal.classList.remove('hidden');
}

// ================================
//        ОБРАБОТЧИКИ СОБЫТИЙ
// ================================
completeBtn.addEventListener('click', completeQuest);
nextBtn.addEventListener('click', moveToNextQuest);
resetProgressBtn.addEventListener('click', resetProgress);
nextLevelBtnModal.addEventListener('click', () => {
    levelCompleteModal.classList.add('hidden');
    if (game.currentLevel+1 < levelsData.length) {
        game.currentLevel++;
        game.currentQuestIndex = levelsData[game.currentLevel].quests.findIndex(q => !q.completed);
        if (game.currentQuestIndex === -1) game.currentQuestIndex = 0;
        saveGame();
        updateUI();
        loadCurrentQuest();
    }
});
restartGameBtn.addEventListener('click', () => {
    resetProgress();
});
closeHintBtn.addEventListener('click', () => hintModal.classList.add('hidden'));

// Команда из чата (можно вызывать из консоли или через бота)
window.showHint = showHint;

// ================================
//        ДОП. АНИМАЦИИ
// ================================
function animateKnight() {
    const knight = document.querySelector('.knight-icon');
    if (knight) {
        knight.style.animation = 'none';
        setTimeout(() => { knight.style.animation = 'float 3s ease-in-out infinite'; }, 10);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    // Добавляем анимацию при выполнении задания
    const observer = new MutationObserver(() => {
        if (currentQuestObj && currentQuestObj.completed) animateKnight();
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
});

// ================================
//        ИНИЦИАЛИЗАЦИЯ
// ================================
loadGame();