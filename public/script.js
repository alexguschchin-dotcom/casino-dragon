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
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const winnersList = document.getElementById('winnersList');
const closeWinnerModal = document.getElementById('closeWinnerModal');

// Обновление UI
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
socket.on('gameOver', ({ winner, members }) => {
    const winnerName = winner === 'red' ? 'Красные' : 'Синие';
    winnerText.innerText = `Победила команда ${winnerName}!`;
    // Выбираем 10 случайных участников
    const shuffled = [...members];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, 10);
    winnersList.innerHTML = selected.map(w => `<li>${w}</li>`).join('');
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

// Запись заданий
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

// Сброс очков
resetScoresBtn.addEventListener('click', () => {
    socket.emit('resetScores');
});
clearMembersBtn.addEventListener('click', () => {
    if (confirm('Очистить всех участников и начать новую игру?')) {
        socket.emit('clearMembers');
    }
});

// Инициализация чата YouTube
initChatBtn.addEventListener('click', () => {
    const videoId = videoIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!videoId || !apiKey) {
        alert('Введите ID видео и API ключ YouTube');
        return;
    }
    socket.emit('initChat', { videoId, apiKey });
    alert('Бот чата запущен! Зрители могут писать !красная или !синяя');
});