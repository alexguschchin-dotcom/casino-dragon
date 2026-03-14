const socket = io();

// Ключ сохранения
const SAVE_KEY = 'rogue_save';

// Состояние игры
let gameState = {
    floor: 1,
    maxFloor: 3,
    map: [],            // массив комнат для текущего этажа
    currentRoomId: null,
    health: 100,
    maxHealth: 100,
    balance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    completedRooms: [],
    gameOver: false
};

// DOM элементы
const healthSpan = document.getElementById('health');
const balanceSpan = document.getElementById('balance');
const floorSpan = document.getElementById('floor');
const mapCanvas = document.getElementById('mapCanvas');
const ctx = mapCanvas.getContext('2d');
const roomTitle = document.getElementById('room-title');
const roomDesc = document.getElementById('room-desc');
const actionBtn = document.getElementById('action-btn');
const logList = document.getElementById('log-list');
const resetBtn = document.getElementById('reset-btn');
const taskModal = document.getElementById('task-modal');
const taskDesc = document.getElementById('task-description');
const newBalanceInput = document.getElementById('new-balance');
const completeBtn = document.getElementById('complete-task');
const failBtn = document.getElementById('fail-task');
const shopModal = document.getElementById('shop-modal');
const closeShopBtn = document.getElementById('close-shop');
const gameoverModal = document.getElementById('gameover-modal');
const finalBalanceSpan = document.getElementById('final-balance');
const finalFloorSpan = document.getElementById('final-floor');
const newGameBtn = document.getElementById('new-game-btn');

// Магазин
const shopHealth = document.getElementById('shop-health');
const shopDamage = document.getElementById('shop-damage');
const shopGold = document.getElementById('shop-gold');

// ------------------- Генерация карты -------------------
function generateFloor(floorNum) {
    const rooms = [];
    const roomsPerRow = 5; // 5 колонок
    const rows = 3; // 3 строки
    const startX = 150;
    const startY = 50;
    const offsetX = 120;
    const offsetY = 100;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < roomsPerRow; col++) {
            const x = startX + col * offsetX;
            const y = startY + row * offsetY;
            // Тип комнаты: 0-бой, 1-сундук, 2-магазин, 3-событие
            let type = 0; // по умолчанию бой
            if (row === 0 && col === 0) type = 'start'; // старт
            else if (row === rows-1 && col === roomsPerRow-1) type = 'boss'; // босс
            else {
                const r = Math.random();
                if (r < 0.2) type = 'chest';
                else if (r < 0.35) type = 'shop';
                else if (r < 0.5) type = 'event';
                else type = 'fight';
            }

            rooms.push({
                id: `r${floorNum}-${row}-${col}`,
                x, y,
                row, col,
                type,
                visited: false,
                available: (row === 0 && col === 0), // только старт доступен
                task: null, // для боя будет задание
                reward: Math.floor(Math.random() * 500) + 100 // для сундука
            });
        }
    }

    // Устанавливаем связи (соседние комнаты)
    rooms.forEach(room => {
        room.neighbors = [];
        // сосед справа
        const right = rooms.find(r => r.row === room.row && r.col === room.col + 1);
        if (right) room.neighbors.push(right.id);
        // сосед снизу
        const down = rooms.find(r => r.row === room.row + 1 && r.col === room.col);
        if (down) room.neighbors.push(down.id);
        // можно добавить диагонали для ветвления
        const downRight = rooms.find(r => r.row === room.row + 1 && r.col === room.col + 1);
        if (downRight && Math.random() > 0.5) room.neighbors.push(downRight.id);
    });

    return rooms;
}

// ------------------- Отрисовка карты -------------------
function drawMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    ctx.strokeStyle = '#6a6f7f';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#2a2f3f';

    // Рисуем связи
    gameState.map.forEach(room => {
        room.neighbors.forEach(nId => {
            const neighbor = gameState.map.find(r => r.id === nId);
            if (neighbor) {
                ctx.beginPath();
                ctx.moveTo(room.x, room.y);
                ctx.lineTo(neighbor.x, neighbor.y);
                ctx.strokeStyle = room.available && neighbor.available ? '#ffd966' : '#6a6f7f';
                ctx.stroke();
            }
        });
    });

    // Рисуем комнаты
    gameState.map.forEach(room => {
        // Цвет в зависимости от типа и статуса
        if (room.id === gameState.currentRoomId) {
            ctx.fillStyle = '#ffaa00';
        } else if (room.visited) {
            ctx.fillStyle = '#4a6f8f';
        } else if (room.available) {
            ctx.fillStyle = '#2a6f2a';
        } else {
            ctx.fillStyle = '#3a3f4f';
        }

        ctx.beginPath();
        ctx.arc(room.x, room.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Иконка типа
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '?';
        if (room.type === 'start') icon = '🏠';
        else if (room.type === 'boss') icon = '👑';
        else if (room.type === 'fight') icon = '⚔️';
        else if (room.type === 'chest') icon = '📦';
        else if (room.type === 'shop') icon = '🏪';
        else if (room.type === 'event') icon = '❓';
        ctx.fillText(icon, room.x, room.y - 5);
    });
}

// ------------------- Выбор комнаты -------------------
mapCanvas.addEventListener('click', (e) => {
    const rect = mapCanvas.getBoundingClientRect();
    const scaleX = mapCanvas.width / rect.width;
    const scaleY = mapCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const clickedRoom = gameState.map.find(room => {
        const dist = Math.hypot(mouseX - room.x, mouseY - room.y);
        return dist < 20 && room.available && !room.visited;
    });

    if (clickedRoom) {
        enterRoom(clickedRoom);
    }
});

function enterRoom(room) {
    if (gameState.gameOver) return;
    gameState.currentRoomId = room.id;
    room.visited = true;
    room.available = false;

    // Открываем соседние комнаты
    room.neighbors.forEach(nId => {
        const neighbor = gameState.map.find(r => r.id === nId);
        if (neighbor) neighbor.available = true;
    });

    // Обновляем панель
    roomTitle.textContent = getRoomTitle(room.type);
    roomDesc.textContent = getRoomDesc(room.type);
    actionBtn.disabled = false;
    actionBtn.onclick = () => roomAction(room);

    drawMap();
    saveGame();
}

function getRoomTitle(type) {
    const titles = {
        start: 'Вход',
        boss: 'Тронный зал',
        fight: 'Бой',
        chest: 'Сундук',
        shop: 'Лавка',
        event: 'Случай'
    };
    return titles[type] || 'Комната';
}

function getRoomDesc(type) {
    const descs = {
        start: 'Вы начинаете путь.',
        boss: 'Финальный бой!',
        fight: 'Вас ждёт испытание в казино.',
        chest: 'Здесь может быть сокровище.',
        shop: 'Можно купить полезные вещи.',
        event: 'Что-то произойдёт...'
    };
    return descs[type] || '';
}

function roomAction(room) {
    switch (room.type) {
        case 'fight':
        case 'boss':
            startFight(room);
            break;
        case 'chest':
            openChest(room);
            break;
        case 'shop':
            openShop();
            break;
        case 'event':
            randomEvent(room);
            break;
        default:
            // старт ничего не делает
            roomTitle.textContent = 'Вход';
            roomDesc.textContent = 'Вы уже здесь.';
    }
}

// ------------------- Бой -------------------
function startFight(room) {
    if (gameState.availableTasks.length === 0) {
        log('❌ Нет заданий для боя!');
        return;
    }
    const task = gameState.availableTasks[Math.floor(Math.random() * gameState.availableTasks.length)];
    gameState.currentTaskId = task.id;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.balance;
    taskModal.classList.remove('hidden');
}

function completeTask(success) {
    const newBalance = parseFloat(newBalanceInput.value);
    if (isNaN(newBalance)) return;

    const change = newBalance - gameState.balance;
    const taskId = gameState.currentTaskId;

    if (success) {
        socket.emit('completeTask', taskId, change);
        gameState.balance = newBalance;
        log(`✅ Бой выигран! Баланс изменён на ${change>0?'+'+change:change}`);
        // Возможно награда за бой
    } else {
        socket.emit('penaltyWithBalance', taskId, newBalance);
        gameState.balance = newBalance;
        const damage = Math.floor(Math.random() * 20) + 10;
        gameState.health -= damage;
        log(`💥 Поражение! Потеряно ${damage} здоровья. Баланс изменён на ${change}`);
        if (gameState.health <= 0) gameOver();
    }

    // Проверяем, не босс ли это
    const currentRoom = gameState.map.find(r => r.id === gameState.currentRoomId);
    if (currentRoom && currentRoom.type === 'boss') {
        if (success) {
            if (gameState.floor < gameState.maxFloor) {
                gameState.floor++;
                floorSpan.textContent = gameState.floor;
                gameState.map = generateFloor(gameState.floor);
                gameState.currentRoomId = null;
                log(`⬇️ Спуск на этаж ${gameState.floor}`);
            } else {
                // Победа!
                alert('Поздравляем! Вы прошли подземелье!');
                resetGame();
            }
        }
    }

    taskModal.classList.add('hidden');
    updateUI();
    saveGame();
}

// ------------------- Сундук -------------------
function openChest(room) {
    const reward = room.reward || 200;
    gameState.balance += reward;
    log(`💰 Сундук открыт! +${reward} золота`);
    roomTitle.textContent = 'Сундук открыт';
    roomDesc.textContent = '';
    actionBtn.disabled = true;
    updateUI();
    saveGame();
}

// ------------------- Магазин -------------------
function openShop() {
    shopModal.classList.remove('hidden');
}

shopHealth.addEventListener('click', () => {
    if (gameState.balance >= 500) {
        gameState.balance -= 500;
        gameState.health = Math.min(gameState.health + 30, gameState.maxHealth);
        log('❤️ Куплено зелье лечения +30 HP');
        updateUI();
        saveGame();
    }
});

shopDamage.addEventListener('click', () => {
    if (gameState.balance >= 1000) {
        gameState.balance -= 1000;
        // можно добавить модификатор урона для заданий
        log('⚔️ Куплен меч +5% урона');
        updateUI();
        saveGame();
    }
});

shopGold.addEventListener('click', () => {
    if (gameState.balance >= 400) {
        gameState.balance -= 400;
        gameState.balance += 500;
        log('💰 Куплен мешок монет +500');
        updateUI();
        saveGame();
    }
});

closeShopBtn.addEventListener('click', () => {
    shopModal.classList.add('hidden');
});

// ------------------- Случайное событие -------------------
function randomEvent(room) {
    const r = Math.random();
    if (r < 0.5) {
        // бонус
        const gain = Math.floor(Math.random() * 300) + 100;
        gameState.balance += gain;
        log(`✨ Удача! +${gain} золота`);
    } else {
        // штраф
        const loss = Math.floor(Math.random() * 200) + 50;
        gameState.balance -= loss;
        const dmg = Math.floor(Math.random() * 10) + 5;
        gameState.health -= dmg;
        log(`💢 Неудача! Потеряно ${loss} золота и ${dmg} здоровья`);
        if (gameState.health <= 0) gameOver();
    }
    roomTitle.textContent = 'Событие';
    roomDesc.textContent = '';
    actionBtn.disabled = true;
    updateUI();
    saveGame();
}

// ------------------- Вспомогательные -------------------
function log(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
}

function updateUI() {
    healthSpan.textContent = gameState.health;
    balanceSpan.textContent = gameState.balance;
}

function gameOver() {
    gameState.gameOver = true;
    finalBalanceSpan.textContent = gameState.balance;
    finalFloorSpan.textContent = gameState.floor;
    gameoverModal.classList.remove('hidden');
    clearSavedGame();
}

function resetGame() {
    gameState = {
        floor: 1,
        maxFloor: 3,
        map: generateFloor(1),
        currentRoomId: null,
        health: 100,
        maxHealth: 100,
        balance: 1500000,
        balanceHistory: [],
        availableTasks: [],
        currentTaskId: null,
        completedRooms: [],
        gameOver: false
    };
    socket.emit('reset', gameState.balance);
    updateUI();
    drawMap();
    logList.innerHTML = '';
    log('🔄 Новое приключение!');
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
    // баланс может обновиться с сервера, но у нас он локальный
    // balanceSpan.textContent = gameState.balance; // оставляем локальный
    updateUI();
    saveGame();
});

// ------------------- Обработчики -------------------
completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));

newGameBtn.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    resetGame();
});

resetBtn.addEventListener('click', () => {
    if (confirm('Начать новый поход?')) {
        resetGame();
        clearSavedGame();
    }
});

// Инициализация
resetGame();

// Пиксельный фон
(function initBg() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    }
    window.addEventListener('resize', resize);
    resize();

    function draw() {
        ctx.fillStyle = '#1a1e2b';
        ctx.fillRect(0,0,w,h);
        // шум
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(100,100,100,${Math.random()*0.1})`;
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
        }
        requestAnimationFrame(draw);
    }
    draw();
})();