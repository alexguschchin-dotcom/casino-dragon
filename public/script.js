const socket = io();

let teamsData = { red: { score: 0, members: [], tasks: [] }, blue: { score: 0, members: [], tasks: [] } };

// DOM элементы
const redScoreSpan = document.getElementById('redScore');
const blueScoreSpan = document.getElementById('blueScore');
const redMembersList = document.getElementById('redMembers');
const blueMembersList = document.getElementById('blueMembers');
const redTasksList = document.getElementById('redTasks');
const blueTasksList = document.getElementById('blueTasks');
const resetScoresBtn = document.getElementById('resetScores');
const clearMembersBtn = document.getElementById('clearMembers');
const initChatBtn = document.getElementById('initChatBtn');
const videoIdInput = document.getElementById('videoId');
const apiKeyInput = document.getElementById('apiKey');
const pickPairBtn = document.getElementById('pickPairBtn');
const currentPairDisplay = document.getElementById('currentPairDisplay');
const messagesListDiv = document.getElementById('messagesList');
const endBattleBtn = document.getElementById('endBattleBtn');
const historyList = document.getElementById('historyList');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const winnersList = document.getElementById('winnersList');
const closeWinnerModal = document.getElementById('closeWinnerModal');
const chatStatus = document.getElementById('chatStatus');

function updateUI(data) {
    teamsData = data;
    redScoreSpan.textContent = data.red.score;
    blueScoreSpan.textContent = data.blue.score;
    redMembersList.innerHTML = data.red.members.map(m => `<li>${m}</li>`).join('');
    blueMembersList.innerHTML = data.blue.members.map(m => `<li>${m}</li>`).join('');
    redTasksList.innerHTML = data.red.tasks.map(t => `<li>${t.text} (${new Date(t.timestamp).toLocaleTimeString()})</li>`).join('');
    blueTasksList.innerHTML = data.blue.tasks.map(t => `<li>${t.text} (${new Date(t.timestamp).toLocaleTimeString()})</li>`).join('');
}

socket.on('updateTeams', updateUI);
socket.on('pairsHistory', (history) => {
    historyList.innerHTML = history.map(p => `<li>🔴 ${p.red} vs 🔵 ${p.blue} — ${new Date(p.timestamp).toLocaleTimeString()}</li>`).join('');
});
socket.on('currentPair', (pair) => {
    if (pair) {
        currentPairDisplay.innerHTML = `🎲 Текущая пара: 🔴 ${pair.red}  vs  🔵 ${pair.blue}`;
        messagesListDiv.innerHTML = ''; // очищаем старые сообщения
    } else {
        currentPairDisplay.innerHTML = 'Нет активной пары';
    }
});
socket.on('pairMessage', ({ side, author, text, timestamp }) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    messageDiv.innerHTML = `<span class="message-author">${author}</span>: ${text}`;
    messagesListDiv.appendChild(messageDiv);
    messagesListDiv.scrollTop = messagesListDiv.scrollHeight;
});
socket.on('chatStarted', (msg) => {
    chatStatus.innerHTML = `<span style="color:green;">✅ ${msg}</span>`;
});
socket.on('errorMessage', (msg) => {
    alert(msg);
    chatStatus.innerHTML = `<span style="color:red;">❌ ${msg}</span>`;
});
socket.on('gameOver', ({ winner, members }) => {
    const winnerName = winner === 'red' ? 'Красные' : 'Синие';
    winnerText.innerText = `Победила команда ${winnerName}!`;
    winnersList.innerHTML = members.map(w => `<li>${w}</li>`).join('');
    winnerModal.classList.remove('hidden');
});

closeWinnerModal.addEventListener('click', () => {
    winnerModal.classList.add('hidden');
});

// Начисление очков
document.querySelectorAll('.score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const team = btn.dataset.team;
        const points = parseInt(btn.dataset.points);
        socket.emit('addScore', { team, points });
    });
});

// Задания
document.getElementById('addRedTask').addEventListener('click', () => {
    const task = document.getElementById('redTask').value;
    if (task.trim()) {
        socket.emit('addTask', { team: 'red', task });
        document.getElementById('redTask').value = '';
    }
});
document.getElementById('addBlueTask').addEventListener('click', () => {
    const task = document.getElementById('blueTask').value;
    if (task.trim()) {
        socket.emit('addTask', { team: 'blue', task });
        document.getElementById('blueTask').value = '';
    }
});

// Кнопки управления
resetScoresBtn.addEventListener('click', () => socket.emit('resetScores'));
clearMembersBtn.addEventListener('click', () => {
    if (confirm('Очистить всех участников, историю и сбросить очки?'))
        socket.emit('clearMembers');
});
pickPairBtn.addEventListener('click', () => socket.emit('pickRandomPair'));
endBattleBtn.addEventListener('click', () => socket.emit('endBattle'));

// Инициализация чата YouTube
initChatBtn.addEventListener('click', () => {
    const videoId = videoIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!videoId || !apiKey) {
        alert('Введите ID видео и API ключ YouTube');
        return;
    }
    socket.emit('initChat', { videoId, apiKey });
    chatStatus.innerHTML = '<span>⏳ Подключение...</span>';
});