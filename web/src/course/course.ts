import type { Topic, World } from './types';
import { t01 } from './t01';

const stub = (id: string, n: number, title: string, sub: string): Topic => ({ id, n, title, sub, levels: [] });

export const WORLDS: World[] = [
  {
    id: 'w1', n: 1, title: 'Пробуждение', color: 'var(--yellow)',
    sub: 'Игра запускается, у героя появляются имя и характеристики',
    topics: [
      t01,
      stub('t02', 2, 'Типы данных', 'Встроенные типы. Значимые и ссылочные'),
      stub('t06', 6, 'Переменные глубже', 'Преобразование типов, boxing и unboxing, const, readonly'),
    ],
  },
  {
    id: 'w2', n: 2, title: 'Развилки', color: 'var(--green)',
    sub: 'Герой принимает решения и ходит по карте',
    topics: [
      stub('t07', 7, 'Ветвления и циклы', 'if, switch, for, while, foreach'),
      stub('t08', 8, 'Безусловные переходы', 'break, continue, goto, return'),
    ],
  },
  {
    id: 'w3', n: 3, title: 'Слова и сундуки', color: 'var(--peach)',
    sub: 'Диалоги, инвентарь, виды предметов',
    topics: [
      stub('t04', 4, 'Символы и строки', 'Форматирование, методы String, замена строк на enum'),
      stub('t05', 5, 'Массивы и коллекции', 'Array, List, Dictionary'),
      stub('t03', 3, 'Статичность и enum', 'Статичные классы, функции, переменные. Перечисления'),
    ],
  },
  {
    id: 'w4', n: 4, title: 'Чертежи', color: 'var(--blue)',
    sub: 'Герой становится объектом, монстры собираются по чертежу',
    topics: [
      stub('t09', 9, 'Класс и объект', 'Абстракция. Данные-члены и функции-члены'),
      stub('t10', 10, 'Методы и параметры', 'По значению, ref, in, out'),
      stub('t11', 11, 'Конструкторы', 'Наследование конструкторов, this, base'),
      stub('t12', 12, 'Инкапсуляция', 'Свойства. private, public, protected'),
    ],
  },
  {
    id: 'w5', n: 5, title: 'Семья классов', color: 'var(--pink)',
    sub: 'Виды врагов, оружие и бой',
    topics: [
      stub('t13', 13, 'Наследование', 'Ромбовидное наследование. Раннее и позднее связывание'),
      stub('t14', 14, 'Виртуальные методы', 'virtual и override'),
      stub('t15', 15, 'Полиморфизм', 'Абстрактные и виртуальные члены'),
      stub('t16', 16, 'Отношения классов', 'Наследование, реализация, композиция, агрегация'),
      stub('t17', 17, 'Структуры', 'struct и чем отличается от class'),
      stub('t18', 18, 'Абстрактные и бесплодные классы', 'abstract, sealed. Класс object'),
    ],
  },
  {
    id: 'w6', n: 6, title: 'Контракты и аварии', color: 'var(--orange)',
    sub: 'Способности героя, и игра не падает от ошибок',
    topics: [
      stub('t19', 19, 'Интерфейсы', 'Абстрактный тип данных. Стандартные интерфейсы .NET'),
      stub('t20', 20, 'Множественная реализация', 'Явная реализация интерфейсов'),
      stub('t21', 21, 'Исключения', 'try, catch, finally. Стандартные исключения .NET'),
    ],
  },
];

export const ALL_LEVELS = WORLDS.flatMap(w => w.topics.flatMap(t => t.levels.map(l => ({ ...l, topic: t, world: w }))));
export const findLevel = (id: string) => ALL_LEVELS.find(l => l.id === id);
export const ALL_TERMS = ALL_LEVELS.flatMap(l => l.steps.filter(s => s.k === 'term').map(s => ({ ...(s as any), levelId: l.id, topic: l.topic })));
