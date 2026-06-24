import { createRouter, createWebHashHistory } from 'vue-router'
import CoolingView  from '../views/CoolingView.vue'
import ConveyorView from '../views/ConveyorView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',         component: CoolingView  },
    { path: '/conveyor', component: ConveyorView },
  ],
})
