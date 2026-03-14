const socket = io();
const SAVE_KEY = 'dragon_quest_save';

let gameState = {
    currentPath: null,
    pathProgress: { left: 0, center: 0, right: 0 },
    pathLength: 5,
    balance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    gameOver: false
};

// DOM elements
const balanceSpan = document.getElementById('balance');
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const pathSelector = document.getElementById('path-selector');
const pathLeft = document.getElementById('path-left');
const pathCenter = document.getElementById('path-center');
const pathRight = document.getElementById('path-right');
const islandName = document.getElementById('island-name');
const islandDesc = document.getElementById('island-desc');
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

// Пути и острова
const pathColors = {
    left: '#4a7a9a',
    center: '#b8860b',
    right: '#8a6a9a'
};

const islandNames = {
    left: ['Лесная застава', 'Горный перевал', 'Тёмный рудник', 'Замок теней', 'Логово дракона'],
    center: ['Пограничная крепость', 'Королевский город', 'Храм солнца', 'Дворец', 'Тронный зал'],
    right: ['Пиратский порт', 'Остров бури', 'Подводный грот', 'Вулкан', 'Пещера дракона']
};

// Рисование карты
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Звёздное небо
    ctx.fillStyle = '#0b0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255,255,200,${Math.random()*0.5+0.3})`;
        ctx.beginPath();
        ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*2+1, 0, 2*Math.PI);
        ctx.fill();
    }

    // Облака (анимируются позже)
    drawClouds();

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 50;

    // Координаты островов для каждого пути
    const islandCoords = {
        left: [],
        center: [],
        right: []
    };

    // Генерация позиций островов
    for (let i = 0; i < gameState.pathLength; i++) {
        // Левый путь (смещён влево, идёт вверх)
        islandCoords.left.push({
            x: cx - 250 + i * 60,
            y: cy + 150 - i * 80
        });
        // Центральный путь
        islandCoords.center.push({
            x: cx - 50 + i * 80,
            y: cy + 200 - i * 70
        });
        // Правый путь
        islandCoords.right.push({
            x: cx + 150 + i * 70,
            y: cy + 150 - i * 60
        });
    }

    // Рисуем мосты (линии между островами)
    ctx.lineWidth = 6;
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 20;
    for (let path of ['left', 'center', 'right']) {
        const coords = islandCoords[path];
        ctx.strokeStyle = pathColors[path];
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        for (let i = 1; i < coords.length; i++) {
            ctx.lineTo(coords[i].x, coords[i].y);
        }
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Рисуем острова
    for (let path of ['left', 'center', 'right']) {
        const progress = gameState.pathProgress[path];
        const coords = islandCoords[path];
        for (let i = 0; i < coords.length; i++) {
            const x = coords[i].x;
            const y = coords[i].y;

            // Определяем цвет острова
            if (i < progress) {
                // Пройден
                ctx.fillStyle = '#4ecca7';
                ctx.shadowColor = '#4ecca7';
            } else if (i === progress && gameState.currentPath === path) {
                // Текущий
                ctx.fillStyle = 'gold';
                ctx.shadowColor = 'gold';
            } else {
                ctx.fillStyle = '#2a2a4a';
                ctx.shadowColor = 'transparent';
            }
            ctx.shadowBlur = 20;
            
            // Рисуем остров (круг с имитацией земли)
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, 2*Math.PI);
            ctx.fill();
            
            // Добавляем текстуру (небольшие крапинки)
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for (let j = 0; j < 5; j++) {
                ctx.beginPath();
                ctx.arc(x-5+Math.random()*10, y-5+Math.random()*10, 2, 0, 2*Math.PI);
                ctx.fill();
            }

            // Иконка
            ctx.font = '20px "Font Awesome 6 Free"';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            let icon = i === gameState.pathLength-1 ? '👑' : '🗻';
            ctx.fillText(icon, x-12, y-10);

            // Номер этапа
            ctx.font = '14px "Cinzel"';
            ctx.fillText(i+1, x-5, y-40);
        }
    }
    ctx.shadowBlur = 0;
}

function drawClouds() {
    // Простая анимация облаков (можно улучшить позже)
    // Пока оставим статичными
}

// Выбор пути
pathLeft.addEventListener('click', () => selectPath('left'));
pathCenter.addEventListener('click', () => selectPath('center'));
pathRight.addEventListener('click', () => selectPath('right'));

function selectPath(path) {
    if (gameState.gameOver) return;
    gameState.currentPath = path;
    pathSelector.classList.add('hidden');
    updateIslandPanel();
    actionBtn.disabled = false;
    drawMap();
    saveGame();
}

function updateIslandPanel() {
    if (!gameState.currentPath) return;
    const stage = gameState.pathProgress[gameState.currentPath];
    islandName.textContent = islandNames[gameState.currentPath][stage];
    islandDesc.textContent = `Этап ${stage+1} из ${gameState.pathLength}. Приготовьтесь к испытанию.`;
}

// Нажатие на кнопку действия
actionBtn.addEventListener('click', () => {
    if (!gameState.currentPath) return;
    if (gameState.availableTasks.length === 0) {
        log('❌ В пуле нет заданий!');
        return;
    }
    const task = gameState.availableTasks[Math.floor(Math.random() * gameState.availableTasks.length)];
    gameState.currentTaskId = task.id;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.balance;
    taskModal.classList.remove('hidden');
});

// Завершение задания
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

        gameState.pathProgress[path]++;

        if (gameState.pathProgress[path] >= gameState.pathLength) {
            // Завершение пути
            log(`🏆 Вы завершили путь ${path}!`);
            gameState.currentPath = null;
            pathSelector.classList.remove('hidden');
            actionBtn.disabled = true;
            islandName.textContent = '';
            islandDesc.textContent = 'Выберите новый путь';
        } else {
            updateIslandPanel();
        }
    } else {
        socket.emit('penaltyWithBalance', taskId, newBalance);
        gameState.balance = newBalance;
        log(`💔 Поражение на этапе ${stage+1}. Баланс изменён на ${change}`);

        if (gameState.pathProgress[path] > 0) {
            gameState.pathProgress[path]--;
        }
        updateIslandPanel();
    }

    taskModal.classList.add('hidden');
    updateUI();
    drawMap();
    saveGame();
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

// Сброс игры
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
    pathSelector.classList.remove('hidden');
    actionBtn.disabled = true;
    islandName.textContent = '';
    islandDesc.textContent = 'Выберите путь';
    updateUI();
    drawMap();
    logList.innerHTML = '';
    log('🔄 Новое путешествие начато');
    saveGame();
}

// Socket
socket.on('connect', () => {
    const saved = loadGame();
    if (saved && !saved.gameOver) {
        if (confirm('Найден сохранённый поход. Восстановить?')) {
            gameState = saved;
            updateUI();
            drawMap();
            if (gameState.currentPath) {
                pathSelector.classList.add('hidden');
                updateIslandPanel();
                actionBtn.disabled = false;
            } else {
                pathSelector.classList.remove('hidden');
                actionBtn.disabled = true;
                islandName.textContent = '';
                islandDesc.textContent = 'Выберите путь';
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
    // Баланс может обновиться, но мы уже локально меняем
    updateUI();
    saveGame();
});

// Обработчики
completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));
resetBtn.addEventListener('click', () => {
    if (confirm('Начать новое путешествие?')) {
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
drawMap();
setInterval(() => {
    // Анимация облаков (перерисовываем карту, облака можно анимировать)
    drawMap();
}, 100);