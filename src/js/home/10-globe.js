/* ==========================================================================
   tajiro — планета под калькулятором (секция 10)
   Пара к блоку «Планета» в css/10-the-math.css.

   Что она показывает: заказы приходят отовсюду и сходятся в один магазин.
   Всё остальное — сетка, свечение, ночная сторона — работает на то, чтобы
   это было видно, а не на сходство с чьим-то макетом.

   Устройство:
     · материки — контурами, силуэтами (js/10-globe-land.js). Точечная
       россыпь читалась узором, а не Землёй, сколько её ни сгущай;
     · градусная сетка через 10° по обеим осям — она и даёт кривизну;
     · глубина: линии на дальней стороне тают, за терминатор не заходят;
     · города стоят по своим координатам, дуги вылетают из них.

   Рисуется в canvas: на кадре несколько тысяч отрезков, и у каждого своя
   прозрачность по глубине. В SVG это столько же узлов DOM на кадр.
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('s10-globe');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var scene = canvas.closest('.s-10__scene');
  var tagsEl = document.getElementById('s10-tags');
  var countEl = document.getElementById('s10-order-count');
  var root = document.getElementById('the-math') || canvas;

  var still = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Палитра ------------------------------------------------------------
     Читаются один раз при запуске, а не каждый кадр: канвасу нужны числа, а
     getComputedStyle на кадре — это принудительный пересчёт стилей. */
  /* Цвета шара берутся из CSS секции, а не зашиты сюда. Секция сменила
     фон со светлого на тёмный, и тёмно-зелёные контуры, набиравшие глубину
     плотностью, на тёмном пропали. Значения по умолчанию — прежние
     светлые: если переменных нет, шар рисуется как раньше. */
  function tone(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }
  var LAND  = tone('--s10-land',  '35, 74, 54');    /* контуры материков */
  var GRID  = tone('--s10-grid',  '61, 143, 99');   /* меридианы и параллели */
  var ARC   = tone('--s10-arc',   '35, 74, 54');    /* дуги заказов */
  var STORE = tone('--s10-store', '134, 91, 42');   /* маркер магазина */

  var STORE_LAT = 25, STORE_LON = 55;   /* Залив */

  /* Города с координатами, а не просто именами.

     Две тысячи точек, разложенных ровно по сфере, — это узор, а не Земля.
     Города кучкуются по суше, поэтому от их россыпи материки проступают
     сами, без единой выдуманной береговой линии.

     И у ярлыка появляется смысл: дуга вылетает из той самой точки, чьё имя
     на нём написано. Раньше имя бралось наугад и с местом вылета не
     совпадало. */
  var CITIES = [
    { n: 'Dubai',        y: 25.2,  x: 55.3 },
    { n: 'Riyadh',       y: 24.7,  x: 46.7 },
    { n: 'Doha',         y: 25.3,  x: 51.5 },
    { n: 'Kuwait City',  y: 29.4,  x: 48.0 },
    { n: 'Manama',       y: 26.2,  x: 50.6 },
    { n: 'Muscat',       y: 23.6,  x: 58.5 },
    { n: 'Jeddah',       y: 21.5,  x: 39.2 },
    { n: 'Abu Dhabi',    y: 24.5,  x: 54.4 },
    { n: 'Dammam',       y: 26.4,  x: 50.1 },
    { n: 'Cairo',        y: 30.0,  x: 31.2 },
    { n: 'Amman',        y: 31.9,  x: 35.9 },
    { n: 'Istanbul',     y: 41.0,  x: 28.9 },
    { n: 'Athens',       y: 38.0,  x: 23.7 },
    { n: 'Rome',         y: 41.9,  x: 12.5 },
    { n: 'Madrid',       y: 40.4,  x: -3.7 },
    { n: 'Paris',        y: 48.9,  x: 2.4 },
    { n: 'London',       y: 51.5,  x: -0.1 },
    { n: 'Berlin',       y: 52.5,  x: 13.4 },
    { n: 'Stockholm',    y: 59.3,  x: 18.1 },
    { n: 'Moscow',       y: 55.8,  x: 37.6 },
    { n: 'Casablanca',   y: 33.6,  x: -7.6 },
    { n: 'Lagos',        y: 6.5,   x: 3.4 },
    { n: 'Nairobi',      y: -1.3,  x: 36.8 },
    { n: 'Johannesburg', y: -26.2, x: 28.0 },
    { n: 'Karachi',      y: 24.9,  x: 67.0 },
    { n: 'Mumbai',       y: 19.1,  x: 72.9 },
    { n: 'Delhi',        y: 28.6,  x: 77.2 },
    { n: 'Dhaka',        y: 23.8,  x: 90.4 },
    { n: 'Bangkok',      y: 13.8,  x: 100.5 },
    { n: 'Singapore',    y: 1.4,   x: 103.8 },
    { n: 'Jakarta',      y: -6.2,  x: 106.8 },
    { n: 'Hong Kong',    y: 22.3,  x: 114.2 },
    { n: 'Shanghai',     y: 31.2,  x: 121.5 },
    { n: 'Beijing',      y: 39.9,  x: 116.4 },
    { n: 'Seoul',        y: 37.6,  x: 127.0 },
    { n: 'Tokyo',        y: 35.7,  x: 139.7 },
    { n: 'Sydney',       y: -33.9, x: 151.2 },
    { n: 'Auckland',     y: -36.9, x: 174.8 },
    { n: 'New York',     y: 40.7,  x: -74.0 },
    { n: 'Toronto',      y: 43.7,  x: -79.4 },
    { n: 'Chicago',      y: 41.9,  x: -87.6 },
    { n: 'Los Angeles',  y: 34.1,  x: -118.2 },
    { n: 'Mexico City',  y: 19.4,  x: -99.1 },
    { n: 'Bogota',       y: 4.7,   x: -74.1 },
    { n: 'Lima',         y: -12.0, x: -77.0 },
    { n: 'Sao Paulo',    y: -23.5, x: -46.6 },
    { n: 'Buenos Aires', y: -34.6, x: -58.4 }
  ];

  var SUMS = ['$29', '$49', '$59', '$9', '$99', '$149', '$499', '$39'];

  /* Свой генератор вместо Math.random: картина одинакова от загрузки к
     загрузке, секцию можно сравнивать по скриншотам. */
  var seed = 11;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

  /* --- Контуры суши -----------------------------------------------------
     Данные настоящие: Natural Earth 110m (см. tools/build-land.mjs). Сплайн
     здесь больше не нужен — рублеными углами страдали мои рисованные
     силуэты, у настоящего берега вершины и так стоят чаще, чем пиксели.

     Переводим широту с долготой в вектор на единичной сфере ОДИН РАЗ, на
     старте. На кадре это было бы четыре тригонометрии на точку: пять тысяч
     точек на полусотне кадров в секунду — миллион синусов в секунду только
     на береговую линию. Теперь на кадре остаётся сложение и умножение.

     Держим в Float64Array плоско, тройками x, y, z: массив объектов — это
     пять тысяч ссылок, которые сборщик мусора обходит на каждом кадре. */
  var LAND_PATHS = (function () {
    var src = window.TAJIRO_LAND || [];
    var out = [];

    for (var i = 0; i < src.length; i++) {
      var ring = src[i];                    /* плоско: lon, lat, lon, lat... */
      var n = ring.length >> 1;
      if (n < 3) continue;

      var v = new Float64Array(n * 3);
      for (var k = 0; k < n; k++) {
        var lon = ring[k * 2] * Math.PI / 180;
        var lat = ring[k * 2 + 1] * Math.PI / 180;
        var ca = Math.cos(lat);
        v[k * 3]     = ca * Math.cos(lon);
        v[k * 3 + 1] = Math.sin(lat);
        v[k * 3 + 2] = ca * Math.sin(lon);
      }
      out.push(v);
    }
    return out;
  })();

  /* Буферы под проекцию одного кольца: экранные координаты и глубина.
     Заводим один раз по самому длинному кольцу и переиспользуем — иначе на
     каждом кадре это 125 временных массивов. */
  var MAXN = 0;
  for (var mi = 0; mi < LAND_PATHS.length; mi++) {
    var mn = LAND_PATHS[mi].length / 3;
    if (mn > MAXN) MAXN = mn;
  }
  var SX = new Float64Array(MAXN);
  var SY = new Float64Array(MAXN);
  var SZ = new Float64Array(MAXN);

  var TAU = Math.PI * 2;

  /* Направление обхода края шара при сшивке кусков материка.
     Постоянное, потому что у всех колец в данных одинаковая намотка. */
  var LIMB_DIR = 1;

  /* --- Геометрия ---------------------------------------------------------- */
  var W = 0, H = 0, R = 0, CX = 0, CY = 0, dpr = 1;

  function resize() {
    var box = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* Систему координат НЕ округляем — округляем только буфер. Раньше
       W брался округлённым, и при дробной ширине коробки (265.5) рисунок
       уезжал на полпикселя: линии попадали между пикселями и мылились.

       Масштаб берём фактический (буфер / коробка), а не dpr: после
       округления буфера они уже не равны. */
    W = box.width;
    H = box.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    CX = W / 2;
    CY = H / 2;
    R = Math.min(W, H) * 0.42;

    /* Живые ярлыки размечены в пикселях прежнего холста: после смены размера
       их занятые прямоугольники врут, и следующий ярлык сядет поверх. Проще
       убрать — они и так живут четыре секунды. */
    if (tagsEl) tagsEl.textContent = '';
    if (liveTags) liveTags.length = 0;
  }

  /* Точка на сфере -> экран. Вращение только вокруг оси Y плюс лёгкий
     наклон: без наклона шар читается диском, полюса не видны. */
  var TILT = 0.32;
  var cosT = Math.cos(TILT), sinT = Math.sin(TILT);

  /* Синус и косинус поворота считаются раз на кадр, а не на каждую из
     пяти тысяч точек: раньше это было 10 000 лишних тригонометрий на кадр,
     и на слабой машине кадр в них и упирался. */
  var rotC = 1, rotS = 0;

  function setRot(a) { rot = a; rotC = Math.cos(a); rotS = Math.sin(a); }

  function project(p) {
    var c = rotC, s = rotS;
    var x = p.x * c - p.z * s;
    var z = p.x * s + p.z * c;
    var y = p.y * cosT - z * sinT;
    z = p.y * sinT + z * cosT;
    /* Минус, а не плюс: смотрим на шар снаружи, и восточная долгота должна
       уходить ВПРАВО. С плюсом Земля выходила зеркальной — Африка вставала
       восточнее Индии. */
    return { sx: CX - x * R, sy: CY - y * R, z: z };
  }

  function fromLatLon(lat, lon) {
    var a = lat * Math.PI / 180, b = lon * Math.PI / 180;
    return { x: Math.cos(a) * Math.cos(b), y: Math.sin(a), z: Math.cos(a) * Math.sin(b) };
  }

  /* --- Дуги --------------------------------------------------------------- */

  /* Векторы городов считаем один раз: они не зависят ни от поворота шара,
     ни от размера холста. */
  var STORE_V = fromLatLon(STORE_LAT, STORE_LON);
  var CITY_V = [];
  for (var cv = 0; cv < CITIES.length; cv++) {
    CITY_V.push(fromLatLon(CITIES[cv].y, CITIES[cv].x));
  }

  /* Города вплотную к магазину в вылетах не участвуют. Дуга из Дубая в Дубай
     это культя в пару пикселей у самого маркера: она не читается перелётом,
     зато засоряет ровно то место, где всё должно сходиться. */
  var MIN_ARC_DEG = 12;
  var MIN_ARC_DOT = Math.cos(MIN_ARC_DEG * Math.PI / 180);

  var FLYERS = [];
  for (var fi = 0; fi < CITIES.length; fi++) {
    var fv = CITY_V[fi];
    if (fv.x * STORE_V.x + fv.y * STORE_V.y + fv.z * STORE_V.z < MIN_ARC_DOT) FLYERS.push(fi);
  }

  var ARC_STEPS = 40;
  var arcs = [];
  var landings = [];
  var orders = 0;

  /* Маршрут считаем на вылете, а не на кадре.

     Точки лежат в мировых координатах и от поворота не зависят: вращается
     камера, а не маршрут. Раньше сферическая интерполяция крутилась заново
     каждый кадр для каждой дуги — четыре тригонометрии на точку. При нынешней
     плотности полётов это десять тысяч синусов на кадр впустую. Теперь на
     кадре остаётся только проекция готовых точек.

     Подъём над поверхностью у каждой дуги свой: одинаковый выгиб на десятке
     дуг сразу читается штампом. */
  function buildArc(A, lift) {
    var dot = A.x * STORE_V.x + A.y * STORE_V.y + A.z * STORE_V.z;
    if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
    var om = Math.acos(dot);
    var sinOm = Math.sin(om);

    var pts = new Float64Array((ARC_STEPS + 1) * 3);
    for (var t = 0; t <= ARC_STEPS; t++) {
      var u = t / ARC_STEPS;

      var w1, w2;
      if (sinOm < 1e-4) { w1 = 1 - u; w2 = u; }
      else { w1 = Math.sin((1 - u) * om) / sinOm; w2 = Math.sin(u * om) / sinOm; }

      var L = 1 + lift * Math.sin(Math.PI * u);
      pts[t * 3]     = (A.x * w1 + STORE_V.x * w2) * L;
      pts[t * 3 + 1] = (A.y * w1 + STORE_V.y * w2) * L;
      pts[t * 3 + 2] = (A.z * w1 + STORE_V.z * w2) * L;
    }
    return pts;
  }

  /* Заказ вылетает из настоящего города, а не из случайной точки: имя на
     ярлыке и место вылета обязаны совпадать, иначе ярлык — подпись ни к чему.
     Берём только те города, что сейчас на видимой стороне. */
  function spawnArc(now, withTag) {
    var pool = [];
    for (var c = 0; c < FLYERS.length; c++) {
      if (project(CITY_V[FLYERS[c]]).z > 0.2) pool.push(FLYERS[c]);
    }
    if (!pool.length) return;

    var idx = pool[Math.floor(rnd() * pool.length)];

    arcs.push({
      pts: buildArc(CITY_V[idx], 0.22 + rnd() * 0.2),
      born: now,
      dur: 1500 + rnd() * 900
    });

    orders++;
    if (countEl) countEl.textContent = orders.toLocaleString('en-US');

    if (withTag) spawnTag(CITIES[idx]);
  }

  /* --- Ярлыки городов -----------------------------------------------------
     Ярлык встаёт на свободное место, а не куда придётся.

     Раньше он всегда вешался над точкой вылета. При редком потоке это сходило
     с рук, а теперь полётов втрое больше — и ярлыки налезали друг на друга и
     на подпись магазина. Подпись рисуется на холсте, ярлыки лежат поверх
     него, так что ярлык её просто закрывал.

     Держим список занятых прямоугольников и пробуем позиции по кругу от точки
     вылета. Если свободного места нет — ярлык не показываем вовсе:
     пропущенная подпись честнее наложенной. */
  var liveTags = [];
  var storeRect = null;      /* подпись «Your store», обновляется на кадре */

  /* Запас по вертикали больше горизонтального: ярлык по кадрам анимации
     всплывает на десяток пикселей вверх, и рамка обязана покрыть весь путь,
     иначе он наедет уже в движении. */
  function clash(a, b) {
    return !(a.x2 + 8 < b.x1 || b.x2 + 8 < a.x1 ||
             a.y2 + 14 < b.y1 || b.y2 + 14 < a.y1);
  }

  function occupied(r) {
    if (storeRect && clash(r, storeRect)) return true;
    for (var i = 0; i < liveTags.length; i++) if (clash(r, liveTags[i])) return true;
    return false;
  }

  /* Смещения центра ярлыка от точки вылета, по убыванию желательности:
     сначала прямо над точкой, дальше в стороны и вниз. */
  var TAG_SPOTS = [
    [0, -26], [0, 28], [-58, -20], [58, -20], [-58, 20], [58, 20],
    [0, -50], [0, 52], [-72, 0], [72, 0], [-46, -46], [46, -46]
  ];

  function spawnTag(city) {
    if (!tagsEl || still) return;

    var p = project(fromLatLon(city.y, city.x));
    if (p.z < 0.12) return;          /* точка на обратной стороне */

    var el = document.createElement('span');
    el.className = 's-10__tag';
    el.appendChild(document.createTextNode(city.n + ' '));

    var sum = document.createElement('span');
    sum.className = 's-10__tag-sum';
    sum.textContent = SUMS[Math.floor(rnd() * SUMS.length)];
    el.appendChild(sum);

    /* Меряем скрытым, а не на глаз: ширина зависит от длины имени, от суммы
       и от того, какой шрифт успел подгрузиться. */
    el.style.visibility = 'hidden';
    el.style.left = '0';
    el.style.top = '0';
    tagsEl.appendChild(el);

    var tw = el.offsetWidth, th = el.offsetHeight;
    var box = null;

    for (var sp2 = 0; sp2 < TAG_SPOTS.length; sp2++) {
      var cx = p.sx + TAG_SPOTS[sp2][0];
      var cy = p.sy + TAG_SPOTS[sp2][1];
      var r = { x1: cx - tw / 2, y1: cy - th / 2, x2: cx + tw / 2, y2: cy + th / 2 };

      /* За краем сцены ярлык обрежется — такое место не годится. Сверху запас
         больше: оттуда он ещё и всплывает. */
      if (r.x1 < 2 || r.y1 < 14 || r.x2 > W - 2 || r.y2 > H - 2) continue;
      if (occupied(r)) continue;

      el.style.left = (cx / W * 100) + '%';
      el.style.top = (cy / H * 100) + '%';
      box = r;
      break;
    }

    if (!box) { el.remove(); return; }

    el.style.visibility = '';
    liveTags.push(box);

    setTimeout(function () {
      el.remove();
      var k = liveTags.indexOf(box);
      if (k >= 0) liveTags.splice(k, 1);
    }, 4200);
  }

  /* --- Ход шара -----------------------------------------------------------
     Не полный оборот, а качание вокруг долготы магазина.

     При обороте маркер уходит на обратную сторону и большую часть времени его
     не видно — а он тут точка сборки: без него дуги сходятся в случайное
     место. Заодно пропадала половина полётов: город вылета оказывался за
     горизонтом.

     Амплитуда ±31°. Была ±75° — и на краю такта магазин уползал к самому
     лимбу, а кадр занимали Китай с Австралией. Сходимость дуг при этом
     переставала читаться: они втыкались в бок шара. Теперь магазин никогда не
     отходит от центра больше чем на половину радиуса и остаётся смысловым
     центром картинки, а за такт всё равно проходят Европа, Африка, Аравия,
     Индия и запад Азии.

     BASE выводится из долготы магазина — при её смене подстраивать нечего. */
  var BASE = Math.PI / 2 - STORE_LON * Math.PI / 180;
  var SWING = 0.55;
  var rot = BASE;
  rotC = Math.cos(rot); rotS = Math.sin(rot);

  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    /* Тело шара. На светлом фоне его роль обратная: не затемнить, а дать
       мягкую тень к дальнему краю — без неё точки висят в пустоте и
       читаются облаком, а не поверхностью. */
    var body = ctx.createRadialGradient(CX - R * 0.32, CY - R * 0.38, R * 0.1, CX, CY, R);
    body.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    body.addColorStop(0.62, 'rgba(61, 143, 99, 0.07)');
    body.addColorStop(1, 'rgba(61, 143, 99, 0.17)');
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();

    /* --- Сетка: параллели и меридианы --- */
    ctx.lineWidth = 1;
    for (var lat = -80; lat <= 80; lat += 10) {
      ctx.beginPath();
      for (var lo = 0; lo <= 360; lo += 6) {
        var g = project(fromLatLon(lat, lo));
        if (g.z < 0) continue;
        ctx.lineTo(g.sx, g.sy);
      }
      ctx.strokeStyle = 'rgba(' + GRID + ',' + (lat === 0 ? 0.38 : 0.17) + ')';
      ctx.stroke();
    }

    for (var m = 0; m < 36; m++) {
      ctx.beginPath();
      var drew = false;
      for (var la = -86; la <= 86; la += 5) {
        var q = project(fromLatLon(la, m * 10));
        if (q.z < 0) { drew = false; continue; }
        if (!drew) { ctx.moveTo(q.sx, q.sy); drew = true; }
        else ctx.lineTo(q.sx, q.sy);
      }
      ctx.strokeStyle = 'rgba(' + GRID + ',0.15)';
      ctx.stroke();
    }

    /* --- Материки ---
       Суша закрашена, а не обведена: контур сам по себе читался проволокой,
       а не землёй, и на светлом шаре терялся среди сетки.

       Видно только переднее полушарие, поэтому кольцо материка рвётся на
       горизонте, и разрывы надо чем-то закрыть. Раньше каждый кусок
       замыкался хордой сам на себя. На моих рисованных силуэтах куски были
       короткие и хорда была незаметна, а настоящая Евразия тянется от
       Атлантики до Тихого океана — и хорда резала диск наискось.

       Закрываем разрывы дугой по краю шара. Направление обхода берём
       ПОСТОЯННОЕ, а следующий кусок ищем по углу входа — ближайший вперёд
       по этому направлению.

       Именно на направлении всё ломалось в прошлый раз: я брал его по
       касательной в точке выхода, а кусок сплошь и рядом состоит из одной
       точки — касательной нет, направление выходило мусорным, дуга уходила
       вокруг всего шара, заливка накрывала диск целиком, и планета на кадр
       становилась сплошь зелёной. Постоянное направление плюс сортировка по
       углу мерцать не могут: результат зависит только от геометрии кадра.

       Проекция развёрнута вручную, без вызова project: на пяти тысячах точек
       возврат объекта {sx, sy, z} — это пять тысяч мусорных объектов на кадр. */
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, TAU);
    ctx.clip();

    ctx.fillStyle = 'rgba(' + GRID + ',0.30)';
    ctx.strokeStyle = 'rgba(' + LAND + ',0.85)';
    ctx.lineWidth = 1.15;
    ctx.lineJoin = 'round';

    for (var li = 0; li < LAND_PATHS.length; li++) {
      var v = LAND_PATHS[li];
      var n = v.length / 3;

      var anyVis = false, allVis = true;

      for (var pi = 0; pi < n; pi++) {
        var o = pi * 3;
        var ax = v[o], ay = v[o + 1], az = v[o + 2];

        var x = ax * rotC - az * rotS;
        var zr = ax * rotS + az * rotC;
        var y = ay * cosT - zr * sinT;
        var z = ay * sinT + zr * cosT;

        SX[pi] = CX - x * R;
        SY[pi] = CY - y * R;
        SZ[pi] = z;

        if (z > 0) anyVis = true; else allVis = false;
      }

      if (!anyVis) continue;

      /* Кольцо целиком на нашей стороне — сшивать нечего */
      if (allVis) {
        ctx.beginPath();
        ctx.moveTo(SX[0], SY[0]);
        for (var pj = 1; pj < n; pj++) ctx.lineTo(SX[pj], SY[pj]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        continue;
      }

      /* Обход начинаем с точки ВХОДА: тогда каждый кусок получается целым, а
         не разрезанным на месте нулевого индекса. */
      var start = -1;
      for (var pk = 0; pk < n; pk++) {
        if (SZ[pk] <= 0 && SZ[(pk + 1) % n] > 0) { start = pk; break; }
      }
      if (start < 0) continue;

      var runs = [], entryA = [], exitA = [];
      var cur = null;

      for (var k = 0; k < n; k++) {
        var i = (start + k) % n;
        var j = (start + k + 1) % n;
        var zi = SZ[i], zj = SZ[j];
        var vi = zi > 0, vj = zj > 0;

        if (vi !== vj) {
          /* Доля пути, на которой глубина обращается в ноль */
          var t = zi / (zi - zj);
          var cx = SX[i] + (SX[j] - SX[i]) * t;
          var cy = SY[i] + (SY[j] - SY[i]) * t;

          if (vj) {
            cur = [cx, cy];
            runs.push(cur);
            entryA.push(Math.atan2(cy - CY, cx - CX));
          } else if (cur) {
            cur.push(cx, cy);
            exitA.push(Math.atan2(cy - CY, cx - CX));
            cur = null;
          }
        }

        if (vj && cur) cur.push(SX[j], SY[j]);
      }

      if (!runs.length || runs.length !== exitA.length) continue;

      /* Собираем замкнутые фигуры: кусок -> дуга по краю -> следующий кусок */
      var used = [];
      for (var ui = 0; ui < runs.length; ui++) used.push(false);

      ctx.beginPath();
      for (var r0 = 0; r0 < runs.length; r0++) {
        if (used[r0]) continue;

        var r = r0;
        ctx.moveTo(runs[r][0], runs[r][1]);

        while (!used[r]) {
          used[r] = true;

          var seg = runs[r];
          for (var si = 2; si < seg.length; si += 2) ctx.lineTo(seg[si], seg[si + 1]);

          /* Ближайший вход вперёд по направлению обхода */
          var aOut = exitA[r];
          var best = r0, bestD = Infinity;
          for (var q = 0; q < runs.length; q++) {
            var d = LIMB_DIR * (entryA[q] - aOut);
            d = ((d % TAU) + TAU) % TAU;
            if (d < bestD) { bestD = d; best = q; }
          }

          ctx.arc(CX, CY, R, aOut, aOut + LIMB_DIR * bestD, LIMB_DIR < 0);
          r = best;
        }

        ctx.closePath();
      }

      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    /* --- Города ---
       Ядро ярче фоновых точек, вокруг — ореол. Из-за того, что города
       стоят по суше, их россыпь и рисует материки: отдельно чертить
       береговую линию не нужно. */
    for (var ci = 0; ci < CITIES.length; ci++) {
      var cp = project(fromLatLon(CITIES[ci].y, CITIES[ci].x));
      if (cp.z < 0) continue;

      var cd = cp.z;

      ctx.beginPath();
      ctx.arc(cp.sx, cp.sy, 5.5 * cd, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + GRID + ',' + (0.22 * cd).toFixed(3) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cp.sx, cp.sy, 1.7 + cd * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + LAND + ',' + (0.55 + cd * 0.42).toFixed(3) + ')';
      ctx.fill();
    }

    /* --- Маркер магазина --- */
    var sp = project(STORE_V);
    /* Плавное угасание у края вместо порога: на пороге маркер вместе с
       подписью мигал на каждом кадре, когда шар подходил к краю размаха. */
    var edge = Math.max(0, Math.min(1, sp.z / 0.16));
    var visible = edge > 0.01;

    storeRect = null;

    if (visible) {
      var pulse = 0.5 + 0.5 * Math.sin(now / 620);

      /* Круги от прилетевших заказов. Дуга доходит до магазина и гаснет — без
         отклика в точке прилёта непонятно, что она куда-то пришла, а не
         просто растворилась. */
      for (var ld = 0; ld < landings.length; ld++) {
        var lage = (now - landings[ld]) / 780;
        if (lage < 0 || lage > 1) continue;
        ctx.beginPath();
        ctx.arc(sp.sx, sp.sy, 5 + lage * 24, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + STORE + ',' + (0.45 * (1 - lage) * edge).toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sp.sx, sp.sy, 6 + pulse * 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + STORE + ',' + (0.22 * (1 - pulse) * edge).toFixed(3) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sp.sx, sp.sy, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + STORE + ',0.98)';
      ctx.fill();

      /* Подпись. Без неё белая точка — просто точка: непонятно, что дуги
         сходятся именно в магазин, а не в случайное место на шаре. */
      ctx.font = '600 12px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
      var label = 'Your store';
      var bw = ctx.measureText(label).width + 16, bh = 22;

      /* Сторону выбираем по свободному месту. Раньше подпись всегда шла
         вправо и у правого края холста обрезалась на полуслове — «Your sto».
         Считаем от коробки, а не от текста: обрезается именно коробка. */
      var bx = (sp.sx + 6 + bw + 4 > W) ? sp.sx - 6 - bw : sp.sx + 6;
      if (bx < 2) bx = Math.max(2, Math.min(W - bw - 2, sp.sx - bw / 2));

      var by = sp.sy - 25;
      if (by < 2) by = sp.sy + 8;
      if (by + bh > H - 2) by = H - 2 - bh;

      /* Выноска идёт к ближнему боку коробки, а не в фиксированную сторону:
         коробка теперь может оказаться и слева, и снизу. */
      ctx.beginPath();
      ctx.moveTo(sp.sx, sp.sy);
      ctx.lineTo(bx > sp.sx ? bx : bx + bw, by + bh / 2);
      ctx.strokeStyle = 'rgba(' + STORE + ',' + (0.4 * edge).toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255,' + (0.88 * edge).toFixed(2) + ')';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 11);
      else ctx.rect(bx, by, bw, bh);
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + GRID + ',0.32)';
      ctx.stroke();

      ctx.fillStyle = 'rgba(' + STORE + ',' + (0.95 * edge).toFixed(2) + ')';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + 8, by + bh / 2);

      /* Отдаём занятое место раскладке ярлыков — вместе с ореолом маркера,
         иначе ярлык садится прямо на пульсирующую точку. */
      storeRect = {
        x1: Math.min(bx, sp.sx - 16),
        y1: Math.min(by, sp.sy - 16),
        x2: Math.max(bx + bw, sp.sx + 16),
        y2: Math.max(by + bh, sp.sy + 16)
      };
    }

    /* --- Дуги заказов ---
       Настоящая дуга в трёх измерениях, а не кривая Безье на плоскости
       экрана. Плоское приближение выгибалось не в ту сторону и местами
       резало шар: контрольную точку я отодвигал от центра КАРТИНКИ, а
       выгибаться дуга должна от центра ШАРА.

       Сам маршрут посчитан на вылете, в buildArc, и лежит в мировых
       координатах — здесь остаётся только проекция.

       Точка дуги видна, если она либо на передней стороне, либо вынесена за
       силуэт шара — именно поэтому дуга остаётся видимой, даже когда её
       середина проходит над краем. */
    var alive = [];
    for (var ai = 0; ai < arcs.length; ai++) {
      var arc = arcs[ai];
      var age = (now - arc.born) / arc.dur;

      if (age > 1) {
        landings.push(arc.born + arc.dur);   /* долетела — отметить прилёт */
        continue;
      }
      alive.push(arc);
      if (!visible) continue;

      var pts = arc.pts;
      var head = Math.min(1, age * 1.3);
      var fade = age < 0.72 ? 1 : 1 - (age - 0.72) / 0.28;
      var upto = Math.floor(head * ARC_STEPS);

      var lastX = 0, lastY = 0, penDown = false, haveHead = false;

      ctx.beginPath();
      for (var t = 0; t <= upto; t++) {
        var o = t * 3;
        var ax = pts[o], ay = pts[o + 1], az = pts[o + 2];

        var x = ax * rotC - az * rotS;
        var zr = ax * rotS + az * rotC;
        var y = ay * cosT - zr * sinT;
        var z = ay * sinT + zr * cosT;

        var sx = CX - x * R, sy = CY - y * R;
        var dxs = sx - CX, dys = sy - CY;

        /* За силуэтом шара точку прячем, снаружи — оставляем: подъём дуги
           выносит её за край, и там она обязана быть видна. */
        if (z <= 0 && (dxs * dxs + dys * dys) <= R * R) { penDown = false; continue; }

        if (!penDown) { ctx.moveTo(sx, sy); penDown = true; }
        else ctx.lineTo(sx, sy);

        lastX = sx; lastY = sy; haveHead = true;
      }

      ctx.strokeStyle = 'rgba(' + ARC + ',' + (0.7 * fade).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (haveHead) {
        ctx.beginPath();
        ctx.arc(lastX, lastY, 2.6 * fade, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + ARC + ',' + fade.toFixed(2) + ')';
        ctx.fill();
      }
    }
    arcs = alive;

    /* Круги прилёта живут 780 мс. Отжившие выбрасываем, иначе список растёт
       всё время, пока секция на экране. */
    var lkeep = [];
    for (var lk = 0; lk < landings.length; lk++) {
      if (now - landings[lk] < 780) lkeep.push(landings[lk]);
    }
    landings = lkeep;

    /* --- Ободок атмосферы ---
       Тонкая светлая дуга по краю: она отделяет шар от подложки и не даёт
       ему слиться с ней. */
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + LAND + ',0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* --- Цикл ---------------------------------------------------------------
     Шар крутится, только пока секция в кадре: за кадром это тысяча точек
     впустую на каждом кадре. */
  var raf = null, nextOrder = 0, nextTag = 0;

  /* Кадр раз в 25 мс, а не на каждое обновление экрана.

     Качание медленное, и разницы между 40 и 144 кадрами глазу тут нет —
     а работы в три с половиной раза меньше. На быстрой машине это просто
     экономия, на слабой — разница между «едет» и «дёргается».

     Ждём именно rAF, а не setInterval: за кадром браузер сам придержит
     цикл, и вкладка в фоне не будет считать шар впустую. */
  var FRAME_MS = 20;
  var lastDraw = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - lastDraw < FRAME_MS) return;
    /* Остаток отматываем назад, а не обнуляем: иначе порог складывается с
       шагом обновления экрана и частота уползает вниз. */
    lastDraw = now - ((now - lastDraw) % FRAME_MS);

    setRot(BASE + Math.sin(now / 17000) * SWING);
    /* Полёты и ярлыки развязаны. Раньше на каждую дугу вешался ярлык, и
       поднять плотность потока было нельзя: подписи превращались в метель.
       Дуги идут густо, подписи — своим редким шагом. */
    if (now > nextOrder) {
      var tagNow = now > nextTag;
      spawnArc(now, tagNow);
      if (tagNow) nextTag = now + 1500 + rnd() * 1400;
      nextOrder = now + 340 + rnd() * 360;
    }
    draw(now);
  }

  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  resize();
  draw(0);

  /* ResizeObserver, а не только window.resize: коробка холста меняется и
     без изменения окна — от смены раскладки, подгрузки шрифтов, появления
     полосы прокрутки. Со stale-буфером браузер растягивает картинку, и
     линии мылятся. */
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      resize();
      /* Не рисуем здесь: кадр выдаёт цикл. Рисование прямо в коллбэке
         накладывалось на кадр цикла, и получался разрыв картинки. */
      if (!raf) draw(performance.now());
    }).observe(canvas);
  } else {
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); draw(performance.now()); }, 150);
    });
  }

  if (still || !scene || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0.1 }).observe(scene);
})();
