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
    <label for="rating-service">
      Service
      <select id="rating-service" v-model="form.service" required>
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </label>
    <label for="rating-score">
      Rating <span style="font-weight: 400; color: var(--color-text-muted)">(1–5)</span>
      <input id="rating-score" v-model.number="form.score" type="number" min="1" max="5" required />
    </label>
    <label for="rating-comment">
      Comment <span style="font-weight: 400; color: var(--color-text-muted)">(optional)</span>
      <textarea
        id="rating-comment"
        v-model="form.comment"
        maxlength="180"
        placeholder="Tell us about your experience. Max 180 characters."
      ></textarea>
    </label>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-if="success" class="message success" role="status">{{ success }}</p>
    <button type="submit">Submit rating</button>
  </form>
</template>
