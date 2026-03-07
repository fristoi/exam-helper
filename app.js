// =============================================
// ПОМОЩНИК ЭКЗАМЕНОВ - ВЕБ-ВЕРСИЯ
// =============================================

let bases = {};
let currentBase = 'Основная';
let allQuestions = [];

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    setupEventListeners();
    renderBaseSelect();
    renderBasesList();
});

function loadFromStorage() {
    const saved = localStorage.getItem('examHelperBases');
    if (saved) {
        try {
            bases = JSON.parse(saved);
        } catch (e) {
            bases = { 'Основная': [] };
        }
    } else {
        bases = { 'Основная': [] };
    }
    
    if (!bases[currentBase]) {
        currentBase = Object.keys(bases)[0] || 'Основная';
        if (!bases[currentBase]) {
            bases[currentBase] = [];
        }
    }
    allQuestions = bases[currentBase] || [];
}

function saveToStorage() {
    localStorage.setItem('examHelperBases', JSON.stringify(bases));
}

function setupEventListeners() {
    document.getElementById('newBaseBtn').addEventListener('click', () => {
        document.getElementById('createBaseModal').classList.add('active');
    });
    
    document.getElementById('closeCreateModal').addEventListener('click', () => {
        document.getElementById('createBaseModal').classList.remove('active');
        document.getElementById('newBaseName').value = '';
    });
    
    document.getElementById('confirmCreateBtn').addEventListener('click', createNewBase);
    document.getElementById('baseSelect').addEventListener('change', (e) => switchBase(e.target.value));
    document.getElementById('importBtn').addEventListener('click', importJSON);
    document.getElementById('exportBtn').addEventListener('click', exportJSON);
    document.getElementById('clearBaseBtn').addEventListener('click', clearCurrentBase);
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        document.getElementById('addQuestionModal').classList.add('active');
    });
    
    document.getElementById('closeAddModal').addEventListener('click', () => {
        document.getElementById('addQuestionModal').classList.remove('active');
    });
    
    document.getElementById('addBtn').addEventListener('click', addQuestion);
    
    document.getElementById('searchInput').addEventListener('input', performSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        performSearch();
    });
}

function createNewBase() {
    let name = document.getElementById('newBaseName').value.trim();
    if (!name) {
        alert('Введите название базы');
        return;
    }
    
    if (bases[name]) {
        alert('База с таким названием уже существует');
        return;
    }
    
    bases[name] = [];
    saveToStorage();
    renderBaseSelect();
    renderBasesList();
    switchBase(name);
    
    document.getElementById('createBaseModal').classList.remove('active');
    document.getElementById('newBaseName').value = '';
}

function renderBaseSelect() {
    const select = document.getElementById('baseSelect');
    select.innerHTML = '';
    
    Object.keys(bases).forEach(base => {
        let option = document.createElement('option');
        option.value = base;
        option.textContent = `${base} (${bases[base].length})`;
        if (base === currentBase) option.selected = true;
        select.appendChild(option);
    });
}

function renderBasesList() {
    const container = document.getElementById('basesContainer');
    container.innerHTML = '';
    
    Object.entries(bases).forEach(([name, questions]) => {
        let div = document.createElement('div');
        div.className = 'base-item';
        div.innerHTML = `
            <span class="base-name">${name}</span>
            <span class="base-count">${questions.length}</span>
            <button class="delete-base" data-base="${name}">🗑️</button>
        `;
        container.appendChild(div);
        
        div.querySelector('.delete-base').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBase(name);
        });
    });
    
    document.getElementById('totalBasesCount').textContent = Object.keys(bases).length;
}

function deleteBase(name) {
    if (name === 'Основная') {
        alert('Нельзя удалить основную базу');
        return;
    }
    
    if (!confirm(`Удалить базу "${name}"? Все вопросы удалятся.`)) return;
    
    delete bases[name];
    
    if (currentBase === name) {
        currentBase = 'Основная';
        if (!bases[currentBase]) bases[currentBase] = [];
    }
    
    saveToStorage();
    renderBaseSelect();
    renderBasesList();
    switchBase(currentBase);
}

function switchBase(name) {
    currentBase = name;
    allQuestions = bases[currentBase] || [];
    document.getElementById('searchInput').value = '';
    performSearch();
    renderBaseSelect();
    renderBasesList();
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

function performSearch() {
    let searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    let results = [];
    
    if (!searchText) {
        results = allQuestions; // ПОКАЗЫВАЕМ ВСЕ ВОПРОСЫ
    } else {
        results = allQuestions.filter(q => 
            (q.punkt && q.punkt.toLowerCase().includes(searchText)) ||
            (q.question && q.question.toLowerCase().includes(searchText))
        );
    }
    
    document.getElementById('resultCount').textContent = results.length;
    
    let html = '';
    if (results.length === 0) {
        html = '<div class="no-results">❌ Ничего не найдено</div>';
    } else {
        results.forEach((q, i) => {
            html += `
                <div class="result-item">
                    <div class="result-punkt">📌 ${q.punkt || ''}</div>
                    <div class="result-question">❓ ${q.question}</div>
                    <div class="result-answers">${formatAnswer(q)}</div>
                </div>
            `;
        });
    }
    
    document.getElementById('resultsList').innerHTML = html;
}

function addQuestion() {
    const punkt = document.getElementById('newPunkt').value.trim();
    const question = document.getElementById('newQuestion').value.trim();
    const answer = document.getElementById('newAnswer').value.trim();
    
    if (!punkt || !question || !answer) {
        alert('Заполни все поля');
        return;
    }
    
    const newQuestionObj = {
        id: Date.now() + Math.random(),
        punkt,
        question,
        answer
    };
    
    bases[currentBase].push(newQuestionObj);
    allQuestions = bases[currentBase];
    
    saveToStorage();
    
    document.getElementById('newPunkt').value = '';
    document.getElementById('newQuestion').value = '';
    document.getElementById('newAnswer').value = '';
    document.getElementById('addQuestionModal').classList.remove('active');
    
    renderBaseSelect();
    performSearch();
    alert('✅ Вопрос добавлен');
}

function clearCurrentBase() {
    if (!confirm(`Очистить базу "${currentBase}"?`)) return;
    
    bases[currentBase] = [];
    allQuestions = [];
    saveToStorage();
    renderBaseSelect();
    performSearch();
    alert('✅ База очищена');
}

function exportJSON() {
    const dataStr = JSON.stringify(bases[currentBase], null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBase}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (ev) => {
            try {
                const importedData = JSON.parse(ev.target.result);
                
                if (!Array.isArray(importedData)) {
                    alert('❌ Файл должен содержать массив вопросов');
                    return;
                }
                
                // Добавляем ID если нет
                const withIds = importedData.map(item => ({
                    id: item.id || Date.now() + Math.random(),
                    punkt: item.punkt || '',
                    question: item.question || '',
                    answer: item.answer || '',
                    correct: item.correct || [],
                    wrong: item.wrong || [],
                    all_answers: item.all_answers || []
                }));
                
                bases[currentBase] = [...bases[currentBase], ...withIds];
                allQuestions = bases[currentBase];
                saveToStorage();
                renderBaseSelect();
                performSearch();
                alert(`✅ Импортировано ${importedData.length} вопросов`);
                
            } catch(error) {
                alert('❌ Ошибка при чтении файла: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}
