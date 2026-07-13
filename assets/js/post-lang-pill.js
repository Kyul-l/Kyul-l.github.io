// Auto-detect language on <pre> code blocks and set data-lang attribute.
// CSS uses ::after with attr(data-lang) to render a small pill in the corner.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var content = document.querySelector('.post-content');
    if (!content) return;

    var LANG_CLASS_RE = /(?:^|\s)language-([\w+-]+)/;

    Array.prototype.forEach.call(content.querySelectorAll('pre'), function (pre) {
      if (pre.hasAttribute('data-lang')) return;

      var lang = null;
      // Priority 1: language class on child <code>
      var code = pre.querySelector('code');
      if (code && code.className) {
        var m = code.className.match(LANG_CLASS_RE);
        if (m) lang = m[1];
      }
      // Priority 2: language class on parent wrapper (rouge output)
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

      // Wrap pre with a non-scrolling parent so the language pill stays
      // pinned to the visible viewport, not the scrolled content.
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
