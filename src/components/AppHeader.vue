<template>
  <header>
    <h1>冷却循环系统监控</h1>
    <span class="badge sim">模拟模式</span>
    <span class="badge conn">PLC: 127.0.0.1:5020</span>
    <span class="hint">🖱 拖动旋转 · 滚轮缩放 · 右键平移</span>
    <span class="clock">{{ clock }}</span>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const clock = ref('')
let timer = null

function tick() {
  clock.value = new Date().toLocaleString('zh-CN')
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
h1 { font-size: 14px; font-weight: 600; color: var(--blue); letter-spacing: 1px; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; border: 1px solid; }
.sim  { border-color: var(--orange); color: var(--orange); }
.conn { border-color: var(--green); color: var(--green); }
.hint { margin-left: auto; color: var(--dim); font-size: 11px; font-style: italic; }
.clock { color: var(--dim); font-size: 12px; }
</style>
