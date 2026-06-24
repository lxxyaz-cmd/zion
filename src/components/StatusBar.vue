<template>
  <div class="card status-bar">
    <div class="brow">
      <div class="bdot on"></div>
      <span class="conn-text">UE5 DataBridge ws://127.0.0.1:8765</span>
    </div>
    <div class="sub">上次推送: {{ lastTime }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const lastTime = ref('--')
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    lastTime.value = new Date().toLocaleTimeString('zh-CN')
  }, 200)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; }
.brow { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--dim); flex-shrink: 0; }
.bdot.on { background: var(--green); box-shadow: 0 0 5px var(--greenglow); }
.conn-text { color: var(--green); }
.sub { color: var(--dim); font-size: 11px; margin-top: 3px; }
</style>
