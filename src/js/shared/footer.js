/* ==========================================================================
   tajiro — аккордеон в подвале
   Пара к блоку «Мобильный аккордеон» в css/14-footer.css.
   Figma: HoPojxNiFElmltha1NOl3N, node 208:7 «Footer / mobile».

   Разметка одна на оба состояния: на десктопе это пять колонок ссылок,
   ниже 600px — пять сворачиваемых рядов. Значит, скрипт обязан уметь
   не только включать аккордеон, но и полностью его снимать при уходе
   за брейкпоинт: иначе колонка так и осталась бы свёрнутой.

   Договор со стилями: свёрнутое состояние висит на .is-collapsible.
   Класс ставит этот файл — без него (скрипт не доехал, ошибка) футер
   остаётся раскрытым и рабочим, просто длинным.
   ========================================================================== */
(function () {
  'use strict';

  var nav = document.querySelector('.s-14__nav');
  if (!nav) return;

  var MOBILE = '(max-width: 600px)';

  var cols = Array.prototype.slice.call(nav.querySelectorAll('.s-14__col'));

  var rows = cols.map(function (col) {
    return { col: col, trigger: col.querySelector('.s-14__col-title') };
  }).filter(function (row) {
    return row.trigger;
  });

  if (!rows.length) return;

  function open(row, yes) {
    row.col.classList.toggle('is-open', yes);
    row.trigger.setAttribute('aria-expanded', yes ? 'true' : 'false');
  }

  /* Ниже брейкпоинта: строка сворачивается, кнопка становится кнопкой */
  function enable() {
    rows.forEach(function (row) {
      row.col.classList.add('is-collapsible');
      row.trigger.removeAttribute('tabindex');
      row.trigger.removeAttribute('aria-disabled');
      open(row, false);
    });
  }

  /* Выше брейкпоинта раскрывать нечего: снимаем и состояние, и роль
     кнопки — иначе скринридер объявлял бы развёрнутый список свёрнутым,
     а Tab спотыкался бы о пять пустышек. */
  function disable() {
    rows.forEach(function (row) {
      row.col.classList.remove('is-collapsible', 'is-open');
      row.trigger.removeAttribute('aria-expanded');
      row.trigger.setAttribute('tabindex', '-1');
      row.trigger.setAttribute('aria-disabled', 'true');
    });
  }

  rows.forEach(function (row) {
    row.trigger.addEventListener('click', function () {
      if (!row.col.classList.contains('is-collapsible')) return;
      open(row, !row.col.classList.contains('is-open'));
    });
  });

  if (!window.matchMedia) { disable(); return; }

  var mq = window.matchMedia(MOBILE);
  var sync = function (ev) { (ev.matches ? enable : disable)(); };

  sync(mq);

  if (mq.addEventListener) mq.addEventListener('change', sync);
  else mq.addListener(sync);
})();
