<script setup>
import ResourceCard from '../components/ResourceCard.vue'

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  filteredResources: {
    type: Array,
    required: true,
  },
  resourceFilter: {
    type: String,
    required: true,
  },
  savedResourceIds: {
    type: Array,
    required: true,
  },
})

defineEmits(['updateFilter', 'saveResource'])
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">📚 Resource library</p>
        <h1>Resources</h1>
        <p>Short, practical guides written with young people in mind.</p>
      </div>
      <label>
        Filter by category
        <select :value="resourceFilter" @change="$emit('updateFilter', $event.target.value)">
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </label>
    </div>

    <div class="card-grid">
      <ResourceCard
        v-for="resource in filteredResources"
        :key="resource.id"
        :resource="resource"
        :saved="savedResourceIds.includes(resource.id)"
        @save="$emit('saveResource', $event)"
      />
    </div>
  </section>
</template>
