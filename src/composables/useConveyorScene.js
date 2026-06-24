/**
 * Industrial Conveyor Warehouse — photorealistic Three.js scene
 * JSON spec: rust/scratch steel · wear rubber belt · oil-stained concrete
 *            deformed cardboard · fluorescent HDR lighting · DOF · dust
 */
import * as THREE from 'three'
import { OrbitControls }   from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { BokehPass }       from 'three/examples/jsm/postprocessing/BokehPass.js'

// ── Scene constants ───────────────────────────────────────────────────────────
const BL         = 20       // belt length (m)
const BW         = 1.4      // belt width
const BH         = 0.92     // belt surface height
const BSP        = 0.55     // belt speed (sim m/s)
const BELT_START = -9
const BELT_END   =  11

// Module-level handles (reset on each init)
let renderer, scene, camera, controls, composer
let dustGeo, dustPos, dustVel
let rafId
let boxList = []
let fluoLights = []
let vibratePhase = 0
let flickerTimer  = 0
let beltMat, belt2Mat   // exposed for UV scroll

function rnd() { return Math.random() }
function noise(a) { return (rnd() - 0.5) * a }

// ── Canvas textures ───────────────────────────────────────────────────────────

function makeConcreteFloor() {
  const S = 1024
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#636468'; ctx.fillRect(0, 0, S, S)

  // Fine aggregate noise
  for (let i = 0; i < 12000; i++) {
    const v = 78 + Math.floor(rnd() * 28)
    ctx.fillStyle = `rgb(${v},${v},${v - 3})`
    ctx.beginPath(); ctx.arc(rnd()*S, rnd()*S, rnd()*2.5, 0, Math.PI*2); ctx.fill()
  }

  // Expansion joints
  ctx.strokeStyle = '#50525a'; ctx.lineWidth = 2.5
  for (let i = 0; i <= 4; i++) {
    const p = i * (S / 4)
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke()
  }

  // Oil stains with iridescence
  for (let i = 0; i < 14; i++) {
    const x = rnd()*S, y = rnd()*S, rx = 30 + rnd()*80, ry = 15 + rnd()*40
    const ang = rnd() * Math.PI
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    g.addColorStop(0,   `rgba(12,10,8,${0.65 + rnd()*0.25})`)
    g.addColorStop(0.5, 'rgba(20,16,12,0.35)')
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.scale(1, ry / rx)
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI*2); ctx.fill()
    // rainbow sheen
    const ird = ctx.createRadialGradient(-5, -5, 0, 0, 0, rx * 0.5)
    ird.addColorStop(0,   'rgba(80,120,200,0.07)')
    ird.addColorStop(0.5, 'rgba(200,80,80,0.04)')
    ird.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = ird
    ctx.beginPath(); ctx.arc(0, 0, rx * 0.7, 0, Math.PI*2); ctx.fill()
    ctx.restore()
  }

  // Forklift tire tracks (double parallel)
  for (let i = 0; i < 5; i++) {
    const x0 = 80 + rnd()*860, ang = -0.15 + rnd()*0.3
    ctx.save(); ctx.translate(x0, S/2); ctx.rotate(ang)
    for (const dx of [-6, 6]) {
      ctx.fillStyle = `rgba(14,13,11,${0.28 + rnd()*0.18})`
      ctx.fillRect(dx - 3, -S * 0.65, 6, S * 1.3)
      // tread dots
      ctx.fillStyle = `rgba(9,8,7,0.18)`
      for (let y = -S*0.6; y < S*0.6; y += 18) ctx.fillRect(dx - 3, y, 6, 8)
    }
    ctx.restore()
  }

  // Faded yellow safety line
  ctx.strokeStyle = 'rgba(200,180,40,0.52)'; ctx.lineWidth = 11
  ctx.setLineDash([60, 16])
  ctx.beginPath(); ctx.moveTo(0, S * 0.48); ctx.lineTo(S, S * 0.48); ctx.stroke()
  ctx.setLineDash([])

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(7, 12); return tex
}

function makeRustSteelTex(baseHex = '#5c6370') {
  const S = 512
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, S, S)

  // Metal grain
  for (let i = 0; i < 4000; i++) {
    const v = Math.floor(rnd()*18 - 9)
    ctx.fillStyle = `rgba(${128+v},${128+v},${120+v},0.12)`
    ctx.fillRect(rnd()*S, rnd()*S, 1, 1)
  }

  // Rust patches (organic blobs)
  for (let i = 0; i < 28; i++) {
    const x = rnd()*S, y = rnd()*S, r = 8 + rnd()*55
    const rR = 108 + Math.floor(rnd()*60), rG = 36 + Math.floor(rnd()*28)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,    `rgba(${rR},${rG},8,${0.7 + rnd()*0.25})`)
    g.addColorStop(0.45, `rgba(${rR-20},${rG-8},6,0.45)`)
    g.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
  }

  // Paint peel flakes
  for (let i = 0; i < 14; i++) {
    const x = rnd()*S, y = rnd()*S, r = 4 + rnd()*18
    ctx.fillStyle = `rgba(172,168,155,${0.35 + rnd()*0.4})`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = 'rgba(78,68,58,0.5)'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke()
  }

  // Scratch lines
  for (let i = 0; i < 45; i++) {
    const x = rnd()*S, y = rnd()*S, len = 15 + rnd()*100, ang = rnd()*Math.PI
    ctx.strokeStyle = `rgba(210,205,195,${0.15 + rnd()*0.35})`
    ctx.lineWidth = 0.4 + rnd()*1.8
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke()
  }

  // Maintenance weld beads
  for (let i = 0; i < 3; i++) {
    const y = 60 + i * 190
    const g = ctx.createLinearGradient(0, y-4, 0, y+8)
    g.addColorStop(0,   'rgba(180,160,100,0.0)')
    g.addColorStop(0.3, 'rgba(180,155,80,0.55)')
    g.addColorStop(0.6, 'rgba(210,185,110,0.65)')
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, y-4, S, 12)
    // spatter dots
    for (let j = 0; j < 20; j++) {
      ctx.fillStyle = `rgba(200,170,80,${0.4 + rnd()*0.3})`
      ctx.beginPath(); ctx.arc(rnd()*S, y + noise(20), 1 + rnd()*3, 0, Math.PI*2); ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2); return tex
}

function makeConveyorBeltTex() {
  const W = 256, H = 1024
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Vulcanised rubber base
  ctx.fillStyle = '#1a1a17'; ctx.fillRect(0, 0, W, H)

  // Transverse cleats (ridges)
  for (let y = 0; y < H; y += 36) {
    const g = ctx.createLinearGradient(0, y, 0, y+14)
    g.addColorStop(0,   '#2e2e28')
    g.addColorStop(0.4, '#383830')
    g.addColorStop(1,   '#1e1e1a')
    ctx.fillStyle = g; ctx.fillRect(0, y, W, 14)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, y+14, W, 3)
  }

  // Longitudinal wear grooves
  for (let i = 0; i < 7; i++) {
    const x = 18 + i * 32
    ctx.fillStyle = `rgba(42,40,34,${0.4 + rnd()*0.2})`
    ctx.fillRect(x-1, 0, 3, H)
  }

  // Center wear band
  const cw = ctx.createLinearGradient(W*0.3, 0, W*0.7, 0)
  cw.addColorStop(0,   'rgba(0,0,0,0)')
  cw.addColorStop(0.2, 'rgba(38,36,30,0.3)')
  cw.addColorStop(0.8, 'rgba(38,36,30,0.3)')
  cw.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = cw; ctx.fillRect(0, 0, W, H)

  // Edge fraying
  const eL = ctx.createLinearGradient(0, 0, 28, 0)
  eL.addColorStop(0, 'rgba(65,58,44,0.7)'); eL.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = eL; ctx.fillRect(0, 0, 28, H)
  const eR = ctx.createLinearGradient(W, 0, W-28, 0)
  eR.addColorStop(0, 'rgba(65,58,44,0.7)'); eR.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = eR; ctx.fillRect(W-28, 0, 28, H)

  // Rubber tears
  for (let i = 0; i < 18; i++) {
    const x = rnd()*W, y = rnd()*H, len = 10 + rnd()*40, ang = rnd()*Math.PI
    ctx.strokeStyle = 'rgba(8,8,6,0.6)'; ctx.lineWidth = 0.5 + rnd()
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, BL/2); return tex
}

function makeCardboardTex(seed = 0) {
  const S = 512
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  const browns = ['#c8a870', '#be9e65', '#d4b47a', '#c0a060', '#caa870']
  ctx.fillStyle = browns[seed % browns.length]; ctx.fillRect(0, 0, S, S)

  // Corrugation micro lines
  for (let y = 0; y < S; y += 3) {
    const a = 0.04 + rnd()*0.04
    ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, y, S, 1)
    ctx.fillStyle = `rgba(255,255,255,${a*0.4})`; ctx.fillRect(0, y+1, S, 1)
  }

  // Crease marks
  for (let i = 0; i < 10 + seed*2; i++) {
    const x = rnd()*S, y = rnd()*S, ang = rnd()*Math.PI, len = 30 + rnd()*140
    const alpha = 0.35 + rnd()*0.4
    ctx.strokeStyle = `rgba(70,48,20,${alpha})`; ctx.lineWidth = 1 + rnd()*2.5
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke()
    ctx.strokeStyle = `rgba(220,190,130,${alpha*0.4})`; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(x+1, y+1); ctx.lineTo(x+Math.cos(ang)*len+1, y+Math.sin(ang)*len+1); ctx.stroke()
  }

  // Tape strip
  const ty = 220 + seed*18
  const tg = ctx.createLinearGradient(0, ty, 0, ty+38)
  tg.addColorStop(0,   'rgba(195,188,115,0.75)')
  tg.addColorStop(0.5, 'rgba(210,203,128,0.85)')
  tg.addColorStop(1,   'rgba(195,188,115,0.75)')
  ctx.fillStyle = tg; ctx.fillRect(0, ty, S, 38)
  ctx.strokeStyle = 'rgba(150,140,80,0.5)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(S, ty); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, ty+38); ctx.lineTo(S, ty+38); ctx.stroke()

  // Moisture deformation stains
  for (let i = 0; i < 3 + seed; i++) {
    const x = rnd()*S, y = rnd()*S, r = 20 + rnd()*60
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(90,62,28,${0.2 + rnd()*0.22})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
  }

  // Faint printed text
  ctx.save()
  ctx.font = 'bold 38px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = `rgba(78,52,22,${0.12 + rnd()*0.10})`
  ctx.fillText('FRAGILE', S/2, S/2 - 55)
  ctx.font = '22px monospace'
  ctx.fillText('↑ THIS SIDE UP ↑', S/2, S/2 + 60)
  ctx.restore()

  return new THREE.CanvasTexture(c)
}

function makeCorrugatedMetal() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#686e78'; ctx.fillRect(0, 0, 256, 512)
  for (let x = 0; x < 256; x += 20) {
    const g = ctx.createLinearGradient(x, 0, x+20, 0)
    g.addColorStop(0,    'rgba(255,255,255,0.07)')
    g.addColorStop(0.35, 'rgba(0,0,0,0.08)')
    g.addColorStop(1,    'rgba(255,255,255,0.06)')
    ctx.fillStyle = g; ctx.fillRect(x, 0, 20, 512)
  }
  for (let i = 0; i < 25; i++) {
    const y = rnd()*512
    ctx.strokeStyle = `rgba(200,198,188,${0.08 + rnd()*0.12})`
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(256,y); ctx.stroke()
  }
  // Bolt + rust streaks
  for (let bx = 20; bx < 256; bx += 40) {
    for (let by = 40; by < 512; by += 80) {
      ctx.fillStyle = 'rgba(130,60,10,0.5)'
      ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI*2); ctx.fill()
      const sg = ctx.createLinearGradient(bx, by, bx+2, by+28)
      sg.addColorStop(0, 'rgba(130,60,10,0.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = sg; ctx.fillRect(bx-1, by, 4, 28)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 3); return tex
}

// ── Materials ─────────────────────────────────────────────────────────────────
function buildMaterials() {
  const B = THREE.MeshStandardMaterial
  const P = THREE.MeshPhysicalMaterial
  return {
    floor:    new B({ map:makeConcreteFloor(), roughness:0.92, metalness:0.02, envMapIntensity:0.25 }),
    wall:     new B({ map:makeCorrugatedMetal(), roughness:0.88, metalness:0.18 }),
    steel:    new B({ map:makeRustSteelTex('#4e5560'), roughness:0.72, metalness:0.65 }),
    steelB:   new B({ map:makeRustSteelTex('#3d4855'), roughness:0.68, metalness:0.70 }),
    roller:   new B({ map:makeRustSteelTex('#606468'), roughness:0.52, metalness:0.82 }),
    beltTop:  new B({ map:makeConveyorBeltTex(), roughness:0.88, metalness:0.02 }),
    beltSide: new B({ color:0x111110, roughness:0.92, metalness:0.01 }),
    fluoTube: new B({ color:0xddeeff, emissive:new THREE.Color(0xc0dcff), emissiveIntensity:2.2,
                      roughness:0.5, transparent:true, opacity:0.92 }),
    fluoHsg:  new B({ map:makeRustSteelTex('#606870'), roughness:0.72, metalness:0.55 }),
    card:     Array.from({length:5}, (_,i) => new B({ map:makeCardboardTex(i), roughness:0.90, metalness:0.0 })),
    cable:    new B({ color:0x181816, roughness:0.92, metalness:0.05 }),
    motorHsg: new B({ map:makeRustSteelTex('#4a5560'), roughness:0.60, metalness:0.75 }),
    ceiling:  new B({ color:0x2c3038, roughness:0.95, metalness:0.05 }),
  }
}

// ── Warehouse shell ────────────────────────────────────────────────────────────
function buildWarehouse(M) {
  // Floor
  const f = new THREE.Mesh(new THREE.PlaneGeometry(50, 38), M.floor)
  f.rotation.x = -Math.PI/2; f.receiveShadow = true; scene.add(f)

  // Walls
  const wallDefs = [
    [[50,10], [0,5,-19], [0,0,0]],
    [[50,10], [0,5, 19], [0,Math.PI,0]],
    [[38,10], [-25,5,0], [0,Math.PI/2,0]],
    [[38,10], [ 25,5,0], [0,-Math.PI/2,0]],
  ]
  wallDefs.forEach(([[w,h],[px,py,pz],[rx,ry,rz]]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), M.wall)
    m.position.set(px,py,pz); m.rotation.set(rx,ry,rz); m.receiveShadow = true; scene.add(m)
  })

  // Ceiling slab
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(50, 0.4, 38), M.ceiling)
  ceil.position.set(0, 9.8, 0); scene.add(ceil)

  // I-beam ceiling structure
  for (let x = -18; x <= 18; x += 9) {
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 38), M.steel)
    web.position.set(x, 8.8, 0); web.castShadow = true; scene.add(web)
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.09, 38), M.steel)
    top.position.set(x, 9.06, 0); scene.add(top)
    const bot = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.09, 38), M.steel)
    bot.position.set(x, 8.52, 0); scene.add(bot)
  }
  for (let z = -16; z <= 16; z += 4) {
    const cb = new THREE.Mesh(new THREE.BoxGeometry(50, 0.18, 0.14), M.steelB)
    cb.position.set(0, 8.54, z); cb.castShadow = true; scene.add(cb)
  }
}

// ── Conveyor belt assembly ────────────────────────────────────────────────────
function buildConveyor(M, startX, centerZ, topMat) {
  const FH = BH - 0.08, SEG = 2

  // Support frame (leg pairs every 2m)
  for (let x = startX + 1; x <= startX + BL - 1; x += SEG) {
    for (const dz of [-(BW/2 - 0.06), BW/2 - 0.06]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, FH, 0.07), M.steel)
      leg.position.set(x, FH/2, centerZ + dz); leg.castShadow = true; scene.add(leg)
      const fp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), M.steel)
      fp.position.set(x, 0.02, centerZ + dz); scene.add(fp)
    }
    const brace = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.12, 0.06, 0.06), M.steelB)
    brace.position.set(x, FH * 0.4, centerZ); scene.add(brace)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.12, 0.08, 0.09), M.steel)
    rail.position.set(x, FH - 0.04, centerZ); scene.add(rail)
  }

  // Longitudinal side rails
  for (const dz of [-(BW/2), BW/2]) {
    const lr = new THREE.Mesh(new THREE.BoxGeometry(BL, 0.09, 0.08), M.steelB)
    lr.position.set(startX + BL/2, FH, centerZ + dz); scene.add(lr)
  }

  // End drums + motor housing at drive end
  for (const [ex, isDrive] of [[startX, true], [startX + BL, false]]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, BW + 0.10, 20), M.roller)
    drum.rotation.z = Math.PI/2; drum.position.set(ex, BH - 0.01, centerZ); drum.castShadow = true; scene.add(drum)
    if (isDrive) {
      const mh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.44), M.motorHsg)
      mh.position.set(ex - 0.52, BH - 0.10, centerZ); mh.castShadow = true; scene.add(mh)
      for (let i = -1; i <= 1; i++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.50, 0.52), M.motorHsg)
        rib.position.set(ex - 0.52 + i*0.14, BH - 0.10, centerZ); scene.add(rib)
      }
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 10), M.roller)
      shaft.rotation.z = Math.PI/2; shaft.position.set(ex - 0.18, BH - 0.10, centerZ); scene.add(shaft)
    }
  }

  // Idler rollers
  for (let x = startX + 0.5; x < startX + BL; x += 0.55) {
    const rol = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, BW + 0.05, 10), M.roller)
    rol.rotation.z = Math.PI/2; rol.position.set(x, BH - 0.06, centerZ); scene.add(rol)
  }

  // Belt surface — BoxGeometry face order: +X,-X,+Y(top),-Y,+Z,-Z
  const beltGeo = new THREE.BoxGeometry(BL, 0.055, BW, Math.ceil(BL * 2), 1, 4)
  const belt = new THREE.Mesh(beltGeo, [
    M.beltSide, M.beltSide,  // +X, -X
    topMat,                  // +Y (top face — UV-scrolling)
    M.beltSide,              // -Y
    M.beltSide, M.beltSide,  // +Z, -Z
  ])
  belt.position.set(startX + BL/2, BH, centerZ)
  belt.castShadow = true; belt.receiveShadow = true; scene.add(belt)

  // Return strand (underside)
  const ret = new THREE.Mesh(new THREE.BoxGeometry(BL, 0.03, BW - 0.08), M.beltSide)
  ret.position.set(startX + BL/2, BH - 0.32, centerZ); scene.add(ret)

  // Tensioner
  const tens = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, BW - 0.1), M.steel)
  tens.position.set(startX + BL - 0.5, BH - 0.42, centerZ); tens.castShadow = true; scene.add(tens)
}

// ── Cardboard boxes ────────────────────────────────────────────────────────────
function buildBoxes(M, centerZ) {
  const sizes = [
    [0.48,0.42,0.44],[0.38,0.32,0.36],[0.62,0.52,0.58],
    [0.42,0.36,0.40],[0.52,0.44,0.48],[0.44,0.34,0.42],
    [0.36,0.30,0.34],[0.58,0.48,0.54],[0.46,0.38,0.44],
    [0.40,0.32,0.38],[0.55,0.45,0.50],
  ]
  const span = BL - 2
  return sizes.map(([bw,bh,bd], i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd), M.card[i % M.card.length])
    mesh.castShadow = true; mesh.receiveShadow = true
    const startX = BELT_START + 1.5 + i * (span / sizes.length)
    mesh.rotation.set(noise(0.015), noise(0.08), noise(0.015))
    mesh.position.set(startX, BH + bh/2, centerZ + noise(BW * 0.2))
    mesh.userData = { bh, baseY: BH + bh/2, vibPhase: rnd()*Math.PI*2 }
    scene.add(mesh)
    return mesh
  })
}

// ── Fluorescent lights ────────────────────────────────────────────────────────
function buildFluorescentLights(M) {
  const positions = [[-14,0],[-7,0],[0,0],[7,0],[14,0],[-10,-8],[10,-8]]
  return positions.map(([lx,lz], idx) => {
    // Housing box
    const hsg = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.22), M.fluoHsg)
    hsg.position.set(lx, 8.48, lz); hsg.castShadow = true; scene.add(hsg)

    // Two glass tubes
    for (const dz of [-0.065, 0.065]) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.4, 8), M.fluoTube)
      tube.rotation.z = Math.PI/2; tube.position.set(lx, 8.40, lz + dz); scene.add(tube)
    }

    // SpotLight
    const sl = new THREE.SpotLight(0xd4eaff, 45, 16, Math.PI*0.42, 0.40, 1.2)
    sl.position.set(lx, 8.35, lz)
    sl.target.position.set(lx, 0, lz)
    sl.castShadow = true
    sl.shadow.mapSize.width = sl.shadow.mapSize.height = 512
    sl.shadow.camera.near = 0.5; sl.shadow.camera.far = 16
    scene.add(sl); scene.add(sl.target)

    // Warm bounce point light (floor-level fill)
    const pt = new THREE.PointLight(0xfff0d8, 6, 8)
    pt.position.set(lx, 0.6, lz); scene.add(pt)

    return { sl, pt, baseIntensity: 45, flickering: idx === 3 }
  })
}

// ── Sagging cables (physics-imitated catenary curves) ─────────────────────────
function buildCables(M) {
  const catenary = (pts) => new THREE.CatmullRomCurve3(pts.map(([x,y,z]) => new THREE.Vector3(x,y,z)))

  const cables = [
    catenary([[-18,8.3,-6],[-8,7.6,-6],[0,8.0,-6],[9,7.7,-6],[18,8.1,-6]]),
    catenary([[-18,8.2, 7],[-5,7.4, 7],[8,7.8, 7],[18,8.2, 7]]),
    catenary([[-12,8.0, 0],[0,7.3, 0],[12,7.9, 0]]),
    catenary([[-18,7.8, 2],[-6,7.2, 2],[6,7.6, 2],[18,7.9, 2]]),
  ]
  cables.forEach(curve => {
    const geo = new THREE.TubeGeometry(curve, 48, 0.022, 6, false)
    const m = new THREE.Mesh(geo, M.cable); m.castShadow = true; scene.add(m)
  })

  // Wall conduit
  const cond1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,9,8), M.cable)
  cond1.position.set(-24.5, 3.5, 0); cond1.rotation.z = Math.PI/2; scene.add(cond1)
  const cond2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,6,8), M.cable)
  cond2.position.set(-24.5, 4.8, -5); cond2.rotation.z = Math.PI/2; scene.add(cond2)
}

// ── Dust particles ────────────────────────────────────────────────────────────
function buildDust() {
  const N = 400
  dustGeo = new THREE.BufferGeometry()
  dustPos = new Float32Array(N * 3)
  dustVel = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    dustPos[i*3]   = noise(44)
    dustPos[i*3+1] = 0.5 + rnd()*8
    dustPos[i*3+2] = noise(32)
    dustVel[i*3]   = noise(0.014)
    dustVel[i*3+1] = 0.003 + rnd()*0.012
    dustVel[i*3+2] = noise(0.012)
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xd0c8b8, size: 0.06, transparent: true, opacity: 0.40,
    sizeAttenuation: true, depthWrite: false,
  })
  scene.add(new THREE.Points(dustGeo, mat))
}

// ── Animation loop ────────────────────────────────────────────────────────────
function animate(ts, M, lights) {
  rafId = requestAnimationFrame(t => animate(t, M, lights))
  const dt = 0.016

  // Belt UV scroll
  M.beltTop.map.offset.x += BSP * dt * 0.095
  if (M.beltTop.map.offset.x > 1) M.beltTop.map.offset.x -= 1

  // Box movement + vibration
  vibratePhase += dt * 30
  boxList.forEach(box => {
    box.position.x += BSP * dt
    if (box.position.x > BELT_END - 0.6) box.position.x = BELT_START + 0.9
    const v = Math.sin(vibratePhase + box.userData.vibPhase)
    box.position.y = box.userData.baseY + v * 0.0018
    box.rotation.z = Math.sin(vibratePhase * 0.5 + box.userData.vibPhase) * 0.003
  })

  // Fluorescent flicker
  flickerTimer += dt
  if (flickerTimer > 0.07) {
    flickerTimer = 0
    lights.forEach(l => {
      if (l.flickering && rnd() > 0.85) {
        l.sl.intensity = l.baseIntensity * (0.25 + rnd() * 0.75)
      } else {
        l.sl.intensity = l.baseIntensity
      }
    })
  }

  // Dust drift
  for (let i = 0; i < 400; i++) {
    dustPos[i*3]   += dustVel[i*3]
    dustPos[i*3+1] += dustVel[i*3+1]
    dustPos[i*3+2] += dustVel[i*3+2]
    if (dustPos[i*3+1] > 8.8) {
      dustPos[i*3] = noise(44); dustPos[i*3+1] = 0.3; dustPos[i*3+2] = noise(32)
    }
  }
  dustGeo.attributes.position.needsUpdate = true

  controls.update()
  composer.render()
}

// ── Public init ────────────────────────────────────────────────────────────────
export function initConveyorScene(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1
  container.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d1018)
  scene.fog = new THREE.FogExp2(0x18202e, 0.010)

  // 24mm wide-angle, low-angle camera (per JSON spec)
  camera = new THREE.PerspectiveCamera(72, container.clientWidth / container.clientHeight, 0.05, 150)
  camera.position.set(-14, 2.8, 10)  // side-low angle showing belt length

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(1, 0.9, 0)
  controls.enableDamping = true; controls.dampingFactor = 0.06
  controls.minDistance = 1.2; controls.maxDistance = 45
  controls.maxPolarAngle = Math.PI * 0.53
  controls.update()

  // Post-processing pipeline
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.40, 0.60, 0.78
  ))
  composer.addPass(new BokehPass(scene, camera, {
    focus: 10.5, aperture: 0.00012, maxblur: 0.007,
    width: container.clientWidth, height: container.clientHeight,
  }))

  // Ambient fill (dim; fluorescent spots dominate)
  scene.add(new THREE.AmbientLight(0x2a3848, 2.5))
  scene.add(new THREE.HemisphereLight(0x405070, 0x200e06, 0.8))

  const M = buildMaterials()
  beltMat = M.beltTop

  buildWarehouse(M)
  buildConveyor(M, BELT_START, 0, beltMat)
  const lights = buildFluorescentLights(M)
  boxList = buildBoxes(M, 0)
  buildCables(M)
  buildDust()

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight
    renderer.setSize(w, h); composer.setSize(w, h)
    camera.aspect = w / h; camera.updateProjectionMatrix()
  })
  ro.observe(container)

  requestAnimationFrame(ts => animate(ts, M, lights))

  return () => {
    cancelAnimationFrame(rafId)
    ro.disconnect()
    try { composer.dispose() } catch (_) {}
    renderer.dispose()
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
  }
}
