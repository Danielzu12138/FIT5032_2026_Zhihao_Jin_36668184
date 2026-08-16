<script setup>
import BookingCalendar from '../components/BookingCalendar.vue'
import BookingForm from '../components/BookingForm.vue'

defineProps({
  services: {
    type: Array,
    required: true,
  },
  bookingForm: {
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
  bookings: {
    type: Array,
    required: true,
  },
  minDate: {
    type: String,
    required: true,
  },
})

defineEmits(['createBooking', 'selectSlot'])
</script>

<template>
  <section class="content-panel">
    <div class="section-heading support-heading">
      <div>
      <p class="eyebrow">📅 Online support</p>
      <h1>Book a support session</h1>
      <p>
        Choose a service that fits what you're going through, pick a date and time, and we'll take
        it from there. Your bookings are saved securely and you can view them anytime from your
        dashboard.
      </p>
      </div>
    </div>

    <div class="booking-workspace">
      <BookingCalendar :bookings="bookings" @select-slot="$emit('selectSlot', $event)" />

      <BookingForm
        :services="services"
        :form="bookingForm"
        :error="error"
        :success="success"
        :min-date="minDate"
        @submit="$emit('createBooking')"
      />
    </div>
  </section>
</template>
