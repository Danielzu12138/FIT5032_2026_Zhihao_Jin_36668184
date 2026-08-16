<script setup>
defineProps({
  pages: {
    type: Array,
    required: true
  },
  currentPage: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

defineEmits(['navigate', 'logout'])
</script>

<template>
  <header class="site-header">
    <button class="brand" type="button" aria-label="Go to home" @click="$emit('navigate', 'home')">
      <span class="brand-mark">M</span>
      <span>
        <strong>MindSpace Youth</strong>
        <small>Youth mental health support</small>
      </span>
    </button>

    <nav aria-label="Main navigation">
      <button
        v-for="page in pages"
        :key="page.id"
        type="button"
        :class="{ active: currentPage === page.id }"
        :aria-current="currentPage === page.id ? 'page' : undefined"
        @click="$emit('navigate', page.id)"
      >
        {{ page.label }}
      </button>
    </nav>

    <button v-if="currentUser" class="outline-button" type="button" @click="$emit('logout')">
      Logout
    </button>
    <button v-else class="outline-button" type="button" @click="$emit('navigate', 'account')">
      Login
    </button>
  </header>
</template>
