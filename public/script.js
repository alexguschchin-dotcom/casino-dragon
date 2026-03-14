const socket = io();

// Ключ сохранения
const SAVE_KEY = 'dragon_save';

// Состояние игры
let gameState = {
    currentPath: null,        // 'left', 'center', 'right'
    pathProgress: { left: 0, center: 0, right: 0 }, // пройдено этапов на пути
    pathLength: 5,            // всего этапов на пути (включая босса)
    balance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    gameOver: false
};

// DOM элементы
const balanceSpan = document.getElementById('balance');
const mapCanvas = document.getElementById('mapCanvas');
const ctx = mapCanvas.getContext('2d');
const pathSelector = document.getElementById('path-selector');
const pathLeft = document.getElementById('path-left');
const pathCenter = document.getElementById('path-center');
const pathRight = document.getElementById('path-right');
const roomName = document.getElementById('room-name');
const roomDesc = document.getElementById('room-desc');
const actionBtn = document.getElementById('action-btn');
const logList = document.getElementById('log-list');
const resetBtn = document.getElementById('reset-btn');
const applyBalanceBtn = document.getElementById('apply-start-balance');
const taskModal = document.getElementById('task-modal');
const taskDesc = document.getElementById('task-description');
const newBalanceInput = document.getElementById('new-balance');
const completeBtn = document.getElementById('complete-task');
const failBtn = document.getElementById('fail-task');
const gameoverModal = document.getElementById('gameover-modal');
const finalBalanceSpan = document.getElementById('final-balance');
const finalStepsSpan = document.getElementById('final-steps');
const newGameBtn = document.getElementById('new-game-btn');

// ------------------- Рисование карты -------------------
function drawMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    const cx = mapCanvas.width / 2;
    const cy = mapCanvas.height / 2;

    // Рисуем три пути (линии)
    ctx.lineWidth = 6;
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 15;

    // Левый путь
    ctx.beginPath();
    ctx.strokeStyle = '#4a6f8f';
    ctx.moveTo(150, 500);
    ctx.lineTo(300, 300);
    ctx.lineTo(450, 200);
    ctx.lineTo(600, 150);
    ctx.lineTo(750, 130);
    ctx.stroke();

    // Центральный путь
    ctx.beginPath();
    ctx.strokeStyle = '#8f6f4a';
    ctx.moveTo(300, 500);
    ctx.lineTo(450, 350);
    ctx.lineTo(600, 250);
    ctx.lineTo(750, 200);
    ctx.lineTo(900, 180);
    ctx.stroke();

    // Правый путь
    ctx.beginPath();
    ctx.strokeStyle = '#6f4a8f';
    ctx.moveTo(450, 500);
    ctx.lineTo(600, 400);
    ctx.lineTo(750, 300);
    ctx.lineTo(900, 250);
    ctx.lineTo(1050, 220);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Рисуем этапы (точки)
    for (let i = 0; i < gameState.pathLength; i++) {
        // Левый путь
        drawStage(150 + i*150, 500 - i*90, 'left', i);
        // Центральный путь
        drawStage(300 + i*150, 500 - i*70, 'center', i);
        // Правый путь
        drawStage(450 + i*150, 500 - i*60, 'right', i);
    }

    // Боссы (последние этапы)
    ctx.font = '30px "Font Awesome 6 Free"';
    ctx.fillStyle = 'gold';
    ctx.fillText('👑', 750, 130-20);
    ctx.fillText('👑', 900, 180-20);
    ctx.fillText('👑', 1050, 220-20);
}

function drawStage(x, y, path, index) {
    ctx.beginPath();
    if (index < gameState.pathProgress[path]) {
        // Пройден
        ctx.fillStyle = '#4ecca7';
        ctx.shadowColor = '#4ecca7';
    } else if (index === gameState.pathProgress[path] && gameState.currentPath === path) {
        // Текущий
        ctx.fillStyle = 'gold';
        ctx.shadowColor = 'gold';
    } else {
        ctx.fillStyle = '#2a2440';
        ctx.shadowColor = 'transparent';
    }
    ctx.arc(x, y, 15, 0, 2*Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Номер этапа
    ctx.font = '14px "Cinzel"';
    ctx.fillStyle = '#fff';
    ctx.fillText(index+1, x-5, y-20);
}

// ------------------- Выбор пути -------------------
pathLeft.addEventListener('click', () => selectPath('left'));
pathCenter.addEventListener('click', () => selectPath('center'));
pathRight.addEventListener('click', () => selectPath('right'));

function selectPath(path) {
    if (gameState.gameOver) return;
    gameState.currentPath = path;
    pathSelector.style.display = 'none';
    roomName.textContent = getStageName(path, gameState.pathProgress[path]);
    roomDesc.textContent = getStageDesc(path, gameState.pathProgress[path]);
    actionBtn.disabled = false;
    drawMap();
    saveGame();
}

function getStageName(path, stage) {
    const names = {
        left: ['Лесная застава', 'Горный перевал', 'Тёмный рудник', 'Замок теней', 'Логово дракона'],
        center: ['Крепость', 'Королевский город', 'Храм солнца', 'Дворец', 'Тронный зал'],
        right: ['Порт', 'Остров', 'Подводный грот', 'Вулкан', 'Пещера']
    };
    return names[path][stage] || 'Испытание';
}

function getStageDesc(path, stage) {
    return `Вы на пути "${path}". Этап ${stage+1}. Готовьтесь к битве.`;
}

// ------------------- Начало испытания -------------------
actionBtn.addEventListener('click', () => {
    if (!gameState.currentPath) return;
    const stage = gameState.pathProgress[gameState.currentPath];
    if (stage >= gameState.pathLength) {
        // Босс уже побеждён, но такого не должно быть
        return;
    }
    // Берём случайное задание
    if (gameState.availableTasks.length === 0) {
        log('❌ Нет заданий в пуле!');
        return;
    }
    const task = gameState.availableTasks[Math.floor(Math.random() * gameState.availableTasks.length)];
    gameState.currentTaskId = task.id;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.balance;
    taskModal.classList.remove('hidden');
});

// ------------------- Завершение задания -------------------
function completeTask(success) {
    const newBalance = parseFloat(newBalanceInput.value);
    if (isNaN(newBalance)) return;

    const change = newBalance - gameState.balance;
    const taskId = gameState.currentTaskId;
    const path = gameState.currentPath;
    const stage = gameState.pathProgress[path];

    if (success) {
        socket.emit('completeTask', taskId, change);
        gameState.balance = newBalance;
        log(`✅ Этап ${stage+1} пройден! Баланс изменён на ${change>0?'+'+change:change}`);

        // Продвигаемся
        gameState.pathProgress[path]++;
        if (gameState.pathProgress[path] >= gameState.pathLength) {
            // Победа на пути
            log(`🏆 Вы завершили путь ${path}!`);
            gameState.currentPath = null;
            pathSelector.style.display = 'block';
            actionBtn.disabled = true;
            roomName.textContent = 'Выберите новый путь';
            roomDesc.textContent = '';
        } else {
            // Остались этапы
            roomName.textContent = getStageName(path, gameState.pathProgress[path]);
            roomDesc.textContent = getStageDesc(path, gameState.pathProgress[path]);
        }
    } else {
        socket.emit('penaltyWithBalance', taskId, newBalance);
        gameState.balance = newBalance;
        log(`💔 Поражение на этапе ${stage+1}. Баланс изменён на ${change}`);

        // Наказание: откат на один этап назад (если не первый)
        if (gameState.pathProgress[path] > 0) {
            gameState.pathProgress[path]--;
        }
        roomName.textContent = getStageName(path, gameState.pathProgress[path]);
        roomDesc.textContent = getStageDesc(path, gameState.pathProgress[path]);
    }

    taskModal.classList.add('hidden');
    updateUI();
    drawMap();
    saveGame();
}

// ------------------- Логи -------------------
function log(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
}

function updateUI() {
    balanceSpan.textContent = gameState.balance;
}

// ------------------- Сохранение -------------------
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

// ------------------- Подключение к серверу -------------------
socket.on('connect', () => {
    const saved = loadGame();
    if (saved && !saved.gameOver) {
        if (confirm('Найден сохранённый поход. Восстановить?')) {
            gameState = saved;
            updateUI();
            drawMap();
            if (gameState.currentPath) {
                pathSelector.style.display = 'none';
                roomName.textContent = getStageName(gameState.currentPath, gameState.pathProgress[gameState.currentPath]);
                roomDesc.textContent = getStageDesc(gameState.currentPath, gameState.pathProgress[gameState.currentPath]);
                actionBtn.disabled = false;
            } else {
                pathSelector.style.display = 'block';
                actionBtn.disabled = true;
            }
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
    // баланс может измениться на сервере (например, штраф), но у нас локальный уже обновлён
    // Обновляем баланс, если он пришёл с сервера? Оставим локальный.
    updateUI();
    saveGame();
});

// ------------------- Сброс -------------------
resetBtn.addEventListener('click', () => {
    if (confirm('Начать новое путешествие?')) {
        resetGame();
        clearSavedGame();
    }
});

function resetGame() {
    gameState = {
        currentPath: null,
        pathProgress: { left: 0, center: 0, right: 0 },
        pathLength: 5,
        balance: 1500000,
        balanceHistory: [],
        availableTasks: [],
        currentTaskId: null,
        gameOver: false
    };
    socket.emit('reset', 1500000);
    pathSelector.style.display = 'block';
    actionBtn.disabled = true;
    roomName.textContent = 'Нажмите на карту';
    roomDesc.textContent = '';
    updateUI();
    drawMap();
    log('🔄 Новое путешествие начато');
}

applyBalanceBtn.addEventListener('click', () => {
    const newBal = prompt('Введите новый начальный баланс:', gameState.balance);
    if (newBal && !isNaN(newBal)) {
        gameState.balance = parseFloat(newBal);
        updateUI();
        socket.emit('addBalance', 'Изменение баланса', 0);
    }
});

completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));

newGameBtn.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    resetGame();
});

// Инициализация
drawMap();