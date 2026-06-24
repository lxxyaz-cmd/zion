<template>
  <div class="app">
    <AppHeader />
    <ThreeViewport />
    <div class="panels">
      <PumpCard
        :num="1" :isOn="data.p1on"
        :f="data.p1f" :p="data.p1p" :c="data.p1c" :r="data.p1r"
        @toggle="togglePump(1)"
      />
      <PumpCard
        :num="2" :isOn="data.p2on"
        :f="data.p2f" :p="data.p2p" :c="data.p2c" :r="data.p2r"
        @toggle="togglePump(2)"
      />
      <div class="rcol">
        <TowerCard :fanOn="data.fanOn" :tinVal="data.tin" :toutVal="data.tout" @toggle="toggleTower" />
        <TankAlarmPanel :tank="data.tank" :hiTemp="data.hiTemp" :loPress="data.loPress" />
        <StatusBar />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppHeader      from '../components/AppHeader.vue'
import ThreeViewport  from '../components/ThreeViewport.vue'
import PumpCard       from '../components/PumpCard.vue'
import TowerCard      from '../components/TowerCard.vue'
import TankAlarmPanel from '../components/TankAlarmPanel.vue'
import StatusBar      from '../components/StatusBar.vue'
import { data, togglePump, toggleTower } from '../composables/useSimulation.js'
</script>

<style scoped>
.app   { display:flex; flex-direction:column; height:100vh; overflow:hidden }
.panels{ display:flex; gap:8px; padding:8px 16px; overflow:auto; flex:1 }
.rcol  { display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px }
</style>
