const socket = io();

let gameState = {
    sand: 100,              // процент песка
    currentBalance: 1500000,
    balanceHistory: [],
    availableTasks: [],
    currentTaskId: null,
    gameCompleted: false
};

const balanceSpan = document.getElementById('current-balance');
const historyDiv = document.getElementById('history-list');
const sandLevelSpan = document.querySelector('.sand-level span');
const startTaskBtn = document.getElementById('start-task');
const resetBtn = document.getElementById('reset-btn');
const applyBalanceBtn = document.getElementById('apply-start-balance');
const taskModal = document.getElementById('task-modal');
const taskDesc = document.getElementById('task-description');
const newBalanceInput = document.getElementById('new-balance');
const completeBtn = document.getElementById('complete-task');
const failBtn = document.getElementById('fail-task');
const completionModal = document.getElementById('completion-modal');
const finalBalanceSpan = document.getElementById('final-balance');
const completionResetBtn = document.getElementById('completion-reset-btn');

const canvas = document.getElementById('hourglassCanvas');
const ctx = canvas.getContext('2d');

function drawHourglass() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sandHeight = 200 * (gameState.sand / 100);
    // Верхняя колба
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(300, 100);
    ctx.lineTo(250, 300);
    ctx.lineTo(150, 300);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Нижняя колба
    ctx.beginPath();
    ctx.moveTo(150, 300);
    ctx.lineTo(250, 300);
    ctx.lineTo(300, 500);
    ctx.lineTo(100, 500);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Песок в нижней части
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(150, 500 - sandHeight, 100, sandHeight);
    // Песок в верхней части (остаток)
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(150, 100, 100, 200 - (200 - sandHeight));
}

function updateSand(change) {
    gameState.sand = Math.max(0, Math.min(100, gameState.sand + change));
    sandLevelSpan.textContent = gameState.sand + '%';
    drawHourglass();
    if (gameState.sand <= 0) endGame();
}

function startTask() {
    if (gameState.gameCompleted) return;
    if (gameState.availableTasks.length === 0) {
        alert('Нет заданий');
        return;
    }
    const task = gameState.availableTasks[Math.floor(Math.random() * gameState.availableTasks.length)];
    gameState.currentTaskId = task.id;
    taskDesc.textContent = task.description;
    newBalanceInput.value = gameState.currentBalance;
    taskModal.classList.remove('hidden');
}

function completeTask(success) {
    const newBalance = parseFloat(newBalanceInput.value);
    if (isNaN(newBalance)) return;
    const change = newBalance - gameState.currentBalance;
    if (success) {
        socket.emit('completeTask', gameState.currentTaskId, change);
        updateSand(10); // +10% песка за успех
        addHistoryEntry(`✅ Задание выполнено (+10% песка)`);
    } else {
        socket.emit('penaltyWithBalance', gameState.currentTaskId, newBalance);
        updateSand(-15); // -15% за провал
        addHistoryEntry(`❌ Провал (-15% песка)`);
    }
    taskModal.classList.add('hidden');
}

function addHistoryEntry(text) {
    const entry = document.createElement('div');
    entry.className = 'history-item';
    entry.textContent = text;
    historyDiv.appendChild(entry);
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

function endGame() {
    gameState.gameCompleted = true;
    finalBalanceSpan.textContent = gameState.currentBalance;
    completionModal.classList.remove('hidden');
}

function resetGame() {
    gameState.sand = 100;
    gameState.currentBalance = 1500000;
    gameState.gameCompleted = false;
    sandLevelSpan.textContent = '100%';
    historyDiv.innerHTML = '';
    socket.emit('reset', gameState.currentBalance);
    drawHourglass();
}

// --- socket ---
socket.on('connect', () => socket.emit('reset', 1500000));
socket.on('state', (serverState) => {
    gameState.currentBalance = serverState.currentBalance;
    gameState.balanceHistory = serverState.balanceHistory;
    gameState.availableTasks = serverState.availableTasks;
    balanceSpan.textContent = gameState.currentBalance;
    renderHistory();
    drawHourglass();
});

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

startTaskBtn.addEventListener('click', startTask);
completeBtn.addEventListener('click', () => completeTask(true));
failBtn.addEventListener('click', () => completeTask(false));
resetBtn.addEventListener('click', resetGame);
applyBalanceBtn.addEventListener('click', () => {
    const newBal = prompt('Новый баланс:', gameState.currentBalance);
    if (newBal && !isNaN(newBal)) {
        gameState.currentBalance = parseFloat(newBal);
        balanceSpan.textContent = gameState.currentBalance;
        socket.emit('addBalance', 'Изменение баланса', 0);
    }
});
completionResetBtn.addEventListener('click', () => {
    completionModal.classList.add('hidden');
    resetGame();
});