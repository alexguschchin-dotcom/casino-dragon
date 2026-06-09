// ========== ЛЕТНЯЯ ВИКТОРИНА "Солнце, фрукты, удача!" ==========

// Темы и вопросы (5 тем, по 5 вопросов)
const themesData = {
    beach: {
        name: 'Пляж и море',
        icon: 'fas fa-umbrella-beach',
        questions: [
            { value: 1, text: 'Как называется самый известный пляж в Рио-де-Жанейро?', options: ['Копакабана', 'Ипанема', 'Байя', 'Флорипа'], correct: 0, casinoTask: 'Сделайте 20 спинов по 20$ в слоте "Beach Life"' },
            { value: 2, text: 'Какой океан омывает пляжи Майами?', options: ['Тихий', 'Атлантический', 'Индийский', 'Северный Ледовитый'], correct: 1, casinoTask: 'Поставьте 100$ на красное в рулетке' },
            { value: 3, text: 'Где находится пляж "Белые пески"?', options: ['Мальдивы', 'Багамы', 'Сейшелы', 'Таиланд'], correct: 1, casinoTask: 'Купите бонус за 500$ в слоте с пальмами' },
            { value: 4, text: 'Как называется традиционная гавайская рубашка?', options: ['Алоха', 'Гавайка', 'Оана', 'Мауи'], correct: 0, casinoTask: 'Сделайте 50 спинов по 10$ в слоте "Tiki Fiesta"' },
            { value: 5, text: 'Самый популярный пляжный волейбольный турнир?', options: ['World Tour', 'Beach Pro', 'King of the Beach', 'FIVB'], correct: 0, casinoTask: 'Выиграйте 3 раунда в покере подряд' }
        ]
    },
    fruits: {
        name: 'Фрукты и ягоды',
        icon: 'fas fa-apple-alt',
        questions: [
            { value: 1, text: 'Какой фрукт изображён на логотипе Apple?', options: ['Груша', 'Апельсин', 'Яблоко', 'Банан'], correct: 2, casinoTask: 'Сделайте ставку на число 7 в рулетке' },
            { value: 2, text: 'Родина кокоса – это...', options: ['Филиппины', 'Таиланд', 'Индонезия', 'Малайзия'], correct: 2, casinoTask: 'Купите бонус в слоте "Fruity Party" за 300$' },
            { value: 3, text: 'Какой фрукт называют "королём фруктов" в Юго-Восточной Азии?', options: ['Манго', 'Дуриан', 'Папайя', 'Мангустин'], correct: 1, casinoTask: 'Сделайте 40 спинов по 25$ в слоте "Durian King"' },
            { value: 4, text: 'Какая ягода символизирует лето в России?', options: ['Клубника', 'Малина', 'Черника', 'Арбуз'], correct: 0, casinoTask: 'Поставьте 200$ на красное в рулетке' },
            { value: 5, text: 'Какой слот от Pragmatic Play посвящён фруктам?', options: ['Sweet Bonanza', 'Gates of Olympus', 'The Dog House', 'Big Bass Bonanza'], correct: 0, casinoTask: 'Купите бонус в Sweet Bonanza за 1000$' }
        ]
    },
    travel: {
        name: 'Путешествия и география',
        icon: 'fas fa-globe-americas',
        questions: [
            { value: 1, text: 'Столица Таиланда?', options: ['Пхукет', 'Чиангмай', 'Бангкок', 'Патайя'], correct: 2, casinoTask: 'Сделайте 100 спинов по 10$ в слоте "Thai Paradise"' },
            { value: 2, text: 'Какой водопад считается самым высоким в мире?', options: ['Ниагара', 'Анхель', 'Виктория', 'Игуасу'], correct: 1, casinoTask: 'Поставьте 500$ на зеро в рулетке' },
            { value: 3, text: 'Какая страна славится своими каналами и гондолами?', options: ['Франция', 'Италия', 'Нидерланды', 'Греция'], correct: 1, casinoTask: 'Купите бонус за 700$ в слоте "Venice Dream"' },
            { value: 4, text: 'Самый посещаемый город мира в 2023 году?', options: ['Париж', 'Лондон', 'Бангкок', 'Дубай'], correct: 2, casinoTask: 'Сделайте 150 спинов по 5$' },
            { value: 5, text: 'Где находится озеро Байкал?', options: ['Казахстан', 'Монголия', 'Россия', 'Китай'], correct: 2, casinoTask: 'Выиграйте 5 рук в блэкджеке подряд' }
        ]
    },
    summerMedia: {
        name: 'Летнее кино и музыка',
        icon: 'fas fa-film',
        questions: [
            { value: 1, text: 'Какой фильм с Леонардо Ди Каприо происходит на острове?', options: ['Пляж', 'Остров проклятых', 'Титаник', 'Начало'], correct: 0, casinoTask: 'Сделайте ставку 300$ на чёрное' },
            { value: 2, text: 'Летний хит 2023 года – "Flowers" исполняет...', options: ['Beyoncé', 'Miley Cyrus', 'Taylor Swift', 'Dua Lipa'], correct: 1, casinoTask: 'Купите бонус в слоте "Pop Star"' },
            { value: 3, text: 'Какой музыкальный фестиваль проходит в Калифорнии ежегодно?', options: ['Coachella', 'Lollapalooza', 'Woodstock', 'Tomorrowland'], correct: 0, casinoTask: 'Сделайте 60 спинов по 20$' },
            { value: 4, text: 'Кто исполнил песню "Summertime Sadness"?', options: ['Lady Gaga', 'Lana Del Rey', 'Rihanna', 'Katy Perry'], correct: 1, casinoTask: 'Поставьте на число 13 в рулетке' },
            { value: 5, text: 'Фильм "Достучаться до небес" о чём?', options: ['Путешествие', 'Любовь', 'Поиски счастья', 'Смерть'], correct: 0, casinoTask: 'Выиграйте джекпот в любом слоте' }
        ]
    },
    casinoSummer: {
        name: 'Казино: летний кураж',
        icon: 'fas fa-dice',
        questions: [
            { value: 1, text: 'Какой слот наиболее популярен летом?', options: ['Starburst', 'Sweet Bonanza', 'Gonzo\'s Quest', 'Book of Dead'], correct: 1, casinoTask: 'Купите бонус в Sweet Bonanza за 500$' },
            { value: 2, text: 'Что означает RTP?', options: ['Return to Player', 'Real Time Play', 'Random Table Payout', 'Реальный шанс выигрыша'], correct: 0, casinoTask: 'Сделайте 30 спинов по 50$' },
            { value: 3, text: 'Сколько чисел в европейской рулетке?', options: ['36', '37', '38', '39'], correct: 1, casinoTask: 'Сделайте ставку на 0 в рулетке' },
            { value: 4, text: 'В какой карточной игре можно удвоить ставку?', options: ['Блэкджек', 'Покер', 'Баккара', 'Дурак'], correct: 0, casinoTask: 'Выиграйте 2 раунда в блэкджеке подряд' },
            { value: 5, text: 'Какой символ в слотах запускает бонусную игру?', options: ['Wild', 'Scatter', 'Bonus', 'Multiplier'], correct: 1, casinoTask: 'Поймайте 3 Scatter в любом слоте' }
        ]
    }
};

// Игроки
const players = [
    { id: 'alex', name: 'Алексей', icon: 'fas fa-user-astronaut', score: 0 },
    { id: 'vika', name: 'Вика', icon: 'fas fa-user-ninja', score: 0 },
    { id: 'batya', name: 'Батя', icon: 'fas fa-user-tie', score: 0 }
];

let currentScore = 0;
let selectedTheme = null;
let selectedQuestion = null;
let waitingForViewer = false;
let viewerName = '';
let isChatHelpUsed = false;
let answeredQuestions = {};

// DOM элементы
const themeGrid = document.getElementById('themes-grid');
const themeModal = document.getElementById('theme-modal');
const questionModal = document.getElementById('question-modal');
const viewerModal = document.getElementById('viewer-modal');
const resultModal = document.getElementById('result-modal');
const balanceModal = document.getElementById('balance-modal');
const congratsModal = document.getElementById('congrats-modal');
const rulesModal = document.getElementById('rules-modal');

const themeNameSpan = document.getElementById('theme-name');
const questionsGrid = document.getElementById('questions-grid');
const questionCategory = document.getElementById('question-category');
const questionValueSpan = document.getElementById('question-value');
const questionTextEl = document.getElementById('question-text');
const optionsArea = document.getElementById('options-area');
const helpChat = document.getElementById('help-chat');
const helpVika = document.getElementById('help-vika');
const helpBatya = document.getElementById('help-batya');
const helpAlex = document.getElementById('help-alex');
const feedbackDiv = document.getElementById('feedback');
const viewerNameInput = document.getElementById('viewer-name');
const confirmViewer = document.getElementById('confirm-viewer');
const cancelViewer = document.getElementById('cancel-viewer');
const closeThemeModal = document.getElementById('close-theme-modal');
const closeQuestionModal = document.getElementById('close-question-modal');
const closeResultBtn = document.getElementById('close-result');
const totalScoreSpan = document.getElementById('total-score');
const editBalanceBtn = document.getElementById('edit-balance');
const saveBalanceBtn = document.getElementById('save-balance');
const cancelBalanceBtn = document.getElementById('cancel-balance');
const newBalanceInput = document.getElementById('new-balance');
const resetScoresBtn = document.getElementById('reset-scores');
const restartGameBtn = document.getElementById('restart-game');
const answeringPlayerSelect = document.getElementById('answering-player');
const closeRulesBtn = document.getElementById('close-rules');

// Рендер вариантов ответа
function renderOptions(question) {
    optionsArea.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-letter">${letters[idx]}</span> <span class="option-text">${opt}</span>`;
        btn.dataset.index = idx;
        if (gameStateAnswered || gameStateCompleted) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
        btn.addEventListener('click', () => {
            if (gameStateAnswered || gameStateCompleted) {
                showToast('На этот вопрос уже ответили!');
                return;
            }
            const answerIndex = parseInt(btn.dataset.index);
            submitAnswer(answerIndex);
        });
        optionsArea.appendChild(btn);
    });
}

let gameStateAnswered = false;
let gameStateCompleted = false;

function openQuestion(index) {
    const theme = themesData[selectedTheme];
    const q = theme.questions[index];
    selectedQuestion = { theme: selectedTheme, index, data: q };
    questionCategory.innerText = theme.name;
    questionValueSpan.innerText = `💰 ${q.value} очков`;
    questionTextEl.innerText = q.text;
    feedbackDiv.innerHTML = '';
    isChatHelpUsed = false;
    gameStateAnswered = false;
    gameStateCompleted = false;
    renderOptions(q);
    questionModal.classList.remove('hidden');
}

function submitAnswer(answerIndex) {
    if (!selectedQuestion) return;
    const isCorrect = (answerIndex === selectedQuestion.data.correct);
    const questionLevel = selectedQuestion.data.value;
    const selectedPlayerId = answeringPlayerSelect.value;
    let message = '';

    if (isCorrect) {
        message = `✅ Правильно!`;
        const casinoTask = selectedQuestion.data.casinoTask;
        message += `<br>🎰 Задание казино: ${casinoTask}`;
        addPlayerScore(selectedPlayerId, questionLevel);
        if (isChatHelpUsed && viewerName) {
            message += `<br>💬 Зритель ${viewerName} получает 50$ за правильный ответ!`;
        }
    } else {
        const correctOption = selectedQuestion.data.options[selectedQuestion.data.correct];
        message = `❌ Неправильно. Правильный ответ: ${correctOption}.<br>🎰 Задание казино: ${selectedQuestion.data.casinoTask} (необходимо выполнить дважды, так как вы ошиблись)`;
        addPlayerScore(selectedPlayerId, -questionLevel);
        if (isChatHelpUsed && viewerName) {
            message += `<br>💬 К сожалению, зритель ${viewerName} не получает бонус, так как ответ неверный.`;
        }
    }

    gameStateAnswered = true;
    const wasLastQuestion = checkIfLastQuestion();
    showResultMessage(isCorrect ? 'Верно!' : 'Неверно', message, wasLastQuestion);
    isChatHelpUsed = false;
    viewerName = '';
}

function checkIfLastQuestion() {
    let answeredCount = 0;
    for (const themeKey of Object.keys(themesData)) {
        const answered = answeredQuestions[themeKey] ? answeredQuestions[themeKey].length : 0;
        answeredCount += answered;
    }
    const totalQuestions = 25;
    return answeredCount === totalQuestions - 1;
}

function showResultMessage(title, message, isLastQuestion) {
    document.getElementById('result-title').innerText = title;
    document.getElementById('result-message').innerHTML = message;
    resultModal.classList.remove('hidden');
    if (isLastQuestion) {
        pendingLastQuestion = true;
    } else {
        pendingLastQuestion = false;
    }
}

let pendingLastQuestion = false;

closeResultBtn.onclick = () => {
    resultModal.classList.add('hidden');
    if (selectedQuestion) {
        const themeKey = selectedQuestion.theme;
        const qIndex = selectedQuestion.index;
        if (!answeredQuestions[themeKey]) answeredQuestions[themeKey] = [];
        if (!answeredQuestions[themeKey].includes(qIndex)) {
            answeredQuestions[themeKey].push(qIndex);
        }
        selectedQuestion = null;
        gameStateAnswered = false;
        questionModal.classList.add('hidden');
        if (!themeModal.classList.contains('hidden') && selectedTheme === themeKey) {
            openTheme(themeKey);
        }
        if (pendingLastQuestion) {
            checkAllQuestionsAnswered();
        }
    }
    pendingLastQuestion = false;
};

function checkAllQuestionsAnswered() {
    let totalAnswered = 0;
    let totalQuestions = 0;
    for (const themeKey of Object.keys(themesData)) {
        const theme = themesData[themeKey];
        totalQuestions += theme.questions.length;
        const answered = answeredQuestions[themeKey] ? answeredQuestions[themeKey].length : 0;
        totalAnswered += answered;
    }
    if (totalAnswered === totalQuestions && totalQuestions > 0) {
        showCongratsModal();
    }
}

function showCongratsModal() {
    const container = document.getElementById('congrats-scores');
    container.innerHTML = '';
    const sorted = [...players].sort((a,b) => b.score - a.score);
    sorted.forEach(player => {
        const item = document.createElement('div');
        item.className = 'congrats-score-item';
        item.innerHTML = `
            <div class="congrats-score-name"><i class="${player.icon}"></i> ${player.name}</div>
            <div class="congrats-score-value">${player.score} очков</div>
        `;
        container.appendChild(item);
    });
    congratsModal.classList.remove('hidden');
}

function addPlayerScore(playerId, delta) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.score += delta;
        updateLeaderScoreUI(playerId, player.score);
    }
}

function updateLeaderScoreUI(id, score) {
    const span = document.getElementById(`score-${id}`);
    if (span) span.innerText = score;
}

function updateTotalScoreUI() {
    totalScoreSpan.innerText = currentScore;
}

function renderThemes() {
    themeGrid.innerHTML = '';
    for (const [key, theme] of Object.entries(themesData)) {
        const answeredCount = answeredQuestions[key] ? answeredQuestions[key].length : 0;
        const remaining = 5 - answeredCount;
        const questionsText = remaining === 1 ? 'вопрос' : 'вопросов';
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.dataset.theme = key;
        card.innerHTML = `
            <div class="theme-icon"><i class="${theme.icon}"></i></div>
            <div class="theme-name">${theme.name}</div>
            <div class="theme-desc">${remaining} ${questionsText}</div>
        `;
        card.addEventListener('click', () => openTheme(key));
        themeGrid.appendChild(card);
    }
}

function openTheme(themeKey) {
    selectedTheme = themeKey;
    const theme = themesData[themeKey];
    themeNameSpan.innerText = theme.name;
    questionsGrid.innerHTML = '';
    for (let i = 0; i < theme.questions.length; i++) {
        const q = theme.questions[i];
        const cell = document.createElement('div');
        cell.className = 'question-cell';
        cell.innerText = q.value;
        const answered = answeredQuestions[themeKey] && answeredQuestions[themeKey].includes(i);
        if (answered) {
            cell.classList.add('disabled');
        } else {
            cell.addEventListener('click', () => openQuestion(i));
        }
        questionsGrid.appendChild(cell);
    }
    themeModal.classList.remove('hidden');
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-players');
    container.innerHTML = '';
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'leader-card';
        card.innerHTML = `
            <div class="leader-avatar"><i class="${player.icon}"></i></div>
            <div class="leader-name">${player.name}</div>
            <div class="leader-score" id="score-${player.id}">${player.score}</div>
            <div class="score-controls">
                <button class="inc-score" data-id="${player.id}">+1</button>
                <button class="dec-score" data-id="${player.id}">-1</button>
            </div>
        `;
        container.appendChild(card);
    });
    document.querySelectorAll('.inc-score').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const player = players.find(p => p.id === id);
            if (player) {
                player.score++;
                updateLeaderScoreUI(id, player.score);
            }
        });
    });
    document.querySelectorAll('.dec-score').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const player = players.find(p => p.id === id);
            if (player) {
                player.score--;
                updateLeaderScoreUI(id, player.score);
            }
        });
    });
}

function useHelp(type) {
    if (waitingForViewer) return;
    if (type === 'chat') {
        waitingForViewer = true;
        viewerModal.classList.remove('hidden');
        return;
    } else if (type === 'vika') {
        feedbackDiv.innerHTML = `🤝 Вы спросили ответ у Вики. Увеличьте сложность задания на 15% при правильном ответе.`;
    } else if (type === 'batya') {
        feedbackDiv.innerHTML = `🤝 Вы спросили у Бати. Увеличьте сложность задания на 15% при правильном ответе.`;
    } else if (type === 'alex') {
        feedbackDiv.innerHTML = `🤝 Вы спросили у Алексея. Увеличьте сложность задания на 15% при правильном ответе.`;
    }
}

confirmViewer.addEventListener('click', () => {
    const viewer = viewerNameInput.value.trim();
    if (!viewer) {
        alert('Введите ник зрителя');
        return;
    }
    viewerName = viewer;
    feedbackDiv.innerHTML = `💬 Чат: ${viewer} помогает! Если ответ будет правильным, зритель получит 50$. Увеличьте сложность задания на 50% при правильном ответе.`;
    isChatHelpUsed = true;
    waitingForViewer = false;
    viewerModal.classList.add('hidden');
    viewerNameInput.value = '';
});

cancelViewer.addEventListener('click', () => {
    waitingForViewer = false;
    viewerModal.classList.add('hidden');
    viewerNameInput.value = '';
});

editBalanceBtn.addEventListener('click', () => {
    newBalanceInput.value = currentScore;
    balanceModal.classList.remove('hidden');
});
saveBalanceBtn.addEventListener('click', () => {
    const newVal = parseInt(newBalanceInput.value);
    if (!isNaN(newVal)) {
        currentScore = newVal;
        updateTotalScoreUI();
    }
    balanceModal.classList.add('hidden');
});
cancelBalanceBtn.addEventListener('click', () => {
    balanceModal.classList.add('hidden');
});

resetScoresBtn.addEventListener('click', () => {
    players.forEach(p => p.score = 0);
    renderLeaderboard();
});

restartGameBtn.addEventListener('click', () => {
    currentScore = 0;
    updateTotalScoreUI();
    players.forEach(p => p.score = 0);
    renderLeaderboard();
    answeredQuestions = {};
    selectedTheme = null;
    selectedQuestion = null;
    congratsModal.classList.add('hidden');
    renderThemes();
    themeModal.classList.add('hidden');
    questionModal.classList.add('hidden');
});

closeThemeModal.addEventListener('click', () => themeModal.classList.add('hidden'));
closeQuestionModal.addEventListener('click', () => {
    questionModal.classList.add('hidden');
    selectedQuestion = null;
});
closeRulesBtn.addEventListener('click', () => {
    rulesModal.classList.add('hidden');
});

helpChat.addEventListener('click', () => useHelp('chat'));
helpVika.addEventListener('click', () => useHelp('vika'));
helpBatya.addEventListener('click', () => useHelp('batya'));
helpAlex.addEventListener('click', () => useHelp('alex'));

window.addEventListener('click', (e) => {
    if (e.target === themeModal) themeModal.classList.add('hidden');
    if (e.target === questionModal) {
        questionModal.classList.add('hidden');
        selectedQuestion = null;
    }
    if (e.target === viewerModal) viewerModal.classList.add('hidden');
    if (e.target === balanceModal) balanceModal.classList.add('hidden');
    if (e.target === congratsModal) congratsModal.classList.add('hidden');
    if (e.target === rulesModal) rulesModal.classList.add('hidden');
});

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Падающие листья
function createLeaves() {
    const container = document.getElementById('leaf-container');
    if (!container) return;
    function createLeaf() {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');
        const size = Math.random() * 18 + 10;
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${Math.random() * 100}%`;
        const duration = Math.random() * 4 + 3;
        leaf.style.animationDuration = `${duration}s`;
        leaf.style.animationDelay = `${Math.random() * 5}s`;
        leaf.style.background = `linear-gradient(145deg, #${Math.floor(100 + Math.random()*155).toString(16)}${Math.floor(100 + Math.random()*155).toString(16)}33, #${Math.floor(50 + Math.random()*100).toString(16)}${Math.floor(50 + Math.random()*100).toString(16)}1a)`;
        container.appendChild(leaf);
        leaf.addEventListener('animationend', () => leaf.remove());
    }
    for (let i = 0; i < 60; i++) {
        setTimeout(() => createLeaf(), Math.random() * 2000);
    }
    setInterval(() => {
        if (container.children.length < 100) createLeaf();
    }, 500);
}

renderThemes();
renderLeaderboard();
updateTotalScoreUI();
window.addEventListener('load', () => {
    createLeaves();
    rulesModal.classList.remove('hidden');
});
