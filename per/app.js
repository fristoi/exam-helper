let currentBase = '';
let allBases = [];
let allQuestions = [];
let currentFilter = 'all';

const MAIN_BASES = ['ПТБ', 'ППБ', 'ПТЭ'];

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadBasesFromGitHub();
});

function setupEventListeners() {
    document.getElementById('toggleSettingsBtn')?.addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'flex';
    });
    document.getElementById('closeInfoBtn')?.addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'none';
    });

    document.getElementById('baseSelect').addEventListener('change', (e) => {
        if (e.target.value) switchBase(e.target.value);
    });

    document.getElementById('searchInput').addEventListener('input', loadQuestions);

    document.getElementById('infoModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) {
            document.getElementById('infoModal').style.display = 'none';
        }
    });

    document.querySelectorAll('.top-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.top-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            switchBase(this.dataset.base);
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.location.href = 'https://google.com';
    });

    let lastTap = 0;
    document.addEventListener('touchend', function (e) {
        let currentTime = new Date().getTime();
        let tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            window.location.href = 'https://google.com';
            e.preventDefault();
        }
        lastTap = currentTime;
    });
}

async function loadBasesFromGitHub() {
    try {
        let indexResponse = await fetch('per/bases/index.json');
        let index = await indexResponse.json();
        allBases = [];

        for (let baseName of index.bases) {
            try {
                let response = await fetch(`per/bases/${baseName}.json`);
                let questions = await response.json();
                localStorage.setItem(`base_${baseName}`, JSON.stringify(questions));
                allBases.push(baseName);
            } catch(e) {
                console.warn(`❌ Не удалось загрузить базу: ${baseName}`, e);
            }
        }

        allBases.sort((a, b) => a.localeCompare(b, 'ru'));

        // Сначала пытаемся восстановить текущую базу
        let savedBase = localStorage.getItem('currentBase');
        
        // Проверяем, есть ли сохранённая база в списке
        if (savedBase && allBases.includes(savedBase)) {
            currentBase = savedBase;
        } else {
            // Если нет — пробуем найти ПТБ, ППБ, ПТЭ (в порядке приоритета)
            let mainFound = MAIN_BASES.find(b => allBases.includes(b));
            if (mainFound) {
                currentBase = mainFound;
            } else if (allBases.length > 0) {
                currentBase = allBases[0];
            }
        }

        if (currentBase) {
            const saved = localStorage.getItem(`base_${currentBase}`);
            allQuestions = saved ? JSON.parse(saved) : [];
            loadQuestions();
        }

        renderBaseSelect();
        updateTopButtons();

    } catch(e) {
        console.warn('⚠️ Не удалось загрузить per/bases/index.json', e);
        // Пробуем стандартные базы из корня
        for (let baseName of MAIN_BASES) {
            try {
                let response = await fetch(`bases/${baseName}.json`);
                let questions = await response.json();
                localStorage.setItem(`base_${baseName}`, JSON.stringify(questions));
                allBases.push(baseName);
            } catch(e) {}
        }
        if (allBases.length > 0) {
            currentBase = allBases[0];
            const saved = localStorage.getItem(`base_${currentBase}`);
            allQuestions = saved ? JSON.parse(saved) : [];
            loadQuestions();
        }
        renderBaseSelect();
        updateTopButtons();
    }
}

// ===== ОТРИСОВКА СПИСКА БАЗ (ТОЛЬКО ДОПОЛНИТЕЛЬНЫЕ) =====
function renderBaseSelect() {
    let select = document.getElementById('baseSelect');
    if (!select) return;

    // Исключаем основные базы из выпадающего списка
    const extraBases = allBases.filter(b => !MAIN_BASES.includes(b));

    if (extraBases.length === 0) {
        select.style.display = 'none';
        return;
    }

    select.style.display = 'block';
    select.innerHTML = '<option value="">📁 Дополнительные базы</option>';

    extraBases.forEach(base => {
        let opt = document.createElement('option');
        opt.value = base;
        opt.textContent = base;
        if (base === currentBase) opt.selected = true;
        select.appendChild(opt);
    });
}

function updateTopButtons() {
    document.querySelectorAll('.top-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.base === currentBase);
    });
}

function switchBase(baseName) {
    if (!baseName || !allBases.includes(baseName)) return;

    currentBase = baseName;
    localStorage.setItem('currentBase', currentBase);

    const saved = localStorage.getItem(`base_${currentBase}`);
    allQuestions = saved ? JSON.parse(saved) : [];

    currentFilter = 'all';
    renderSourceFilter();

    const select = document.getElementById('baseSelect');
    if (select) select.value = currentBase;

    updateTopButtons();
    loadQuestions();
    window.scrollTo(0, 0);
}

function getAllSources() {
    let sources = new Set();
    allQuestions.forEach(q => {
        if (q.source && q.source.trim()) sources.add(q.source.trim());
    });
    return Array.from(sources).sort((a, b) => a.localeCompare(b, 'ru'));
}

function renderSourceFilter() {
    let sources = getAllSources();
    let filterBar = document.getElementById('filterBar');
    if (!filterBar) return;

    if (sources.length === 0) {
        filterBar.style.display = 'none';
        return;
    }

    filterBar.style.display = 'flex';
    let html = `<button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-source="all">📋 Все</button>`;

    sources.forEach(source => {
        let displayName = source.length > 25 ? source.substring(0, 22) + '...' : source;
        html += `<button class="filter-btn ${currentFilter === source ? 'active' : ''}" data-source="${source}">📁 ${displayName}</button>`;
    });

    filterBar.innerHTML = html;

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.source;
            renderSourceFilter();
            loadQuestions();
        });
    });
}

function formatAnswer(question, highlightWords) {
    if (!question) return '';
    let html = '';

    if (question.all_answers && question.all_answers.length > 0) {
        question.all_answers.forEach(a => {
            let text = a.text || '';
            if (highlightWords && highlightWords.length > 0) {
                text = highlightText(text, highlightWords);
            }
            html += `<div class="${a.correct ? 'answer-correct' : 'answer-wrong'}">${a.correct ? '✅' : '❌'} ${text}</div>`;
        });
    } else if (question.answer) {
        let text = question.answer;
        if (text.includes('++')) {
            text.split('\n').forEach(line => {
                if (line.trim().startsWith('++')) {
                    let cleanText = line.replace('++', '').trim();
                    if (highlightWords && highlightWords.length > 0) {
                        cleanText = highlightText(cleanText, highlightWords);
                    }
                    html += `<div class="answer-correct">✅ ${cleanText}</div>';
                }
            });
        } else {
            if (highlightWords && highlightWords.length > 0) {
                text = highlightText(text, highlightWords);
            }
            html += `<div class="answer-correct">✅ ${text}</div>';
        }
    }
    return html;
}

function toggleSource(element) {
    const fullText = element.getAttribute('data-full');
    const indexNum = element.getAttribute('data-index');
    if (element.classList.contains('short-source')) {
        element.textContent = `[${fullText}]`;
        element.classList.remove('short-source');
    } else {
        element.textContent = `[Источник ${indexNum} ↩]`;
        element.classList.add('short-source');
    }
}

function highlightText(text, words) {
    if (!text || !words || words.length === 0) return text;
    let result = text;
    let sortedWords = [...words].sort((a, b) => b.length - a.length);
    for (let word of sortedWords) {
        if (word.length < 1) continue;
        let escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let regex = new RegExp('(' + escaped + ')', 'gi');
        result = result.replace(regex, '<span class="highlight">$1</span>');
    }
    return result;
}

function getDeclension(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'вопрос';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'вопроса';
    return 'вопросов';
}

function loadQuestions() {
    let search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    let searchWords = search ? search.split(/\s+/).filter(word => word.length > 0) : [];

    let filtered = currentFilter === 'all'
        ? allQuestions
        : allQuestions.filter(q => q.source && q.source.trim() === currentFilter);

    if (searchWords.length > 0) {
        filtered = filtered.filter(q => {
            let answersText = '';
            if (q.all_answers) {
                answersText = q.all_answers.map(a => a.text || '').join(' ');
            } else if (q.answer) {
                answersText = q.answer;
            }

            let textToSearch = (
                (q.punkt || '') + ' ' +
                (q.question || '') + ' ' +
                answersText
            ).toLowerCase();

            return searchWords.every(word => textToSearch.includes(word));
        });
    }

    const count = filtered.length;
    const countEl = document.getElementById('countBadge') || document.getElementById('questionCount');
    if (countEl) {
        countEl.textContent = `${count} ${getDeclension(count)}`;
    }

    let container = document.getElementById('questionsContainer');
    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">📭 Нет вопросов</div>';
        return;
    }

    let html = '';
    let shownSources = {};
    let sourceCounter = 0;

    filtered.forEach(q => {
        let punktText = q.punkt || '';
        let questionText = q.question || '';

        if (searchWords.length > 0) {
            punktText = highlightText(punktText, searchWords);
            questionText = highlightText(questionText, searchWords);
        }

        let sourceContent = '';
        if (q.source) {
            let cleanSource = q.source.trim();
            if (!shownSources[cleanSource]) {
                sourceCounter++;
                shownSources[cleanSource] = sourceCounter;
                sourceContent = `<span class="source">[${q.source}]</span>`;
            } else {
                sourceContent = `<span class="source short-source" data-full="${q.source}" data-index="${shownSources[cleanSource]}" onclick="toggleSource(this)">[Источник ${shownSources[cleanSource]} ↩]</span>`;
            }
        }

        html += `<div class="question-item">`;
        html += `<div class="punkt">📌 ${punktText} ${sourceContent}</div>`;
        html += `<div class="question">❓ ${questionText}</div>`;
        html += `<div class="answers">${formatAnswer(q, searchWords)}</div>`;
        html += `</div>`;
    });

    container.innerHTML = html;
}
