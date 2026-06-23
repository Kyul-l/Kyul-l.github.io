---
layout: page
title: Wiki
permalink: /wiki/
section: wiki
---

<section class="section-index section-index--wiki">
  <header class="section-index__header">
    <h1 class="section-index__title"><span class="nav-sigil">✦</span> Wiki</h1>
    <p class="section-index__lead">Living notes, continually revised.</p>
  </header>

  {% if site.wiki.size > 0 %}
    <ul class="post-list">
      {% assign sorted = site.wiki | sort: 'title' %}
      {% for item in sorted %}
        <li class="post-card">
          <a href="{{ item.url | relative_url }}">
            <h2 class="post-card__title">{{ item.title }}</h2>
            {% if item.excerpt %}<p class="post-card__excerpt">{{ item.excerpt | strip_html | truncate: 140 }}</p>{% endif %}
          </a>
        </li>
      {% endfor %}
    </ul>
  {% else %}
    <p class="section-index__empty">~ no entries yet ~</p>
  {% endif %}
</section>
