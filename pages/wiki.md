---
layout: page
title: Wiki
permalink: /wiki/
section: wiki
---

<div class="wiki-constellation" aria-hidden="true"></div>

<div class="wiki-page wiki-page--dict">

  {% assign sorted = site.wiki | sort: 'title' %}
  {% assign letters_str = '' %}
  {% for entry in sorted %}
    {% assign first = entry.title | slice: 0, 1 | upcase %}
    {% assign letters_str = letters_str | append: first | append: ',' %}
  {% endfor %}
  {% assign letters = letters_str | split: ',' | uniq %}
  {% assign alphabet = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z" | split: "," %}

  
  {% assign default_letter = 'A' %}

  <header class="wiki-header">
    <div class="wiki-header__left">
      <h1 class="wiki-header__title"><span aria-hidden="true">◇</span> Wiki</h1>
      <p class="wiki-header__lead">A living dictionary of notes.</p>
    </div>
    <nav class="wiki-index" aria-label="Alphabetical index">
      {% for L in alphabet %}<a class="wiki-index__letter{% if letters contains L %} is-active{% endif %}{% if L == default_letter %} is-current{% endif %}" href="#letter-{{ L }}" data-letter="{{ L }}">{{ L }}</a>{% endfor %}
    </nav>
  </header>

  <div class="wiki-dict">
    {% for L in alphabet %}
      <section class="wiki-dict__section" id="letter-{{ L }}" data-letter="{{ L }}"{% if L == default_letter %} data-current="true"{% endif %}>
        <div class="wiki-dict__letter-head">
          <span class="wiki-dict__letter">{{ L }}</span>
        </div>
        {% if letters contains L %}
          <ul class="wiki-dict__entries">
            {% for entry in sorted %}
              {% assign first = entry.title | slice: 0, 1 | upcase %}
              {% if first == L %}
                <li class="wiki-dict__entry">
                  <a class="wiki-dict__link" href="{{ entry.url | relative_url }}">
                    <span class="wiki-dict__title">{{ entry.title }}</span>
                    {% if entry.category %}
                      <span class="wiki-dict__cat">{{ entry.category }}</span>
                    {% endif %}
                  </a>
                </li>
              {% endif %}
            {% endfor %}
          </ul>
        {% else %}
          <p class="wiki-dict__empty">No entries starting with &ldquo;{{ L }}&rdquo; yet.</p>
        {% endif %}
      </section>
    {% endfor %}
  </div>

</div>

<script>
(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll('.wiki-dict__section'));
  var indexLetters = Array.prototype.slice.call(document.querySelectorAll('.wiki-index__letter'));
  if (!sections.length) return;

  function show(L) {
    L = (L || '').toUpperCase();
    if (!/^[A-Z]$/.test(L)) return;
    sections.forEach(function (s) {
      s.dataset.current = s.dataset.letter === L ? 'true' : 'false';
    });
    indexLetters.forEach(function (a) {
      if (a.dataset.letter === L) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'true');
      } else {
        a.classList.remove('is-current');
        a.removeAttribute('aria-current');
      }
    });
    if (window.location.hash !== '#letter-' + L) {
      history.replaceState(null, '', '#letter-' + L);
    }
  }

  function letterFromHash() {
    var m = (window.location.hash || '').match(/^#letter-([A-Za-z])$/);
    return m ? m[1].toUpperCase() : null;
  }

  indexLetters.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(a.dataset.letter);
    });
  });

  window.addEventListener('hashchange', function () {
    var L = letterFromHash();
    if (L) show(L);
  });

  var initialL = letterFromHash();
  if (initialL) show(initialL);
})();
</script>
