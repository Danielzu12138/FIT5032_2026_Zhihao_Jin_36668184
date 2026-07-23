<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
})
</script>

<template>
  <article
    class="info-card"
    style="background: linear-gradient(135deg, var(--color-primary-bg, #eef9f8), #ffffff)"
  >
    <h2>{{ title }}</h2>
    <p style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary, #1a7f7a); margin: 0">
      {{ value }}
    </p>
  </article>
</template>
