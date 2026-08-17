<script setup>
defineProps({
  resource: {
    type: Object,
    required: true,
  },
  saved: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['back', 'save'])
</script>

<template>
  <article class="resource-detail content-panel">
    <button class="secondary resource-back-button" type="button" @click="$emit('back')">
      Back
    </button>

    <header class="resource-detail-header">
      <p class="eyebrow">{{ resource.category }} · {{ resource.time }}</p>
      <h1>{{ resource.title }}</h1>
      <p class="resource-detail-summary">{{ resource.summary }}</p>
      <button
        :class="saved ? 'saved-button' : 'secondary'"
        type="button"
        @click="$emit('save', resource.id)"
      >
        {{ saved ? 'Remove from saved' : 'Save this guide' }}
      </button>
    </header>

    <figure class="resource-hero-figure">
      <img
        :src="resource.image"
        :alt="resource.imageAlt"
        width="1600"
        height="900"
      />
      <figcaption>
        Photo by
        <a :href="resource.imageCredit.url" target="_blank" rel="noopener noreferrer">
          {{ resource.imageCredit.name }}
        </a>
        on Unsplash.
      </figcaption>
    </figure>

    <div class="resource-article-body">
      <section class="resource-key-facts" aria-labelledby="key-facts-heading">
        <p class="eyebrow">At a glance</p>
        <h2 id="key-facts-heading">Key facts</h2>
        <ul>
          <li v-for="fact in resource.keyFacts" :key="fact">{{ fact }}</li>
        </ul>
      </section>

      <aside class="resource-exercise" aria-labelledby="resource-exercise-heading">
        <p class="eyebrow">Practical exercise</p>
        <h2 id="resource-exercise-heading">{{ resource.exercise.title }}</h2>
        <p>{{ resource.exercise.intro }}</p>
        <ol>
          <li v-for="step in resource.exercise.steps" :key="step">{{ step }}</li>
        </ol>
      </aside>

      <section v-for="section in resource.sections" :key="section.title">
        <h2>{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        <ul v-if="section.points">
          <li v-for="point in section.points" :key="point">{{ point }}</li>
        </ul>
      </section>

      <aside class="resource-safety-note" aria-labelledby="resource-safety-heading">
        <h2 id="resource-safety-heading">A note about support</h2>
        <p>
          This guide provides general wellbeing information and is not a diagnosis or replacement for
          professional care. If you are in immediate danger or may harm yourself or someone else, call
          emergency services. In Australia, call 000. You can also contact Lifeline on 13 11 14 for
          24-hour crisis support.
        </p>
      </aside>

      <section class="resource-sources" aria-labelledby="resource-sources-heading">
        <p class="eyebrow">Evidence and further support</p>
        <h2 id="resource-sources-heading">Further reading</h2>
        <p>
          This MindSpace Youth guide was written as an original summary informed by the following
          Australian health resources. Follow the links for more detailed clinical information.
        </p>
        <ul>
          <li v-for="source in resource.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener noreferrer">
              {{ source.title }}
            </a>
            <span> — {{ source.organisation }}</span>
          </li>
        </ul>
      </section>
    </div>
  </article>
</template>
