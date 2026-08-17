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
  <article class="info-card stat-card">
    <h2>{{ title }}</h2>
    <p>
      {{ value }}
    </p>
  </article>
</template>

<style scoped>
.stat-card {
  background: var(--color-primary-bg);
  border-color: var(--color-primary-light);
}

.stat-card p {
  margin: 0;
  color: var(--color-primary-dark);
  font-size: 1.4rem;
  font-weight: 800;
}
</style>
