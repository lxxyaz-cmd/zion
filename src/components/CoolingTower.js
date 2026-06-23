import * as THREE from 'three'
import { addBox, addCylinder } from '../utils/geometry.js'

/**
 * CoolingTower — counter-flow cooling tower 3D component with animated fan blades.
 *
 * @example
 * const tower = new CoolingTower(scene, { position: [0, 3.6, -3.2] })
 * tower.setFanSpeed(960)
 * tower.update(deltaTime)
 */
export class CoolingTower {
  constructor(scene, opts = {}) {
    this.scene = scene
    this._pos = opts.position ?? [0, 0, 0]
    this._fanRPM = 0
    this._fanGroup = new THREE.Group()
    this._light = null
    this._build()
  }

  _build() {
    const [x, y, z] = this._pos
    const s = this.scene

    const shellMat = new THREE.MeshStandardMaterial({ color: 0xdde4ec, roughness: 0.62, metalness: 0.05 })
    const fanMat   = new THREE.MeshStandardMaterial({ color: 0x5599cc, roughness: 0.50, metalness: 0.20, emissive: 0x002244 })
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x404858, roughness: 0.70, metalness: 0.50 })

    // Tower body
    addBox(s, 2.2, 2.8, 2.2, shellMat, x, y + 1.4, z)

    // Louvre blades
    for (let i = 0; i < 6; i++) {
      const ly = y + 0.3 + i * 0.28
      addBox(s, 2.22, 0.06, 2.22, shellMat, x, ly, z)
    }

    // Fan shroud
    addCylinder(s, 0.82, 0.88, 0.28, 24, frameMat, x, y + 2.88, z)

    // Fan blades group
    this._fanGroup.position.set(x, y + 2.88, z)
    const bladeMat = fanMat
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.20), bladeMat)
      blade.position.set(Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.36)
      blade.rotation.y = angle
      this._fanGroup.add(blade)
    }
    s.add(this._fanGroup)

    // Hub
    addCylinder(s, 0.08, 0.08, 0.32, 12, frameMat, x, y + 2.88, z)

    // Status light
    this._light = new THREE.PointLight(0x2266ff, 0, 4.0)
    this._light.position.set(x, y + 3.2, z)
    s.add(this._light)
  }

  /** Set fan speed in RPM (0 = stopped) */
  setFanSpeed(rpm) {
    this._fanRPM = Math.max(0, rpm)
    const t = this._fanRPM / 960
    this._light.intensity = t * 3.0
    // Update blade emissive glow
    this._fanGroup.children.forEach(b => {
      if (b.material?.emissive) {
        b.material.emissive.setRGB(0, 0.08 * t, 0.35 * t)
      }
    })
  }

  /** Call every animation frame with elapsed time in seconds */
  update(dt) {
    if (this._fanRPM > 0) {
      this._fanGroup.rotation.y += (this._fanRPM / 60) * 2 * Math.PI * dt
    }
  }
}
