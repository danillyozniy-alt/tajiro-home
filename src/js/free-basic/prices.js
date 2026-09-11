/* ==========================================================================
   tajiro — Free Basic · цены по рынку

   Скрипт из прототипа, перенесён без изменений в логике. Выбор страны
   пересчитывает всё, что зависит от валюты: подписку, диапазон цен,
   выручку в панели первого экрана и ценники товаров.

   Что чем помечено в разметке:
     [data-sub]    цена подписки (в FAQ)
     [data-range]  диапазон цен каталога
     [data-week]   выручка за неделю в демо-панели
     [data-usd]    ценник товара; в атрибуте лежит цена в долларах,
                   остальное считается по курсу

   Статистика ($480B) остаётся в долларах намеренно: это размер рынка из
   отчёта, а не цена, и переводить его по курсу нечего.

   Селект ищется по .market-pick — тому же классу, что в прототипе. На
   странице он стоит на первом экране, а не в шапке: шапка общая с главной
   и про страны не знает.
   ========================================================================== */
var SUB   = {AE:'AED 149', SA:'SAR 169', QA:'QAR 139', BH:'BHD 19', OM:'OMR 19'};
var CURSY = {AE:'AED',SA:'SAR',QA:'QAR',BH:'BHD',OM:'OMR'};
var RATE  = {AE:3.6725,SA:3.75,QA:3.64,BH:0.376,OM:0.3845};
var RANGE = {AE:'AED 26–3,669', SA:'SAR 26–3,746', QA:'QAR 26–3,636', BH:'BHD 3–376', OM:'OMR 3–384'};
var WEEK  = {AE:'AED 6,760', SA:'SAR 6,900', QA:'QAR 6,700', BH:'BHD 692', OM:'OMR 707'};

function nf(x,cur){ // round: small currencies 1 decimal for products under 20
  if((cur==='BHD'||cur==='OMR')) return (Math.round(x*10)/10).toString();
  return Math.round(x).toString();
}

function localizePrices(code){
  code = code || 'AE';
  var cur = CURSY[code], rate = RATE[code];
  document.querySelectorAll('[data-sub]').forEach(function(e){ e.innerHTML = SUB[code]; });
  document.querySelectorAll('[data-range]').forEach(function(e){ e.innerHTML = RANGE[code]; });
  document.querySelectorAll('[data-week]').forEach(function(e){ e.innerHTML = WEEK[code]; });
  document.querySelectorAll('[data-usd]').forEach(function(e){
    var usd = parseFloat(e.getAttribute('data-usd'));
    e.innerHTML = cur + ' ' + nf(usd*rate, cur);
  });
}

(function(){
  var sel = document.querySelector('.market-pick') || document.querySelector('#market') || document.querySelector('#country');
  if(sel){
    sel.addEventListener('change', function(){ localizePrices(this.value); });
    localizePrices(sel.value);
  } else {
    localizePrices('AE');
  }
})();
