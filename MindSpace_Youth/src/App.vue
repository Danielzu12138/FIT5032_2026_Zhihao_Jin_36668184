<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import OnlineStatus from './components/OnlineStatus.vue'
import { resources } from './data/resources'
import { supportServices } from './data/services'
import { canAccess, getVisiblePages, pages } from './router'
import {
  loginUser,
  resetPassword,
  resendVerificationEmail,
  logoutUser,
  ensureUserProfile,
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
import {
  checkBookingOnServer,
  completeEmailRegistration,
  encodeBase64,
  sendEmailWithAttachment,
  startEmailRegistration,
} from './utils/api'
import DeniedView from './views/DeniedView.vue'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import ResourcesView from './views/ResourcesView.vue'
import ResourceDetailView from './views/ResourceDetailView.vue'
import ReviewsView from './views/ReviewsView.vue'
import UserDashboardView from './views/UserDashboardView.vue'

const AdminDashboardView = defineAsyncComponent(() => import('./views/AdminDashboardView.vue'))
const SupportMapView = defineAsyncComponent(() => import('./views/SupportMapView.vue'))
const SupportView = defineAsyncComponent(() => import('./views/SupportView.vue'))

const state = reactive({
  page: 'home',
  currentUser: null,
  users: [],
  bookings: [],
  ratings: [],
  savedResourceIds: [],
  loading: true,
})

const BOOKING_DRAFT_KEY = 'mindspace-youth-booking-draft'

const authMode = ref('login')
const authError = ref('')
const authSuccess = ref('')
const authNeedsVerification = ref(false)
const authPendingAction = ref('')
const registrationChallengeId = ref('')
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingSubmitting = ref(false)
const adminEmailError = ref('')
const adminEmailSuccess = ref('')
const adminEmailSending = ref(false)
const ratingError = ref('')
const ratingSuccess = ref('')
const resourceFilter = ref('All')
const selectedResourceId = ref('')
const resourceReturnPage = ref('resources')

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const bookingForm = reactive({
  service: supportServices[0],
  date: '',
  time: '',
  notes: '',
})

function inputDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const minBookingDate = inputDateValue()

function restoreBookingDraft() {
  try {
    const savedDraft = JSON.parse(localStorage.getItem(BOOKING_DRAFT_KEY) || 'null')
    if (!savedDraft) return
    if (supportServices.includes(savedDraft.service)) bookingForm.service = savedDraft.service
    bookingForm.date = String(savedDraft.date || '').slice(0, 10)
    bookingForm.time = String(savedDraft.time || '').slice(0, 5)
    bookingForm.notes = sanitizeInput(savedDraft.notes, 160)
  } catch {
    localStorage.removeItem(BOOKING_DRAFT_KEY)
  }
}

watch(
  bookingForm,
  (draft) => {
    try {
      if (draft.date || draft.time || draft.notes) {
        localStorage.setItem(
          BOOKING_DRAFT_KEY,
          JSON.stringify({
            service: draft.service,
            date: draft.date,
            time: draft.time,
            notes: draft.notes,
          }),
        )
      } else {
        localStorage.removeItem(BOOKING_DRAFT_KEY)
      }
    } catch {
      // Local storage may be unavailable in private browsing modes.
    }
  },
  { deep: true },
)

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

const selectedResource = computed(() =>
  resources.find((resource) => resource.id === selectedResourceId.value),
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
    state.users = []
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
      if (!firebaseUser.emailVerified) {
        state.currentUser = null
        state.page = 'account'
        authMode.value = 'login'
        authNeedsVerification.value = true
        authError.value = 'Please verify your email address before signing in.'
        state.loading = false
        return
      }
      const profileResult = await ensureUserProfile(firebaseUser)
      if (!profileResult.success) {
        state.currentUser = null
        state.page = 'account'
        authMode.value = 'login'
        authError.value = profileResult.error
        state.loading = false
        return
      }
      await loadUserData(firebaseUser.uid)
      if (state.currentUser?.role === 'admin') await refreshAdminData()
      if (state.currentUser && (state.page === 'home' || state.page === 'account')) {
        state.page = state.currentUser.role === 'admin' ? 'admin' : 'dashboard'
      }
    } else {
      state.currentUser = null
      state.users = []
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
      registerForm.verificationCode = ''
      registrationChallengeId.value = ''
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
  authNeedsVerification.value = false
  bookingError.value = ''
  bookingSuccess.value = ''
  adminEmailError.value = ''
  adminEmailSuccess.value = ''
  ratingError.value = ''
  ratingSuccess.value = ''
  resourceFilter.value = 'All'
  loginForm.email = ''
  loginForm.password = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  registerForm.verificationCode = ''
  registrationChallengeId.value = ''
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
  registerForm.verificationCode = ''
  registrationChallengeId.value = ''
  authError.value = ''
  authSuccess.value = ''
  authNeedsVerification.value = false
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
    state.users = usersResult.users
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

function validatedRegistrationDetails() {
  const name = sanitizeInput(registerForm.name, 60)
  const email = sanitizeInput(registerForm.email, 80).toLowerCase()
  const password = registerForm.password
  const confirmPassword = registerForm.confirmPassword

  if (!name || !email || !password || !confirmPassword) {
    authError.value = 'All registration fields are required.'
    return null
  }
  if (!isValidEmail(email)) {
    authError.value = 'Please enter a valid email address.'
    return null
  }
  if (password.length < 8) {
    authError.value = 'Password must be at least 8 characters.'
    return null
  }
  if (password.length > 128) {
    authError.value = 'Password must be 128 characters or fewer.'
    return null
  }
  if (password !== confirmPassword) {
    authError.value = 'Passwords do not match.'
    return null
  }
  return { name, email, password }
}

async function requestRegistrationCode() {
  if (authPendingAction.value) return
  authError.value = ''
  authSuccess.value = ''
  const details = validatedRegistrationDetails()
  if (!details) return

  authPendingAction.value = 'registration-code'
  try {
    const result = await startEmailRegistration({
      name: details.name,
      email: details.email,
    })
    if (result.success) {
      registrationChallengeId.value = result.challengeId
      registerForm.verificationCode = ''
      authSuccess.value = 'A six-digit code was sent to your email. It expires in 10 minutes.'
    } else {
      authError.value = result.error
    }
  } finally {
    authPendingAction.value = ''
  }
}

async function completeRegistration() {
  if (authPendingAction.value) return
  authError.value = ''
  authSuccess.value = ''
  const details = validatedRegistrationDetails()
  if (!details) return
  if (!registrationChallengeId.value) {
    authError.value = 'Request a new verification code first.'
    return
  }

  const code = String(registerForm.verificationCode || '').trim()
  if (!/^\d{6}$/.test(code)) {
    authError.value = 'Enter the six-digit verification code.'
    return
  }

  authPendingAction.value = 'registration-complete'
  try {
    const result = await completeEmailRegistration({
      challengeId: registrationChallengeId.value,
      email: details.email,
      password: details.password,
      code,
    })
    if (result.success) {
      loginForm.email = details.email
      loginForm.password = ''
      authMode.value = 'login'
      registrationChallengeId.value = ''
      registerForm.name = ''
      registerForm.email = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''
      registerForm.verificationCode = ''
      authSuccess.value = 'Email verified and account created. You can now log in.'
      authNeedsVerification.value = false
    } else {
      authError.value = result.error
    }
  } finally {
    authPendingAction.value = ''
  }
}

function cancelRegistrationVerification() {
  registrationChallengeId.value = ''
  registerForm.verificationCode = ''
  authError.value = ''
  authSuccess.value = ''
}

async function login() {
  if (authPendingAction.value) return
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

  authPendingAction.value = 'login'
  try {
    const result = await loginUser(email, password)
    if (result.success) {
      authSuccess.value = 'Welcome back. Loading your dashboard...'
      authNeedsVerification.value = false
      loginForm.email = ''
      loginForm.password = ''
    } else {
      authError.value = result.error
      authNeedsVerification.value = result.code === 'auth/email-not-verified'
    }
  } finally {
    authPendingAction.value = ''
  }
}

async function resendVerification() {
  if (authPendingAction.value) return
  authError.value = ''
  authSuccess.value = ''

  const email = sanitizeInput(loginForm.email, 80).toLowerCase()
  const password = loginForm.password
  if (!email || !password || !isValidEmail(email)) {
    authError.value = 'Enter your email and password first.'
    return
  }

  authPendingAction.value = 'verification'
  try {
    const result = await resendVerificationEmail(email, password)
    if (result.success) {
      authNeedsVerification.value = false
      authSuccess.value = 'A new verification email has been sent. Check your inbox and spam folder.'
      loginForm.password = ''
    } else {
      authError.value = result.error
    }
  } finally {
    authPendingAction.value = ''
  }
}

async function requestPasswordReset() {
  if (authPendingAction.value) return
  authError.value = ''
  authSuccess.value = ''

  const email = sanitizeInput(loginForm.email, 80).toLowerCase()
  if (!email || !isValidEmail(email)) {
    authError.value = 'Enter a valid email address first.'
    return
  }

  authPendingAction.value = 'reset'
  try {
    const result = await resetPassword(email)
    if (result.success) {
      authSuccess.value = 'Password reset instructions have been sent to your email.'
    } else {
      authError.value = result.error
    }
  } finally {
    authPendingAction.value = ''
  }
}

async function logout() {
  await logoutUser()
  state.currentUser = null
  state.users = []
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
  registerForm.verificationCode = ''
  registrationChallengeId.value = ''
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

function openResource(resourceId) {
  if (!resources.some((resource) => resource.id === resourceId)) return
  resourceReturnPage.value = state.page === 'dashboard' ? 'dashboard' : 'resources'
  selectedResourceId.value = resourceId
  state.page = 'resource-detail'
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function closeResource() {
  state.page = resourceReturnPage.value
  selectedResourceId.value = ''
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

async function createBooking() {
  if (bookingSubmitting.value) return
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
  const selectedDay = new Date(`${bookingForm.date}T12:00:00`).getDay()
  if (selectedDay === 0 || selectedDay === 6 || bookingForm.time < '09:00' || bookingForm.time > '17:30') {
    bookingError.value = 'Sessions are available Monday to Friday from 9:00 AM to 5:30 PM.'
    return
  }

  const conflict = state.bookings.some(
    (booking) =>
      booking.date === bookingForm.date &&
      booking.time === bookingForm.time &&
      booking.status !== 'Cancelled',
  )
  if (conflict) {
    bookingError.value = 'That time is already in your calendar. Please choose another slot.'
    return
  }

  bookingSubmitting.value = true
  try {
    const serverValidation = await checkBookingOnServer({
      service: bookingForm.service,
      date: bookingForm.date,
      time: bookingForm.time,
    })
    if (!serverValidation.success && !serverValidation.unavailable) {
      bookingError.value = serverValidation.error || 'This booking could not be validated.'
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
      bookingForm.date = ''
      bookingForm.time = ''
      bookingForm.notes = ''
      const bookingsResult = await fetchUserBookings(state.currentUser.uid)
      if (bookingsResult.success) state.bookings = bookingsResult.bookings
    } else {
      bookingError.value = result.error
    }
  } finally {
    bookingSubmitting.value = false
  }
}

function selectBookingSlot(slot) {
  bookingForm.date = slot.date
  if (slot.time) bookingForm.time = slot.time
  bookingError.value = ''
  bookingSuccess.value = ''
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

function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows]
    .map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportAdminData(type) {
  if (type === 'users') {
    downloadCsv(
      'mindspace-users.csv',
      ['Name', 'Email', 'Role', 'Created'],
      state.users.map((user) => [user.name, user.email, user.role, user.createdAt]),
    )
    return
  }

  downloadCsv(
    'mindspace-bookings.csv',
    ['Name', 'Email', 'Service', 'Date', 'Time', 'Status'],
    state.bookings.map((booking) => [
      booking.name,
      booking.email,
      booking.service,
      booking.date,
      booking.time,
      booking.status,
    ]),
  )
}

async function emailAdminSummary() {
  adminEmailError.value = ''
  adminEmailSuccess.value = ''
  if (!isAdmin.value) {
    adminEmailError.value = 'Administrator access is required.'
    return
  }

  adminEmailSending.value = true
  const summaryCsv = [
    ['Metric', 'Value'],
    ['Total users', dashboardStats.totalUsers],
    ['Young users', dashboardStats.youngUsers],
    ['Administrators', dashboardStats.admins],
    ['Bookings', dashboardStats.bookings],
    ['Ratings', dashboardStats.ratings],
    ['Generated', new Date().toISOString()],
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const result = await sendEmailWithAttachment({
    subject: 'MindSpace Youth activity summary',
    text: 'Your privacy-preserving MindSpace Youth activity summary is attached.',
    attachment: {
      filename: 'mindspace-summary.csv',
      content: encodeBase64(summaryCsv),
    },
  })

  adminEmailSending.value = false
  if (result.success) {
    adminEmailSuccess.value = 'Summary email sent to your verified administrator email address.'
  } else {
    adminEmailError.value = result.error
  }
}

onMounted(() => {
  restoreBookingDraft()
  loadApp()
})
onUnmounted(() => {
  if (authUnsubscribe) authUnsubscribe()
})
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div v-if="state.loading" class="loading-screen">
      <p role="status">Loading MindSpace Youth…</p>
    </div>

    <template v-else>
      <AppHeader
        :pages="visiblePages"
        :current-page="state.page"
        :current-user="state.currentUser"
        @navigate="setPage"
        @logout="logout"
      />
      <OnlineStatus />

      <main id="main-content" tabindex="-1">
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
          @open-resource="openResource"
        />

        <ResourceDetailView
          v-else-if="state.page === 'resource-detail' && selectedResource"
          :resource="selectedResource"
          :saved="state.savedResourceIds.includes(selectedResource.id)"
          @back="closeResource"
          @save="saveResource"
        />

        <SupportMapView v-else-if="state.page === 'find-support'" />

        <SupportView
          v-else-if="state.page === 'support'"
          :services="supportServices"
          :booking-form="bookingForm"
          :bookings="userBookings"
          :min-date="minBookingDate"
          :error="bookingError"
          :success="bookingSuccess"
          :submitting="bookingSubmitting"
          @create-booking="createBooking"
          @select-slot="selectBookingSlot"
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
          :verification-required="authNeedsVerification"
          :registration-code-sent="Boolean(registrationChallengeId)"
          :pending-action="authPendingAction"
          @set-mode="switchAuthMode"
          @login="login"
          @request-registration-code="requestRegistrationCode"
          @complete-registration="completeRegistration"
          @cancel-registration="cancelRegistrationVerification"
          @reset-password="requestPasswordReset"
          @resend-verification="resendVerification"
        />

        <UserDashboardView
          v-else-if="state.page === 'dashboard' && isYoungUser"
          :current-user="state.currentUser"
          :user-bookings="userBookings"
          :saved-resources="savedResources"
          :average-rating="averageRating"
          @save-resource="saveResource"
          @browse-resources="setPage('resources')"
          @open-resource="openResource"
        />

        <AdminDashboardView
          v-else-if="state.page === 'admin' && isAdmin"
          :stats="dashboardStats"
          :bookings="state.bookings"
          :users="state.users"
          :ratings="state.ratings"
          :email-error="adminEmailError"
          :email-success="adminEmailSuccess"
          :email-sending="adminEmailSending"
          @export-data="exportAdminData"
          @email-summary="emailAdminSummary"
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
  color: var(--color-primary);
  font-size: 1.2rem;
  font-weight: 700;
}
</style>
