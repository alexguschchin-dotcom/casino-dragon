const socket = io();

const SAVE_KEY = 'lab_save';

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
    penaltyMode: false
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

function generateCardsForLevel() {
    if (gameState.gameCompleted) return;
    if (gameState.availableTasks.length === 0 && gameState.penaltyPool.length === 0) {
        gameState.currentCards = [];
        return;
    }

    if (gameState.level === 30) {
        level30CardsGenerated = true;
    }

    let message = '';
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
    const tasks = shuffledTasks.slice(0, 2).map(task => ({ ...task, selected: false, completed: false }));

    let penaltyCard = null;
    if (gameState.penaltyPool.length > 0) {
        const randomPenalty = gameState.penaltyPool[Math.floor(Math.random() * gameState.penaltyPool.length)];
        penaltyCard = { ...randomPenalty, selected: false, completed: false };
    }

    let cards = [...tasks];
    if (penaltyCard) cards.push(penaltyCard);
    gameState.currentCards = cards.sort(() => 0.5 - Math.random());
}

function generatePenaltyCard() {
    if (gameState.penaltyPool.length === 0) {
        gameState.penaltyMode = false;
        generateCardsForLevel();
        return;
    }
    const randomPenalty = gameState.penaltyPool[Math.floor(Math.random() * gameState.penaltyPool.length)];
    const penaltyCard = { ...randomPenalty, selected: false, completed: false };
    gameState.currentCards = [penaltyCard];
}

socket.on('connect', () => {
    const saved = loadGameState();
    if (saved && !saved.gameCompleted) {
        if (confirm('Найден старый судовой журнал. Восстановить плавание?')) {
            gameState = saved;
            updateUI();
            updatePoolStats();
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
        gameState.level = serverState.level;
        gameState.currentBalance = serverState.currentBalance;
        gameState.balanceHistory = serverState.balanceHistory;
        gameState.availableTasks = serverState.availableTasks;
        gameState.penaltyPool = serverState.penaltyPool;
        gameState.successCount = serverState.successCount;
        gameState.failCount = serverState.failCount;
        gameState.penaltyCount = serverState.penaltyCount;

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
        saveGameState();
    }
});

function updateUI() {
    levelSpan.textContent = gameState.level;
    balanceSpan.textContent = gameState.currentBalance;
    renderCards();
    renderHistory();
    resetBtn.classList.toggle('hidden', gameState.level < 30);
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
    card.dataset.id = task.id;

    let reagentClass, classColor;
    if (task.isPenalty) {
        reagentClass = '⚠️';
        classColor = 'penalty';
    } else {
        reagentClass = getReagentClass(task.difficulty);
        classColor = getClassColor(task.difficulty);
    }

    const reagentHTML = `<div class="reagent-class ${classColor}">${reagentClass}</div>`;
    const taskText = `<div class="task-text">${task.description}</div>`;

    let buttons = '';
    if (!task.selected && !task.completed && !gameState.selectedTaskId) {
        buttons = `<button class="select-btn">🏴‍☠️ Выбрать</button>`;
    } else if (task.selected && !task.completed) {
        if (task.isPenalty) {
            buttons = `<button class="penalty-apply-btn">⚓ Выполнить</button>`;
        } else {
            buttons = `
                <button class="complete-btn">✅ Успех</button>
                <button class="penalty-btn">❌ Провал</button>
            `;
        }
    } else if (task.completed) {
        buttons = `<button disabled>✔ Сделано</button>`;
    }

    card.innerHTML = reagentHTML + taskText + `<div class="card-actions">${buttons}</div>`;

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
            gameState.level = pendingState.level;
            gameState.currentBalance = pendingState.currentBalance;
            gameState.balanceHistory = pendingState.balanceHistory;
            gameState.availableTasks = pendingState.availableTasks;
            gameState.penaltyPool = pendingState.penaltyPool;
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

    if (success) {
        socket.emit('completeTask', taskId, change);
        addHistoryEntry(`✅ Вылазка удалась: ${change>0?'+'+change:change} 🍓`);
        gameState.penaltyMode = false;
    } else {
        if (task && task.isPenalty) {
            socket.emit('applyPenaltyTask', taskId, newBalance);
            addHistoryEntry(`⚠️ Наказание отбыто: ${change>0?'+'+change:change} 🍓`);
            gameState.penaltyMode = false;
        } else {
            socket.emit('penaltyWithBalance', taskId, newBalance);
            addHistoryEntry(`❌ Вылазка провалена: ${change>0?'+'+change:change} 🍓`);
            gameState.penaltyMode = true;
        }
    }

    gameState.currentCards = gameState.currentCards.filter(t => t.id !== taskId);
    gameState.selectedTaskId = null;
    gameState.currentTaskId = null;

    if (gameState.level >= 30 && gameState.currentCards.length === 0 && !gameState.penaltyMode) {
        endGame();
    }

    taskModal.classList.add('hidden');
    updateUI();
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
        penaltyMode: false
    };
    level30CardsGenerated = false;
    socket.emit('reset', 200000);
    clearSavedGame();
    updateUI();
    updatePoolStats();
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

if (flaskGagBtn) {
    flaskGagBtn.addEventListener('click', () => {
        showToast('В бутылке оказался накид для Клубнички!');
    });
}

if (completionResetBtn) {
    completionResetBtn.addEventListener('click', () => {
        completionModal.classList.add('hidden');
        resetGame();
    });
}

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

// Анимация пузырьков (теперь морских)
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