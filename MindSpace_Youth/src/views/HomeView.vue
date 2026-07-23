<script setup>
defineEmits(['navigate'])
</script>

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">🌟 Private, practical, youth-friendly</p>
      <h1>You're not alone — we're here to help.</h1>
      <p>
        MindSpace Youth helps young people find mental health resources, book online support
        sessions, save helpful guides, and share feedback — all in a safe, private space designed
        for you.
      </p>
      <div class="actions">
        <button type="button" @click="$emit('navigate', 'support')">Book online support</button>
        <button class="secondary" type="button" @click="$emit('navigate', 'resources')">
          Browse resources
        </button>
      </div>
    </div>
    <aside class="urgent-box" aria-label="Urgent help information">
      <h2>🚨 Need urgent help?</h2>
      <p>
        If you or someone else is in immediate danger, please contact emergency services right away.
      </p>
      <p style="margin-top: 1rem; font-size: 0.9rem; color: #8b5e1a">
        ⚠️ This is a student project and does <strong>not</strong> provide crisis counselling.
      </p>
    </aside>
  </section>

  <section class="section-grid">
    <article class="info-card">
      <h2>💬 Get Help Now</h2>
      <p>Clear, compassionate next steps for young people who are unsure where to begin.</p>
    </article>
    <article class="info-card">
      <h2>📖 Featured Resources</h2>
      <p>Short, practical guides for anxiety, sleep, study pressure and burnout.</p>
    </article>
    <article class="info-card">
      <h2>📅 Quick Booking</h2>
      <p>Logged-in young users can request online wellbeing support sessions.</p>
    </article>
  </section>
</template>
