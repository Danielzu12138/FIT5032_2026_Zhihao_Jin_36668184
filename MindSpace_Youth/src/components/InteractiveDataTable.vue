<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  caption: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  emptyMessage: {
    type: String,
    default: 'No matching records.',
  },
  pageSize: {
    type: Number,
    default: 10,
  },
})

const globalQuery = ref('')
const columnQueries = reactive({})
const sortKey = ref('')
const sortDirection = ref('asc')
const currentPage = ref(1)

const headingId = computed(() =>
  `table-${props.caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
)

watch(
  () => props.columns,
  (columns) => {
    columns.forEach((column) => {
      if (!(column.key in columnQueries)) columnQueries[column.key] = ''
    })
  },
  { immediate: true },
)

function normalize(value) {
  return String(value ?? '').toLocaleLowerCase()
}

const filteredRows = computed(() => {
  const globalTerm = normalize(globalQuery.value).trim()

  return props.rows.filter((row) => {
    const matchesGlobal =
      !globalTerm || props.columns.some((column) => normalize(row[column.key]).includes(globalTerm))

    const matchesColumns = props.columns.every((column) => {
      const term = normalize(columnQueries[column.key]).trim()
      return !term || normalize(row[column.key]).includes(term)
    })

    return matchesGlobal && matchesColumns
  })
})

const sortedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value

  return [...filteredRows.value].sort((left, right) => {
    const leftValue = left[sortKey.value] ?? ''
    const rightValue = right[sortKey.value] ?? ''
    const leftNumber = Number(leftValue)
    const rightNumber = Number(rightValue)

    let comparison
    if (String(leftValue).trim() && String(rightValue).trim() && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
      comparison = leftNumber - rightNumber
    } else {
      comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)))
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})
const resultSummary = computed(() => {
  if (!sortedRows.value.length) return '0 records'
  const start = (currentPage.value - 1) * props.pageSize + 1
  const end = Math.min(currentPage.value * props.pageSize, sortedRows.value.length)
  return `${start}-${end} of ${sortedRows.value.length} records`
})

watch(globalQuery, () => {
  currentPage.value = 1
})
watch(columnQueries, () => {
  currentPage.value = 1
}, { deep: true })
watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  },
)
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

function ariaSort(key) {
  if (sortKey.value !== key) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

function sortSymbol(key) {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <section class="interactive-table" :aria-labelledby="headingId">
    <div class="table-toolbar">
      <div>
        <h2 :id="headingId">{{ caption }}</h2>
        <p aria-live="polite">{{ resultSummary }}</p>
      </div>
      <label class="table-global-search">
        Search all columns
        <input v-model="globalQuery" type="search" :placeholder="`Search ${caption.toLowerCase()}`" />
      </label>
    </div>

    <div class="column-search-grid" aria-label="Individual column searches">
      <label v-for="column in columns" :key="column.key">
        {{ column.label }}
        <input
          v-model="columnQueries[column.key]"
          type="search"
          :placeholder="`Search ${column.label.toLowerCase()}`"
        />
      </label>
    </div>

    <div class="responsive-table">
      <table>
        <caption class="visually-hidden">
          {{ caption }}. Sortable and searchable data table.
        </caption>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :aria-sort="ariaSort(column.key)">
              <button
                class="sort-button"
                type="button"
                :aria-label="`Sort by ${column.label}`"
                @click="toggleSort(column.key)"
              >
                <span>{{ column.label }}</span>
                <span aria-hidden="true">{{ sortSymbol(column.key) }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in pageRows" :key="row.id || row.uid || index">
            <td v-for="column in columns" :key="column.key">
              {{ row[column.key] || '—' }}
            </td>
          </tr>
          <tr v-if="!pageRows.length">
            <td :colspan="columns.length">{{ emptyMessage }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="table-pagination" :aria-label="`${caption} pagination`">
      <button
        class="secondary"
        type="button"
        :disabled="currentPage === 1"
        aria-label="Previous page"
        @click="currentPage -= 1"
      >
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="secondary"
        type="button"
        :disabled="currentPage === totalPages"
        aria-label="Next page"
        @click="currentPage += 1"
      >
        Next
      </button>
    </nav>
  </section>
</template>
