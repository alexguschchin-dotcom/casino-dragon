const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { google } = require('googleapis');
const { KickConnection, Events } = require('kick-live-connector');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('public'));

let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};
let pairsHistory = [];
let currentPair = null;
let chatMonitor = null;
let liveChatId = null;
let apiKey = null;
let videoId = null;
let nextPageToken = null;

// --- Переменные для Kick ---
let kickConnection = null;
let kickUsername = null;

// --- Функция для проверки и завершения игры при 100 очках ---
function checkWinAndFinish() {
    // Проверяем, не завершена ли игра уже, чтобы не спамить событие
    if (global.gameFinished) return;
    
    if (teams.red.score >= 100 || teams.blue.score >= 100) {
        global.gameFinished = true; // Ставим флаг, чтобы не вызывать несколько раз
        const winner = teams.red.score >= 100 ? 'red' : 'blue';
        const winnerMembers = [...teams[winner].members];
        if (winnerMembers.length === 0) return;
        const shuffled = winnerMembers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        io.emit('gameOver', { winner, members: selected });
        console.log(`🏆 АВТОМАТИЧЕСКАЯ ПОБЕДА команды ${winner}`);
    }
}

// --- YouTube функции (без изменений) ---
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

                if (text === '!красная') {
                    if (!teams.red.members.includes(author) && !teams.blue.members.includes(author)) {
                        teams.red.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} -> Красные`);
                    }
                } else if (text === '!синяя') {
                    if (!teams.blue.members.includes(author) && !teams.red.members.includes(author)) {
                        teams.blue.members.push(author);
                        io.emit('updateTeams', teams);
                        console.log(`➕ ${author} -> Синие`);
                    }
                }

                if (currentPair && (author === currentPair.red || author === currentPair.blue)) {
                    const side = author === currentPair.red ? 'red' : 'blue';
                    io.emit('pairMessage', { side, author, text, timestamp: Date.now() });
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

// --- Kick функции ---
function startKickChat(username) {
    if (kickConnection) {
        kickConnection.disconnect();
        console.log('Предыдущее подключение к Kick остановлено');
    }

    console.log(`[KICK] Подключаюсь к чату ${username}`);
    const connection = new KickConnection(username);
    
    connection.connect().then((status) => {
        console.log(`✅ Kick бот успешно подключён к комнате ${status.roomID}`);
        io.emit('kickChatStarted', `Kick бот запущен для канала ${username}!`);
    }).catch((error) => {
        console.error("❌ Ошибка подключения к Kick:", error);
        io.emit('errorMessage', `Ошибка подключения к Kick: ${error.message}`);
    });

    connection.on(Events.ChatMessage, (data) => {
        const author = data.sender.username;
        const text = data.content.trim().toLowerCase();

        if (text === '!красная') {
            if (!teams.red.members.includes(author) && !teams.blue.members.includes(author)) {
                teams.red.members.push(author);
                io.emit('updateTeams', teams);
                console.log(`[KICK] ➕ ${author} -> Красные`);
            }
        } else if (text === '!синяя') {
            if (!teams.blue.members.includes(author) && !teams.red.members.includes(author)) {
                teams.blue.members.push(author);
                io.emit('updateTeams', teams);
                console.log(`[KICK] ➕ ${author} -> Синие`);
            }
        }

        if (currentPair && (author === currentPair.red || author === currentPair.blue)) {
            const side = author === currentPair.red ? 'red' : 'blue';
            io.emit('pairMessage', { side, author, text, timestamp: Date.now() });
            const pairIndex = pairsHistory.findIndex(p => p.red === currentPair.red && p.blue === currentPair.blue);
            if (pairIndex !== -1) {
                if (side === 'red') pairsHistory[pairIndex].redMessages.push({ author, text, timestamp: Date.now() });
                else pairsHistory[pairIndex].blueMessages.push({ author, text, timestamp: Date.now() });
            }
        }
    });

    connection.on(Events.Error, (err) => {
        console.error(`[KICK] Ошибка:`, err);
        io.emit('errorMessage', `Ошибка Kick: ${err.message}`);
    });

    connection.on(Events.Disconnected, () => {
        console.log(`[KICK] Отключён от чата`);
        io.emit('errorMessage', `Kick бот отключился. Попробуйте переподключиться.`);
    });

    kickConnection = connection;
    return connection;
}

// --- Socket.IO обработчики ---
io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);
    socket.emit('pairsHistory', pairsHistory);
    if (currentPair) socket.emit('currentPair', currentPair);

    // Инициализация YouTube
    socket.on('initChat', async ({ videoId: vid, apiKey: key }) => {
        if (!vid || !key) {
            socket.emit('errorMessage', 'Введите ID видео и API-ключ');
            return;
        }
        videoId = vid;
        apiKey = key;
        try {
            liveChatId = await getLiveChatId(videoId, apiKey);
            console.log(`✅ YouTube чат подключён, liveChatId: ${liveChatId}`);
            startChatMonitoring(io, liveChatId, apiKey);
            socket.emit('chatStarted', 'YouTube бот успешно подключён! Команды: !красная, !синяя');
        } catch (err) {
            console.error(err);
            socket.emit('errorMessage', `Ошибка YouTube: ${err.message}`);
        }
    });

    // Инициализация Kick
    socket.on('initKickChat', ({ username }) => {
        if (!username) {
            socket.emit('errorMessage', 'Введите имя пользователя Kick');
            return;
        }
        kickUsername = username;
        startKickChat(kickUsername);
    });

    // --- Остальные события (addScore, pickRandomPair и т.д.) ---
    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);
        console.log(`📊 +${points} команде ${team}`);
        checkWinAndFinish(); // Вызываем проверку после начисления очков
    });

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

    socket.on('rerollRed', () => {
        if (!currentPair) {
            socket.emit('errorMessage', 'Нет активной пары');
            return;
        }
        const currentRed = currentPair.red;
        const available = teams.red.members.filter(m => m !== currentRed);
        if (available.length === 0) {
            socket.emit('errorMessage', 'Нет других красных участников для замены');
            return;
        }
        const newRed = available[Math.floor(Math.random() * available.length)];
        currentPair.red = newRed;
        const lastPair = pairsHistory[pairsHistory.length - 1];
        if (lastPair && lastPair.red === currentRed && lastPair.blue === currentPair.blue) {
            lastPair.red = newRed;
        }
        io.emit('currentPair', currentPair);
        io.emit('pairsHistory', pairsHistory);
        console.log(`🔄 Красный заменён: ${currentRed} -> ${newRed}`);
    });

    socket.on('rerollBlue', () => {
        if (!currentPair) {
            socket.emit('errorMessage', 'Нет активной пары');
            return;
        }
        const currentBlue = currentPair.blue;
        const available = teams.blue.members.filter(m => m !== currentBlue);
        if (available.length === 0) {
            socket.emit('errorMessage', 'Нет других синих участников для замены');
            return;
        }
        const newBlue = available[Math.floor(Math.random() * available.length)];
        currentPair.blue = newBlue;
        const lastPair = pairsHistory[pairsHistory.length - 1];
        if (lastPair && lastPair.red === currentPair.red && lastPair.blue === currentBlue) {
            lastPair.blue = newBlue;
        }
        io.emit('currentPair', currentPair);
        io.emit('pairsHistory', pairsHistory);
        console.log(`🔄 Синий заменён: ${currentBlue} -> ${newBlue}`);
    });

    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
        global.gameFinished = false; // Сбрасываем флаг игры
    });

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
        global.gameFinished = false; // Сбрасываем флаг игры
    });

    socket.on('addTask', ({ team, task }) => {
        const taskObj = { text: task, timestamp: new Date() };
        if (team === 'red') teams.red.tasks.push(taskObj);
        else teams.blue.tasks.push(taskObj);
        io.emit('updateTeams', teams);
    });

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
        global.gameFinished = true; // Завершаем игру
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
