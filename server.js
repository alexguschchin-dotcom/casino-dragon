const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('public'));

let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};
let pairsHistory = [];        // все сыгранные пары
let currentPair = null;       // { red, blue }
let chatMonitor = null;
let liveChatId = null;
let apiKey = null;
let videoId = null;
let nextPageToken = null;

// Получение liveChatId по videoId
async function getLiveChatId(videoId, key) {
    const service = google.youtube('v3');
    const response = await service.videos.list({
        key: key,
        part: 'liveStreamingDetails',
        id: videoId
    });
    const details = response.data.items[0]?.liveStreamingDetails;
    if (details && details.activeLiveChatId) {
        return details.activeLiveChatId;
    } else {
        throw new Error('Видео не является активным прямым эфиром или чат отключён');
    }
}

// Мониторинг чата (каждые 5 секунд)
function startChatMonitoring(io, liveChatId, apiKey) {
    if (chatMonitor) clearInterval(chatMonitor);
    nextPageToken = null;
    chatMonitor = setInterval(async () => {
        if (!liveChatId || !apiKey) return;
        try {
            const service = google.youtube('v3');
            const response = await service.liveChatMessages.list({
                key: apiKey,
                liveChatId: liveChatId,
                part: 'snippet,authorDetails',
                pageToken: nextPageToken || undefined,
                maxResults: 200
            });
            const messages = response.data.items || [];
            nextPageToken = response.data.nextPageToken || null;

            for (const msg of messages) {
                const author = msg.authorDetails.displayName;
                const text = msg.snippet.displayMessage.trim().toLowerCase();

                // Обработка команд
                if (text === '!красная') {
                    if (!teams.red.members.includes(author)) {
                        teams.red.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} -> Красные`);
                    }
                } else if (text === '!синяя') {
                    if (!teams.blue.members.includes(author)) {
                        teams.blue.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} -> Синие`);
                    }
                }

                // Если есть текущая пара и сообщение от одного из них
                if (currentPair && (author === currentPair.red || author === currentPair.blue)) {
                    const side = author === currentPair.red ? 'red' : 'blue';
                    io.emit('pairMessage', { side, author, text, timestamp: Date.now() });
                    // сохраняем в историю этой пары
                    const pairIndex = pairsHistory.findIndex(p => p.red === currentPair.red && p.blue === currentPair.blue);
                    if (pairIndex !== -1) {
                        if (side === 'red') pairsHistory[pairIndex].redMessages.push({ author, text, timestamp: Date.now() });
                        else pairsHistory[pairIndex].blueMessages.push({ author, text, timestamp: Date.now() });
                    }
                }
            }
        } catch (err) {
            console.error('Ошибка чата:', err);
            if (err.response?.status === 403) {
                io.emit('errorMessage', 'Превышена квота API. Увеличьте интервал опроса или подождите до завтра.');
                clearInterval(chatMonitor);
                chatMonitor = null;
            }
        }
    }, 5000);
}

// Автоматическое завершение битвы при 100 очках
function checkWinAndFinish() {
    if (teams.red.score >= 100 || teams.blue.score >= 100) {
        const winner = teams.red.score >= 100 ? 'red' : 'blue';
        const winnerMembers = [...teams[winner].members];
        if (winnerMembers.length === 0) return;
        const shuffled = winnerMembers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        io.emit('gameOver', { winner, members: selected });
        console.log(`🏆 АВТОМАТИЧЕСКАЯ ПОБЕДА команды ${winner}, выбрано ${selected.length} победителей`);
        // Опционально: остановить дальнейшие начисления? Можно оставить как есть.
    }
}

io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);
    socket.emit('pairsHistory', pairsHistory);
    if (currentPair) socket.emit('currentPair', currentPair);

    // Инициализация чата
    socket.on('initChat', async ({ videoId: vid, apiKey: key }) => {
        if (!vid || !key) {
            socket.emit('errorMessage', 'Введите ID видео и API-ключ');
            return;
        }
        videoId = vid;
        apiKey = key;
        try {
            liveChatId = await getLiveChatId(videoId, apiKey);
            console.log(`✅ Чат подключён, liveChatId: ${liveChatId}`);
            startChatMonitoring(io, liveChatId, apiKey);
            socket.emit('chatStarted', 'Бот успешно подключён! Команды: !красная, !синяя');
        } catch (err) {
            console.error(err);
            socket.emit('errorMessage', `Ошибка: ${err.message}`);
        }
    });

    // Выбор случайной пары
    socket.on('pickRandomPair', () => {
        if (teams.red.members.length === 0 || teams.blue.members.length === 0) {
            socket.emit('errorMessage', 'В обеих командах должны быть участники');
            return;
        }
        const randomRed = teams.red.members[Math.floor(Math.random() * teams.red.members.length)];
        const randomBlue = teams.blue.members[Math.floor(Math.random() * teams.blue.members.length)];
        currentPair = { red: randomRed, blue: randomBlue, timestamp: Date.now() };
        pairsHistory.push({
            red: randomRed,
            blue: randomBlue,
            timestamp: Date.now(),
            redMessages: [],
            blueMessages: []
        });
        io.emit('currentPair', currentPair);
        io.emit('pairsHistory', pairsHistory);
        console.log(`🎲 Новая пара: ${randomRed} (красный) vs ${randomBlue} (синий)`);
    });

    // Начисление очков
    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);
        console.log(`📊 +${points} команде ${team}`);
        checkWinAndFinish(); // автоматическая проверка победы
    });

    // Сброс очков
    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
    });

    // Полная очистка (участники, очки, история, текущая пара)
    socket.on('clearMembers', () => {
        teams.red.members = [];
        teams.blue.members = [];
        teams.red.score = 0;
        teams.blue.score = 0;
        teams.red.tasks = [];
        teams.blue.tasks = [];
        pairsHistory = [];
        currentPair = null;
        io.emit('updateTeams', teams);
        io.emit('pairsHistory', pairsHistory);
        io.emit('currentPair', null);
    });

    // Добавление задания (опционально)
    socket.on('addTask', ({ team, task }) => {
        const taskObj = { text: task, timestamp: new Date() };
        if (team === 'red') teams.red.tasks.push(taskObj);
        else teams.blue.tasks.push(taskObj);
        io.emit('updateTeams', teams);
    });

    // Ручное завершение битвы
    socket.on('endBattle', () => {
        let winnerTeam = null;
        if (teams.red.score > teams.blue.score) winnerTeam = 'red';
        else if (teams.blue.score > teams.red.score) winnerTeam = 'blue';
        else winnerTeam = Math.random() < 0.5 ? 'red' : 'blue';
        const winnerMembers = [...teams[winnerTeam].members];
        if (winnerMembers.length === 0) {
            socket.emit('errorMessage', 'В победившей команде нет участников');
            return;
        }
        const shuffled = winnerMembers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        io.emit('gameOver', { winner: winnerTeam, members: selected });
        console.log(`🏆 Ручное завершение: победитель ${winnerTeam}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
