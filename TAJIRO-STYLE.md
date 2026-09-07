# Tajiro — стиль

Полный свод оформления лендинга Tajiro: шрифты, цвета, типографика, сетка,
отступы, радиусы, тени, жидкое стекло, кнопки, движение, доступность.

Собран с рабочих исходников (`src/css/00-base.css`, `00-fonts.css`) и актуален
на текущее состояние страницы. Значения приведены как есть — их можно
копировать в код без правки.

**Источник.** Репозиторий: `github.com/danillyozniy-alt/tajiro-home`,
публичный. Первоисточник токенов —
`src/css/00-base.css`, шрифтов — `src/css/00-fonts.css`; значения в этом
файле выгружены оттуда и совпадают с ними дословно.

Репозиторий соответствует этому файлу: вся работа залита, раскладка секций
в коде та же, что в разделе 3.5. Спорные места можно сверять прямо с
исходниками.

Файл рассчитан на то, чтобы по нему приводили к общему виду внутренние
страницы платформы. Поэтому кроме значений здесь записано, **почему** они
такие и **где не работают**: половина ошибок в переносе стиля — это верный
токен, поставленный не туда.

---

## 1. Главное в двух абзацах

Страница светлая и тёплая. Основа — кремовый песок, а не белый; белый здесь
только у плашек. Тёмные секции работают знаками препинания: они разбивают
страницу и не дают крему идти сплошняком.

Акцент один — зелёный. Он живёт в тексте, линейках, галочках и кнопках, но
никогда в фонах секций. Второй акцент, золото и песок, держит декор: номера,
обводки, линейки, тёплые тинты. Двух акцентов достаточно — третьего в системе
нет.

---

## 2. Шрифты

Два семейства плюс технический третий для цифр.

| Роль | Семейство | Веса | Где |
|---|---|---|---|
| Основной текст | **Almarai** | 400, 700, 800 | всё, кроме крупных чисел |
| Дисплейный | **Outfit** | 600, 700 | номера секций, крупные показатели |
| Цифры | **Tajiro Figures** | 400–900 | подменяет 0–9 в основном тексте |

```css
--f-body:    'Tajiro Figures', 'Almarai', 'Segoe UI', system-ui, -apple-system, sans-serif;
--f-display: 'Outfit', 'Almarai', system-ui, sans-serif;
```

**Про цифры — это важно и неочевидно.** У Almarai цифры нарисованы странно:
тройка с плоской перекладиной, резкие стыки у нуля и шестёрки. На крупном
кегле это читается не рисунком шрифта, а браком. Поэтому символы `0–9`
подменяются на Outfit через `unicode-range` — браузер сам берёт нужный файл,
размечать ничего не нужно. `'Tajiro Figures'` стоит **первым** в `--f-body`
именно поэтому и покрывает только цифры.

```css
@font-face {
  font-family: 'Tajiro Figures';
  src: url(fonts/outfit-600.woff2) format('woff2');
  font-weight: 400 650;
  unicode-range: U+0030-0039;   /* только цифры */
  font-display: swap;
}
@font-face {
  font-family: 'Tajiro Figures';
  src: url(fonts/outfit-700.woff2) format('woff2');
  font-weight: 651 900;
  unicode-range: U+0030-0039;
  font-display: swap;
}
```

Второе начертание не перестраховка: без настоящего жирного браузер рисовал
синтетический на весах 700 и 800.

Шрифты обрезаны до латиницы (`U+0000-00FF` и служебные) — арабский набор
Almarai выброшен. Пять файлов `woff2`, все локальные, ни одного обращения
наружу.

**У Almarai нет курсивного начертания.** Курсив браузер подделает наклоном.
Там, где по макету просится курсив (цитаты), роль курсива берёт кегль.

---

## 3. Цвета

### 3.1 Поверхности

```css
--c-bg:        #f5f0eb;   /* кремовый — тёплый якорь страницы */
--c-bg-plain:  #fbfaf9;   /* почти белый — выдох между кремовыми */
--c-bg-alt:    #fbf8f3;   /* светлее — карточки, «на золоте» */
--c-surface:   #ffffff;   /* белые плашки, портреты */

--c-ink-surface:   #2b2621;   /* тёмная плашка */
--c-ink-surface-2: #1f1d1a;   /* самая тёмная */
```

Фон тёмных секций — `#1a1714`. Своего токена под него нет, он вписан числом
в каждой такой секции. Подвальный призыв чуть светлее: `#1f1b17`.

### 3.2 Текст

```css
--c-text:        #2b2621;   /* заголовки */
--c-text-strong: #403b33;   /* навигация, подзаголовки */
--c-text-body:   #4d453d;   /* основной текст */
--c-text-muted:  #6b645a;   /* подписи, мета */

--c-on-dark:       #fbf8f3;   /* текст на тёмном */
--c-on-dark-soft:  #a9a296;
--c-on-dark-muted: #8e8579;
```

### 3.3 Акценты

```css
--c-green:      #2f7352;   /* основной CTA */
--c-green-deep: #26603f;   /* его hover */
--c-gold:       #865b2a;   /* акцент и обводки на светлом */
--c-sand:       #d4a373;   /* декоративные линейки, акцент на тёмном */

--c-green-text:    #2f6b4a;   /* акцент-текст на светлом, AA */
--c-green-bright:  #3d8f63;   /* графика: линейки, иконки, обводки */
--c-green-mist:    #cfe6d9;   /* бледная заливка */
--c-green-on-dark: #7fc9a0;   /* зелёный на тёмных секциях */
```

**Пары «светлое/тёмное» надо соблюдать.** На тёмной секции `--c-green-text`
нечитаем, нужен `--c-green-on-dark`; золото гаснет, нужен песок. Обратно —
так же: песок на кремовом бледнеет, там работает золото.

| Роль | На светлом | На тёмном |
|---|---|---|
| Заголовок | `--c-text` | `--c-on-dark` |
| Основной текст | `--c-text-body` | `--c-on-dark-soft` |
| Подписи, мета | `--c-text-muted` | `--c-on-dark-muted` |
| Зелёный акцент | `--c-green-text` | `--c-green-on-dark` |
| Тёплый акцент | `--c-gold` | `--c-sand` |
| Линия | `--c-line` | `--c-line-on-dark` |

### 3.4 Линии

```css
--c-line:         rgba(43, 38, 33, 0.14);
--c-line-soft:    rgba(43, 38, 33, 0.09);
--c-line-gold:    rgba(150, 102, 47, 0.30);
--c-line-strong:  rgba(150, 102, 47, 0.55);
--c-line-on-dark: rgba(255, 255, 255, 0.10);
--c-line-green:   rgba(61, 143, 99, 0.28);
```

### 3.5 Ритм светлого и тёмного

Правило одно: **соседние секции одного тона не совпадают.** В светлой части
это чередование крема и белёсого, в тёмной — разница по глубине.

Тёмные идут через одну, а не полосой. Если тёмных мало и они собраны в конце,
страница читается сплошным светлым куском; если две тёмные встают рядом с
одинаковым фоном, они сливаются в одну полосу и граница пропадает.

Текущая раскладка лендинга — как ориентир:

```
 1 hero              песок #eae4d8
 2 stats             крем (прозрачная, берёт фон body)
 3 how-it-works      белёсый
 4 what-you-get      ТЁМНАЯ
 5 pillar-store      белёсый
 6 pillar-products   крем
 7 pillar-marketing  ТЁМНАЯ
 8 marketplace-ads   крем
 9 the-math          ТЁМНАЯ
10 growth-manager    крем
11 trust-security    ТЁМНАЯ
12 social-proof      крем
13 footer-cta        ТЁМНАЯ #1f1b17
14 footer            ТЁМНАЯ #1a1714
```

Тёмного примерно треть по высоте. Пара 13–14 — единственные соседние тёмные:
призыв и подвал читаются одной опорой страницы и разведены не тоном, а
глубиной.

---

## 4. Типографика

Значения телефонные, дальше растут по `min-width`. Все заголовки набраны
**Almarai 800**, не дисплейным.

```css
.h1 { font-family: var(--f-body); font-weight: 800;
      font-size: 38px; line-height: 44px; letter-spacing: -1px;   color: var(--c-text); }
.h2 { font-family: var(--f-body); font-weight: 800;
      font-size: 28px; line-height: 35px; letter-spacing: -0.8px; color: var(--c-text); }
.h3 { font-family: var(--f-body); font-weight: 700;
      font-size: 19px; line-height: 27px; letter-spacing: -0.4px; color: var(--c-text); }

.lead { font-size: 17px; line-height: 27px; color: var(--c-text-body); }
.meta { font-size: 13px; line-height: 1.5;  color: var(--c-text-muted); }
```

```css
@media (min-width: 601px) {
  .h1 { font-size: 52px; line-height: 58px; letter-spacing: -1.4px; }
  .h2 { font-size: 34px; line-height: 42px; }
  .h3 { font-size: 22px; line-height: 30px; }
  .lead { font-size: 18px; line-height: 29px; }
}

@media (min-width: 901px) {
  .h1 { font-size: 72px; line-height: 78px; letter-spacing: -2px; }
  .h2 { font-size: 44px; line-height: 52px; letter-spacing: -1.2px; }
  .lead { font-size: 20px; line-height: 32px; }
}
```

`.h3` и `.meta` выше 601 не растут, `letter-spacing` у `.h2` меняется только
на 901.

Базовый текст: `16px / 1.5`, цвет `--c-text-body`, сглаживание
`-webkit-font-smoothing: antialiased`.

### Надзаголовки

Два вида, не взаимозаменяемы.

```css
/* Строчный: капс с трекингом, обычно с линейкой слева */
.kicker {
  font-size: 12px; font-weight: 700;
  letter-spacing: 1.6px; text-transform: uppercase;
  color: var(--c-green-text);
}

/* Пилюля: с точкой-индикатором, для статусов «идёт / доступно» */
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 18px 10px 16px;
  border: 1px solid rgba(212, 163, 115, 0.4);
  border-radius: var(--r-pill);
  background: rgba(43, 38, 33, 0.05);
  font-size: 13px; font-weight: 700;
  color: var(--c-text-muted);
  white-space: nowrap;
}
```

### Курсив в заголовке

Акцентная часть фразы — курсивом и зелёным. Держит зелёный на самом крупном
кегле страницы.

```css
.h1 em, .h2 em { font-style: italic; color: var(--c-green-text); }
```

---

## 5. Сетка и отступы

```css
--container: 1200px;   /* 1440 − 2×120 */
--gutter: 20px;        /* телефонное, растёт по брейкпоинтам */

.container {
  width: 100%;
  max-width: calc(var(--container) + var(--gutter) * 2);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
```

**Брейкпоинты — только `min-width`, снизу вверх.** Пороги смещены на пиксел
(601, 901, 1281): при `max-width` граница попадала в узкий диапазон, при
`min-width` должна попасть в широкий.

| Порог | `--gutter` |
|---|---|
| база (телефон) | 20px |
| ≥601 | 40px |
| ≥901 | 64px |
| ≥1281 | 120px |

Порядок блоков обязателен по возрастанию: правила равной силы, побеждает
последнее подошедшее.

**Вертикальные отступы секций** живут в самой секции, не в базе. Типовая
лесенка: `padding-block: 64px` → `80px` (≥601) → `96px` (≥901) → `120px`
(≥1281). Тёмные и мелкие секции бывают плотнее — 56/80/96.

---

## 6. Радиусы и тени

```css
--r-btn:  4px;     /* кнопки */
--r-card: 6px;     /* базовая карточка */
--r-pill: 100px;   /* пилюли, плашки-статусы */
--r-arch: 250px;   /* михрабная арка: скруглённый верх, почти прямой низ */

--sh-card: 0 1px 2px rgba(43, 38, 33, 0.04),
           0 12px 32px rgba(43, 38, 33, 0.06);
```

Крупные плашки на практике берут 14–18px, а не `--r-card`. Тени тёплые —
`rgba(43, 38, 33, …)`, не чёрные: чистый чёрный на кремовой странице читается
грязью. На тёмных секциях наоборот — тени чёрные.

```css
.arch { border-radius: var(--r-arch) var(--r-arch) var(--r-card) var(--r-card); }
```

---

## 7. Жидкое стекло

Фирменный материал: полупрозрачная подложка, размытие с подъёмом
насыщенности, светлая грань, мягкая тень. Поверхность перестаёт быть плоской
заливкой — сквозь неё видно, что под ней что-то есть.

### 7.1 Рабочая версия — из токенов

**Это то, что стоит на странице.** Панели, калькуляторы, карточки менеджера и
доверия, плашки у витрины, панели меню — всё собрано из четырёх токенов ниже
и накладывается слоями. Берите этот вариант.

```css
--glass-bg:
  /* Блик: узкая светлая полоса поперёк плоскости. Именно полоса, а не общее
     осветление — равномерный свет читается бумагой. Идёт по второй половине:
     в первой основа сама белая, и белый блик на белом не виден. */
  linear-gradient(115deg,
    transparent 44%,
    rgba(255, 255, 255, 0.7)  54%,
    rgba(255, 255, 255, 0.95) 59%,
    rgba(255, 255, 255, 0.45) 65%,
    transparent 74%),
  /* Поворот плоскости к свету. Уход холодный, не песочный: тёплый на
     кремовой странице читался замусоленным. */
  linear-gradient(147deg,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(255, 255, 255, 0.70) 28%,
    rgba(246, 247, 248, 0.62) 66%,
    rgba(241, 243, 245, 0.58) 100%);

/* Кромка. Градиент КОНИЧЕСКИЙ, а не линейный: яркость торца зависит от угла
   по периметру. Линейный светлеет вдоль сторон и не знает про углы;
   конический даёт то, что делает фаска — две яркие дуги там, где поверхность
   повёрнута к свету, и погасший торец на боковых стенках.
   Отсчёт от 128deg: свет приходит сверху слева, как у всех теней страницы. */
--glass-edge:
  conic-gradient(from 128deg,
    rgba(255,255,255,1)    0deg, rgba(255,255,255,0.92)  14deg,
    rgba(255,255,255,0.24) 46deg, rgba(255,255,255,0.05) 120deg,
    rgba(255,255,255,0.26) 158deg, rgba(255,255,255,0.95) 180deg,
    rgba(255,255,255,0.88) 196deg, rgba(255,255,255,0.22) 228deg,
    rgba(255,255,255,0.05) 300deg, rgba(255,255,255,0.30) 338deg,
    rgba(255,255,255,1)    360deg);

/* Размытие с подъёмом насыщенности. Одно размытие даёт серое молоко;
   saturate возвращает цвет тому, что за стеклом, — это и читается толщей. */
--glass-blur: blur(22px) saturate(175%);

/* Двойная кромка: тёмный волосок снаружи, белый кант внутри. Одна линия
   читается нарисованной рамкой, две — торцом, у которого есть толщина. */
--glass-shadow:
  0 1px 2px rgba(43, 38, 33, 0.06),
  0 8px 18px -10px rgba(43, 38, 33, 0.16),
  0 26px 46px -28px rgba(43, 38, 33, 0.32),
  0 0 0 1px rgba(43, 38, 33, 0.07),
  inset  3px  4px 8px -5px rgba(255, 255, 255, 1),
  inset -3px -4px 8px -5px rgba(255, 255, 255, 0.6),
  inset 0 -22px 30px -24px rgba(64, 74, 86, 0.22);
```

Применение — всегда одним набором, границу держим прозрачной как распорку:

```css
.card-glass {
  border: 1px solid transparent;
  border-radius: 18px;
  background-image: var(--glass-bg), var(--glass-edge);
  background-origin: padding-box, padding-box, border-box;
  background-clip:   padding-box, padding-box, border-box;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
}
```

Есть глухой вариант `--glass-bg-solid` — те же слои, но основа непрозрачная.
Нужен там, где стекло лежит **поверх** содержимого (выпадающие панели меню):
сквозь прозрачное проступает текст страницы, и не читается ни то, ни другое.

### 7.2 Утилита `.glass` — упрощённая, на лендинге не используется

В базе лежит короткий вариант того же приёма: одна подложка, одна грань, одна
тень. Вешается на что угодно — радиус и отступы остаются за тем, к чему её
приложили.

**Оговорка честная: в разметке лендинга этот класс не встречается ни разу.**
Весь стеклянный слой сайта сделан на токенах из 7.1. Утилита пригодится там,
где полный набор избыточен — мелкая плашка, кнопка, одиночный элемент, — но
выглядит она проще: без конического торца и без двойной кромки, то есть без
ощущения толщины материала. Смешивать оба варианта в одном экране не стоит:
рядом они читаются как два разных стекла.

```css
.glass {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 8px 28px rgba(43, 38, 33, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

/* На тёмном наоборот: подложка почти чёрная, светится только грань */
.glass--dark {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.10);
}

/* Без backdrop-filter — честная непрозрачная подложка */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass       { background: rgba(255, 255, 255, 0.92); }
  .glass--dark { background: rgba(26, 23, 20, 0.92); }
}
```

### 7.3 Где стекло НЕ работает

Проверено на практике, стоило переделок:

- **На фотографии.** Если бо́льшую часть плашки занимает снимок, преломлять
  стеклу нечего — остаются только следствия: блик, завал в угол и тяжёлая
  тень. Рядом с плоским фото это читается грязью на белом. Нужна плоская
  белая карточка с волосяной кромкой.
- **На тёмной секции.** `--glass-*` собран из белых градиентов и превращается
  в молочное пятно. Берите `.glass--dark` или плоскую `--c-ink-surface` с
  кромкой `--c-line-on-dark`.
- **На ровной заливке.** Стеклу нужна фактура под ним — узор, зарево, пятна.
  Иначе материал не читается вовсе.

Под крупные стеклянные плашки в секциях кладут подложку: два мягких цветовых
пятна и решётка гириха (`assets/img/decor/girih-pattern.svg`, `620px repeat`,
прозрачность около 0.55). Существует ровно затем, чтобы плашкам было что
искажать.

**Гирих можно класть только на светлое.** Файл не прозрачный: первым
элементом в нём лежит сплошной `<rect fill="#F5F0EB">`. На кремовой секции
заливка не видна — крем по крему, — а на тёмной она осветляет весь фон и
превращает его в ровный серый. На тёмных секциях подложка либо не нужна
вовсе (у плоских плашек нечего преломлять), либо собирается из одних
радиальных пятен.

---

## 8. Кнопки

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px;
  height: 52px; padding-inline: 26px;
  border-radius: var(--r-btn);
  font-weight: 700; font-size: 15px;
  white-space: nowrap;
  transition: background-color .18s ease, border-color .18s ease,
              color .18s ease, transform .18s ease;
}
.btn:hover  { transform: translateY(-2px); }
.btn:active { transform: translateY(0); }
```

| Вариант | Роль |
|---|---|
| `.btn--primary` | основной CTA, зелёная заливка |
| `.btn--ghost` | вторичная, бронзовая, на стекле |
| `.btn--light` | светлая на тёмном фоне |
| `.btn--sm` | компактная, для шапки |

```css
.btn--primary {
  background: var(--c-green);
  color: var(--c-on-dark);
  box-shadow: 0 4px 14px rgba(35, 74, 54, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.16);
}
.btn--primary:hover {
  background: var(--c-green-deep);
  box-shadow: 0 10px 26px rgba(35, 74, 54, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Бронзовая, а не зелёная: рядом с зелёной заливкой две зелёные читались
   одинаковыми по весу, и было непонятно, какая главная. */
.btn--ghost {
  padding-inline: 22px;
  border: 1.5px solid var(--c-line-gold);
  color: var(--c-gold);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
.btn--ghost:hover {
  border-color: var(--c-line-strong);
  background: rgba(255, 255, 255, 0.7);
}

.btn--light { background: var(--c-bg-alt); color: var(--c-ink-surface); }
.btn--light:hover { background: #ffffff; }

.btn--sm { letter-spacing: 0.3px; }
```

Размеры по брейкпоинтам. `.btn--sm` обязан идти **после** `.btn`: компактная
кнопка шапки должна перебивать общий размер, а не наоборот.

```css
@media (min-width: 601px) {
  .btn { height: 56px; padding-inline: 38px; font-size: 16px; }
  .btn--ghost { padding-inline: 28px; }
  .btn--sm { height: 50px; padding-inline: 30px; font-size: 15px; }
}
```

На телефоне `.btn--sm` не показывается вовсе — там бургер, — поэтому её
габаритов в базе нет.

Стрелка внутри кнопки — отдельная картинка, отъезжает на наведении:

```css
.btn img { flex: none; transition: transform .18s ease; }
.btn:hover img { transform: translateX(3px); }
```

---

## 9. Мелкие утилиты

```css
/* Декоративная линейка под текстом или слева от надзаголовка.
   В надзаголовках укорачивают до 24px. */
.rule { width: 120px; height: 2px; background: var(--c-green-bright); border: 0; }

/* Карточка на кремовом фоне */
.card { background: var(--c-bg-alt); border: 1px solid var(--c-line); border-radius: var(--r-card); }

/* Точка-разделитель в мета-строках */
.dot-sep { flex: none; width: 2px; height: 2px; border-radius: 50%;
           background: currentColor; opacity: 0.6; }
```

---

## 10. Доступность

```css
:focus-visible {
  outline: 2px solid var(--c-gold);
  outline-offset: 3px;
  border-radius: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

Пороги, которые в системе соблюдаются:

- текст — **4.5:1**, крупный текст и границы элементов — **3:1**;
- `--c-green` на белом даёт 9.98:1, белая надпись на нём — 5.36:1;
- `--c-text-muted` затемнён до `#6b645a` именно ради AA на кремовом;
- `--c-gold` затемнён до `#865b2a` по той же причине.

Цвет никогда не единственный носитель смысла: статус подкрепляется значком
или текстом.

`color-scheme: light` выставлен на `:root` намеренно. Без него браузер в
тёмной системной теме отдаёт странице тёмный желоб прокрутки, и по правому
краю встаёт чёрный столб во всю высоту.

---

## 11. Движение

```css
html { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Конвенции:

- длительности: наведение `0.18–0.2s`, появление `0.5s`, лесенка по соседям
  `0.125s` шаг;
- смягчение — внутри кейфреймов, элементный тайминг `linear`;
- зациклённое видео из CSS не останавливается. При `prefers-reduced-motion`
  показывают снимок, а `<video>` убирают через `display: none` — вторая
  версия кадра лежит в разметке заранее;
- глобальное правило выше сжимает анимацию до `0.01ms` и **оставляет
  последний кадр**. Если исходное состояние элемента `opacity: 0`, он
  исчезнет насовсем — такие системы обязаны снимать и исходное состояние.

---

## 12. Чек-лист переноса на внутреннюю страницу

1. Подключить `00-fonts.css` и пять файлов `woff2`; проверить, что цифры
   набираются Outfit, а не Almarai.
2. Скопировать блок токенов целиком — вырезать «ненужное» не стоит, пары
   светлое/тёмное работают только вместе.
3. Фон страницы — `--c-bg`, не белый.
4. Заголовки `.h1/.h2/.h3`, текст `.lead`, подписи `.meta`, надзаголовки
   `.kicker` или `.eyebrow`.
5. Сетка — `.container`, отступы через `--gutter`, брейкпоинты только
   `min-width` и строго по возрастанию.
6. Кнопки — `.btn` плюс модификатор; свои размеры не заводить.
7. Стекло — вариант из 7.1 на токенах, а не утилита `.glass`; и только там,
   где под ним есть фактура и нет фотографии.
8. Тёмный блок — перевести цвета по таблице пар из раздела 3.3, иначе текст
   и акценты пропадут.
9. Проверить `:focus-visible` на всех интерактивных элементах и поведение
   при `prefers-reduced-motion`.

---

## 13. Если исходников проекта нет

Файл самодостаточен: значения из него можно применять, ничего не скачивая.
Но две вещи — шрифты и декоративная подложка — файлами не передаются. Ниже
прямые ссылки на них и что делать, если качать неоткуда.

### Шрифты

**Способ первый — забрать настоящие файлы.** Репозиторий публичный, файлы
лежат по прямым адресам и качаются без авторизации:

```
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/fonts/almarai-400.woff2
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/fonts/almarai-700.woff2
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/fonts/almarai-800.woff2
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/fonts/outfit-600.woff2
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/fonts/outfit-700.woff2
```

Только с ними работает подмена цифр из раздела 2 — ей нужен прямой адрес
`woff2`.

**Способ второй — Google Fonts.** Оба семейства есть там:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Outfit:wght@600;700&display=swap">
```

Стек тогда упрощается:

```css
--f-body:    'Almarai', 'Segoe UI', system-ui, -apple-system, sans-serif;
--f-display: 'Outfit', 'Almarai', system-ui, sans-serif;
```

**Подмена цифр так не заработает.** Приём из раздела 2 держится на
`@font-face` с `unicode-range`, а для него нужен прямой адрес файла `woff2` —
подключённое через Google Fonts семейство переопределить нельзя. Варианты:

1. **Правильный** — взять пять файлов из `src/assets/fonts/` проекта
   (`almarai-400/700/800`, `outfit-600/700`) и объявить `'Tajiro Figures'`
   как в разделе 2. Только так цифры выглядят как на лендинге.
2. **Временный** — оставить цифры Almarai. Терпимо в мелком тексте, но на
   крупных числах заметно: тройка с плоской перекладиной, резкие стыки у
   нуля и шестёрки. На заголовках и показателях так лучше не делать.
3. **Точечный** — заворачивать числа в `<span class="num">` с
   `font-family: 'Outfit'`. Работает, но требует дисциплины в разметке.

### Решётка гириха

Декоративная подложка под крупные стеклянные плашки, чтобы стеклу было что
искажать:

```
https://raw.githubusercontent.com/danillyozniy-alt/tajiro-home/main/src/assets/img/decor/girih-pattern.svg
```

Файл необязательный: без него достаточно двух радиальных пятен. **И только
для светлых секций** — внутри лежит сплошной `<rect fill="#F5F0EB">`, на
тёмном фоне он даёт ровный серый вместо фактуры.

```css
.section-with-glass {
  position: relative;
  isolation: isolate;
}

.section-with-glass::before {
  content: '';
  position: absolute; inset: 0; z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(52% 44% at 18% 22%, rgba(212, 163, 115, 0.24) 0%, transparent 68%),
    radial-gradient(46% 40% at 84% 74%, rgba(61, 143, 99, 0.16) 0%, transparent 66%);
  opacity: 0.55;
}
```

---

## 14. Приложение: все токены одним блоком

Готово к вставке. Значения выгружены из `src/css/00-base.css` без изменений,
комментарии сняты — расшифровка ролей в разделах 3, 5, 6 и 7.

```css
:root {

  color-scheme: light;

  --c-bg:            #f5f0eb;
  --c-bg-plain:      #fbfaf9;
  --c-bg-alt:        #fbf8f3;
  --c-surface:       #ffffff;

  --glass-bg:
    linear-gradient(115deg,
      transparent 44%,
      rgba(255, 255, 255, 0.7) 54%,
      rgba(255, 255, 255, 0.95) 59%,
      rgba(255, 255, 255, 0.45) 65%,
      transparent 74%),

    linear-gradient(147deg,
      rgba(255, 255, 255, 0.82) 0%,
      rgba(255, 255, 255, 0.7) 28%,
      rgba(246, 247, 248, 0.62) 66%,
      rgba(241, 243, 245, 0.58) 100%);

  --glass-blur: blur(22px) saturate(175%);

  --glass-bg-solid:
    linear-gradient(115deg,
      transparent 44%,
      rgba(255, 255, 255, 0.7) 54%,
      rgba(255, 255, 255, 0.95) 59%,
      rgba(255, 255, 255, 0.45) 65%,
      transparent 74%),
    linear-gradient(147deg,
      #ffffff 0%,
      #fdfdfd 28%,
      #f6f7f8 66%,
      #f1f3f5 100%);

  --glass-edge:
    conic-gradient(from 128deg,
      rgba(255, 255, 255, 1) 0deg,
      rgba(255, 255, 255, 0.92) 14deg,
      rgba(255, 255, 255, 0.24) 46deg,
      rgba(255, 255, 255, 0.05) 120deg,
      rgba(255, 255, 255, 0.26) 158deg,
      rgba(255, 255, 255, 0.95) 180deg,
      rgba(255, 255, 255, 0.88) 196deg,
      rgba(255, 255, 255, 0.22) 228deg,
      rgba(255, 255, 255, 0.05) 300deg,
      rgba(255, 255, 255, 0.3) 338deg,
      rgba(255, 255, 255, 1) 360deg);

  --glass-shadow:
    0 1px 2px rgba(43, 38, 33, 0.06),
    0 8px 18px -10px rgba(43, 38, 33, 0.16),
    0 26px 46px -28px rgba(43, 38, 33, 0.32),

    0 0 0 1px rgba(43, 38, 33, 0.07),
    inset 3px 4px 8px -5px rgba(255, 255, 255, 1),
    inset -3px -4px 8px -5px rgba(255, 255, 255, 0.6),
    inset 0 -22px 30px -24px rgba(64, 74, 86, 0.22);

  --glass-shadow-float:
    0 30px 70px -30px rgba(43, 38, 33, 0.38),
    0 6px 16px -8px rgba(43, 38, 33, 0.14),
    0 0 0 1px rgba(43, 38, 33, 0.08),
    inset 3px 4px 8px -5px rgba(255, 255, 255, 1),
    inset -3px -4px 8px -5px rgba(255, 255, 255, 0.6),
    inset 0 -24px 32px -26px rgba(64, 74, 86, 0.20);
  --c-ink-surface:   #2b2621;
  --c-ink-surface-2: #1f1d1a;

  --c-text:        #2b2621;
  --c-text-strong: #403b33;
  --c-text-body:   #4d453d;
  --c-text-muted:  #6b645a;
  --c-on-dark:        #fbf8f3;
  --c-on-dark-soft:   #a9a296;
  --c-on-dark-muted:  #8e8579;

  --c-green:      #2f7352;
  --c-green-deep: #26603f;
  --c-gold:       #865b2a;
  --c-sand:       #d4a373;

  --c-green-text:    #2f6b4a;
  --c-green-bright:  #3d8f63;
  --c-green-mist:    #cfe6d9;
  --c-green-on-dark: #7fc9a0;

  --c-line:         rgba(43, 38, 33, 0.14);
  --c-line-soft:    rgba(43, 38, 33, 0.09);
  --c-line-gold:    rgba(150, 102, 47, 0.30);
  --c-line-strong:  rgba(150, 102, 47, 0.55);
  --c-line-on-dark: rgba(255, 255, 255, 0.10);
  --c-line-green:   rgba(61, 143, 99, 0.28);

  --f-body: 'Tajiro Figures', 'Almarai', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --f-display: 'Outfit', 'Almarai', system-ui, sans-serif;

  --container: 1200px;

  --gutter: 20px;

  --r-btn: 4px;
  --r-card: 6px;
  --r-pill: 100px;
  --r-arch: 250px;

  --sh-card: 0 1px 2px rgba(43, 38, 33, 0.04),
             0 12px 32px rgba(43, 38, 33, 0.06);
}
```
