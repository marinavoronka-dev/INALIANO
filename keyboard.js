const latin = 'abcdefghijklmnopqrstuvwxyz';
const accented = 'àèéìòóù';
const letters = (set) => Array.from(set, key =>
  `<button type="button" class="action" data-key="${key}">${key}</button>`).join('');

export function keyboardMarkup() {
  return `<div class="italian-keyboard" role="group" aria-label="Итальянская клавиатура">
    <p>Итальянская клавиатура</p>
    <div class="keyboard-letters" lang="it">${letters(latin)}</div>
    <div class="keyboard-controls">
      <button type="button" class="action" data-key=" ">Пробел</button>
      <button type="button" class="action" data-key="'" aria-label="Апостроф">’</button>
      <button type="button" class="action" data-key="backspace" aria-label="Удалить букву">⌫</button>
    </div>
    <details><summary>Буквы с ударением</summary><div class="keyboard-letters" lang="it">${letters(accented)}</div></details>
  </div>`;
}

export function connectKeyboard(form, input) {
  const keyboard = form.querySelector('.italian-keyboard');
  // Keep the caret and the native keyboard state when a key is tapped.
  keyboard.addEventListener('mousedown', (event) => {
    if (event.target.closest('[data-key]')) event.preventDefault();
  });
  keyboard.addEventListener('click', (event) => {
    const button = event.target.closest('[data-key]');
    if (!button) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const key = button.dataset.key;
    if (key === 'backspace') {
      input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
    } else {
      if (input.maxLength >= 0 && input.value.length - (end - start) >= input.maxLength) return;
      input.setRangeText(key, start, end, 'end');
    }
    input.dispatchEvent(new Event('input', {bubbles:true}));
  });
}
