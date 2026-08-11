let currentBase = '';
let allBases = [];
let allQuestions = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadBasesFromGitHub();
});

function setupEventListeners() {
    document.getElementById('toggleSettingsBtn').addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'flex';
    });
    document.getElementById('closeInfoBtn').addEventListener('click', () => {
        document.getElementById('infoModal').style.display = 'none';
    });
    document.getElementById('baseSelect').addEventListener('change', (e) => {
        switchBase(e.target.value);
    });
    document.getElementById('searchInput').addEventListener('input', loadQuestions);
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) {
            document.getElementById('infoModal').style.display = 'none';
        }
    });

    // Кнопка паники (Escape или двойной тап)
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
}async function loadBasesFromGitHub() {
    try {
        let indexResponse = await fetch('bases/index.json');
        let index = await indexResponse.json();
        allBases = [];
        for (let baseName of index.bases) {
            try {
                let response = await fetch(`bases/${baseName}.json`);
                let questions = await response.json();
                localStorage.setItem(`base_${baseName}`, JSON.stringify(questions));
                allBases.push(baseName);
            } catch(e) { console.log(e); }
        }
        allBases.sort((a, b) => a.localeCompare(b, 'ru'));
        if (allBases.length > 0) {
            currentBase = allBases[0]; // Исправленный индекс базы
            const saved = localStorage.getItem(`base_${currentBase}`);
            allQuestions = saved ? JSON.parse(saved) : [];
            loadQuestions();
        }
        renderBaseSelect();
    } catch(e) {
        allBases = ['ПТБ'];
        renderBaseSelect();
    }
}

function renderBaseSelect() {
    let select = document.getElementById('baseSelect');
    if (!select) return;
    select.innerHTML = '';
    allBases.forEach(base => {
        let opt = document.createElement('option');
        opt.value = base; opt.textContent = base;
        if (base === currentBase) opt.selected = true;
        select.appendChild(opt);
    });
}

function switchBase(baseName) {
    currentBase = baseName;
    const saved = localStorage.getItem(`base_${currentBase}`);
    allQuestions = saved ? JSON.parse(saved) : [];
    currentFilter = 'all'; 
    loadQuestions();
    window.scrollTo(0, 0);
}

function getAllSources() {
    let sources = new Set();
    allQuestions.forEach(q => { if (q.source) sources.add(q.source.trim()); });
    return Array.from(sources).sort((a, b) => a.localeCompare(b));
}
function renderSourceFilter() {
    let sources = getAllSources();
    let filterBar = document.getElementById('filterBar');
    if (sources.length === 0) {
        if (filterBar) filterBar.style.display = 'none';
        return;
    }
    if (filterBar) filterBar.style.display = 'flex';
    let html = `<button class="source-filter ${currentFilter === 'all' ? 'active' : ''}" data-source="all">📋 Все</button>`;
    sources.forEach(source => {
        let displayName = source.length > 25 ? source.substring(0, 22) + '...' : source;
        html += `<button class="source-filter ${currentFilter === source ? 'active' : ''}" data-source="${source}">📁 ${displayName}</button>`;
    });
    filterBar.innerHTML = html;
    filterBar.querySelectorAll('.source-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.source;
            renderSourceFilter();
            loadQuestions();
        });
    });
}

function formatAnswer(question) {
    if (!question) return '';
    let html = '';
    if (question.all_answers) {
        question.all_answers.forEach(a => {
            html += `<div class="${a.correct ? 'answer-correct' : 'answer-wrong'}">${a.correct ? '✅' : '❌'} ${a.text}</div>`;
        });
    } else if (question.answer) {
        html += `<div class="answer-correct">✅ ${question.answer}</div>`;
    }
    return html;
}

function loadQuestions() {
    let filtered = currentFilter === 'all' ? allQuestions : allQuestions.filter(q => q.source && q.source.trim() === currentFilter);
    let search = document.getElementById('searchInput').value.toLowerCase().trim();
    if (search) {
        let searchWords = search.split(/\s+/);
        filtered = filtered.filter(q => {
            let txt = ((q.punkt || '') + ' ' + (q.question || '') + ' ' + (q.source || '')).toLowerCase();
            return searchWords.every(word => txt.includes(word));
        });
    }
    document.getElementById('questionCount').textContent = filtered.length;
    renderSourceFilter();
    let container = document.getElementById('questionsContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">📭 Вопросов нет</div>';
        return;
    }
    let html = '';
    let shownSources = {}; let sourceCounter = 0;
    filtered.forEach(q => {
        html += `<div class="question-item">`;
        let sourceContent = '';
        if (q.source) {
            let cleanSource = q.source.trim(); 
            if (!shownSources[cleanSource]) {
                sourceCounter++; shownSources[cleanSource] = sourceCounter;
                sourceContent = `<span class="source">[${q.source}]</span>`;
            } else {
                sourceContent = `<span class="source short-source" data-full="${q.source}" data-index="${shownSources[cleanSource]}" onclick="toggleSource(this)">[Источник ${shownSources[cleanSource]} ↩]</span>`;
            }
        }
        html += `<div class="punkt">📌 ${q.punkt || ''} ${sourceContent}</div>`;
        html += `<div class="question">❓ ${q.question}</div>`;
        html += `<div class="answers">${formatAnswer(q)}</div>`;
        html += `</div>`;
    });
    container.innerHTML = html;
}

