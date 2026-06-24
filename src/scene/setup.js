import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * Create a ready-to-use Three.js scene with PBR renderer, lighting, and orbit controls.
 *
 * @param {HTMLElement} container  DOM element to render into
 * @param {object} [opts]
 * @param {[number,number,number]} [opts.cameraPos=[8, 5, 12]]
 * @param {[number,number,number]} [opts.cameraTarget=[0, 1, 0]]
 * @param {number} [opts.fov=52]
 * @returns {{ scene, camera, renderer, controls, pmrem, animate, dispose }}
 */
export function createIndustrialScene(container, opts = {}) {
  const w = container.clientWidth, h = container.clientHeight

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1e26)
  scene.fog = new THREE.Fog(0x1a1e26, 28, 60)

  // PBR environment
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.environment = envTex

  // Camera
  const [cx, cy, cz] = opts.cameraPos ?? [-1, 4.2, 11.5]
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 52, w / h, 0.1, 200)
  camera.position.set(cx, cy, cz)

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  const [tx, ty, tz] = opts.cameraTarget ?? [2.5, 1.8, -1.5]
  controls.target.set(tx, ty, tz)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI * 0.82
  controls.update()

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xfff8e8, 1.8)
  sun.position.set(6, 12, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -15; sun.shadow.camera.right = 15
  sun.shadow.camera.top  =  12; sun.shadow.camera.bottom = -8
  scene.add(sun)

  const fill = new THREE.DirectionalLight(0x8ab4d8, 0.6)
  fill.position.set(-8, 6, -6)
  scene.add(fill)

  // Resize handler
  const onResize = () => {
    const nw = container.clientWidth, nh = container.clientHeight
    camera.aspect = nw / nh
    camera.updateProjectionMatrix()
    renderer.setSize(nw, nh)
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(container)

  // Animate helper
  let rafId
  function animate(tick) {
    rafId = requestAnimationFrame(() => animate(tick))
    controls.update()
    tick && tick()
    renderer.render(scene, camera)
  }

  function dispose() {
    cancelAnimationFrame(rafId)
    ro.disconnect()
    renderer.dispose()
    pmrem.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, controls, pmrem, envTex, animate, dispose }
}
