import * as THREE from 'three'

/**
 * Pre-built PBR material presets for industrial equipment.
 * All materials use MeshStandardMaterial or MeshPhysicalMaterial
 * so they respond correctly to HDR environment maps and directional lights.
 */

/** Brushed stainless steel */
export function stainlessMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xb8c0c8,
    roughness: 0.25,
    metalness: 0.92,
    envMapIntensity: 1.2,
  })
}

/** Painted pump body (safety orange) */
export function pumpBodyMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xe87820,
    roughness: 0.55,
    metalness: 0.10,
  })
}

/** Electric motor housing (dark gray) */
export function motorMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x2a2e36,
    roughness: 0.68,
    metalness: 0.45,
  })
}

/** Ball valve body */
export function valveMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xc8b840,
    roughness: 0.42,
    metalness: 0.75,
  })
}

/** Galvanized pipe */
export function pipeMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x8090a0,
    roughness: 0.35,
    metalness: 0.80,
  })
}

/** Steel structural platform / grating */
export function platformMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x505870,
    roughness: 0.72,
    metalness: 0.55,
  })
}

/** White safety railing */
export function railingMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xe8ece8,
    roughness: 0.48,
    metalness: 0.15,
  })
}

/** Water (semi-transparent, PBR) */
export function waterMat() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x4488cc,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.82,
    transparent: true,
    opacity: 0.72,
    thickness: 0.6,
    envMapIntensity: 1.4,
  })
}

/** Semi-transparent tank shell */
export function tankShellMat() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xb8c8d8,
    roughness: 0.18,
    metalness: 0.85,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    envMapIntensity: 1.5,
  })
}

/** Painted concrete floor */
export function floorMat(color = 0x505860) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.90,
    metalness: 0.0,
  })
}

/** Brick wall with canvas texture */
export function brickWallMat() {
  const tex = _buildBrickTex()
  const mat = new THREE.MeshStandardMaterial({
    color: 0x944810,
    roughness: 0.90,
    metalness: 0.0,
    map: tex,
  })
  return mat
}

function _buildBrickTex() {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 512
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#8a8278'; ctx.fillRect(0, 0, 1024, 512)
  const bW = 64, bH = 28, m = 5
  for (let row = 0; row < 20; row++) {
    const off = (row % 2) * (bW / 2)
    for (let col = -1; col < 18; col++) {
      const x = col * (bW + m) + off, y = row * (bH + m)
      const v = (Math.random() - 0.5) * 22
      const r = Math.round(148 + v), g = Math.round(72 + v * 0.55), b = Math.round(30 + v * 0.25)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x + m, y + m, bW, bH)
      ctx.fillStyle = 'rgba(255,200,150,0.10)'
      ctx.fillRect(x + m, y + m, bW, 4)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(x + m, y + m + bH - 4, bW, 4)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 2)
  return tex
}
