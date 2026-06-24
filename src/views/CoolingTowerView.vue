<template>
  <div class="page">
    <header class="bar">
      <span class="title">冷却塔循环水系统 · 工业数字孪生</span>
      <span class="badge pbr">PBR</span>
      <span class="badge hdr">HDR</span>
      <span class="badge phys">Real-Scale</span>
      <span class="hint">🖱 拖动旋转 · 滚轮缩放 · 右键平移</span>
      <span class="clock">{{ clock }}</span>
    </header>

    <div class="vp" ref="container">
      <div v-if="loading" class="splash">
        <div class="spin"></div>
        <span>正在构建工业场景…</span>
      </div>

      <!-- Instrument panel HUD -->
      <div class="hud">
        <div class="hud-title">实时监控</div>

        <div class="hud-row">
          <span class="lbl">冷却塔风机</span>
          <span class="val green">运行中</span>
        </div>
        <div class="hud-row">
          <span class="lbl">风机转速</span>
          <span class="val">{{ fanRpm }} RPM</span>
        </div>
        <div class="hud-row sep"></div>

        <div class="hud-row">
          <span class="lbl">泵1 状态</span>
          <span class="val green">运行中</span>
        </div>
        <div class="hud-row">
          <span class="lbl">泵2 状态</span>
          <span class="val green">运行中</span>
        </div>
        <div class="hud-row sep"></div>

        <div class="hud-row">
          <span class="lbl">供水温度</span>
          <span class="val blue">{{ supplyTemp }}°C</span>
        </div>
        <div class="hud-row">
          <span class="lbl">回水温度</span>
          <span class="val orange">{{ returnTemp }}°C</span>
        </div>
        <div class="hud-row">
          <span class="lbl">循环流量</span>
          <span class="val">{{ flowRate }} m³/h</span>
        </div>
        <div class="hud-row sep"></div>

        <div class="hud-row">
          <span class="lbl">供水压力</span>
          <span class="val">{{ supplyPress }} MPa</span>
        </div>
        <div class="hud-row">
          <span class="lbl">回水压力</span>
          <span class="val">{{ returnPress }} MPa</span>
        </div>
        <div class="hud-row">
          <span class="lbl">水箱液位</span>
          <span class="val">{{ tankLevel }}%</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        <div class="leg-row"><span class="dot blue"></span> 冷水供水管 (Cold)</div>
        <div class="leg-row"><span class="dot orange"></span> 热水回水管 (Hot)</div>
        <div class="leg-row"><span class="dot gray"></span> 钢结构平台</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { initCoolingTowerScene } from '../composables/useCoolingTowerScene.js'

const container  = ref(null)
const loading    = ref(true)
const clock      = ref('')
const fanRpm     = ref(320)
const supplyTemp = ref(28.4)
const returnTemp = ref(35.8)
const flowRate   = ref(486)
const supplyPress= ref(0.38)
const returnPress= ref(0.22)
const tankLevel  = ref(82)

let cleanup = null, timer = null

onMounted(() => {
  cleanup = initCoolingTowerScene(container.value)
  loading.value = false

  timer = setInterval(() => {
    clock.value      = new Date().toLocaleString('zh-CN')
    fanRpm.value     = Math.round(320 + (Math.random()-0.5)*8)
    supplyTemp.value = (28.4 + (Math.random()-0.5)*0.6).toFixed(1)
    returnTemp.value = (35.8 + (Math.random()-0.5)*0.8).toFixed(1)
    flowRate.value   = Math.round(486 + (Math.random()-0.5)*12)
    supplyPress.value= (0.38 + (Math.random()-0.5)*0.012).toFixed(3)
    returnPress.value= (0.22 + (Math.random()-0.5)*0.008).toFixed(3)
    tankLevel.value  = Math.round(82  + (Math.random()-0.5)*2)
  }, 1200)
})

onUnmounted(() => {
  if (cleanup) cleanup()
  clearInterval(timer)
})
</script>

<style scoped>
.page { display:flex; flex-direction:column; height:100vh; overflow:hidden; background:#090c10; }

.bar {
  display:flex; align-items:center; gap:10px; padding:6px 16px;
  background:#0b0f16; border-bottom:1px solid #1e2838; flex-shrink:0;
}
.title { font-size:13px; font-weight:600; color:#78c8f0; letter-spacing:0.5px; }
.badge {
  font-size:10px; padding:2px 7px; border-radius:20px; border:1px solid;
  font-family:monospace; font-weight:600;
}
.pbr   { color:#3fb950; border-color:#3fb950; }
.hdr   { color:#d29922; border-color:#d29922; }
.phys  { color:#58a6ff; border-color:#58a6ff; }
.hint  { margin-left:auto; color:#404850; font-size:11px; font-style:italic; }
.clock { color:#404850; font-size:11px; font-family:monospace; }

.vp { flex:1; position:relative; overflow:hidden; cursor:grab; }
.vp:active { cursor:grabbing; }
.vp :deep(canvas) { display:block; width:100%!important; height:100%!important; }

.splash {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14px; color:#505860; font-size:13px;
  background:#090c10; z-index:10;
}
.spin {
  width:32px; height:32px; border:3px solid #1e2838; border-top-color:#58a6ff;
  border-radius:50%; animation:spin 0.9s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* HUD panel */
.hud {
  position:absolute; top:14px; right:14px;
  background:rgba(6,10,18,0.88);
  border:1px solid rgba(80,130,180,0.28);
  border-radius:6px; padding:10px 14px;
  font-family:monospace; pointer-events:none;
  min-width:186px; backdrop-filter:blur(4px);
}
.hud-title {
  font-size:11px; color:#58a6ff; font-weight:700;
  letter-spacing:1px; margin-bottom:8px;
  text-transform:uppercase;
}
.hud-row { display:flex; justify-content:space-between; align-items:center; line-height:1.9; }
.hud-row.sep { border-top:1px solid rgba(80,100,130,0.2); margin:4px 0 2px; }
.lbl  { color:#607080; font-size:11px; }
.val  { color:#9ab8d0; font-size:11px; font-weight:600; text-align:right; }
.val.green  { color:#3fb950; }
.val.blue   { color:#58c8ff; }
.val.orange { color:#f08030; }

/* Legend */
.legend {
  position:absolute; bottom:14px; right:14px;
  background:rgba(6,10,18,0.82); border:1px solid rgba(80,130,180,0.22);
  border-radius:5px; padding:8px 12px; font-size:11px;
  color:#607080; pointer-events:none; line-height:1.9;
}
.leg-row { display:flex; align-items:center; gap:7px; }
.dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.dot.blue   { background:#2888d8; }
.dot.orange { background:#d06020; }
.dot.gray   { background:#506070; }
</style>
