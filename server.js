const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { google } = require('googleapis');
const { LiveChat } = require('youtube-live-chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Хранилище команд
let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};

// ID видео (стрима) – стример вводит в панели
let videoId = null;
let chatClient = null;

// Функция запуска бота для чата
function startChatBot(videoId, apiKey) {
    if (chatClient) chatClient.stop();
    const chat = new LiveChat({
        channelId: videoId,
        apiKey: apiKey,
        interval: 5000 // проверка каждые 5 секунд
    });
    chat.on('message', (msg) => {
        const author = msg.author.name;
        const text = msg.message;
        const command = text.toLowerCase().trim();
        if (command === '!красная') {
            if (!teams.red.members.includes(author)) {
                teams.red.members.push(author);
                io.emit('updateTeams', teams);
            }
        } else if (command === '!синяя') {
            if (!teams.blue.members.includes(author)) {
                teams.blue.members.push(author);
                io.emit('updateTeams', teams);
            }
        }
    });
    chat.start();
    return chat;
}

io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);

    // Получение настроек от стримера (videoId и API key)
    socket.on('initChat', ({ videoId: vid, apiKey }) => {
        videoId = vid;
        chatClient = startChatBot(videoId, apiKey);
    });

    // Начисление очков команде
    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);
        // Проверка победы
        if (teams.red.score >= 100 || teams.blue.score >= 100) {
            const winner = teams.red.score >= 100 ? 'red' : 'blue';
            io.emit('gameOver', { winner, members: teams[winner].members });
        }
    });

    // Сброс очков
    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
    });

    // Очистка участников (если нужно начать новую игру)
    socket.on('clearMembers', () => {
        teams.red.members = [];
        teams.blue.members = [];
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
    });

    // Добавление задания (просто сохраняем в лог)
    socket.on('addTask', ({ team, task }) => {
        const taskObj = { text: task, timestamp: new Date() };
        if (team === 'red') teams.red.tasks.push(taskObj);
        else teams.blue.tasks.push(taskObj);
        io.emit('updateTeams', teams);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
