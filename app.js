// =============================================
// ПОМОЩНИК ЭКЗАМЕНОВ - ВЕБ-ВЕРСИЯ
// =============================================

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
    
    document.getElementById('baseSelect').addEventListener('change', (e) => switchBase(e.target.value));
    document.getElementById('searchInput').addEventListener('input', loadQuestions);
    
    // Закрытие модального окна по клику вне его
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoModal')) {
            document.getElementById('infoModal').style.display = 'none';
        }
    });

    // =============================================
    // ФИЧА: КНОПКА ПАНИКИ (PANIC BUTTON)
    // =============================================
    // Активация на клавишу Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            activatePanicButton();
        }
    });

    // Активация на двойной тап по экрану смартфона (защита на экзамене)
    let lastTap = 0;
    document.addEventListener('touchend', function (e) {
        let currentTime = new Date().getTime();
        let tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            activatePanicButton();
            e.preventDefault();
        }
        lastTap = currentTime;
    });
}

function activatePanicButton() {
    // Мгновенный уход на нейтральную страницу
    window.location.href = 'https://google.com';
}

// Функция разворачивания/сворачивания полного названия источника при клике
function toggleSource(element) {
    const fullText = element.getAttribute('data-full');
    const indexNum = element.getAttribute('data-index');
    
    if (element.classList.contains('short-source')) {
        // Разворачиваем: показываем полный текст
        element.textContent = `[${fullText}]`;
        element.classList.remove('short-source');
    } else {
        // Сворачиваем обратно при повторном клике
        element.textContent = `[Источник ${indexNum} ↩]`;
        element.classList.add('short-source');
    }
}

async function loadBasesFromGitHub() {
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
                console.log(`✅ Загружена база: ${baseName} (${questions.length} вопросов)`);
            } catch(e) {
                console.log(`❌ Ошибка загрузки ${baseName}:`, e);
            }
        }
        
        allBases.sort((a, b) => {
            return a.localeCompare(b, 'ru');
        });
        
        if (allBases.length > 0) {
            currentBase = allBases[0];
            const saved = localStorage.getItem(`base_${currentBase}`);
            allQuestions = saved ? JSON.parse(saved) : [];
            loadQuestions();
        }
        
        renderBaseSelect();
        
    } catch(e) {
        console.log('❌ Ошибка загрузки списка баз:', e);
        allBases = ['ПТБ'];
        renderBaseSelect();
    }
}

function renderBaseSelect() {
    let select = document.getElementById('baseSelect');
    select.innerHTML = '';
    
    allBases.forEach(base => {
        let opt = document.createElement('option');
        opt.value = base;
        opt.textContent = base;
        if (base === currentBase) opt.selected = true;
        select.appendChild(opt);
    });
}

function switchBase(baseName) {
    currentBase = baseName;
    const saved = localStorage.getItem(`base_${currentBase}`);
    allQuestions = saved ? JSON.parse(saved) : [];
    loadQuestions();
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

function getAllSources() {
    let sources = new Set();
    allQuestions.forEach(q => {
        if (q.source) sources.add(q.source);
    });
    return Array.from(sources).sort((a, b) => {
        let numA = parseInt(a) || 0;
        let numB = parseInt(b) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    });
}

function renderSourceFilter() {
    let sources = getAllSources();
    let filterBar = document.getElementById('filterBar');
    let sectionDropdown = document.getElementById('sectionDropdown');
    let sectionSelect = document.getElementById('sectionSelect');
    
    if (sources.length === 0) {
        filterBar.style.display = 'none';
        sectionDropdown.classList.add('hidden');
        return;
    }
    
    if (sources.length <= 6) {
        filterBar.style.display = 'flex';
        sectionDropdown.classList.add('hidden');
        
        let html = `<button class="source-filter ${currentFilter === 'all' ? 'active' : ''}" data-source="all">📋 Все</button>`;
        
        sources.forEach(source => {
            let displayName = source.length > 25 ? source.substring(0, 22) + '...' : source;
            html += `<button class="source-filter ${currentFilter === source ? 'active' : ''}" data-source="${source}" title="${source}">📁 ${displayName}</button>`;
        });
        
        filterBar.innerHTML = html;
        
        filterBar.querySelectorAll('.source-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.source;
                renderSourceFilter();
                loadQuestions();
            });
        });
    } else {
        filterBar.style.display = 'none';
        sectionDropdown.classList.remove('hidden');
        
        let options = '<option value="all" ' + (currentFilter === 'all' ? 'selected' : '') + '>📋 Все разделы</option>';
        sources.forEach(source => {
            options += `<option value="${source}" ${currentFilter === source ? 'selected' : ''}>📁 ${source}</option>`;
        });
        sectionSelect.innerHTML = options;
        
        sectionSelect.onchange = function() {
            currentFilter = this.value === 'all' ? 'all' : this.value;
            loadQuestions();
        };
    }
}

function formatAnswer(question) {
    if (!question) return '';
    let html = '';
    
    if (question.all_answers) {
        question.all_answers.forEach(a => {
            html += `<div class="${a.correct ? 'answer-correct' : 'answer-wrong'}">${a.correct ? '✅' : '❌'} ${a.text}</div>`;
        });
    } else if (question.answer) {
        if (question.answer.includes('++')) {
            question.answer.split('\n').forEach(line => {
                if (line.trim().startsWith('++')) {
                    html += `<div class="answer-correct">✅ ${line.replace('++', '').trim()}</div>`;
                }
            });
        } else {
            html += `<div class="answer-correct">✅ ${question.answer}</div>`;
        }
    }
    return html;
}

function loadQuestions() {
    let filtered = currentFilter === 'all' 
        ? allQuestions 
        : allQuestions.filter(q => q.source === currentFilter);
    
    let search = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (search) {
        let searchWords = search.split(/\s+/).filter(word => word.length > 0);
        
        filtered = filtered.filter(q => {
            let textToSearch = (
                (q.punkt || '') + ' ' + 
                (q.question || '') + ' ' + 
                (q.source || '')
            ).toLowerCase();
            
            return searchWords.every(word => textToSearch.includes(word));
        });
    }
    
    document.getElementById('questionCount').textContent = filtered.length;
    renderSourceFilter();
    
    let container = document.getElementById('questionsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">📭 В этой базе нет вопросов</div>';
        return;
    }
    
    let html = '';
    
    // Простой счетчик вопросов на экране
    let itemIndex = 0;

    filtered.forEach(q => {
        html += `<div class="question-item">`;
        
        let sourceContent = '';
        if (q.source) {
            if (itemIndex === 0) {
                // Самый первый вопрос на странице всегда показывает полный текст
                sourceContent = `<span class="source">[${q.source}]</span>`;
            } else {
                // Все последующие вопросы скрывают источник под короткую кнопку
                sourceContent = `<span class="source short-source" 
                                       data-full="${q.source}" 
                                       data-index="1"
                                       onclick="toggleSource(this)">[Источник 1 ↩]</span>`;
            }
            itemIndex++; // Увеличиваем счетчик
        }
        
        html += `<div class="punkt">📌 ${q.punkt || ''} ${sourceContent}</div>`;
        html += `<div class="question">❓ ${q.question}</div>`;
        html += `<div class="answers">${formatAnswer(q)}</div>`;
        html += `</div>`;
    });
    
    container.innerHTML = html;
}
