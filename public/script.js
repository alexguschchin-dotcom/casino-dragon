const socket = io();
const SAVE_KEY = 'dragon_hoard_save';

let gameState = {
    scales: 0,
    maxScales: 30,
    balance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    eggs: [
        { x: 250, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 },
        { x: 500, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 },
        { x: 750, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 }
    ],
    particles: [],
    gameOver: false,
    winAnimation: false
};

// DOM элементы
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const balanceSpan = document.getElementById('balanceValue');
const scalesSpan = document.getElementById('scalesValue');
const resetBtn = document.getElementById('resetBtn');
const applyBalanceBtn = document.getElementById('applyBalance');
const taskModal = document.getElementById('taskModal');
const taskDesc = document.getElementById('taskDesc');
const newBalanceInput = document.getElementById('newBalance');
const completeBtn = document.getElementById('completeBtn');
const failBtn = document.getElementById('failBtn');
const winModal = document.getElementById('winModal');
const finalBalanceSpan = document.getElementById('finalBalance');
const newGameBtn = document.getElementById('newGameBtn');
const logDiv = document.getElementById('log');

let currentEggIndex = null;
let animationFrame = null;
let lastTime = 0;

// ------------------- Анимация и отрисовка -------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем фон (пещера)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Добавим текстуру камня
    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(100,100,120,${Math.random()*0.2})`;
        ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 4, 4);
    }

    // Рисуем яйца
    gameState.eggs.forEach((egg, idx) => {
        drawEgg(egg, idx);
    });

    // Рисуем частицы (чешуйки, осколки)
    drawParticles();

    // Анимация победы (дракон)
    if (gameState.winAnimation) {
        drawVictoryDragon();
    }

    // Рисуем дракончика, если яйцо вылупилось и не улетело
    gameState.eggs.forEach((egg, idx) => {
        if (egg.state === 'hatched' && !egg.broken) {
            drawDragon(egg.x, egg.y - 60);
        }
    });

    animationFrame = requestAnimationFrame(draw);
}

function drawEgg(egg, idx) {
    const x = egg.x;
    const y = egg.y;
    const w = 100;
    const h = 120;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(egg.scale, 1);
    ctx.translate(-x, -y);

    // Тень
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 20;

    // Градиент для яйца
    const gradient = ctx.createRadialGradient(x-20, y-20, 10, x, y, 80);
    gradient.addColorStop(0, '#f7e5c2');
    gradient.addColorStop(1, '#c9a87c');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, w/2, h/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Крапинки
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8b5a2b';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x-20+Math.random()*40, y-20+Math.random()*40, 2+Math.random()*3, 0, 2*Math.PI);
        ctx.fill();
    }

    // Трещины при вылуплении
    if (egg.state === 'hatching') {
        ctx.strokeStyle = '#4a2a1a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x-30 + i*15, y-30);
            ctx.lineTo(x-20 + i*15, y+30);
            ctx.stroke();
        }
    }

    // Если разбито
    if (egg.broken) {
        ctx.fillStyle = '#5a3a1a';
        ctx.font = '40px "Font Awesome 6 Free"';
        ctx.fillText('💔', x-20, y-20);
    }

    ctx.restore();
}

function drawDragon(x, y) {
    // Рисуем маленького дракончика
    ctx.save();
    ctx.translate(x, y);
    // Голова
    ctx.fillStyle = '#6b8e23';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 15, 0, 0, 2*Math.PI);
    ctx.fill();
    // Глаза
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-5, -5, 5, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -5, 5, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-5, -5, 2, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -5, 2, 0, 2*Math.PI);
    ctx.fill();
    // Крылья (анимированные)
    ctx.fillStyle = '#8fbc8f';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-30, -15);
    ctx.lineTo(-20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(30, -15);
    ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawParticles() {
    gameState.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    });
}

function drawVictoryDragon() {
    // Большой дракон
    ctx.save();
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 50;
    ctx.fillStyle = '#d4af37';
    ctx.font = '120px "Font Awesome 6 Free"';
    ctx.fillText('🐉', canvas.width/2-60, canvas.height/2);
    ctx.restore();
}

// ------------------- Анимация частиц -------------------
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 5 + 2,
            color: color,
            alpha: 1,
            life: 1
        });
    }
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;
        p.life -= 0.01;
        if (p.alpha <= 0 || p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

// ------------------- Выбор яйца -------------------
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    gameState.eggs.forEach((egg, idx) => {
        const dx = mouseX - egg.x;
        const dy = mouseY - egg.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 60 && egg.state === 'idle' && !gameState.gameOver && !gameState.winAnimation) {
            startHatching(idx);
        }
    });
});

function startHatching(idx) {
    if (gameState.eggs[idx].state !== 'idle') return;
    if (gameState.availableTasks.length === 0) {
        log('❌ Нет заданий в пуле');
        return;
    }
    gameState.eggs[idx].state = 'hatching';
    log('Яйцо начинает трескаться...');
    setTimeout(() => {
        if (gameState.eggs[idx].state === 'hatching') {
            gameState.eggs[idx].state = 'hatched';
            createParticles(gameState.eggs[idx].x, gameState.eggs[idx].y, 20, 'gold');
            currentEggIndex = idx;
            openTaskModal();
        }
    }, 2000);
}

function openTaskModal() {
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
    const eggIndex = currentEggIndex;

    if (success) {
        socket.emit('completeTask', taskId, change);
        gameState.balance = newBalance;
        gameState.scales++;
        scalesSpan.textContent = gameState.scales;

        // Дракончик улетает
        if (eggIndex !== null) {
            gameState.eggs[eggIndex].state = 'flown';
            // Анимация улёта: дракон поднимается вверх
            for (let i = 0; i < 30; i++) {
                createParticles(gameState.eggs[eggIndex].x, gameState.eggs[eggIndex].y-50, 5, '#ffd700');
            }
        }

        log(`✅ Дракончик улетел! +1 чешуйка. Баланс: ${change>0?'+'+change:change}`);

        if (gameState.scales >= gameState.maxScales) {
            winGame();
        }
    } else {
        socket.emit('penaltyWithBalance', taskId, newBalance);
        gameState.balance = newBalance;
        // Яйцо разбивается
        if (eggIndex !== null) {
            gameState.eggs[eggIndex].broken = true;
            gameState.eggs[eggIndex].state = 'broken';
            createParticles(gameState.eggs[eggIndex].x, gameState.eggs[eggIndex].y, 30, '#8b4513');
        }
        log(`💥 Яйцо разбито! Баланс: ${change}`);
    }

    taskModal.classList.add('hidden');
    currentEggIndex = null;
    updateUI();
    saveGame();
}

function winGame() {
    gameState.gameOver = true;
    gameState.winAnimation = true;
    finalBalanceSpan.textContent = gameState.balance;
    winModal.classList.remove('hidden');
    clearSavedGame();
    // Через некоторое время убираем дракона
    setTimeout(() => {
        gameState.winAnimation = false;
    }, 5000);
}

function log(text) {
    const entry = document.createElement('div');
    entry.textContent = text;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function updateUI() {
    balanceSpan.textContent = gameState.balance;
    scalesSpan.textContent = gameState.scales;
}

// ------------------- Сохранение/загрузка -------------------
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
        maxScales: 30,
        balance: 1500000,
        balanceHistory: [],
        availableTasks: [],
        currentTaskId: null,
        eggs: [
            { x: 250, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 },
            { x: 500, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 },
            { x: 750, y: 350, state: 'idle', hatchProgress: 0, broken: false, scale: 1 }
        ],
        particles: [],
        gameOver: false,
        winAnimation: false
    };
    socket.emit('reset', 1500000);
    log('🔄 Новая игра начата');
    updateUI();
    saveGame();
}

// ------------------- Socket -------------------
socket.on('connect', () => {
    const saved = loadGame();
    if (saved && !saved.gameOver) {
        if (confirm('Найден сохранённый прогресс. Восстановить?')) {
            gameState = saved;
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
    updateUI();
    saveGame();
});

// ------------------- Обработчики -------------------
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
    winModal.classList.add('hidden');
    resetGame();
});

// ------------------- Анимация -------------------
function animate() {
    updateParticles();
    draw();
    requestAnimationFrame(animate);
}

animate();