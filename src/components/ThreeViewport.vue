<template>
  <div class="viewport" ref="container">
    <div v-if="loading" class="loading">正在加载 3D 场景…</div>
    <div class="tank-badge">
      <div class="badge-label">水箱液位</div>
      <div class="badge-pct">{{ tankPct }}%</div>
      <div class="badge-bar">
        <div class="badge-fill" :style="{ width: tankPct + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { initScene } from '../composables/useThreeScene.js'
import { data, physStep } from '../composables/useSimulation.js'

const container = ref(null)
const loading = ref(true)
const tankPct = computed(() => data.tank.toFixed(1))

let cleanup = null

onMounted(() => {
  cleanup = initScene(container.value, () => physStep())
  loading.value = false
})

onUnmounted(() => {
  if (cleanup) cleanup()
})
</script>

<style scoped>
.viewport {
  flex-shrink: 0;
  height: 380px;
  position: relative;
  background: #080d14;
  cursor: grab;
}
.viewport:active { cursor: grabbing; }
.viewport :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dim);
  font-size: 14px;
  pointer-events: none;
}

.tank-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(8, 20, 40, 0.82);
  border: 1px solid rgba(79, 195, 247, 0.4);
  border-radius: 6px;
  padding: 6px 12px;
  pointer-events: none;
  font-family: monospace;
  text-align: center;
  line-height: 1.5;
}
.badge-label { color: #8ab; font-size: 11px; letter-spacing: 1px; }
.badge-pct   { color: #4fc3f7; font-size: 22px; font-weight: bold; }
.badge-bar   { width: 60px; height: 5px; background: #1a2a3a; border-radius: 3px; margin-top: 3px; }
.badge-fill  { height: 100%; background: linear-gradient(90deg, #1565c0, #4fc3f7); border-radius: 3px; transition: width 0.4s; }
</style>
