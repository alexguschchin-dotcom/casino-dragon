const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { LiveChat } = require('youtube-chat'); // новая библиотека

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Данные команд
let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};

let chatClient = null;

// Функция запуска бота для чата (теперь только videoId)
function startChatBot(videoId) {
    if (chatClient) {
        chatClient.stop();
        console.log('Предыдущий бот остановлен');
    }

    console.log(`Подключаюсь к чату видео: ${videoId}`);
    const chat = new LiveChat({ liveId: videoId });

    chat.on('ready', () => {
        console.log(`✅ Бот успешно подключён к чату ${videoId}`);
    });

    chat.on('message', (msg) => {
        const author = msg.author.name;
        const text = msg.message.trim().toLowerCase();

        if (text === '!красная') {
            if (!teams.red.members.includes(author)) {
                teams.red.members.push(author);
                io.emit('updateTeams', teams);
                console.log(`➕ ${author} в Красной команде`);
            }
        } else if (text === '!синяя') {
            if (!teams.blue.members.includes(author)) {
                teams.blue.members.push(author);
                io.emit('updateTeams', teams);
                console.log(`➕ ${author} в Синей команде`);
            }
        }
    });

    chat.on('error', (err) => {
        console.error('Ошибка чата:', err.message);
    });

    chat.start();
    return chat;
}

io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);

    // Инициализация чата (теперь только videoId)
    socket.on('initChat', ({ videoId }) => {
        if (!videoId) {
            socket.emit('errorMessage', 'Введите ID видео');
            return;
        }
        chatClient = startChatBot(videoId);
        socket.emit('chatStarted', 'Бот запущен!');
    });

    // Начисление очков
    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);

        if (teams.red.score >= 100 || teams.blue.score >= 100) {
            const winner = teams.red.score >= 100 ? 'red' : 'blue';
            io.emit('gameOver', { winner, members: teams[winner].members });
        }
    });

    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
    });

    socket.on('clearMembers', () => {
        teams.red.members = [];
        teams.blue.members = [];
        teams.red.score = 0;
        teams.blue.score = 0;
        teams.red.tasks = [];
        teams.blue.tasks = [];
        io.emit('updateTeams', teams);
    });

    socket.on('addTask', ({ team, task }) => {
        const taskObj = { text: task, timestamp: new Date() };
        if (team === 'red') teams.red.tasks.push(taskObj);
        else teams.blue.tasks.push(taskObj);
        io.emit('updateTeams', teams);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
