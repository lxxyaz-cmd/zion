/**
 * zion-digital-twin
 * A Three.js library for industrial digital twin 3D visualizations.
 *
 * @see https://github.com/lxxyaz-cmd/zion
 */

// Scene setup
export { createIndustrialScene } from './scene/setup.js'

// 3D Components
export { CentrifugalPump } from './components/Pump.js'
export { CoolingTower }   from './components/CoolingTower.js'
export { StorageTank }    from './components/Tank.js'

// PBR Materials
export {
  stainlessMat,
  pumpBodyMat,
  motorMat,
  valveMat,
  pipeMat,
  platformMat,
  railingMat,
  waterMat,
  tankShellMat,
  floorMat,
  brickWallMat,
} from './materials/industrial.js'

// Geometry helpers
export { addBox, addCylinder, addPipe, addSlab, addTorus } from './utils/geometry.js'
