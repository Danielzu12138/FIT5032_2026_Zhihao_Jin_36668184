<script setup>
defineProps({
  resource: {
    type: Object,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  }
})

defineEmits(['save'])
</script>

<template>
  <article class="resource-card">
    <span>{{ resource.category }} - {{ resource.time }}</span>
    <h2>{{ resource.title }}</h2>
    <p>{{ resource.summary }}</p>
    <button type="button" @click="$emit('save', resource.id)">
      {{ saved ? 'Saved' : 'Save resource' }}
    </button>
  </article>
</template>
