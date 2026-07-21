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
      Date
      <input v-model="form.date" type="date" />
    </label>
    <label>
      Time
      <input v-model="form.time" type="time" />
    </label>
    <label>
      Notes
      <textarea v-model="form.notes" maxlength="160" placeholder="Optional, max 160 characters"></textarea>
    </label>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="success" class="message success">{{ success }}</p>
    <button type="submit">Submit booking</button>
  </form>
</template>
