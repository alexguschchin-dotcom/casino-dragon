const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { LiveChat } = require('youtube-chat'); // Убедитесь, что библиотека установлена

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let teams = { red: { name: 'Красные', members: [], score: 0, tasks: [] }, blue: { name: 'Синие', members: [], score: 0, tasks: [] } };
let chatClient = null;

function startChatBot(videoId) {
    if (chatClient) {
        chatClient.stop();
        console.log('Предыдущий бот остановлен');
    }

    console.log(`[ДИАГНОСТИКА] Пытаюсь подключиться к чату видео: ${videoId}`);
    const chat = new LiveChat({ liveId: videoId });

    // Событие успешного запуска
    chat.on('start', (startedLiveId) => {
        console.log(`✅✅✅ Бот УСПЕШНО ЗАПУЩЕН для видео: ${startedLiveId}`);
    });

    // Событие получения сообщения (проверяем оба варианта)
    chat.on('chat', (chatItem) => {
        console.log(`[ДИАГНОСТИКА] Сработало событие 'chat'!`);
        console.log(`[ДИАГНОСТИКА] Данные сообщения:`, JSON.stringify(chatItem, null, 2));
        // ... вся логика обработки ...
    });

    // Событие ошибки
    chat.on('error', (err) => {
        console.error(`❌❌❌ Бот ВЫДАЛ ОШИБКУ:`, err);
    });

    // Событие остановки
    chat.on('end', (reason) => {
        console.log(`🛑 Бот остановлен. Причина: ${reason}`);
    });

    // Запускаем бота
    chat.start().then(success => {
        if (!success) {
            console.error(`❌❌❌ Не удалось запустить бота для видео ${videoId}. Проверьте логи ошибок выше.`);
        }
    });
    return chat;
}

io.on('connection', (socket) => {
    console.log('Стример подключился к панели');
    socket.emit('updateTeams', teams);

    socket.on('initChat', ({ videoId }) => {
        console.log(`[ДИАГНОСТИКА] Получена команда на запуск бота для видео: ${videoId}`);
        if (!videoId) {
            socket.emit('errorMessage', 'Введите ID видео');
            return;
        }
        chatClient = startChatBot(videoId);
        socket.emit('chatStarted', 'Бот запущен!');
    });

    // ... (остальная логика с очками, задачами и т.д. остается без изменений) ...
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
