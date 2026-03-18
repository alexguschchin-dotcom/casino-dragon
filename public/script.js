const socket = io();

const SAVE_KEY = 'lab_save';

let gameState = {
    level: 1,
    currentBalance: 200000,
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
    currentMultiplier: 1,
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

const RANKS = ['Юнга', 'Матрос', 'Боцман', 'Капитан', 'Адмирал'];
const REPUTATION_PER_RANK = 10;

let isAnimating = false;
let pendingState = null;
let toastTimeout = null;

function getReagentClass(diff) {
    const classes = ['F', 'D', 'C', 'B', 'A', 'S'];
    return classes[diff-1] || '?';
}

function getClassColor(diff) {
    const colors = ['f', 'd', 'c', 'b', 'a', 's'];
    return colors[diff-1] || 'f';
}

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

// Массив рейдовых заданий
const raidTemplates = [
    '⚔️ Рейд: чат должен написать "Йо-хо-хо" 30 раз за 2 минуты!',
    '⚔️ Рейд: чат должен написать "Пираты рулят" 20 раз за 1 минуту!',
    '⚔️ Рейд: чат должен отправить 50 смайликов за 3 минуты!',
    '⚔️ Рейд: чат должен написать 10 комплиментов капитану!',
    '⚔️ Рейд: чат должен придумать название для корабля (голосование в чате)!'
];

function getRandomRaidDescription() {
    return raidTemplates[Math.floor(Math.random() * raidTemplates.length)];
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

    // Если нужен реролл (от трофея)
    if (gameState.needReroll) {
        gameState.needReroll = false;
        // Просто генерируем заново
    }

    let message = '';

    // Проверка на рейд
    if (gameState.nextIsRaid) {
        message = `🔥 Остров ${gameState.level}: Рейд! Задание для всего экипажа!`;
        showToast(message);
        gameState.currentCards = [{
            id: 'raid_' + Date.now() + '_' + Math.random(),
            description: getRandomRaidDescription(),
            isRaid: true,
            selected: false,
            completed: false
        }];
        return;
    }

    // Проверка на проклятый остров
    if (gameState.isCursedIsland) {
        message = `💀 Остров ${gameState.level}: Проклятый! Все карточки — испытания!`;
        showToast(message);
        const penalties = generatePenaltyCards(3);
        gameState.currentCards = penalties.map(p => ({ ...p, selected: false, completed: false }));
        return;
    }

    // Обычный уровень
    let filteredTasks = gameState.availableTasks;
    if (gameState.level % 10 === 0) {
        filteredTasks = gameState.availableTasks.filter(t => t.difficulty >= 4);
        message = `🔥 Остров ${gameState.level}: Штормовые воды (классы B, A, S)`;
    } else if (gameState.level % 5 === 0) {
        filteredTasks = gameState.availableTasks.filter(t => t.difficulty === 3 || t.difficulty === 4);
        message = `⚓ Остров ${gameState.level}: Опасные рифы (классы C и B)`;
    }

    if (message) showToast(message);

    if (filteredTasks.length < 2) {
        filteredTasks = gameState.availableTasks;
    }

    const shuffledTasks = [...filteredTasks].sort(() => 0.5 - Math.random());
    const tasks = shuffledTasks.slice(0, 2).map(task => {
        let multiplier = 1;
        // Базовый шанс множителя: 20% (из них 10% x2, 10% x3)
        const rand = Math.random();
        if (rand < 0.2) {
            multiplier = Math.random() < 0.5 ? 2 : 3;
        }
        // Влияние пути
        if (gameState.pathChoice === 'risk') {
            // Если множитель уже >1, увеличиваем его на 1 (но не более 4)
            if (multiplier > 1) {
                multiplier = Math.min(multiplier + 1, 4);
            } else {
                // Дополнительный шанс получить множитель
                if (Math.random() < 0.3) {
                    multiplier = Math.random() < 0.5 ? 2 : 3;
                }
            }
        } else if (gameState.pathChoice === 'luck') {
            // Если множитель >1, с вероятностью 50% сбрасываем на 1
            if (multiplier > 1 && Math.random() < 0.5) {
                multiplier = 1;
            }
        }
        // Бонус от ранга
        multiplier += Math.floor(gameState.rank / 2);
        return { ...task, selected: false, completed: false, multiplier };
    });

    // Показываем тост для заданий с множителем >1
    tasks.forEach(t => {
        if (t.multiplier > 1) {
            showToast(`⚡ Задание с множителем x${t.multiplier}!`);
        }
    });

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
    socket.emit('reset', 200000);
});

socket.on('state', (serverState) => {
    if (gameState.gameCompleted) return;

    if (isAnimating) {
        pendingState = serverState;
    } else {
        Object.assign(gameState, serverState);

        // Проверка, нужно ли показать модалку выбора пути
        if ((gameState.level === 10 || gameState.level === 20 || gameState.level === 30) && !gameState.pathChoice && gameState.pathLevel !== gameState.level) {
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

        // Если штрафной режим и нет карточек, генерируем штрафную
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
    rankLevelSpan.textContent = gameState.reputation.toFixed(1);
    rankNextSpan.textContent = nextRep;
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
    // Добавляем обработчики на кнопки использования
    document.querySelectorAll('.use-trophy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            socket.emit('useTrophy', type);
            // Показываем тост с эффектом
            const trophy = gameState.inventory.find(t => t.type === type);
            if (trophy) {
                const bonus = trophyTypes.find(t => t.name === type).bonus;
                let message = '';
                switch (bonus) {
                    case 'multiplier+1': message = '⚡ Множитель увеличен!'; break;
                    case 'skipPenalty': message = '⚓ Следующий штраф будет пропущен!'; break;
                    case 'reroll': message = '🔄 Карточки перемешаны!'; break;
                    case 'peek': message = '🔭 Вы заглянули в будущее...'; break;
                    case 'extraChat': message = '🦜 Попугай призывает чат!'; break;
                }
                showToast(message);
            }
        });
    });
}

function updatePoolStats() {
    const counts = { F:0, D:0, C:0, B:0, A:0, S:0 };
    gameState.availableTasks.forEach(task => {
        const cls = getReagentClass(task.difficulty);
        counts[cls]++;
    });
    let html = Object.entries(counts).map(([cls, num]) => `
        <div class="stat-item">
            <span class="reagent-class ${cls.toLowerCase()}">${cls}</span>
            <span>${num}</span>
        </div>
    `).join('');

    html += `
        <div class="stat-item">
            <span class="reagent-class penalty">⚠️</span>
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

    let reagentClass, classColor;
    if (task.isPenalty) {
        reagentClass = '⚠️';
        classColor = 'penalty';
    } else if (task.isRaid) {
        reagentClass = '⚔️';
        classColor = 'raid';
    } else {
        reagentClass = getReagentClass(task.difficulty);
        classColor = getClassColor(task.difficulty);
    }

    const reagentHTML = `<div class="reagent-class ${classColor}">${reagentClass}</div>`;
    let taskText = task.description;
    let multiplierBadge = '';
    if (task.multiplier && task.multiplier > 1) {
        multiplierBadge = `<span class="multiplier-badge">x${task.multiplier}</span>`;
    }
    const taskTextDiv = `<div class="task-text">${taskText} ${multiplierBadge}</div>`;

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
    // Уровень увеличивается на сервере, но мы можем сразу обновить UI после ответа от сервера
    // Ждём socket.on('state') который обновит gameState
    // updateUI(); // не вызываем, чтобы дождаться синхронизации
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
    finalMessage.innerHTML = '🏴‍☠️ Поздравляем! Вы нашли легендарный клад и стали королём пиратов!<br>' +
        'Но в бутылке плещется что-то странное…';
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
        currentBalance: 200000,
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
        currentMultiplier: 1,
        nextIsRaid: false,
        isCursedIsland: false,
        skipNextPenalty: false,
        needReroll: false
    };
    level30CardsGenerated = false;
    socket.emit('reset', 200000);
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

// Странная бутылка — показываем увеличенную карту
if (flaskGagBtn) {
    flaskGagBtn.addEventListener('click', () => {
        // Заполняем полноразмерную карту
        fullMapGrid.innerHTML = '';
        gameState.mapCells.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `map-cell ${cell}`;
            cellDiv.textContent = index + 1;
            fullMapGrid.appendChild(cellDiv);
        });
        mapModal.classList.remove('hidden');
    });
}

// Закрытие модалки карты
if (closeMapBtn) {
    closeMapBtn.addEventListener('click', () => {
        mapModal.classList.add('hidden');
    });
}

if (completionResetBtn) {
    completionResetBtn.addEventListener('click', () => {
        completionModal.classList.add('hidden');
        resetGame();
    });
}

// Пути
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

// Анимация морских пузырьков
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