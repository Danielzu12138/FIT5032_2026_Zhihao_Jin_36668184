<script setup>
import { computed, reactive, ref } from 'vue'
import AdminAnalytics from '../components/AdminAnalytics.vue'
import InteractiveDataTable from '../components/InteractiveDataTable.vue'
import StatCard from '../components/StatCard.vue'

const props = defineProps({
  stats: { type: Object, required: true },
  bookings: { type: Array, required: true },
  users: { type: Array, required: true },
  ratings: { type: Array, required: true },
  managedResources: { type: Array, default: () => [] },
  emailError: { type: String, default: '' },
  emailSuccess: { type: String, default: '' },
  emailSending: { type: Boolean, default: false },
  managementError: { type: String, default: '' },
  managementSuccess: { type: String, default: '' },
  managementSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits([
  'exportData',
  'emailSummary',
  'updateBookingStatus',
  'saveResource',
  'deleteResource',
])

const activeSection = ref('overview')
const editingResourceId = ref('')
const bookingStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled']

const resourceForm = reactive({
  title: '',
  category: '',
  time: '5 min read',
  summary: '',
  image: '',
  imageAlt: '',
})

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

const reviewColumns = [
  { key: 'service', label: 'Service' },
  { key: 'score', label: 'Rating' },
  { key: 'comment', label: 'Comment' },
  { key: 'user', label: 'Submitted by' },
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
    createdDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available',
  })),
)

const reviewRows = computed(() =>
  props.ratings.map((rating) => ({
    ...rating,
    comment: rating.comment || 'No written comment',
    createdDate: rating.createdAt ? new Date(rating.createdAt).toLocaleDateString() : 'Not available',
  })),
)

function clearResourceForm() {
  editingResourceId.value = ''
  resourceForm.title = ''
  resourceForm.category = ''
  resourceForm.time = '5 min read'
  resourceForm.summary = ''
  resourceForm.image = ''
  resourceForm.imageAlt = ''
}

function startEditingResource(resource) {
  editingResourceId.value = resource.id
  resourceForm.title = resource.title || ''
  resourceForm.category = resource.category || ''
  resourceForm.time = resource.time || '5 min read'
  resourceForm.summary = resource.summary || ''
  resourceForm.image = resource.image || ''
  resourceForm.imageAlt = resource.imageAlt || ''
}

function submitResource() {
  emit('saveResource', {
    id: editingResourceId.value,
    resource: { ...resourceForm },
    done: clearResourceForm,
  })
}

function removeResource(resource) {
  if (!window.confirm(`Delete “${resource.title}”? This cannot be undone.`)) return
  emit('deleteResource', resource.id)
}
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Admin dashboard</p>
        <h1>Admin Dashboard</h1>
        <p>Manage users, appointment requests, published resources and reports from one place.</p>
      </div>
    </div>

    <nav class="admin-section-nav" aria-label="Admin sections">
      <button type="button" :class="{ active: activeSection === 'overview' }" @click="activeSection = 'overview'">Overview</button>
      <button type="button" :class="{ active: activeSection === 'users' }" @click="activeSection = 'users'">Users</button>
      <button type="button" :class="{ active: activeSection === 'bookings' }" @click="activeSection = 'bookings'">Bookings</button>
      <button type="button" :class="{ active: activeSection === 'resources' }" @click="activeSection = 'resources'">Resources</button>
      <button type="button" :class="{ active: activeSection === 'reviews' }" @click="activeSection = 'reviews'">Reviews</button>
      <button type="button" :class="{ active: activeSection === 'reports' }" @click="activeSection = 'reports'">Reports</button>
    </nav>

    <template v-if="activeSection === 'overview'">
      <div class="section-grid">
        <StatCard title="Total Users" :value="stats.totalUsers" />
        <StatCard title="Young Users" :value="stats.youngUsers" />
        <StatCard title="Admins" :value="stats.admins" />
        <StatCard title="Bookings" :value="stats.bookings" />
        <StatCard title="Ratings" :value="stats.ratings" />
      </div>
      <AdminAnalytics :bookings="bookings" :ratings="ratings" />
    </template>

    <InteractiveDataTable
      v-if="activeSection === 'users'"
      caption="Registered users"
      :columns="userColumns"
      :rows="userRows"
      empty-message="No registered users match the current searches."
    />

    <section v-if="activeSection === 'bookings'" class="admin-management-section">
      <InteractiveDataTable
        caption="Booking requests"
        :columns="bookingColumns"
        :rows="bookingRows"
        empty-message="No booking requests match the current searches."
      />
      <div class="admin-action-list" aria-label="Booking status controls">
        <h2>Update booking status</h2>
        <p>Changing a booking to Cancelled releases its time slot for another young user.</p>
        <div v-for="booking in bookings" :key="booking.id" class="admin-action-row">
          <div>
            <strong>{{ booking.name }}</strong>
            <span>{{ booking.service }} · {{ booking.date }} {{ booking.time }}</span>
          </div>
          <label>
            Status
            <select
              :value="booking.status"
              :disabled="managementSubmitting"
              @change="$emit('updateBookingStatus', { id: booking.id, status: $event.target.value })"
            >
              <option v-for="status in bookingStatuses" :key="status">{{ status }}</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section v-if="activeSection === 'resources'" class="admin-management-section">
      <div class="admin-resource-layout">
        <form class="admin-resource-form" @submit.prevent="submitResource">
          <div>
            <p class="eyebrow">{{ editingResourceId ? 'Edit resource' : 'New resource' }}</p>
            <h2>{{ editingResourceId ? 'Update resource' : 'Publish a resource' }}</h2>
          </div>
          <label>Title<input v-model.trim="resourceForm.title" maxlength="100" required /></label>
          <label>Category<input v-model.trim="resourceForm.category" maxlength="40" placeholder="e.g. Sleep" required /></label>
          <label>Reading time<input v-model.trim="resourceForm.time" maxlength="30" required /></label>
          <label class="full-width">Summary<textarea v-model.trim="resourceForm.summary" maxlength="280" rows="4" required /></label>
          <label class="full-width">Image URL (optional)<input v-model.trim="resourceForm.image" type="url" maxlength="500" /></label>
          <label class="full-width">Image description<input v-model.trim="resourceForm.imageAlt" maxlength="180" /></label>
          <div class="actions compact-actions full-width">
            <button type="submit" :disabled="managementSubmitting">{{ editingResourceId ? 'Save changes' : 'Publish resource' }}</button>
            <button v-if="editingResourceId" class="secondary" type="button" @click="clearResourceForm">Cancel edit</button>
          </div>
        </form>

        <div class="admin-resource-list">
          <div>
            <p class="eyebrow">Firestore content</p>
            <h2>Managed resources</h2>
          </div>
          <p v-if="!managedResources.length" class="empty-state">No administrator-created resources yet. Publish one using the form.</p>
          <article v-for="resource in managedResources" :key="resource.id" class="admin-resource-item">
            <div>
              <span>{{ resource.category }} · {{ resource.time }}</span>
              <h3>{{ resource.title }}</h3>
              <p>{{ resource.summary }}</p>
            </div>
            <div class="actions compact-actions">
              <button class="secondary" type="button" @click="startEditingResource(resource)">Edit</button>
              <button class="danger-button" type="button" :disabled="managementSubmitting" @click="removeResource(resource)">Delete</button>
            </div>
          </article>
        </div>
      </div>
    </section>

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
        <button class="secondary" type="button" @click="$emit('exportData', 'users')">Export users CSV</button>
        <button class="secondary" type="button" :disabled="emailSending" @click="$emit('emailSummary')">{{ emailSending ? 'Sending...' : 'Email summary CSV' }}</button>
      </div>
      <p v-if="emailError" class="message error" role="alert">{{ emailError }}</p>
      <p v-if="emailSuccess" class="message success" role="status">{{ emailSuccess }}</p>
    </section>

    <p v-if="managementError" class="message error" role="alert">{{ managementError }}</p>
    <p v-if="managementSuccess" class="message success" role="status">{{ managementSuccess }}</p>
  </section>
</template>
