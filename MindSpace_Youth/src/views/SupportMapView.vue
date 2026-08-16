<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const supportCentres = [
  {
    id: 'melbourne',
    name: 'Youth Support Hub Melbourne',
    area: 'Melbourne CBD',
    phone: '1800 650 890',
    lat: -37.8136,
    lng: 144.9631,
  },
  {
    id: 'bentleigh',
    name: 'Youth Support Hub Bentleigh',
    area: 'Bentleigh',
    phone: '1800 650 890',
    lat: -37.9181,
    lng: 145.036,
  },
  {
    id: 'glen-waverley',
    name: 'Youth Support Hub Glen Waverley',
    area: 'Glen Waverley',
    phone: '1800 650 890',
    lat: -37.8797,
    lng: 145.1633,
  },
  {
    id: 'footscray',
    name: 'Youth Support Hub Footscray',
    area: 'Footscray',
    phone: '1800 650 890',
    lat: -37.801,
    lng: 144.899,
  },
]

const mapElement = ref(null)
const searchQuery = ref('')
const originId = ref(supportCentres[0].id)
const destinationId = ref(supportCentres[1].id)
const tripInfo = ref(null)
const status = ref('Search the directory or compare a trip between two support hubs.')

let map = null
let tripLayer = null
const centreLayers = new Map()

const filteredCentres = computed(() => {
  const term = searchQuery.value.trim().toLocaleLowerCase()
  if (!term) return supportCentres
  return supportCentres.filter((centre) =>
    `${centre.name} ${centre.area}`.toLocaleLowerCase().includes(term),
  )
})

function centreById(id) {
  return supportCentres.find((centre) => centre.id === id)
}

function focusCentre(centre) {
  destinationId.value = centre.id
  map.setView([centre.lat, centre.lng], 14)
  centreLayers.get(centre.id)?.openPopup()
  status.value = `${centre.name} selected as the destination.`
}

function distanceInKilometres(start, end) {
  const earthRadius = 6371
  const latitudeChange = ((end.lat - start.lat) * Math.PI) / 180
  const longitudeChange = ((end.lng - start.lng) * Math.PI) / 180
  const startLatitude = (start.lat * Math.PI) / 180
  const endLatitude = (end.lat * Math.PI) / 180
  const value =
    Math.sin(latitudeChange / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeChange / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function planTrip() {
  const origin = centreById(originId.value)
  const destination = centreById(destinationId.value)

  if (!origin || !destination || origin.id === destination.id) {
    tripInfo.value = null
    status.value = 'Choose two different support hubs to compare a trip.'
    return
  }

  const distance = distanceInKilometres(origin, destination)
  const estimatedMinutes = Math.max(5, Math.round((distance / 35) * 60))

  if (tripLayer) tripLayer.remove()
  tripLayer = L.polyline(
    [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    { color: '#1a5c6e', weight: 5, opacity: 0.85, dashArray: '10 8' },
  ).addTo(map)
  map.fitBounds(tripLayer.getBounds(), { padding: [40, 40] })

  tripInfo.value = {
    origin: origin.name,
    destination: destination.name,
    distance: `${distance.toFixed(1)} km`,
    duration: `${estimatedMinutes} minutes`,
  }
  status.value = `Trip comparison ready from ${origin.area} to ${destination.area}.`
}

onMounted(() => {
  map = L.map(mapElement.value, { scrollWheelZoom: false }).setView([-37.84, 144.99], 10)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  supportCentres.forEach((centre) => {
    const layer = L.circleMarker([centre.lat, centre.lng], {
      radius: 10,
      color: '#ffffff',
      fillColor: '#1a5c6e',
      fillOpacity: 1,
      weight: 3,
    })
      .addTo(map)
      .bindPopup(`<strong>${centre.name}</strong><br>${centre.area}<br>${centre.phone}`)
    centreLayers.set(centre.id, layer)
  })
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>

<template>
  <section class="content-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Find support</p>
        <h1>Explore youth support locations</h1>
        <p>Search the local directory and compare travel information between support hubs.</p>
      </div>
    </div>

    <div class="map-workspace">
      <aside class="map-controls" aria-label="Support location search and trip controls">
        <label for="support-centre-search">
          Search support locations
          <input
            id="support-centre-search"
            v-model="searchQuery"
            type="search"
            placeholder="Name or suburb"
          />
        </label>

        <ul class="centre-results" aria-label="Matching support locations">
          <li v-for="centre in filteredCentres" :key="centre.id">
            <button type="button" @click="focusCentre(centre)">
              <strong>{{ centre.name }}</strong>
              <span>{{ centre.area }} · {{ centre.phone }}</span>
            </button>
          </li>
          <li v-if="!filteredCentres.length" class="empty-result">No matching locations.</li>
        </ul>

        <fieldset>
          <legend>Compare a trip</legend>
          <label for="trip-origin">
            From
            <select id="trip-origin" v-model="originId">
              <option v-for="centre in supportCentres" :key="centre.id" :value="centre.id">
                {{ centre.area }}
              </option>
            </select>
          </label>
          <label for="trip-destination">
            To
            <select id="trip-destination" v-model="destinationId">
              <option v-for="centre in supportCentres" :key="centre.id" :value="centre.id">
                {{ centre.area }}
              </option>
            </select>
          </label>
        </fieldset>

        <button type="button" @click="planTrip">Compare trip</button>

        <dl v-if="tripInfo" class="route-summary" aria-label="Trip information">
          <div><dt>From</dt><dd>{{ tripInfo.origin }}</dd></div>
          <div><dt>To</dt><dd>{{ tripInfo.destination }}</dd></div>
          <div><dt>Direct distance</dt><dd>{{ tripInfo.distance }}</dd></div>
          <div><dt>Estimated drive</dt><dd>{{ tripInfo.duration }}</dd></div>
        </dl>

        <p class="map-status" role="status" aria-live="polite">{{ status }}</p>
      </aside>

      <div
        ref="mapElement"
        class="support-map"
        role="application"
        aria-label="Interactive map showing youth support locations and a selected trip"
      ></div>
    </div>

    <p class="map-disclaimer">
      Travel information is an approximate comparison, not turn-by-turn navigation. Confirm service
      details before travelling.
    </p>
  </section>
</template>
