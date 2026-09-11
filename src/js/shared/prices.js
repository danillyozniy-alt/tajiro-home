/* ==========================================================================
   tajiro — цены по рынку

   Выбор страны в шапке пересчитывает всё, что зависит от валюты: подписку,
   диапазон цен, выручку в демо-панели и ценники товаров.

   Что чем помечено в разметке:
     [data-sub]    цена подписки
     [data-range]  диапазон цен каталога
     [data-week]   выручка за неделю в демо-панели
     [data-usd]    ценник товара; в атрибуте лежит цена в долларах,
                   остальное считается по курсу

   Статистика ($480B) остаётся в долларах намеренно: это размер рынка из
   отчёта, а не цена, и переводить его по курсу нечего.

   Скрипт общий, а не страничный: селект живёт в общей шапке, и на странице
   без помеченных цен он просто ничего не находит. Так новая страница
   получает рабочий переключатель, как только проставит атрибуты.

   Селектов на странице ДВА — в десктопной полосе и в мобильном листе, —
   поэтому обрабатываются все .market-pick разом и держатся в одном
   состоянии: человек не должен видеть в меню одну страну, а в шапке другую.
   ========================================================================== */
(function () {
  'use strict';

  var SUB   = {AE:'AED 149', SA:'SAR 169', QA:'QAR 139', BH:'BHD 19', OM:'OMR 19'};
  var CURSY = {AE:'AED', SA:'SAR', QA:'QAR', BH:'BHD', OM:'OMR'};
  var RATE  = {AE:3.6725, SA:3.75, QA:3.64, BH:0.376, OM:0.3845};
  var RANGE = {AE:'AED 26–3,669', SA:'SAR 26–3,746', QA:'QAR 26–3,636', BH:'BHD 3–376', OM:'OMR 3–384'};
  var WEEK  = {AE:'AED 6,760', SA:'SAR 6,900', QA:'QAR 6,700', BH:'BHD 692', OM:'OMR 707'};

  var picks = Array.prototype.slice.call(document.querySelectorAll('.market-pick'));
  if (!picks.length) return;

  /* Динар и риал делятся примерно на три: товар за $8 выходит меньше трёх
     единиц, и без десятой доли все дешёвые ценники схлопывались в «3». */
  function nf(x, cur) {
    if (cur === 'BHD' || cur === 'OMR') return (Math.round(x * 10) / 10).toString();
    return Math.round(x).toString();
  }

  function fill(sel, value) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (e) {
      e.textContent = value;
    });
  }

  function localizePrices(code) {
    code = SUB[code] ? code : 'AE';
    var cur = CURSY[code], rate = RATE[code];

    fill('[data-sub]', SUB[code]);
    fill('[data-range]', RANGE[code]);
    fill('[data-week]', WEEK[code]);

    Array.prototype.forEach.call(document.querySelectorAll('[data-usd]'), function (e) {
      var usd = parseFloat(e.getAttribute('data-usd'));
      e.textContent = cur + ' ' + nf(usd * rate, cur);
    });

    /* Второй селект догоняет первый — иначе в мобильном листе остаётся
       страна, выбранная до открытия меню. */
    picks.forEach(function (p) { if (p.value !== code) p.value = code; });
  }

  picks.forEach(function (p) {
    p.addEventListener('change', function () { localizePrices(this.value); });
  });

  localizePrices(picks[0].value);
})();
