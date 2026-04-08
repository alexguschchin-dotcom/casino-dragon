const socket = io();

let teamsData = { red: { score: 0, members: [], tasks: [] }, blue: { score: 0, members: [], tasks: [] } };
let redFilter = '';
let blueFilter = '';

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
const initKickChatBtn = document.getElementById('initKickChatBtn');
const videoIdInput = document.getElementById('videoId');
const apiKeyInput = document.getElementById('apiKey');
const kickUsernameInput = document.getElementById('kickUsername');
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
const kickStatus = document.getElementById('kickStatus');

// Добавление поисковых полей
const addSearchBoxes = () => {
    const redMembersContainer = document.querySelector('.red .members');
    const blueMembersContainer = document.querySelector('.blue .members');
    if (!document.getElementById('redSearch')) {
        const redSearch = document.createElement('input');
        redSearch.id = 'redSearch';
        redSearch.placeholder = '🔍 Поиск по красным...';
        redSearch.style.width = '100%';
        redSearch.style.marginBottom = '10px';
        redSearch.style.padding = '5px';
        redSearch.style.borderRadius = '20px';
        redSearch.style.border = '1px solid #f9a825';
        redSearch.style.background = 'rgba(255,255,255,0.1)';
        redSearch.style.color = '#fff';
        redSearch.addEventListener('input', (e) => {
            redFilter = e.target.value.toLowerCase();
            renderMembers('red');
        });
        redMembersContainer.insertBefore(redSearch, redMembersContainer.firstChild);
    }
    if (!document.getElementById('blueSearch')) {
        const blueSearch = document.createElement('input');
        blueSearch.id = 'blueSearch';
        blueSearch.placeholder = '🔍 Поиск по синим...';
        blueSearch.style.width = '100%';
        blueSearch.style.marginBottom = '10px';
        blueSearch.style.padding = '5px';
        blueSearch.style.borderRadius = '20px';
        blueSearch.style.border = '1px solid #f9a825';
        blueSearch.style.background = 'rgba(255,255,255,0.1)';
        blueSearch.style.color = '#fff';
        blueSearch.addEventListener('input', (e) => {
            blueFilter = e.target.value.toLowerCase();
            renderMembers('blue');
        });
        blueMembersContainer.insertBefore(blueSearch, blueMembersContainer.firstChild);
    }
};

function renderMembers(team) {
    const members = team === 'red' ? teamsData.red.members : teamsData.blue.members;
    const filter = team === 'red' ? redFilter : blueFilter;
    let filtered = members;
    if (filter) {
        filtered = members.filter(m => m.toLowerCase().includes(filter));
    }
    const listEl = team === 'red' ? redMembersList : blueMembersList;
    if (filter) {
        listEl.innerHTML = filtered.map(m => `<li>${m}</li>`).join('');
    } else {
        const last10 = filtered.slice(-10);
        listEl.innerHTML = last10.map(m => `<li>${m}</li>`).join('');
        if (filtered.length > 10) {
            const extra = document.createElement('li');
            extra.style.fontStyle = 'italic';
            extra.style.color = '#aaa';
            extra.innerText = `... и ещё ${filtered.length - 10} участников. Используйте поиск.`;
            listEl.appendChild(extra);
        }
    }
}

function updateUI(data) {
    teamsData = data;
    redScoreSpan.textContent = data.red.score;
    blueScoreSpan.textContent = data.blue.score;
    renderMembers('red');
    renderMembers('blue');
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
        messagesListDiv.innerHTML = '';
    } else {
        currentPairDisplay.innerHTML = 'Нет активной пары';
    }
});
socket.on('pairMessage', ({ side, author, text }) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    messageDiv.innerHTML = `<span class="message-author">${author}</span>: ${text}`;
    messagesListDiv.appendChild(messageDiv);
    messagesListDiv.scrollTop = messagesListDiv.scrollHeight;
});
socket.on('chatStarted', (msg) => {
    chatStatus.innerHTML = `<span style="color:green;">✅ ${msg}</span>`;
});
socket.on('kickChatStarted', (msg) => {
    kickStatus.innerHTML = `<span style="color:green;">✅ ${msg}</span>`;
});
socket.on('errorMessage', (msg) => {
    alert(msg);
    if (chatStatus) chatStatus.innerHTML = `<span style="color:red;">❌ ${msg}</span>`;
    if (kickStatus) kickStatus.innerHTML = `<span style="color:red;">❌ ${msg}</span>`;
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

// Кнопки управления
document.querySelectorAll('.score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const team = btn.dataset.team;
        const points = parseInt(btn.dataset.points);
        socket.emit('addScore', { team, points });
    });
});

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

resetScoresBtn.addEventListener('click', () => socket.emit('resetScores'));
clearMembersBtn.addEventListener('click', () => {
    if (confirm('Очистить всех участников, историю и сбросить очки?'))
        socket.emit('clearMembers');
});
pickPairBtn.addEventListener('click', () => socket.emit('pickRandomPair'));
endBattleBtn.addEventListener('click', () => socket.emit('endBattle'));

// Кнопки перевыбора
document.getElementById('rerollRedBtn').addEventListener('click', () => socket.emit('rerollRed'));
document.getElementById('rerollBlueBtn').addEventListener('click', () => socket.emit('rerollBlue'));

// Инициализация YouTube
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

// Инициализация Kick
initKickChatBtn.addEventListener('click', () => {
    const username = kickUsernameInput.value.trim();
    if (!username) {
        alert('Введите имя пользователя Kick');
        return;
    }
    socket.emit('initKickChat', { username });
    kickStatus.innerHTML = '<span>⏳ Подключение...</span>';
});

document.addEventListener('DOMContentLoaded', addSearchBoxes);