const socket = io();

const SAVE_KEY = 'lab_save';

// Функция для получения строки из звёзд по сложности
function getStars(diff) {
    if (diff === 0) return '💀'; // штраф
    return '⭐'.repeat(diff);
}

function getClassColor(diff) {
    const colors = ['f', 'd', 'c', 'b', 'a', 's'];
    if (diff === 0) return 'penalty';
    return colors[diff-1] || 'f';
}

let gameState = {
    level: 1,
    currentBalance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    penaltyPool: [],
    currentCards: [],
    selectedTaskId: null,
    gameCompleted: false,
    successCount: 0,
    failCount: 0,
    penaltyCount: 0,
    penaltyMode: false,
    mapCells: Array(30).fill('locked'),
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
    needReroll: false
};

let level30CardsGenerated = false;

// DOM элементы
const levelSpan = document.getElementById('current-level');
const balanceSpan = document.getElementById('current-balance');
const cardsContainer = document.getElementById('cards-container');
const historyDiv = document.getElementById('history-list');
const poolStatsDiv = document.getElementById('pool-stats');
const resetBtn = document.getElementById('reset-btn');
const applyBalanceBtn = document.getElementById('apply-start-balance');
const taskModal = document.getElementById('task-modal');
const taskDesc = document.getElementById('task-description');
const newBalanceInput = document.getElementById('new-balance');
const completeBtn = document.getElementById('complete-task');
const failBtn = document.getElementById('fail-task');
const completionModal = document.getElementById('completion-modal');
const finalMessage = document.getElementById('final-message');
const finalBalanceSpan = document.getElementById('final-balance');
const finalSuccess = document.getElementById('final-success');
const finalFail = document.getElementById('final-fail');
const finalPenalty = document.getElementById('final-penalty');
const flaskGagBtn = document.getElementById('flask-gag-btn');
const completionResetBtn = document.getElementById('completion-reset-btn');
const rulesModal = document.getElementById('rules-modal');
const dontShowCheckbox = document.getElementById('dont-show-rules');
const startQuestBtn = document.getElementById('start-quest-btn');
const toast = document.getElementById('toast');
const mapGrid = document.getElementById('map-grid');
const rankNameSpan = document.getElementById('rank-name');
const rankLevelSpan = document.getElementById('rank-level');
const rankNextSpan = document.getElementById('rank-next');
const inventoryList = document.getElementById('inventory-list');
const pathModal = document.getElementById('path-modal');
const pathRiskBtn = document.getElementById('path-risk');
const pathLuckBtn = document.getElementById('path-luck');
const mapModal = document.getElementById('map-modal');
const fullMapGrid = document.getElementById('full-map-grid');
const closeMapBtn = document.getElementById('close-map-modal');
const pathIndicator = document.getElementById('path-indicator');

const RANKS = ['Юнга', 'Матрос', 'Боцман', 'Капитан', 'Адмирал'];
const REPUTATION_PER_RANK = 10;

let isAnimating = false;
let pendingState = null;
let toastTimeout = null;

function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function saveGameState() {
    try {
        const saveData = { ...gameState, timestamp: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {}
}

function loadGameState() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp > 24*60*60*1000) {
            localStorage.removeItem(SAVE_KEY);
            return null;
        }
        return data;
    } catch (e) { return null; }
}

function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
}

// Новые рейды по порядку уровней
const raidTemplates = {
    5: '⚔️ Рейд: чат должен написать "Йо-хо-хо + id" Первые 5 написавших получают по 4000!',
    10: '⚔️ Рейд: чат должен написать "Леха, Батя и Вика - лучшая пиратская команда + id" первые 5 написавших получают по 5000 !',
    15: '⚔️ Рейд: чат должен написать "лучший напиток пирата + id", первые 5 правильных ответов получают по 5000!',
    20: '⚔️ Рейд: Бунт на корабле! Обычные пираты требуют золота! Напишите в чат "Часть добычи моя + id" первые 5 получают 5000!',
    25: '⚔️ Рейд: чат должен написать "Хочу получить сокровище", первые 3 написавших получают 10000!',
    30: '⚔️ Рейд: Перед капитаном стоит сложная задача! Рискнуть и сделать all in в любом пиратском слоте и если повезет получить настоящий клад или купить бонус в любом слоте за треть баланса!'
};

function getRaidDescription(level) {
    return raidTemplates[level] || '⚔️ Рейд: задание для всего экипажа!';
}

function generateCardsForLevel() {
    if (gameState.gameCompleted) return;
    if (gameState.availableTasks.length === 0 && gameState.penaltyPool.length === 0) {
        gameState.currentCards = [];
        return;
    }

    if (gameState.level === 30) {
        level30CardsGenerated = true;
    }

    if (gameState.needReroll) {
        gameState.needReroll = false;
    }

    let message = '';

    if (gameState.nextIsRaid) {
        message = `🔥 Остров ${gameState.level}: Рейд! Задание для всего экипажа!`;
        showToast(message);
        gameState.currentCards = [{
            id: 'raid_' + Date.now() + '_' + Math.random(),
            description: getRaidDescription(gameState.level), // используем фиксированное описание по уровню
            isRaid: true,
            selected: false,
            completed: false
        }];
        return;
    }

    if (gameState.isCursedIsland) {
        message = `💀 Остров ${gameState.level}: Проклятый! Все карточки — испытания!`;
        showToast(message);
        const penalties = generatePenaltyCards(3);
        gameState.currentCards = penalties.map(p => ({ ...p, selected: false, completed: false }));
        return;
    }

    // Фильтрация по пути риска
    let filteredTasks = gameState.availableTasks;
    if (gameState.riskMode && gameState.riskMode.active && gameState.level <= gameState.riskMode.untilLevel) {
        if (gameState.riskMode.untilLevel <= 19) {
            filteredTasks = filteredTasks.filter(t => t.difficulty > 1);
        } else if (gameState.riskMode.untilLevel <= 29) {
            filteredTasks = filteredTasks.filter(t => t.difficulty > 2);
        }
        if (filteredTasks.length < 2) {
            filteredTasks = gameState.availableTasks;
        }
    }

    if (gameState.level % 10 === 0) {
        filteredTasks = filteredTasks.filter(t => t.difficulty >= 4);
        message = `🔥 Остров ${gameState.level}: Штормовые воды (4⭐, 5⭐, 6⭐)`;
    } else if (gameState.level % 5 === 0) {
        filteredTasks = filteredTasks.filter(t => t.difficulty === 3 || t.difficulty === 4);
        message = `⚓ Остров ${gameState.level}: Опасные рифы (3⭐ и 4⭐)`;
    }

    if (message) showToast(message);

    if (filteredTasks.length < 2) {
        filteredTasks = gameState.availableTasks;
    }

    const shuffledTasks = [...filteredTasks].sort(() => 0.5 - Math.random());
    const tasks = shuffledTasks.slice(0, 2).map(task => {
        let multiplier = 1;
        let baseChance = 0.2;
        let extraChance = 0.3;

        if (gameState.pathChoice === 'risk') {
            baseChance = 0.1;
            extraChance = 0.15;
        }

        if (Math.random() < baseChance) {
            multiplier = 2;
        }

        if (gameState.pathChoice === 'risk') {
            if (multiplier === 1 && Math.random() < extraChance) {
                multiplier = 2;
            }
        } else if (gameState.pathChoice === 'luck') {
            if (multiplier > 1 && Math.random() < 0.5) {
                multiplier = 1;
            }
        }

        const rankBonus = Math.floor(gameState.rank / 2);
        multiplier = Math.min(2, multiplier + rankBonus);

        if (gameState.currentDivider > 1) {
            multiplier = Math.max(1, Math.floor(multiplier / gameState.currentDivider));
        }

        if (multiplier > 2) multiplier = 2;

        return { ...task, selected: false, completed: false, multiplier };
    });

    if (gameState.currentDivider > 1) {
        showToast(`⚖️ Делитель x1/${gameState.currentDivider} активен!`);
    }

    let penaltyCard = null;
    if (gameState.penaltyPool.length > 0) {
        const randomPenalty = gameState.penaltyPool[Math.floor(Math.random() * gameState.penaltyPool.length)];
        penaltyCard = { ...randomPenalty, selected: false, completed: false, isPenalty: true };
    }

    let cards = [...tasks];
    if (penaltyCard) cards.push(penaltyCard);
    gameState.currentCards = cards.sort(() => 0.5 - Math.random());
}

function generatePenaltyCards(count) {
    const cards = [];
    const shuffled = [...gameState.penaltyPool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        cards.push({ ...shuffled[i], selected: false, completed: false, isPenalty: true });
    }
    return cards;
}

socket.on('connect', () => {
    const saved = loadGameState();
    if (saved && !saved.gameCompleted) {
        if (confirm('Найден старый судовой журнал. Восстановить плавание?')) {
            gameState = saved;
            updateUI();
            updatePoolStats();
            renderMap();
            renderInventory();
            return;
        } else {
            clearSavedGame();
        }
    }
    socket.emit('reset', 1500000);
});

socket.on('state', (serverState) => {
    if (gameState.gameCompleted) return;

    if (isAnimating) {
        pendingState = serverState;
    } else {
        Object.assign(gameState, serverState);

        if ((gameState.level === 10 || gameState.level === 20) &&
            gameState.pathLevel !== gameState.level) {
            pathModal.classList.remove('hidden');
        }

        if (!gameState.penaltyMode && !gameState.selectedTaskId && gameState.currentCards.length === 0) {
            if (gameState.level >= 30) {
                if (level30CardsGenerated) {
                    endGame();
                    return;
                } else {
                    generateCardsForLevel();
                }
            } else {
                generateCardsForLevel();
            }
        }

        if (gameState.penaltyMode && gameState.currentCards.length === 0) {
            generatePenaltyCard();
        }

        updateUI();
        updatePoolStats();
        renderMap();
        renderInventory();
        saveGameState();
    }
});

function generatePenaltyCard() {
    if (gameState.penaltyPool.length === 0) {
        gameState.penaltyMode = false;
        generateCardsForLevel();
        return;
    }
    const randomPenalty = gameState.penaltyPool[Math.floor(Math.random() * gameState.penaltyPool.length)];
    const penaltyCard = { ...randomPenalty, selected: false, completed: false, isPenalty: true };
    gameState.currentCards = [penaltyCard];
}

function updateUI() {
    levelSpan.textContent = gameState.level;
    balanceSpan.textContent = gameState.currentBalance;
    renderCards();
    renderHistory();
    resetBtn.classList.toggle('hidden', gameState.level < 30);
    rankNameSpan.textContent = RANKS[gameState.rank];
    const nextRep = (gameState.rank + 1) * REPUTATION_PER_RANK;
    rankLevelSpan.textContent = gameState.reputation;
    rankNextSpan.textContent = nextRep;

    if (pathIndicator) {
        if (gameState.riskMode && gameState.riskMode.active && gameState.level <= gameState.riskMode.untilLevel) {
            pathIndicator.textContent = `⚡ Путь риска (до ${gameState.riskMode.untilLevel} уровня)`;
        } else {
            pathIndicator.textContent = '';
        }
    }
}

function renderMap() {
    if (!mapGrid) return;
    mapGrid.innerHTML = '';
    for (let i = 0; i < gameState.mapCells.length; i++) {
        const cell = document.createElement('div');
        cell.className = `map-cell ${gameState.mapCells[i]}`;
        cell.textContent = i + 1;
        mapGrid.appendChild(cell);
    }
}

function renderInventory() {
    if (!inventoryList) return;
    inventoryList.innerHTML = '';
    gameState.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `<span>${item.type} ${item.count}</span> <button class="use-trophy" data-type="${item.type}">Использовать</button>`;
        inventoryList.appendChild(div);
    });
    document.querySelectorAll('.use-trophy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            socket.emit('useTrophy', type);
            showToast(`Трофей "${type}" использован!`);
        });
    });
}

function updatePoolStats() {
    const counts = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    gameState.availableTasks.forEach(task => {
        const diff = task.difficulty;
        counts[diff]++;
    });
    let html = '';
    for (let i = 1; i <= 6; i++) {
        html += `
            <div class="stat-item">
                <span class="reagent-class ${getClassColor(i)}">${getStars(i)}</span>
                <span>${counts[i]}</span>
            </div>
        `;
    }
    html += `
        <div class="stat-item">
            <span class="reagent-class penalty">💀</span>
            <span>${gameState.penaltyPool.length}</span>
        </div>
    `;
    poolStatsDiv.innerHTML = html;
}

function renderCards() {
    cardsContainer.innerHTML = '';
    if (gameState.selectedTaskId) {
        const task = gameState.currentCards.find(t => t.id === gameState.selectedTaskId);
        if (task) cardsContainer.appendChild(createCardElement(task, true));
    } else {
        gameState.currentCards.forEach(task => {
            cardsContainer.appendChild(createCardElement(task, false));
        });
    }
}

function createCardElement(task, isSelected) {
    const card = document.createElement('div');
    card.className = `card ${task.selected ? 'selected' : ''} ${task.completed ? 'completed' : ''}`;
    if (task.multiplier > 1) {
        card.classList.add(`multiplier-${task.multiplier}`);
    }
    card.dataset.id = task.id;

    let stars, classColor;
    if (task.isPenalty) {
        stars = '💀';
        classColor = 'penalty';
    } else if (task.isRaid) {
        stars = '⚔️ Рейд';
        classColor = 'raid';
    } else {
        stars = getStars(task.difficulty);
        classColor = getClassColor(task.difficulty);
    }

    const reagentHTML = `<div class="reagent-class ${classColor}">${stars}</div>`;
    let taskText = task.description;
    let multiplierBadge = '';
    if (task.multiplier && task.multiplier > 1) {
        multiplierBadge = `<span class="multiplier-badge">x${task.multiplier}</span>`;
    }
    let dividerBadge = '';
    if (gameState.currentDivider > 1) {
        dividerBadge = `<span class="divider-badge">/ ${gameState.currentDivider}</span>`;
    }
    const taskTextDiv = `<div class="task-text">${taskText} ${multiplierBadge} ${dividerBadge}</div>`;

    let buttons = '';
    if (!task.selected && !task.completed && !gameState.selectedTaskId) {
        buttons = `<button class="select-btn">🏴‍☠️ Выбрать</button>`;
    } else if (task.selected && !task.completed) {
        if (task.isPenalty) {
            buttons = `<button class="penalty-apply-btn">⚓ Выполнить</button>`;
        } else if (task.isRaid) {
            buttons = `
                <button class="raid-success-btn">✅ Рейд успешен</button>
                <button class="raid-fail-btn">❌ Рейд провален</button>
            `;
        } else {
            buttons = `
                <button class="complete-btn">✅ Успех</button>
                <button class="penalty-btn">❌ Провал</button>
            `;
        }
    } else if (task.completed) {
        buttons = `<button disabled>✔ Сделано</button>`;
    }

    card.innerHTML = reagentHTML + taskTextDiv + `<div class="card-actions">${buttons}</div>`;

    if (!task.selected && !task.completed && !gameState.selectedTaskId) {
        card.querySelector('.select-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            selectTask(task.id);
        });
    } else if (task.selected && !task.completed) {
        if (task.isPenalty) {
            card.querySelector('.penalty-apply-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });
        } else if (task.isRaid) {
            card.querySelector('.raid-success-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                socket.emit('raidComplete', true);
                gameState.currentCards = [];
                gameState.selectedTaskId = null;
                updateUI();
            });
            card.querySelector('.raid-fail-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                socket.emit('raidComplete', false);
                gameState.currentCards = [];
                gameState.selectedTaskId = null;
                updateUI();
            });
        } else {
            card.querySelector('.complete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });
            card.querySelector('.penalty-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(task.id);
            });
        }
    }
    return card;
}

function selectTask(taskId) {
    const task = gameState.currentCards.find(t => t.id === taskId);
    if (!task) return;

    gameState.currentCards.forEach(t => {
        if (t.id !== taskId) t.completed = true;
    });
    renderCards();

    document.querySelectorAll('.card').forEach(c => {
        if (c.dataset.id !== taskId) c.classList.add('burn');
    });

    isAnimating = true;
    setTimeout(() => {
        gameState.currentCards = [task];
        task.selected = true;
        gameState.selectedTaskId = taskId;
        renderCards();
        isAnimating = false;
        if (pendingState) {
            Object.assign(gameState, pendingState);
            updateUI();
            updatePoolStats();
            pendingState = null;
        }
    }, 500);
}

function openTaskModal(taskId) {
    const task = gameState.currentCards.find(t => t.id === taskId);
    if (!task) return;
    gameState.currentTaskId = taskId;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.currentBalance;

    if (task.isPenalty) {
        completeBtn.classList.add('hidden');
        failBtn.textContent = '⚓ Выполнить';
    } else {
        completeBtn.classList.remove('hidden');
        failBtn.textContent = '❌ Провал';
    }

    taskModal.classList.remove('hidden');
}

function completeTask(success) {
    const newBalance = parseFloat(newBalanceInput.value);
    if (isNaN(newBalance)) return;

    const change = newBalance - gameState.currentBalance;
    const taskId = gameState.currentTaskId;
    const task = gameState.currentCards.find(t => t.id === taskId);
    const multiplier = task.multiplier || 1;

    if (success) {
        socket.emit('completeTask', taskId, change, multiplier * gameState.currentMultiplier);
        addHistoryEntry(`✅ Вылазка удалась: ${change>0?'+'+change:change} 💰 (x${multiplier * gameState.currentMultiplier})`);
    } else {
        if (task && task.isPenalty) {
            socket.emit('applyPenaltyTask', taskId, newBalance);
            addHistoryEntry(`⚠️ Наказание отбыто: ${change>0?'+'+change:change} 💰`);
        } else {
            socket.emit('penaltyWithBalance', taskId, newBalance);
            addHistoryEntry(`❌ Вылазка провалена: ${change>0?'+'+change:change} 💰`);
        }
    }

    gameState.currentCards = gameState.currentCards.filter(t => t.id !== taskId);
    gameState.selectedTaskId = null;
    gameState.currentTaskId = null;

    taskModal.classList.add('hidden');
}

function addHistoryEntry(text) {
    const entry = document.createElement('div');
    entry.className = 'history-item';
    entry.textContent = text;
    historyDiv.appendChild(entry);
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

function renderHistory() {
    historyDiv.innerHTML = '';
    gameState.balanceHistory.slice().reverse().forEach(entry => {
        const date = new Date(entry.timestamp);
        const time = date.toLocaleTimeString();
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<strong>${time}</strong> ${entry.desc} (${entry.change>0?'+'+entry.change:entry.change})`;
        historyDiv.appendChild(div);
    });
}

function endGame() {
    if (gameState.gameCompleted) return;
    gameState.gameCompleted = true;
    const rankName = RANKS[gameState.rank];
    finalMessage.innerHTML = `🏴‍☠️ Поздравляем! Вы нашли легендарный клад и стали королём пиратов!<br>` +
        `Ваш ранг: ${rankName}<br>` +
        `Вы можете посмотреть карту сокровищ`;
    finalBalanceSpan.textContent = gameState.currentBalance;
    finalSuccess.textContent = gameState.successCount;
    finalFail.textContent = gameState.failCount;
    finalPenalty.textContent = gameState.penaltyCount;
    completionModal.classList.remove('hidden');
    clearSavedGame();
}

function resetGame() {
    gameState = {
        level: 1,
        currentBalance: 1500000,
        balanceHistory: [],
        availableTasks: [],
        penaltyPool: [],
        currentCards: [],
        selectedTaskId: null,
        gameCompleted: false,
        successCount: 0,
        failCount: 0,
        penaltyCount: 0,
        penaltyMode: false,
        mapCells: Array(30).fill('locked'),
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
        needReroll: false
    };
    level30CardsGenerated = false;
    socket.emit('reset', 1500000);
    clearSavedGame();
    updateUI();
    updatePoolStats();
    renderMap();
    renderInventory();
}

// ------------------- Обработчики -------------------
applyBalanceBtn.addEventListener('click', () => {
    const newBal = prompt('Введите новый запас дублонов:', gameState.currentBalance);
    if (newBal && !isNaN(newBal)) {
        const newBalance = parseFloat(newBal);
        socket.emit('setBalance', newBalance);
        gameState.currentBalance = newBalance;
        balanceSpan.textContent = newBalance;
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm('Начать новое плавание?')) resetGame();
});

completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));

flaskGagBtn.addEventListener('click', () => {
    fullMapGrid.innerHTML = '';
    gameState.mapCells.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `map-cell ${cell}`;
        cellDiv.textContent = index + 1;
        fullMapGrid.appendChild(cellDiv);
    });
    mapModal.classList.remove('hidden');
});

closeMapBtn.addEventListener('click', () => {
    mapModal.classList.add('hidden');
});

completionResetBtn.addEventListener('click', () => {
    completionModal.classList.add('hidden');
    resetGame();
});

pathRiskBtn.addEventListener('click', () => {
    socket.emit('choosePath', 'risk');
    pathModal.classList.add('hidden');
});
pathLuckBtn.addEventListener('click', () => {
    socket.emit('choosePath', 'luck');
    pathModal.classList.add('hidden');
});

if (!localStorage.getItem('quest_rules_hidden')) {
    setTimeout(() => rulesModal.classList.remove('hidden'), 500);
}
startQuestBtn.addEventListener('click', () => {
    if (dontShowCheckbox.checked) localStorage.setItem('quest_rules_hidden', 'true');
    rulesModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
});

// Анимация пузырьков
(function initBubbles() {
    const canvas = document.getElementById('bubbles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    const bubbles = [];
    const BUBBLE_COUNT = 50;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < BUBBLE_COUNT; i++) {
        bubbles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 10 + 5,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3,
            color: `rgba(100, 200, 255, ${Math.random()*0.3+0.2})`
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        bubbles.forEach(b => {
            b.y -= b.speed;
            if (b.y + b.radius < 0) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
            }
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        requestAnimationFrame(animate);
    }
    animate();
})();