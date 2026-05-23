<template>
  <div ref="containerRef" class="grid-background" aria-hidden="true" />
</template>

<script setup>
import { createNoise3D } from 'simplex-noise'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const SCALE = 200
const LENGTH = 5
const SPACING = 15

const containerRef = ref(null)
const noise3d = createNoise3D()
const existingPoints = new Set()
const points = []

let width = 0
let height = 0
let app
let dotTexture
let particleContainer
let removeResizeListener = null

function getForceOnPoint(x, y, z) {
  return (noise3d(x / SCALE, y / SCALE, z) - 0.5) * 2 * Math.PI
}

async function createDotTexture() {
  const { Graphics } = await import('pixi.js')
  const graphics = new Graphics().circle(0, 0, 1).fill(0xCCCCCC)
  return app.renderer.generateTexture(graphics)
}

async function addPoints() {
  const { Particle } = await import('pixi.js')

  for (let x = -SPACING / 2; x < width + SPACING; x += SPACING) {
    for (let y = -SPACING / 2; y < height + SPACING; y += SPACING) {
      const id = `${x}-${y}`
      if (existingPoints.has(id))
        continue
      existingPoints.add(id)

      const particle = new Particle(dotTexture)
      particle.anchorX = 0.5
      particle.anchorY = 0.5
      particleContainer.addParticle(particle)

      points.push({
        x,
        y,
        opacity: Math.random() * 0.5 + 0.5,
        particle,
      })
    }
  }
}

async function setup() {
  if (!containerRef.value)
    return

  const { Application, ParticleContainer } = await import('pixi.js')

  width = window.innerWidth
  height = window.innerHeight

  app = new Application()
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio,
    eventMode: 'none',
    autoDensity: true,
  })

  containerRef.value.appendChild(app.canvas)

  await nextTick()
  app.renderer.resize(width, height)

  particleContainer = new ParticleContainer({
    dynamicProperties: { position: true, alpha: true },
  })
  app.stage.addChild(particleContainer)

  dotTexture = await createDotTexture()
  await addPoints()

  app.ticker.add(() => {
    const t = Date.now() / 10000

    for (const point of points) {
      const { x, y, opacity, particle } = point
      const rad = getForceOnPoint(x, y, t)
      const len = (noise3d(x / SCALE, y / SCALE, t * 2) + 0.5) * LENGTH

      particle.x = x + Math.cos(rad) * len
      particle.y = y + Math.sin(rad) * len
      particle.alpha = (Math.abs(Math.cos(rad)) * 0.8 + 0.2) * opacity
    }
  })

  const handleResize = async () => {
    width = window.innerWidth
    height = window.innerHeight
    app.renderer.resize(width, height)
    await addPoints()
  }

  window.addEventListener('resize', handleResize)
  removeResizeListener = () => window.removeEventListener('resize', handleResize)
}

onMounted(async () => {
  try {
    await setup()
  }
  catch (error) {
    console.error('Failed to initialize background dots:', error)
  }
})

onBeforeUnmount(() => {
  removeResizeListener?.()

  try {
    app?.destroy(true, { children: true, texture: true, textureSource: true })
  }
  catch (error) {
    console.error(error)
  }
})
</script>
