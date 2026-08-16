<script setup>
import { computed } from 'vue'
import AdminAnalytics from '../components/AdminAnalytics.vue'
import InteractiveDataTable from '../components/InteractiveDataTable.vue'
import StatCard from '../components/StatCard.vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
  bookings: {
    type: Array,
    required: true,
  },
  users: {
    type: Array,
    required: true,
  },
  ratings: {
    type: Array,
    required: true,
  },
  emailError: {
    type: String,
    default: '',
  },
  emailSuccess: {
    type: String,
    default: '',
  },
  emailSending: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['exportData', 'emailSummary'])

const bookingColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'service', label: 'Service' },
  { key: 'slot', label: 'Date and time' },
  { key: 'status', label: 'Status' },
]

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'roleLabel', label: 'Role' },
  { key: 'createdDate', label: 'Created' },
]

const bookingRows = computed(() =>
  props.bookings.map((booking) => ({
    ...booking,
    slot: `${booking.date || ''} ${booking.time || ''}`.trim(),
  })),
)

const userRows = computed(() =>
  props.users.map((user) => ({
    ...user,
    roleLabel: user.role === 'admin' ? 'Admin' : 'Young user',
    createdDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—',
  })),
)
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">🔐 Admin dashboard</p>
        <h1>Admin Dashboard</h1>
        <p>Manage users, bookings, feedback and reports from one place.</p>
      </div>
      <div class="actions compact-actions">
        <button type="button" @click="$emit('exportData', 'bookings')">Export bookings CSV</button>
        <button class="secondary" type="button" @click="$emit('exportData', 'users')">
          Export users CSV
        </button>
        <button
          class="secondary"
          type="button"
          :disabled="emailSending"
          @click="$emit('emailSummary')"
        >
          {{ emailSending ? 'Sending...' : 'Email summary CSV' }}
        </button>
      </div>
    </div>

    <p v-if="emailError" class="message error" role="alert">{{ emailError }}</p>
    <p v-if="emailSuccess" class="message success" role="status">{{ emailSuccess }}</p>

    <div class="section-grid">
      <StatCard title="👥 Total Users" :value="stats.totalUsers" />
      <StatCard title="🧑 Young Users" :value="stats.youngUsers" />
      <StatCard title="🛡️ Admins" :value="stats.admins" />
      <StatCard title="📅 Bookings" :value="stats.bookings" />
      <StatCard title="⭐ Ratings" :value="stats.ratings" />
    </div>

    <AdminAnalytics :bookings="bookings" :ratings="ratings" />

    <InteractiveDataTable
      caption="Booking requests"
      :columns="bookingColumns"
      :rows="bookingRows"
      empty-message="No booking requests match the current searches."
    />

    <InteractiveDataTable
      caption="Registered users"
      :columns="userColumns"
      :rows="userRows"
      empty-message="No registered users match the current searches."
    />
  </section>
</template>
