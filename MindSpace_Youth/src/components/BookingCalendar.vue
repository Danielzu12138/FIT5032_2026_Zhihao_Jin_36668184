<script setup>
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['selectSlot'])

function dateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function timeValue(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function chooseTimedSlot(selection) {
  emit('selectSlot', {
    date: dateValue(selection.start),
    time: timeValue(selection.start),
  })
  selection.view.calendar.unselect()
}

function chooseDate(info) {
  emit('selectSlot', {
    date: dateValue(info.date),
    time: info.allDay ? '' : timeValue(info.date),
  })
}

const events = computed(() =>
  props.bookings
    .filter((booking) => booking.date && booking.time)
    .map((booking) => ({
      id: booking.id,
      title: `${booking.service} · ${booking.status || 'Pending'}`,
      start: `${booking.date}T${booking.time}`,
      backgroundColor: booking.status === 'Confirmed' ? '#2d7d5a' : '#8b7aa7',
      borderColor: booking.status === 'Confirmed' ? '#2d7d5a' : '#8b7aa7',
    })),
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: window.innerWidth <= 600 ? 'timeGridDay' : 'timeGridWeek',
  firstDay: 1,
  height: 'auto',
  allDaySlot: false,
  nowIndicator: true,
  selectable: true,
  selectMirror: true,
  selectConstraint: 'businessHours',
  slotDuration: '00:30:00',
  slotMinTime: '09:00:00',
  slotMaxTime: '18:00:00',
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek,dayGridMonth',
  },
  buttonText: {
    today: 'Today',
    day: 'Day',
    week: 'Week',
    month: 'Month',
  },
  events: events.value,
  select: chooseTimedSlot,
  dateClick: chooseDate,
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    meridiem: 'short',
  },
}))
</script>

<template>
  <section class="booking-calendar" aria-labelledby="booking-calendar-title">
    <div class="subsection-heading">
      <div>
        <p class="eyebrow">Availability calendar</p>
        <h2 id="booking-calendar-title">Choose a session time</h2>
      </div>
      <span class="calendar-key">30-minute slots</span>
    </div>
    <div class="calendar-frame" aria-label="Support session availability calendar">
      <FullCalendar :options="calendarOptions" />
    </div>
  </section>
</template>
