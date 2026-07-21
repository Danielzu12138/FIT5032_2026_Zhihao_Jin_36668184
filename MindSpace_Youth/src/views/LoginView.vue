<script setup>
defineProps({
  authMode: {
    type: String,
    required: true
  },
  loginForm: {
    type: Object,
    required: true
  },
  registerForm: {
    type: Object,
    required: true
  },
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  }
})

defineEmits(['setMode', 'login', 'register'])
</script>

<template>
  <section class="content-panel account-layout">
    <div>
      <p class="eyebrow">Authentication</p>
      <h1>Login or register</h1>
      <p>Demo young user: user@mindspace.test / Password123</p>
      <p>Demo admin: admin@mindspace.test / Admin12345</p>
    </div>

    <div class="tabs" role="tablist" aria-label="Authentication mode">
      <button :class="{ active: authMode === 'login' }" type="button" @click="$emit('setMode', 'login')">
        Login
      </button>
      <button :class="{ active: authMode === 'register' }" type="button" @click="$emit('setMode', 'register')">
        Register
      </button>
    </div>

    <form v-if="authMode === 'login'" class="form-card" @submit.prevent="$emit('login')">
      <label>
        Email
        <input v-model="loginForm.email" type="email" autocomplete="email" />
      </label>
      <label>
        Password
        <input v-model="loginForm.password" type="password" autocomplete="current-password" />
      </label>
      <p v-if="error" class="message error">{{ error }}</p>
      <p v-if="success" class="message success">{{ success }}</p>
      <button type="submit">Login</button>
    </form>

    <form v-else class="form-card" @submit.prevent="$emit('register')">
      <label>
        Full name
        <input v-model="registerForm.name" type="text" maxlength="60" />
      </label>
      <label>
        Email
        <input v-model="registerForm.email" type="email" autocomplete="email" />
      </label>
      <label>
        Password
        <input v-model="registerForm.password" type="password" autocomplete="new-password" />
      </label>
      <label>
        Confirm password
        <input v-model="registerForm.confirmPassword" type="password" autocomplete="new-password" />
      </label>
      <label>
        Role
        <select v-model="registerForm.role">
          <option value="young_user">Young user</option>
          <option value="admin">Admin staff</option>
        </select>
      </label>
      <p v-if="error" class="message error">{{ error }}</p>
      <p v-if="success" class="message success">{{ success }}</p>
      <button type="submit">Create account</button>
    </form>
  </section>
</template>
