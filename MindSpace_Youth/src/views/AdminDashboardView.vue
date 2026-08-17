<script setup>
import { computed, ref } from 'vue'
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

const activeSection = ref('overview')

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

const reviewColumns = [
  { key: 'service', label: 'Service' },
  { key: 'score', label: 'Rating' },
  { key: 'comment', label: 'Comment' },
  { key: 'user', label: 'Submitted by' },
  { key: 'createdDate', label: 'Created' },
]

const reviewRows = computed(() =>
  props.ratings.map((rating) => ({
    ...rating,
    comment: rating.comment || 'No written comment',
    createdDate: rating.createdAt ? new Date(rating.createdAt).toLocaleDateString() : '—',
  })),
)
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Admin dashboard</p>
        <h1>Admin Dashboard</h1>
        <p>Manage users, bookings, feedback and reports from one place.</p>
      </div>
    </div>

    <nav class="admin-section-nav" aria-label="Admin sections">
      <button
        type="button"
        :class="{ active: activeSection === 'overview' }"
        :aria-current="activeSection === 'overview' ? 'page' : undefined"
        @click="activeSection = 'overview'"
      >
        Overview
      </button>
      <button
        type="button"
        :class="{ active: activeSection === 'users' }"
        :aria-current="activeSection === 'users' ? 'page' : undefined"
        @click="activeSection = 'users'"
      >
        Users
      </button>
      <button
        type="button"
        :class="{ active: activeSection === 'bookings' }"
        :aria-current="activeSection === 'bookings' ? 'page' : undefined"
        @click="activeSection = 'bookings'"
      >
        Bookings
      </button>
      <button
        type="button"
        :class="{ active: activeSection === 'reviews' }"
        :aria-current="activeSection === 'reviews' ? 'page' : undefined"
        @click="activeSection = 'reviews'"
      >
        Manage Reviews
      </button>
      <button
        type="button"
        :class="{ active: activeSection === 'reports' }"
        :aria-current="activeSection === 'reports' ? 'page' : undefined"
        @click="activeSection = 'reports'"
      >
        Reports
      </button>
    </nav>

    <div v-if="activeSection === 'overview'" class="section-grid">
      <StatCard title="Total Users" :value="stats.totalUsers" />
      <StatCard title="Young Users" :value="stats.youngUsers" />
      <StatCard title="Admins" :value="stats.admins" />
      <StatCard title="Bookings" :value="stats.bookings" />
      <StatCard title="Ratings" :value="stats.ratings" />
    </div>

    <AdminAnalytics v-if="activeSection === 'overview'" :bookings="bookings" :ratings="ratings" />

    <InteractiveDataTable
      v-if="activeSection === 'bookings'"
      caption="Booking requests"
      :columns="bookingColumns"
      :rows="bookingRows"
      empty-message="No booking requests match the current searches."
    />

    <InteractiveDataTable
      v-if="activeSection === 'users'"
      caption="Registered users"
      :columns="userColumns"
      :rows="userRows"
      empty-message="No registered users match the current searches."
    />

    <InteractiveDataTable
      v-if="activeSection === 'reviews'"
      caption="Submitted reviews"
      :columns="reviewColumns"
      :rows="reviewRows"
      empty-message="No submitted reviews match the current searches."
    />

    <section v-if="activeSection === 'reports'" class="admin-report-panel" aria-labelledby="reports-heading">
      <div>
        <p class="eyebrow">Data exports</p>
        <h2 id="reports-heading">Reports and exports</h2>
        <p>Download operational data or send the current summary to the verified administrator email.</p>
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
      <p v-if="emailError" class="message error" role="alert">{{ emailError }}</p>
      <p v-if="emailSuccess" class="message success" role="status">{{ emailSuccess }}</p>
    </section>
  </section>
</template>
