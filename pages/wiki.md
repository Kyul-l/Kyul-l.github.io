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
  </header>

  <!-- ✦ Cloud -->
  <section class="wiki-section" aria-labelledby="wiki-section-cloud">
    <div class="wiki-section__header">
      <span class="wiki-section__sigil" aria-hidden="true">✦</span>
      <span class="wiki-section__label" id="wiki-section-cloud">Cloud</span>
      <hr class="wiki-section__rule" aria-hidden="true">
    </div>

    <div class="wiki-grid">

      <!-- AWS card -->
      {% assign aws_entries = site.wiki | where: 'category', 'aws' | sort: 'title' %}
      <div class="wiki-card wiki-card--cloud"
           role="region" aria-label="AWS wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">AWS</span>
        </div>
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
      {% assign gcp_entries = site.wiki | where: 'category', 'gcp' | sort: 'title' %}
      <div class="wiki-card wiki-card--cloud"
           role="region" aria-label="GCP wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">GCP</span>
        </div>
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
      {% assign azure_entries = site.wiki | where: 'category', 'azure' | sort: 'title' %}
      <div class="wiki-card wiki-card--cloud"
           role="region" aria-label="Azure wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">Azure</span>
        </div>
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

  <!-- ✦ Web -->
  <section class="wiki-section" aria-labelledby="wiki-section-web">
    <div class="wiki-section__header">
      <span class="wiki-section__sigil" aria-hidden="true">✦</span>
      <span class="wiki-section__label" id="wiki-section-web">Web</span>
      <hr class="wiki-section__rule" aria-hidden="true">
    </div>

    <div class="wiki-grid wiki-grid--sub">

      {% assign web_entries = site.wiki | where: 'category', 'web' | sort: 'title' %}
      <div class="wiki-card wiki-card--sub"
           role="region" aria-label="Web security wiki entries">
        <div class="wiki-card__head">
          <span class="wiki-card__sigil" aria-hidden="true">✦</span>
          <span class="wiki-card__label">Web</span>
        </div>
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

</div>

<script src="{{ '/assets/js/wiki-signals.js' | relative_url }}" defer></script>
