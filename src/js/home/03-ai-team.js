/* ==========================================================================
   tajiro — подпись под роликом в секции 03
   Пара к блоку «Видео ленты» в css/03-ai-influencers.css.

   Ролик склеен из пяти инфлюенсеров подряд. Неподвижная подпись поверх
   меняющегося человека читается как ошибка вёрстки, поэтому имя, ниша,
   счётчик видео и цифры реакций едут вместе с сегментами.

   Таблица сегментов — с экомзи (там тот же файл): границы взяты по стыкам
   склейки, поэтому подпись меняется ровно на смене кадра, а не рядом с ней.
   ========================================================================== */
(function () {
  'use strict';

  var video = document.getElementById('aiTeamVideo');
  if (!video) return;

  var handle   = document.getElementById('s03-handle');
  var niche    = document.getElementById('s03-niche');
  var count    = document.getElementById('s03-count');
  var likes    = document.getElementById('s03-likes');
  var comments = document.getElementById('s03-comments');
  var progress = document.getElementById('s03-progress');
  var meta     = document.querySelector('.s-03__meta');

  /* end — момент, на котором сегмент заканчивается */
  var SEGS = [
    { end: 7.00,     handle: '@sophia.caldwell',  niche: 'Fashion',   count: '50 videos', likes: '142K', comments: '8.2K' },
    { end: 19.00,    handle: '@theo.wilder',      niche: 'Mindset',   count: '20 videos', likes: '89K',  comments: '4.1K' },
    { end: 34.30,    handle: '@estel.mayert',     niche: 'Pet Care',  count: '30 videos', likes: '216K', comments: '12.4K' },
    { end: 43.53,    handle: '@bryce.montgomery', niche: 'Lifestyle', count: '30 videos', likes: '97K',  comments: '5.6K' },
    { end: Infinity, handle: '@lily.morgan',      niche: 'Wellness',  count: '35 videos', likes: '128K', comments: '7.3K' }
  ];

  var cur = -1;

  function apply(i) {
    var s = SEGS[i];
    if (handle)   handle.textContent = s.handle;
    if (niche)    niche.textContent = s.niche;
    if (count)    count.textContent = s.count;
    if (likes)    likes.textContent = s.likes;
    if (comments) comments.textContent = s.comments;

    /* Перезапуск анимации: снять класс, дать браузеру пересчитать стиль,
       вернуть. Без чтения offsetWidth браузер склеит оба изменения в один
       кадр и подмена пройдёт без проявления. */
    if (meta) {
      meta.classList.remove('is-switching');
      void meta.offsetWidth;
      meta.classList.add('is-switching');
    }
  }

  video.addEventListener('timeupdate', function () {
    var t = video.currentTime;

    if (progress && video.duration) {
      progress.style.setProperty('--s03-progress', (t / video.duration * 100).toFixed(2) + '%');
    }

    var i = 0;
    while (i < SEGS.length - 1 && t >= SEGS[i].end) i++;
    if (i === cur) return;
    cur = i;
    apply(i);
  });

  /* Ролик не крутится за кадром: на телефоне это чистый расход батареи. */
  if (!('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.15 }).observe(video);
})();
