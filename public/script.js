const socket = io();
const SAVE_KEY = 'dragon_eggs_save';

let gameState = {
    scales: 0,              // собранные чешуйки (прогресс)
    balance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    eggs: [],                // состояние яиц (для анимаций)
    gameOver: false
};

// DOM элементы
const balanceSpan = document.getElementById('balance');
const eggsContainer = document.getElementById('eggsContainer');
const scalesSpan = document.getElementById('scalesCount');
const logList = document.getElementById('logList');
const resetBtn = document.getElementById('reset-btn');
const applyBalanceBtn = document.getElementById('apply-start-balance');
const taskModal = document.getElementById('taskModal');
const taskDesc = document.getElementById('taskDescription');
const newBalanceInput = document.getElementById('newBalance');
const completeBtn = document.getElementById('completeTask');
const failBtn = document.getElementById('failTask');
const gameoverModal = document.getElementById('gameoverModal');
const finalBalanceSpan = document.getElementById('finalBalance');
const newGameBtn = document.getElementById('newGameBtn');

// Количество яиц
const EGG_COUNT = 3;

// Инициализация яиц
function initEggs() {
    gameState.eggs = [];
    for (let i = 0; i < EGG_COUNT; i++) {
        gameState.eggs.push({
            id: i,
            state: 'idle',    // idle, hatching, hatched, flown, broken
            task: null,
            dragonfly: null    // для анимации улёта
        });
    }
    renderEggs();
}

function renderEggs() {
    eggsContainer.innerHTML = '';
    gameState.eggs.forEach((egg, index) => {
        const eggDiv = document.createElement('div');
        eggDiv.className = `egg ${egg.state}`;
        eggDiv.dataset.index = index;
        
        // Визуальные эффекты в зависимости от состояния
        if (egg.state === 'idle') {
            eggDiv.addEventListener('click', () => startHatching(index));
        } else if (egg.state === 'hatching') {
            // анимация трещин уже через CSS
        } else if (egg.state === 'hatched') {
            // появился дракончик
            eggDiv.innerHTML = '<div class="dragon-icon">🐉</div>';
        } else if (egg.state === 'flown') {
            // осталась чешуйка
            eggDiv.innerHTML = '<div class="scale-icon">✨</div>';
        } else if (egg.state === 'broken') {
            // разбитое яйцо
            eggDiv.innerHTML = '<div class="broken">💔</div>';
        }

        eggsContainer.appendChild(eggDiv);
    });
}

// Начало вылупления
function startHatching(index) {
    if (gameState.eggs[index].state !== 'idle') return;
    if (gameState.availableTasks.length === 0) {
        log('❌ Нет заданий в пуле!');
        return;
    }

    // Помечаем яйцо как вылупляющееся
    gameState.eggs[index].state = 'hatching';
    renderEggs();

    // Через 1.5 секунды появляется дракончик
    setTimeout(() => {
        if (gameState.eggs[index].state === 'hatching') {
            gameState.eggs[index].state = 'hatched';
            renderEggs();
            // Запоминаем индекс для открытия модалки
            gameState.currentEggIndex = index;
            openTaskModal();
        }
    }, 1500);
}

// Открыть модалку с заданием
function openTaskModal() {
    const task = gameState.availableTasks[Math.floor(Math.random() * gameState.availableTasks.length)];
    gameState.currentTaskId = task.id;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.balance;
    taskModal.classList.remove('hidden');
}

// Завершение задания
function completeTask(success) {
    const newBalance = parseFloat(newBalanceInput.value);
    if (isNaN(newBalance)) return;

    const change = newBalance - gameState.balance;
    const taskId = gameState.currentTaskId;
    const eggIndex = gameState.currentEggIndex;

    if (success) {
        socket.emit('completeTask', taskId, change);
        gameState.balance = newBalance;
        gameState.scales++;
        scalesSpan.textContent = gameState.scales;

        // Анимация улёта дракончика
        if (eggIndex !== undefined) {
            gameState.eggs[eggIndex].state = 'flown';
        }
        log(`✅ Дракончик вылупился и улетел! +1 чешуйка. Баланс изменён на ${change>0?'+'+change:change}`);

        // Проверка на победу
        if (gameState.scales >= 30) {
            winGame();
        }
    } else {
        socket.emit('penaltyWithBalance', taskId, newBalance);
        gameState.balance = newBalance;
        // Яйцо разбивается
        if (eggIndex !== undefined) {
            gameState.eggs[eggIndex].state = 'broken';
        }
        log(`💥 Яйцо разбилось! Баланс изменён на ${change}`);
    }

    taskModal.classList.add('hidden');
    gameState.currentEggIndex = undefined;
    renderEggs();
    updateUI();
    saveGame();
}

function winGame() {
    gameState.gameOver = true;
    finalBalanceSpan.textContent = gameState.balance;
    gameoverModal.classList.remove('hidden');
    clearSavedGame();
}

function log(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
}

function updateUI() {
    balanceSpan.textContent = gameState.balance;
    scalesSpan.textContent = gameState.scales;
}

// Сохранение и загрузка
function saveGame() {
    try {
        const saveData = {
            ...gameState,
            timestamp: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {}
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;
        const data = JSON.parse(saved);
        if (Date.now() - data.timestamp > 24*60*60*1000) {
            localStorage.removeItem(SAVE_KEY);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
}

function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
}

function resetGame() {
    gameState = {
        scales: 0,
        balance: 1500000,
        balanceHistory: [],
        availableTasks: [],
        currentTaskId: null,
        eggs: [],
        gameOver: false
    };
    socket.emit('reset', 1500000);
    initEggs();
    updateUI();
    logList.innerHTML = '';
    log('🔄 Новая игра начата');
    saveGame();
}

// Socket
socket.on('connect', () => {
    const saved = loadGame();
    if (saved && !saved.gameOver) {
        if (confirm('Найден сохранённый прогресс. Восстановить?')) {
            gameState = saved;
            renderEggs();
            updateUI();
            return;
        } else {
            clearSavedGame();
        }
    }
    socket.emit('reset', 1500000);
});

socket.on('state', (serverState) => {
    gameState.balanceHistory = serverState.balanceHistory;
    gameState.availableTasks = serverState.availableTasks;
    // Баланс уже локальный
    updateUI();
    saveGame();
});

// Обработчики
completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));
resetBtn.addEventListener('click', () => {
    if (confirm('Начать новую игру?')) {
        resetGame();
        clearSavedGame();
    }
});
applyBalanceBtn.addEventListener('click', () => {
    const newBal = prompt('Введите новый начальный баланс:', gameState.balance);
    if (newBal && !isNaN(newBal)) {
        gameState.balance = parseFloat(newBal);
        updateUI();
        socket.emit('addBalance', 'Изменение баланса', 0);
    }
});
newGameBtn.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    resetGame();
});

// Инициализация
initEggs();