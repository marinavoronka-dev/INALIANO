import {themes} from './data.js';

const [alphabet, numbers, colors, vegetables, fruit, family] = themes;
const pairs = (source) => source.split('|').map((pair) => pair.split(':'));
const words = (source) => source.split(' ');
const trace = (samples, title = 'Обведи и напиши') => ({type:'trace', title, samples});
const art = (asset, title, inks, captions) => ({type:'art', asset, title, inks, captions});
const match = (title, items) => ({type:'match', title, items});
const type = (title, items, caption) => ({type:'type', title, items, caption});
const sort = (title, items, pool) => ({type:'sort', title, items, pool});
const pick = (title, items, pool) => ({type:'pick', title, items, pool});
const select = (title, options, correct, minimum) => ({type:'select', title, options, correct, minimum});
const read = (title, items) => ({type:'read', title, items});
const free = (title, items) => ({type:'free', title, items});
const search = (title, rows, targets) => ({type:'search', title, rows:words(rows), targets:words(targets)});
const crossword = (title, instruction, items, layout) => ({type:'crossword', title, instruction, items, layout});
const reverse = (items) => items.map(([first, second]) => [second, first]);
const colorNames = colors.items.map(([word]) => word);
const numberNames = numbers.items.map(([word]) => word);
const fruitNames = fruit.items.map(([word]) => word);
const letterNames = alphabet.items.map(([letter]) => letter);
const letterPairs = letterNames.map(letter => [letter, letter.toLowerCase()]);
const numberClues = (clues) => clues.map(n => [String(n), numberNames[n - 1]]);
const byName = (list, terms) => words(terms).map(term => list.find(([word]) => word === term));
const colorClass = (letter) => {
  if ('AEIOU'.includes(letter)) return 'rosso';
  if ('BCDFG'.includes(letter)) return 'blu';
  return 'HLMNP'.includes(letter) ? 'verde' : 'giallo';
};
const letterPaint = (title, items, inks, colorFor, legend) => ({
  type:'letterpaint', title, items, inks, legend,
  guide:Object.fromEntries(items.map(letter => [letter,colorFor(letter)]))
});
const math = (examples) => examples.map(([expression, result]) => [expression, numberNames[result - 1]]);
const steps = {
  2:[trace(letterPairs.map(([a,b]) => a + ' ' + b), 'Пропиши итальянский алфавит')],
  3:[letterPaint('Раскрась гласные красным, а согласные синим',letterNames,['rosso','blu'],letter => 'AEIOU'.includes(letter) ? 'rosso' : 'blu')],
  4:[match('Найди пары заглавных и строчных букв', byName(letterPairs,'B G C H R Q Z U S T E A L I'))],
  5:[{type:'letterpaint',title:'Раскрась пять букв любыми цветами',items:letterNames}],
  27:[select('Выбери буквы итальянского алфавита',words('A Ц D Ь E K T Ё S К N X M Ф C Э L P Ч З Ю Ъ'),words('A D E T S N M C L P'))],
  28:[trace(letterPairs.map(([a,b]) => a + ' ' + b))],
  29:[trace(['A a','B b','C c','D d']), match('Подбери строчные буквы',letterPairs), match('Подбери заглавные буквы',reverse(letterPairs)),free('Сравни итальянские и русские буквы',['Какие буквы выглядят одинаково?','Какие итальянские буквы не встречаются в русском алфавите?'])],
  30:[letterPaint('Раскрась буквы по группам',letterNames,['rosso','blu','verde','giallo'],colorClass,
      'A E I O U — красный · B C D F G — синий · H L M N P — зелёный · Q R S T V Z — жёлтый'),
    free('Запиши слова со страницы 31',['Запиши слова, а затем отдельно выпиши первую и последнюю букву каждого.'])],
  31:[read('Прочитай слова вслух',alphabet.words)],
  32:[type('Запиши алфавит по памяти',[['Все буквы по порядку',letterNames.join(' ')]]),match('Подбери первую букву',pairs('Fratello:F|Madre:M|Nonno:N|Gatto:G|Rosso:R|Casa:C|Verde:V'))],
  33:[read('Числа от одного до десяти',numbers.words),type('Допиши названия чисел',pairs('N_ve:nove|S_t_e:sette|_ei:sei|Q_at_ro:quattro|Di_c_:dieci|_re:tre|U_o:uno|Du_:due|C_nq_e:cinque|O_t_:otto'))],
  34:[match('Подбери название для каждого числа',numberClues([10,8,5,2,6,1,7,3,9,4])),type('Расшифруй числа по эмодзи',pairs('🐱⭐🍋:uno|🍎🐱🌸:due|🦋🐟🌸:tre|🌿🌸🎈:sei'), '🐱 U · ⭐ N · 🍋 O · 🍎 D · 🌸 E · 🦋 T · 🐟 R · 🌿 S · 🎈 I')],
  35:[sort('Собери названия чисел',pairs('ecidi:dieci|eis:sei|ued:due|attquro:quattro|ttoo:otto|etr:tre|uon:uno|ttese:sette|evon:nove|queinc:cinque')),type('Переведи числа',reverse(byName(numbers.words,'due cinque dieci sette tre nove uno sei'))),pick('Реши и выбери ответ по-итальянски',math([['3 + 2',5],['5 + 1',6],['4 + 4',8],['7 − 3',4]]),numberNames)],
  36:[pick('Реши примеры по-итальянски',math([['6 − 5',1],['10 − 2',8],['8 + 2',10],['7 + 2',9]]),numberNames),search('Найди десять чисел в строках','TGFYUNOHFASEI CINHJLQUATTRO SETREMPOTTOFU CINQUEHIYVCSAJ BIDUEXAYERWQK FJSETTENVXAMKU BRENOVEAGFSDQI JHGDIECIKHGFRLC',numberNames.join(' '))],
  37:[crossword('Кроссворд с числами','Запиши названия чисел по-итальянски.',numberClues([4,8,1,9,7,5,3,2,10,6]),[[1,'h',0,1],[2,'v',3,0],[3,'h',1,3],[4,'v',6,0],[5,'h',5,3],[6,'h',1,7],[7,'v',8,3],[8,'h',6,5],[8,'v',6,5],[9,'h',4,9]])],
  38:[type('Вставь пропущенные буквы',pairs('N_ve:nove|C_nq_e:cinque|Di_c_:dieci|Se_t_:sette|O_t_:otto|Se_:sei|_no:uno|Q_at_ro:quattro|D_e:due|Tr_:tre')),match('Соедини итальянские и русские слова',numbers.words)],
  39:[crossword('Кроссворд с переводом','Переведи названия чисел с русского на итальянский.',reverse(byName(numbers.words,'otto quattro tre due uno sette nove dieci')),[[1,'v',3,2],[2,'v',1,4],[3,'h',3,3],[4,'h',5,1],[5,'h',1,5],[6,'v',7,0],[7,'h',0,10],[4,'v',5,1]])],
  40:[sort('Расставь числа по алфавиту',[['От A до Z',[...numberNames].sort().join(' ')]],words('uno due cinque tre nove dieci sei sette quattro otto')),select('Выбери слова, которые не обозначают числа',words('tre rosso sette zio padre nove sei cane'),words('rosso zio padre cane'))],
  41:[read('Познакомься с цветами',colors.items)],
  42:[pick('Реши пример и выбери цвет',pairs('2 + 3:rosa|3 + 3:grigio|4 + 3:arancione|4 + 4:giallo|5 + 4:verde|5 + 5:blu'),colorNames),art('42','Раскрась рисунок по ответам',words('rosa grigio arancione giallo verde blu'),'5 — rosa · 6 — grigio · 7 — arancione · 8 — giallo · 9 — verde · 10 — blu')],
  43:[sort('Собери названия цветов',pairs('soros:rosso|lbu:blu|reno:nero|narcaione:arancione|osar:rosa|llioag:giallo|lavio:viola|zzaorru:azzurro|nociba:bianco|redve:verde|rigoig:grigio')),match('Соедини две половинки слова',pairs('ro…:…sso|gia…:…llo|ver…:…de|aran…:…cione|azzu…:…rro|bian…:…co|gri…:…gio'))],
  44:[pick('Какого цвета не хватает?',pairs('blu + giallo = ?:verde|rosso + ? = viola:blu|giallo + rosso = ?:arancione|rosso + ? = rosa:bianco|? + bianco = grigio:nero'),colorNames),art('44','Раскрась пятна по своим ответам')],
  45:[art('45','Прочитай названия цветов и раскрась радугу'),search('Найди названия цветов','QVIO LVIOLAZURO XBLUBIANCO ROSSOYVERDE GIALLOXROSA NEROGRIGIO ARANCIONE AZZURRO','rosso verde blu bianco giallo arancione nero grigio viola rosa azzurro')],
  46:[type('Впиши пропущенные буквы',pairs('l_ cip_ll_:le cipolle|le c_rot_:le carote|i p_rr_:i porri|i p_m_dor_:i pomodori|i p_p_ron_:i peperoni|l_ zu_chin_:le zucchine')),match('Подбери перевод',pairs('le cipolle:лук|le carote:морковь|i porri:лук-порей|i pomodori:помидоры|i peperoni:перец|le zucchine:кабачки'))],
  47:[free('Какого цвета овощи?',words('carote zucca piselli pomodori peperoni zucchine broccoli patate').map(w => 'Цвет · ' + w)),free('Какие овощи тебе нравятся?',['Mi piace…','Non mi piace…'])],
  48:[{type:'produce',title:'Назови и раскрась овощи'}],
  49:[free('Расскажи, что у тебя есть',['Io ho… (например, Io ho la carota arancione.)']),type('Переведи вопросы',pairs('Это помидор?:È un pomodoro?|Это картофель?:È una patata?|Это лук?:È una cipolla?|Это баклажан?:È una melanzana?|Это тыква?:È una zucca?|Это чеснок?:È aglio?')),pick('Подбери ответы из тетради',pairs('È un pomodoro?:Sì|È una patata?:No|È una cipolla?:No|È una melanzana?:Sì|È una zucca?:No|È aglio?:Sì'),['Sì','No'])],
  50:[free('Что есть в холодильнике?',['Io ho…','Io non ho…','Lui ha…','Lui non ha…','Lei ha…','Lei non ha…','Noi abbiamo…','Noi non abbiamo…']),search('Найди овощи в цепочке','PATATEBROCCOLIZUCCAPE PERONICAROTERAVANELLI PISELLIPORRIPOMODORIL ATTUGAZUCCAMELANZANE PEPERONILATTUGA','patate broccoli zucca peperoni carote ravanelli piselli porri pomodori lattuga melanzane')],
  51:[free('Составь предложения',['Io ho…','Lui non ha…','Lei ha…','Noi non abbiamo…'])],
  52:[crossword('Кроссворд с овощами','Напиши названия овощей по-итальянски.',pairs('Брокколи:broccoli|Морковь:carota|Цукини:zucchino|Тыква:zucca|Помидор:pomodoro|Перец:peperone|Зелёный горох:pisello|Картофель:patata'),[[1,'h',4,7],[2,'v',7,7],[3,'v',11,2],[4,'h',11,2],[5,'v',5,1],[6,'h',0,2],[7,'v',0,2],[8,'v',15,1]])],
  53:[read('Познакомься с фруктами',fruit.items)],
  54:[match('Подбери перевод',fruit.items),type('Вставь пропущенные буквы',pairs('M_l_:mela|Per_:pera|Ban_n_:banana|Ar_nci_:arancia|L_mon_:limone|P_sca:pesca|Fr_go_a:fragola|Ci_iegi_:ciliegia|A_bi_oc_a:albicocca|An_uri_:anguria'))],
  55:[sort('Собери и прочитай слово',pairs('mlae:mela|prae:pera|pscae:pesca')),type('Переведи названия фруктов',reverse(byName(fruit.items,'pera anguria pesca fragola limone arancia')))],
  56:[sort('Расставь фрукты по алфавиту',[['От A до Z',[...fruitNames].sort().join(' ')]],fruitNames)],
  57:[read('Прочитай рассказ Марко',pairs('Adoro le verdure e la frutta.:Я люблю овощи и фрукты.|La mia verdura preferita è la patata.:Мой любимый овощ — картофель.|Il mio frutto preferito è la mela.:Мой любимый фрукт — яблоко.')),free('Расскажи о своих любимых овощах и фруктах',['La mia verdura preferita è…','Il mio frutto preferito è…'])],
  58:[read('Семья по-итальянски',family.items)],
  59:[read('Прочитай и послушай слова',family.items)],
  60:[type('Назови членов семьи по-итальянски',pairs('бабушка:nonna|дедушка:nonno|дядя:zio|брат:fratello|сестра:sorella|мама:mamma|сын:figlio|тётя:zia|папа:papà|дочь:figlia'))],
  61:[sort('Собери из букв слова о семье',pairs('nnoon:nonno|nanon:nonna|ozi:zio|faotrell:fratello|laelsor:sorella|mdera:madre|gloifi:figlio|iza:zia|pread:padre|glaifi:figlia'))],
  62:[pick('Определи род слова',pairs('nonno:мужской|nonna:женский|zio:мужской|fratello:мужской|sorella:женский|madre:женский|figlio:мужской|zia:женский|padre:мужской|figlia:женский'),['мужской','женский'])],
  63:[select('Выбери лишние слова',words('gatto sorella madre porta zio fratello tavolo autobus zia padre figlia vino nonno nonna'),words('gatto porta tavolo autobus vino'))],
  64:[type('Расскажи, кто это',pairs('Это мой папа:Questo è mio papà|Это мой брат:Questo è mio fratello|Это моя тётя:Questa è mia zia|Это моя бабушка:Questa è mia nonna|Это мой дядя:Questo è mio zio|Это моя мама:Questa è mia mamma'))],
  65:[read('Прочитай рассказ Джулио',pairs('Ciao! Mi chiamo Giulio. Ho 8 anni.:Привет! Меня зовут Джулио. Мне 8 лет.|Il mio colore preferito è il blu.:Мой любимый цвет — синий.|Questo è mio papà Marco. Questa è mia mamma.:Это мой папа Марко. Это моя мама.|Questo è mio fratello. Questa è mia sorella.:Это мой брат. Это моя сестра.|Ho un gatto. È bianco e nero.:У меня есть кот. Он белый и чёрный.|Adoro le verdure e la frutta.:Я люблю овощи и фрукты.|La mia verdura preferita è la patata. Il mio frutto preferito è la mela.:Мой любимый овощ — картофель. Мой любимый фрукт — яблоко.')),free('Расскажи о себе по образцу',['Ciao! Mi chiamo…','Ho … anni.','Il mio colore preferito è…','La mia famiglia…','Il mio frutto preferito è…'])]
};

const letterPages = pairs('ape:пчела|balena:кит|cane:собака|delfino:дельфин|elefante:слон|farfalla:бабочка|giraffa:жираф|hockey:хоккей|inverno:зима|leone:лев|mela:яблоко|nave:корабль|ombrello:зонтик|pera:груша|quadro:картина|ramo:веточка|sole:солнце|tavolo:стол|uno:один|vaso:ваза|zebra:зебра');
const palettes = {6:'giallo',8:'marrone nero',10:'rosa',12:'giallo marrone',15:'marrone arancione giallo',17:'blu rosso giallo verde',24:'rosso rosa'};
const drawings = {16:'Нарисуй и раскрась яблоко',19:'Нарисуй и раскрась грушу',22:'Нарисуй жёлтое солнце'};
letterPages.forEach(([word,translation], index) => {
  const n = index + 6;
  const letter = letterPairs[index].join(' ');
  const pronunciation = n === 13 ? 'Хоккей · буква H в итальянском не произносится.' : translation;
  steps[n] = [read('Буква ' + letter, [[word, pronunciation]]), trace([letter,word], 'Обведи букву и слово'), drawings[n] ?
    art(null, drawings[n], n === 22 ? ['giallo'] : undefined) :
    art(String(n), n === 17 ? 'Раскрась корабль' : 'Раскрась картинку', palettes[n] && words(palettes[n]))];
  if (n === 21) steps[n].push(read('Два цвета на R',byName(colors.items,'rosso rosa')));
  if (n === 17) steps[n].push(read('Назови цвета корабля',byName(colors.items,palettes[n])));
  if (n === 20) steps[n].push(free('Назови цвета картины',['Какие цвета ты выбрал? Напиши их по-итальянски.']));
});

const numbersSound = words('уно дуэ трэ куаттро чинкуэ сэй сэттэ отто новэ диэчи');
steps[33][0].items = numbers.words.map(([word,translation],i) => [word, translation + ' · [' + numbersSound[i] + ']']);
for (const [index,theme] of themes.entries()) {
  steps[66 + index] = [read(theme.ru, (theme.words || theme.items).map(([a,b,c]) => [a,b,c]))];
}
steps[1] = [read('Как заниматься',[
  ['Выбери страницу','Листай страницы или найди нужную в списке.'],
  ['Пиши пальцем','Обводи буквы в больших прописях.'],
  ['Раскрашивай касанием','Выбери цвет и коснись части рисунка.'],
  ['Собирай звёзды','Заканчивай упражнения, чтобы отмечать свой прогресс.']
])];
steps.alphabet = [read('Итальянский алфавит',alphabet.items.map(([letter, sound]) => [letter,sound,null,sound]))];

export function activitiesFor(page) { return steps[page] || []; }
export const produce = pairs('pomodoro:помидор|sedano:сельдерей|cipolla:лук|porro:лук-порей|patata:картофель|peperone:перец|ravanello:редис|cavolfiore:цветная капуста|mais:кукуруза|cavolo:капуста|pisello:горох|zucchino:кабачок');
