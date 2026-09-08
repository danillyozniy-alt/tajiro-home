/* ==========================================================================
   01 · Подзаголовок первого экрана — подсветка по кускам

   По строке идёт волна: один кусок горит, соседи приглушены. Смысл в том,
   что подзаголовок перечисляет составные части предложения, и подсветка
   произносит их по очереди, вместо того чтобы вываливать разом.

   Куски перечисления держатся короче остальных: у них своя выдержка в
   разметке (data-hold). Длинная выдержка на коротком «the store,» читается
   заминкой.

   При системной просьбе о покое волны нет: подсвечивается тот кусок, что
   помечен data-static, — предложение остаётся читаемым, но неподвижным.
   ========================================================================== */
(function () {
  'use strict';

  var sub = document.getElementById('hero-sub');
  if (!sub) return;

  var segs = Array.prototype.slice.call(sub.querySelectorAll('.s-hero__seg'));
  if (!segs.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce && reduce.matches) {
    (sub.querySelector('.s-hero__seg[data-static]') || segs[0]).classList.add('is-on');
    return;
  }

  var HOLD = 2600, FIRST = 700, i = -1, timer = null;

  function step() {
    if (i >= 0) {
      segs[i].classList.remove('is-on');
      segs[i].classList.add('is-off');
    }
    i = (i + 1) % segs.length;
    segs[i].classList.remove('is-off');
    segs[i].classList.add('is-on');
    timer = setTimeout(step, +segs[i].getAttribute('data-hold') || HOLD);
  }

  timer = setTimeout(step, FIRST);

  /* За экраном не считаем: подсветка невидимой строки — пустая работа */
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (rows) {
      if (rows[0].isIntersecting) {
        if (!timer) timer = setTimeout(step, 200);
      } else {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: 0.1 }).observe(sub);
  }
})();
