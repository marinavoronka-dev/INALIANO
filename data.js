const list = (source) => source.split('|').map((entry) => entry.split(':'));

export const themes = [
  {id:'letters', ru:'Алфавит', it:'Alfabeto', icon:'Aa', color:'#e9efd4', page:2, end:32,
    items:list('A:a|B:bi|C:ci|D:di|E:e|F:effe|G:gi|H:acca|I:i|L:elle|M:emme|N:enne|O:o|P:pi|Q:cu|R:erre|S:esse|T:ti|U:u|V:vu|Z:zeta'),
    words:list('ape:пчела|balena:кит|cane:собака|delfino:дельфин|elefante:слон|farfalla:бабочка|giraffa:жираф|hockey:хоккей|inverno:зима|leone:лев|mela:яблоко|nave:корабль|ombrello:зонтик|pera:груша|quadro:картина|rosso:красный|rosa:розовый / роза|ramo:ветка|sole:солнце|tavolo:стол|uno:один|vaso:ваза|zebra:зебра')},
  {id:'numbers', ru:'Числа', it:'Numeri', icon:'123', color:'#ffe8b3', page:33, end:40,
    items:list('uno:1|due:2|tre:3|quattro:4|cinque:5|sei:6|sette:7|otto:8|nove:9|dieci:10'),
    words:list('uno:один|due:два|tre:три|quattro:четыре|cinque:пять|sei:шесть|sette:семь|otto:восемь|nove:девять|dieci:десять')},
  {id:'colors', ru:'Цвета', it:'Colori', icon:'◉', color:'#f7d8e9', page:41, end:45,
    items:list('rosso:красный:#c92e35|arancione:оранжевый:#ef791e|giallo:жёлтый:#ffc928|verde:зелёный:#3a9654|azzurro:голубой:#66c0e8|blu:синий:#3159ae|viola:фиолетовый:#8c4dad|nero:чёрный:#242325|grigio:серый:#8b8c90|bianco:белый:#ffffff|rosa:розовый:#eb79a7')},
  {id:'vegetables', ru:'Овощи', it:'Verdura', icon:'🥕', color:'#fce1ca', page:46, end:52,
    items:list('aglio:чеснок|carota:морковь|cavolfiore:цветная капуста|cipolla:лук|melanzana:баклажан|zucca:тыква|pisello:горох|pomodoro:помидор|peperone:болгарский перец|zucchino:кабачок|broccoli:брокколи|patata:картофель|porro:лук-порей')},
  {id:'fruit', ru:'Фрукты', it:'Frutta', icon:'🍐', color:'#e6efd2', page:53, end:57,
    items:list('mela:яблоко|pera:груша|banana:банан|arancia:апельсин|limone:лимон|pesca:персик|fragola:клубника|ciliegia:вишня|albicocca:абрикос|anguria:арбуз')},
  {id:'family', ru:'Семья', it:'Famiglia', icon:'♥', color:'#e6e1f7', page:58, end:65,
    items:list('padre:отец|papà:папа|madre:мать|mamma:мама|fratello:брат|sorella:сестра|nonna:бабушка|nonno:дедушка|zio:дядя|zia:тётя')}
];

export function question(theme, index) {
  const [term, meaning] = theme.items[index];
  const vowels = 'AEIOU';
  if (theme.id === 'letters' && index % 3 === 0) {
    return {prompt:'Это гласная или согласная?', word:term, spoken:meaning,
      answer:vowels.includes(term) ? 'Гласная' : 'Согласная', options:['Гласная','Согласная']};
  }
  const offsets = [0, 1, 3, 5];
  const options = offsets.map((offset) => theme.items[(index + offset) % theme.items.length]);
  const shift = (index + 2) % options.length;
  const rotated = options.slice(shift).concat(options.slice(0, shift));
  if (theme.id === 'letters') {
    return {prompt:'Найди строчную букву', word:term, spoken:meaning,
      answer:term.toLowerCase(), options:rotated.map(([letter]) => letter.toLowerCase())};
  }
  if (theme.id === 'numbers' && index % 2 === 0) {
    const number = Number(meaning);
    const first = Math.floor(number / 2);
    return {prompt:'Реши пример и выбери ответ по-итальянски', word:first ? `${first} + ${number - first}` : '2 − 1',
      answer:term, options:rotated.map(([value]) => value)};
  }
  if (theme.id !== 'colors' && index % 4 === 3) {
    return {prompt:'Напиши ответ по-итальянски', word:meaning, answer:term, hint:term[0]};
  }
  return {prompt:theme.id === 'numbers' ? 'Выбери число' : 'Найди перевод', word:term, spoken:term,
    answer:meaning, options:rotated.map(([,label,color]) => color ? {label,color} : label)};
}
