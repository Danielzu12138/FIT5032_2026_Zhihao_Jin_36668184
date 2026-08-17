<script setup>
import ResourceCard from '../components/ResourceCard.vue'
import StatCard from '../components/StatCard.vue'

defineProps({
  currentUser: {
    type: Object,
    required: true,
  },
  userBookings: {
    type: Array,
    required: true,
  },
  savedResources: {
    type: Array,
    required: true,
  },
  averageRating: {
    type: String,
    required: true,
  },
})

defineEmits(['saveResource', 'browseResources', 'openResource'])
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Young user dashboard</p>
        <h1>My Dashboard</h1>
        <p>
          Welcome back, <strong>{{ currentUser.name }}</strong
          >. Here's your personal activity summary.
        </p>
      </div>
    </div>

    <div class="section-grid">
      <StatCard title="My Bookings" :value="userBookings.length + ' booking request(s)'" />
      <StatCard title="Saved Resources" :value="savedResources.length + ' saved guide(s)'" />
      <StatCard title="Average Rating" :value="averageRating" />
    </div>

    <div class="responsive-table">
      <table>
        <caption>
          Your support session bookings
        </caption>
        <thead>
          <tr>
            <th>Service</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in userBookings" :key="booking.id">
            <td>{{ booking.service }}</td>
            <td>{{ booking.date }}</td>
            <td>{{ booking.time }}</td>
            <td>{{ booking.status }}</td>
          </tr>
          <tr v-if="!userBookings.length">
            <td colspan="4">No bookings yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="dashboard-saved-section" aria-labelledby="saved-resources-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Your library</p>
          <h2 id="saved-resources-heading">Saved Resources</h2>
          <p>Guides you have saved for easy access.</p>
        </div>
        <button class="secondary" type="button" @click="$emit('browseResources')">
          Browse resources
        </button>
      </div>

      <div v-if="savedResources.length" class="card-grid">
        <ResourceCard
          v-for="resource in savedResources"
          :key="resource.id"
          :resource="resource"
          saved
          saved-action-label="Remove from saved"
          @save="$emit('saveResource', $event)"
          @open="$emit('openResource', $event)"
        />
      </div>
      <p v-else class="dashboard-empty-state">
        You have not saved any resources yet. Browse the resource library to add useful guides here.
      </p>
    </section>
  </section>
</template>
