<template>
  <div class="card">
    <div class="ctitle">
      <span class="lamp" :class="{ on: fanOn }"></span>冷却塔
    </div>
    <div class="tgrid">
      <span class="tl">进水温度</span><span class="tv">{{ tin }} °C</span>
      <span class="tl">出水温度</span><span class="tv">{{ tout }} °C</span>
      <span class="tl">温差</span><span class="tv tdif">{{ tdif }} °C</span>
      <span class="tl">风机</span><span class="tv" :style="{ color: fanOn ? 'var(--green)' : 'var(--dim)' }">{{ fanOn ? '运行中' : '停止' }}</span>
    </div>
    <button class="btn" :class="{ on: fanOn }" @click="$emit('toggle')">
      {{ fanOn ? '停止风机' : '启动风机' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fanOn: { type: Boolean, default: false },
  tinVal:  { type: Number, default: 32 },
  toutVal: { type: Number, default: 32 },
})
defineEmits(['toggle'])

const tin  = computed(() => props.tinVal.toFixed(1))
const tout = computed(() => props.toutVal.toFixed(1))
const tdif = computed(() => (props.tinVal - props.toutVal).toFixed(1))
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--border); border-radius: 7px; padding: 10px; }
.ctitle { font-size: 12px; font-weight: 600; color: var(--blue); margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; }
.lamp { width: 11px; height: 11px; border-radius: 50%; background: var(--dim); flex-shrink: 0; transition: all .3s; }
.lamp.on { background: var(--green); box-shadow: 0 0 7px var(--greenglow); }
.tgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 12px; }
.tl { color: var(--dim); font-size: 12px; }
.tv { color: var(--water); font-weight: 600; }
.tdif { color: var(--orange); }
.btn { border: 1px solid var(--border); background: var(--card2); color: var(--text); border-radius: 5px; padding: 4px 10px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 6px; transition: all .15s; }
.btn:hover { border-color: var(--blue); color: var(--blue); }
.btn.on { border-color: var(--green); color: var(--green); background: #0d2218; }
</style>
