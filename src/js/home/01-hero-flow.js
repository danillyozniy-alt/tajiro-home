/* ==========================================================================
   tajiro — гириха на первом экране

   Решётка из ромбов во всю ширину, за текстом. Форма взята из секции 06,
   где такая же сетка держит витрину: первый экран и витрина говорят на
   одном языке, и фон не выглядит приклеенным.

   ЧТО ДЕРЖИТ КАДР

   Двa слоя. Крупный задаёт целое, мелкий — подробность; поодиночке
   каждый читался бы либо обоями, либо шумом. Оба взяты тише, чем была
   одиночная решётка: вместе они дают ту же плотность.

   Ячейка считается от высоты кадра, с потолком и полом. На телефоне
   слишком мелкая сетка превращается в рябь, на широком экране слишком
   мелкая пропадает вовсе.

   ЧТО ПРОИСХОДИТ

   Событий пять, и они идут по очереди: луч наискось, расходящееся
   кольцо, прилив через весь кадр, пятно и занавес. Ячейка на свету
   заливается и обводится ярче. Плюс редкие искры — одиночные ячейки,
   вспыхивающие сами по себе, чтобы между событиями кадр не замирал.

   Ход луча считается по разбросу проекции на четыре угла кадра. Считать
   его от суммы длин сторон нельзя: для косых направлений луч половину
   цикла идёт мимо холста, и на экране в это время не происходит ничего.

   СКОРОСТЬ

   Время растёт вдвое медленнее, чем в стенде: там сцену смотрят
   секундами и торопятся, здесь она стоит за текстом, и заметная
   анимация под заголовком мешает читать.
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-flow');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Настройки ---------------------------------------------------------- */

  var SPEED = 0.0068;    /* прирост времени за кадр; в стенде вдвое больше */
  var SPARK = 0.03;      /* вероятность искры за кадр */

  /* Зелёная лента. Замкнута намеренно: на разрыве решётка перекрашивалась
     бы скачком. */
  var GRN = [[207, 230, 217], [127, 201, 160], [61, 143, 99], [38, 96, 63], [61, 143, 99]];

  function green(p, a) {
    var n = GRN.length, x = ((p % 1) + 1) % 1 * (n - 1);
    var i = Math.floor(x), f = x - i;
    var c0 = GRN[i], c1 = GRN[Math.min(i + 1, n - 1)];
    return 'rgba(' + ((c0[0] + (c1[0] - c0[0]) * f) | 0) + ','
                   + ((c0[1] + (c1[1] - c0[1]) * f) | 0) + ','
                   + ((c0[2] + (c1[2] - c0[2]) * f) | 0) + ',' + a + ')';
  }

  /* --- Служебное ---------------------------------------------------------- */

  var w = 0, h = 0, dpr = 1, t = 0, raf = 0, scene = null;

  function resize() {
    var box = canvas.parentElement.getBoundingClientRect();
    if (!box.width || !box.height) return false;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = girih();
    return true;
  }

  /* --- Сцена -------------------------------------------------------------- */

  function girih() {
    var sparks = [];
    var events = [];
    var nextAt = 1.0, turn = 0;

    /* Разброс проекции по четырём углам кадра */
    function lo(ax, ay) { return Math.min(0, w * ax, h * ay, w * ax + h * ay); }
    function hi(ax, ay) { return Math.max(0, w * ax, h * ay, w * ax + h * ay); }

    function spawn(tt) {
      var kind = ['beam', 'ring', 'swell', 'blot', 'curtain'][turn++ % 5];
      var e = { kind: kind, t0: tt };
      if (kind === 'beam') {
        var a = 1.955 + (turn % 3) * 1.05;
        e.ax = Math.cos(a); e.ay = Math.sin(a);
        e.lo = lo(e.ax, e.ay); e.hi = hi(e.ax, e.ay);
        e.band = (e.hi - e.lo) * 0.062;
        e.back = turn % 2 === 0;
        e.dur = 3.4;
      } else if (kind === 'ring') {
        /* Начало гуляет по середине: от края кольцо выходит дугой */
        e.x = w * (0.25 + Math.random() * 0.5);
        e.y = h * (0.25 + Math.random() * 0.5);
        e.max = Math.sqrt(w * w + h * h) * 0.62;
        e.w = 104;
        e.dur = 3.1;
      } else if (kind === 'swell') {
        /* Прилив медленнее прочих: он охватывает весь кадр, и на скорости
           луча читался бы вспышкой, а не подъёмом */
        e.ax = Math.cos(1.955 + (turn % 2) * 3.14159);
        e.ay = Math.sin(1.955 + (turn % 2) * 3.14159);
        e.lo = lo(e.ax, e.ay); e.hi = hi(e.ax, e.ay);
        e.dur = 6.0;
      } else if (kind === 'blot') {
        e.x = w * (0.15 + Math.random() * 0.7);
        e.y = h * (0.15 + Math.random() * 0.7);
        e.r = 200 + Math.random() * 160;
        e.dur = 2.6;
      } else {
        e.vert = turn % 2 === 0;
        e.back = turn % 4 < 2;
        e.w = 150;
        e.dur = 3.2;
      }
      events.push(e);
      nextAt = tt + e.dur * 0.58 + Math.random() * 1.0;
    }

    function light(e, cx, cy, age) {
      var env = Math.sin(age * 3.14159);
      var v = 0;
      if (e.kind === 'beam') {
        var f = e.back ? 1 - age : age;
        var head = e.lo - e.band + f * (e.hi - e.lo + e.band * 2);
        v = 1 - Math.abs(cx * e.ax + cy * e.ay - head) / e.band;
      } else if (e.kind === 'ring') {
        v = 1 - Math.abs(Math.sqrt((cx - e.x) * (cx - e.x) + (cy - e.y) * (cy - e.y)) - age * e.max) / e.w;
      } else if (e.kind === 'swell') {
        var g = (cx * e.ax + cy * e.ay - e.lo) / (e.hi - e.lo);
        return (0.34 + 0.66 * g) * env * 0.60;
      } else if (e.kind === 'blot') {
        v = 1 - Math.sqrt((cx - e.x) * (cx - e.x) + (cy - e.y) * (cy - e.y)) / e.r;
      } else {
        var f2 = e.back ? 1 - age : age;
        var pos = e.vert ? f2 * (h + e.w * 2) - e.w : f2 * (w + e.w * 2) - e.w;
        v = 1 - Math.abs((e.vert ? cy : cx) - pos) / e.w;
      }
      if (v <= 0) return 0;
      return v * v * env;
    }

    return function (tt) {
      var cxm = w * 0.5, cym = h * 0.5;
      var rmax = Math.sqrt(w * w + h * h) * 0.5;
      var breathe = 1 + Math.sin(tt * 0.155) * 0.02;
      var STEP = Math.max(62, Math.min(116, h * 0.132)) * breathe;
      var slide = (tt * 1.9) % STEP;

      if (tt >= nextAt) spawn(tt);
      for (var q = events.length - 1; q >= 0; q--) {
        if (tt - events[q].t0 > events[q].dur) events.splice(q, 1);
      }
      if (Math.random() < SPARK) {
        sparks.push({ x: Math.random() * w, y: Math.random() * h, born: tt });
      }
      for (var q2 = sparks.length - 1; q2 >= 0; q2--) {
        if (tt - sparks[q2].born > 0.9) sparks.splice(q2, 1);
      }

      function heat(cx, cy) {
        var hot = 0;
        for (var k = 0; k < events.length; k++) {
          var v = light(events[k], cx, cy, (tt - events[k].t0) / events[k].dur);
          if (v > hot) hot = v;
        }
        for (var k2 = 0; k2 < sparks.length; k2++) {
          var dx = cx - sparks[k2].x, dy = cy - sparks[k2].y;
          if (Math.sqrt(dx * dx + dy * dy) < STEP * 0.7) {
            var age = (tt - sparks[k2].born) / 0.9;
            var sv = age < 0.22 ? age / 0.22 : 1 - (age - 0.22) / 0.78;
            if (sv > hot) hot = sv;
          }
        }
        return hot > 1 ? 1 : hot;
      }

      /* Один слой решётки. Крупный идёт первым и остаётся под мелким. */
      function layer(step, lineW, baseA, hotA, fillA) {
        var half = step / 2;
        ctx.lineWidth = lineW;
        for (var y = -half - slide; y < h + step; y += step) {
          for (var x = -half - slide; x < w + step; x += step) {
            var cx = x + half, cy = y + half;
            /* Маска доходит до углов: иначе решётка гаснет кругом посреди
               пустого поля */
            var dx = cx - cxm, dy = cy - cym;
            var r = Math.sqrt(dx * dx + dy * dy) / rmax;
            var m = r < 0.30 ? 1
                  : r < 0.72 ? 1 - (r - 0.30) / 0.42 * 0.45
                  : r < 1.06 ? 0.55 * (1 - (r - 0.72) / 0.34)
                  : 0;
            if (m <= 0.01) continue;
            var hot = heat(cx, cy);

            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(x + step, cy);
            ctx.lineTo(cx, y + step);
            ctx.lineTo(x, cy);
            ctx.closePath();
            if (hot > 0.02) {
              ctx.fillStyle = green(0.62, fillA * hot * m);
              ctx.fill();
              ctx.strokeStyle = green(0.42, (baseA + hotA * hot) * m);
            } else {
              ctx.strokeStyle = green(0.30, baseA * m);
            }
            ctx.stroke();
          }
        }
      }

      layer(STEP * 3, 1.7, 0.075, 0.30, 0.10);
      layer(STEP, 1, 0.075, 0.30, 0.105);
    };
  }

  /* --- Кадр --------------------------------------------------------------- */

  function draw() {
    t += SPEED;
    ctx.clearRect(0, 0, w, h);
    if (scene) scene(t);
    raf = requestAnimationFrame(draw);
  }

  /* Один кадр без движения: система просит покоя. Решётка остаётся, но не
     живёт — экран не пустеет, а просто замирает. */
  function still() {
    cancelAnimationFrame(raf);
    raf = 0;
    t = 1.7;
    var keep = SPEED;
    SPEED = 0;
    draw();
    cancelAnimationFrame(raf);
    raf = 0;
    SPEED = keep;
  }

  /* --- Запуск ------------------------------------------------------------- */

  /* Замер повторяется, пока коробка не появится.

     Одного замера не хватает: секция получает высоту только после того,
     как разложится текст и приедут шрифты, а до этого коробка нулевая и
     холст остаётся заглушкой 300×150. Ловить это событиями ненадёжно —
     их порядок разный в разных браузерах, — поэтому просто пробуем на
     каждом кадре, пока не выйдет, и не дольше двух секунд. */
  var tries = 0;

  function start() {
    if (!resize()) {
      /* Таймер, а не кадр: в скрытой или несведённой вкладке
         requestAnimationFrame не срабатывает вовсе, и повтор замера
         никогда не случится — холст останется заглушкой 300×150. */
      if (tries++ < 120) setTimeout(start, 32);
      return;
    }
    tries = 0;
    if (reduce && reduce.matches) { still(); return; }
    /* Рисуем сразу, а не ждём кадра: пока страница не показана,
       requestAnimationFrame не срабатывает вовсе, и полотно остаётся
       пустым. draw в конце сам заводит следующий кадр. */
    if (!raf) draw();
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  start();

  /* За экраном не рисуем: невидимое полотно жечь батарею не должно. */
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (rows) {
      if (rows[0].isIntersecting) start(); else stop();
    }, { threshold: 0.04 }).observe(canvas.parentElement);
  }

  /* Пересборка на изменение ширины — с задержкой: тянуть окно можно долго,
     а каждый пересчёт заново заводит холст. */
  var timer = null, was = 0;
  window.addEventListener('resize', function () {
    var now = Math.round(canvas.parentElement.getBoundingClientRect().width);
    if (now === was) return;      /* высота адресной строки на телефоне
                                     меняется постоянно, ширина — нет */
    was = now;
    clearTimeout(timer);
    timer = setTimeout(function () { stop(); start(); }, 160);
  });

  if (reduce) {
    var onReduce = function () { stop(); start(); };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce);
    else if (reduce.addListener) reduce.addListener(onReduce);
  }

  /* Шрифты меняют высоту секции уже после первого кадра — пересобираем,
     иначе полотно окажется короче экрана. */
  window.addEventListener('load', function () { stop(); start(); });
})();
