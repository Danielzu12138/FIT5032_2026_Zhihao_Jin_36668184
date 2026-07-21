<script setup>
import RatingForm from '../components/RatingForm.vue'

defineProps({
  services: {
    type: Array,
    required: true
  },
  ratingForm: {
    type: Object,
    required: true
  },
  ratings: {
    type: Array,
    required: true
  },
  averageRating: {
    type: String,
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

defineEmits(['submitRating'])
</script>

<template>
  <section class="content-panel two-column">
    <div>
      <p class="eyebrow">Aggregated rating</p>
      <h1>Reviews & Ratings</h1>
      <div class="rating-summary">
        <strong>{{ averageRating }}</strong>
        <span>{{ ratings.length }} total reviews</span>
      </div>

      <div class="review-list">
        <article v-for="(rating, index) in ratings" :key="index">
          <strong>{{ rating.service }} - {{ rating.score }}/5</strong>
          <p>{{ rating.comment || 'No written comment.' }}</p>
          <small>By {{ rating.user }}</small>
        </article>
      </div>
    </div>

    <RatingForm
      :services="services"
      :form="ratingForm"
      :error="error"
      :success="success"
      @submit="$emit('submitRating')"
    />
  </section>
</template>
