// =============================================
// ПОМОЩНИК ЭКЗАМЕНОВ - ВЕБ-ВЕРСИЯ 2.0
// =============================================

let currentBase = 'Основная';
let allBases = ['Основная'];
let allQuestions = [];
let currentFilter = 'all';

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    setupEventListeners();
    renderBaseSelect();
    loadQuestions();
});

function loadFromStorage() {
    const saved = localStorage.getItem('examHelperBases');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            allBases = data.bases || ['Основная'];
            currentBase = data.currentBase || allBases[0];
            const questions = localStorage.getItem(`base_${currentBase}`);
            allQuestions = questions ? JSON.parse(questions) : [];
        } catch (e) {
            resetToDefault();
        }
    } else {
        resetToDefault();
    }
}

function resetToDefault() {
    allBases = ['Основная'];
    currentBase = 'Основная';
    allQuestions = [];
    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem('examHelperBases', JSON.stringify({
        bases: allBases,
        currentBase: currentBase
    }));
    localStorage.setItem(`base_${currentBase}`, JSON.stringify(allQuestions));
}

function isMobile() {
    return window.innerWidth <= 600;
}

function setupEventListeners() {
    document.getElementById('toggleSettingsBtn').addEventListener('click', toggleSettings);
    document.getElementById('baseSelect').addEventListener('change', (e) => switchBase(e.target.value));
    document.getElementById('searchInput').addEventListener('input', loadQuestions);
    document.getElementById('importBtn').addEventListener('click', importJSON);
    document.getElementById('exportBtn').addEventListener('click', exportJSON);
    document.getElementById('clearBaseBtn').addEventListener('click', clearBase);
    document.getElementById('addBtn').addEventListener('click', addQuestion);
    document.getElementById('renameBaseBtn').addEventListener('click', showRenameModal);
    document.getElementById('deleteBaseBtn').addEventListener('click', deleteBase);
    
    // Кнопка создания для мобильных
    document.getElementById('mobileCreateBtn').addEventListener('click', () => {
        document.getElementById('createBaseModal').style.display = 'flex';
    });
    
    // Модальные окна
    document.getElementById('confirmCreateBtn').addEventListener('click', createNewBase);
    document.getElementById('closeCreateModal').addEventListener('click', () => {
        document.getElementById('createBaseModal').style.display = 'none';
    });
    document.getElementById('confirmRenameBtn').addEventListener('click', renameBase);
    document.getElementById('closeRenameModal').addEventListener('click', () => {
        document.getElementById('renameBaseModal').style.display = 'none';
    });
    
    // Адаптация под мобильные
    window.addEventListener('resize', checkMobile);
    checkMobile();
}

function checkMobile() {
    let createBtn = document.getElementById('mobileCreateBtn');
    let baseSelect = document.getElementById('baseSelect');
    
    if (isMobile()) {
        createBtn.style.display = 'flex';
        // Убираем пункт "Создать новую базу" из select на мобильных
        for (let i = baseSelect.options.length - 1; i >= 0; i--) {
            if (baseSelect.options[i].value === 'CREATE_NEW') {
                baseSelect.remove(i);
                break;
            }
        }
    } else {
        createBtn.style.display = 'none';
        // Возвращаем пункт создания в select на десктопе
        let hasCreate = false;
        for (let i = 0; i < baseSelect.options.length; i++) {
            if (baseSelect.options[i].value === 'CREATE_NEW') {
                hasCreate = true;
                break;
            }
        }
        if (!hasCreate) {
            let createOpt = document.createElement('option');
            createOpt.value = 'CREATE_NEW';
            createOpt.textContent = '➕ Создать новую базу...';
            baseSelect.appendChild(createOpt);
        }
    }
}

function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('hidden');
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
    
    // На десктопе добавляем пункт создания
    if (!isMobile()) {
        let createOpt = document.createElement('option');
        createOpt.value = 'CREATE_NEW';
        createOpt.textContent = '➕ Создать новую базу...';
        select.appendChild(createOpt);
    }
}

function showRenameModal() {
    if (currentBase === 'Основная') {
        alert('Нельзя переименовать основную базу');
        return;
    }
    document.getElementById('renameBaseInput').value = currentBase;
    document.getElementById('renameBaseModal').style.display = 'flex';
}

function switchBase(baseName) {
    if (baseName === 'CREATE_NEW') {
        document.getElementById('createBaseModal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('baseSelect').value = currentBase;
        }, 100);
    } else {
        currentBase = baseName;
        const questions = localStorage.getItem(`base_${currentBase}`);
        allQuestions = questions ? JSON.parse(questions) : [];
        
        // Прокручиваем страницу вверх
        window.scrollTo({
            top: 0,
            behavior: 'auto' // плавная прокрутка
        });
        
        // Или если используешь main-content:
        // document.querySelector('.main-content').scrollTo({
        //     top: 0,
        //     behavior: 'smooth'
        // });
        
        loadQuestions();
        saveToStorage();
    }
}

function createNewBase() {
    let name = document.getElementById('newBaseName').value.trim();
    if (!name) return alert('Введите название');
    if (allBases.includes(name)) return alert('Такая база уже есть');
    
    allBases.push(name);
    currentBase = name;
    allQuestions = [];
    saveToStorage();
    renderBaseSelect();
    loadQuestions();
    document.getElementById('createBaseModal').style.display = 'none';
    document.getElementById('newBaseName').value = '';
}

function renameBase() {
    let newName = document.getElementById('renameBaseInput').value.trim();
    if (!newName) return alert('Введите новое название');
    if (allBases.includes(newName)) return alert('База с таким названием уже существует');
    
    localStorage.setItem(`base_${newName}`, JSON.stringify(allQuestions));
    localStorage.removeItem(`base_${currentBase}`);
    
    let index = allBases.indexOf(currentBase);
    allBases[index] = newName;
    currentBase = newName;
    saveToStorage();
    renderBaseSelect();
    loadQuestions();
    document.getElementById('renameBaseModal').style.display = 'none';
    alert('✅ База переименована');
}

function deleteBase() {
    if (currentBase === 'Основная') {
        alert('Нельзя удалить основную базу');
        return;
    }
    if (!confirm(`Точно удалить базу "${currentBase}"?`)) return;
    
    localStorage.removeItem(`base_${currentBase}`);
    allBases = allBases.filter(b => b !== currentBase);
    currentBase = allBases[0];
    allQuestions = [];
    saveToStorage();
    renderBaseSelect();
    loadQuestions();
    alert('✅ База удалена');
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
        filtered = filtered.filter(q => 
            (q.punkt && q.punkt.toLowerCase().includes(search)) ||
            (q.question && q.question.toLowerCase().includes(search)) ||
            (q.source && q.source.toLowerCase().includes(search))
        );
    }
    
    document.getElementById('questionCount').textContent = filtered.length;
    renderSourceFilter();
    
    let container = document.getElementById('questionsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">📭 В этой базах пока нет вопросов</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(q => {
        html += `<div class="question-item">`;
        html += `<div class="punkt">📌 ${q.punkt || ''}`;
        if (q.source) html += `<span class="source">[${q.source}]</span>`;
        html += `</div>`;
        html += `<div class="question">❓ ${q.question}</div>`;
        html += `<div class="answers">${formatAnswer(q)}</div>`;
        html += `</div>`;
    });
    
    container.innerHTML = html;
}

function addQuestion() {
    let punkt = document.getElementById('newPunkt').value.trim();
    let source = document.getElementById('newSource').value.trim();
    let question = document.getElementById('newQuestion').value.trim();
    let answer = document.getElementById('newAnswer').value.trim();
    
    if (!punkt || !question || !answer) return alert('Заполни пункт, вопрос и ответ');
    
    allQuestions.push({ 
        id: Date.now(), 
        punkt, 
        source: source || null,
        question, 
        answer 
    });
    
    saveToStorage();
    
    document.getElementById('newPunkt').value = '';
    document.getElementById('newSource').value = '';
    document.getElementById('newQuestion').value = '';
    document.getElementById('newAnswer').value = '';
    
    loadQuestions();
    alert('✅ Вопрос добавлен');
}

function clearBase() {
    if (!confirm(`Очистить базу "${currentBase}"?`)) return;
    allQuestions = [];
    saveToStorage();
    loadQuestions();
}

function exportJSON() {
    let dataStr = JSON.stringify(allQuestions, null, 2);
    let blob = new Blob([dataStr], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `${currentBase}.json`;
    a.click();
}

function importJSON() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = (ev) => {
            try {
                let data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error('Не массив');
                
                allQuestions = [...allQuestions, ...data];
                saveToStorage();
                loadQuestions();
                alert(`✅ Импортировано ${data.length} вопросов`);
            } catch(e) {
                alert('❌ Ошибка при чтении JSON');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

