(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var content = document.querySelector('.post-content');
    if (!content) return;

    var LANG_CLASS_RE = /(?:^|\s)language-([\w+-]+)/;

    Array.prototype.forEach.call(content.querySelectorAll('pre'), function (pre) {
      if (pre.hasAttribute('data-lang')) return;

      var lang = null;
      var code = pre.querySelector('code');
      if (code && code.className) {
        var m = code.className.match(LANG_CLASS_RE);
        if (m) lang = m[1];
      }
      if (!lang) {
        var wrapper = pre.parentElement;
        while (wrapper && wrapper !== content) {
          if (wrapper.className) {
            var mm = wrapper.className.match(LANG_CLASS_RE);
            if (mm) { lang = mm[1]; break; }
          }
          wrapper = wrapper.parentElement;
        }
      }

      if (!lang || lang === 'plaintext' || lang === 'text') return;

      if (pre.parentElement && !pre.parentElement.classList.contains('code-wrap')) {
        var wrap = document.createElement('div');
        wrap.className = 'code-wrap';
        wrap.setAttribute('data-lang', lang);
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
      } else if (pre.parentElement) {
        pre.parentElement.setAttribute('data-lang', lang);
      }
      pre.setAttribute('data-lang', lang);
    });
  });
})();
