/* ==========================================================================
   tajiro — аккордеон вопросов на странице «Start for Free»
   Пара к css/f05-faq.css.

   Родня — аккордеон подвала (js/14-footer.js), но без ветки matchMedia:
   там разметка на десктопе разворачивается в пять колонок ссылок и
   сворачивать нечего, здесь же вопросы сворачиваются на любой ширине.

   Договор со стилями: свёрнутое состояние висит на .is-collapsible. Класс
   ставит этот файл — если он не доехал или упал, все ответы остаются
   раскрытыми и читаемыми. Скрытого состояния «по умолчанию» нет.
   ========================================================================== */
(function () {
  'use strict';

  var wrap = document.querySelector('.f-05__wrap');
  if (!wrap) return;

  var rows = Array.prototype.slice.call(wrap.querySelectorAll('.f-05__row'))
    .map(function (row) {
      return { row: row, trigger: row.querySelector('.f-05__trigger') };
    })
    .filter(function (item) { return item.trigger; });

  if (!rows.length) return;

  function open(item, yes) {
    item.row.classList.toggle('is-open', yes);
    item.trigger.setAttribute('aria-expanded', yes ? 'true' : 'false');
  }

  rows.forEach(function (item) {
    item.row.classList.add('is-collapsible');
    open(item, false);

    /* Раскрытие множественное: соседей не трогаем. Закрытие строки выше
       сдвинуло бы страницу под пальцем ровно в момент нажатия. */
    item.trigger.addEventListener('click', function () {
      open(item, !item.row.classList.contains('is-open'));
    });
  });
})();
