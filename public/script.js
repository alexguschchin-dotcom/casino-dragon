// =====================================================
//  RPG КВЕСТ "Сага о проклятом рыцаре"
//  5 уровней, 100 заданий, сохранение, уникальные анимации
// =====================================================

// ----- ДАННЫЕ УРОВНЕЙ -----
const levelsData = [
    { name: "Таверна «Удача»", icon: "fa-mug-hot", expNeeded: 100, questCount: 20, bgTheme: "level1", bgAnimation: "fireParticles" },
    { name: "Лес костей", icon: "fa-tree", expNeeded: 150, questCount: 20, bgTheme: "level2", bgAnimation: "fallingLeaves" },
    { name: "Гора блэкджека", icon: "fa-mountain", expNeeded: 200, questCount: 20, bgTheme: "level3", bgAnimation: "snow" },
    { name: "Пещера слотов", icon: "fa-cave", expNeeded: 250, questCount: 20, bgTheme: "level4", bgAnimation: "sparkle" },
    { name: "Тронный зал джекпота", icon: "fa-crown", expNeeded: 300, questCount: 20, bgTheme: "level5", bgAnimation: "goldenParticles" }
];

// ----- БИБЛИОТЕКИ ЗАДАНИЙ -----
const slotsList = ["Dog house", "Sweet Bonanza", "Gates of Olympus", "Sugar Rush", "Le Bandit", "Book of Dead", "Starburst"];
const colors = ["красное", "чёрное"];
const games = ["рулетку", "блэкджек", "покер", "слоты"];
const prices = ["500$", "1000$", "2000$", "5000$"];
const wins = ["500$", "1000$", "2000$", "5000$"];

const fixedTasks = [
    "Сделайте 20 спинов в {slot} по 20$",
    "Поставьте на {color} в рулетке и выиграйте",
    "Сыграйте 5 партий в блэкджек, проиграв не более 2",
    "Купите бонус за {price} в любом слоте",
    "Сделайте 3 депозита по {price}",
    "Выиграйте 3 раунда подряд в {game}",
    "Поймайте бонусную игру в {slot}",
    "Удвойте ставку в блэкджеке и выиграйте",
    "Наберите {win} выигрыша за 10 спинов",
    "Сделайте ставку на {number} в рулетке"
];
const randomTasks = [
    "выбейте множитель x{mult} в бонусной игре",
    "получите блэкджек {count} раза подряд",
    "выполните {tasks} любых заданий из чата",
    "сделайте {spins} спинов на слоте с множителем",
    "поймайте ретриггер в бонусе {times} раза"
];
const quizQA = [
    { q: "Что означает RTP в слотах? (Return to Player/Real Time Play/Random)", a: "return to player" },
    { q: "Сколько чисел в европейской рулетке? (36/37/38)", a: "37" },
    { q: "Назовите самый популярный слот в мире (Starburst/Book of Dead/Sweet Bonanza)", a: "starburst" },
    { q: "Кто написал роман «Игрок»? (Достоевский/Толстой/Чехов)", a: "достоевский" },
    { q: "В каком городе находится казино Монте-Карло? (Монако/Франция/Италия)", a: "монако" },
    { q: "Что такое «анте» в покере? (начальная ставка/доп. бонус/штраф)", a: "начальная ставка" },
    { q: "Какой фильм о казино считается классикой? (Казино/Оушен/С широко закрытыми глазами)", a: "казино" },
    { q: "Сколько очков даёт туз в блэкджеке? (1 или 11/10/11)", a: "1 или 11" },
    { q: "Как называется комбинация 2,3,4,5,6 одной масти? (Стрит-флеш/Флеш/Стрит)", a: "стрит-флеш" },
    { q: "Какой символ в слотах заменяет другие? (Wild/Scatter/Bonus)", a: "wild" }
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Генерация заданий для уровня
function generateQuestsForLevel(levelIdx) {
    const level = levelsData[levelIdx];
    const quests = [];
    for (let i = 0; i < level.questCount; i++) {
        let type;
        if (levelIdx === 0) type = (i < 12) ? "fixed" : (i < 17) ? "random" : "quiz";
        else if (levelIdx === 1) type = (i < 10) ? "fixed" : (i < 16) ? "random" : "quiz";
        else if (levelIdx === 2) type = (i < 8) ? "fixed" : (i < 14) ? "random" : "quiz";
        else if (levelIdx === 3) type = (i < 6) ? "fixed" : (i < 12) ? "random" : "quiz";
        else type = (i < 4) ? "fixed" : (i < 10) ? "random" : "quiz";

        let text = "", correctAnswer = null;
        if (type === "fixed") {
            let tpl = randomElement(fixedTasks);
            text = tpl.replace("{slot}", randomElement(slotsList))
                       .replace("{color}", randomElement(colors))
                       .replace("{price}", randomElement(prices))
                       .replace("{game}", randomElement(games))
                       .replace("{win}", randomElement(wins))
                       .replace("{number}", rand(1,36).toString());
        } else if (type === "random") {
            let tpl = randomElement(randomTasks);
            text = tpl.replace("{mult}", rand(10,50).toString())
                       .replace("{count}", rand(2,5).toString())
                       .replace("{tasks}", rand(1,5).toString())
                       .replace("{spins}", rand(30,100).toString())
                       .replace("{times}", rand(2,5).toString());
        } else {
            let qa = quizQA[rand(0, quizQA.length-1)];
            text = qa.q;
            correctAnswer = qa.a;
        }
        quests.push({ id: i, type, text, completed: false, correctAnswer, dynamicData: null });
    }
    return quests;
}

// Заполняем уровни заданиями
for (let i = 0; i < levelsData.length; i++) {
    levelsData[i].quests = generateQuestsForLevel(i);
}

// ----- СОСТОЯНИЕ ИГРЫ -----
let game = {
    currentLevel: 0,
    currentQuestIndex: 0,
    exp: 0,
    soulShards: 0,
    completedQuests: [],
    levelCompleted: [false, false, false, false, false]
};

let currentQuestObj = null;
let pendingRandomize = false;

// ----- DOM ЭЛЕМЕНТЫ -----
const rightColumn = document.getElementById('right-column');
const levelMapDiv = document.getElementById('level-map');
const playerLevelSpan = document.getElementById('player-level');
const soulShardsSpan = document.getElementById('soul-shards');
const expFill = document.getElementById('exp-fill');
const expCurrentSpan = document.getElementById('exp-current');
const expNextSpan = document.getElementById('exp-next');
const currentLevelBadge = document.getElementById('current-level-badge');
const questCounterSpan = document.getElementById('quest-counter');
const questTextDiv = document.getElementById('quest-text');
const questTypeDiv = document.getElementById('quest-type');
const dynamicArea = document.getElementById('dynamic-area');
const completeBtn = document.getElementById('complete-quest');
const nextBtn = document.getElementById('next-quest');
const resetProgBtn = document.getElementById('reset-progress');
const levelCompleteModal = document.getElementById('level-complete-modal');
const gameCompleteModal = document.getElementById('game-complete-modal');
const nextLevelBtn = document.getElementById('next-level-btn');
const restartGameBtn = document.getElementById('restart-game');
const hintModal = document.getElementById('hint-modal');
const hintTextSpan = document.getElementById('hint-text');
const closeHintBtn = document.getElementById('close-hint');

// ----- СОХРАНЕНИЕ И ЗАГРУЗКА -----
function saveGame() {
    const toSave = {
        currentLevel: game.currentLevel,
        currentQuestIndex: game.currentQuestIndex,
        exp: game.exp,
        soulShards: game.soulShards,
        completedQuests: game.completedQuests,
        levelCompleted: game.levelCompleted
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
        } catch(e) {}
    }
    if (!game.completedQuests) game.completedQuests = [];
    if (!game.levelCompleted) game.levelCompleted = [false,false,false,false,false];
    // Синхронизируем completed в объектах квестов
    for (let l=0; l<levelsData.length; l++) {
        for (let q of levelsData[l].quests) {
            q.completed = game.completedQuests.some(c => c.level === l && c.questId === q.id);
        }
    }
    // Если текущий уровень некорректен
    if (game.currentLevel >= levelsData.length) game.currentLevel = levelsData.length-1;
    while (game.currentLevel > 0 && !game.levelCompleted[game.currentLevel-1]) game.currentLevel--;
    // Индекс задания – следующий невыполненный
    let nextIdx = levelsData[game.currentLevel].quests.findIndex(q => !q.completed);
    if (nextIdx === -1) nextIdx = levelsData[game.currentLevel].quests.length-1;
    game.currentQuestIndex = nextIdx;
    saveGame();
    updateUI();
    loadCurrentQuest();
}

// ----- ОБНОВЛЕНИЕ UI -----
function updateUI() {
    const level = levelsData[game.currentLevel];
    const expNeeded = level.expNeeded;
    expCurrentSpan.innerText = game.exp;
    expNextSpan.innerText = expNeeded;
    let percent = (game.exp / expNeeded)*100;
    percent = Math.min(100, Math.max(0, percent));
    expFill.style.width = `${percent}%`;
    playerLevelSpan.innerText = game.currentLevel+1;
    soulShardsSpan.innerText = game.soulShards;
    currentLevelBadge.innerText = `Уровень ${game.currentLevel+1}: ${level.name}`;
    const completedCount = level.quests.filter(q => q.completed).length;
    const total = level.quests.length;
    questCounterSpan.innerText = `Заданий выполнено: ${completedCount} / ${total}`;
    nextBtn.disabled = !(completedCount > 0 && completedCount < total);
    renderLevelMap();
    applyLevelTheme(game.currentLevel);
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
        if (!isLocked) div.addEventListener('click', () => switchLevel(i));
        div.innerHTML = `
            <div class="level-icon"><i class="fas ${level.icon}"></i></div>
            <div class="level-info">
                <div class="level-title">${level.name}</div>
                <div class="progress-dots">${Array(total).fill().map((_,idx)=>{
                    const isQuestCompleted = level.quests[idx].completed;
                    return `<div class="dot ${isQuestCompleted ? 'completed' : ''}"></div>`;
                }).join('')}</div>
            </div>
            <div class="level-status">${isCompleted ? '<i class="fas fa-check-circle" style="color:#d4af37"></i>' : `${completedCount}/${total}`}</div>
        `;
        levelMapDiv.appendChild(div);
    }
}
function applyLevelTheme(levelIdx) {
    const theme = levelsData[levelIdx].bgTheme;
    rightColumn.setAttribute('data-theme', theme);
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
}
function switchLevel(newLevel) {
    if (newLevel === game.currentLevel) return;
    if (newLevel > game.currentLevel && !game.levelCompleted[newLevel-1]) {
        alert("Сначала завершите предыдущий уровень!");
        return;
    }
    game.currentLevel = newLevel;
    let nextIdx = levelsData[newLevel].quests.findIndex(q => !q.completed);
    if (nextIdx === -1) nextIdx = levelsData[newLevel].quests.length-1;
    game.currentQuestIndex = nextIdx;
    saveGame();
    updateUI();
    loadCurrentQuest();
}
function loadCurrentQuest() {
    const level = levelsData[game.currentLevel];
    const quest = level.quests[game.currentQuestIndex];
    if (!quest) return;
    currentQuestObj = quest;
    if (quest.completed) { moveToNextQuest(); return; }
    renderCurrentQuest();
}
function renderCurrentQuest() {
    const q = currentQuestObj;
    questTextDiv.innerText = q.text;
    let typeText = "";
    if (q.type === "fixed") typeText = "📜 Фиксированное задание";
    else if (q.type === "random") typeText = "🎲 Случайное задание (сгенерируйте)";
    else typeText = "❓ Викторина (введите ответ)";
    questTypeDiv.innerText = typeText;
    dynamicArea.innerHTML = "";
    if (q.type === "random") {
        if (!q.dynamicData) {
            const genBtn = document.createElement("button");
            genBtn.className = "random-btn";
            genBtn.innerHTML = '<i class="fas fa-dice"></i> Сгенерировать задание';
            genBtn.onclick = () => generateRandomCondition();
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
function generateRandomCondition() {
    if (!currentQuestObj || currentQuestObj.type !== "random") return;
    const possible = [
        `выбейте множитель x${rand(10,50)}`,
        `получите блэкджек ${rand(2,5)} раза подряд`,
        `сделайте ${rand(30,100)} спинов по 20$`,
        `поймайте бонус в ${randomElement(slotsList)}`,
        `выиграйте ${rand(200,1000)}$ в рулетке`
    ];
    currentQuestObj.dynamicData = randomElement(possible);
    saveGame();
    renderCurrentQuest();
}
function completeQuest() {
    if (!currentQuestObj || currentQuestObj.completed) {
        alert("Это задание уже выполнено!");
        return;
    }
    if (currentQuestObj.type === "random" && !currentQuestObj.dynamicData) {
        alert("Сначала сгенерируйте задание!");
        return;
    }
    if (currentQuestObj.type === "quiz") {
        const inp = document.getElementById("quizAnswerInput");
        if (!inp) return;
        const answer = inp.value.trim().toLowerCase();
        const correct = currentQuestObj.correctAnswer;
        if (!correct || answer !== correct) {
            alert(`❌ Неправильно! Правильный ответ: ${correct}`);
            return;
        }
    }
    // Начисляем награды
    const levelIdx = game.currentLevel;
    const expGain = 20 + levelIdx * 5;
    const shardGain = 5 + levelIdx * 2;
    game.exp += expGain;
    game.soulShards += shardGain;
    currentQuestObj.completed = true;
    game.completedQuests.push({ level: levelIdx, questId: currentQuestObj.id });
    // Проверка на повышение уровня (опыт)
    let levelUp = false;
    while (game.exp >= levelsData[game.currentLevel].expNeeded && game.currentLevel < levelsData.length-1) {
        game.exp -= levelsData[game.currentLevel].expNeeded;
        game.currentLevel++;
        levelUp = true;
    }
    saveGame();
    updateUI();
    if (levelUp) {
        alert(`✨ Вы достигли уровня ${game.currentLevel+1}! ✨`);
        loadCurrentQuest();
    } else {
        moveToNextQuest();
    }
}
function moveToNextQuest() {
    const level = levelsData[game.currentLevel];
    const next = level.quests.findIndex((q,i) => !q.completed && i > game.currentQuestIndex);
    if (next !== -1) {
        game.currentQuestIndex = next;
        saveGame();
        loadCurrentQuest();
        updateUI();
    } else {
        // Все задания уровня выполнены
        const allCompleted = level.quests.every(q => q.completed);
        if (allCompleted && !game.levelCompleted[game.currentLevel]) {
            game.levelCompleted[game.currentLevel] = true;
            saveGame();
            updateUI();
            if (game.currentLevel+1 < levelsData.length) {
                levelCompleteModal.classList.remove('hidden');
                document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${game.currentLevel+1}: ${level.name}.<br>Открыт уровень ${game.currentLevel+2}!`;
            } else {
                gameCompleteModal.classList.remove('hidden');
            }
        } else {
            // попытка найти любой невыполненный
            const anyUncompleted = level.quests.findIndex(q => !q.completed);
            if (anyUncompleted !== -1) {
                game.currentQuestIndex = anyUncompleted;
                saveGame();
                loadCurrentQuest();
                updateUI();
            }
        }
    }
}
function resetProgress() {
    if (confirm("Сбросить весь прогресс игры?")) {
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
    if (currentQuestObj.type === "fixed") hint = "Просто выполните действие в казино и нажмите «Выполнено».";
    else if (currentQuestObj.type === "random") {
        hint = currentQuestObj.dynamicData ? `Сделайте: ${currentQuestObj.dynamicData}` : "Сначала сгенерируйте задание.";
    } else {
        hint = `Подсказка: правильный ответ начинается с "${currentQuestObj.correctAnswer[0]}"`;
    }
    hintTextSpan.innerText = hint;
    hintModal.classList.remove('hidden');
}
// Обработчики
completeBtn.addEventListener('click', completeQuest);
nextBtn.addEventListener('click', moveToNextQuest);
resetProgBtn.addEventListener('click', resetProgress);
nextLevelBtn.addEventListener('click', () => {
    levelCompleteModal.classList.add('hidden');
    if (game.currentLevel+1 < levelsData.length) {
        game.currentLevel++;
        game.currentQuestIndex = levelsData[game.currentLevel].quests.findIndex(q => !q.completed);
        if (game.currentQuestIndex === -1) game.currentQuestIndex = 0;
        saveGame();
        updateUI();
        loadCurrentQuest();
    } else {
        gameCompleteModal.classList.add('hidden');
    }
});
restartGameBtn.addEventListener('click', () => resetProgress());
closeHintBtn.addEventListener('click', () => hintModal.classList.add('hidden'));
window.showHint = showHint;
// Запуск
loadGame();