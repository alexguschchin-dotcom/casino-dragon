// ===================================================================
//                 САГА О ПРОКЛЯТОМ РЫЦАРЕ - ФИНАЛЬНАЯ ВЕРСИЯ
//          Масштабный RPG-квест со свободным доступом к уровням,
//          таблицей лидеров, звуками, бонусами и частицами.
// ===================================================================

(function() {
    "use strict";

    // ------------------------------ КОНФИГ ------------------------------
    const TOTAL_LEVELS = 5;
    const QUESTS_PER_LEVEL = 20;
    const BASE_EXP_GAIN = 20;
    const BASE_SHARD_GAIN = 5;
    const EXP_PER_LEVEL = [100, 150, 200, 250, 300];

    // ------------------------------ БИБЛИОТЕКИ КОНТЕНТА ------------------
    const SLOTS = ["Dog house", "Sweet Bonanza", "Gates of Olympus", "Sugar Rush", "Le Bandit", "Book of Dead", "Starburst", "Bonanza Billion"];
    const COLORS = ["красное", "чёрное"];
    const GAMES = ["рулетку", "блэкджек", "покер", "слоты", "кости"];
    const PRICES = ["50$", "100$", "250$", "500$", "1000$"];
    const WIN_SUMS = ["100$", "250$", "500$", "1000$"];

    const TEMPLATES_FIXED = [
        "Сделайте 20 спинов в {slot} по 20$",
        "Поставьте на {color} в рулетке и выиграйте",
        "Сыграйте 5 партий в блэкджек, проиграв не более 2",
        "Купите бонус за {price} в любом слоте",
        "Сделайте 3 депозита по {price}",
        "Выиграйте 3 раунда подряд в {game}",
        "Поймайте бонусную игру в {slot}",
        "Удвойте ставку в блэкджеке и выиграйте",
        "Наберите {win} выигрыша за 10 спинов"
    ];

    const TEMPLATES_RANDOM = [
        "выбейте множитель x{mult} в бонусной игре",
        "получите блэкджек {count} раза подряд",
        "сделайте {spins} спинов на слоте с множителем",
        "поймайте ретриггер в бонусе {times} раза",
        "выиграйте {win_amount}$ за один спин"
    ];

    const QUIZ_BASE = [
        { question: "Что означает RTP в слотах? (Return to Player / Real Time Play)", answer: "return to player" },
        { question: "Сколько чисел в европейской рулетке? (36/37/38)", answer: "37" },
        { question: "Назовите самый популярный слот в мире (Starburst / Book of Dead)", answer: "starburst" },
        { question: "Кто написал роман «Игрок»? (Достоевский / Толстой)", answer: "достоевский" },
        { question: "Что такое «анте» в покере? (начальная ставка / дополнительный бонус)", answer: "начальная ставка" },
        { question: "Сколько очков даёт туз в блэкджеке? (1 или 11 / 10)", answer: "1 или 11" },
        { question: "Как называется комбинация 2,3,4,5,6 одной масти? (Стрит-флеш / Флеш)", answer: "стрит-флеш" },
        { question: "Какой символ в слотах заменяет другие? (Wild / Scatter)", answer: "wild" }
    ];

    const LEVELS_META = [
        { name: "Таверна «Удача»",    icon: "fa-mug-hot",   theme: "level1", bgClass: "theme-level1", color: "#cd7f32" },
        { name: "Лес костей",         icon: "fa-tree",       theme: "level2", bgClass: "theme-level2", color: "#6b8e23" },
        { name: "Гора блэкджека",     icon: "fa-mountain",   theme: "level3", bgClass: "theme-level3", color: "#4682b4" },
        { name: "Пещера слотов",      icon: "fa-cave",       theme: "level4", bgClass: "theme-level4", color: "#8a2be2" },
        { name: "Тронный зал джекпота", icon: "fa-crown",     theme: "level5", bgClass: "theme-level5", color: "#ffd700" }
    ];

    // ------------------------------ ЗВУКИ (Web Audio API) ------------------
    let audioCtx = null;
    let soundEnabled = true;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    function playSound(type) {
        if (!soundEnabled) return;
        if (!audioCtx) initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        if (type === "success") { osc.frequency.value = 880; osc.frequency.exponentialRampToValueAtTime(440, now + 0.2); }
        else if (type === "error") { osc.frequency.value = 220; osc.frequency.exponentialRampToValueAtTime(110, now + 0.3); }
        else if (type === "levelup") { osc.frequency.value = 660; osc.frequency.setValueAtTime(880, now + 0.1); osc.frequency.exponentialRampToValueAtTime(440, now + 0.4); }
        else { osc.frequency.value = 523.25; }
        osc.start();
        osc.stop(now + 0.6);
    }

    // ------------------------------ ГЕНЕРАЦИЯ ЗАДАНИЙ -----------------------
    function generateQuest(levelIdx, questIdx) {
        let type;
        if (levelIdx === 0) type = questIdx < 12 ? "fixed" : (questIdx < 17 ? "random" : "quiz");
        else if (levelIdx === 1) type = questIdx < 10 ? "fixed" : (questIdx < 16 ? "random" : "quiz");
        else if (levelIdx === 2) type = questIdx < 8 ? "fixed" : (questIdx < 14 ? "random" : "quiz");
        else if (levelIdx === 3) type = questIdx < 6 ? "fixed" : (questIdx < 12 ? "random" : "quiz");
        else type = questIdx < 4 ? "fixed" : (questIdx < 10 ? "random" : "quiz");

        let text = "", correctAnswer = null;
        if (type === "fixed") {
            let tpl = TEMPLATES_FIXED[Math.floor(Math.random() * TEMPLATES_FIXED.length)];
            text = tpl.replace("{slot}", SLOTS[Math.floor(Math.random() * SLOTS.length)])
                      .replace("{color}", COLORS[Math.floor(Math.random() * COLORS.length)])
                      .replace("{price}", PRICES[Math.floor(Math.random() * PRICES.length)])
                      .replace("{game}", GAMES[Math.floor(Math.random() * GAMES.length)])
                      .replace("{win}", WIN_SUMS[Math.floor(Math.random() * WIN_SUMS.length)]);
        } else if (type === "random") {
            let tpl = TEMPLATES_RANDOM[Math.floor(Math.random() * TEMPLATES_RANDOM.length)];
            text = tpl.replace("{mult}", Math.floor(Math.random() * 90 + 10))
                      .replace("{count}", Math.floor(Math.random() * 4 + 2))
                      .replace("{spins}", Math.floor(Math.random() * 120 + 30))
                      .replace("{times}", Math.floor(Math.random() * 4 + 2))
                      .replace("{win_amount}", Math.floor(Math.random() * 1800 + 200));
        } else {
            let qa = QUIZ_BASE[Math.floor(Math.random() * QUIZ_BASE.length)];
            text = qa.question;
            correctAnswer = qa.answer;
        }
        return { id: questIdx, type, text, completed: false, correctAnswer, dynamicData: null };
    }

    let LEVELS = [];
    for (let lvl = 0; lvl < TOTAL_LEVELS; lvl++) {
        let quests = [];
        for (let i = 0; i < QUESTS_PER_LEVEL; i++) quests.push(generateQuest(lvl, i));
        LEVELS.push({ meta: LEVELS_META[lvl], quests, completed: false, completedCount: 0 });
    }

    // ------------------------------ СОСТОЯНИЕ ИГРЫ -------------------------
    let game = {
        currentLevel: 0,
        currentQuestIndex: 0,
        exp: 0,
        soulShards: 0,
        completedQuests: [],      // {level, questId}
        levelCompleted: new Array(TOTAL_LEVELS).fill(false),
        levelQuestCount: new Array(TOTAL_LEVELS).fill(0)
    };
    let currentQuestObj = null;

    // Лидерборд
    let leaderboard = { alex: 0, vika: 0, batiya: 0 };
    let activeHero = "alex";

    // ------------------------------ DOM ЭЛЕМЕНТЫ ---------------------------
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
    const soundToggle = document.getElementById('sound-toggle');
    const levelCompleteModal = document.getElementById('level-complete-modal');
    const gameCompleteModal = document.getElementById('game-complete-modal');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const restartGameBtn = document.getElementById('restart-game');
    const hintModal = document.getElementById('hint-modal');
    const hintTextSpan = document.getElementById('hint-text');
    const closeHintBtn = document.getElementById('close-hint');
    const activeHeroSelect = document.getElementById('active-hero');
    const scoreElements = { alex: document.getElementById('score-alex'), vika: document.getElementById('score-vika'), batiya: document.getElementById('score-batiya') };
    const toastDiv = document.getElementById('toast-notification');

    function showToast(msg) {
        toastDiv.innerText = msg;
        toastDiv.classList.remove('hidden');
        setTimeout(() => toastDiv.classList.add('hidden'), 2500);
    }

    // ------------------------------ СОХРАНЕНИЕ / ЗАГРУЗКА -------------------
    function saveGame() {
        let toSave = {
            currentLevel: game.currentLevel, currentQuestIndex: game.currentQuestIndex,
            exp: game.exp, soulShards: game.soulShards, completedQuests: game.completedQuests,
            levelCompleted: game.levelCompleted, levelQuestCount: game.levelQuestCount,
            leaderboard, activeHero
        };
        localStorage.setItem('knightRpgEpic', JSON.stringify(toSave));
        for (let lvl = 0; lvl < TOTAL_LEVELS; lvl++) {
            for (let q of LEVELS[lvl].quests) q.completed = game.completedQuests.some(c => c.level === lvl && c.questId === q.id);
            LEVELS[lvl].completed = game.levelCompleted[lvl];
        }
    }

    function loadGame() {
        let saved = localStorage.getItem('knightRpgEpic');
        if (saved) {
            try {
                let data = JSON.parse(saved);
                game.currentLevel = data.currentLevel;
                game.currentQuestIndex = data.currentQuestIndex;
                game.exp = data.exp;
                game.soulShards = data.soulShards;
                game.completedQuests = data.completedQuests || [];
                game.levelCompleted = data.levelCompleted || new Array(TOTAL_LEVELS).fill(false);
                game.levelQuestCount = data.levelQuestCount || new Array(TOTAL_LEVELS).fill(0);
                leaderboard = data.leaderboard || { alex: 0, vika: 0, batiya: 0 };
                activeHero = data.activeHero || "alex";
            } catch(e) { console.warn(e); }
        }
        if (!game.levelQuestCount) game.levelQuestCount = new Array(TOTAL_LEVELS).fill(0);
        for (let lvl = 0; lvl < TOTAL_LEVELS; lvl++) {
            for (let q of LEVELS[lvl].quests) {
                q.completed = game.completedQuests.some(c => c.level === lvl && c.questId === q.id);
                if (q.completed) game.levelQuestCount[lvl]++;
            }
            LEVELS[lvl].completed = game.levelCompleted[lvl];
        }
        if (activeHeroSelect) activeHeroSelect.value = activeHero;
        updateLeaderboardUI();
        let curQuests = LEVELS[game.currentLevel].quests;
        let nxt = curQuests.findIndex(q => !q.completed);
        if (nxt === -1) nxt = 0;
        game.currentQuestIndex = nxt;
        saveGame();
    }

    function updateLeaderboardUI() {
        scoreElements.alex.innerText = leaderboard.alex;
        scoreElements.vika.innerText = leaderboard.vika;
        scoreElements.batiya.innerText = leaderboard.batiya;
    }

    function addLeaderboardPoints(points = 1) {
        leaderboard[activeHero] += points;
        updateLeaderboardUI();
        saveGame();
        showToast(`+${points} очков ${activeHeroSelect.options[activeHeroSelect.selectedIndex].text}!`);
    }

    // ------------------------------ БОНУСЫ ЗА КАЖДЫЕ 5 ЗАДАНИЙ --------------
    function checkAndGrantBonus(levelIdx) {
        let completed = game.levelQuestCount[levelIdx];
        if (completed % 5 === 0 && completed > 0) {
            let bonusType = Math.random() < 0.5 ? "exp" : "shard";
            if (bonusType === "exp") {
                let bonusExp = 30;
                game.exp += bonusExp;
                showToast(`🎁 Бонус! +${bonusExp} опыта за 5 заданий!`);
                playSound("success");
            } else {
                let bonusShards = 15;
                game.soulShards += bonusShards;
                showToast(`💎 Бонус! +${bonusShards} осколков души!`);
                playSound("success");
            }
            saveGame();
            updateUI();
        }
    }

    // ------------------------------ ВЫПОЛНЕНИЕ ЗАДАНИЯ ----------------------
    function completeQuest() {
        if (!currentQuestObj || currentQuestObj.completed) { showToast("Задание уже выполнено!"); return; }
        if (currentQuestObj.type === "random" && !currentQuestObj.dynamicData) { showToast("Сначала сгенерируйте задание!"); return; }
        if (currentQuestObj.type === "quiz") {
            let inp = document.getElementById("quizAnswerInput");
            if (!inp || inp.value.trim().toLowerCase() !== currentQuestObj.correctAnswer) {
                playSound("error");
                showToast(`❌ Неправильно! Правильный ответ: ${currentQuestObj.correctAnswer}`);
                return;
            }
        }
        // Начисление награды
        let levelIdx = game.currentLevel;
        let expGain = BASE_EXP_GAIN + levelIdx * 5;
        let shardGain = BASE_SHARD_GAIN + levelIdx * 2;
        game.exp += expGain;
        game.soulShards += shardGain;
        currentQuestObj.completed = true;
        game.completedQuests.push({ level: levelIdx, questId: currentQuestObj.id });
        game.levelQuestCount[levelIdx]++;
        game.levelCompleted[levelIdx] = (game.levelQuestCount[levelIdx] === QUESTS_PER_LEVEL);
        
        // Начисление очков лидерборда
        addLeaderboardPoints(1);
        playSound("success");
        
        // Бонус за каждые 5 заданий
        checkAndGrantBonus(levelIdx);
        
        // Проверка повышения уровня рыцаря (опыт)
        let needed = EXP_PER_LEVEL[Math.min(game.currentLevel, TOTAL_LEVELS-1)];
        while (game.exp >= needed && game.currentLevel < TOTAL_LEVELS-1) {
            game.exp -= needed;
            game.currentLevel++;
            needed = EXP_PER_LEVEL[game.currentLevel];
            playSound("levelup");
            showToast(`✨ УРОВЕНЬ РЫЦАРЯ ПОВЫШЕН ДО ${game.currentLevel+1}! ✨`);
        }
        saveGame();
        updateUI();
        moveToNextQuest();
        animateKnight();
    }

    function moveToNextQuest() {
        let level = LEVELS[game.currentLevel];
        let currentIdx = game.currentQuestIndex;
        let nextIdx = level.quests.findIndex((q, i) => !q.completed && i > currentIdx);
        if (nextIdx !== -1) {
            game.currentQuestIndex = nextIdx;
            saveGame();
            loadCurrentQuest();
            updateUI();
        } else {
            let any = level.quests.findIndex(q => !q.completed);
            if (any !== -1) {
                game.currentQuestIndex = any;
                saveGame();
                loadCurrentQuest();
                updateUI();
            } else if (game.levelCompleted[game.currentLevel]) {
                if (game.currentLevel + 1 < TOTAL_LEVELS) {
                    levelCompleteModal.classList.remove('hidden');
                    document.getElementById('level-complete-text').innerHTML = `Вы завершили уровень ${game.currentLevel+1}: ${LEVELS[game.currentLevel].meta.name}.<br>Теперь доступен следующий!`;
                } else {
                    gameCompleteModal.classList.remove('hidden');
                }
            }
        }
    }

    function loadCurrentQuest() {
        let quest = LEVELS[game.currentLevel].quests[game.currentQuestIndex];
        if (!quest) return;
        currentQuestObj = quest;
        if (quest.completed) { moveToNextQuest(); return; }
        renderCurrentQuest();
    }

    function renderCurrentQuest() {
        let q = currentQuestObj;
        questTextDiv.innerText = q.text;
        questTypeDiv.innerText = q.type === "fixed" ? "📜 Фиксированное задание" : (q.type === "random" ? "🎲 Случайное задание" : "❓ Викторина");
        dynamicArea.innerHTML = "";
        if (q.type === "random") {
            if (!q.dynamicData) {
                let genBtn = document.createElement("button");
                genBtn.className = "random-btn";
                genBtn.innerHTML = '<i class="fas fa-dice"></i> Сгенерировать условие';
                genBtn.onclick = () => {
                    let possible = [`выбейте множитель x${Math.floor(Math.random()*90+10)}`, `получите блэкджек ${Math.floor(Math.random()*4+2)} раза`, `сделайте ${Math.floor(Math.random()*120+30)} спинов`, `поймайте бонус в ${SLOTS[Math.floor(Math.random()*SLOTS.length)]}`];
                    q.dynamicData = possible[Math.floor(Math.random()*possible.length)];
                    saveGame();
                    renderCurrentQuest();
                };
                dynamicArea.appendChild(genBtn);
            } else {
                let p = document.createElement("p");
                p.innerHTML = `<i class="fas fa-dice"></i> Условие: ${q.dynamicData}`;
                dynamicArea.appendChild(p);
            }
        } else if (q.type === "quiz") {
            let input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Введите ответ...";
            input.className = "dynamic-input";
            input.id = "quizAnswerInput";
            dynamicArea.appendChild(input);
        }
    }

    // ------------------------------ UI ОБНОВЛЕНИЯ --------------------------
    function updateUI() {
        let level = LEVELS[game.currentLevel];
        let meta = level.meta;
        let needed = EXP_PER_LEVEL[Math.min(game.currentLevel, TOTAL_LEVELS-1)];
        expCurrentSpan.innerText = game.exp;
        expNextSpan.innerText = needed;
        let percent = Math.min(100, (game.exp / needed) * 100);
        expFill.style.width = `${percent}%`;
        playerLevelSpan.innerText = game.currentLevel + 1;
        soulShardsSpan.innerText = game.soulShards;
        currentLevelBadge.innerText = `Уровень ${game.currentLevel+1}: ${meta.name}`;
        let completedCount = game.levelQuestCount[game.currentLevel];
        questCounterSpan.innerText = `Заданий выполнено: ${completedCount} / ${QUESTS_PER_LEVEL}`;
        nextBtn.disabled = !(completedCount > 0 && completedCount < QUESTS_PER_LEVEL);
        renderLevelMap();
        applyTheme(game.currentLevel);
    }

    function renderLevelMap() {
        levelMapDiv.innerHTML = '';
        for (let i = 0; i < TOTAL_LEVELS; i++) {
            let level = LEVELS[i];
            let completedCount = game.levelQuestCount[i];
            let isActive = (i === game.currentLevel);
            let levelDiv = document.createElement('div');
            levelDiv.className = `level-item ${isActive ? 'active' : ''}`;
            levelDiv.addEventListener('click', () => switchLevel(i));
            levelDiv.innerHTML = `
                <div class="level-icon"><i class="fas ${level.meta.icon}"></i></div>
                <div class="level-info">
                    <div class="level-title">${level.meta.name}</div>
                    <div class="progress-dots">
                        ${Array(QUESTS_PER_LEVEL).fill().map((_, idx) => `<div class="dot ${level.quests[idx].completed ? 'completed' : ''}"></div>`).join('')}
                    </div>
                </div>
                <div class="level-status">${completedCount}/${QUESTS_PER_LEVEL}</div>
            `;
            levelMapDiv.appendChild(levelDiv);
        }
    }

    function applyTheme(levelIdx) {
        let meta = LEVELS_META[levelIdx];
        document.body.className = '';
        document.body.classList.add(meta.bgClass);
        document.getElementById('right-column').setAttribute('data-theme', meta.theme);
    }

    function switchLevel(newLevel) {
        if (newLevel === game.currentLevel) return;
        game.currentLevel = newLevel;
        let curQuests = LEVELS[newLevel].quests;
        let nextIdx = curQuests.findIndex(q => !q.completed);
        if (nextIdx === -1) nextIdx = 0;
        game.currentQuestIndex = nextIdx;
        saveGame();
        updateUI();
        loadCurrentQuest();
        playSound("click");
    }

    function animateKnight() {
        let knight = document.querySelector('.knight-icon');
        if (knight) {
            knight.style.animation = 'none';
            setTimeout(() => knight.style.animation = 'floatKnight 3s ease-in-out infinite', 10);
        }
    }

    function resetProgress() {
        if (confirm("Сбросить ВСЁ? Это удалит прогресс всех уровней и лидерборд.")) {
            localStorage.removeItem('knightRpgEpic');
            location.reload();
        }
    }

    function showHint() {
        if (!currentQuestObj || currentQuestObj.completed) { hintTextSpan.innerText = "Выберите активное задание."; }
        else if (currentQuestObj.type === "quiz") { hintTextSpan.innerText = `Подсказка: ответ начинается с "${currentQuestObj.correctAnswer[0]}"`; }
        else { hintTextSpan.innerText = "Выполните описанное действие в казино и нажмите «Выполнено»."; }
        hintModal.classList.remove('hidden');
    }

    // ------------------------------ ЗВУК TOGGLE ----------------------------
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        if (soundEnabled && audioCtx) audioCtx.resume();
    });

    // ------------------------------ ЧАТ-ПОМОЩЬ (глобальная функция) --------
    window.showHint = showHint;

    // ------------------------------ ИНИЦИАЛИЗАЦИЯ -------------------------
    loadGame();
    updateUI();
    loadCurrentQuest();
    initAudio();
    activeHeroSelect.addEventListener('change', (e) => { activeHero = e.target.value; saveGame(); });
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
        }
    });
    restartGameBtn.addEventListener('click', resetProgress);
    closeHintBtn.addEventListener('click', () => hintModal.classList.add('hidden'));
})();