const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { LiveChat } = require('youtube-chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let teams = {
    red: { name: 'Красные', members: [], score: 0, tasks: [] },
    blue: { name: 'Синие', members: [], score: 0, tasks: [] }
};
let chatClient = null;

function startChatBot(videoId) {
    if (chatClient) {
        chatClient.stop();
        console.log('Предыдущий бот остановлен');
    }

    console.log(`[ДИАГНОСТИКА] Подключаюсь к чату видео: ${videoId}`);
    const chat = new LiveChat({ liveId: videoId });

    chat.on('start', (startedLiveId) => {
        console.log(`✅ Бот успешно подключён к видео: ${startedLiveId}`);
    });

    chat.on('chat', (chatItem) => {
        const author = chatItem.author.name;
        const text = chatItem.message.trim().toLowerCase();
        console.log(`💬 ${author}: ${text}`);

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
    });

    chat.on('error', (err) => {
        console.error(`❌ Ошибка чата:`, err);
    });

    chat.on('end', (reason) => {
        console.log(`🛑 Чат остановлен: ${reason}`);
    });

    chat.start();
    return chat;
}

io.on('connection', (socket) => {
    console.log('Стример подключился');
    socket.emit('updateTeams', teams);

    socket.on('initChat', ({ videoId }) => {
        console.log(`Получена команда запуска для видео: ${videoId}`);
        if (!videoId) {
            socket.emit('errorMessage', 'Введите ID видео');
            return;
        }
        chatClient = startChatBot(videoId);
        socket.emit('chatStarted', 'Бот запущен!');
    });

    socket.on('addScore', ({ team, points }) => {
        if (team === 'red') teams.red.score += points;
        else if (team === 'blue') teams.blue.score += points;
        io.emit('updateTeams', teams);
        console.log(`📊 +${points} команде ${team}`);

        if (teams.red.score >= 100 || teams.blue.score >= 100) {
            const winner = teams.red.score >= 100 ? 'red' : 'blue';
            io.emit('gameOver', { winner, members: teams[winner].members });
            console.log(`🏆 Победила команда ${winner}`);
        }
    });

    socket.on('resetScores', () => {
        teams.red.score = 0;
        teams.blue.score = 0;
        io.emit('updateTeams', teams);
        console.log('🔄 Очки сброшены');
    });

    socket.on('clearMembers', () => {
        teams.red.members = [];
        teams.blue.members = [];
        teams.red.score = 0;
        teams.blue.score = 0;
        teams.red.tasks = [];
        teams.blue.tasks = [];
        io.emit('updateTeams', teams);
        console.log('🧹 Всё очищено');
    });

    socket.on('addTask', ({ team, task }) => {
        const taskObj = { text: task, timestamp: new Date() };
        if (team === 'red') teams.red.tasks.push(taskObj);
        else teams.blue.tasks.push(taskObj);
        io.emit('updateTeams', teams);
        console.log(`📝 Задание для ${team}: ${task}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
