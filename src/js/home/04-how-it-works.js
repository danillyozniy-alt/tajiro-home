/* ==========================================================================
   04 · How it works — очередь шагов

   Активный шаг держится, пока заполняется его полоса, и передаёт очередь
   следующему. Момент передачи берётся не таймером, а событием окончания
   той самой анимации: тогда полоса и переключение не расходятся, даже
   если вкладка была свёрнута или курсор поставил очередь на паузу.

   Клик и Enter/Пробел переключают вручную. При ручном выборе полоса
   перезапускается: без сброса повтор того же шага не перерисовывался бы.
   ========================================================================== */
(function () {
  'use strict';

  var list = document.getElementById('s04-steps');
  if (!list) return;

  var steps = Array.prototype.slice.call(list.querySelectorAll('.s-04__step'));
  if (!steps.length) return;

  var card = document.getElementById('s04-card');
  var label = card && card.querySelector('.s-04__card-t');
  var desc  = card && card.querySelector('.s-04__card-d');
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setCard(step) {
    if (!card || !label) return;
    var next = step.getAttribute('data-card');
    var note = step.getAttribute('data-card-desc') || '';
    if (!next || next === label.textContent) return;
    card.classList.add('is-swapping');
    setTimeout(function () {
      label.textContent = next;
      if (desc) desc.textContent = note;
      card.classList.remove('is-swapping');
    }, 130);   /* 280 мс читались как отставание плашки от шага */
  }

  function activate(step) {
    steps.forEach(function (s) { s.classList.remove('is-active'); });
    /* Перезапуск правила с анимацией: без чтения раскладки браузер
       склеивает снятие и возврат класса в один кадр, и полоса не
       стартует заново. */
    void step.offsetWidth;
    step.classList.add('is-active');
    setCard(step);
  }

  steps.forEach(function (step) {
    step.addEventListener('click', function () { activate(step); });

    step.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      activate(step);
    });

    step.addEventListener('animationend', function (e) {
      if (reduce) return;
      if (e.animationName !== 's04-fill') return;
      if (!step.classList.contains('is-active')) return;
      activate(steps[(steps.indexOf(step) + 1) % steps.length]);
    });
  });
})();
