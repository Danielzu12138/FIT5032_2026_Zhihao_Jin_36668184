<script setup>
import StatCard from '../components/StatCard.vue'

defineProps({
  stats: {
    type: Object,
    required: true,
  },
  bookings: {
    type: Array,
    required: true,
  },
})

defineEmits(['exportBookings'])
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">🔐 Admin dashboard</p>
        <h1>Admin Dashboard</h1>
        <p>Manage users, bookings, feedback and reports from one place.</p>
      </div>
      <button type="button" @click="$emit('exportBookings')">📥 Export bookings CSV</button>
    </div>

    <div class="section-grid">
      <StatCard title="👥 Total Users" :value="stats.totalUsers" />
      <StatCard title="🧑 Young Users" :value="stats.youngUsers" />
      <StatCard title="🛡️ Admins" :value="stats.admins" />
      <StatCard title="📅 Bookings" :value="stats.bookings" />
    </div>

    <div class="responsive-table">
      <table>
        <caption>
          All booking requests
        </caption>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.id">
            <td>{{ booking.name }}</td>
            <td>{{ booking.email }}</td>
            <td>{{ booking.service }}</td>
            <td>{{ booking.date }} {{ booking.time }}</td>
            <td>{{ booking.status }}</td>
          </tr>
          <tr v-if="!bookings.length">
            <td colspan="5">No bookings have been created yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
