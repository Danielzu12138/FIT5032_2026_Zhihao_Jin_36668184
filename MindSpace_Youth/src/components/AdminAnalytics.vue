<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
  ratings: {
    type: Array,
    required: true,
  },
})

const ratingCanvas = ref(null)
const bookingCanvas = ref(null)
let ratingChart = null
let bookingChart = null

function groupedAverageRatings() {
  const groups = new Map()
  props.ratings.forEach((rating) => {
    const current = groups.get(rating.service) || { total: 0, count: 0 }
    current.total += Number(rating.score) || 0
    current.count += 1
    groups.set(rating.service, current)
  })

  return {
    labels: [...groups.keys()],
    values: [...groups.values()].map((group) => Number((group.total / group.count).toFixed(2))),
  }
}

function groupedBookingStatuses() {
  const groups = new Map()
  props.bookings.forEach((booking) => {
    const status = booking.status || 'Pending'
    groups.set(status, (groups.get(status) || 0) + 1)
  })
  return { labels: [...groups.keys()], values: [...groups.values()] }
}

function renderCharts() {
  if (!ratingCanvas.value || !bookingCanvas.value) return
  const ratings = groupedAverageRatings()
  const bookings = groupedBookingStatuses()

  ratingChart?.destroy()
  bookingChart?.destroy()

  ratingChart = new Chart(ratingCanvas.value, {
    type: 'bar',
    data: {
      labels: ratings.labels.length ? ratings.labels : ['No ratings'],
      datasets: [
        {
          label: 'Average rating',
          data: ratings.values.length ? ratings.values : [0],
          backgroundColor: '#665d86',
          borderColor: '#4f4869',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } },
    },
  })

  bookingChart = new Chart(bookingCanvas.value, {
    type: 'doughnut',
    data: {
      labels: bookings.labels.length ? bookings.labels : ['No bookings'],
      datasets: [
        {
          label: 'Bookings',
          data: bookings.values.length ? bookings.values : [1],
          backgroundColor: bookings.values.length
            ? ['#285f58', '#cf6f59', '#665d86', '#2e6b51']
            : ['#d8e0dc'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  })
}

onMounted(() => nextTick(renderCharts))
watch([() => props.bookings, () => props.ratings], () => nextTick(renderCharts), { deep: true })
onBeforeUnmount(() => {
  ratingChart?.destroy()
  bookingChart?.destroy()
})
</script>

<template>
  <section class="analytics-section" aria-labelledby="analytics-title">
    <div class="subsection-heading">
      <div>
        <p class="eyebrow">Firestore analytics</p>
        <h2 id="analytics-title">Service activity</h2>
      </div>
    </div>
    <div class="analytics-grid">
      <figure>
        <figcaption>Average rating by service</figcaption>
        <div class="chart-frame">
          <canvas
            ref="ratingCanvas"
            role="img"
            aria-label="Bar chart of average ratings grouped by support service"
          ></canvas>
        </div>
      </figure>
      <figure>
        <figcaption>Bookings by status</figcaption>
        <div class="chart-frame">
          <canvas
            ref="bookingCanvas"
            role="img"
            aria-label="Doughnut chart of booking totals grouped by status"
          ></canvas>
        </div>
      </figure>
    </div>
  </section>
</template>
