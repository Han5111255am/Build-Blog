<template>
  <section class="friends-page">
    <header class="friends-welcome">
      <p>{{ t('friends.welcomeApply') }}</p>
      <FriendPageTabs active="circles" />
    </header>

    <div class="friends-cloud-shell" :class="{ 'is-empty': !items.length }">
      <div v-if="loading" class="friends-loading-grid" aria-hidden="true">
        <span v-for="index in 32" :key="index" />
      </div>

      <StateBlock
        v-else-if="error"
        :eyebrow="t('common.requestFailed')"
        :title="t('friends.listErrorTitle')"
        :description="t('friends.listErrorDescription')"
        :action-label="t('common.reload')"
        @action="load"
      />

      <StateBlock
        v-else-if="!items.length"
        :eyebrow="t('common.emptyState')"
        :title="t('friends.emptyTitle')"
        :description="t('friends.emptyDescription')"
      />

      <div v-else class="friends-cloud-stage" :style="{ height: `${550 * circleScale}px` }">
        <div
          class="friends-cloud"
          aria-label="Friend links"
          :style="{ transform: `scale(${circleScale})` }"
        >
          <a
            v-for="(item, index) in circleItems"
            :key="item.id"
            class="friend-orb"
            :class="[
              item.org ? 'friend-orb-org' : '',
              item.radius > 25 ? 'friend-orb-bordered' : '',
              item.hoverScaleClass,
            ]"
            :href="item.site_url"
            target="_blank"
            rel="noopener noreferrer"
            :title="item.site_name"
            :style="{
              width: `${item.radius * 2}px`,
              height: `${item.radius * 2}px`,
              left: `${item.position.x - item.radius}px`,
              top: `${item.position.y - item.radius}px`,
              zIndex: activeOrbIds.indexOf(item.id) + 1,
            }"
            @mouseenter="bringOrbForward(item.id)"
          >
            <img
              :src="resolveAssetUrl(item.logo_url)"
              :alt="item.site_name"
              decoding="async"
              :loading="index < 18 ? undefined : 'lazy'"
              @error="handleLogoError"
            />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FriendPageTabs from '../components/FriendPageTabs.vue'
import StateBlock from '../components/StateBlock.vue'
import { fetchAllFriendLinks, resolveAssetUrl } from '../lib/api'
import { setPageTitle } from '../lib/content'
import { currentLanguage, t } from '../lib/i18n'

const loading = ref(true)
const error = ref(null)
const items = ref([])
const activeOrbIds = ref([])
const circleScale = ref(1)

const circleItems = computed(() => buildCircleItems(items.value))

async function load() {
  loading.value = true
  error.value = null

  try {
    items.value = await fetchAllFriendLinks()
  }
  catch (caughtError) {
    error.value = caughtError
    items.value = []
  }
  finally {
    loading.value = false
  }
}

function handleLogoError(event) {
  event.currentTarget.src = '/favicon-dark.svg'
}

function buildCircleItems(sourceItems) {
  return sourceItems.map((item, index) => {
    const geometry = ANTFU_SPONSOR_GEOMETRY[index] || getOverflowGeometry(index)

    return {
      ...item,
      ...geometry,
      hoverScaleClass: getHoverScaleClass(geometry.radius),
    }
  })
}

function getHoverScaleClass(radius) {
  if (radius < 10)
    return 'friend-orb-scale-200'
  if (radius < 20)
    return 'friend-orb-scale-150'
  if (radius < 50)
    return 'friend-orb-scale-125'
  return 'friend-orb-scale-110'
}

function bringOrbForward(id) {
  activeOrbIds.value = activeOrbIds.value.filter(activeId => activeId !== id)
  activeOrbIds.value.push(id)

  if (activeOrbIds.value.length > 5)
    activeOrbIds.value.shift()
}

function updateCircleScale() {
  if (typeof window === 'undefined')
    return

  circleScale.value = Math.min(2, (window.innerWidth - 80) / 500)
}

function getOverflowGeometry(index) {
  const offset = index - ANTFU_SPONSOR_GEOMETRY.length
  const radius = 10
  const column = offset % 18
  const row = Math.floor(offset / 18)

  return {
    radius,
    position: {
      x: 52 + column * 22,
      y: 52 + row * 22,
    },
    org: false,
  }
}

onMounted(() => {
  setPageTitle(t('friends.pageTitle'))
  updateCircleScale()
  window.addEventListener('resize', updateCircleScale)
  load()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined')
    window.removeEventListener('resize', updateCircleScale)
})

watch(currentLanguage, () => {
  setPageTitle(t('friends.pageTitle'))
})

const ANTFU_SPONSOR_GEOMETRY = '67.027,196.841,253.137,1;50.203,315.971,253.137,1;37.589,270.261,330.307,1;37.228,270.21,176.418,1;28.627,205.612,155.978,0;23.619,208.864,344.899,1;22.395,331.61,180.301,1;18.196,327.415,322.497,1;18.196,166.344,334.748,0;17.085,161.79,174.592,1;15.485,237.38,374.362,1;15.485,242.952,129.094,0;15.485,358.682,305.517,1;14.791,362.127,204.72,0;14.791,318.023,356.096,0;14.37,314.1,145.828,0;14.262,139.454,313.362,0;14.262,136.365,196.014,1;14.262,176.233,367.652,1;13.814,376.275,279.752,0;13.814,267.204,383.522,0;13.814,122.203,288.848,0;13.814,377.98,230.782,0;13.814,273.661,123.588,0;13.814,163.585,141.842,0;13.814,296.062,377.268,0;13.814,120.428,221.402,1;13.814,207.779,384.216,0;13.814,302.657,118.006,0;13.814,358.202,336.712,0;13.814,347.43,364.206,0;13.814,216.264,112.936,0;13.814,114.416,260.365,0;13.699,393.391,255.833,0;13.699,95.848,237.555,1;13.699,369.255,175.179,1;13.09,343.443,144.839,0;13.09,133.983,342.098,0;13.09,130.544,167.348,0;13.09,181.675,396.393,0;13.09,146.99,366.983,0;13.09,389.156,305.515,0;13.09,246.42,403.464,0;13.09,110.252,315.055,0;13.09,391.896,205.562,0;13.09,255.428,101.291,0;13.09,107.114,195.86,0;12.83,181.719,119.799,0;12.83,323.51,385.102,0;12.83,135.107,139.905,0;12.83,219.445,410.267,0;12.83,386.53,333.211,0;12.83,193.97,95.112,0;12.83,371.192,146.817,0;12.83,94.745,281.048,0;12.83,286.807,404.27,0;12.83,230.793,88.366,0;12.83,397.51,178.315,0;12.83,106.168,342.573,0;12.83,331.139,119.889,0;12.83,102.744,168.386,0;12.83,350.021,392.632,0;12.83,404.738,281.899,0;12.83,406.524,230.621,0;12.83,283.54,96.809,0;12.83,416.954,306.603,0;12.83,83.828,306.353,0;12.83,266.414,422.808,0;12.83,419.702,206.416,0;12.83,84.193,211.626,0;12.83,265.994,75.556,0;12.83,313.579,410.81,0;12.83,77.673,259.414,0;12.83,375.561,359.371,0;12.83,153.966,393.913,0;12.83,154.628,114.74,0;12.83,194.168,421.249,0;12.83,119.17,366.873,0;12.83,402.837,355.428,0;12.83,127.095,113.536,0;12.83,358.649,121.543,0;12.83,319.455,94.928,0;12.416,421.062,260.209,0;12.416,108.024,141.759,0;12.416,433.064,236.323,0;12.416,300.434,75.56,0;12.416,385.695,123.87,1;12.416,397.986,151.173,0;12.416,238.423,429.677,0;12.416,419.066,333.667,0;12.416,208.838,72.4,0;12.416,376.466,386.502,0;12.416,167.189,90.674,0;12.416,241.674,63.496,0;12.416,80.65,333.313,0;12.416,424.62,179.719,0;12.416,81.021,184.666,0;12.416,257.467,448.437,0;12.416,126.839,392.913,0;12.416,68.127,233.507,0;12.416,339.813,417.785,0;12.27,51.217,254.022,0;12.27,67.873,284.572,0;12.27,292.228,430.72,0;12.27,317.79,437.479,0;12.27,165.493,418.329,0;12.27,346.331,97.517,0;12.27,432.226,284.338,0;12.27,177.035,442.117,0;12.27,213.823,439.761,1;12.27,445.879,213.029,0;12.27,283.539,55.033,0;12.27,92.197,365.678,0;12.27,100.241,116.337,0;12.27,411.874,128.503,0;12.27,82.807,150.179,0;12.27,140.608,90.161,0;12.27,182.48,68.926,0;12.27,61.827,166.27,0;12.27,424.5,153.133,0;12.27,59.62,200.439,0;12.27,44.2,221.918,0;12.27,219.909,48.228,0;12.27,402.738,382.427,0;12.27,42.065,278.827,0;12.27,67.443,356.387,0;12.27,283.09,455.53,0;12.27,139.117,416.494,0;12.27,56.925,308.639,0;12.27,372.752,98.519,0;12.27,100.334,390.834,0;12.27,335.655,73.328,0;12.27,368.857,411.976,0;12.27,52.347,334.68,0;12.27,316.903,54.689,0;12.27,447.598,258.585,0;12.27,343.379,444.131,0;12.27,458.611,282.622,0;12.27,399.084,100.901,0;12.27,369.193,438.413,0;12.27,443.915,308.053,0;12.27,445.641,334.437,0;12.27,196.641,459.856,0;12.27,232.748,458.224,0;12.27,259.582,43.846,0;12.27,450.205,186.946,0;12.27,75.21,124.854,0;12.27,429.712,358.028,0;12.27,40.617,182.056,0;12.27,154.196,67.48,0;12.27,169.478,45.904,0;12.27,27.472,242.392,0;12.27,114.17,89.83,0;12.27,308.651,462.29,0;12.27,195.056,39.207,0;12.27,150.659,440.282,0;12.27,112.698,415.427,0;12.27,31.117,302.894,0;12.27,362.076,74.33,0;12.27,438.235,130.541,0;12.119,394.757,407.475,0;11.959,459.503,235.325,0;11.959,88.249,93.123,0;11.959,300.013,34.752,0;11.959,86.672,413.107,0;11.79,428.651,383.966,0;11.79,469.797,306.047,0;11.79,75.009,385.131,0;11.79,449.237,161.005,0;11.79,424.565,105.858,0;11.79,215.536,477.657,1;11.79,237.923,29.537,0;11.79,455.668,358.381,0;11.79,55.052,141.21,0;11.79,51.036,376.503,0;11.79,264.445,473.593,0;11.79,240.737,482.924,0;11.79,25.939,203.467,0;11.79,128.237,67.339,0;11.79,18.993,266.928,0;11.79,102.772,66.507,0;11.79,124.767,438.409,0;11.79,342.028,48.163,0;11.79,333.904,468.3,0;11.79,276.612,24.254,0;11.79,387.852,77.404,0;11.79,27.124,328.544,0;11.79,473.497,256.82,0;11.79,367.495,48.943,0;11.79,484.42,279.838,0;11.79,394.64,433.282,0;11.79,162.297,463.486,0;11.79,413.27,79.161,0;11.79,471.838,212.838,0;11.79,476.152,187.727,0;11.76,420.527,408.083,0'
  .split(';')
  .map((entry) => {
    const [radius, x, y, org] = entry.split(',').map(Number)

    return {
      radius,
      position: { x, y },
      org: Boolean(org),
    }
  })
</script>

<style scoped>
.friends-page {
  width: min(100%, 1080px);
  margin: 0 auto;
}

.friends-welcome {
  padding: clamp(2rem, 5vh, 3.4rem) 1rem clamp(1.45rem, 4vh, 2.5rem);
  text-align: center;
}

.friends-welcome p {
  margin: 0;
  color: var(--c-text);
  font-size: clamp(1.08rem, 2.2vw, 1.35rem);
  font-weight: 700;
  line-height: 1.45;
}

.friends-cloud-shell {
  position: relative;
  margin: 0 auto;
}

.friends-cloud-stage {
  display: flex;
  width: 100%;
  justify-content: center;
}

.friends-cloud {
  position: relative;
  flex-shrink: 0;
  width: 500px;
  height: 500px;
  margin: auto;
  transform-origin: center center;
}

.friend-orb {
  position: absolute;
  display: block;
  overflow: hidden;
  border-radius: 50%;
  background: var(--c-bg-elevated);
  color: inherit;
  text-decoration: none;
  transition: all 500ms ease;
}

.friend-orb img {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--c-bg-elevated);
  object-fit: cover;
}

.friend-orb-bordered {
  border: 1px solid var(--c-border);
}

.friend-orb:hover,
.friend-orb:focus-visible {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.16), 0 4px 6px -4px rgba(0, 0, 0, 0.16);
  outline: none;
}

.friend-orb-org:hover,
.friend-orb-org:focus-visible {
  border-radius: 50%;
}

.friend-orb-scale-110:hover,
.friend-orb-scale-110:focus-visible {
  transform: scale(1.1);
}

.friend-orb-scale-125:hover,
.friend-orb-scale-125:focus-visible {
  transform: scale(1.25);
}

.friend-orb-scale-150:hover,
.friend-orb-scale-150:focus-visible {
  transform: scale(1.5);
}

.friend-orb-scale-200:hover,
.friend-orb-scale-200:focus-visible {
  transform: scale(2);
}

.friends-loading-grid {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
  width: min(100%, 820px);
  min-height: 520px;
  margin: 0 auto;
  gap: 0.7rem;
}

.friends-loading-grid span {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  background: rgba(255, 255, 255, 0.06);
  animation: friend-loading-pulse 1.2s ease-in-out infinite;
}

@keyframes friend-loading-pulse {
  50% {
    opacity: 0.38;
    transform: scale(0.92);
  }
}
</style>
