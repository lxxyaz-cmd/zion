import { reactive } from 'vue'

export const sim = reactive({
  p1: false, p2: false, fan: false,
  s1: 0, s2: 0, temp: 32, tank: 75,
})

export const data = reactive({
  p1on: false, p1f: 0, p1p: 0, p1c: 0, p1r: 0,
  p2on: false, p2f: 0, p2p: 0, p2c: 0, p2r: 0,
  fanOn: false, tin: 32, tout: 32,
  tank: 75, hiTemp: false, loPress: false,
})

const RATED = 1450
const RAMP = 80
const noise = a => (Math.random() - 0.5) * a

export function physStep() {
  const dt = 0.2
  sim.s1 = Math.max(0, Math.min(RATED, sim.s1 + Math.sign((sim.p1 ? RATED : 0) - sim.s1) * Math.min(RAMP, Math.abs((sim.p1 ? RATED : 0) - sim.s1))))
  sim.s2 = Math.max(0, Math.min(RATED, sim.s2 + Math.sign((sim.p2 ? RATED : 0) - sim.s2) * Math.min(RAMP, Math.abs((sim.p2 ? RATED : 0) - sim.s2))))
  const r1 = sim.s1 / RATED
  const r2 = sim.s2 / RATED
  sim.temp = Math.max(18, Math.min(45, sim.temp + ((r1 + r2) * 0.008 - (sim.fan ? 0.015 : 0)) * 10 * dt))
  sim.tank = Math.max(5, Math.min(100, sim.tank - (r1 + r2) * 0.025 * dt + (sim.fan ? 0.05 : 0) * dt))

  data.p1on = sim.s1 > 50
  data.p1f  = Math.max(0, r1 * 1200 + noise(8))
  data.p1p  = Math.max(0, r1 * 3.2 + noise(0.05))
  data.p1c  = Math.max(0, r1 * 12.3 + noise(0.2))
  data.p1r  = Math.round(sim.s1)
  data.p2on = sim.s2 > 50
  data.p2f  = Math.max(0, r2 * 1200 + noise(8))
  data.p2p  = Math.max(0, r2 * 3.2 + noise(0.05))
  data.p2c  = Math.max(0, r2 * 12.3 + noise(0.2))
  data.p2r  = Math.round(sim.s2)
  data.fanOn = sim.fan
  data.tin   = sim.temp
  data.tout  = sim.temp - (sim.fan ? 5.5 + noise(0.3) : 0.3)
  data.tank  = sim.tank
  data.hiTemp = sim.temp > 42
  data.loPress = r1 * 3.2 < 0.5 && sim.p1
}

export function togglePump(n) {
  if (n === 1) sim.p1 = !sim.p1
  else sim.p2 = !sim.p2
}

export function toggleTower() {
  sim.fan = !sim.fan
}
