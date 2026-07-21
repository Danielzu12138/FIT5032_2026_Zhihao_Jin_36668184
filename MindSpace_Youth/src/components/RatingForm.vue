<script setup>
defineProps({
  services: {
    type: Array,
    required: true
  },
  form: {
    type: Object,
    required: true
  },
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  }
})

defineEmits(['submit'])
</script>

<template>
  <form class="form-card" @submit.prevent="$emit('submit')">
    <label>
      Service
      <select v-model="form.service">
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </label>
    <label>
      Rating
      <input v-model.number="form.score" type="number" min="1" max="5" />
    </label>
    <label>
      Comment
      <textarea v-model="form.comment" maxlength="180" placeholder="Optional, max 180 characters"></textarea>
    </label>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="success" class="message success">{{ success }}</p>
    <button type="submit">Submit rating</button>
  </form>
</template>
