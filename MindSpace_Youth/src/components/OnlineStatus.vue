<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

function updateStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateStatus)
  window.removeEventListener('offline', updateStatus)
})
</script>

<template>
  <div
    class="connection-status"
    :class="isOnline ? 'online' : 'offline'"
    role="status"
    aria-live="polite"
  >
    <span class="status-dot" aria-hidden="true"></span>
    <span v-if="isOnline">Online</span>
    <span v-else>Offline — your booking draft remains available on this device.</span>
  </div>
</template>
