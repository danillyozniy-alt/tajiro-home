/* ==========================================================================
   tajiro — карусель историй (секция 09)
   Пара к блоку «Карусель» в css/09-social-proof.css.

   Соседние истории видны по краям, приглушённые. Раньше три карточки лежали
   в одной ячейке грида и подменялись на месте: карточка возникала из
   ниоткуда, и то, что это лента, было не прочитать.

   Ленту можно тянуть пальцем или мышью. Копии набора делает скрипт, а не
   разметка: в цельном файле дубли вшили бы те же портреты трижды.
   ========================================================================== */
(function () {
  'use strict';

  var deck = document.querySelector('.s-09__deck');
  if (!deck) return;

  /* Тянуть можно за всю ширину секции, а не только за карточки. Колода
     занимает лишь среднюю тысячу с небольшим пикселей, и по бокам от неё
     оставалась мёртвая полоса: палец там ложится на фон, лента не едет, и
     жест выглядит сломанным. Захват вешаем на секцию. */
  var area = deck.closest('section') || deck;

  var track = deck.querySelector('.s-09__track');
  if (!track) return;

  var originals = Array.prototype.slice.call(track.querySelectorAll('.s-09__card'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.s-09__dot'));
  if (originals.length < 2) return;

  var COUNT = originals.length;
  var STEP = 13000;      /* пауза между автоматическими шагами */
  var THROW = 60;        /* с какого сдвига бросок считается перелистыванием */

  var still = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Три набора --------------------------------------------------------
     Соседи обязаны быть с обеих сторон: с двумя наборами слева от первой
     истории пусто, и карточка снова возникает из ниоткуда — ровно то, от
     чего уходили. Набор слева, набор справа, работаем в среднем. */
  function clone(card) {
    var c = card.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    return c;
  }

  originals.forEach(function (card) { track.appendChild(clone(card)); });

  /* Набор слева собирается с конца: вставка в начало переворачивает порядок */
  for (var n = originals.length - 1; n >= 0; n--) {
    track.insertBefore(clone(originals[n]), track.firstChild);
  }

  var cards = Array.prototype.slice.call(track.querySelectorAll('.s-09__card'));
  var BASE = COUNT;              /* начало рабочего набора */
  var i = BASE;

  function paint() {
    for (var k = 0; k < cards.length; k++) {
      cards[k].classList.toggle('is-active', k === i);
    }
    var live = (((i - BASE) % COUNT) + COUNT) % COUNT;
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('is-active', d === live);
    }
    track.style.setProperty('--s09-i', i);
  }

  /* --- Шов петли ----------------------------------------------------------
     Выйдя за рабочий набор, показываем крайнюю копию ходом — она выглядит
     как продолжение, — и молча переставляем ленту на ту же карточку внутри
     набора. Кадр совпадает сам с собой, шва не видно.

     Ждём, когда лента доедет, а не отмеряем таймером наугад: на медленной
     машине перескок случился бы раньше времени, посреди хода.

     Но ждать ТОЛЬКО события нельзя. Ход можно прервать — палец ложится на
     ленту, пока она едет, и класс is-dragging снимает переход. Тогда
     браузер шлёт transitioncancel, а transitionend не придёт никогда:
     обработчик висит впустую, индекс остаётся за набором и с каждым шагом
     растёт — 6, 7, 8, 9. На девятом карточек уже нет, и на месте ленты
     остаётся пустота.

     Поэтому ждём три вещи разом: доехало, прервано, вышло время. Что
     наступит первым, то и запускает перескок, и ровно один раз.

     Срок взят с большим запасом к ходу в 0.85 s. В обычной жизни он не
     используется вовсе — событие приходит раньше, — а тонкий запас дал бы
     ровно ту беду, от которой ушли: на медленной машине резерв сработал бы
     первым и перескок случился бы посреди хода. */
  var SETTLE = 1400;
  var pending = null;

  function rewrap() {
    if (i >= BASE && i < BASE + COUNT) return;
    if (pending) return;          /* уже ждём — второй раз не подписываемся */

    var listen = function (e) {
      /* Строго с САМОЙ ленты. transitionend всплывает, а ход по transform
         есть и у карточек — то самое уменьшение соседей, и длительность у
         него та же, 0.85 s. Без проверки цели перескок срабатывал по чужому
         событию: какая карточка доехала первой, та его и запускала, лента к
         этому моменту ещё шла — и подмена происходила на глазах. */
      if (e.target !== track || e.propertyName !== 'transform') return;
      jump();
    };

    var stopWaiting = function () {
      if (!pending) return false;
      clearTimeout(pending.timer);
      track.removeEventListener('transitionend', listen);
      track.removeEventListener('transitioncancel', listen);
      pending = null;
      return true;
    };

    var jump = function () {
      if (!stopWaiting()) return;

      /* Наезд снимаем ДО того, как погасим ходы.

         is-jumping ставит transition: none, а это мгновенно доводит идущий
         переход до конечного значения. Замерь после — и вместо середины
         наезда всегда получишь 1.06, то есть ровно то, от чего уходим. */
      var out = cards[i];
      var shotFrom = out && out.querySelector('.s-09__shot');
      var carry = shotFrom ? getComputedStyle(shotFrom).transform : null;

      track.classList.add('is-jumping');

      /* Приходящая карточка принимает вид уходящей мгновенно — ходы на шве
         погашены стилями. Наезд переносим накладкой: при автоходе он и так
         совпал бы (13 с между шагами против 9 с наезда), но пальцем историю
         листают когда угодно, и на уходящей он может стоять на середине. */
      i = BASE + ((((i - BASE) % COUNT) + COUNT) % COUNT);
      var shotTo = cards[i] && cards[i].querySelector('.s-09__shot');
      if (carry && shotTo) shotTo.style.transform = carry;

      paint();
      /* Читаем раскладку, чтобы сдвиг без хода применился до снятия класса —
         иначе браузер склеит оба изменения в один кадр. */
      void track.getBoundingClientRect().width;
      track.classList.remove('is-jumping');

      /* Накладку снимаем СЛЕДУЮЩЕЙ задачей, а не тут же: иначе браузер
         склеит её постановку и снятие в один кадр, и переноса не будет
         вовсе. Отпущенный наезд доедет до 1.06 с того места, где стоял. */
      if (shotTo) {
        setTimeout(function () { shotTo.style.transform = ''; }, 0);
      }
    };

    pending = { timer: setTimeout(jump, SETTLE) };
    track.addEventListener('transitionend', listen);
    track.addEventListener('transitioncancel', listen);
  }

  function go(dir) {
    i += dir;
    paint();
    rewrap();
  }

  /* --- Автоход ----------------------------------------------------------
     Идёт, только пока секция в кадре: за кадром это таймер впустую. */
  var timer = null;

  function start() {
    if (timer || still) return;
    timer = setInterval(function () { go(1); }, STEP);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  /* --- Перетаскивание ----------------------------------------------------
     Лента идёт за пальцем, а не ждёт отпускания: иначе жест не читается как
     перелистывание. На отпускании — бросок, если утащили дальше порога,
     иначе возврат на место. */
  var dragging = false, startX = 0, dx = 0;

  function down(e) {
    if (e.button != null && e.button !== 0) return;

    /* По вертикали ограничиваемся полосой колоды: заголовок секции остаётся
       обычным текстом, его можно выделить, а не утащить вместе с лентой.
       Запас в сорок пикселей — чтобы не искать край на ощупь. */
    var r = deck.getBoundingClientRect();
    if (e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;

    dragging = true;
    startX = e.clientX;
    dx = 0;
    if (area.setPointerCapture) area.setPointerCapture(e.pointerId);
    track.classList.add('is-dragging');
    stop();                       /* пока тянут, автоход молчит */
  }

  function move(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.setProperty('--s09-drag', dx + 'px');
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    track.style.setProperty('--s09-drag', '0px');

    if (Math.abs(dx) > THROW) go(dx < 0 ? 1 : -1);
    start();
  }

  /* Родное перетаскивание картинок и выделение текста заводит сам браузер,
     и оно перебивает наш жест: палец тащит по карточке — уезжает не лента,
     а портрет с полупрозрачным призраком под курсором. Гасим на подходе.

     Синтетическими событиями это не проверить: dragstart браузер поднимает
     только от настоящего ввода. */
  area.addEventListener('dragstart', function (e) { e.preventDefault(); });

  area.addEventListener('pointerdown', down);
  area.addEventListener('pointermove', move);
  area.addEventListener('pointerup', up);
  area.addEventListener('pointercancel', up);

  /* Ссылка внутри карточки не должна срабатывать после броска: палец
     проехал по ней, но нажатием это не было. */
  track.addEventListener('click', function (e) {
    if (Math.abs(dx) > 4) { e.preventDefault(); e.stopPropagation(); }
    dx = 0;
  }, true);

  paint();

  if (still) return;

  if (!('IntersectionObserver' in window)) { start(); return; }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0.25 }).observe(deck);
})();
