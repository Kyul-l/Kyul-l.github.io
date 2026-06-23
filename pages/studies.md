---
layout: page
title: Studies
permalink: /studies/
section: studies
---

<section class="section-index section-index--studies">
  <header class="section-index__header">
    <h1 class="section-index__title"><span class="nav-sigil">✦</span> Studies</h1>
    <p class="section-index__lead">Research and reports, findings recorded.</p>
  </header>

  {% if site.studies.size > 0 %}
    <ul class="post-list">
      {% assign sorted = site.studies | sort: 'date' | reverse %}
      {% for item in sorted %}
        <li class="post-card">
          <a href="{{ item.url | relative_url }}">
            <h2 class="post-card__title">{{ item.title }}</h2>
            {% if item.date %}<time class="post-card__date">{{ item.date | date: "%Y-%m-%d" }}</time>{% endif %}
            {% if item.excerpt %}<p class="post-card__excerpt">{{ item.excerpt | strip_html | truncate: 140 }}</p>{% endif %}
          </a>
        </li>
      {% endfor %}
    </ul>
  {% else %}
    <p class="section-index__empty">~ no entries yet ~</p>
  {% endif %}
</section>
