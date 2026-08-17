<script setup>
import { computed, ref, watch } from 'vue'

const showResetForm = ref(false)

const props = defineProps({
  authMode: {
    type: String,
    required: true,
  },
  loginForm: {
    type: Object,
    required: true,
  },
  registerForm: {
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
  verificationRequired: {
    type: Boolean,
    default: false,
  },
  pendingAction: {
    type: String,
    default: '',
  },
})

const pendingMessage = computed(() => {
  const messages = {
    login: 'Signing you in securely...',
    register: 'Creating your account and sending the verification email...',
    reset: 'Sending password reset instructions...',
    verification: 'Sending a new verification email...',
  }
  return messages[props.pendingAction] || ''
})

defineEmits(['setMode', 'login', 'register', 'resetPassword', 'resendVerification'])

watch(
  () => props.authMode,
  () => {
    showResetForm.value = false
  },
)
</script>

<template>
  <section class="content-panel account-layout">
    <div>
      <p class="eyebrow">Authentication</p>
      <h1>Login or register</h1>
      <p>
        Create an account to book support sessions, save resources, and share your feedback. Already
        registered? Log in below.
      </p>
    </div>

    <div class="tabs" role="tablist" aria-label="Authentication mode">
      <button
        :class="{ active: authMode === 'login' }"
        type="button"
        role="tab"
        :aria-selected="authMode === 'login'"
        :disabled="Boolean(pendingAction)"
        @click="$emit('setMode', 'login')"
      >
        Login
      </button>
      <button
        :class="{ active: authMode === 'register' }"
        type="button"
        role="tab"
        :aria-selected="authMode === 'register'"
        :disabled="Boolean(pendingAction)"
        @click="$emit('setMode', 'register')"
      >
        Register
      </button>
    </div>

    <form
      v-if="authMode === 'login' && showResetForm"
      class="form-card"
      :aria-busy="Boolean(pendingAction)"
      @submit.prevent="$emit('resetPassword')"
    >
      <h2>Reset your password</h2>
      <p>Enter your account email and we will send a password reset link.</p>
      <label for="reset-email">
        Email
        <input
          id="reset-email"
          v-model="loginForm.email"
          type="email"
          autocomplete="email"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <p v-if="pendingMessage" class="pending-status" role="status">{{ pendingMessage }}</p>
      <button type="submit" :disabled="Boolean(pendingAction)">
        <span class="button-label">
          <span v-if="pendingAction === 'reset'" class="button-spinner" aria-hidden="true"></span>
          {{ pendingAction === 'reset' ? 'Sending reset link...' : 'Send reset email' }}
        </span>
      </button>
      <button
        class="secondary"
        type="button"
        :disabled="Boolean(pendingAction)"
        @click="showResetForm = false"
      >
        Back to login
      </button>
    </form>

    <form
      v-else-if="authMode === 'login'"
      class="form-card"
      :aria-busy="Boolean(pendingAction)"
      @submit.prevent="$emit('login')"
    >
      <label for="login-email">
        Email
        <input
          id="login-email"
          v-model="loginForm.email"
          type="email"
          autocomplete="email"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <label for="login-password">
        Password
        <input
          id="login-password"
          v-model="loginForm.password"
          type="password"
          autocomplete="current-password"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <p v-if="pendingMessage" class="pending-status" role="status">{{ pendingMessage }}</p>
      <button type="submit" :disabled="Boolean(pendingAction)">
        <span class="button-label">
          <span v-if="pendingAction === 'login'" class="button-spinner" aria-hidden="true"></span>
          {{ pendingAction === 'login' ? 'Signing in...' : 'Login' }}
        </span>
      </button>
      <button
        class="secondary"
        type="button"
        :disabled="Boolean(pendingAction)"
        @click="showResetForm = true"
      >
        Forgot password?
      </button>
      <button
        v-if="verificationRequired"
        class="secondary"
        type="button"
        :disabled="Boolean(pendingAction)"
        @click="$emit('resendVerification')"
      >
        <span class="button-label">
          <span
            v-if="pendingAction === 'verification'"
            class="button-spinner dark"
            aria-hidden="true"
          ></span>
          {{ pendingAction === 'verification' ? 'Sending verification...' : 'Resend verification email' }}
        </span>
      </button>
    </form>

    <form
      v-else
      class="form-card"
      :aria-busy="Boolean(pendingAction)"
      @submit.prevent="$emit('register')"
    >
      <label for="register-name">
        Full name
        <input
          id="register-name"
          v-model="registerForm.name"
          type="text"
          maxlength="60"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <label for="register-email">
        Email
        <input
          id="register-email"
          v-model="registerForm.email"
          type="email"
          autocomplete="email"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <label for="register-password">
        Password
        <input
          id="register-password"
          v-model="registerForm.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <label for="register-confirm-password">
        Confirm password
        <input
          id="register-confirm-password"
          v-model="registerForm.confirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          :disabled="Boolean(pendingAction)"
          required
        />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <p v-if="pendingMessage" class="pending-status" role="status">{{ pendingMessage }}</p>
      <button type="submit" :disabled="Boolean(pendingAction)">
        <span class="button-label">
          <span v-if="pendingAction === 'register'" class="button-spinner" aria-hidden="true"></span>
          {{ pendingAction === 'register' ? 'Creating account...' : 'Create account' }}
        </span>
      </button>
    </form>
  </section>
</template>
