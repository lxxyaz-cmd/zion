<template>
  <div style="display:flex;gap:8px">
    <!-- 水箱液位 -->
    <div class="card" style="flex:1">
      <div class="ctitle">水箱液位</div>
      <div class="trow">
        <div class="vbar-wrap">
          <div class="vbar-fill" :style="{ height: tankPct + '%' }"></div>
        </div>
        <div>
          <div class="tpct">{{ tankPct }}<span>%</span></div>
        </div>
      </div>
    </div>

    <!-- 报警 -->
    <div class="card" style="flex:1">
      <div class="ctitle">报警</div>
      <div class="alist">
        <div class="ai" :class="{ on: hiTemp }">⚠ 高温报警</div>
        <div class="ai" :class="{ on: loPress }">⚠ 低压报警</div>
        <div class="ai">⚠ 泵1故障</div>
        <div class="ai">⚠ 泵2故障</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tank:    { type: Number, default: 75 },
  hiTemp:  { type: Boolean, default: false },
  loPress: { type: Boolean, default: false },
})

const tankPct = computed(() => props.tank.toFixed(1))
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--border); border-radius: 7px; padding: 10px; }
.ctitle { font-size: 12px; font-weight: 600; color: var(--blue); margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
.trow { display: flex; align-items: center; gap: 10px; }
.vbar-wrap { width: 26px; height: 72px; background: var(--card2); border: 1px solid var(--border); border-radius: 3px; overflow: hidden; display: flex; flex-direction: column-reverse; }
.vbar-fill { background: linear-gradient(0deg, #1f6feb, #4fc3f7); transition: height .6s; }
.tpct { font-size: 20px; font-weight: 700; color: var(--water); }
.tpct span { font-size: 12px; color: var(--dim); }
.alist { display: flex; flex-direction: column; gap: 4px; }
.ai { padding: 4px 7px; border-radius: 3px; font-size: 12px; border-left: 3px solid var(--dim); background: var(--card2); color: var(--dim); transition: all .2s; }
.ai.on { border-left-color: var(--red); color: var(--red); background: #200d0c; animation: blink .8s infinite; }
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }
</style>
