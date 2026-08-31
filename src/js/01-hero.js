/* ==========================================================================
   tajiro — витрина на первом экране
   Пара к блоку «Витрина» в css/01-hero.css.

   Колода раздаётся по кругу: передняя карточка уезжает влево и гаснет,
   стопка подаётся вперёд, сзади встаёт следующая. Товары идут кольцом и
   не кончаются.

   Скрипт здесь ведёт только ПОРЯДОК: каждой карточке он ставит класс её
   положения в стопке (is-1 — передняя, is-4 — глубина), а само движение
   доводят переходы в CSS. Считать координаты в JS было бы лишней работой:
   положений всего четыре, и они прекрасно описываются состоянием.

   Отдельная тонкость — возврат. Уехавшая карточка обязана вернуться в
   глубину стопки, но незаметно: если просто снять is-out, браузер поведёт
   её обратно через весь экран. Поэтому на один кадр вешается is-reset,
   который отключает переход, и только потом ставится новое положение.

   ДОГОВОР С РАЗМЕТКОЙ
   Классов положения в HTML нет вовсе: их расставляет этот файл. Нет
   скрипта — карточки лежат стопкой без разбора, первая сверху, страница
   цела и читается. Скрытого состояния «по умолчанию» не существует.
   ========================================================================== */
(function () {
  'use strict';

  var deck = document.getElementById('s01-deck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.s-01__card'));
  if (cards.length < 3) return;

  var now   = document.getElementById('s01-now');
  var stock = document.getElementById('s01-stock');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var still  = !!(reduce && reduce.matches);

  /* Такт и длительность выезда читаются из стилей: там они объявлены
     токенами, и держать вторую копию чисел в скрипте — верный способ
     развести их при первой же правке. */
  var css   = getComputedStyle(document.querySelector('.s-01'));
  var BEAT  = seconds(css.getPropertyValue('--s01-beat'),  3.2) * 1000;
  var SLIDE = seconds(css.getPropertyValue('--s01-slide'), 0.72) * 1000;

  function seconds(v, fallback) {
    v = String(v).trim();
    if (!v) return fallback;
    var n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return /ms$/.test(v) ? n / 1000 : n;
  }

  /* Верхняя карточка колоды. Дальше индекс идёт по кругу. */
  var head = 0;

  function place() {
    for (var i = 0; i < cards.length; i++) {
      /* Расстояние от передней карточки по кольцу: 0 — передняя, 1 и 2 —
         видимые слои стопки, остальное — глубина. */
      var d = (i - head + cards.length) % cards.length;
      var slot = d > 3 ? 4 : d + 1;
      cards[i].className = 's-01__card is-' + slot;
    }
  }

  function label() {
    if (!now) return;
    var name = cards[head].querySelector('.s-01__card-name');
    if (!name) return;
    now.textContent = name.textContent;

    /* Класс снимается и ставится заново с принудительной перерисовкой между:
       без неё браузер склеивает две правки в одну и анимация не стартует. */
    now.classList.remove('is-swap');
    void now.offsetWidth;
    now.classList.add('is-swap');
  }

  function deal() {
    var out = cards[head];

    out.classList.remove('is-1');
    out.classList.add('is-out');

    head = (head + 1) % cards.length;

    /* Стопка подаётся вперёд сразу же, вместе с уходом передней: если ждать
       её ухода, между движениями появляется пауза и раздача разваливается
       на два отдельных события. */
    for (var i = 0; i < cards.length; i++) {
      if (cards[i] === out) continue;
      var d = (i - head + cards.length) % cards.length;
      cards[i].className = 's-01__card is-' + (d > 3 ? 4 : d + 1);
    }

    label();

    /* Уехавшую возвращаем в глубину стопки без перехода — см. шапку файла */
    setTimeout(function () {
      out.className = 's-01__card is-reset is-4';
      void out.offsetWidth;
      out.className = 's-01__card is-4';
    }, SLIDE + 40);
  }

  /* --- Счётчик каталога ----------------------------------------------------
     Набирается один раз при загрузке. Это факт о каталоге, а не обещание
     заработка: столько товаров лежит в магазине с первого дня. */
  function count(el, to, ms) {
    if (!el) return;
    if (still) { el.textContent = String(to); return; }

    var t0 = 0;
    (function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);          /* торможение к концу */
      el.textContent = String(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    })(0);
  }

  place();
  count(stock, 112, 1400);

  if (still) return;

  var timer = setInterval(deal, BEAT);

  /* За кадром раздачу останавливаем: браузер и так душит таймеры в скрытой
     вкладке, но с интервалом это даёт залп накопившихся тактов при
     возвращении — стопка прокручивается рывком. */
  document.addEventListener('visibilitychange', function () {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(deal, BEAT);
  });
})();
