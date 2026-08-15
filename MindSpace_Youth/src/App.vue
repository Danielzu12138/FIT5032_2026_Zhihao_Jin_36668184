<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import { resources } from './data/resources'
import { supportServices } from './data/services'
import { canAccess, getVisiblePages, pages } from './router'
import {
  registerUser,
  loginUser,
  logoutUser,
  fetchUserProfile,
  fetchAllUsers,
  onAuthChange,
} from './utils/auth'
import {
  fetchAllBookings,
  fetchUserBookings,
  addBooking,
  fetchAllRatings,
  addRating,
  fetchSavedResourceIds,
  toggleSavedResource,
} from './utils/storage'
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
  currentUser: null,
  bookings: [],
  ratings: [],
  savedResourceIds: [],
  loading: true,
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
  password: '',
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const bookingForm = reactive({
  service: supportServices[0],
  date: '',
  time: '',
  notes: '',
})

const ratingForm = reactive({
  service: supportServices[0],
  score: 5,
  comment: '',
})

const currentUser = computed(() => state.currentUser)
const isLoggedIn = computed(() => Boolean(state.currentUser))
const isAdmin = computed(() => state.currentUser?.role === 'admin')
const isYoungUser = computed(() => state.currentUser?.role === 'young_user')
const visiblePages = computed(() => getVisiblePages(state.currentUser))

const activePage = computed(() => pages.find((page) => page.id === state.page))
const canViewCurrentPage = computed(() => canAccess(activePage.value, state.currentUser))
const categories = computed(() => [
  'All',
  ...new Set(resources.map((resource) => resource.category)),
])

const filteredResources = computed(() =>
  resourceFilter.value === 'All'
    ? resources
    : resources.filter((resource) => resource.category === resourceFilter.value),
)

const userBookings = computed(() =>
  state.bookings.filter((booking) => booking.uid === state.currentUser?.uid),
)

const averageRating = computed(() => {
  if (!state.ratings.length) return 'No ratings yet'
  const total = state.ratings.reduce((sum, rating) => sum + Number(rating.score), 0)
  return (total / state.ratings.length).toFixed(1) + ' / 5'
})

const savedResources = computed(() =>
  resources.filter((resource) => state.savedResourceIds.includes(resource.id)),
)

const dashboardStats = reactive({
  totalUsers: 0,
  youngUsers: 0,
  admins: 0,
  bookings: 0,
  ratings: 0,
})

let authUnsubscribe = null

async function loadUserData(uid) {
  if (!uid) {
    state.currentUser = null
    state.bookings = []
    state.ratings = []
    state.savedResourceIds = []
    return
  }

  const profileResult = await fetchUserProfile(uid)
  if (profileResult.success) {
    state.currentUser = profileResult.profile
  } else {
    state.currentUser = null
    return
  }

  const bookingsRequest = state.currentUser.role === 'admin'
    ? fetchAllBookings()
    : fetchUserBookings(uid)

  const [bookingsResult, ratingsResult, savedResult] = await Promise.all([
    bookingsRequest,
    fetchAllRatings(),
    fetchSavedResourceIds(uid),
  ])

  if (bookingsResult.success) state.bookings = bookingsResult.bookings
  if (ratingsResult.success) state.ratings = ratingsResult.ratings
  if (savedResult.success) state.savedResourceIds = savedResult.ids
}

async function loadApp() {
  state.loading = true

  // Safety timeout: show page after 2 seconds even if Firebase hangs
  const safetyTimer = setTimeout(() => {
    if (state.loading) {
      console.warn('Firestore unavailable – showing page with empty data')
      state.loading = false
    }
  }, 2000)

  authUnsubscribe = onAuthChange(async (firebaseUser) => {
    clearTimeout(safetyTimer)
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid)
      if (state.currentUser && (state.page === 'home' || state.page === 'account')) {
        state.page = state.currentUser.role === 'admin' ? 'admin' : 'dashboard'
      }
    } else {
      state.currentUser = null
      state.bookings = []
      state.ratings = []
      state.savedResourceIds = []
      // Clear forms on logout
      loginForm.email = ''
      loginForm.password = ''
      registerForm.name = ''
      registerForm.email = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''
      const ratingsResult = await fetchAllRatings()
      if (ratingsResult.success) state.ratings = ratingsResult.ratings
      authError.value = ''
      authSuccess.value = ''
    }
    state.loading = false
  })
}

function clearAllForms() {
  authError.value = ''
  authSuccess.value = ''
  bookingError.value = ''
  bookingSuccess.value = ''
  ratingError.value = ''
  ratingSuccess.value = ''
  resourceFilter.value = 'All'
  loginForm.email = ''
  loginForm.password = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  bookingForm.service = supportServices[0]
  bookingForm.date = ''
  bookingForm.time = ''
  bookingForm.notes = ''
  ratingForm.service = supportServices[0]
  ratingForm.score = 5
  ratingForm.comment = ''
}

function setPage(pageId) {
  const target = pages.find((page) => page.id === pageId)
  if (!canAccess(target, state.currentUser)) {
    state.page = isLoggedIn.value ? 'denied' : 'account'
    return
  }
  state.page = pageId

  // Clear all forms when navigating between pages
  clearAllForms()

  // Refresh data when navigating to role-based pages
  if (pageId === 'admin' && isAdmin.value) {
    refreshAdminData()
  } else if (pageId === 'dashboard' && state.currentUser) {
    refreshUserData()
  }
}

function switchAuthMode(mode) {
  // Clear all form fields and messages when switching between login/register
  authMode.value = mode
  loginForm.email = ''
  loginForm.password = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  authError.value = ''
  authSuccess.value = ''
}

async function refreshAdminData() {
  const [bookingsResult, usersResult, ratingsResult] = await Promise.all([
    fetchAllBookings(),
    fetchAllUsers(),
    fetchAllRatings(),
  ])
  if (bookingsResult.success) state.bookings = bookingsResult.bookings
  if (ratingsResult.success) state.ratings = ratingsResult.ratings
  if (usersResult.success) {
    dashboardStats.totalUsers = usersResult.users.length
    dashboardStats.youngUsers = usersResult.users.filter((u) => u.role === 'young_user').length
    dashboardStats.admins = usersResult.users.filter((u) => u.role === 'admin').length
    dashboardStats.bookings = state.bookings.length
    dashboardStats.ratings = state.ratings.length
  }
}

async function refreshUserData() {
  if (!state.currentUser) return
  const [bookingsResult, savedResult] = await Promise.all([
    fetchUserBookings(state.currentUser.uid),
    fetchSavedResourceIds(state.currentUser.uid),
  ])
  if (bookingsResult.success) state.bookings = bookingsResult.bookings
  if (savedResult.success) state.savedResourceIds = savedResult.ids
}

async function register() {
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

  const result = await registerUser(email, password, name)
  if (result.success) {
    authSuccess.value = 'Account created successfully.'
    // Clear register form after successful registration
    registerForm.name = ''
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  } else {
    authError.value = result.error
  }
}

async function login() {
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

  const result = await loginUser(email, password)
  if (result.success) {
    authSuccess.value = 'Welcome back.'
    // Clear login form after successful login
    loginForm.email = ''
    loginForm.password = ''
  } else {
    authError.value = result.error
  }
}

async function logout() {
  await logoutUser()
  state.currentUser = null
  state.page = 'home'
  state.bookings = []
  state.ratings = []
  state.savedResourceIds = []
  // Clear auth messages
  authError.value = ''
  authSuccess.value = ''
  bookingError.value = ''
  bookingSuccess.value = ''
  ratingError.value = ''
  ratingSuccess.value = ''
  // Clear forms
  loginForm.email = ''
  loginForm.password = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
}

async function saveResource(resourceId) {
  if (!isLoggedIn.value) {
    state.page = 'account'
    authMode.value = 'login'
    authError.value = 'Please log in before saving resources.'
    return
  }

  const result = await toggleSavedResource(state.currentUser.uid, resourceId)
  if (result.success) {
    if (result.saved) {
      state.savedResourceIds.push(resourceId)
    } else {
      state.savedResourceIds = state.savedResourceIds.filter((id) => id !== resourceId)
    }
  }
}

async function createBooking() {
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

  const result = await addBooking({
    uid: state.currentUser.uid,
    email: state.currentUser.email,
    name: state.currentUser.name,
    service: bookingForm.service,
    date: bookingForm.date,
    time: bookingForm.time,
    notes: sanitizeInput(bookingForm.notes, 160),
    status: 'Pending',
  })

  if (result.success) {
    bookingSuccess.value = 'Booking request submitted successfully.'
    bookingForm.notes = ''
    const bookingsResult = await fetchUserBookings(state.currentUser.uid)
    if (bookingsResult.success) state.bookings = bookingsResult.bookings
  } else {
    bookingError.value = result.error
  }
}

async function submitRating() {
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

  const result = await addRating({
    uid: state.currentUser.uid,
    service: ratingForm.service,
    score,
    comment: sanitizeInput(ratingForm.comment, 180),
    user: state.currentUser.name,
  })

  if (result.success) {
    ratingForm.comment = ''
    ratingForm.score = 5
    ratingSuccess.value = 'Thank you. Your rating has been added.'
    const ratingsResult = await fetchAllRatings()
    if (ratingsResult.success) state.ratings = ratingsResult.ratings
  } else {
    ratingError.value = result.error
  }
}

function exportBookingsCsv() {
  const header = ['Name', 'Email', 'Service', 'Date', 'Time', 'Status']
  const rows = state.bookings.map((booking) => [
    booking.name,
    booking.email,
    booking.service,
    booking.date,
    booking.time,
    booking.status,
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'mindspace-bookings.csv'
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(loadApp)
onUnmounted(() => {
  if (authUnsubscribe) authUnsubscribe()
})
</script>

<template>
  <div class="app-shell">
    <div v-if="state.loading" class="loading-screen">
      <p>Loading MindSpace Youth…</p>
    </div>

    <template v-else>
      <AppHeader
        :pages="visiblePages"
        :current-page="state.page"
        :current-user="state.currentUser"
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
          @set-mode="switchAuthMode"
          @login="login"
          @register="register"
        />

        <UserDashboardView
          v-else-if="state.page === 'dashboard' && isYoungUser"
          :current-user="state.currentUser"
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
    </template>
  </div>
</template>

<style scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #2f6f73;
  font-size: 1.2rem;
  font-weight: 700;
}
</style>
