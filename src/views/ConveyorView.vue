<template>
  <div class="page">
    <header class="bar">
      <span class="title">工业传送带仓库 · 数字孪生</span>
      <span class="badge eng">Photorealistic</span>
      <span class="badge mat">PBR Materials</span>
      <span class="hint">🖱 拖动旋转 · 滚轮缩放</span>
      <span class="clock">{{ clock }}</span>
    </header>
    <div class="vp" ref="container">
      <div v-if="loading" class="loading">正在构建工业场景…</div>
      <!-- HUD overlay -->
      <div class="hud">
        <div class="hud-row"><span class="hl">传送带</span><span class="hv green">运行中</span></div>
        <div class="hud-row"><span class="hl">速度</span><span class="hv">{{ beltSpeed }} m/min</span></div>
        <div class="hud-row"><span class="hl">箱数</span><span class="hv">{{ boxCount }}</span></div>
        <div class="hud-row"><span class="hl">环境</span><span class="hv">荧光灯 HDR</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { initConveyorScene } from '../composables/useConveyorScene.js'

const container = ref(null)
const loading    = ref(true)
const clock      = ref('')
const beltSpeed  = ref('33.0')
const boxCount   = ref(11)

let cleanup = null, timer = null

onMounted(() => {
  cleanup = initConveyorScene(container.value)
  loading.value = false
  timer = setInterval(() => {
    clock.value = new Date().toLocaleString('zh-CN')
    // slight speed variation
    beltSpeed.value = (33.0 + (Math.random()-0.5)*0.4).toFixed(1)
  }, 1000)
})
onUnmounted(() => { if (cleanup) cleanup(); clearInterval(timer) })
</script>

<style scoped>
.page { display:flex; flex-direction:column; height:100vh; overflow:hidden; background:#0d1018; }
.bar  { display:flex; align-items:center; gap:10px; padding:7px 16px;
        background:#10141c; border-bottom:1px solid #252c3a; flex-shrink:0; }
.title { font-size:13px; font-weight:600; color:#7ec8f8; letter-spacing:1px; }
.badge { font-size:11px; padding:2px 8px; border-radius:20px; border:1px solid; }
.eng  { border-color:#3fb950; color:#3fb950; }
.mat  { border-color:#d29922; color:#d29922; }
.hint { margin-left:auto; color:#484f58; font-size:11px; font-style:italic; }
.clock{ color:#484f58; font-size:12px; }

.vp  { flex:1; position:relative; background:#0d1018; cursor:grab; }
.vp:active { cursor:grabbing; }
.vp :deep(canvas) { display:block; width:100%!important; height:100%!important; }

.loading { position:absolute; inset:0; display:flex; align-items:center;
           justify-content:center; color:#484f58; font-size:14px; pointer-events:none; }

.hud { position:absolute; bottom:14px; left:14px; background:rgba(8,14,24,0.82);
       border:1px solid rgba(100,160,220,0.3); border-radius:6px; padding:8px 14px;
       pointer-events:none; font-family:monospace; line-height:1.7; }
.hud-row { display:flex; gap:12px; justify-content:space-between; }
.hl  { color:#788898; font-size:12px; }
.hv  { color:#7ec8f8; font-size:12px; font-weight:600; min-width:80px; text-align:right; }
.hv.green { color:#3fb950; }
</style>
