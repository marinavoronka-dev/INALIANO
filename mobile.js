import {themes} from './data.js';
import {activitiesFor, produce} from './activities.js';
import {mountPad} from './art-pad.js';
import {sourcePictures, wordPicture} from './illustrations.js';
import {keyboardMarkup, connectKeyboard} from './keyboard.js';

const colorMap = new Map(themes[2].items.map(([it,ru,hex]) => [it,[hex,ru]]));
colorMap.set('marrone',['#815039','коричневый']);
const defaultPalette = ['blu','rosso','giallo','verde','arancione','rosa','viola','marrone','nero','azzurro','grigio','bianco'];
const symbols = {read:'🔊',trace:'✍',art:'🎨',letterpaint:'🎨',produce:'🥕',match:'🧩',pick:'☑',type:'⌨',sort:'🧩',select:'☑',crossword:'▦',search:'🔎',free:'✎'};
const labels = {read:'Читать',trace:'Прописи',art:'Рисовать',letterpaint:'Раскрасить',produce:'Овощи',match:'Пары',pick:'Выбор',type:'Ответы',sort:'Собрать',select:'Выбор',crossword:'Кроссворд',search:'Поиск',free:'Рассказ'};
const escape = (value) => String(value).replace(/[&<>"']/g, letter => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[letter]);
const choice = (text, disabled = false, extra = '') => `<button type="button" class="action" ${disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
const normalize = (value) => value.toLocaleLowerCase('it').normalize('NFC').replace(/[!?.,]/g,'').replace(/\s+/g,' ').trim();
const enabled = ' aria-pressed="true"';
const soundButton = '<button type="button" class="action sound-button" aria-label="Послушать">🔊</button>';
const correctly = 'Верно! ★';
const retry = 'Почти! Попробуй ещё раз.';
const checks = (solved, index, expected) => solved.includes(index) ? ' ✓' : expected ? ' ' + expected : '';
const jumble = (options, offset = 0) => options.map((_, i) => options[(options.length - 1 - i + offset) % options.length]);

function crossGrid(items, layout) {
  const cells = new Map();
  const entries = items.map(([clue, answer], index) => {
    const [number, dir, col, row] = layout[index];
    const slots = Array.from(answer, (letter, pos) => {
      const x = col + (dir === 'h' ? pos : 0);
      const y = row + (dir === 'v' ? pos : 0);
      const id = x + '/' + y;
      if (!cells.has(id)) cells.set(id,{letter,x,y,entries:[]});
      cells.get(id).entries.push(index);
      return id;
    });
    return {clue,answer,slots,dir,number};
  });
  const all = Array.from(cells.values());
  return {cells,entries,minX:Math.min(...all.map(c=>c.x)),maxX:Math.max(...all.map(c=>c.x)),minY:Math.min(...all.map(c=>c.y)),maxY:Math.max(...all.map(c=>c.y))};
}

export function mountMobile(app, {page, pages, pageTitle, read, save, speech, artSource}) {
  const steps = activitiesFor(page);
  const key = 'mobile-' + page;
  const data = read(key, {});
  const pageIndex = pages.indexOf(page);
  let stepIndex = Math.max(0, Math.min(data.step ?? 0, steps.length - 1));
  let stopPad = () => {};
  let activeSearch;
  let moves = [];
  let activePair;
  let gridForStep;
  const byId = id => app.querySelector('#' + id);
  function gallery() {
    const pictures = sourcePictures(page, stepIndex);
    if (!pictures.length) return '';
    return `<div class="source-gallery ${pictures.length > 1 ? 'source-gallery-grid' : ''}">${pictures.map(([id, alt]) =>
      `<img src="${artSource(id)}" alt="${escape(alt)}" decoding="async">`).join('')}</div>`;
  }
  function termPicture(term) {
    const topic = themes.find(theme => +page >= theme.page && +page <= theme.end);
    const theme = +page >= 66 ? themes[+page - 66] : topic;
    const id = wordPicture(term, theme?.id);
    return id ? `<img class="word-picture" src="${artSource(id)}" alt="" loading="lazy" decoding="async">` : '';
  }
  const bookLink = (target,label, primary = false) => `<a class="action ${primary ? 'primary' : ''}" href="#book/${target}">${label}</a>`;
  const neighbors = (offset, label) => pages[pageIndex + offset] ? bookLink(pages[pageIndex + offset],label) : choice(label,true);
  function persist() {
    if (!save(key,data)) byId('mobile-storage').textContent = 'Браузер не смог сохранить работу. Освободи место для данных сайта.';
  }

  app.innerHTML = `<section class="mobile-book">
    <div class="mobile-book-heading"><div><span class="tag">Интерактивная тетрадь</span><h1>${escape(pageTitle(page))}</h1></div>
    <a class="original-link" href="#paper/${page}">Оригинал PDF</a></div>
    <div class="mobile-book-nav" aria-label="Страницы">
      ${neighbors(-1,'‹ Назад')}
      <select id="mobile-page" aria-label="Страница">${pages.map(id => `<option value="${id}" ${id === page ? 'selected' : ''}>${escape(pageTitle(id))}</option>`).join('')}</select>
      ${neighbors(1,'Дальше ›')}
    </div>
    ${page === 'contents' ? '' : '<a class="book-toc" href="#book/contents">Содержание</a>'}
    <div id="mobile-steps" class="mobile-steps" aria-label="Задания страницы"></div>
    <div id="mobile-task"></div>
    <div id="mobile-storage" role="status"></div>
  </section>`;
  byId('mobile-page').onchange = event => { location.hash = 'book/' + event.target.value; };

  function focusTitle() {
    const title = byId('mobile-title');
    title?.focus({preventScroll:true});
    title?.scrollIntoView({block:'nearest'});
  }
  function setStep(index) {
    stopPad();
    stepIndex = index;
    data.step = index;
    activeSearch = undefined;
    activePair = undefined;
    moves = [];
    gridForStep = undefined;
    render();
    persist();
    focusTitle();
  }
  const state = () => data[stepIndex] ??= {done:false, index:0, solved:[], values:{}, pads:{}};
  function markDone() {
    state().done = true;
    persist();
    renderStepper();
    renderFooter();
  }
  function renderStepper() {
    if (page === 'alphabet') return;
    byId('mobile-steps').innerHTML = steps.map((step, i) =>
      `<button type="button" data-step="${i}" class="action" ${i === stepIndex ? enabled : ' aria-pressed="false"'}>${data[i]?.done ? '✓' : symbols[step.type]} ${labels[step.type]}</button>`).join('');
    byId('mobile-steps').querySelectorAll('button').forEach(button => button.onclick = () => setStep(+button.dataset.step));
  }
  function renderFooter() {
    const done = steps.filter((_,i) => data[i]?.done).length;
    const last = stepIndex === steps.length - 1;
    byId('mobile-task-footer').innerHTML = `<span class="mobile-count">${done === steps.length ? '★ Страница пройдена!' : '★ ' + done + ' из ' + steps.length}</span>
      ${last ? (pages[pageIndex + 1] ? bookLink(pages[pageIndex + 1],'Следующая страница',true) : bookLink('contents','К содержанию',true)) :
      '<button type="button" class="action primary" id="continue-task">Следующее задание</button>'}`;
    if (!last) byId('continue-task').onclick = () => setStep(stepIndex + 1);
  }

  function render() {
    stopPad();
    stopPad = () => {};
    renderStepper();
    const step = steps[stepIndex];
    const host = byId('mobile-task');
    if (page === 'contents') {
      const items = [
        ['alphabet','Таблица букв',''],
        ['1','Вступление','1'],
        ...themes.map(theme => [String(theme.page),theme.ru,String(theme.page),theme.it]),
        ['66','Словарь','66','Dizionario']
      ];
      host.innerHTML = `<nav class="mobile-card toc-card" aria-label="Содержание тетради">
        <p>Нажми на раздел, чтобы открыть его страницу.</p>
        <ul>${items.map(([id,label,number,italian]) => `<li><a href="#book/${id}"><span><strong>${label}</strong>${italian ? `<small lang="it">${italian}</small>` : ''}</span>
            <span class="toc-number">${number ? 'стр. ' + number : 'Открыть'}</span></a></li>`).join('')}</ul>
        </nav>`;
      return;
    }
    if (!step) {
      host.innerHTML = `<article class="mobile-card"><h2 id="mobile-title" tabindex="-1">${page === 'cover' ? 'Benvenuto! Добро пожаловать!' : 'Выбери тему'}</h2>
        ${gallery()}
        <div class="theme-picks">${themes.map(theme => `<a class="theme" style="--tile:${theme.color}" href="#book/${theme.page}"><span class="symbol" aria-hidden="true">${theme.icon}</span><span><strong>${theme.ru}</strong><small lang="it">${theme.it}</small></span></a>`).join('')}</div></article>`;
      return;
    }
    const galleryBelow = page === '43' || page === '52';
    host.innerHTML = `<article class="mobile-card">
      <h2 id="mobile-title" tabindex="-1">${escape(step.title)}</h2>
      ${galleryBelow ? '' : gallery()}
      <div id="mobile-content"></div>
      ${galleryBelow ? gallery() : ''}
      <p id="mobile-feedback" class="mobile-feedback" role="status"></p>
      <div id="mobile-task-footer" class="mobile-footer"></div>
      </article>`;
    const body = byId('mobile-content');
    const current = state();
    const feedback = text => { byId('mobile-feedback').textContent = text; };
    function solve(index, size) {
      if (!current.solved.includes(index)) current.solved.push(index);
      if (current.solved.length === size) markDone();
      else persist();
    }
    function itemNav(items, label = 'Вопрос') {
      const i = current.index;
      return `<div class="item-nav">
        ${choice('‹',i === 0,' data-item="-1" aria-label="Предыдущий"')}
        <span>${label} ${i + 1} из ${items.length}${checks(current.solved,i)}</span>
        ${choice('›',i === items.length - 1,' data-item="1" aria-label="Следующий"')}
      </div>`;
    }
    function moveItem(offset) {
      current.index += offset;
      activePair = undefined;
      moves = [];
      persist();
      render();
    }
    function connectNav() {
      body.querySelectorAll('[data-item]').forEach(button => button.onclick = () => moveItem(+button.dataset.item));
    }
    function nextAction(items) {
      if (current.index < items.length - 1) {
        feedback('');
        byId('mobile-feedback').innerHTML = `<span>${correctly}</span> ${choice('Следующий',false,'id="next-item"')}`;
        byId('next-item').onclick = () => moveItem(1);
      } else feedback(correctly);
    }
    function connectSpeaker(button, word) {
      button.onclick = () => { feedback(''); speech(word,byId('mobile-feedback')); };
    }
    function renderPad(container, guide, asset, selected, inks, done) {
      const palette = (inks || (guide ? ['blu','rosso','verde'] : defaultPalette)).map(color => colorMap.get(color));
      stopPad = mountPad(container,{guide,asset,source:artSource, palette,initial:current.pads[selected] || [], onChange: marks => {
        current.pads[selected] = marks;
        persist();
        if (done) done(marks);
      }});
    }

    if (step.type === 'read') {
      const words = page === 'alphabet'
        ? `<p>Нажми на букву, чтобы услышать её название.</p><div class="alphabet-grid">${step.items.map(([term,pronunciation],i) =>
          `<button type="button" class="action" data-sound="${i}" aria-label="Послушать ${escape(term)}"><strong lang="it">${escape(term)}</strong><small lang="it">${escape(pronunciation)}</small></button>`).join('')}</div>`
        : `<div class="mobile-wordlist">${step.items.map(([term,translation,color],i) => `<div class="mobile-word">${termPicture(term)}<div><strong ${page === '1' ? '' : 'lang="it"'}>${escape(term)}</strong><span>${color ? `<i class="swatch" style="background:${color}"></i>` : ''}${escape(translation)}</span></div>${page === '1' ? '' : soundButton.replace('aria-label="Послушать"',`data-sound="${i}" aria-label="Послушать ${escape(term)}"`)}</div>`).join('')}</div>`;
      body.innerHTML = `${words}
      ${choice(current.done ? '✓ Прочитано' : 'Я прочитал',current.done,'id="done-read"')}`;
      body.querySelectorAll('[data-sound]').forEach(button => {
        const [word,,,voice] = step.items[+button.dataset.sound];
        connectSpeaker(button,voice || word);
      });
      byId('done-read').onclick = () => { markDone(); render(); };
    } else if (step.type === 'trace') {
      const sample = step.samples[current.index];
      const pronunciation = themes[0].items.find(([letter]) => sample.startsWith(letter + ' '))?.[1] || sample;
      body.innerHTML = `${itemNav(step.samples,'Пропись')}<div class="tools">${choice('🔊 Послушать',false,'id="trace-sound"')}</div>
        <div id="pad"></div>${choice(current.solved.includes(current.index) ? '✓ Пропись готова' : 'Я написал',!(current.pads[current.index]?.length) || current.solved.includes(current.index),'id="done-pad"')}`;
      connectNav();
      connectSpeaker(byId('trace-sound'),pronunciation);
      const done = byId('done-pad');
      renderPad(byId('pad'),sample,null,current.index,undefined,marks => { done.disabled = !marks.length || current.solved.includes(current.index); });
      done.onclick = () => { solve(current.index,step.samples.length); done.disabled = true; done.textContent = '✓ Пропись готова'; nextAction(step.samples); };
    } else if (step.type === 'letterpaint') {
      const {guide} = step;
      const inks = step.inks || defaultPalette.slice(0,8);
      const ink = inks.includes(current.ink) ? current.ink : inks[0];
      if (guide && current.solved.length) {
        // Retain correct answers saved under the earlier multiple-choice activity.
        current.solved.forEach(index => {
          const letter = step.items[index];
          if (letter && !current.values[letter]) current.values[letter] = guide[letter];
        });
        current.solved = [];
        persist();
      }
      const filled = step.items.filter(letter => current.values[letter]).length;
      const wrong = guide ? step.items.filter(letter => current.values[letter] !== guide[letter]) : [];
      const locked = guide && current.done;
      body.innerHTML = `<p>Выбери цвет, потом коснись буквы. Чтобы изменить цвет буквы, раскрась её ещё раз.</p>
      ${step.legend ? `<p class="art-legend">${escape(step.legend)}</p>` : ''}
      <div class="pad-palette" role="group" aria-label="Цвета">${inks.map(name => {
        const [hex,label] = colorMap.get(name);
        return `<button type="button" class="pad-color" data-letter-ink="${name}" style="--paint:${hex}" aria-pressed="${name === ink}" ${locked ? 'disabled' : ''}><i></i><span>${label}</span></button>`;
      }).join('')}</div><div class="letter-grid">${step.items.map(letter => {
        const [color,label] = colorMap.get(current.values[letter]) || ['white','без цвета'];
        const needsFix = current.checked && wrong.includes(letter);
        return `<button type="button" data-letter="${letter}" aria-label="${letter}, ${label}${needsFix ? ', проверь цвет' : ''}"
          class="${needsFix ? 'letter-needs-fix' : ''}" style="--letter-color:${color}" ${locked ? 'disabled' : ''}>${letter}</button>`;
      }).join('')}</div>
      <p aria-live="polite">Раскрашено: ${filled}${guide ? ' из ' + step.items.length : ''}</p>
      ${choice(current.done ? '✓ Буквы готовы' : guide ? 'Проверить' : 'Готово',current.done || filled < (guide ? step.items.length : 5),'id="done-letters"')}`;
      body.querySelectorAll('[data-letter-ink]').forEach(button => button.onclick = () => {
        current.ink = button.dataset.letterInk;
        persist();
        render();
        bodyFocus(`[data-letter-ink="${current.ink}"]`);
      });
      body.querySelectorAll('[data-letter]').forEach(button => button.onclick = () => {
        current.values[button.dataset.letter] = ink;
        persist();
        render();
        bodyFocus(`[data-letter="${button.dataset.letter}"]`);
      });
      byId('done-letters').onclick = () => {
        const message = wrong.length ? 'Проверь цвет у выделенных букв.' : 'Буквы раскрашены! ★';
        current.checked = true;
        if (!wrong.length) markDone();
        else persist();
        render();
        feedback(message);
      };
    } else if (step.type === 'art') {
      const canFinish = (marks) => marks.some(mark => mark.kind !== 'erase');
      body.innerHTML = `${step.captions ? `<p class="art-legend">${escape(step.captions)}</p>` : ''}<div id="pad"></div>${choice(current.done ? '✓ Рисунок готов' : 'Рисунок готов',current.done || !canFinish(current.pads[0] || []),'id="done-pad"')}`;
      const done = byId('done-pad');
      renderPad(byId('pad'),null,step.asset,0,step.inks,marks => { done.disabled = current.done || !canFinish(marks); });
      done.onclick = () => { markDone(); done.disabled = true; done.textContent = '✓ Рисунок готов'; feedback('Bellissimo! ★'); };
    } else if (step.type === 'produce') {
      const i = current.index;
      const [term, translation] = produce[i];
      const checkDone = () => {
        const ready = produce.every((_, index) => current.solved.includes(index) && current.pads[index]?.some(mark => mark.kind !== 'erase'));
        byId('done-produce').disabled = !ready || current.done;
      };
      body.innerHTML = `${itemNav(produce,'Овощ')}<div id="pad"></div><h3>Как называется этот овощ?</h3>
        <div class="answer-choices">${jumble([term,produce[(i+2)%12][0],produce[(i+7)%12][0]],i%3).map(name=>choice(escape(name),current.solved.includes(i),`data-produce="${name}"${name === term && current.solved.includes(i) ? enabled : ''}`)).join('')}</div>
        ${choice(current.done ? '✓ Овощи готовы' : 'Все овощи готовы',true,'id="done-produce"')}`;
      connectNav();
      renderPad(byId('pad'),null,'48-' + i,i,undefined,checkDone);
      checkDone();
      body.querySelectorAll('[data-produce]').forEach(button => button.onclick = () => {
        if (button.dataset.produce !== term) { feedback(retry); return; }
        current.solved.push(i);
        persist();
        button.setAttribute('aria-pressed','true');
        body.querySelectorAll('[data-produce]').forEach(option => { option.disabled = true; });
        feedback(correctly + ' ' + translation);
        checkDone();
      });
      byId('done-produce').onclick = () => { markDone(); render(); };
    } else if (step.type === 'pick') {
      const [prompt,expected] = step.items[current.index];
      const others = step.pool.filter(value => value !== expected);
      const options = jamOptions(expected,others,current.index);
      const letterColor = /^[A-Z]$/.test(prompt) ? colorMap.get(expected)?.[0] : null;
      body.innerHTML = `${itemNav(step.items)}<div class="task-word" id="choice-prompt"${letterColor && current.solved.includes(current.index) ? ` style="color:${letterColor}"` : ''}>${escape(prompt)}</div><div class="answer-choices">${options.map((option,i) => {
        const swatch = colorMap.get(option);
        return choice(`${swatch ? `<i class="swatch" style="background:${swatch[0]}"></i>` : ''}${escape(option)}`,current.solved.includes(current.index),`data-choice="${i}"${option === expected && current.solved.includes(current.index) ? enabled : ''}`);
      }).join('')}</div>`;
      connectNav();
      body.querySelectorAll('[data-choice]').forEach(button => button.onclick = () => {
        if (options[+button.dataset.choice] !== expected) { feedback(retry); return; }
        solve(current.index,step.items.length);
        if (letterColor) byId('choice-prompt').style.color = letterColor;
        button.setAttribute('aria-pressed','true');
        body.querySelectorAll('[data-choice]').forEach(option => { option.disabled = true; });
        nextAction(step.items);
      });
    } else if (step.type === 'match') {
      const largest = 7;
      const batch = step.items.slice(current.index * largest,(current.index + 1) * largest);
      const indexFor = i => current.index * largest + i;
      const blocks = Array.from({length:Math.ceil(step.items.length/largest)});
      body.innerHTML = `${blocks.length > 1 ? itemNav(blocks,'Набор') : ''}<p>Коснись слова слева, потом его пары справа.</p>
        <div class="match-board"><div>${batch.map(([prompt],i)=>choice(escape(prompt) + checks(current.solved,indexFor(i)),current.solved.includes(indexFor(i)),`data-pair-left="${i}"`)).join('')}</div>
        <div>${jumble(batch.map((_,i)=>i),1).map(i=>choice(escape(batch[i][1]) + checks(current.solved,indexFor(i)),current.solved.includes(indexFor(i)),`data-pair-right="${i}"`)).join('')}</div></div>`;
      connectNav();
      body.querySelectorAll('[data-pair-left]').forEach(button => button.onclick = () => {
        activePair = +button.dataset.pairLeft;
        body.querySelectorAll('[data-pair-left]').forEach(option => option.setAttribute('aria-pressed',String(+option.dataset.pairLeft === activePair)));
        feedback('Теперь коснись пары справа.');
      });
      body.querySelectorAll('[data-pair-right]').forEach(button => button.onclick = () => {
        if (activePair === undefined) { feedback('Сначала выбери слово слева.'); return; }
        if (+button.dataset.pairRight !== activePair) { feedback(retry); return; }
        solve(indexFor(activePair),step.items.length);
        activePair = undefined;
        render();
        feedback(correctly);
      });
    } else if (step.type === 'type' || step.type === 'crossword') {
      let grid;
      if (step.type === 'crossword') {
        grid = gridForStep ??= crossGrid(step.items,step.layout);
      }
      const [prompt,expected] = step.items[current.index];
      const input = (grid ? '<div class="letter-length">Букв: ' + expected.length + '</div>' : '');
      const gridMarkup = grid ? `<p><strong>${escape(step.instruction)}</strong> Выбери подсказку или клетку, введи ответ и нажми «Проверить».</p>${renderClues(grid,current)}${renderCrossword(grid,current)}` : '';
      body.innerHTML = `${gridMarkup}${itemNav(step.items,grid ? 'Слово' : 'Вопрос')}
        ${step.caption ? `<p class="art-legend">${escape(step.caption)}</p>` : ''}
        <form id="typed-form"><label class="task-word" for="typed-answer">${grid ? grid.entries[current.index].number + (grid.entries[current.index].dir === 'h' ? ' → · ' : ' ↓ · ') : ''}${escape(prompt)}</label>${input}
        <div class="write-row"><input id="typed-answer" type="text" lang="it" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="150" value="${escape(current.values[current.index] || '')}" required>
        <button type="submit" class="action primary">Проверить</button></div>
        ${keyboardMarkup()}</form>`;
      connectNav();
      const typed = byId('typed-answer');
      const storeDraft = () => { current.values[current.index] = typed.value; persist(); };
      typed.oninput = storeDraft;
      connectKeyboard(byId('typed-form'), typed);
      function openCrossAnswer(index) {
        moveItem(index - current.index);
        const field = byId('typed-answer');
        if (window.matchMedia('(pointer: coarse)').matches) field.scrollIntoView({block:'nearest'});
        else field.focus();
      }
      body.querySelectorAll('[data-clue]').forEach(button => button.onclick = () => {
        openCrossAnswer(+button.dataset.clue);
      });
      body.querySelectorAll('[data-cross]').forEach(button => button.onclick = () => {
        const entries = button.dataset.cross.split(',').map(Number);
        const next = entries[(entries.indexOf(current.index)+1)%entries.length];
        openCrossAnswer(next);
      });
      byId('typed-form').onsubmit = event => {
        event.preventDefault();
        if (normalize(typed.value) !== normalize(expected) && !(step.title.includes('алфавит по памяти') && normalize(typed.value).replaceAll(' ','') === normalize(expected).replaceAll(' ',''))) {
          feedback(retry + (grid ? ' Слово из ' + expected.length + ' букв.' : ''));
          return;
        }
        solve(current.index,step.items.length);
        if (grid) render();
        nextAction(step.items);
      };
    } else if (step.type === 'sort' || step.type === 'select') {
      const sorted = step.type === 'sort';
      const i = current.index;
      const prompt = sorted ? step.items[i][0] : '';
      const expected = sorted ? (step.pool ? step.items[i][1].split(' ') : [...step.items[i][1]]) : step.correct;
      const options = sorted ? (step.pool || [...prompt]) : step.options;
      const selected = sorted && current.solved.includes(i) ? expected : moves.map(id=>options[id]);
      body.innerHTML = `${sorted ? itemNav(step.items,'Слово') + `<div class="task-word">${escape(prompt)}</div><div class="sorted-answer" aria-live="polite">${selected.length ? selected.map(escape).join(step.pool ? ' · ' : '') : 'Нажимай по порядку'}</div>` : ''}
        <div class="token-grid">${options.map((option,index)=>choice(escape(option),sorted && moves.includes(index),`data-token="${index}" aria-pressed="${moves.includes(index)}"`)).join('')}</div>
        <div class="tools">${choice('Проверить',!moves.length,'id="check-moves"')}${choice(sorted ? 'Шаг назад' : 'Снять выбор',!moves.length,'id="clear-moves"')}</div>`;
      connectNav();
      body.querySelectorAll('[data-token]').forEach(button => button.onclick = () => {
        const id = +button.dataset.token;
        if (!sorted && moves.includes(id)) moves = moves.filter(value=>value !== id);
        else moves.push(id);
        render();
        bodyFocus('[data-token="' + id + '"]');
      });
      byId('clear-moves').onclick = () => { if (sorted) moves.pop(); else moves = []; render(); };
      byId('check-moves').onclick = () => {
        const chosen = moves.map(id=>options[id]);
        if (!sorted) chosen.sort();
        const correct = sorted ? expected : [...expected].sort();
        if (chosen.join('|') !== correct.join('|')) { feedback(retry); return; }
        if (sorted) { solve(i,step.items.length); nextAction(step.items); }
        else { markDone(); feedback(correctly); }
      };
    } else if (step.type === 'search') {
      const cellSpan = (row,index) => current.values[row]?.some(([a,b])=>index>=a&&index<=b);
      body.innerHTML = `<p>Нажми на первую и последнюю букву слова в одной строке.</p>
        <div class="search-pool">${step.targets.map((word,i)=>`<span class="${current.solved.includes(i) ? 'found' : ''}">${escape(word)}</span>`).join('')}</div>
        <div class="scroll-grid"><div class="find-grid">${step.rows.map((row,r)=>`<div class="find-row">${[...row].map((letter,c)=>`<button type="button" class="find-cell ${cellSpan(r,c) ? 'found' : ''}" data-row="${r}" data-column="${c}" aria-label="${letter}, строка ${r+1}, буква ${c+1}" aria-pressed="${activeSearch?.row === r && activeSearch?.col === c}">${letter}</button>`).join('')}</div>`).join('')}</div></div>`;
      const scroller = body.querySelector('.scroll-grid');
      scroller.scrollLeft = current.scroll || 0;
      body.querySelectorAll('[data-column]').forEach(button=>button.onclick = () => {
        const row = +button.dataset.row, col = +button.dataset.column;
        current.scroll = scroller.scrollLeft;
        if (activeSearch?.row !== row) {
          activeSearch = {row,col};
          render();
          bodyFocus(`[data-row="${row}"][data-column="${col}"]`);
          return;
        }
        const a = Math.min(col,activeSearch.col), b = Math.max(col,activeSearch.col);
        const result = step.rows[row].slice(a,b+1).toLowerCase();
        const index = step.targets.indexOf(result);
        activeSearch = undefined;
        if (index >= 0 && !current.solved.includes(index)) {
          (current.values[row] ??= []).push([a,b]);
          solve(index,step.targets.length);
        }
        render();
        feedback(index >= 0 ? correctly : 'Это ещё не слово из списка. Попробуй снова!');
        bodyFocus(`[data-row="${row}"][data-column="${col}"]`);
      });
    } else if (step.type === 'free') {
      body.innerHTML = `<div class="mobile-writing">${step.items.map((prompt,i) => `<label>${escape(prompt)}<textarea data-draft="${i}" lang="it" rows="2" maxlength="1500">${escape(current.values[i] || '')}</textarea></label>`).join('')}</div>
        ${choice(current.done ? '✓ Записано' : 'Мой ответ готов',current.done || !Object.values(current.values).some(text=>text.trim()),'id="finish-free"')}`;
      const finish = byId('finish-free');
      body.querySelectorAll('[data-draft]').forEach(field => field.oninput = () => {
        current.values[field.dataset.draft] = field.value;
        finish.disabled = current.done || !Object.values(current.values).some(text=>text.trim());
        persist();
      });
      finish.onclick = () => { markDone(); render(); };
    }
    function bodyFocus(selector) { byId('mobile-content').querySelector(selector)?.focus({preventScroll:true}); }
    renderFooter();
  }

  render();
  return () => { stopPad(); };
}

function jamOptions(expected, others, index) {
  const options = [expected];
  for (let i = 0; i < Math.min(3,others.length); i++) options.push(others[(index+i)%others.length]);
  return jumble(options,index % options.length);
}

function renderCrossword(grid,current) {
  const {cells,entries,minX,minY,maxX,maxY} = grid;
  const active = entries[current.index].slots;
  const revealed = new Set(current.solved.flatMap(index=>entries[index].slots));
  let markup = '';
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const id = x + '/' + y;
    const cell = cells.get(id);
    if (!cell) { markup += '<div></div>'; continue; }
    const starts = cell.entries.filter(index=>entries[index].slots[0]===id).map(index=>entries[index].number);
    markup += `<button type="button" class="cross-cell ${active.includes(id) ? 'active' : ''}" data-cross="${cell.entries.join(',')}" aria-label="Клетка слова ${cell.entries.map(index=>entries[index].number + (entries[index].dir === 'h' ? ' по горизонтали' : ' по вертикали')).join(' или ')}">
      <small>${[...new Set(starts)].join('/')}</small>${revealed.has(id) ? escape(cell.letter.toUpperCase()) : ''}</button>`;
  }
  return `<div class="scroll-grid"><div class="cross-grid" style="--columns:${maxX-minX+1}">${markup}</div></div>`;
}

function renderClues(grid, current) {
  return `<div class="cross-clues">${[['h','По горизонтали'],['v','По вертикали']].map(([dir,title]) =>
    `<section><h3>${title}</h3><div>${grid.entries
      .map((entry,index) => ({...entry,index}))
      .filter(entry => entry.dir === dir)
      .sort((a,b) => a.number - b.number)
      .map(({number,clue,index}) => choice(
        number + '. ' + escape(clue) + checks(current.solved,index), false,
        `data-clue="${index}" aria-pressed="${index === current.index}"`)).join('')}</div></section>`
  ).join('')}</div>`;
}
