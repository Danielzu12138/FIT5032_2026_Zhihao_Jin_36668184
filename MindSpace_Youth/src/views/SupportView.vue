<script setup>
import BookingForm from '../components/BookingForm.vue'

defineProps({
  services: {
    type: Array,
    required: true
  },
  bookingForm: {
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

defineEmits(['createBooking'])
</script>

<template>
  <section class="content-panel two-column">
    <div>
      <p class="eyebrow">Online support</p>
      <h1>Book a support session</h1>
      <p>
        Bookings are stored dynamically in localStorage. Young users can review their own
        bookings from the dashboard, while admins can view all requests.
      </p>
    </div>

    <BookingForm
      :services="services"
      :form="bookingForm"
      :error="error"
      :success="success"
      @submit="$emit('createBooking')"
    />
  </section>
</template>
