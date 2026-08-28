#!/usr/bin/env node
/* ==========================================================================
   Tajiro — сборка контуров суши для планеты (секция 10)

   Разворачивает TopoJSON от Natural Earth (world-atlas, land-110m) в
   готовые кольца [долгота, широта] и пишет их в src/js/10-globe-land.js.

   Почему на сборке, а не в браузере: иначе в страницу пришлось бы класть и
   сами данные, и декодер топологии, и делать это на каждой загрузке. Здесь
   один раз — и в проекте лежит готовый массив.

   Запускать вручную и только при смене исходных данных:
     node tools/build-land.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const SRC = path.join(ROOT, 'src/data/land-110m.json');
const OUT = path.join(ROOT, 'src/js/10-globe-land.js');

const topo = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const { scale, translate } = topo.transform;

/* --- Дуги ----------------------------------------------------------------
   В TopoJSON точки внутри дуги лежат дельтами в квантованной сетке: первая
   абсолютная, каждая следующая — смещение от предыдущей. Накапливаем и
   переводим обратно в градусы. */
const arcs = topo.arcs.map(arc => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

/* Отрицательный индекс означает ту же дугу, пройденную наоборот: ~i */
function arcPoints(i) {
  return i < 0 ? arcs[~i].slice().reverse() : arcs[i];
}

/* Кольцо склеивается из нескольких дуг. У каждой следующей первая точка
   повторяет последнюю точку предыдущей — её выбрасываем. */
function ring(indexes) {
  const out = [];
  for (const i of indexes) {
    const pts = arcPoints(i);
    for (let k = out.length ? 1 : 0; k < pts.length; k++) out.push(pts[k]);
  }
  return out;
}

/* Слой land приходит обёрнутым: GeometryCollection, внутри один
   MultiPolygon. Разворачиваем оба уровня, а заодно и одиночный Polygon —
   чтобы скрипт не сломался, если однажды подложат другой набор данных. */
function polygonsOf(g) {
  if (g.type === 'GeometryCollection') return g.geometries.flatMap(polygonsOf);
  if (g.type === 'MultiPolygon') return g.arcs;
  if (g.type === 'Polygon') return [g.arcs];
  return [];
}

const rings = [];
for (const poly of polygonsOf(topo.objects.land)) {
  /* Берём только внешнее кольцо: дырки (озёра) на шаре такого размера
     всё равно не читаются, а вдвое утяжелили бы файл. */
  const r = ring(poly[0]);
  if (r.length >= 5) rings.push(r);
}

/* --- Прореживание ---------------------------------------------------------
   Точность до десятой доли градуса — это порядка 11 км. На шаре в 460 px
   один пиксель это ~90 км, так что запас десятикратный, а размер файла
   падает втрое. Подряд идущие совпавшие точки выбрасываем. */
function thin(r) {
  const out = [];
  for (const [lon, lat] of r) {
    const p = [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10];
    const last = out[out.length - 1];
    if (last && last[0] === p[0] && last[1] === p[1]) continue;
    out.push(p);
  }
  /* замыкаем явно — рендер ожидает замкнутое кольцо */
  const a = out[0], b = out[out.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) out.push([a[0], a[1]]);
  return out;
}

const thinned = rings.map(thin).filter(r => r.length >= 5);

/* Сортируем по числу точек: крупные материки идут первыми, и при отладке
   их видно в начале файла. */
thinned.sort((a, b) => b.length - a.length);

const points = thinned.reduce((n, r) => n + r.length, 0);

const body = thinned
  .map(r => '[' + r.map(p => p[0] + ',' + p[1]).join(',') + ']')
  .join(',\n');

const out = `/* ==========================================================================
   tajiro — контуры суши для планеты (секция 10)

   СГЕНЕРИРОВАНО. Руками не править — правки затрёт следующая сборка.
   Источник: Natural Earth 110m через world-atlas (src/data/land-110m.json),
   public domain. Пересобрать: node tools/build-land.mjs

   Формат плоский: [lon, lat, lon, lat, ...] на кольцо. Массив пар был бы
   вдвое тяжелее в разметке и ничем не удобнее — рендер всё равно читает
   координаты парами.

   Колец: ${thinned.length}, точек: ${points}.
   ========================================================================== */
window.TAJIRO_LAND = [
${body}
];
`;

fs.writeFileSync(OUT, out);

console.log('колец: ' + thinned.length);
console.log('точек: ' + points);
console.log('размер: ' + Math.round(fs.statSync(OUT).size / 1024) + ' KB');
