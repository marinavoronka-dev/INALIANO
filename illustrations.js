// Original artwork cropped from the supplied Dante workbook.
const fruits = ['mela','banana','albicocca','ciliegia','limone','arancia','pera','fragola','pesca','anguria'];
const letters = ['ape','balena','cane','delfino','elefante','farfalla','giraffa','hockey','inverno','leone','mela','nave','ombrello','pera','quadro','ramo','sole','tavolo','uno','vaso','zebra'];
const vegetableNames = ['pomodoro','sedano','cipolla','porro','patata','peperone','ravanello','cavolfiore','mais','cavolo','pisello','zucchino'];

export function wordPicture(word, theme) {
  if ((theme === 'letters' || theme === 'colors') && ['rosa','rosso'].includes(word)) return 'vocab-' + word;
  if (theme === 'fruit' && fruits.includes(word)) return 'vocab-fruit-' + word;
  if (theme === 'vegetables' && vegetableNames.includes(word)) return 'vocab-48-' + vegetableNames.indexOf(word);
  if (theme !== 'letters') return null;
  const index = letters.indexOf(word);
  if (index < 0) return null;
  if (fruits.includes(word)) return 'vocab-fruit-' + word;
  if (word === 'sole') return 'vocab-sole';
  return 'vocab-' + (index + 6);
}

const flashes = ['Ape — пчела','Baco — гусеница','Cane — собака','Gelato — мороженое','Girandola — вертушка','Hotel — отель','Quercia — дуб','Rana — лягушка','Sole — солнце'];

const pictures = {
  'cover:0':[['source-cover','Обложка оригинальной тетради']],
  '1:0':[['intro-reader','Ребёнок читает книгу']],
  '31:0':flashes.map((alt,i) => ['flash-' + (i + 1),alt]),
  '43:1':[['color-brushes','Две кисточки с половинками слов']],
  '46:0':[['vegetables','Рисунки овощей из тетради']],
  '50:0':[['fridge','Холодильник с овощами на полках']],
  '52:0':[['cross-pea','Стручок гороха'],['cross-pepper','Перец'],['cross-carrot','Морковь'],['cross-pumpkin','Тыква']],
  '55:1':[['fruit-row-55','Лимон, арбуз и клубника']],
  '56:0':[['fruit-row-56','Яблоко, бананы и клубника']],
  '57:0':[['marco','Марко пишет свой рассказ']],
  '57:1':[['marco-fruit','Апельсин и долька']],
  '58:0':[['family','Члены семьи с итальянскими подписями']],
  '62:0':[['family-group','Семья на прогулке']],
  '65:0':[['giulio','Джулио с котом']],
  '69:0':[['dictionary-veg','Помидор, лук и кабачок']],
  '70:0':[['dictionary-fruit','Яблоко, апельсин и арбуз']]
};

export function sourcePictures(page, step) {
  return pictures[page + ':' + step] || [];
}
