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
  minDate: {
    type: String,
    required: true,
  },
})

defineEmits(['submit'])
</script>

<template>
  <form class="form-card" @submit.prevent="$emit('submit')">
    <h3 style="margin: 0 0 0.25rem; font-size: 1.05rem">Request a session</h3>
    <label for="booking-service">
      Service
      <select id="booking-service" v-model="form.service" required>
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </label>
    <label for="booking-date">
      Preferred date
      <input id="booking-date" v-model="form.date" type="date" :min="minDate" required />
    </label>
    <label for="booking-time">
      Preferred time
      <input
        id="booking-time"
        v-model="form.time"
        type="time"
        min="09:00"
        max="17:30"
        step="1800"
        required
      />
    </label>
    <label for="booking-notes">
      Notes <span style="font-weight: 400; color: var(--color-text-muted)">(optional)</span>
      <textarea
        id="booking-notes"
        v-model="form.notes"
        maxlength="160"
        placeholder="Anything we should know? Max 160 characters."
      ></textarea>
    </label>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-if="success" class="message success" role="status">{{ success }}</p>
    <p class="draft-status" role="status">Draft saved on this device.</p>
    <button type="submit">Submit booking</button>
  </form>
</template>
