---
layout: page
title: Studies
permalink: /studies/
section: studies
---

<div class="wiki-constellation" aria-hidden="true"></div>

<div class="studies-page">

  <header class="studies-header">
    <h1 class="studies-header__title"><span aria-hidden="true">◇</span> Studies</h1>
    <p class="studies-header__lead">Research and reports, findings recorded.</p>
  </header>

  <div class="studies-spread" role="main" aria-label="Studies index">
    {% include panel-ornament.html preset='recent' %}

    <!-- ── LEFT: Contents ──────────────────────────────────── -->
    <div class="studies-spread__left">
      <p class="studies-spread__heading">Contents</p>
      <hr class="studies-spread__rule" aria-hidden="true">

      {% assign all_studies = site.studies | sort: 'date' | reverse %}

      <!-- Series groups -->
      {% assign series_names = all_studies | map: 'series' | compact | uniq %}

      <ul class="studies-series-list" aria-label="Series">
        {% assign series_counter = 0 %}
        {% for series_name in series_names %}
          {% assign series_entries = all_studies | where: 'series', series_name | sort: 'part' %}
          {% assign series_latest = series_entries | last %}
          {% assign series_count = series_entries | size %}
          {% assign series_counter = series_counter | plus: 1 %}
          {% assign series_key = series_name | slugify %}

          <li>
            <a class="studies-series"
               data-series="{{ series_key }}"
               href="{{ series_entries.first.url | relative_url }}"
               role="button"
               aria-expanded="false"
               aria-controls="episodes-{{ series_key }}">
              <span class="studies-series__inner">
                <span class="studies-series__num">0{{ series_counter }}</span>
                <span class="studies-series__sigil" aria-hidden="true">◇</span>
                <span class="studies-series__label">{{ series_name }}</span>
              </span>
              <span class="studies-series__meta">
                {{ series_count }} part{% if series_count != 1 %}s{% endif %}
                {% if series_latest.date %} · {{ series_latest.date | date: "%Y-%m" }}{% endif %}
              </span>
            </a>

            <!-- Nested episode list (collapsed by default) -->
            <ul class="studies-episodes" id="episodes-{{ series_key }}" hidden aria-label="{{ series_name }} episodes">
              {% for entry in series_entries %}
                <li class="studies-episode" style="--i: {{ forloop.index0 }}">
                  <span class="studies-episode__glyph" aria-hidden="true">└</span>
                  <a class="studies-episode__link" href="{{ entry.url | relative_url }}">
                    {% if entry.part %}{{ entry.part | prepend: '0' | slice: -2, 2 }} &nbsp;{% endif %}{{ entry.title }}
                  </a>
                </li>
              {% endfor %}
            </ul>
          </li>

        {% endfor %}

        <!-- Singles -->
        {% assign singles = all_studies | where_exp: 'item', 'item.series == blank' %}
        {% if singles.size > 0 %}
          <li>
            <p class="studies-singles__heading">Singles</p>
            {% assign singles_counter = series_counter %}
            {% for entry in singles %}
              {% assign singles_counter = singles_counter | plus: 1 %}
              <a class="studies-series"
                 data-series="single-{{ entry.slug | default: entry.title | slugify }}"
                 href="{{ entry.url | relative_url }}">
                <span class="studies-series__inner">
                  <span class="studies-series__num">0{{ singles_counter }}</span>
                  <span class="studies-series__sigil" aria-hidden="true">◇</span>
                  <span class="studies-series__label">{{ entry.title }}</span>
                </span>
                <span class="studies-series__meta">
                  {% if entry.date %}{{ entry.date | date: "%Y-%m" }}{% endif %}
                </span>
              </a>
            {% endfor %}
          </li>
        {% endif %}

      </ul>

    </div><!-- /.studies-spread__left -->

    <!-- ── SPINE ───────────────────────────────────────────── -->
    <div class="studies-spine" aria-hidden="true">
      <span class="studies-spine__dot"></span>
      <span class="studies-spine__dot"></span>
      <span class="studies-spine__dot"></span>
    </div>

    <!-- ── RIGHT: Latest entry preview ───────────────────────── -->
    <div class="studies-spread__right">
      <p class="studies-spread__heading">Excerpt</p>
      <hr class="studies-spread__rule" aria-hidden="true">

      <!-- Preview slot — populated/replaced by JS.
           SSOT: "The first paragraph IS the preview." (see project_blog_writing_style.md) -->
      <div class="studies-preview" aria-live="polite" aria-label="Entry preview">
        {% assign latest = all_studies | first %}
        {% if latest %}
          <p class="studies-preview__from">
            <span class="studies-preview__from-sigil" aria-hidden="true">FROM</span>
            <span class="studies-preview__from-series">◇ {{ latest.series | default: 'Singles' }}</span>
          </p>
          <h3 class="studies-preview__title">{{ latest.title }}</h3>
          <p class="studies-preview__meta">
            {{ latest.date | date: "%Y-%m-%d" }}{% if latest.part %} · part {{ latest.part }}{% if latest.total %} of {{ latest.total }}{% endif %}{% endif %}
          </p>
          <hr class="studies-preview__divider" aria-hidden="true">
          {% assign latest_body = latest.content | split: '<p>' | slice: 1, 100 | join: '<p>' | prepend: '<p>' %}
          <div class="studies-preview__body">{{ latest_body | strip_html | strip | truncate: 500, '' }}</div>
          <a class="studies-preview__continue" href="{{ latest.url | relative_url }}">continue reading →</a>
        {% else %}
          <div class="studies-preview--empty">
            <h3 class="studies-preview__title">No entries yet.</h3>
          </div>
        {% endif %}
      </div><!-- /.studies-preview -->

    </div><!-- /.studies-spread__right -->

  </div><!-- /.studies-spread -->

</div><!-- /.studies-page -->

<!-- ── Populate JS data store from Liquid ────────────────────── -->
<script>
window.__STUDIES_SERIES__ = [
  {% assign all_studies_js = site.studies | sort: 'date' | reverse %}
  {% assign series_names_js = all_studies_js | map: 'series' | compact | uniq %}

  {% for series_name in series_names_js %}
    {% assign series_entries_js = all_studies_js | where: 'series', series_name | sort: 'part' %}
    {
      "key": {{ series_name | slugify | jsonify }},
      "name": {{ series_name | jsonify }},
      "entries": [
        {% for entry in series_entries_js %}
          {
            "title":      {{ entry.title | jsonify }},
            "series":     {{ entry.series | jsonify }},
            "part":       {% if entry.part %}{{ entry.part }}{% else %}null{% endif %},
            "total":      {% if entry.total %}{{ entry.total }}{% else %}null{% endif %},
            "date":       {{ entry.date | date: "%Y-%m-%d" | jsonify }},
            "preview":    {% assign entry_body = entry.content | split: '<p>' | slice: 1, 100 | join: '<p>' | prepend: '<p>' %}{{ entry_body | strip_html | strip | truncate: 500, '' | jsonify }},
            "url":        {{ entry.url | relative_url | jsonify }}
          }{% unless forloop.last %},{% endunless %}
        {% endfor %}
      ]
    }{% unless forloop.last %},{% endunless %}
  {% endfor %}

  {% assign singles_js = all_studies_js | where_exp: 'item', 'item.series == blank' %}
  {% if singles_js.size > 0 %}
    {% if series_names_js.size > 0 %},{% endif %}
    {% for entry in singles_js %}
      {
        "key":  {{ entry.slug | default: entry.title | slugify | prepend: "single-" | jsonify }},
        "name": "Singles",
        "entries": [
          {
            "title":      {{ entry.title | jsonify }},
            "series":     null,
            "part":       null,
            "total":      null,
            "date":       {{ entry.date | date: "%Y-%m-%d" | jsonify }},
            "preview":    {% assign entry_body = entry.content | split: '<p>' | slice: 1, 100 | join: '<p>' | prepend: '<p>' %}{{ entry_body | strip_html | strip | truncate: 500, '' | jsonify }},
            "url":        {{ entry.url | relative_url | jsonify }}
          }
        ]
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  {% endif %}
];
</script>

<script src="{{ '/assets/js/studies-spread.js' | relative_url }}" defer></script>
