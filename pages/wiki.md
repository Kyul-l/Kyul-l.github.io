---
layout: page
title: Wiki
permalink: /wiki/
section: wiki
---

<div class="wiki-constellation" aria-hidden="true"></div>

<div class="wiki-page">

  <header class="wiki-header">
    <div class="wiki-header__left">
      <h1 class="wiki-header__title"><span aria-hidden="true">✦</span> Wiki</h1>
      <p class="wiki-header__lead">Living notes, continually revised.</p>
    </div>
    <div class="wiki-weeklystat" aria-live="polite" aria-label="Recent activity"></div>
  </header>

  <!-- ✦ Cloud · Primary focus -->
  <section class="wiki-section" aria-labelledby="wiki-section-cloud">
    <div class="wiki-section__header">
      <span class="wiki-section__sigil" aria-hidden="true">✦</span>
      <span class="wiki-section__label" id="wiki-section-cloud">Cloud</span>
      <span class="wiki-section__meta">· Primary focus.</span>
      <hr class="wiki-section__rule" aria-hidden="true">
    </div>

    <div class="wiki-grid">

      <!-- AWS card -->
      {% assign aws_entries = site.wiki | where: 'category', 'aws' | sort: 'updated' | reverse %}
      {% assign aws_latest = aws_entries | first %}
      <div class="wiki-card wiki-card--cloud"
           data-updated="{{ aws_latest.updated | default: aws_latest.date | date: '%Y-%m-%d' }}"
           role="region" aria-label="AWS wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">AWS</span>
          <span class="wiki-card__livedot" aria-hidden="true"></span>
        </div>
        {% if aws_latest %}
          <p class="wiki-card__updated">updated {{ aws_latest.updated | default: aws_latest.date | date: '%-d %b %Y' }}</p>
        {% endif %}
        <hr class="wiki-card__divider" aria-hidden="true">
        <ul class="wiki-card__entries">
          {% for entry in aws_entries limit: 3 %}
            <li class="wiki-card__entry{% if forloop.first %} wiki-card__entry--first{% endif %}">
              <span class="wiki-card__bullet" aria-hidden="true">·</span>
              <a href="{{ entry.url | relative_url }}">{{ entry.title }}</a>
            </li>
          {% endfor %}
        </ul>
        <a href="{{ '/wiki/' | relative_url }}?filter=aws" class="wiki-card__viewall">view all →</a>
      </div>

      <!-- GCP card -->
      {% assign gcp_entries = site.wiki | where: 'category', 'gcp' | sort: 'updated' | reverse %}
      {% assign gcp_latest = gcp_entries | first %}
      <div class="wiki-card wiki-card--cloud"
           data-updated="{{ gcp_latest.updated | default: gcp_latest.date | date: '%Y-%m-%d' }}"
           role="region" aria-label="GCP wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">GCP</span>
          <span class="wiki-card__livedot" aria-hidden="true"></span>
        </div>
        {% if gcp_latest %}
          <p class="wiki-card__updated">updated {{ gcp_latest.updated | default: gcp_latest.date | date: '%-d %b %Y' }}</p>
        {% endif %}
        <hr class="wiki-card__divider" aria-hidden="true">
        <ul class="wiki-card__entries">
          {% for entry in gcp_entries limit: 3 %}
            <li class="wiki-card__entry{% if forloop.first %} wiki-card__entry--first{% endif %}">
              <span class="wiki-card__bullet" aria-hidden="true">·</span>
              <a href="{{ entry.url | relative_url }}">{{ entry.title }}</a>
            </li>
          {% endfor %}
        </ul>
        <a href="{{ '/wiki/' | relative_url }}?filter=gcp" class="wiki-card__viewall">view all →</a>
      </div>

      <!-- Azure card -->
      {% assign azure_entries = site.wiki | where: 'category', 'azure' | sort: 'updated' | reverse %}
      {% assign azure_latest = azure_entries | first %}
      <div class="wiki-card wiki-card--cloud"
           data-updated="{{ azure_latest.updated | default: azure_latest.date | date: '%Y-%m-%d' }}"
           role="region" aria-label="Azure wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">Azure</span>
          <span class="wiki-card__livedot" aria-hidden="true"></span>
        </div>
        {% if azure_latest %}
          <p class="wiki-card__updated">updated {{ azure_latest.updated | default: azure_latest.date | date: '%-d %b %Y' }}</p>
        {% endif %}
        <hr class="wiki-card__divider" aria-hidden="true">
        <ul class="wiki-card__entries">
          {% for entry in azure_entries limit: 3 %}
            <li class="wiki-card__entry{% if forloop.first %} wiki-card__entry--first{% endif %}">
              <span class="wiki-card__bullet" aria-hidden="true">·</span>
              <a href="{{ entry.url | relative_url }}">{{ entry.title }}</a>
            </li>
          {% endfor %}
        </ul>
        <a href="{{ '/wiki/' | relative_url }}?filter=azure" class="wiki-card__viewall">view all →</a>
      </div>

    </div>
  </section>

  <!-- ✦ Web · Sub focus -->
  <section class="wiki-section" aria-labelledby="wiki-section-web">
    <div class="wiki-section__header">
      <span class="wiki-section__sigil" aria-hidden="true">✦</span>
      <span class="wiki-section__label" id="wiki-section-web">Web</span>
      <span class="wiki-section__meta">· Sub focus · initial access.</span>
      <hr class="wiki-section__rule" aria-hidden="true">
    </div>

    <div class="wiki-grid wiki-grid--sub">

      {% assign web_entries = site.wiki | where: 'category', 'web' | sort: 'updated' | reverse %}
      {% assign web_latest = web_entries | first %}
      <div class="wiki-card wiki-card--sub"
           data-updated="{{ web_latest.updated | default: web_latest.date | date: '%Y-%m-%d' }}"
           role="region" aria-label="Web security wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">Web</span>
          <span class="wiki-card__livedot" aria-hidden="true"></span>
        </div>
        {% if web_latest %}
          <p class="wiki-card__updated">updated {{ web_latest.updated | default: web_latest.date | date: '%-d %b %Y' }}</p>
        {% endif %}
        <hr class="wiki-card__divider" aria-hidden="true">
        <ul class="wiki-card__entries">
          {% for entry in web_entries limit: 4 %}
            <li class="wiki-card__entry{% if forloop.first %} wiki-card__entry--first{% endif %}">
              <span class="wiki-card__bullet" aria-hidden="true">·</span>
              <a href="{{ entry.url | relative_url }}">{{ entry.title }}</a>
            </li>
          {% endfor %}
        </ul>
        <a href="{{ '/wiki/' | relative_url }}?filter=web" class="wiki-card__viewall">view all →</a>
      </div>

    </div>
  </section>

  <p class="wiki-placeholder" aria-label="Placeholder for future domains">
    ✦ More domains will arrive as content grows.
  </p>

</div>

<script src="{{ '/assets/js/wiki-signals.js' | relative_url }}" defer></script>
