import * as THREE from 'three'
import { addBox, addCylinder, addPipe, addTorus } from '../utils/geometry.js'
import { pumpBodyMat, motorMat, stainlessMat, valveMat, pipeMat } from '../materials/industrial.js'

/**
 * CentrifugalPump — industrial centrifugal pump 3D component.
 *
 * @example
 * const pump = new CentrifugalPump(scene, { position: [-2.5, 0, 0] })
 * pump.setSpeed(1450)          // RPM
 * pump.update(deltaTime)       // call in animation loop
 */
export class CentrifugalPump {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [opts]
   * @param {[number,number,number]} [opts.position=[0,0,0]]
   * @param {object} [opts.materials] - override default materials
   */
  constructor(scene, opts = {}) {
    this.scene = scene
    this._pos = opts.position ?? [0, 0, 0]
    this._mat = {
      body:    opts.materials?.body    ?? pumpBodyMat(),
      motor:   opts.materials?.motor   ?? motorMat(),
      stainless: opts.materials?.stainless ?? stainlessMat(),
      valve:   opts.materials?.valve   ?? valveMat(),
      pipe:    opts.materials?.pipe    ?? pipeMat(),
    }
    this._rpm = 0
    this._impeller = null
    this._light = null
    this._build()
  }

  _build() {
    const [x, y, z] = this._pos
    const m = this._mat
    const s = this.scene

    // Motor
    addCylinder(s, 0.26, 0.26, 0.72, 16, m.motor, x, y + 0.72, z)
    addCylinder(s, 0.10, 0.10, 0.14, 12, m.stainless, x, y + 0.72 + 0.43, z)
    addBox(s, 0.55, 0.10, 0.55, m.motor, x, y + 0.08, z)

    // Pump volute casing
    addCylinder(s, 0.30, 0.30, 0.38, 20, m.body, x, y + 0.38, z)
    addCylinder(s, 0.08, 0.08, 0.20, 12, m.stainless, x, y + 0.10, z)

    // Impeller (visible through casing)
    this._impeller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8),
      this._mat.stainless
    )
    this._impeller.position.set(x, y + 0.38, z)
    this._impeller.castShadow = true
    s.add(this._impeller)

    // Discharge flange + pipe stub
    addTorus(s, 0.10, 0.025, 16, m.stainless, x + 0.32, y + 0.55, z, Math.PI / 2)
    addPipe(s,
      new THREE.Vector3(x + 0.30, y + 0.55, z),
      new THREE.Vector3(x + 0.55, y + 0.55, z),
      0.08, m.pipe
    )

    // Suction flange
    addTorus(s, 0.12, 0.025, 16, m.stainless, x, y + 0.10, z)

    // Inlet valve (ball valve)
    addCylinder(s, 0.075, 0.075, 0.22, 12, m.valve, x, y - 0.28, z)
    addTorus(s, 0.09, 0.022, 16, m.valve, x, y - 0.17, z)
    addTorus(s, 0.09, 0.022, 16, m.valve, x, y - 0.38, z)
    // Valve handwheel
    addTorus(s, 0.12, 0.018, 12, m.stainless, x, y - 0.28, z + 0.13, Math.PI / 2)

    // Status indicator light
    this._light = new THREE.PointLight(0x4488ff, 0, 1.5)
    this._light.position.set(x, y + 1.0, z)
    s.add(this._light)
  }

  /** Set pump rotational speed in RPM */
  setSpeed(rpm) {
    this._rpm = Math.max(0, rpm)
    this._light.intensity = (this._rpm / 1450) * 0.8
  }

  /** Call every animation frame with elapsed time in seconds */
  update(dt) {
    if (this._impeller && this._rpm > 0) {
      this._impeller.rotation.y += (this._rpm / 60) * 2 * Math.PI * dt
    }
  }

  /** Remove all objects from the scene */
  dispose() {
    const toRemove = []
    this.scene.traverse(obj => {
      if (obj.userData._pumpRef === this) toRemove.push(obj)
    })
    toRemove.forEach(obj => this.scene.remove(obj))
    if (this._light) this.scene.remove(this._light)
  }
}
