<script setup>
defineProps({
  services: {
    type: Array,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  error: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
})

defineEmits(['submit'])
</script>

<template>
  <form class="form-card" @submit.prevent="$emit('submit')">
    <h3 style="margin: 0 0 0.25rem; font-size: 1.05rem">Share your feedback</h3>
    <label>
      Service
      <select v-model="form.service">
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </label>
    <label>
      Rating <span style="font-weight: 400; color: var(--color-text-muted)">(1–5)</span>
      <input v-model.number="form.score" type="number" min="1" max="5" />
    </label>
    <label>
      Comment <span style="font-weight: 400; color: var(--color-text-muted)">(optional)</span>
      <textarea
        v-model="form.comment"
        maxlength="180"
        placeholder="Tell us about your experience. Max 180 characters."
      ></textarea>
    </label>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="success" class="message success">{{ success }}</p>
    <button type="submit">Submit rating</button>
  </form>
</template>
