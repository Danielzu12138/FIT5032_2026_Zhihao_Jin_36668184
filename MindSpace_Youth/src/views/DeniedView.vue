<script setup>
defineEmits(['navigate'])
</script>

<template>
  <section class="content-panel">
    <p class="eyebrow">Access control</p>
    <h1>Access denied</h1>
    <p>This page is protected by role-based authentication.</p>
    <button type="button" @click="$emit('navigate', 'home')">Return home</button>
  </section>
</template>
