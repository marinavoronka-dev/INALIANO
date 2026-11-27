const padWidth = 700;

function getRegion(pixels, width, height, x, y) {
  const start = y * width + x;
  const pass = (pixel) => Math.min(pixels[pixel * 4], pixels[pixel * 4 + 1], pixels[pixel * 4 + 2]) > 150;
  if (!pass(start)) return [];
  const queue = new Int32Array(width * height);
  const visited = new Uint8Array(width * height);
  queue[0] = start;
  visited[start] = 1;
  let size = 1;
  const add = (cell) => {
    if (!visited[cell] && pass(cell)) {
      visited[cell] = 1;
      queue[size++] = cell;
    }
  };
  for (let i = 0; i < size; i++) {
    const cell = queue[i];
    if (cell % width) add(cell - 1);
    if (cell % width !== width - 1) add(cell + 1);
    if (cell >= width) add(cell - width);
    if (cell < width * (height - 1)) add(cell + width);
  }
  return queue.subarray(0, size);
}

export function mountPad(host, {guide, asset, source, initial, onChange, palette}) {
  const marks = initial.slice();
  let mode = asset ? 'fill' : 'draw';
  let ink = palette[0][0];
  let active;
  let original;
  let ready = false;
  const regions = new Map();
  host.innerHTML = `
    <div class="pad-quick-actions"><button type="button" class="action" data-pad-expand>На весь экран</button></div>
    <div class="pad-surface">
    <div class="pad-tools" aria-label="Инструменты">
      ${asset ? '<button type="button" class="action" data-mode="fill">Заливка</button>' : ''}
      <button type="button" class="action" data-mode="draw">${asset ? 'Кисть' : 'Карандаш'}</button>
      <button type="button" class="action" data-mode="erase">Ластик</button>
      <button type="button" class="action" data-pad-undo>Отменить</button>
    </div>
    <div class="pad-palette">${palette.map(([hex, label]) => `<button type="button" class="pad-color" aria-label="${label}" data-ink="${hex}" style="--paint:${hex}"><i></i><span>${label}</span></button>`).join('')}</div>
    <div class="pad-frame"><canvas class="pad-base" aria-hidden="true"></canvas><canvas class="pad-ink" aria-label="${guide ? 'Поле для письма пальцем' : 'Поле для раскрашивания'}"></canvas></div>
    <p class="pad-status muted" role="status"></p></div>
    <dialog class="pad-dialog" aria-label="${guide ? 'Пропись на весь экран' : 'Рисунок на весь экран'}">
      <div class="pad-dialog-bar"><strong>${guide ? 'Пропись' : 'Рисунок'}</strong>
        <button type="button" class="action primary" data-pad-close>Вернуться</button></div>
    </dialog>`;
  const panel = host.querySelector('.pad-dialog');
  const surface = host.querySelector('.pad-surface');
  const expand = host.querySelector('[data-pad-expand]');
  const close = host.querySelector('[data-pad-close]');
  expand.hidden = typeof panel.showModal !== 'function';
  expand.onclick = () => {
    finish();
    panel.append(surface);
    panel.showModal();
    close.focus();
  };
  close.onclick = () => { if (panel.open) panel.close(); };
  close.onpointerup = (event) => {
    if (event.pointerType === 'touch' && panel.open) {
      event.preventDefault();
      panel.close();
    }
  };
  panel.onclose = () => {
    finish();
    host.insertBefore(surface, panel);
    expand.focus({preventScroll:true});
  };
  const base = host.querySelector('.pad-base');
  const canvas = host.querySelector('.pad-ink');
  const background = base.getContext('2d',{willReadFrequently:true});
  const ctx = canvas.getContext('2d',{willReadFrequently:true});
  const status = host.querySelector('.pad-status');
  const undo = host.querySelector('[data-pad-undo]');
  const prompt = () => mode === 'fill' ? 'Коснись части рисунка, чтобы заполнить её цветом.' :
    mode === 'erase' ? 'Проведи по штриху, чтобы стереть его. Заливку можно отменить.' :
    guide ? 'Проведи пальцем по светлым буквам. Затем напиши сам на нижней строке.' : 'Веди пальцем или мышью, чтобы рисовать.';
  function toolbar() {
    host.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === mode)));
    host.querySelectorAll('[data-ink]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.ink === ink)));
    undo.disabled = !marks.length;
    status.textContent = prompt();
    canvas.dataset.mode = mode;
  }
  function dimensions(height) {
    base.width = canvas.width = padWidth;
    base.height = canvas.height = height;
    host.querySelector('.pad-frame').style.setProperty('--pad-ratio', padWidth / height);
    background.fillStyle = '#fff';
    background.fillRect(0,0,padWidth,height);
  }
  function stroke(mark) {
    const {kind, color, points} = mark;
    const [x,y] = points[0];
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = kind === 'erase' ? 36 : guide ? 9 : 16;
    ctx.strokeStyle = color;
    if (kind === 'erase') ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(x,y);
    if (points.length === 1) ctx.lineTo(x + .1,y);
    else for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
    ctx.stroke();
    ctx.restore();
  }
  function flood(mark) {
    if (!original) return false;
    const {x,y,color} = mark;
    const index = y * canvas.width + x;
    let cells = regions.get(index);
    if (!cells) {
      cells = getRegion(original.data, canvas.width, canvas.height, x, y);
      if (regions.size >= 6) regions.clear();
      regions.set(index,cells);
    }
    if (!cells.length) return false;
    if (cells.some(cell => cell < canvas.width || cell >= canvas.width * (canvas.height - 1) ||
      cell % canvas.width === 0 || cell % canvas.width === canvas.width - 1)) return false;
    const data = ctx.getImageData(0,0,canvas.width,canvas.height);
    const rgb = [1,3,5].map(offset => parseInt(color.slice(offset,offset + 2),16));
    for (const cell of cells) {
      const index = cell * 4;
      data.data[index] = rgb[0];
      data.data[index + 1] = rgb[1];
      data.data[index + 2] = rgb[2];
      data.data[index + 3] = 255;
    }
    ctx.putImageData(data,0,0);
    return true;
  }
  function redraw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const mark of marks) {
      if (mark.kind === 'fill') flood(mark);
      else stroke(mark);
    }
    toolbar();
  }
  function update() {
    onChange(marks.slice());
    toolbar();
  }
  function finish() {
    if (!active) return;
    marks.push(active);
    active = null;
    update();
  }
  function position(event) {
    const rect = canvas.getBoundingClientRect();
    const clamp = (value, max) => Math.max(0,Math.min(max - 1,Math.floor(value)));
    return [clamp((event.clientX - rect.left) * canvas.width / rect.width, canvas.width),
      clamp((event.clientY - rect.top) * canvas.height / rect.height, canvas.height)];
  }
  canvas.onpointerdown = (event) => {
    if (!ready || active || event.button !== 0 || mode === 'fill') return;
    const [x,y] = position(event);
    active = {kind:mode,color:ink,points:[[x,y]]};
    canvas.setPointerCapture(event.pointerId);
    stroke(active);
  };
  canvas.onclick = (event) => {
    if (!ready || mode !== 'fill') return;
    const [x,y] = position(event);
    const mark = {kind:'fill',x,y,color:ink};
    if (!flood(mark)) {
      status.textContent = 'Коснись внутри замкнутого контура. Для открытых деталей выбери кисть.';
      return;
    }
    marks.push(mark);
    update();
  };
  canvas.onpointermove = (event) => {
    if (!active || !canvas.hasPointerCapture(event.pointerId)) return;
    const point = position(event);
    const [x,y] = active.points.at(-1);
    if (point[0] === x && point[1] === y) return;
    active.points.push(point);
    stroke({kind:active.kind,color:active.color,points:[[x,y],point]});
  };
  canvas.onpointerup = (event) => {
    canvas.onpointermove(event);
    if (canvas.hasPointerCapture(event.pointerId)) finish();
  };
  canvas.onpointercancel = canvas.onlostpointercapture = finish;
  undo.onclick = () => {
    finish();
    if (!marks.length) return;
    marks.pop();
    redraw();
    update();
  };
  host.querySelectorAll('[data-mode]').forEach(button => {
    button.onclick = () => { finish(); mode = button.dataset.mode; toolbar(); };
  });
  host.querySelectorAll('[data-ink]').forEach(button => {
    button.onclick = () => { ink = button.dataset.ink; if (mode === 'erase') mode = asset ? 'fill' : 'draw'; toolbar(); };
  });

  if (asset) {
    dimensions(500);
    const image = new Image();
    image.onload = () => {
      dimensions(Math.round(image.naturalHeight / image.naturalWidth * padWidth));
      background.drawImage(image,0,0,base.width,base.height);
      original = background.getImageData(0,0,base.width,base.height);
      ready = true;
      redraw();
    };
    image.onerror = () => { status.textContent = 'Рисунок не загрузился. Перезагрузи страницу.'; };
    image.src = source(asset);
  } else {
    dimensions(guide ? 370 : 470);
    if (guide) {
      background.strokeStyle = '#d1dceb';
      background.lineWidth = 2;
      for (const y of [55,155,202,313]) {
        background.beginPath();
        background.moveTo(24,y);
        background.lineTo(padWidth - 24,y);
        background.stroke();
      }
      background.fillStyle = '#b8c7d9';
      background.font = '600 ' + (guide.length > 6 ? '110' : '135') + 'px Arial, sans-serif';
      background.textAlign = 'center';
      background.fillText(guide,padWidth / 2,155,padWidth - 65);
    }
    ready = true;
    redraw();
  }
  toolbar();
  return finish;
}
