/* ==========================================================================
   tajiro — песок на первом экране
   Пара к блоку «Песок» в css/01-hero.css.

   Фигура сложена из крупинок, и крупинки НЕПРЕРЫВНО СРЫВАЮТСЯ с неё:
   поднимаются, уходят влево и вверх, тают. На их месте тут же появляются
   новые. Фигура не рассыпается и не собирается — она всё время осыпается и
   всё время цела, как песчаный портрет на ветру.

   Первый заход был статичным: точки стояли и еле заметно качались. Со
   стороны это читалось растром, а не движением, то есть эффекта не было
   вовсе. Здесь движется всё поле, а не только край.

   КАК ЭТО СДЕЛАНО

   Снимок кладётся на служебный холст, с него читаются пиксели. По сетке с
   шагом в пару пикселей считается «чернильность»: чем темнее исходный
   пиксель, тем крупнее и плотнее крупинка. Светлое отсеивается порогом.

   Снимок под эффект снят отдельно: тёмная фигура на выбеленном фоне, руки
   раскинуты, между руками и телом просветы. Это не украшение, а условие —
   на обычном кадре «человек за столом у стены» порог не отделяет фигуру от
   фона (они близки по светлоте), и вместо силуэта выходит серый
   прямоугольник, в котором ничего не узнать.

   Крупинки делятся надвое.

     Ядро     стоит. Рисуется ОДИН раз и дальше каждый кадр копируется
              готовым буфером — по нему не проходят.

     Летящие  живут по кругу. Крупинка снимается со своего места, уходит по
              ветру с завихрением, гаснет — и начинает сначала. Возрасты
              разведены, поэтому поток непрерывный, а не пульсирующий.

   Доля летящих растёт к левому и верхнему краю: там осыпается почти всё,
   в глубине фигуры — десятая часть, чтобы середина не стояла мёртвой.
   Граница размыта шумом: ровная линия выдала бы рисунок.

   ПОЧЕМУ НЕ ХОЛСТОМ, А ПИКСЕЛЯМИ

   У летящей крупинки прозрачность меняется каждый кадр. На холсте это
   означало бы смену состояния на каждой из десяти тысяч — дороже самой
   отрисовки. Поэтому кадр собирается прямо в буфере пикселей: ядро
   копируется целиком одной операцией, летящие подмешиваются поверх
   обычным альфа-смешиванием. Ни одного вызова холста в цикле.

   ДОГОВОР СО СТИЛЯМИ

   Пока холст не готов, виден обычный снимок. Класс is-sand на фотоблоке
   ставит этот файл — и только после того, как первый кадр нарисован. Нет
   скрипта, нет холста, не дали прочитать пиксели — на экране остаётся
   фотография.
   ========================================================================== */
(function () {
  'use strict';

  var figure = document.querySelector('.s-01__portrait');
  var img    = figure && figure.querySelector('.s-01__shot');
  var canvas = figure && figure.querySelector('.s-01__sand');
  if (!figure || !img || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* --- Настройки ---------------------------------------------------------- */

  /* Шаг сетки в CSS-пикселях. Мельче — крупинки смыкаются в заливку и песок
     перестаёт читаться песком. */
  var STEP       = 2.6;
  var STEP_SMALL = 3.3;   /* на телефоне точек меньше: и быстрее, и виднее */

  /* Порог светлоты. Фон на снимке выбелен, фигура почти чёрная — порог стоит
     у самого белого и отделяет их сам, вырезать ничего не надо. */
  var CUTOFF = 0.94;
  var GAMMA  = 0.85;      /* меньше единицы — средние тона тяжелеют */

  /* Поле осыпи: слева, сверху и снизу. Нижний край обязателен: кадр режет
     фигуру по колени, и без осыпи низ читается обрубом, а не песком. Ровно
     на это и была жалоба. */
  var EDGE_L = 0.42;
  var EDGE_T = 0.26;
  var EDGE_B = 0.30;
  var NOISE  = 0.30;      /* размытие границы поля */

  /* Доля летящих в глубине фигуры и на краю */
  var FLY_CORE = 0.12;
  var FLY_EDGE = 0.94;

  /* Ветер: куда уносит крупинку за её жизнь, в CSS-пикселях. У низа он
     свой — там песок осыпается ВНИЗ, а не поднимается: фигура должна
     стекать в основание, а не парить оторванной от него. */
  var WIND_X  = -104;
  var WIND_Y  = -34;
  var WIND_BX = -34;
  var WIND_BY = 78;
  var TURB    = 10;       /* завихрение поперёк ветра */

  var LIFE   = 3.0;       /* секунд на путь крупинки */

  /* Поле, в которое улетает песок. Числа повторены в css/01-hero.css:
     разъедутся — осыпь обрежется по краю холста. */
  var BLEED_L = 116;
  var BLEED_T = 56;
  var BLEED_B = 70;

  var INK  = [43, 38, 33];     /* --c-text */
  var SAND = [150, 108, 58];   /* между --c-gold и --c-sand: летящее теплее */

  /* --- Служебное ---------------------------------------------------------- */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Детерминированный шум: клетка всегда даёт одно и то же число.
     Math.random здесь нельзя — при пересборке на изменение ширины поле
     перерисовалось бы заново и кадр дёрнулся бы. */
  function hash(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothstep(a, b, v) {
    var t = (v - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  var dpr = 1, W = 0, H = 0, PW = 0, PH = 0;
  var frameData = null, coreData = null;
  var raf = 0, t0 = 0, built = false;

  /* Летящие крупинки: параллельные массивы, а не объекты. Десять тысяч
     объектов — это десять тысяч промахов мимо кэша на каждом кадре. */
  var N = 0;
  var hx, hy, sz, al, gust, born, edge;

  /* --- Сборка ------------------------------------------------------------- */

  function build() {
    var box = figure.getBoundingClientRect();
    var figW = Math.round(box.width);
    var figH = Math.round(box.height);
    if (!figW || !figH || !img.naturalWidth) return false;

    W = figW + BLEED_L;
    H = figH + BLEED_T + BLEED_B;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    PW = Math.round(W * dpr);
    PH = Math.round(H * dpr);

    canvas.width  = PW;
    canvas.height = PH;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    /* --- Читаем пиксели снимка ------------------------------------------
       Кадр объектом cover с якорем 50% 40% — тем же, что у самой картинки
       в стилях: песок обязан совпасть с фотографией под ним. */
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(figW / iw, figH / ih);
    var cw = figW / scale, ch = figH / scale;
    var cx = (iw - cw) * 0.5;
    var cy = (ih - ch) * 0.4;

    var read = document.createElement('canvas');
    read.width  = Math.max(1, Math.round(figW / 2));
    read.height = Math.max(1, Math.round(figH / 2));
    var rctx = read.getContext('2d', { willReadFrequently: true });
    var data;

    try {
      rctx.drawImage(img, cx, cy, cw, ch, 0, 0, read.width, read.height);
      data = rctx.getImageData(0, 0, read.width, read.height).data;
    } catch (err) {
      /* Снимок с чужого домена сделал бы холст «грязным». Своих картинок это
         не касается, но падать из-за одной неудачной сборки страница не
         должна: на экране остаётся фотография. */
      return false;
    }

    var step = figW < 420 ? STEP_SMALL : STEP;
    var kx = read.width / figW, ky = read.height / figH;

    frameData = ctx.createImageData(PW, PH);
    coreData = ctx.createImageData(PW, PH).data;

    /* Сначала в обычные массивы: сколько выйдет летящих, заранее неизвестно */
    var Ax = [], Ay = [], As = [], Aa = [], Ag = [], Ab = [], Ae = [];

    for (var y = 0; y < figH; y += step) {
      for (var x = 0; x < figW; x += step) {

        /* Индексы подрезаны по краю буфера: последняя клетка ряда иначе
           округляется в пиксель за его границей, и светлота выходит NaN. */
        var sy = Math.min(read.height - 1, Math.round(y * ky));
        var sx = Math.min(read.width  - 1, Math.round(x * kx));
        var px = (sy * read.width + sx) * 4;
        var lum = (data[px] * 0.2126 + data[px + 1] * 0.7152 + data[px + 2] * 0.0722) / 255;

        var ink = (CUTOFF - lum) / CUTOFF;
        if (!(ink > 0.04)) continue;
        ink = Math.pow(ink > 1 ? 1 : ink, GAMMA);

        /* Поле осыпи: у левого, верхнего и нижнего краёв, с рваной границей */
        var sL = 1 - smoothstep(0, EDGE_L, x / figW);
        var sT = 1 - smoothstep(0, EDGE_T, y / figH);
        var sB = smoothstep(1 - EDGE_B, 1, y / figH);
        var s = sL > sT ? sL : sT;
        if (sB > s) s = sB;
        s += (hash(x, y) - 0.5) * NOISE;
        s = s < 0 ? 0 : s > 1 ? 1 : s;

        /* Низ осыпается вниз. Определяем это здесь, а не в кадре: у поля
           три источника, и в цикле отрисовки их уже не различить. */
        var down = sB > sL && sB > sT;

        var size  = (0.26 + ink * 0.84) * step;
        var alpha = 0.55 + ink * 0.45;
        var cxp = BLEED_L + x, cyp = BLEED_T + y;

        if (hash(y + 0.5, x + 0.5) < FLY_CORE + (FLY_EDGE - FLY_CORE) * s) {
          Ax.push(cxp);
          Ay.push(cyp);
          As.push(size);
          Aa.push(alpha);
          Ag.push(0.55 + hash(x * 0.31, y * 0.77) * 0.95);   /* своя сила ветра */
          Ab.push(hash(x * 1.7, y * 0.13));                  /* возраст на старте */
          Ae.push(down ? -s : s);   /* знак несёт направление ветра */
          continue;
        }

        blot(coreData, cxp, cyp, size, alpha, INK);
      }
    }

    N = Ax.length;
    hx = new Float32Array(Ax);  hy = new Float32Array(Ay);
    sz = new Float32Array(As);  al = new Float32Array(Aa);
    gust = new Float32Array(Ag); born = new Float32Array(Ab);
    edge = new Float32Array(Ae);

    return N > 0;
  }

  /* --- Крупинка в буфер ---------------------------------------------------
     Обычное альфа-смешивание «источник поверх». ImageData не
     премультиплицирована, поэтому цвет считается с учётом уже накопленной
     прозрачности — иначе на разреженных местах вылезала бы грязь. */
  function blot(buf, cssX, cssY, cssSize, a, rgb) {
    if (!(a > 0.004)) return;
    if (a > 1) a = 1;

    var n  = Math.max(1, Math.round(cssSize * dpr));
    var x0 = (cssX * dpr) | 0;
    var y0 = (cssY * dpr) | 0;
    var w = n, h = n;

    if (x0 < 0) { w += x0; x0 = 0; }
    if (y0 < 0) { h += y0; y0 = 0; }
    if (w <= 0 || h <= 0 || x0 >= PW || y0 >= PH) return;
    if (x0 + w > PW) w = PW - x0;
    if (y0 + h > PH) h = PH - y0;

    var r = rgb[0], g = rgb[1], b = rgb[2];

    for (var j = 0; j < h; j++) {
      var i = ((y0 + j) * PW + x0) * 4;
      for (var k = 0; k < w; k++, i += 4) {
        var da = buf[i + 3] / 255;
        var oa = a + da * (1 - a);
        var q = a / oa, p = 1 - q;
        buf[i]     = buf[i]     * p + r * q;
        buf[i + 1] = buf[i + 1] * p + g * q;
        buf[i + 2] = buf[i + 2] * p + b * q;
        buf[i + 3] = oa * 255;
      }
    }
  }

  /* --- Кадр --------------------------------------------------------------- */

  function frame(now) {
    if (!t0) t0 = now;
    var t = (now - t0) / 1000;

    var buf = frameData.data;
    buf.set(coreData);

    for (var i = 0; i < N; i++) {

      /* Возраст по кругу: 0 — крупинка на своём месте, 1 — растаяла и
         сейчас начнёт заново. Стартовые возрасты разведены, поэтому поток
         непрерывный, а не пульсирующий. */
      var u = (t / LIFE + born[i]) % 1;

      var e = u * u;            /* разгон: сначала едва отрывается */
      var f = gust[i];
      var wob = Math.sin(t * 1.7 + born[i] * 12.9) * TURB * u;

      /* Отрицательный знак поля — крупинка с нижнего края, её ветер свой */
      var d = edge[i];
      var wx = d < 0 ? WIND_BX : WIND_X;
      var wy = d < 0 ? WIND_BY : WIND_Y;
      if (d < 0) d = -d;

      /* Появляется мгновенно, гаснет долго: срыв должен читаться, а не
         мигать. Квадрат затухания оставляет хвост, а не обрыв. */
      var a = al[i] * (u < 0.05 ? u / 0.05 : 1) * (1 - u) * (1 - u);

      blot(
        buf,
        hx[i] + wx * e * f + wob,
        hy[i] + wy * e * f + wob * 0.4,
        sz[i] * (1 - u * 0.35),
        a,
        d > 0.45 ? SAND : INK
      );
    }

    ctx.putImageData(frameData, 0, 0);

    if (!reduce || !reduce.matches) raf = requestAnimationFrame(frame);
  }

  /* Один кадр без движения: система просит покоя. Крупинки стоят по своим
     местам, ничего не летит. */
  function still() {
    var buf = frameData.data;
    buf.set(coreData);
    for (var i = 0; i < N; i++) blot(buf, hx[i], hy[i], sz[i], al[i], INK);
    ctx.putImageData(frameData, 0, 0);
  }

  /* --- Запуск ------------------------------------------------------------- */

  function start() {
    cancelAnimationFrame(raf);
    t0 = 0;
    built = build();
    if (!built) return;

    if (reduce && reduce.matches) still();
    else raf = requestAnimationFrame(frame);

    figure.classList.add('is-sand');
  }

  function ready() {
    if (img.complete && img.naturalWidth) start();
    else img.addEventListener('load', start, { once: true });
  }

  /* Шрифты и раскладка успевают устояться: холст строится от фактического
     размера фотоблока, и замер до вёрстки дал бы песок не того размера. */
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });

  /* Пересборка на изменение ширины — с задержкой: тянуть окно можно долго,
     а сборка перебирает десятки тысяч клеток. Высота не в счёт: на телефоне
     адресная строка меняет её постоянно. */
  var timer = null, was = 0;
  window.addEventListener('resize', function () {
    var w = Math.round(figure.getBoundingClientRect().width);
    if (w === was) return;
    was = w;
    clearTimeout(timer);
    timer = setTimeout(start, 180);
  });

  if (reduce) {
    var onReduce = function () { if (built) start(); };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
    else if (reduce.addListener) reduce.addListener(onReduce);
  }
})();
