// ===================================================================
//                 САГА О ПРОКЛЯТОМ РЫЦАРЕ
//          Грандиозный RPG-квест с 5 уровнями и 100 заданиями
//                           v3.0
// ===================================================================
// Автор: ваш помощник
// Описание: Полностью клиентская игра с сохранением прогресса,
//           тремя типами заданий (фикс, рандом, викторина),
//           уникальным оформлением каждого уровня,
//           системой подсказок для зрителей и анимациями.
// ===================================================================

(function() {
    "use strict";

    // ------------------------------
    // 1. КОНФИГУРАЦИЯ ИГРЫ
    // ------------------------------
    const TOTAL_LEVELS = 5;
    const QUESTS_PER_LEVEL = 20;        // 20 заданий на уровень = 100 всего
    const BASE_EXP_GAIN = 20;           // за выполнение задания +20 опыта
    const BASE_SHARD_GAIN = 5;          // +5 осколков души
    const EXP_PER_LEVEL_INCREASE = 50;   // каждый следующий уровень требует на 50 опыта больше (100,150,200,...)

    // ------------------------------
    // 2. БИБЛИОТЕКИ КОНТЕНТА (для генерации заданий)
    // ------------------------------
    const SLOTS = [
        "Dog house", "Sweet Bonanza", "Gates of Olympus", "Sugar Rush",
        "Le Bandit", "Book of Dead", "Starburst", "Bonanza Billion",
        "The Dog House Megaways", "Fruit Party", "Madame Destiny", "Big Bass Bonanza"
    ];
    const COLORS = ["красное", "чёрное"];
    const GAMES = ["рулетку", "блэкджек", "покер", "слоты", "кости"];
    const PRICES = ["50$", "100$", "250$", "500$", "1000$", "2000$", "5000$"];
    const WIN_SUMS = ["100$", "250$", "500$", "1000$", "2500$"];

    // Шаблоны фиксированных заданий
    const TEMPLATES_FIXED = [
        "Сделайте 20 спинов в {slot} по 20$",
        "Поставьте на {color} в рулетке и выиграйте",
        "Сыграйте 5 партий в блэкджек, проиграв не более 2",
        "Купите бонус за {price} в любом слоте",
        "Сделайте 3 депозита по {price}",
        "Выиграйте 3 раунда подряд в {game}",
        "Поймайте бонусную игру в {slot}",
        "Удвойте ставку в блэкджеке и выиграйте",
        "Наберите {win} выигрыша за 10 спинов",
        "Сделайте ставку на число {number} в рулетке"
    ];

    // Шаблоны рандомных заданий
    const TEMPLATES_RANDOM = [
        "выбейте множитель x{mult} в бонусной игре",
        "получите блэкджек {count} раза подряд",
        "выполните {tasks} любых заданий из чата",
        "сделайте {spins} спинов на слоте с множителем",
        "поймайте ретриггер в бонусе {times} раза",
        "выиграйте {win_amount} за один спин",
        "сделайте ставку на зеро и выиграйте"
    ];

    // База вопросов викторины
    const QUIZ_BASE = [
        { question: "Что означает RTP в слотах? (Return to Player / Real Time Play / Random)", answer: "return to player" },
        { question: "Сколько чисел в европейской рулетке? (36/37/38)", answer: "37" },
        { question: "Назовите самый популярный слот в мире (Starburst / Book of Dead / Sweet Bonanza)", answer: "starburst" },
        { question: "Кто написал роман «Игрок»? (Достоевский / Толстой / Чехов)", answer: "достоевский" },
        { question: "В каком городе находится казино Монте-Карло? (Монако / Франция / Италия)", answer: "монако" },
        { question: "Что такое «анте» в покере? (начальная ставка / дополнительный бонус / штраф)", answer: "начальная ставка" },
        { question: "Какой фильм о казино считается классикой? (Казино / Одиннадцать друзей Оушена / С широко закрытыми глазами)", answer: "казино" },
        { question: "Сколько очков даёт туз в блэкджеке? (1 или 11 / 10 / 11)", answer: "1 или 11" },
        { question: "Как называется комбинация 2,3,4,5,6 одной масти? (Стрит-флеш / Флеш / Стрит)", answer: "стрит-флеш" },
        { question: "Какой символ в слотах заменяет другие? (Wild / Scatter / Bonus)", answer: "wild" },
        { question: "Что означает ставка «All-in» в покере? (Ставка на все фишки / Пропуск хода / Фолд)", answer: "ставка на все фишки" },
        { question: "Какой карточной игре посвящён фильм «Двадцать одно»? (Блэкджек / Покер / Баккара)", answer: "блэкджек" },
        { question: "В каком году было основано первое казино в Лас-Вегасе? (1941 / 1931 / 1951)", answer: "1941" },
        { question: "Как называется бонус, когда выпадает три одинаковых символа? (Фриспины / Множитель / Джекпот)", answer: "фриспины" }
    ];

    // ------------------------------
    // 3. ДАННЫЕ УРОВНЕЙ (имена, иконки, темы)
    // ------------------------------
    const LEVELS_META = [
        { name: "Таверна «Удача»",    icon: "fa-mug-hot",   theme: "level1", expNeeded: 100,  bgClass: "theme-level1", panelColor: "#cd7f32" },
        { name: "Лес костей",         icon: "fa-tree",       theme: "level2", expNeeded: 150,  bgClass: "theme-level2", panelColor: "#6b8e23" },
        { name: "Гора блэкджека",     icon: "fa-mountain",   theme: "level3", expNeeded: 200,  bgClass: "theme-level3", panelColor: "#4682b4" },
        { name: "Пещера слотов",      icon: "fa-cave",       theme: "level4", expNeeded: 250,  bgClass: "theme-level4", panelColor: "#8a2be2" },
        { name: "Тронный зал джекпота", icon: "fa-crown",     theme: "level5", expNeeded: 300,  bgClass: "theme-level5", panelColor: "#ffd700" }
    ];

    // ------------------------------
    // 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ------------------------------
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Генерация одного задания по уровню и индексу (определяет тип)
    function generateQuest(levelIndex, questIndex) {
        let type;
        // Распределение типов в зависимости от уровня и сложности
        if (levelIndex === 0) { // 1 уровень: больше фикс
            if (questIndex < 12) type = "fixed";
            else if (questIndex < 17) type = "random";
            else type = "quiz";
        } else if (levelIndex === 1) {
            if (questIndex < 10) type = "fixed";
            else if (questIndex < 16) type = "random";
            else type = "quiz";
        } else if (levelIndex === 2) {
            if (questIndex < 8) type = "fixed";
            else if (questIndex < 14) type = "random";
            else type = "quiz";
        } else if (levelIndex === 3) {
            if (questIndex < 6) type = "fixed";
            else if (questIndex < 12) type = "random";
            else type = "quiz";
        } else {
            if (questIndex < 4) type = "fixed";
            else if (questIndex < 10) type = "random";
            else type = "quiz";
        }

        let text = "";
        let correctAnswer = null;
        if (type === "fixed") {
            let template = randElement(TEMPLATES_FIXED);
            text = template
                .replace("{slot}", randElement(SLOTS))
                .replace("{color}", randElement(COLORS))
                .replace("{price}", randElement(PRICES))
                .replace("{game}", randElement(GAMES))
                .replace("{win}", randElement(WIN_SUMS))
                .replace("{number}", rand(1,36).toString());
        } 
        else if (type === "random") {
            let template = randElement(TEMPLATES_RANDOM);
            text = template
                .replace("{mult}", rand(10, 100).toString())
                .replace("{count}", rand(2, 5).toString())
                .replace("{tasks}", rand(1, 5).toString())
                .replace("{spins}", rand(30, 150).toString())
                .replace("{times}", rand(2, 5).toString())
                .replace("{win_amount}", rand(200, 2000).toString());
        } 
        else { // quiz
            const qa = randElement(QUIZ_BASE);
            text = qa.question;
            correctAnswer = qa.answer;
        }

        return {
            id: questIndex,
            type: type,
            text: text,
            completed: false,
            correctAnswer: correctAnswer,
            dynamicData: null   // для хранения сгенерированного условия рандомного задания
        };
    }

    // Генерация всех уровней со всеми заданиями
    let LEVELS = [];
    for (let lvl = 0; lvl < TOTAL_LEVELS; lvl++) {
        let quests = [];
        for (let i = 0; i < QUESTS_PER_LEVEL; i++) {
            quests.push(generateQuest(lvl, i));
        }
        LEVELS.push({
            meta: LEVELS_META[lvl],
            quests: quests,
            completed: false
        });
    }

    // ------------------------------
    // 5. СОСТОЯНИЕ ИГРЫ
    // ------------------------------
    let game = {
        currentLevel: 0,            // индекс текущего уровня (0..4)
        currentQuestIndex: 0,       // индекс текущего задания на уровне
        exp: 0,
        soulShards: 0,
        completedQuests: [],        // массив {level, questId}
        levelCompleted: new Array(TOTAL_LEVELS).fill(false)
    };

    // Переменные для UI
    let currentQuestObj = null;
    let pendingRandomize = false;
    let isWaitingForHint = false;

    // ------------------------------
    // 6. DOM ЭЛЕМЕНТЫ
    // ------------------------------
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

    // ------------------------------
    // 7. СОХРАНЕНИЕ / ЗАГРУЗКА
    // ------------------------------
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
        // Синхронизируем задания
        for (let lvl=0; lvl<TOTAL_LEVELS; lvl++) {
            for (let q of LEVELS[lvl].quests) {
                q.completed = game.completedQuests.some(c => c.level === lvl && c.questId === q.id);
            }
        }
        for (let lvl=0; lvl<TOTAL_LEVELS; lvl++) {
            LEVELS[lvl].completed = game.levelCompleted[lvl];
        }
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
            } catch(e) { console.warn(e); }
        }
        // Инициализация по умолчанию, если чего-то нет
        if (!game.completedQuests) game.completedQuests = [];
        if (!game.levelCompleted) game.levelCompleted = new Array(TOTAL_LEVELS).fill(false);
        // Применяем флаги к заданиям
        for (let lvl=0; lvl<TOTAL_LEVELS; lvl++) {
            for (let q of LEVELS[lvl].quests) {
                q.completed = game.completedQuests.some(c => c.level === lvl && c.questId === q.id);
            }
            LEVELS[lvl].completed = game.levelCompleted[lvl];
        }
        // Коррекция текущего уровня (если предыдущий не пройден)
        if (game.currentLevel > 0 && !game.levelCompleted[game.currentLevel-1]) {
            game.currentLevel = 0;
            game.currentQuestIndex = 0;
            while (game.currentLevel < TOTAL_LEVELS-1 && game.levelCompleted[game.currentLevel]) game.currentLevel++;
        }
        // Индекс задания - следующий невыполненный
        const curQuests = LEVELS[game.currentLevel].quests;
        let nxt = curQuests.findIndex(q => !q.completed);
        if (nxt === -1) nxt = curQuests.length - 1;
        game.currentQuestIndex = nxt;
        saveGame();
    }

    // ------------------------------
    // 8. ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
    // ------------------------------
    function updateUI() {
        const level = LEVELS[game.currentLevel];
        const meta = level.meta;
        const expNeeded = meta.expNeeded;
        expCurrentSpan.innerText = game.exp;
        expNextSpan.innerText = expNeeded;
        let percent = (game.exp / expNeeded) * 100;
        percent = Math.min(100, Math.max(0, percent));
        expFill.style.width = `${percent}%`;
        playerLevelSpan.innerText = game.currentLevel + 1;
        soulShardsSpan.innerText = game.soulShards;
        currentLevelBadge.innerText = `Уровень ${game.currentLevel+1}: ${meta.name}`;
        const completedCount = level.quests.filter(q => q.completed).length;
        const total = level.quests.length;
        questCounterSpan.innerText = `Заданий выполнено: ${completedCount} / ${total}`;
        // Кнопка "Следующее задание" активна только если есть выполненные и не все
        nextBtn.disabled = !(completedCount > 0 && completedCount < total);
        renderLevelMap();
        applyTheme(game.currentLevel);
    }

    function renderLevelMap() {
        levelMapDiv.innerHTML = '';
        for (let i=0; i<TOTAL_LEVELS; i++) {
            const level = LEVELS[i];
            const meta = level.meta;
            const completedCount = level.quests.filter(q => q.completed).length;
            const total = level.quests.length;
            const isCompleted = (completedCount === total);
            const isActive = (i === game.currentLevel);
            const isLocked = (i > game.currentLevel) && !game.levelCompleted[i-1];
            const levelDiv = document.createElement('div');
            levelDiv.className = `level-item ${isLocked ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            if (!isLocked) {
                levelDiv.addEventListener('click', () => switchLevel(i));
            }
            levelDiv.innerHTML = `
                <div class="level-icon"><i class="fas ${meta.icon}"></i></div>
                <div class="level-info">
                    <div class="level-title">${meta.name}</div>
                    <div class="progress-dots">
                        ${Array(total).fill().map((_, idx) => {
                            const done = level.quests[idx].completed;
                            return `<div class="dot ${done ? 'completed' : ''}"></div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="level-status">
                    ${isCompleted ? '<i class="fas fa-check-circle" style="color:#d4af37"></i>' : `${completedCount}/${total}`}
                </div>
            `;
            levelMapDiv.appendChild(levelDiv);
        }
    }

    function applyTheme(levelIdx) {
        const meta = LEVELS_META[levelIdx];
        rightColumn.setAttribute('data-theme', meta.theme);
        document.body.className = '';
        document.body.classList.add(meta.bgClass);
    }

    // ------------------------------
    // 9. ПЕРЕКЛЮЧЕНИЕ УРОВНЕЙ
    // ------------------------------
    function switchLevel(newLevel) {
        if (newLevel === game.currentLevel) return;
        if (newLevel > game.currentLevel && !game.levelCompleted[newLevel-1]) {
            alert("Сначала завершите предыдущий уровень!");
            return;
        }
        game.currentLevel = newLevel;
        const curQuests = LEVELS[newLevel].quests;
        let nextIdx = curQuests.findIndex(q => !q.completed);
        if (nextIdx === -1) nextIdx = curQuests.length - 1;
        game.currentQuestIndex = nextIdx;
        saveGame();
        updateUI();
        loadCurrentQuest();
    }

    // ------------------------------
    // 10. ЗАГРУЗКА ТЕКУЩЕГО ЗАДАНИЯ
    // ------------------------------
    function loadCurrentQuest() {
        const level = LEVELS[game.currentLevel];
        const quest = level.quests[game.currentQuestIndex];
        if (!quest) return;
        currentQuestObj = quest;
        if (quest.completed) {
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
        else if (q.type === "random") typeText = "🎲 Случайное задание (нажмите «Сгенерировать»)";
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
            `выбейте множитель x${rand(10,100)}`,
            `получите блэкджек ${rand(2,5)} раза подряд`,
            `сделайте ${rand(30,150)} спинов по 20$`,
            `поймайте бонус в ${randElement(SLOTS)}`,
            `выиграйте ${rand(200,2000)}$ в рулетке`,
            `удвойте ставку и выиграйте ${rand(2,4)} раза`
        ];
        currentQuestObj.dynamicData = randElement(possible);
        saveGame();
        renderCurrentQuest();
    }

    // ------------------------------
    // 11. ВЫПОЛНЕНИЕ ЗАДАНИЯ
    // ------------------------------
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
            const userAnswer = inp.value.trim().toLowerCase();
            const correct = currentQuestObj.correctAnswer;
            if (!correct || userAnswer !== correct) {
                alert(`❌ Неправильно! Правильный ответ: ${correct}`);
                return;
            }
        }
        // Начисляем награду
        const levelIdx = game.currentLevel;
        const expGain = BASE_EXP_GAIN + levelIdx * 5;
        const shardGain = BASE_SHARD_GAIN + levelIdx * 2;
        game.exp += expGain;
        game.soulShards += shardGain;
        currentQuestObj.completed = true;
        game.completedQuests.push({ level: levelIdx, questId: currentQuestObj.id });
        game.levelCompleted[levelIdx] = LEVELS[levelIdx].quests.every(q => q.completed);
        // Проверка на повышение уровня (опыт может переполнить)
        let levelUp = false;
        while (game.exp >= LEVELS[game.currentLevel].meta.expNeeded && game.currentLevel < TOTAL_LEVELS-1) {
            game.exp -= LEVELS[game.currentLevel].meta.expNeeded;
            game.currentLevel++;
            levelUp = true;
        }
        saveGame();
        updateUI();
        if (levelUp) {
            alert(`✨ Поздравляем! Вы достигли уровня ${game.currentLevel+1}! ✨`);
            loadCurrentQuest();
        } else {
            moveToNextQuest();
        }
        // Анимация рыцаря
        animateKnight();
    }

    function moveToNextQuest() {
        const level = LEVELS[game.currentLevel];
        const currentIdx = game.currentQuestIndex;
        const nextIdx = level.quests.findIndex((q, i) => !q.completed && i > currentIdx);
        if (nextIdx !== -1) {
            game.currentQuestIndex = nextIdx;
            saveGame();
            loadCurrentQuest();
            updateUI();
        } else {
            // Все задания уровня завершены? Проверяем
            const allCompleted = level.quests.every(q => q.completed);
            if (allCompleted && !game.levelCompleted[game.currentLevel]) {
                game.levelCompleted[game.currentLevel] = true;
                saveGame();
                updateUI();
                if (game.currentLevel + 1 < TOTAL_LEVELS) {
                    levelCompleteModal.classList.remove('hidden');
                    document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${game.currentLevel+1}: ${LEVELS[game.currentLevel].meta.name}.<br>Открыт уровень ${game.currentLevel+2}!`;
                } else {
                    gameCompleteModal.classList.remove('hidden');
                }
            } else {
                // Попробуем найти любой невыполненный
                const any = level.quests.findIndex(q => !q.completed);
                if (any !== -1) {
                    game.currentQuestIndex = any;
                    saveGame();
                    loadCurrentQuest();
                    updateUI();
                }
            }
        }
    }

    function animateKnight() {
        const knight = document.querySelector('.knight-icon');
        if (knight) {
            knight.style.animation = 'none';
            setTimeout(() => { knight.style.animation = 'float 3s ease-in-out infinite'; }, 10);
        }
    }

    // ------------------------------
    // 12. СБРОС ПРОГРЕССА
    // ------------------------------
    function resetProgress() {
        if (confirm("Вы уверены, что хотите сбросить ВЕСЬ прогресс игры? Все уровни и осколки будут удалены.")) {
            localStorage.removeItem('knightRpg');
            location.reload();
        }
    }

    // ------------------------------
    // 13. ПОДСКАЗКА ДЛЯ ЗРИТЕЛЕЙ
    // ------------------------------
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
                hint = `Текущее задание: ${currentQuestObj.dynamicData}. Сделайте это и нажмите «Выполнено».`;
            } else {
                hint = "Сначала сгенерируйте задание кнопкой ниже.";
            }
        } else {
            hint = `Подсказка: правильный ответ начинается с буквы "${currentQuestObj.correctAnswer[0]}"`;
        }
        hintTextSpan.innerText = hint;
        hintModal.classList.remove('hidden');
    }

    // ------------------------------
    // 14. ОБРАБОТЧИКИ СОБЫТИЙ
    // ------------------------------
    completeBtn.addEventListener('click', completeQuest);
    nextBtn.addEventListener('click', moveToNextQuest);
    resetProgBtn.addEventListener('click', resetProgress);
    nextLevelBtn.addEventListener('click', () => {
        levelCompleteModal.classList.add('hidden');
        if (game.currentLevel + 1 < TOTAL_LEVELS) {
            game.currentLevel++;
            game.currentQuestIndex = LEVELS[game.currentLevel].quests.findIndex(q => !q.completed);
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
    // Глобальная функция для вызова из консоли или чат-бота
    window.showHint = showHint;

    // ------------------------------
    // 15. ИНИЦИАЛИЗАЦИЯ ИГРЫ
    // ------------------------------
    loadGame();
    updateUI();
    loadCurrentQuest();
})();