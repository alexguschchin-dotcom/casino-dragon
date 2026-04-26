(function(){
    "use strict";

    // ---------- КОНФИГ ----------
    const TOTAL_LEVELS = 5;
    const QUESTS_PER_LEVEL = 20;

    // Задания для каждого уровня (уникальные)
    const LEVEL_TASKS = [
        [ // Уровень 1: Огонь – риск, ставки
            "Сделай 10 спинов на любом слоте по минимальной ставке",
            "Поставь на «красное» в рулетке и выиграй",
            "Выиграй в блэкджеке одну раздачу",
            "Сделай спин с максимальной ставкой",
            "Купи бонус в любом слоте",
            "Сыграй 3 раунда в блэкджек, проиграв не более одного",
            "Поставь на «чёрное» и проиграй",
            "Получи множитель x2 в любом слоте",
            "Сделай 20 спинов подряд, не меняя слот",
            "Выиграй 100$ одним спином",
            "Сделай ставку на 0 в рулетке",
            "Активируй бесплатные вращения (фриспины)",
            "Поставь на 1-12 в рулетке и выиграй",
            "Сделай 5 спинов в слоте с вулканом",
            "Удвой выигрыш в блэкджеке",
            "Сыграй в покер и выиграй раздачу",
            "Пополни баланс на 20$ и сделай спин",
            "Поставь на четное и выиграй 2 раза подряд",
            "Забери джекпот (любой)",
            "Сделай ставку на 13-24 и выиграй"
        ],
        [ // Уровень 2: Лес – викторины
            "Сколько чисел в европейской рулетке? (37)",
            "Какова вероятность выпадения одного числа в рулетке? (1/37)",
            "Что означает RTP? (Return to Player)",
            "Сколько очков даёт туз в блэкджеке? (1 или 11)",
            "Что такое сплит в блэкджеке? (разделить пару)",
            "Назови комбинацию «туз + карта 10» (блэкджек)",
            "Сколько карт в колоде для блэкджека? (52)",
            "Что такое «анте» в покере? (начальная ставка)",
            "Какой символ в слотах заменяет все? (Wild)",
            "Назови любой слот от Pragmatic Play",
            "Как называется бонус с бесплатными вращениями? (фриспины)",
            "Какой фильм про казино с Ди Каприо? (Волк с Уолл-стрит)",
            "Что означает «дабл даун»? (удвоить ставку)",
            "Сделай 15 спинов на любом слоте от Hacksaw",
            "Поставь на зеро и выиграй",
            "Выиграй в блэкджеке 2 руки подряд",
            "Сделай ставку на 1-й дюжине и выиграй",
            "Поймай любой бонус с множителем x5+",
            "Сделай 30 спинов на слоте с высокой волатильностью",
            "Что такое «холодный слот»? (давно не давал выигрыш)"
        ],
        [ // Уровень 3: Лёд – карты, блэкджек
            "Собери блэкджек из туза и десятки",
            "Выиграй в блэкджек 3 раздачи подряд",
            "Сделай сплит и выиграй обе руки",
            "Удвой ставку после двух карт и выиграй",
            "Сыграй 5 раздач в блэкджек, проиграв не более 2",
            "Поставь на страховку и выиграй",
            "Выиграй с 16 очками, взяв ещё карту",
            "Проиграй с 20 очками",
            "Сделай ставку на 5$ в покере и выиграй",
            "Сыграй в казино-покер и получи флеш",
            "Назови любую карточную игру казино",
            "Сделай 10 ставок в блэкджеке по минималке",
            "Не бери карту на 17+",
            "Выиграй раздачу с мультиплеером",
            "Сделай 3 сплита подряд",
            "Выиграй после удвоения ставки",
            "Сыграй в мини-игру «Идеальная пара»",
            "Поставь на бонус «21+3»",
            "Заверши уровень, сделав 2 блэкджека за 3 раздачи",
            "Сделай ставку на бонус Perfect Pair"
        ],
        [ // Уровень 4: Молния – быстрые действия
            "Сделай 5 спинов за 1 минуту",
            "Поставь на красное и чёрное одновременно",
            "Найди слот с драконом и сделай 3 спина",
            "Купи супер-бонус за максимальную ставку",
            "За 30 секунд сделай 3 ставки в рулетке",
            "Сделай 10 спинов в хаотичном порядке по слотам",
            "Выиграй любой раунд в крэпсе",
            "Сделай спин и поймай любой скаттер",
            "Поставь на все числа в рулетке одним сплитом",
            "Удвой выигрыш в блэкджеке и сдайся",
            "Сыграй в видеослот с функцией «купить бонус»",
            "Сделай 3 депозита по 10$ за 2 минуты",
            "Поставь на 0 и 00 в американской рулетке",
            "Выиграй 2 раза подряд в рулетке на чёт/нечет",
            "Активируй бонусную игру и собери множитель x10",
            "Сделай 20 спинов не глядя на экран",
            "Поставь на число 7 в рулетке",
            "Поймай джекпот в любом слоте",
            "За 10 секунд выбери слот и сделай спин",
            "Сделай ставку на линию в слоте и выиграй"
        ],
        [ // Уровень 5: Золото – смесь сложного
            "Выиграй 500$ одним спином",
            "Сделай 3 джекпота (не подряд)",
            "Назови 5 любых слотов от NetEnt",
            "Сделай 50 спинов без проигрыша более 30% баланса",
            "Удвой выигрыш в рулетке 2 раза подряд",
            "Собери комбинацию из 5 одинаковых символов в слоте",
            "Выиграй в блэкджеке 5 раз подряд",
            "Сделай ставку на все 36 чисел в рулетке",
            "Активируй супер-бонус с ретриггерами",
            "Кто написал роман «Игрок»? (Достоевский)",
            "Назови город с самым известным казино (Монте-Карло)",
            "Сделай 100 спинов суммарно за уровень",
            "Поставь на 1-й дюжине и выиграй 3 из 5",
            "Забери прогрессивный джекпот",
            "Победи дилера в блэкджеке с 6 картами",
            "Сделай сплит на 10-10 и выиграй обе руки",
            "Выиграй в покер с парой тузов",
            "Сделай 3 бонусные игры в разных слотах",
            "Достигни множителя x25 в бонусной игре",
            "Заверши игру любым выигрышем более 1000$"
        ]
    ];

    const LEVEL_META = [
        { name: "Пылающая таверна", icon: "fa-fire", theme: "level1", bg: "theme-level1", expNeeded: 100 },
        { name: "Лес костей", icon: "fa-tree", theme: "level2", bg: "theme-level2", expNeeded: 150 },
        { name: "Ледяная гора", icon: "fa-snowflake", theme: "level3", bg: "theme-level3", expNeeded: 200 },
        { name: "Пещера молний", icon: "fa-bolt", theme: "level4", bg: "theme-level4", expNeeded: 250 },
        { name: "Золотой чертог", icon: "fa-crown", theme: "level5", bg: "theme-level5", expNeeded: 300 }
    ];

    // Генерация заданий с определением типа (викторина, если в строке есть ответ в скобках)
    function generateQuestsForLevel(levelIdx) {
        let taskPool = LEVEL_TASKS[levelIdx];
        let quests = [];
        for (let i = 0; i < QUESTS_PER_LEVEL; i++) {
            let raw = taskPool[i % taskPool.length];
            let isQuiz = false;
            let correctAnswer = null;
            // Если текст содержит скобки с ответом
            let match = raw.match(/\(([^)]+)\)/);
            if (match) {
                isQuiz = true;
                correctAnswer = match[1].toLowerCase();
                raw = raw.replace(/\([^)]+\)/, '').trim();
            }
            quests.push({
                id: i,
                text: raw,
                type: isQuiz ? "quiz" : "action",
                completed: false,
                correctAnswer: correctAnswer,
                dynamicData: null
            });
        }
        return quests;
    }

    let LEVELS = [];
    for (let i=0; i<TOTAL_LEVELS; i++) {
        LEVELS.push({
            meta: LEVEL_META[i],
            quests: generateQuestsForLevel(i),
            completedCount: 0
        });
    }

    // Состояние игры
    let game = {
        currentLevel: 0,
        currentQuestIdx: 0,
        exp: 0,
        soulShards: 0,
        completedQuests: [],
        levelCompletedCount: new Array(TOTAL_LEVELS).fill(0)
    };
    let currentQuestObj = null;

    // Лидерборд
    let leaderboard = { alex: 0, vika: 0, batiya: 0 };
    let activeHero = "alex";

    // DOM элементы
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
    const resetBtn = document.getElementById('reset-progress');
    const soundToggle = document.getElementById('sound-toggle');
    const hintBtn = document.getElementById('hint-btn');
    const closeHintBtn = document.getElementById('close-hint');
    const hintModal = document.getElementById('hint-modal');
    const hintTextSpan = document.getElementById('hint-text');
    const levelCompleteModal = document.getElementById('level-complete-modal');
    const gameCompleteModal = document.getElementById('game-complete-modal');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const restartGameBtn = document.getElementById('restart-game');
    const toastDiv = document.getElementById('toast');
    const heroSelect = document.getElementById('active-hero');
    const scoreEls = {
        alex: document.getElementById('score-alex'),
        vika: document.getElementById('score-vika'),
        batiya: document.getElementById('score-batiya')
    };

    let soundEnabled = true;
    let audioCtx = null;
    function initAudio() { 
        if(!audioCtx && window.AudioContext) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    }
    function playSound(type) {
        if(!soundEnabled) return;
        initAudio();
        if(!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now+0.6);
        if(type==="success") osc.frequency.value = 880;
        else if(type==="error") osc.frequency.value = 220;
        else if(type==="levelup") { osc.frequency.value = 660; osc.frequency.setValueAtTime(880, now+0.1); }
        else osc.frequency.value = 523;
        osc.start();
        osc.stop(now+0.5);
    }

    function showToast(msg) {
        if(!toastDiv) return;
        toastDiv.innerText = msg;
        toastDiv.classList.remove('hidden');
        setTimeout(()=> toastDiv.classList.add('hidden'), 2500);
    }

    function saveGame() {
        let data = {
            currentLevel: game.currentLevel,
            currentQuestIdx: game.currentQuestIdx,
            exp: game.exp,
            soulShards: game.soulShards,
            completedQuests: game.completedQuests,
            levelCompletedCount: game.levelCompletedCount,
            leaderboard, activeHero
        };
        localStorage.setItem('knightSaga', JSON.stringify(data));
        for(let l=0; l<TOTAL_LEVELS; l++) {
            for(let q of LEVELS[l].quests) {
                q.completed = game.completedQuests.some(c => c.level===l && c.questId===q.id);
            }
            LEVELS[l].completedCount = game.levelCompletedCount[l];
        }
    }

    function loadGame() {
        let saved = localStorage.getItem('knightSaga');
        if(saved) {
            try {
                let d = JSON.parse(saved);
                game.currentLevel = d.currentLevel;
                game.currentQuestIdx = d.currentQuestIdx;
                game.exp = d.exp;
                game.soulShards = d.soulShards;
                game.completedQuests = d.completedQuests || [];
                game.levelCompletedCount = d.levelCompletedCount || new Array(TOTAL_LEVELS).fill(0);
                leaderboard = d.leaderboard || {alex:0, vika:0, batiya:0};
                activeHero = d.activeHero || "alex";
            } catch(e) { console.warn(e); }
        }
        for(let l=0; l<TOTAL_LEVELS; l++) {
            for(let q of LEVELS[l].quests) {
                q.completed = game.completedQuests.some(c => c.level===l && c.questId===q.id);
                if(q.completed) game.levelCompletedCount[l]++;
            }
        }
        if(heroSelect) heroSelect.value = activeHero;
        updateLeaderboardUI();
        let curLevelQuests = LEVELS[game.currentLevel].quests;
        let nxt = curLevelQuests.findIndex(q => !q.completed);
        if(nxt===-1) nxt = 0;
        game.currentQuestIdx = nxt;
        saveGame();
    }

    function updateLeaderboardUI() {
        if(scoreEls.alex) scoreEls.alex.innerText = leaderboard.alex;
        if(scoreEls.vika) scoreEls.vika.innerText = leaderboard.vika;
        if(scoreEls.batiya) scoreEls.batiya.innerText = leaderboard.batiya;
    }

    function addPoints(p=1) {
        leaderboard[activeHero] += p;
        updateLeaderboardUI();
        saveGame();
        showToast(`+${p} очков ${heroSelect.options[heroSelect.selectedIndex].text}`);
    }

    function updateUI() {
        let lvl = game.currentLevel;
        let meta = LEVEL_META[lvl];
        let needed = meta.expNeeded;
        expCurrentSpan.innerText = game.exp;
        expNextSpan.innerText = needed;
        let percent = Math.min(100, (game.exp/needed)*100);
        expFill.style.width = `${percent}%`;
        playerLevelSpan.innerText = lvl+1;
        soulShardsSpan.innerText = game.soulShards;
        currentLevelBadge.innerText = `Уровень ${lvl+1}: ${meta.name}`;
        let done = game.levelCompletedCount[lvl];
        questCounterSpan.innerText = `Заданий: ${done} / ${QUESTS_PER_LEVEL}`;
        nextBtn.disabled = !(done>0 && done<QUESTS_PER_LEVEL);
        renderLevelMap();
        applyTheme(lvl);
    }

    function renderLevelMap() {
        if(!levelMapDiv) return;
        levelMapDiv.innerHTML = '';
        for(let i=0; i<TOTAL_LEVELS; i++) {
            let lvl = LEVELS[i];
            let done = game.levelCompletedCount[i];
            let isActive = (i===game.currentLevel);
            let div = document.createElement('div');
            div.className = `level-item ${isActive ? 'active' : ''}`;
            div.addEventListener('click', ()=> switchLevel(i));
            let dotsHtml = '';
            for(let idx=0; idx<QUESTS_PER_LEVEL; idx++) {
                let completedClass = lvl.quests[idx].completed ? 'completed' : '';
                dotsHtml += `<div class="dot ${completedClass}"></div>`;
            }
            div.innerHTML = `
                <div class="level-icon"><i class="fas ${lvl.meta.icon}"></i></div>
                <div class="level-info">
                    <div class="level-title">${lvl.meta.name}</div>
                    <div class="progress-dots">${dotsHtml}</div>
                </div>
                <div class="level-status">${done}/${QUESTS_PER_LEVEL}</div>
            `;
            levelMapDiv.appendChild(div);
        }
    }

    function applyTheme(levelIdx) {
        let themeName = LEVEL_META[levelIdx].theme;
        document.body.className = '';
        document.body.classList.add(LEVEL_META[levelIdx].bg);
        let rightCol = document.getElementById('right-column');
        if(rightCol) rightCol.setAttribute('data-theme', themeName);
    }

    function switchLevel(newLevel) {
        if(newLevel === game.currentLevel) return;
        game.currentLevel = newLevel;
        let quests = LEVELS[newLevel].quests;
        let nextIdx = quests.findIndex(q=> !q.completed);
        if(nextIdx === -1) nextIdx = 0;
        game.currentQuestIdx = nextIdx;
        saveGame();
        updateUI();
        loadCurrentQuest();
        playSound("click");
    }

    function loadCurrentQuest() {
        if(!LEVELS[game.currentLevel]) return;
        let quest = LEVELS[game.currentLevel].quests[game.currentQuestIdx];
        if(!quest) return;
        currentQuestObj = quest;
        if(quest.completed) { moveToNextQuest(); return; }
        renderQuest();
    }

    function renderQuest() {
        if(!currentQuestObj) return;
        questTextDiv.innerText = currentQuestObj.text;
        questTypeDiv.innerText = currentQuestObj.type === "quiz" ? "❓ Викторина (введите ответ)" : "⚔️ Боевое задание";
        dynamicArea.innerHTML = "";
        if(currentQuestObj.type === "quiz") {
            let input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Введите ответ...';
            input.className = 'dynamic-input';
            input.id = 'quizInput';
            dynamicArea.appendChild(input);
        } else {
            let info = document.createElement('p');
            info.innerHTML = '<i class="fas fa-dice-d6"></i> Выполните это действие в казино и нажмите «Выполнено»';
            dynamicArea.appendChild(info);
        }
    }

    function completeQuest() {
        if(!currentQuestObj || currentQuestObj.completed) { showToast("Уже выполнено!"); return; }
        if(currentQuestObj.type === "quiz") {
            let inp = document.getElementById('quizInput');
            if(!inp) { showToast("Ошибка ввода"); return; }
            let answer = inp.value.trim().toLowerCase();
            let correct = currentQuestObj.correctAnswer;
            if(!correct || answer !== correct) {
                playSound("error");
                showToast(`❌ Неправильно! Правильный ответ: ${correct}`);
                return;
            }
        }
        // Награда
        let lvlIdx = game.currentLevel;
        let expGain = 20 + lvlIdx*5;
        let shardGain = 5 + lvlIdx*2;
        game.exp += expGain;
        game.soulShards += shardGain;
        currentQuestObj.completed = true;
        game.completedQuests.push({ level: lvlIdx, questId: currentQuestObj.id });
        game.levelCompletedCount[lvlIdx]++;
        addPoints(1);
        playSound("success");
        showToast(`+${expGain} опыта, +${shardGain} осколков`);
        
        // Проверка повышения уровня рыцаря
        let needed = LEVEL_META[lvlIdx].expNeeded;
        while(game.exp >= needed && lvlIdx < TOTAL_LEVELS-1) {
            game.exp -= needed;
            lvlIdx++;
            needed = LEVEL_META[lvlIdx].expNeeded;
            playSound("levelup");
            showToast(`✨ Рыцарь достиг ${lvlIdx+1} уровня! ✨`);
        }
        game.currentLevel = lvlIdx;
        saveGame();
        updateUI();
        moveToNextQuest();
    }

    function moveToNextQuest() {
        let level = LEVELS[game.currentLevel];
        let current = game.currentQuestIdx;
        let next = level.quests.findIndex((q,i)=> !q.completed && i>current);
        if(next !== -1) {
            game.currentQuestIdx = next;
            saveGame();
            loadCurrentQuest();
            updateUI();
        } else {
            let any = level.quests.findIndex(q=> !q.completed);
            if(any !== -1) {
                game.currentQuestIdx = any;
                saveGame();
                loadCurrentQuest();
                updateUI();
            } else if(game.levelCompletedCount[game.currentLevel] === QUESTS_PER_LEVEL) {
                if(game.currentLevel + 1 < TOTAL_LEVELS) {
                    levelCompleteModal.classList.remove('hidden');
                    document.getElementById('level-complete-text').innerHTML = `Вы прошли ${LEVEL_META[game.currentLevel].name}! Открыт следующий мир.`;
                } else {
                    gameCompleteModal.classList.remove('hidden');
                }
            }
        }
    }

    function showHint() {
        if(!currentQuestObj || currentQuestObj.completed) hintTextSpan.innerText = "Активного задания нет";
        else if(currentQuestObj.type === "quiz") hintTextSpan.innerText = `Подсказка: правильный ответ начинается с "${currentQuestObj.correctAnswer[0]}"`;
        else hintTextSpan.innerText = "Сделайте описанное действие в казино и отметьте выполненным.";
        hintModal.classList.remove('hidden');
    }

    function resetAll() {
        if(confirm("Сбросить весь прогресс и лидерборд?")) {
            localStorage.removeItem('knightSaga');
            location.reload();
        }
    }

    // Инициализация
    loadGame();
    updateUI();
    loadCurrentQuest();
    initAudio();

    // Обработчики
    if(completeBtn) completeBtn.addEventListener('click', completeQuest);
    if(nextBtn) nextBtn.addEventListener('click', moveToNextQuest);
    if(resetBtn) resetBtn.addEventListener('click', resetAll);
    if(soundToggle) soundToggle.addEventListener('click', ()=>{
        soundEnabled = !soundEnabled;
        soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        if(soundEnabled && audioCtx) audioCtx.resume();
    });
    if(hintBtn) hintBtn.addEventListener('click', showHint);
    if(closeHintBtn) closeHintBtn.addEventListener('click', ()=> hintModal.classList.add('hidden'));
    if(heroSelect) heroSelect.addEventListener('change', (e)=> { activeHero = e.target.value; saveGame(); });
    if(nextLevelBtn) nextLevelBtn.addEventListener('click', ()=>{
        levelCompleteModal.classList.add('hidden');
        if(game.currentLevel + 1 < TOTAL_LEVELS) {
            game.currentLevel++;
            game.currentQuestIdx = LEVELS[game.currentLevel].quests.findIndex(q=>!q.completed);
            if(game.currentQuestIdx === -1) game.currentQuestIdx = 0;
            saveGame();
            updateUI();
            loadCurrentQuest();
        }
    });
    if(restartGameBtn) restartGameBtn.addEventListener('click', resetAll);
    window.showHint = showHint;
})();