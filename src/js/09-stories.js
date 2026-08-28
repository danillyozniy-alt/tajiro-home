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

     Ждём transitionend, а не таймер: событие приходит ровно тогда, когда
     лента доехала, и на медленной машине перескок не случится раньше. */
  function rewrap() {
    if (i >= BASE && i < BASE + COUNT) return;

    var onEnd = function (e) {
      if (e.propertyName !== 'transform') return;
      track.removeEventListener('transitionend', onEnd);

      track.classList.add('is-jumping');
      i = BASE + ((((i - BASE) % COUNT) + COUNT) % COUNT);
      paint();
      /* Читаем раскладку, чтобы сдвиг без хода применился до снятия класса —
         иначе браузер склеит оба изменения в один кадр. */
      void track.getBoundingClientRect().width;
      track.classList.remove('is-jumping');
    };

    track.addEventListener('transitionend', onEnd);
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
    dragging = true;
    startX = e.clientX;
    dx = 0;
    if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
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

  track.addEventListener('pointerdown', down);
  track.addEventListener('pointermove', move);
  track.addEventListener('pointerup', up);
  track.addEventListener('pointercancel', up);

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
