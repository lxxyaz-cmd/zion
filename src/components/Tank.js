import * as THREE from 'three'
import { addBox, addCylinder } from '../utils/geometry.js'
import { stainlessMat, waterMat, tankShellMat } from '../materials/industrial.js'

/**
 * StorageTank — stainless-steel storage tank with dynamic water-level visualization.
 *
 * @example
 * const tank = new StorageTank(scene, { position: [7.5, 0, 0], width: 2.8, depth: 2.0, height: 2.8 })
 * tank.setLevel(75)   // 0–100 %
 */
export class StorageTank {
  constructor(scene, opts = {}) {
    this.scene = scene
    this._pos  = opts.position ?? [0, 0, 0]
    this._w = opts.width  ?? 2.8
    this._d = opts.depth  ?? 2.0
    this._h = opts.height ?? 2.8
    this._level = 80
    this._water = null
    this._shell = null
    this._build()
  }

  _build() {
    const [x, y, z] = this._pos
    const s = this.scene
    const W = this._w, D = this._d, H = this._h

    // Shell (semi-transparent)
    const shellMat = tankShellMat()
    this._shell = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), shellMat)
    this._shell.position.set(x, y + H / 2, z)
    this._shell.castShadow = true; this._shell.receiveShadow = true
    s.add(this._shell)

    // Structural ribs (external)
    const ribMat = stainlessMat()
    for (let i = 0; i < 4; i++) {
      const ry = y + 0.3 + i * ((H - 0.3) / 3)
      addBox(s, W + 0.05, 0.06, D + 0.05, ribMat, x, ry, z)
    }

    // Legs
    const legMat = stainlessMat()
    const legH = 0.22
    ;[[-W / 2 + 0.15, -D / 2 + 0.15], [W / 2 - 0.15, -D / 2 + 0.15],
      [-W / 2 + 0.15,  D / 2 - 0.15], [W / 2 - 0.15,  D / 2 - 0.15]].forEach(([lx, lz]) => {
      addCylinder(s, 0.06, 0.06, legH, 8, legMat, x + lx, y + legH / 2, z + lz)
    })

    // Water body (origin at bottom so scale.y stretches upward)
    const wMat = waterMat()
    const wGeo = new THREE.BoxGeometry(W - 0.08, H - 0.04, D - 0.08)
    // Shift geometry so origin is at the bottom face
    wGeo.translate(0, (H - 0.04) / 2, 0)
    this._water = new THREE.Mesh(wGeo, wMat)
    this._water.position.set(x, y + 0.02, z)
    this._water.renderOrder = 1
    s.add(this._water)

    this._updateWater()
  }

  _updateWater() {
    const t = Math.max(0, Math.min(100, this._level)) / 100
    this._water.scale.y = Math.max(0.01, t)
    // Water color: deep blue when full, light cyan when low
    const wMat = this._water.material
    wMat.color.setRGB(0.15 + 0.12 * (1 - t), 0.40 + 0.22 * t, 0.65 + 0.20 * t)
  }

  /** Set fill level (0–100%) */
  setLevel(percent) {
    this._level = percent
    this._updateWater()
  }

  /** Current level 0–100 */
  get level() { return this._level }
}
