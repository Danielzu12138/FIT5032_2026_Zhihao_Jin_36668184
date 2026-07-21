<script setup>
defineEmits(['navigate'])
</script>

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">Private, practical, youth-friendly</p>
      <h1>Support for young people when things feel heavy.</h1>
      <p>
        MindSpace Youth helps students and young workers find mental health resources,
        book online support, save helpful guides and share service feedback.
      </p>
      <div class="actions">
        <button type="button" @click="$emit('navigate', 'support')">Book online support</button>
        <button class="secondary" type="button" @click="$emit('navigate', 'resources')">Browse resources</button>
      </div>
    </div>
    <aside class="urgent-box" aria-label="Urgent help information">
      <h2>Need urgent help?</h2>
      <p>If you or someone else is in immediate danger, contact local emergency services now.</p>
      <p>This student project does not provide crisis counselling.</p>
    </aside>
  </section>

  <section class="section-grid">
    <article class="info-card">
      <h2>Get Help Now</h2>
      <p>Clear next steps for young people who are unsure where to begin.</p>
    </article>
    <article class="info-card">
      <h2>Featured Resources</h2>
      <p>Short guides for anxiety, sleep, study pressure and burnout.</p>
    </article>
    <article class="info-card">
      <h2>Quick Booking</h2>
      <p>Logged-in young users can request online support sessions.</p>
    </article>
  </section>
</template>
