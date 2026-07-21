<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import { resources } from './data/resources'
import { supportServices } from './data/services'
import { canAccess, getVisiblePages, pages } from './router'
import { findCurrentUser } from './utils/auth'
import { readStorage, seedStorage, STORAGE_KEYS, writeStorage } from './utils/storage'
import { isFutureDateTime, isValidEmail, sanitizeInput } from './utils/validation'
import AdminDashboardView from './views/AdminDashboardView.vue'
import DeniedView from './views/DeniedView.vue'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import ResourcesView from './views/ResourcesView.vue'
import ReviewsView from './views/ReviewsView.vue'
import SupportView from './views/SupportView.vue'
import UserDashboardView from './views/UserDashboardView.vue'

const state = reactive({
  page: 'home',
  users: [],
  currentUserEmail: '',
  bookings: [],
  ratings: [],
  savedResourceIds: []
})

const authMode = ref('login')
const authError = ref('')
const authSuccess = ref('')
const bookingError = ref('')
const bookingSuccess = ref('')
const ratingError = ref('')
const ratingSuccess = ref('')
const resourceFilter = ref('All')

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'young_user'
})

const bookingForm = reactive({
  service: supportServices[0],
  date: '',
  time: '',
  notes: ''
})

const ratingForm = reactive({
  service: supportServices[0],
  score: 5,
  comment: ''
})

const currentUser = computed(() => findCurrentUser(state.users, state.currentUserEmail))
const isLoggedIn = computed(() => Boolean(currentUser.value))
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const isYoungUser = computed(() => currentUser.value?.role === 'young_user')
const visiblePages = computed(() => getVisiblePages(currentUser.value))

const activePage = computed(() => pages.find(page => page.id === state.page))
const canViewCurrentPage = computed(() => canAccess(activePage.value, currentUser.value))
const categories = computed(() => ['All', ...new Set(resources.map(resource => resource.category))])

const filteredResources = computed(() =>
  resourceFilter.value === 'All'
    ? resources
    : resources.filter(resource => resource.category === resourceFilter.value)
)

const userBookings = computed(() =>
  state.bookings.filter(booking => booking.email === state.currentUserEmail)
)

const averageRating = computed(() => {
  if (!state.ratings.length) return 'No ratings yet'
  const total = state.ratings.reduce((sum, rating) => sum + Number(rating.score), 0)
  return (total / state.ratings.length).toFixed(1) + ' / 5'
})

const savedResources = computed(() =>
  resources.filter(resource => state.savedResourceIds.includes(resource.id))
)

const dashboardStats = computed(() => ({
  totalUsers: state.users.length,
  youngUsers: state.users.filter(user => user.role === 'young_user').length,
  admins: state.users.filter(user => user.role === 'admin').length,
  bookings: state.bookings.length,
  ratings: state.ratings.length
}))

function loadState() {
  seedStorage()
  state.users = readStorage(STORAGE_KEYS.users, [])
  state.currentUserEmail = readStorage(STORAGE_KEYS.session, '')
  state.bookings = readStorage(STORAGE_KEYS.bookings, [])
  state.ratings = readStorage(STORAGE_KEYS.ratings, [])
  state.savedResourceIds = readStorage(STORAGE_KEYS.saved, [])
}

watch(() => state.users, users => writeStorage(STORAGE_KEYS.users, users), { deep: true })
watch(() => state.currentUserEmail, email => writeStorage(STORAGE_KEYS.session, email))
watch(() => state.bookings, bookings => writeStorage(STORAGE_KEYS.bookings, bookings), { deep: true })
watch(() => state.ratings, ratings => writeStorage(STORAGE_KEYS.ratings, ratings), { deep: true })
watch(() => state.savedResourceIds, saved => writeStorage(STORAGE_KEYS.saved, saved), { deep: true })

function setPage(pageId) {
  const target = pages.find(page => page.id === pageId)
  if (!canAccess(target, currentUser.value)) {
    state.page = isLoggedIn.value ? 'denied' : 'account'
    return
  }
  state.page = pageId
}

function register() {
  authError.value = ''
  authSuccess.value = ''

  const name = sanitizeInput(registerForm.name, 60)
  const email = sanitizeInput(registerForm.email, 80).toLowerCase()
  const password = registerForm.password
  const confirmPassword = registerForm.confirmPassword

  if (!name || !email || !password || !confirmPassword) {
    authError.value = 'All registration fields are required.'
    return
  }
  if (!isValidEmail(email)) {
    authError.value = 'Please enter a valid email address.'
    return
  }
  if (password.length < 8) {
    authError.value = 'Password must be at least 8 characters.'
    return
  }
  if (password !== confirmPassword) {
    authError.value = 'Passwords do not match.'
    return
  }
  if (state.users.some(user => user.email === email)) {
    authError.value = 'An account with this email already exists.'
    return
  }

  state.users.push({
    name,
    email,
    password,
    role: registerForm.role
  })
  state.currentUserEmail = email
  authSuccess.value = 'Account created successfully.'
  state.page = registerForm.role === 'admin' ? 'admin' : 'dashboard'
}

function login() {
  authError.value = ''
  authSuccess.value = ''

  const email = sanitizeInput(loginForm.email, 80).toLowerCase()
  const password = loginForm.password

  if (!email || !password) {
    authError.value = 'Email and password are required.'
    return
  }
  if (!isValidEmail(email)) {
    authError.value = 'Please enter a valid email address.'
    return
  }

  const user = state.users.find(item => item.email === email && item.password === password)
  if (!user) {
    authError.value = 'Login failed. Check your email and password.'
    return
  }

  state.currentUserEmail = user.email
  authSuccess.value = 'Welcome back, ' + user.name + '.'
  state.page = user.role === 'admin' ? 'admin' : 'dashboard'
}

function logout() {
  state.currentUserEmail = ''
  state.page = 'home'
  authSuccess.value = ''
  authError.value = ''
}

function saveResource(resourceId) {
  if (!isLoggedIn.value) {
    state.page = 'account'
    authMode.value = 'login'
    authError.value = 'Please log in before saving resources.'
    return
  }

  if (state.savedResourceIds.includes(resourceId)) {
    state.savedResourceIds = state.savedResourceIds.filter(id => id !== resourceId)
  } else {
    state.savedResourceIds.push(resourceId)
  }
}

function createBooking() {
  bookingError.value = ''
  bookingSuccess.value = ''

  if (!isYoungUser.value) {
    bookingError.value = 'Please log in as a young user to make a booking.'
    state.page = 'account'
    return
  }
  if (!bookingForm.service || !bookingForm.date || !bookingForm.time) {
    bookingError.value = 'Service, date and time are required.'
    return
  }
  if (!isFutureDateTime(bookingForm.date, bookingForm.time)) {
    bookingError.value = 'Please choose a future date and time.'
    return
  }

  state.bookings.push({
    id: crypto.randomUUID(),
    email: currentUser.value.email,
    name: currentUser.value.name,
    service: bookingForm.service,
    date: bookingForm.date,
    time: bookingForm.time,
    notes: sanitizeInput(bookingForm.notes, 160),
    status: 'Pending'
  })

  bookingSuccess.value = 'Booking request submitted successfully.'
  bookingForm.notes = ''
}

function submitRating() {
  ratingError.value = ''
  ratingSuccess.value = ''

  if (!isLoggedIn.value) {
    ratingError.value = 'Please log in before submitting a rating.'
    state.page = 'account'
    return
  }

  const score = Number(ratingForm.score)
  if (!ratingForm.service || !score || score < 1 || score > 5) {
    ratingError.value = 'Please select a service and rating from 1 to 5.'
    return
  }

  state.ratings.push({
    service: ratingForm.service,
    score,
    comment: sanitizeInput(ratingForm.comment, 180),
    user: currentUser.value.name
  })
  ratingForm.comment = ''
  ratingForm.score = 5
  ratingSuccess.value = 'Thank you. Your rating has been added.'
}

function exportBookingsCsv() {
  const header = ['Name', 'Email', 'Service', 'Date', 'Time', 'Status']
  const rows = state.bookings.map(booking => [
    booking.name,
    booking.email,
    booking.service,
    booking.date,
    booking.time,
    booking.status
  ])
  const csv = [header, ...rows]
    .map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'mindspace-bookings.csv'
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(loadState)
</script>

<template>
  <div class="app-shell">
    <AppHeader
      :pages="visiblePages"
      :current-page="state.page"
      :current-user="currentUser"
      @navigate="setPage"
      @logout="logout"
    />

    <main>
      <DeniedView v-if="state.page === 'denied' || !canViewCurrentPage" @navigate="setPage" />

      <HomeView v-else-if="state.page === 'home'" @navigate="setPage" />

      <ResourcesView
        v-else-if="state.page === 'resources'"
        :categories="categories"
        :filtered-resources="filteredResources"
        :resource-filter="resourceFilter"
        :saved-resource-ids="state.savedResourceIds"
        @update-filter="resourceFilter = $event"
        @save-resource="saveResource"
      />

      <SupportView
        v-else-if="state.page === 'support'"
        :services="supportServices"
        :booking-form="bookingForm"
        :error="bookingError"
        :success="bookingSuccess"
        @create-booking="createBooking"
      />

      <ReviewsView
        v-else-if="state.page === 'reviews'"
        :services="supportServices"
        :rating-form="ratingForm"
        :ratings="state.ratings"
        :average-rating="averageRating"
        :error="ratingError"
        :success="ratingSuccess"
        @submit-rating="submitRating"
      />

      <LoginView
        v-else-if="state.page === 'account'"
        :auth-mode="authMode"
        :login-form="loginForm"
        :register-form="registerForm"
        :error="authError"
        :success="authSuccess"
        @set-mode="authMode = $event"
        @login="login"
        @register="register"
      />

      <UserDashboardView
        v-else-if="state.page === 'dashboard' && isYoungUser"
        :current-user="currentUser"
        :user-bookings="userBookings"
        :saved-resources="savedResources"
        :average-rating="averageRating"
      />

      <AdminDashboardView
        v-else-if="state.page === 'admin' && isAdmin"
        :stats="dashboardStats"
        :bookings="state.bookings"
        @export-bookings="exportBookingsCsv"
      />
    </main>

    <AppFooter />
  </div>
</template>
