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
    <h3 style="margin: 0 0 0.25rem; font-size: 1.05rem">Request a session</h3>
    <label>
      Service
      <select v-model="form.service">
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </label>
    <label>
      Preferred date
      <input v-model="form.date" type="date" />
    </label>
    <label>
      Preferred time
      <input v-model="form.time" type="time" />
    </label>
    <label>
      Notes <span style="font-weight: 400; color: var(--color-text-muted)">(optional)</span>
      <textarea
        v-model="form.notes"
        maxlength="160"
        placeholder="Anything we should know? Max 160 characters."
      ></textarea>
    </label>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="success" class="message success">{{ success }}</p>
    <button type="submit">Submit booking</button>
  </form>
</template>
