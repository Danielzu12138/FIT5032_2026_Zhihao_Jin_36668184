<script setup>
defineProps({
  resource: {
    type: Object,
    required: true,
  },
  saved: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['save'])
</script>

<template>
  <article class="resource-card">
    <span>{{ resource.category }} · {{ resource.time }}</span>
    <h2>{{ resource.title }}</h2>
    <p>{{ resource.summary }}</p>
    <button :class="{ secondary: saved }" type="button" @click="$emit('save', resource.id)">
      {{ saved ? '✅ Saved' : '🔖 Save resource' }}
    </button>
  </article>
</template>

<style scoped>
.resource-card button.secondary {
  background: var(--color-success-bg, #e3f5e9);
  color: var(--color-success, #1f8b4c);
  border: 1px solid var(--color-success, #1f8b4c);
}

.resource-card button.secondary:hover {
  background: var(--color-success, #1f8b4c);
  color: #fff;
}
</style>
