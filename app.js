import {themes, question} from './data.js';
import {mountMobile} from './mobile.js';
import {clips} from './audio.js';
import {wordPicture, sourcePictures} from './illustrations.js';
import {keyboardMarkup, connectKeyboard} from './keyboard.js';

const app = document.querySelector('#app');
const artSource = id => `art/${id}.webp`;
const score = document.querySelector('#score');
const total = themes.reduce((sum, theme) => sum + theme.items.length, 0);
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(`ciao-v1-${key}`)) ?? fallback; }
  catch { return fallback; }
};
function save(key, value) {
  try { localStorage.setItem(`ciao-v1-${key}`, JSON.stringify(value)); return true; }
  catch { return false; }
}
const solved = new Set(read('solved', []));
const reviewed = new Set(read('reviewed', []));
const quizCount = (theme) => theme.items.filter((_, i) => solved.has(`${theme.id}/${i}`)).length;
const button = (label, id, primary = false) => `<button type="button" class="action ${primary ? 'primary' : ''}" id="${id}">${label}</button>`;
const link = (label, href, primary = false) => `<a class="action ${primary ? 'primary' : ''}" href="${href}">${label}</a>`;
const node = (id) => document.getElementById(id);
const updateScore = () => { score.textContent = `★ ${solved.size} / ${total}`; };
let leave = () => {};
let lastRoute;
let spoken;
let recording;
function stopSpeech() {
  recording?.pause();
  recording = null;
  if (spoken) window.speechSynthesis.cancel();
  spoken = null;
}
function speech(word, status) {
  stopSpeech();
  status.textContent = '';
  const clip = Object.hasOwn(clips, word) && clips[word];
  if (clip) {
    const player = new Audio(`audio/italian-${clip}.mp3`);
    recording = player;
    player.play().catch(() => {
      if (recording === player) status.textContent = 'Не удалось включить звук. Нажми «Послушать» ещё раз.';
    });
    return;
  }
  if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
    status.textContent = 'Озвучивание недоступно в этом браузере.';
    return;
  }
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const italian = voices.find((voice) => /^it(?:-|_)/i.test(voice.lang));
  if (voices.length && !italian) {
    status.textContent = 'Для озвучивания добавь итальянский голос в настройках устройства.';
    return;
  }
  synth.cancel();
  spoken = new SpeechSynthesisUtterance(word);
  spoken.lang = 'it-IT';
  spoken.rate = 0.78;
  if (italian) spoken.voice = italian;
  spoken.onerror = (event) => {
    if (!['interrupted','canceled'].includes(event.error)) status.textContent = 'Итальянский голос недоступен.';
  };
  synth.speak(spoken);
}
if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

function home() {
  const next = themes.find((theme) => quizCount(theme) < theme.items.length) || themes[0];
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <span class="tag">1 класс · 6+</span>
        <h1>Мой первый <span>итальянский</span></h1>
        <p><strong>Я Лино!</strong> Давай начнём с урока. Когда увидишь кнопку «Послушать», нажми её и повтори слово вслух.</p>
        <div class="buttons">${link(solved.size && solved.size < total ? 'Продолжить уроки' : 'Начать урок', '#lesson/' + next.id, true)}${link('Открыть тетрадь', '#book')}<button type="button" class="action" data-install-app>Установить тетрадь</button></div>
      </div>
      <div class="hero-art"><img src="lino.webp" alt="Лисёнок Лино с тетрадью" width="669" height="720"></div>
    </section>
    <section aria-labelledby="themes-heading">
      <div class="section-title"><h2 id="themes-heading">Выбери тему</h2><span>${themes.filter((theme) => quizCount(theme) === theme.items.length).length} из 6 пройдено</span></div>
      <div class="themes">${themes.map((theme) => `<a class="theme" style="--tile:${theme.color}" href="#lesson/${theme.id}"><span class="symbol" aria-hidden="true">${theme.icon}</span><span><strong>${theme.ru}</strong><small lang="it">${theme.it}</small></span>${quizCount(theme) === theme.items.length ? '<span class="done" aria-label="Пройдено">✓</span>' : ''}</a>`).join('')}</div>
    </section>`;
}

function lesson(theme) {
  let index = theme.items.findIndex((_, i) => !solved.has(`${theme.id}/${i}`));
  const themeIndex = themes.indexOf(theme);
  function render() {
    const count = quizCount(theme);
    const complete = index === -1 || index >= theme.items.length;
    const q = complete ? null : question(theme, index);
    const picture = q && wordPicture(q.word, theme.id);
    app.innerHTML = `<a href="#home">Все темы</a><h1 class="heading">${theme.ru}</h1>
      <div class="layout">
        <section class="panel" aria-labelledby="task-title">
          ${complete ? `<h2 id="task-title">Bravissimo! Тема пройдена!</h2>
          <p>Решено заданий: ${count} из ${theme.items.length}.</p><div class="buttons">
          ${themes[themeIndex + 1] ? link('Следующая тема', '#lesson/' + themes[themeIndex + 1].id, true) : link('К урокам', '#home', true)}
          ${button('Повторить тему','repeat')}</div>` : `
          <span class="tag">Задание ${index + 1} из ${theme.items.length}</span>
          <h2 id="task-title" class="prompt">${q.prompt}</h2>
          <div class="big-word" ${q.spoken ? 'lang="it"' : ''}>${q.word}</div>
          ${picture ? `<img class="lesson-picture" src="${artSource(picture)}" alt="" decoding="async">` : ''}
          ${q.spoken ? button('🔊 Послушать', 'listen') : ''}<p id="voice-status" class="muted" role="status"></p>
          ${q.options ? `<div class="options">${q.options.map((option,i) => `<button type="button" class="action option" data-option="${i}">${typeof option === 'string' ? option : `<span class="swatch" style="background:${option.color}" aria-hidden="true"></span>${option.label}`}</button>`).join('')}</div>` :
           `<form id="answer-form"><div class="write-row"><input class="answer" id="answer" aria-label="Ответ по-итальянски" spellcheck="false" autocomplete="off" autocapitalize="none" required lang="it"><button class="action primary" id="submit">Проверить</button></div>${keyboardMarkup()}</form>
           <div class="buttons">${button('Подсказка','hint')}</div>`}
          <p id="feedback" class="feedback" role="status"></p>
          <button type="button" class="action primary" id="next" hidden>Дальше</button>`}
        </section>
        <aside class="panel side"><div><h2 lang="it">${theme.it}</h2><span id="lesson-count">${count} / ${theme.items.length}</span><progress id="lesson-progress" class="progress" value="${count}" max="${theme.items.length}" aria-label="Прогресс по теме"></progress></div>${link('Страницы темы', '#book/' + theme.page)}${link('Слова темы', '#words/' + theme.id)}</aside>
      </div>`;
    if (complete) {
      node('repeat').onclick = () => { index = 0; render(); node('task-title').tabIndex = -1; node('task-title').focus(); };
      return;
    }
    const feedback = node('feedback');
    let correct = false;
    function check(value, option) {
      if (correct) return;
      const normalize = (text) => text.trim().toLocaleLowerCase('it').normalize('NFC');
      const matches = normalize(value) === normalize(q.answer);
      if (!matches) {
        option?.classList.add('wrong');
        feedback.classList.add('try');
        feedback.textContent = q.spoken
          ? 'Попробуй ещё раз! Лино советует послушать подсказку ещё раз.'
          : 'Попробуй ещё раз!';
        return;
      }
      correct = true;
      option?.classList.remove('wrong');
      option?.classList.add('correct');
      solved.add(`${theme.id}/${index}`);
      const saved = save('solved', [...solved]);
      updateScore();
      node('lesson-count').textContent = `${quizCount(theme)} / ${theme.items.length}`;
      node('lesson-progress').value = quizCount(theme);
      feedback.classList.remove('try');
      feedback.textContent = saved ? 'Верно! Молодец! ★' : 'Верно! Браузер не смог сохранить отметку.';
      node('next').hidden = false;
      node('next').focus();
    }
    if (q.spoken) node('listen').onclick = () => speech(q.spoken, node('voice-status'));
    if (q.options) {
      app.querySelectorAll('[data-option]').forEach((option) => {
        option.onclick = () => {
          const value = q.options[Number(option.dataset.option)];
          check(typeof value === 'string' ? value : value.label, option);
        };
      });
    } else {
      connectKeyboard(node('answer-form'), node('answer'));
      node('answer-form').onsubmit = (event) => { event.preventDefault(); check(node('answer').value); };
      node('hint').onclick = () => {
        if (correct) return;
        feedback.classList.remove('try');
        feedback.textContent = `Первая буква — ${q.hint.toUpperCase()}. Если нужно, загляни в словарь.`;
        node('answer').focus();
      };
    }
    node('next').onclick = () => {
      index++;
      render();
      node('task-title').tabIndex = -1;
      node('task-title').focus();
    };
  }
  render();
}

function dictionary(selected) {
  const pictures = sourcePictures(String(66 + themes.indexOf(selected)), 0);
  app.innerHTML = `<h1 class="heading">Словарь</h1><div class="panel">
    <label for="category">Тема</label>
    <select id="category">${themes.map((theme) => `<option value="${theme.id}" ${theme === selected ? 'selected' : ''}>${theme.ru} · ${theme.it}</option>`).join('')}</select>
    <p id="voice-status" class="muted" role="status"></p>
    ${pictures.length ? `<div class="source-gallery">${pictures.map(([id, alt]) => `<img src="${artSource(id)}" alt="${alt}" decoding="async">`).join('')}</div>` : ''}
    <div class="words">${(selected.words || selected.items).map(([word, translation, color]) => {
      const picture = wordPicture(word, selected.id);
      return `<div class="word">${picture ? `<img class="word-picture" src="${artSource(picture)}" alt="" loading="lazy" decoding="async">` : ''}<span><strong lang="it">${word}</strong><small>${color ? `<span class="swatch" style="background:${color}" aria-hidden="true"></span>` : ''}${translation}</small></span><button type="button" class="action" data-word="${word}" aria-label="Послушать ${word}">🔊</button></div>`;
    }).join('')}</div>
    </div>`;
  node('category').onchange = (event) => { location.hash = 'words/' + event.target.value; };
  app.querySelectorAll('[data-word]').forEach((item) => {
    item.onclick = () => speech(item.dataset.word, node('voice-status'));
  });
}

const pageIds = ['cover', 'contents', 'alphabet', ...Array.from({length:71}, (_, i) => String(i + 1))];
const titleForPage = (page) => {
  const special = {cover:'Обложка', contents:'Содержание', alphabet:'Таблица букв', 1:'Вступление'};
  if (special[page]) return special[page];
  const topic = themes.find((theme) => +page >= theme.page && +page <= theme.end);
  return topic ? `Стр. ${page} · ${topic.ru}` : `Стр. ${page} · Словарь`;
};
const inks = [
  ['#264ca0','Синий'], ['#e34d41','Красный'], ['#f7b925','Жёлтый'], ['#f27c28','Оранжевый'],
  ['#36985a','Зелёный'], ['#a75dcf','Фиолетовый'], ['#f287ad','Розовый'], ['#754630','Коричневый'], ['#252921','Чёрный']
];
let selectedTool = 'text';
let selectedInk = inks[0][0];

function notebook(page) {
  save('last-page', page);
  const pageIndex = pageIds.indexOf(page);
  const nearby = (offset, label) => pageIds[pageIndex + offset]
    ? link(label, '#paper/' + pageIds[pageIndex + offset])
    : `<button class="action" disabled>${label}</button>`;
  const pencilTools = [['text','Заполнить'],['pen','Карандаш'],['paint','Раскраска'],['line','Линия'],['erase','Ластик'],['read','Чтение']];
  const markKey = 'marks-' + page;
  const notesKey = 'notes-' + page;
  const answerKey = 'answers-' + page;
  const marks = read(markKey, []);
  const answers = read(answerKey, []);
  let editing = null;
  let pending = null;
  let pointerId = null;
  app.innerHTML = `<h1 class="heading">Оригинал тетради</h1>
    ${link('Открыть интерактивные задания', '#book/' + page, true)}
    <div class="book-nav">
      ${nearby(-1,'Назад')}<select id="page" aria-label="Страница">${pageIds.map((id) => `<option value="${id}" ${id === page ? 'selected' : ''}>${titleForPage(id)}</option>`).join('')}</select>${nearby(1,'Вперёд')}
    </div>
    <div class="layout book-layout">
      <section aria-label="Страница тетради">
        <div class="board">
          <img src="pages/${page}.webp" alt="${titleForPage(page)}">
          <canvas id="paper" width="775" height="1106" aria-label="Поле для записей и рисунков"></canvas>
          <div id="page-answers"></div>
          <form id="page-editor" class="page-editor" hidden>
            <label for="page-answer">Ответ на странице</label>
            <input id="page-answer" type="text" maxlength="90" lang="it" autocomplete="off" spellcheck="false">
            <div class="tools">
              <button class="action primary" type="submit">Сохранить</button>
              ${button('Отмена','cancel-answer')}
              ${button('Удалить','delete-answer')}
            </div>
          </form>
        </div>
      </section>
      <aside class="panel side" aria-label="Инструменты тетради">
        <h2>Инструменты</h2>
        <div class="tools">${pencilTools.map(([id,label]) => `<button type="button" class="action" data-tool="${id}">${label}</button>`).join('')}</div>
        <div class="palette" aria-label="Цвет">${inks.map(([hex,label]) => `<button type="button" class="color" data-ink="${hex}" style="--paint:${hex}" aria-label="${label}"></button>`).join('')}</div>
        <p class="book-tip muted" id="book-tip"></p>
        <div class="tools">${button('Отменить штрих','undo')}${button('✓ Страница готова','review')}</div>
        <span id="book-status" class="muted" role="status"></span>
      </aside>
      <section class="panel book-notes">
        <label for="notes">Мои ответы и заметки</label>
        <textarea id="notes" class="notes" rows="3" maxlength="5000"></textarea>
      </section>
    </div>`;
  const canvas = node('paper');
  const ctx = canvas.getContext('2d');
  const board = canvas.parentElement;
  const answerLayer = node('page-answers');
  const editor = node('page-editor');
  const answerInput = node('page-answer');
  const notes = node('notes');
  notes.value = read(notesKey, '');
  node('page').onchange = (event) => { location.hash = 'paper/' + event.target.value; };
  notes.oninput = () => status(save(notesKey, notes.value));
  const toolTip = {
    pen:'Пиши или рисуй пальцем или мышкой.',
    paint:'Проведи по картинке широкой цветной кистью.',
    line:'Нажми в начале линии и проведи до конца.',
    erase:'Проведи по своей записи, чтобы стереть её.',
    text:'Нажми на строку или клетку и напечатай ответ. Чтобы изменить его, нажми на свой текст.',
    read:'Листай и читай страницу.'
  };
  const status = (ok) => { node('book-status').textContent = ok ? 'Сохранено в этом браузере' : 'Браузер не смог сохранить изменения'; };
  function updateReview() {
    node('review').setAttribute('aria-pressed', String(reviewed.has(page)));
    node('review').textContent = reviewed.has(page) ? '✓ Готово' : 'Отметить готовой';
  }
  node('review').onclick = () => {
    if (reviewed.has(page)) reviewed.delete(page);
    else reviewed.add(page);
    status(save('reviewed', [...reviewed]));
    updateReview();
  };
  function updateTools() {
    canvas.dataset.tool = selectedTool;
    board.dataset.tool = selectedTool;
    canvas.tabIndex = selectedTool === 'text' ? 0 : -1;
    answerLayer.querySelectorAll('button').forEach((item) => { item.tabIndex = canvas.tabIndex; });
    node('book-tip').textContent = toolTip[selectedTool];
    app.querySelectorAll('button[data-tool]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.tool === selectedTool)));
    app.querySelectorAll('button[data-ink]').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.ink === selectedInk)));
  }
  app.querySelectorAll('button[data-tool]').forEach((item) => {
    item.onclick = () => {
      saveAnswer();
      selectedTool = item.dataset.tool;
      updateTools();
    };
  });
  app.querySelectorAll('button[data-ink]').forEach((item) => {
    item.onclick = () => { selectedInk = item.dataset.ink; updateTools(); };
  });
  function renderAnswers() {
    answerLayer.replaceChildren();
    answers.forEach((answer) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'page-entry';
      item.textContent = answer.value;
      item.setAttribute('aria-label', 'Изменить ответ: ' + answer.value);
      item.style.left = Math.min(answer.x, 95) + '%';
      item.style.top = answer.y + '%';
      item.style.color = answer.ink;
      item.tabIndex = selectedTool === 'text' ? 0 : -1;
      item.onclick = () => {
        saveAnswer();
        openEditor(answer.x, answer.y, answers.indexOf(answer), item);
      };
      answerLayer.append(item);
    });
  }
  function openEditor(x, y, index = -1, trigger = canvas) {
    editing = {x, y, index, trigger};
    answerInput.value = answers[index]?.value || '';
    node('delete-answer').hidden = index < 0;
    editor.style.setProperty('--answer-x', x + '%');
    editor.style.top = Math.max(0, y) + '%';
    editor.classList.toggle('above', y > 66);
    editor.hidden = false;
    answerInput.focus();
    answerInput.select();
  }
  function closeEditor(restoreFocus = false, answerIndex = -1) {
    if (!editing) return;
    const trigger = editing.trigger;
    editing = null;
    editor.hidden = true;
    if (restoreFocus) {
      const target = answerLayer.children[answerIndex] || (trigger.isConnected ? trigger : canvas);
      target.focus({preventScroll:true});
    }
  }
  function saveAnswer(restoreFocus = false) {
    if (!editing) return;
    const {x, y, index} = editing;
    const value = answerInput.value.trim();
    let answerIndex = index;
    if (value) {
      if (index < 0) {
        answerIndex = answers.length;
        answers.push({x, y, value, ink:selectedInk});
      } else {
        answers[index].value = value;
      }
      status(save(answerKey, answers));
      renderAnswers();
    }
    closeEditor(restoreFocus, answerIndex);
  }
  editor.onsubmit = (event) => { event.preventDefault(); saveAnswer(true); };
  const cancelEditing = () => closeEditor(true);
  node('cancel-answer').onclick = cancelEditing;
  editor.onkeydown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); cancelEditing(); }
  };
  node('delete-answer').onclick = () => {
    if (editing.index < 0) return;
    answers.splice(editing.index, 1);
    status(save(answerKey, answers));
    renderAnswers();
    closeEditor(true);
  };
  function draw(mark) {
    const {tool, ink, points, value} = mark;
    const [x, y] = points[0];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    if (tool === 'text') {
      ctx.font = '25px system-ui';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, Math.min(x, Math.max(0, canvas.width - ctx.measureText(value).width - 5)), y);
    } else {
      ctx.lineWidth = tool === 'paint' ? 26 : tool === 'erase' ? 32 : 4;
      if (tool === 'paint') ctx.globalAlpha = 0.36;
      if (tool === 'erase') ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (points.length === 1) ctx.lineTo(x + 0.1, y);
      else if (tool === 'line') ctx.lineTo(...points.at(-1));
      else points.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    marks.forEach(draw);
    if (pending) draw(pending);
    node('undo').disabled = !marks.length;
  }
  let baseline;
  function preview() {
    ctx.putImageData(baseline, 0, 0);
    draw(pending);
  }
  const position = (event) => {
    const rect = canvas.getBoundingClientRect();
    return [Math.round((event.clientX - rect.left) * canvas.width / rect.width), Math.round((event.clientY - rect.top) * canvas.height / rect.height)];
  };
  function finish() {
    if (!pending) return;
    marks.push(pending);
    pending = null;
    baseline = null;
    pointerId = null;
    node('undo').disabled = false;
    status(save(markKey, marks));
  }
  canvas.onpointerdown = (event) => {
    if (event.button !== 0 || pending || selectedTool === 'text') return;
    const point = position(event);
    pending = {tool:selectedTool, ink:selectedInk, points:[point]};
    baseline = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId);
    draw(pending);
  };
  canvas.onclick = (event) => {
    if (selectedTool !== 'text') return;
    const [x, y] = position(event);
    saveAnswer();
    openEditor(x / canvas.width * 100, y / canvas.height * 100);
  };
  canvas.onkeydown = (event) => {
    if (selectedTool !== 'text' || !['Enter',' '].includes(event.key)) return;
    event.preventDefault();
    saveAnswer();
    openEditor(20, 50);
  };
  canvas.onpointermove = (event) => {
    if (!pending || event.pointerId !== pointerId) return;
    const point = position(event);
    const [x, y] = pending.points.at(-1);
    if (x === point[0] && y === point[1]) return;
    if (pending.tool === 'line') pending.points[1] = point;
    else pending.points.push(point);
    preview();
  };
  canvas.onpointerup = (event) => {
    if (event.pointerId !== pointerId) return;
    canvas.onpointermove(event);
    finish();
  };
  canvas.onpointercancel = canvas.onlostpointercapture = (event) => {
    if (event.pointerId === pointerId) finish();
  };
  node('undo').onclick = () => {
    if (pending) return;
    marks.pop();
    redraw();
    status(save(markKey, marks));
  };
  const persistPage = () => { saveAnswer(); finish(); };
  window.addEventListener('pagehide', persistPage);
  leave = () => {
    window.removeEventListener('pagehide', persistPage);
    persistPage();
  };
  updateReview();
  updateTools();
  renderAnswers();
  redraw();
}

function route() {
  leave();
  leave = () => {};
  stopSpeech();
  const [section, value] = location.hash.slice(1).split('/');
  const theme = themes.find((item) => item.id === value);
  const active = section === 'paper' ? 'book' : ['book','words'].includes(section) ? section : 'home';
  document.querySelectorAll('nav a').forEach((item) => {
    if (item.hash === '#' + active) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  });
  if (section === 'lesson' && theme) lesson(theme);
  else if (section === 'book' || section === 'paper') {
    const lastPage = read('last-page', '2');
    const page = pageIds.includes(value) ? value : pageIds.includes(lastPage) ? lastPage : '2';
    if (section === 'paper') notebook(page);
    else {
      save('last-page',page);
      leave = mountMobile(app,{page,pages:pageIds,pageTitle:titleForPage,read,save,speech,artSource});
    }
  }
  else if (section === 'words') dictionary(theme || themes[0]);
  else home();
  if (lastRoute !== section || section === 'book') window.scrollTo(0, 0);
  else if (section === 'paper') document.querySelector('.book-nav').scrollIntoView({block:'nearest'});
  lastRoute = section;
}
window.addEventListener('hashchange', route);
updateScore();
route();
