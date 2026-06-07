---
layout: default
title: Contact
permalink: /contact/
---

<section class="contact-page">
  <header class="contact-header">
    <h1 class="contact-title">Send a Note</h1>
    <p class="contact-lead">Thoughts on a post, a collaboration idea, or just a hello &mdash; write below. Replies aren&rsquo;t guaranteed, but I read everything.</p>
  </header>

  <form class="contact-form" action="https://formsubmit.co/kyull.kr+blog@gmail.com" method="POST">
    <input type="hidden" name="_subject" value="✦ new note from kyul-l.github.io">
    <input type="hidden" name="_template" value="box">
    <input type="hidden" name="_next" value="{{ '/contact/thanks/' | absolute_url }}">
    <input type="hidden" name="_captcha" value="false">
    <input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">

    <label class="field">
      <span class="field__label">Name <em>optional</em></span>
      <input type="text" name="name" autocomplete="name" maxlength="80">
    </label>

    <label class="field">
      <span class="field__label">Email <em>only if you&rsquo;d like a reply</em></span>
      <input type="email" name="email" autocomplete="email" maxlength="120">
    </label>

    <label class="field">
      <span class="field__label">Message</span>
      <textarea name="message" rows="7" required maxlength="4000" placeholder="…"></textarea>
    </label>

    <div class="contact-form__actions">
      <button type="submit" class="btn-send">Send <span aria-hidden="true">→</span></button>
    </div>

    <p class="contact-note">Submissions are routed through <a href="https://formsubmit.co" target="_blank" rel="noopener">formsubmit.co</a>; no tracking, no third-party comment system.</p>
  </form>
</section>
