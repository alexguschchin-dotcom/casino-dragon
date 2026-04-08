const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('public'));

// Данные команд и истории
let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};
let pairsHistory = []; // массив объектов { red: "ник", blue: "ник", timestamp, redMessages: [], blueMessages: [] }
let currentPair = null; // текущая выбранная пара { red, blue }
let chatMonitor = null; // интервал опроса чата
let liveChatId = null;
let youtube = null;
let apiKey = null;
let videoId = null;
let nextPageToken = null;

// --- Функция получения liveChatId по videoId ---
async function getLiveChatId(videoId, key) {
    const service = google.youtube('v3');
    try {
        const response = await service.videos.list({
            key: key,
            part: 'liveStreamingDetails',
            id: videoId
        });
        const details = response.data.items[0]?.liveStreamingDetails;
        if (details && details.activeLiveChatId) {
            return details.activeLiveChatId;
        } else {
            throw new Error('Это видео не является активным прямым эфиром или чат отключён');
        }
    } catch (err) {
        console.error('Ошибка получения liveChatId:', err);
        throw err;
    }
}

// --- Функция опроса чата (один раз в 5 секунд) ---
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

            // Обрабатываем команды !красная и !синяя
            for (const msg of messages) {
                const author = msg.authorDetails.displayName;
                const text = msg.snippet.displayMessage.trim().toLowerCase();
                if (text === '!красная') {
                    if (!teams.red.members.includes(author)) {
                        teams.red.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} вступил в Красную команду`);
                    }
                } else if (text === '!синяя') {
                    if (!teams.blue.members.includes(author)) {
                        teams.blue.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} вступил в Синюю команду`);
                    }
                }

                // Если есть текущая пара – проверяем, сообщения от них ли
                if (currentPair && (author === currentPair.red || author === currentPair.blue)) {
                    const side = author === currentPair.red ? 'red' : 'blue';
                    io.emit('pairMessage', { side, author, text, timestamp: Date.now() });
                    // Сохраняем сообщение в истории текущей пары (для архива)
                    const pairIndex = pairsHistory.findIndex(p => p.red === currentPair.red && p.blue === currentPair.blue);
                    if (pairIndex !== -1) {
                        if (side === 'red') pairsHistory[pairIndex].redMessages.push({ author, text, timestamp: Date.now() });
                        else pairsHistory[pairIndex].blueMessages.push({ author, text, timestamp: Date.now() });
                    }
                }
            }
        } catch (err) {
            console.error('Ошибка при получении сообщений чата:', err);
            // Если ошибка 403 quotaExceeded – можно уведомить стримера
            if (err.response?.status === 403) {
                io.emit('errorMessage', 'Превышена квота API. Попробуйте позже или увеличьте интервал опроса.');
                clearInterval(chatMonitor);
                chatMonitor = null;
            }
        }
    }, 5000); // опрос каждые 5 секунд
}

// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);
    socket.emit('pairsHistory', pairsHistory);
    if (currentPair) socket.emit('currentPair', currentPair);

    // Инициализация чата (получаем videoId и apiKey)
    socket.on('initChat', async ({ videoId: vid, apiKey: key }) => {
        if (!vid || !key) {
            socket.emit('errorMessage', 'Введите ID видео и API-ключ');
            return;
        }
        videoId = vid;
        apiKey = key;
        try {
            liveChatId = await getLiveChatId(videoId, apiKey);
            console.log(`✅ Подключен к чату, liveChatId: ${liveChatId}`);
            startChatMonitoring(io, liveChatId, apiKey);
            socket.emit('chatStarted', 'Бот успешно подключён к чату! Команды: !красная, !синяя');
        } catch (err) {
            console.error(err);
            socket.emit('errorMessage', `Ошибка: ${err.message}`);
        }
    });

    // Выбор случайной пары
    socket.on('pickRandomPair', () => {
        const redMembers = teams.red.members;
        const blueMembers = teams.blue.members;
        if (redMembers.length === 0 || blueMembers.length === 0) {
            socket.emit('errorMessage', 'В обеих командах должны быть участники!');
            return;
        }
        const randomRed = redMembers[Math.floor(Math.random() * redMembers.length)];
        const randomBlue = blueMembers[Math.floor(Math.random() * blueMembers.length)];
        currentPair = { red: randomRed, blue: randomBlue, timestamp: Date.now() };
        // Добавляем в историю
        pairsHistory.push({
            red: randomRed,
            blue: randomBlue,
            timestamp: Date.now(),
            redMessages: [],
            blueMessages: []
        });
        io.emit('currentPair', currentPair);
        io.emit('pairsHistory', pairsHistory);
        console.log(`🎲 Выбрана пара: ${randomRed} (красные) vs ${randomBlue} (синие)`);
    });

    // Начисление очков команде
    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);
        console.log(`📊 +${points} команде ${team}`);

        // Проверка победы (если нужно автоматическое окончание при 100 очках)
        if (teams.red.score >= 100 || teams.blue.score >= 100) {
            const winner = teams.red.score >= 100 ? 'red' : 'blue';
            // Не вызываем gameOver автоматически, пусть стример сам завершит битву кнопкой
        }
    });

    // Сброс очков
    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
    });

    // Полная очистка (участники, очки, история)
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

    // Завершение битвы – выбрать 10 случайных участников из команды-победителя
    socket.on('endBattle', () => {
        let winnerTeam = null;
        if (teams.red.score > teams.blue.score) winnerTeam = 'red';
        else if (teams.blue.score > teams.red.score) winnerTeam = 'blue';
        else {
            // Ничья – случайный выбор
            winnerTeam = Math.random() < 0.5 ? 'red' : 'blue';
        }
        const winnerMembers = [...teams[winnerTeam].members];
        if (winnerMembers.length === 0) {
            socket.emit('errorMessage', 'В победившей команде нет участников');
            return;
        }
        // Перемешиваем и берём первых 10 (или меньше, если их меньше 10)
        const shuffled = winnerMembers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        io.emit('gameOver', { winner: winnerTeam, members: selected });
        console.log(`🏆 Битва завершена, победитель: ${winnerTeam}, выбрано ${selected.length} человек`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
