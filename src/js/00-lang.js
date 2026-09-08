/* ==========================================================================
   Язык

   На кнопке всегда написан тот язык, на который переключишься, — поэтому
   после переключения надпись меняется на «English». Выбор запоминается.

   Направление письма не трогаем: арабских строк на странице пока нет, и
   разворот вёрстки справа налево с английским текстом выглядел бы
   поломкой. Когда появятся переводы, сюда добавляется строка с dir.
   ========================================================================== */
(function () {
  'use strict';

  var btns = Array.prototype.slice.call(document.querySelectorAll('[data-lang-switch]'));
  if (!btns.length) return;

  var KEY = 'tajiro-lang';
  var cur = 'en';
  try { cur = localStorage.getItem(KEY) === 'ar' ? 'ar' : 'en'; } catch (e) { cur = 'en'; }

  function apply(code) {
    cur = code;
    document.documentElement.setAttribute('lang', code);
    btns.forEach(function (b) {
      var other = code === 'en' ? 'ar' : 'en';
      b.textContent = other === 'ar' ? 'عربي' : 'English';
      b.setAttribute('lang', other);
      b.setAttribute('aria-label', other === 'ar' ? 'Switch to Arabic' : 'Switch to English');
    });
    try { localStorage.setItem(KEY, code); } catch (e) { /* приватный режим */ }
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { apply(cur === 'en' ? 'ar' : 'en'); });
  });

  apply(cur);
})();
