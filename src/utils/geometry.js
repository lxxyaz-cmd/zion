import * as THREE from 'three'

/**
 * Add a Box mesh to the scene.
 * @param {THREE.Scene} scene
 * @param {number} w width  @param {number} h height  @param {number} d depth
 * @param {THREE.Material} mat
 * @param {number} x  @param {number} y  @param {number} z
 * @param {number} [rx=0] X rotation (radians)
 * @returns {THREE.Mesh}
 */
export function addBox(scene, w, h, d, mat, x, y, z, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  if (rx) m.rotation.x = rx
  m.castShadow = true; m.receiveShadow = true
  scene.add(m); return m
}

/**
 * Add a Cylinder mesh to the scene.
 * @param {THREE.Scene} scene
 * @param {number} rt top radius  @param {number} rb bottom radius  @param {number} h height
 * @param {number} segs radial segments
 * @param {THREE.Material} mat
 * @param {number} x  @param {number} y  @param {number} z
 * @returns {THREE.Mesh}
 */
export function addCylinder(scene, rt, rb, h, segs, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat)
  m.position.set(x, y, z)
  m.castShadow = true; m.receiveShadow = true
  scene.add(m); return m
}

/**
 * Create a pipe (cylinder) between two world-space points.
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} a start point
 * @param {THREE.Vector3} b end point
 * @param {number} radius
 * @param {THREE.Material} mat
 * @returns {THREE.Mesh}
 */
export function addPipe(scene, a, b, radius, mat) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  if (len < 0.001) return null
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 12), mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  m.castShadow = true; m.receiveShadow = true
  scene.add(m); return m
}

/**
 * Create a flat slab (board) whose local Z axis points from a to b.
 * Useful for inclined structural members like stair stringers.
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} a  @param {THREE.Vector3} b
 * @param {number} width  @param {number} thickness
 * @param {THREE.Material} mat
 * @returns {THREE.Mesh}
 */
export function addSlab(scene, a, b, width, thickness, mat) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  if (len < 0.001) return null
  const m = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, len), mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize())
  m.castShadow = true; m.receiveShadow = true
  scene.add(m); return m
}

/**
 * Add a Torus (ring/flange) mesh to the scene.
 */
export function addTorus(scene, r, tube, segs, mat, x, y, z, rx = 0) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, segs), mat)
  m.position.set(x, y, z)
  if (rx) m.rotation.x = rx
  m.castShadow = true
  scene.add(m); return m
}
