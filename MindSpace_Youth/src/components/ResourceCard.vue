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
  savedActionLabel: {
    type: String,
    default: 'Saved',
  },
})

defineEmits(['save', 'open'])
</script>

<template>
  <article class="resource-card">
    <img
      v-if="resource.image"
      class="resource-card-image"
      :src="resource.image"
      :alt="resource.imageAlt"
      loading="lazy"
      width="800"
      height="450"
    />
    <span>{{ resource.category }} · {{ resource.time }}</span>
    <h2>{{ resource.title }}</h2>
    <p>{{ resource.summary }}</p>
    <div class="resource-card-actions">
      <button class="resource-read-button" type="button" @click="$emit('open', resource.id)">
        Read guide
      </button>
      <button
        :class="saved ? 'saved-button' : 'secondary'"
        type="button"
        @click="$emit('save', resource.id)"
      >
        {{ saved ? savedActionLabel : 'Save resource' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.resource-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: auto;
}

.resource-card-actions button {
  flex: 1 1 150px;
}

.resource-read-button {
  order: -1;
}
</style>
