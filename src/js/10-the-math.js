/* ==========================================================================
   10 · Калькулятор маржи

   Слайдер «заказов в день» и три суммы под ним. Считает на лету, без
   анимации самих цифр: они меняются мгновенно, а факт приезда отмечает
   каскад-эмфаза в CSS (класс is-settled).

   Скрипт отдаёт стилям ровно три вещи:

     --s10-p     положение бегунка от 0 до 1. По нему CSS рисует и заливку
                 дорожки, и ореол — из одного источника, поэтому разъехаться
                 они не могут.
     is-demo     ореол-приглашение до первого касания. Снимается навсегда,
                 как только человек взялся за бегунок.
     is-drag     палец на бегунке: увеличенный кант.
     is-settled  бегунок отпущен — одноразовый каскад по цифрам.
   ========================================================================== */
(function () {
  var root = document.getElementById('the-math');
  if (!root) return;

  var calc   = root.querySelector('.s-10__calc');
  var slider = root.querySelector('.s-10__slider');
  if (!calc || !slider) return;

  var out     = root.querySelector('#s10-orders-out');
  var sales   = root.querySelector('#s10-daily-sales');
  var cut     = root.querySelector('#s10-daily-cut');
  var monthly = root.querySelector('#s10-monthly');
  var noteQty = root.querySelector('#s10-note-orders');

  var AOV   = 40;     /* средний чек, $ */
  var SHARE = 0.65;   /* доля владельца магазина */
  var DAYS  = 30;

  var still = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function money(v) {
    return '$' + Math.round(v).toLocaleString('en-US');
  }

  function render() {
    var n = Number(slider.value);
    var min = Number(slider.min) || 0;
    var max = Number(slider.max) || 100;

    /* Доля хода, а не пиксели: ширину дорожки скрипт не знает и знать не
       должен — пересчёт на ресайзе тогда не нужен вовсе. */
    calc.style.setProperty('--s10-p', max === min ? 0 : (n - min) / (max - min));

    var daily = n * AOV;
    var keep  = daily * SHARE;

    if (out)     out.textContent     = String(n);
    if (sales)   sales.textContent   = money(daily);
    if (cut)     cut.textContent     = money(keep);
    if (monthly) monthly.textContent = money(keep * DAYS);
    if (noteQty) noteQty.textContent = String(n);
  }

  /* Каскад перезапускается только со снятием класса и пересчётом стиля:
     без этого повторный приезд на то же значение анимацию не проиграет. */
  function settle() {
    if (still) return;
    calc.classList.remove('is-settled');
    void calc.offsetWidth;
    calc.classList.add('is-settled');
  }

  slider.addEventListener('input', render);
  slider.addEventListener('change', settle);

  /* Ореол-приглашение живёт до первого касания и больше не возвращается:
     подсказка, которой человек уже воспользовался, превращается в шум. */
  function grabbed() {
    calc.classList.remove('is-demo');
    calc.classList.add('is-drag');
  }
  function released() {
    calc.classList.remove('is-drag');
  }

  slider.addEventListener('pointerdown', grabbed);
  slider.addEventListener('pointerup', released);
  slider.addEventListener('pointercancel', released);
  slider.addEventListener('focus', function () { calc.classList.remove('is-demo'); });

  if (!still) calc.classList.add('is-demo');
  render();
})();
