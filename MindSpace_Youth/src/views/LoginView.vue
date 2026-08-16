<script setup>
import { ref, watch } from 'vue'

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
      <p class="eyebrow">🔐 Authentication</p>
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
        @click="$emit('setMode', 'login')"
      >
        Login
      </button>
      <button
        :class="{ active: authMode === 'register' }"
        type="button"
        role="tab"
        :aria-selected="authMode === 'register'"
        @click="$emit('setMode', 'register')"
      >
        Register
      </button>
    </div>

    <form
      v-if="authMode === 'login' && showResetForm"
      class="form-card"
      @submit.prevent="$emit('resetPassword')"
    >
      <h2>Reset your password</h2>
      <p>Enter your account email and we will send a password reset link.</p>
      <label for="reset-email">
        Email
        <input id="reset-email" v-model="loginForm.email" type="email" autocomplete="email" required />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <button type="submit">Send reset email</button>
      <button class="secondary" type="button" @click="showResetForm = false">Back to login</button>
    </form>

    <form v-else-if="authMode === 'login'" class="form-card" @submit.prevent="$emit('login')">
      <label for="login-email">
        Email
        <input id="login-email" v-model="loginForm.email" type="email" autocomplete="email" required />
      </label>
      <label for="login-password">
        Password
        <input
          id="login-password"
          v-model="loginForm.password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <button type="submit">Login</button>
      <button class="secondary" type="button" @click="showResetForm = true">Forgot password?</button>
      <button
        v-if="verificationRequired"
        class="secondary"
        type="button"
        @click="$emit('resendVerification')"
      >
        Resend verification email
      </button>
    </form>

    <form v-else class="form-card" @submit.prevent="$emit('register')">
      <label for="register-name">
        Full name
        <input id="register-name" v-model="registerForm.name" type="text" maxlength="60" required />
      </label>
      <label for="register-email">
        Email
        <input
          id="register-email"
          v-model="registerForm.email"
          type="email"
          autocomplete="email"
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
          required
        />
      </label>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <p v-if="success" class="message success" role="status">{{ success }}</p>
      <button type="submit">Create account</button>
    </form>
  </section>
</template>
