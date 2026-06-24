<template>
  <div class="card pcard">
    <div class="ctitle">
      <span class="lamp" :class="{ on: isOn }"></span>
      泵组 {{ num }}
    </div>
    <div class="pr"><span class="pl">流量</span><span class="pv">{{ flow }}</span><span class="pu">L/min</span></div>
    <div class="fbar"><div class="fbar-fill" :style="{ width: flowPct + '%' }"></div></div>
    <div class="pr"><span class="pl">压力</span><span class="pv">{{ press }}</span><span class="pu">bar</span></div>
    <div class="pr"><span class="pl">电流</span><span class="pv">{{ curr }}</span><span class="pu">A</span></div>
    <div class="pr"><span class="pl">转速</span><span class="pv">{{ rpm }}</span><span class="pu">RPM</span></div>
    <button class="btn" :class="{ on: isOn }" @click="$emit('toggle')">
      {{ isOn ? '停  止' : '启  动' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  num:  { type: Number, required: true },
  isOn: { type: Boolean, default: false },
  f:    { type: Number, default: 0 },
  p:    { type: Number, default: 0 },
  c:    { type: Number, default: 0 },
  r:    { type: Number, default: 0 },
})
defineEmits(['toggle'])

const flow    = computed(() => props.f.toFixed(1))
const press   = computed(() => props.p.toFixed(2))
const curr    = computed(() => props.c.toFixed(1))
const rpm     = computed(() => props.r)
const flowPct = computed(() => (props.f / 1500 * 100).toFixed(1))
</script>

<style scoped>
.pcard { width: 175px; flex-shrink: 0; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 7px; padding: 10px; }
.ctitle { font-size: 12px; font-weight: 600; color: var(--blue); margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; }
.lamp { width: 11px; height: 11px; border-radius: 50%; background: var(--dim); flex-shrink: 0; transition: all .3s; }
.lamp.on { background: var(--green); box-shadow: 0 0 7px var(--greenglow); }
.pr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.pl { color: var(--dim); }
.pv { color: var(--water); font-weight: 600; font-variant-numeric: tabular-nums; }
.pu { color: var(--dim); font-size: 11px; width: 34px; text-align: right; }
.fbar { background: var(--card2); border-radius: 3px; height: 5px; overflow: hidden; margin: 3px 0 6px; }
.fbar-fill { height: 100%; background: linear-gradient(90deg, #1f6feb, #4fc3f7); border-radius: 3px; transition: width .4s; }
.btn { border: 1px solid var(--border); background: var(--card2); color: var(--text); border-radius: 5px; padding: 4px 10px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 6px; transition: all .15s; }
.btn:hover { border-color: var(--blue); color: var(--blue); }
.btn.on { border-color: var(--green); color: var(--green); background: #0d2218; }
</style>
