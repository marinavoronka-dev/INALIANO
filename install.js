const root = document.documentElement;
const standalone = matchMedia('(display-mode: standalone)');
const dialog = document.getElementById('install-dialog');
const status = document.getElementById('offline-status');
let offeredInstall;

function refreshInstallButton() {
  root.toggleAttribute('data-installable', !standalone.matches && !navigator.standalone);
}
refreshInstallButton();
standalone.addEventListener('change', refreshInstallButton);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  offeredInstall = event;
});
window.addEventListener('appinstalled', () => {
  root.removeAttribute('data-installable');
  offeredInstall = null;
});

document.addEventListener('click', async event => {
  if (!event.target.closest('[data-install-app]')) return;
  if (offeredInstall) {
    const prompt = offeredInstall;
    offeredInstall = null;
    try {
      await prompt.prompt();
      return;
    } catch {
      // Show the browser menu directions if the built-in prompt is unavailable.
    }
  }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(navigator.userAgent);
  document.getElementById('install-instructions').textContent = ios
    ? 'Открой тетрадь в Safari. Нажми «Поделиться», затем «На экран Домой».'
    : android
      ? 'Открой тетрадь в Chrome. В меню браузера выбери «Установить приложение» или «Добавить на главный экран».'
      : 'Открой тетрадь в Chrome или Edge. Нажми значок установки в адресной строке или выбери установку приложения в меню браузера.';
  dialog.showModal();
});

if ('serviceWorker' in navigator) {
  status.textContent = 'Загружаем задания для работы без интернета…';
  navigator.serviceWorker.register('./sw.js').then(registration => {
    function watch(worker) {
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'redundant' && !registration.active) {
          status.textContent = 'Материалы пока не загрузились. Обнови страницу с интернетом.';
        }
      });
    }
    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing));
    return navigator.serviceWorker.ready;
  }).then(() => {
    status.textContent = 'Тетрадь готова к работе без интернета.';
  }).catch(() => {
    status.textContent = 'Не удалось подготовить тетрадь для работы без интернета.';
  });
}
