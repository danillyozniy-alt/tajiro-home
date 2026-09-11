/* ==========================================================================
   tajiro — витрина каталога (секция 07)
   Пара к блоку «Витрина каталога» в css/07-pillar-products.css.

   Лента едет постоянно, сквозь неподвижную полосу фокуса. Задача скрипта
   одна: понять, какая строка сейчас в полосе, и подсветить её вместе с
   отзывом внизу — отзывы написаны про эти самые товары и идут в том же
   порядке.

   Индекс берётся из ФАКТИЧЕСКОГО положения ленты, а не из своего таймера.
   Таймер и CSS-анимация живут по разным часам и за несколько минут
   расходятся: подсветка уезжала бы со строки, а реплика — с товаром.
   ========================================================================== */
(function () {
  'use strict';

  var win = document.querySelector('.s-07__window');
  if (!win) return;

  var track  = win.querySelector('.s-07__track');
  var list   = win.querySelector('.s-07__list');
  if (!track || !list) return;

/* Копии набора для бесшовной петли. Делаются здесь, а не в разметке:
     в цельном файле дубли вшили бы те же шесть картинок повторно.

     Копий именно две, а не одна. Такт уводит ленту на шесть строк — с
     фокусом 2 это значит, что в конце окно стоит на строке 10 и показывает
     строки 10-14. При одной копии строк всего двенадцать, и последние три
     кадра ленты пустые: она доезжает до конца набора и обрывается. Три
     набора дают восемнадцать строк, и под конечным положением остаётся
     запас. Условие простое: строк должно быть не меньше, чем конец хода
     плюс высота окна.

     Клоны скрыты от скринридера: тот же список читался бы трижды. */
  for (var c = 0; c < 2; c++) {
    var clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }
  track.classList.add('is-live');

  var rows   = Array.prototype.slice.call(win.querySelectorAll('.s-07__row'));
  var proofs = Array.prototype.slice.call(document.querySelectorAll('.s-07__proof-item'));
  if (!rows.length) return;

  var SETS = 3;                        /* оригинал плюс две копии выше */
  var COUNT = rows.length / SETS;      /* товаров в наборе */

  var still = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rowHeight() {
    return rows[0].getBoundingClientRect().height || 84;
  }

  /* Какая строка сейчас пересекает полосу фокуса.

     Считаем не по времени, а по геометрии: берём центр полосы и ищем
     строку, которая его накрывает. Так ответ верен при любом состоянии
     анимации — включая паузу, ускорение вкладки и возврат из фона. */
  function focused() {
    var band = win.getBoundingClientRect();
    var h = rowHeight();
    var focusIndex = parseFloat(getComputedStyle(win.closest('.s-07') || win)
                       .getPropertyValue('--s07-focus')) || 2;
    var y = band.top + h * focusIndex + h / 2;

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i].getBoundingClientRect();
      if (y >= r.top && y < r.bottom) return i % COUNT;
    }
    return -1;
  }

  var cur = -1;

  function sync() {
    var i = focused();
    if (i < 0 || i === cur) return;
    cur = i;

    /* Подсвечиваем обе копии строки: какая из них сейчас в полосе —
       вопрос фазы, а выглядеть они обязаны одинаково. */
    for (var k = 0; k < rows.length; k++) {
      rows[k].classList.toggle('is-focus', k % COUNT === i);
    }

    for (var p = 0; p < proofs.length; p++) {
      proofs[p].classList.toggle('is-shown', p === i);
    }
  }

  /* --- Ход ---------------------------------------------------------------
     Лента крутится только пока секция в кадре: за кадром это перерисовки
     впустую, а на телефоне ещё и батарея. */
  var raf = null;

  function loop() {
    sync();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf) return;
    track.style.animationPlayState = 'running';
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    track.style.animationPlayState = 'paused';
  }

  sync();   /* первый кадр размечаем всегда, даже при reduced-motion */

  if (still || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0.15 }).observe(win);
})();
