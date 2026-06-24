/**
 * Industrial Cooling Tower – Circulating Water System
 * Photorealistic PBR scene · Real-world scale (meters)
 */
import * as THREE from 'three'
import { OrbitControls }   from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// ── Real-world dimensions ─────────────────────────────────────────────────────
const TW = 4.6, TD = 3.9, TH = 5.4          // tower W/D/H
const TZ = -9.5                               // tower centre Z
const P1X = -4.8, P2X = 4.8, PZ = 1.4       // pump positions
const PLAT_Y = 1.15                           // platform deck height
const HDR_Y  = 3.6                            // hot-return header height
const SUC_Y  = 0.72                           // suction header height
const PM = 0.14                               // main pipe radius (DN280)
const PB = 0.085                              // branch pipe radius (DN170)
const PS = 0.055                              // small pipe radius (DN110)

// Runtime handles
let renderer, scene, camera, controls, composer
let fanGroup = null
let steamGeo, steamPos, steamVel
let rafId
let flowMat = null   // UV-scrolling water material

const rnd = () => Math.random()
const rn  = a  => (rnd() - .5) * a
const V3  = (x, y, z) => new THREE.Vector3(x, y, z)

// ─────────────────────────────────────────────────────────────────────────────
// Canvas texture generators
// ─────────────────────────────────────────────────────────────────────────────

function makeGalvanizedTex() {
  const S = 1024
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#8a9298'; ctx.fillRect(0, 0, S, S)

  // Zinc spangle crystallite facets
  for (let i = 0; i < 140; i++) {
    const x = rnd()*S, y = rnd()*S, r = 18+rnd()*55
    const sides = 4+Math.floor(rnd()*4), ang0 = rnd()*Math.PI
    ctx.save(); ctx.translate(x, y)
    ctx.beginPath()
    for (let j = 0; j < sides; j++) {
      const a = ang0 + j/sides*Math.PI*2 + rn(0.25)
      const rr = r*(0.5+rnd()*0.5)
      j===0 ? ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr)
             : ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr)
    }
    ctx.closePath()
    const v = 115+Math.floor(rnd()*35)
    ctx.fillStyle   = `rgba(${v+4},${v+7},${v},0.20)`;  ctx.fill()
    ctx.strokeStyle = `rgba(${v-22},${v-18},${v-28},0.24)`; ctx.lineWidth=0.6; ctx.stroke()
    ctx.restore()
  }

  // Horizontal corrugation bands
  for (let y = 0; y < S; y += 20) {
    const g = ctx.createLinearGradient(0, y, 0, y+20)
    g.addColorStop(0,   'rgba(255,255,255,0.07)')
    g.addColorStop(0.45,'rgba(0,0,0,0.05)')
    g.addColorStop(1,   'rgba(255,255,255,0.04)')
    ctx.fillStyle = g; ctx.fillRect(0, y, S, 20)
  }

  // Water-stain vertical streaks
  for (let i = 0; i < 24; i++) {
    const x = rnd()*S, w = 2+rnd()*10, h = 50+rnd()*200, y0 = rnd()*(S-h)
    const g = ctx.createLinearGradient(x, y0, x, y0+h)
    g.addColorStop(0,   'rgba(45,55,65,0.0)')
    g.addColorStop(0.25,`rgba(45,55,65,${0.14+rnd()*0.14})`)
    g.addColorStop(0.8, `rgba(45,55,65,${0.08+rnd()*0.08})`)
    g.addColorStop(1,   'rgba(45,55,65,0.0)')
    ctx.fillStyle = g; ctx.fillRect(x, y0, w, h)
  }

  // White zinc-oxide oxidation patches
  for (let i = 0; i < 10; i++) {
    const x = rnd()*S, y = rnd()*S, r = 25+rnd()*70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(218,224,215,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
  }

  // Rust bleed from fasteners
  for (let i = 0; i < 40; i++) {
    const x = rnd()*S, y = rnd()*S
    ctx.fillStyle = '#151c20'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill()
    const rg = ctx.createLinearGradient(x, y, x+rn(5), y+12+rnd()*35)
    rg.addColorStop(0, `rgba(135,75,18,${0.45+rnd()*0.3})`); rg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle = rg; ctx.fillRect(x-2.5, y, 5, 38+rnd()*38)
  }

  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t
}

function makeCarbonSteelTex() {
  const S = 512
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#2c3238'; ctx.fillRect(0, 0, S, S)

  // Mill scale texture
  for (let i = 0; i < 2000; i++) {
    const v = rn(20)
    ctx.fillStyle = `rgba(${44+v},${50+v},${58+v},0.28)`
    ctx.fillRect(rnd()*S, rnd()*S, 2+rnd()*5, 1+rnd()*4)
  }

  // Rust spots
  for (let i = 0; i < 20; i++) {
    const x=rnd()*S, y=rnd()*S, r=5+rnd()*30
    const rR=98+Math.floor(rnd()*52), rG=38+Math.floor(rnd()*22)
    const g = ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,   `rgba(${rR},${rG},8,${0.65+rnd()*0.3})`)
    g.addColorStop(0.55,`rgba(${rR-18},${rG-10},5,0.42)`)
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  }

  // Red anti-rust primer peeking through
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle=`rgba(158,52,28,${0.32+rnd()*0.38})`
    ctx.beginPath(); ctx.arc(rnd()*S,rnd()*S,4+rnd()*14,0,Math.PI*2); ctx.fill()
  }

  // Scratches
  for (let i = 0; i < 35; i++) {
    const x=rnd()*S, y=rnd()*S, len=18+rnd()*85, a=rnd()*Math.PI
    ctx.strokeStyle=`rgba(175,168,150,${0.12+rnd()*0.22})`; ctx.lineWidth=0.5+rnd()*1.5
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len); ctx.stroke()
  }

  const t = new THREE.CanvasTexture(c)
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,4); return t
}

function makeConcreteFloorTex() {
  const S = 1024
  const c = document.createElement('canvas'); c.width=S; c.height=S
  const ctx = c.getContext('2d')
  ctx.fillStyle='#696b6d'; ctx.fillRect(0,0,S,S)
  for (let i=0; i<16000; i++) {
    const v=76+Math.floor(rnd()*26); ctx.fillStyle=`rgb(${v},${v},${v-2})`
    ctx.beginPath(); ctx.arc(rnd()*S,rnd()*S,rnd()*2,0,Math.PI*2); ctx.fill()
  }
  ctx.strokeStyle='#484a4c'; ctx.lineWidth=3.5
  for (let i=0; i<=4; i++) {
    const p=i*(S/4)
    ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,S); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(S,p); ctx.stroke()
  }
  for (let i=0; i<10; i++) {
    const x=rnd()*S, y=rnd()*S, rx=35+rnd()*90, ry=18+rnd()*55
    const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(rx,ry))
    g.addColorStop(0,`rgba(38,40,44,${0.38+rnd()*0.22})`); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.save(); ctx.translate(x,y); ctx.scale(rx/ry,1); ctx.translate(-x,-y)
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,ry,ry,0,0,Math.PI*2); ctx.fill()
    ctx.restore()
  }
  for (let i=0; i<6; i++) {
    const x=rnd()*S, y=rnd()*S, r=12+rnd()*40
    const g=ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(8,8,6,${0.60+rnd()*0.3})`); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  }
  // Drainage grooves
  ctx.fillStyle='rgba(38,40,43,0.75)'; ctx.fillRect(S*0.485,0,S*0.03,S)
  ctx.fillStyle='rgba(38,40,43,0.55)'; ctx.fillRect(0,S*0.485,S,S*0.03)
  // Yellow line (faded)
  ctx.strokeStyle='rgba(195,175,28,0.42)'; ctx.lineWidth=13; ctx.setLineDash([55,22])
  ctx.beginPath(); ctx.moveTo(0,S*0.22); ctx.lineTo(S,S*0.22); ctx.stroke()
  ctx.setLineDash([])
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(5,7); return t
}

function makeGratingTex() {
  const W=128, H=128; const c=document.createElement('canvas'); c.width=W; c.height=H
  const ctx=c.getContext('2d'); ctx.fillStyle='#232a2d'; ctx.fillRect(0,0,W,H)
  ctx.fillStyle='#374044'
  for (let x=0; x<W; x+=8) ctx.fillRect(x,0,4,H)
  for (let y=0; y<H; y+=8) ctx.fillRect(0,y,W,4)
  ctx.fillStyle='#111618'
  for (let x=4; x<W; x+=8) for (let y=4; y<H; y+=8) ctx.fillRect(x,y,4,4)
  for (let i=0; i<25; i++) {
    ctx.fillStyle=`rgba(105,48,8,${0.28+rnd()*0.3})`
    ctx.fillRect(Math.floor(rnd()*W/8)*8,Math.floor(rnd()*H/8)*8,4+rnd()*4,rnd()*7)
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,8); return t
}

function makeGaugeFaceTex() {
  const S=256; const c=document.createElement('canvas'); c.width=S; c.height=S
  const ctx=c.getContext('2d')
  ctx.fillStyle='#ede7d2'; ctx.beginPath(); ctx.arc(S/2,S/2,S/2-1,0,Math.PI*2); ctx.fill()
  ctx.strokeStyle='#b0a890'; ctx.lineWidth=5
  ctx.beginPath(); ctx.arc(S/2,S/2,S/2-4,0,Math.PI*2); ctx.stroke()
  ctx.strokeStyle='#1a1a18'; ctx.lineWidth=2.5
  for (let i=0; i<=10; i++) {
    const a=-Math.PI*0.75+i*(Math.PI*1.5/10)
    ctx.beginPath(); ctx.moveTo(S/2+Math.cos(a)*(S/2-12),S/2+Math.sin(a)*(S/2-12))
    ctx.lineTo(S/2+Math.cos(a)*(S/2-22),S/2+Math.sin(a)*(S/2-22)); ctx.stroke()
  }
  ctx.lineWidth=1
  for (let i=0; i<=50; i++) {
    if (i%5===0) continue
    const a=-Math.PI*0.75+i*(Math.PI*1.5/50)
    ctx.beginPath(); ctx.moveTo(S/2+Math.cos(a)*(S/2-12),S/2+Math.sin(a)*(S/2-12))
    ctx.lineTo(S/2+Math.cos(a)*(S/2-18),S/2+Math.sin(a)*(S/2-18)); ctx.stroke()
  }
  ctx.strokeStyle='#c42010'; ctx.lineWidth=7
  ctx.beginPath(); ctx.arc(S/2,S/2,S/2-16,Math.PI*0.48,Math.PI*0.75); ctx.stroke()
  const na=-Math.PI*0.75+0.42*Math.PI*1.5
  ctx.strokeStyle='#c42010'; ctx.lineWidth=2.8
  ctx.beginPath()
  ctx.moveTo(S/2+Math.cos(na+Math.PI)*11,S/2+Math.sin(na+Math.PI)*11)
  ctx.lineTo(S/2+Math.cos(na)*75,S/2+Math.sin(na)*75); ctx.stroke()
  ctx.fillStyle='#808080'; ctx.beginPath(); ctx.arc(S/2,S/2,5.5,0,Math.PI*2); ctx.fill()
  ctx.font='bold 17px sans-serif'; ctx.fillStyle='#1a1a18'; ctx.textAlign='center'
  ctx.fillText('MPa',S/2,S*0.72)
  return new THREE.CanvasTexture(c)
}

function makeFlowTex() {
  const c=document.createElement('canvas'); c.width=64; c.height=256
  const ctx=c.getContext('2d'); ctx.fillStyle='#081e38'; ctx.fillRect(0,0,64,256)
  for (let y=0; y<256; y+=14) {
    const g=ctx.createLinearGradient(0,y,0,y+14)
    g.addColorStop(0,'rgba(28,95,158,0.0)'); g.addColorStop(0.35,'rgba(38,118,188,0.65)')
    g.addColorStop(0.65,'rgba(28,95,155,0.45)'); g.addColorStop(1,'rgba(18,78,138,0.0)')
    ctx.fillStyle=g; ctx.fillRect(0,y,64,14)
  }
  for (let i=0; i<60; i++) {
    ctx.fillStyle=`rgba(75,165,235,${0.18+rnd()*0.32})`
    ctx.fillRect(rnd()*64,rnd()*256,2,3+rnd()*9)
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,3); return t
}

// ── Material library ──────────────────────────────────────────────────────────
function buildMaterials() {
  const galvTex    = makeGalvanizedTex()
  const steelTex   = makeCarbonSteelTex()
  const concTex    = makeConcreteFloorTex()
  const gratingTex = makeGratingTex()
  const gaugeTex   = makeGaugeFaceTex()
  flowMat = new THREE.MeshStandardMaterial({
    map: makeFlowTex(), roughness: 0.12, metalness: 0.0,
    transparent: true, opacity: 0.82,
  })

  return {
    galv:    new THREE.MeshStandardMaterial({ map:galvTex,    roughness:0.68, metalness:0.55, envMapIntensity:1.2 }),
    steel:   new THREE.MeshStandardMaterial({ map:steelTex,   roughness:0.72, metalness:0.62, envMapIntensity:1.0 }),
    stainless: new THREE.MeshStandardMaterial({ color:0x9aa4a8, roughness:0.28, metalness:0.82, envMapIntensity:1.8 }),
    floor:   new THREE.MeshStandardMaterial({ map:concTex,   roughness:0.92, metalness:0.02 }),
    grating: new THREE.MeshStandardMaterial({ map:gratingTex,roughness:0.85, metalness:0.35, side:THREE.DoubleSide }),
    concrete:new THREE.MeshStandardMaterial({ color:0x888a8c, roughness:0.94, metalness:0.0  }),
    railing: new THREE.MeshStandardMaterial({ color:0xdea020, roughness:0.55, metalness:0.40 }), // yellow
    yellow:  new THREE.MeshStandardMaterial({ color:0xe5b525, roughness:0.65, metalness:0.15 }),
    motor:   new THREE.MeshStandardMaterial({ color:0x2e3840, roughness:0.65, metalness:0.58, envMapIntensity:1.0 }),
    motorFin:new THREE.MeshStandardMaterial({ color:0x556070, roughness:0.60, metalness:0.65 }),
    coupling:new THREE.MeshStandardMaterial({ color:0x1a2028, roughness:0.82, metalness:0.50 }),
    fan:     new THREE.MeshStandardMaterial({ color:0x3a4450, roughness:0.75, metalness:0.55, side:THREE.DoubleSide }),
    gauge:   new THREE.MeshStandardMaterial({ map:gaugeTex,  roughness:0.30, metalness:0.60 }),
    gaugeHsg:new THREE.MeshStandardMaterial({ color:0x303840, roughness:0.45, metalness:0.70 }),
    water:   flowMat,
    insul:   new THREE.MeshStandardMaterial({ color:0xc8c0a0, roughness:0.92, metalness:0.00 }),
    louver:  new THREE.MeshStandardMaterial({ color:0x707880, roughness:0.78, metalness:0.40, side:THREE.DoubleSide }),
    basin:   new THREE.MeshStandardMaterial({ color:0x5a6265, roughness:0.90, metalness:0.04 }),
    glass:   new THREE.MeshStandardMaterial({ color:0x88aacc, roughness:0.10, metalness:0.05, transparent:true, opacity:0.38 }),
    bolt:    new THREE.MeshStandardMaterial({ color:0x282e34, roughness:0.50, metalness:0.75 }),
    pumpcas: new THREE.MeshStandardMaterial({ color:0x354250, roughness:0.60, metalness:0.62, envMapIntensity:1.1 }),
  }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
let _scene  // ref set in init
const UP = new THREE.Vector3(0, 1, 0)

function addMesh(geo, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0, cast=true) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(px,py,pz); m.rotation.set(rx,ry,rz)
  m.castShadow=cast; m.receiveShadow=true; _scene.add(m); return m
}

// Pipe segment between two points
function pipe(p1, p2, r, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1)
  const len = dir.length()
  const mid = new THREE.Vector3().addVectors(p1,p2).multiplyScalar(0.5)
  const geo = new THREE.CylinderGeometry(r, r, len, 18)
  const m = new THREE.Mesh(geo, mat)
  m.position.copy(mid)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  m.castShadow=true; m.receiveShadow=true; _scene.add(m); return m
}

// Flanged joint (disc + 8 bolts)
function flange(pos, axis, r, mat, boltMat) {
  const fr = r*1.85, ft=0.065
  const geo = new THREE.CylinderGeometry(fr, fr, ft, 32)
  const m = new THREE.Mesh(geo, mat)
  m.position.copy(pos)
  m.quaternion.setFromUnitVectors(UP, axis.clone().normalize())
  m.castShadow=true; _scene.add(m)
  // bolts
  const bc = fr*0.80, nb = r>0.10 ? 10 : 8
  for (let i=0; i<nb; i++) {
    const a = i/nb*Math.PI*2, bLen=0.12
    const bGeo = new THREE.CylinderGeometry(0.013,0.013,bLen,8)
    const bolt = new THREE.Mesh(bGeo, boltMat)
    bolt.position.copy(pos)
    const ax=axis.clone().normalize()
    const perp = Math.abs(ax.y) < 0.9
      ? new THREE.Vector3(0,1,0).cross(ax).normalize()
      : new THREE.Vector3(1,0,0).cross(ax).normalize()
    const perp2 = ax.clone().cross(perp)
    bolt.position.addScaledVector(perp,  Math.cos(a)*bc)
    bolt.position.addScaledVector(perp2, Math.sin(a)*bc)
    bolt.quaternion.setFromUnitVectors(UP, ax)
    _scene.add(bolt)
    // nut caps
    for (const s of [-1,1]) {
      const nh = new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.020,0.02,6), boltMat)
      nh.position.copy(bolt.position)
      nh.position.addScaledVector(ax, s*bLen*0.5)
      nh.quaternion.copy(bolt.quaternion); _scene.add(nh)
    }
  }
}

// Gate valve (body + handwheel + spindle)
function gateValve(pos, axis, r, mat, railMat) {
  const ax = axis.clone().normalize()
  const bodyH=r*2.8, bodyR=r*1.4
  const bGeo=new THREE.CylinderGeometry(bodyR,bodyR,bodyH,16)
  const bm=new THREE.Mesh(bGeo,mat); bm.position.copy(pos)
  bm.quaternion.setFromUnitVectors(UP,ax); bm.castShadow=true; _scene.add(bm)
  // bonnet (vertical extension)
  const bonnH=r*2.2
  const bnGeo=new THREE.CylinderGeometry(r*0.8,r*0.8,bonnH,12)
  const bn=new THREE.Mesh(bnGeo,mat); bn.position.copy(pos)
  const up2 = new THREE.Vector3(0,1,0)
  bn.position.addScaledVector(up2, bonnH*0.5+bodyR*0.2); _scene.add(bn)
  // spindle
  const spGeo=new THREE.CylinderGeometry(0.018,0.018,r*3,8)
  const sp=new THREE.Mesh(spGeo,mat); sp.position.copy(pos)
  sp.position.addScaledVector(up2,r*2.5); _scene.add(sp)
  // handwheel (torus)
  const hwR=r*1.8
  const hwGeo=new THREE.TorusGeometry(hwR,0.022,8,28)
  const hw=new THREE.Mesh(hwGeo,railMat); hw.position.copy(pos)
  hw.position.addScaledVector(up2,r*3.5); _scene.add(hw)
  // spokes
  for (let i=0; i<5; i++) {
    const a=i/5*Math.PI*2
    const sg=new THREE.CylinderGeometry(0.012,0.012,hwR*2,6)
    const sm=new THREE.Mesh(sg,railMat); sm.rotation.z=Math.PI/2
    sm.position.copy(pos).addScaledVector(up2,r*3.5); _scene.add(sm)
    const sr=new THREE.Mesh(sg,railMat); sr.rotation.x=Math.PI/2
    sr.position.copy(pos).addScaledVector(up2,r*3.5); _scene.add(sr)
  }
}

// Pressure gauge (body + face + nozzle)
function pressureGauge(pos, dir, M) {
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.10,10),M.gaugeHsg)
  nozzle.position.copy(pos); const ax=dir.clone().normalize()
  nozzle.quaternion.setFromUnitVectors(UP,ax); _scene.add(nozzle)
  // housing cylinder
  const gpos=pos.clone().addScaledVector(ax, 0.12)
  const housing=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.065,20),M.gaugeHsg)
  housing.position.copy(gpos)
  housing.quaternion.setFromUnitVectors(UP,new THREE.Vector3(0,0,1)); _scene.add(housing)
  // glass face
  const face=new THREE.Mesh(new THREE.CircleGeometry(0.062,24),M.gauge)
  face.position.copy(gpos).addScaledVector(new THREE.Vector3(0,0,1),0.033+0.001); _scene.add(face)
}

// Pipe support (U-bolt + stanchion)
function pipeSupport(px,pz,pipeY, M) {
  // vertical stanchion
  const st=new THREE.Mesh(new THREE.BoxGeometry(0.06,pipeY+0.05,0.06),M.steel)
  st.position.set(px,pipeY*0.5,pz); st.castShadow=true; _scene.add(st)
  // horizontal cross-member
  const cm=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.06,0.06),M.steel)
  cm.position.set(px,pipeY+0.05,pz); _scene.add(cm)
  // U-bolt
  const ub=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.012,8,12,Math.PI),M.bolt)
  ub.position.set(px,pipeY+0.12,pz); ub.rotation.x=Math.PI; _scene.add(ub)
}

// Motor with cooling fins
function buildMotor(cx,cy,cz,M) {
  const L=0.82, R=0.20
  // main body
  const body=new THREE.Mesh(new THREE.CylinderGeometry(R,R,L,24),M.motor)
  body.rotation.z=Math.PI/2; body.position.set(cx,cy,cz); body.castShadow=true; _scene.add(body)
  // cooling fins
  for (let i=0; i<14; i++) {
    const fx=cx-L*0.42+i*(L*0.84/13)
    const fin=new THREE.Mesh(new THREE.CylinderGeometry(R+0.025,R+0.025,0.016,24),M.motorFin)
    fin.rotation.z=Math.PI/2; fin.position.set(fx,cy,cz); _scene.add(fin)
  }
  // terminal box
  const tb=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.14,0.20),M.steel)
  tb.position.set(cx,cy+R+0.05,cz); _scene.add(tb)
  // shaft stub (right side)
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.12,12),M.stainless)
  shaft.rotation.z=Math.PI/2; shaft.position.set(cx+L*0.5+0.06,cy,cz); _scene.add(shaft)
  return cx+L*0.5+0.06   // shaft end X
}

// Centrifugal pump volute casing
function buildPump(cx,cy,cz,side, M) {
  // Baseplate
  const bp=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.06,0.90),M.steel)
  bp.position.set(cx,cy+0.03,cz); bp.castShadow=true; bp.receiveShadow=true; _scene.add(bp)
  // Concrete inertia block
  const ib=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.22,1.0),M.concrete)
  ib.position.set(cx,cy-0.11,cz); ib.receiveShadow=true; _scene.add(ib)

  // Volute casing (D-shaped approximation)
  const casPY = cy+0.06+0.24  // top of baseplate + casing centre
  const cas=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.26,0.38,20),M.pumpcas)
  cas.position.set(cx,casPY,cz); cas.castShadow=true; _scene.add(cas)
  // Volute scroll (box that makes D-shape)
  const scroll=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.38,0.22),M.pumpcas)
  scroll.position.set(cx+(side*0.22),casPY,cz); _scene.add(scroll)

  // Suction nozzle (horizontal, facing front)
  const snLen=0.28
  const sn=new THREE.Mesh(new THREE.CylinderGeometry(PB,PB,snLen,16),M.pumpcas)
  sn.rotation.x=Math.PI/2; sn.position.set(cx,casPY,cz+0.24+snLen*0.5); _scene.add(sn)
  // Suction flange
  flange(V3(cx,casPY,cz+0.24+snLen),new THREE.Vector3(0,0,1),PB,M.steel,M.bolt)

  // Discharge nozzle (vertical upward)
  const dnLen=0.22
  const dn=new THREE.Mesh(new THREE.CylinderGeometry(PS,PS,dnLen,16),M.pumpcas)
  dn.position.set(cx,casPY+0.24+dnLen*0.5,cz-0.05); _scene.add(dn)
  // Discharge flange
  flange(V3(cx,casPY+0.24+dnLen,cz-0.05),new THREE.Vector3(0,1,0),PS,M.steel,M.bolt)
  const discY = casPY+0.24+dnLen

  // Coupling guard (between pump and motor)
  const cg=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.26,16),M.coupling)
  cg.rotation.z=Math.PI/2; cg.position.set(cx+(side*0.5),casPY,cz); _scene.add(cg)

  // Motor (on the other side of coupling)
  const shaftX = buildMotor(cx+side*1.05, casPY, cz, M)

  // Nameplate holder
  const np=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.10,0.02),M.stainless)
  np.position.set(cx,cy+0.06+0.42,cz+0.27); _scene.add(np)

  return { discY, discX: cx, discZ: cz-0.05 }
}

// ── Scene builders ─────────────────────────────────────────────────────────────

function buildFloor(M) {
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(36,28),M.floor)
  floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; _scene.add(floor)

  // Drainage channels (recessed strips)
  for (const [x,z,w,d] of [
    [0,0,0.18,18],[0,0,14,0.18]
  ]) {
    const dc=new THREE.Mesh(new THREE.BoxGeometry(w,0.04,d),M.basin)
    dc.position.set(x,-0.02,z); _scene.add(dc)
  }

  // Floor drain grates (small square grilles)
  for (const [x,z] of [[0,0],[5,-5],[-5,-5]]) {
    const dg=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.01,0.25),M.grating)
    dg.position.set(x,0.001,z); _scene.add(dg)
  }

  // Foundation pads for pipe supports
  for (const [x,z] of [[-3,0],[3,0],[-3,-5],[3,-5],[0,-7]]) {
    const pad=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.12,0.45),M.concrete)
    pad.position.set(x,-0.06,z); _scene.add(pad)
  }
}

function buildCoolingTower(M) {
  const HW=TW/2, HD=TD/2
  // ── Basin (concrete) ─────────────────────────────────────────────────────
  const basinH=1.35
  ;[
    [new THREE.BoxGeometry(TW+0.25,basinH,0.22),  [0,basinH/2,TZ+HD+0.11]],
    [new THREE.BoxGeometry(TW+0.25,basinH,0.22),  [0,basinH/2,TZ-HD-0.11]],
    [new THREE.BoxGeometry(0.22,basinH,TD+0.25),  [-HW-0.11,basinH/2,TZ]],
    [new THREE.BoxGeometry(0.22,basinH,TD+0.25),  [HW+0.11,basinH/2,TZ]],
    [new THREE.BoxGeometry(TW+0.25,0.20,TD+0.50), [0,-0.10,TZ]],            // floor slab
  ].forEach(([geo,[px,py,pz]])=>{
    const m=new THREE.Mesh(geo,M.basin); m.position.set(px,py,pz); m.receiveShadow=true; _scene.add(m)
  })

  // Basin water surface
  const wSurf=new THREE.Mesh(new THREE.PlaneGeometry(TW-0.24,TD-0.24),
    new THREE.MeshStandardMaterial({color:0x1a5a88,roughness:0.08,metalness:0.05,transparent:true,opacity:0.72}))
  wSurf.rotation.x=-Math.PI/2; wSurf.position.set(0,basinH*0.82,TZ); _scene.add(wSurf)

  // ── Lower air-intake louvres (front + back) ───────────────────────────────
  const louH=1.6, louCount=14
  for (const zSide of [TZ+HD, TZ-HD]) {
    for (let i=0; i<louCount; i++) {
      const y=basinH+0.08+i*(louH/louCount)
      const lx=(-HW+0.1)+i%2*0.0
      const slatGeo=new THREE.BoxGeometry(TW-0.04,0.025,0.085)
      const slat=new THREE.Mesh(slatGeo,M.louver)
      slat.position.set(0,y,zSide)
      slat.rotation.x=(zSide>TZ ? 1:-1)*0.40  // angled for airflow
      slat.castShadow=true; _scene.add(slat)
    }
  }
  // side louvres
  for (const xSide of [-HW, HW]) {
    for (let i=0; i<louCount; i++) {
      const y=basinH+0.08+i*(louH/louCount)
      const slatGeo=new THREE.BoxGeometry(0.085,0.025,TD-0.04)
      const slat=new THREE.Mesh(slatGeo,M.louver)
      slat.position.set(xSide,y,TZ); slat.rotation.z=(xSide>0?1:-1)*0.40; _scene.add(slat)
    }
  }

  // ── Tower shell (upper body above louvres) ────────────────────────────────
  const shellBot=basinH+louH, shellH=TH-shellBot
  ;[
    [new THREE.BoxGeometry(TW,shellH,0.06), [0,shellBot+shellH/2,TZ+HD], [0,0,0]],
    [new THREE.BoxGeometry(TW,shellH,0.06), [0,shellBot+shellH/2,TZ-HD], [0,0,0]],
    [new THREE.BoxGeometry(0.06,shellH,TD), [-HW,shellBot+shellH/2,TZ], [0,0,0]],
    [new THREE.BoxGeometry(0.06,shellH,TD), [HW,shellBot+shellH/2,TZ], [0,0,0]],
  ].forEach(([geo,[px,py,pz]])=>{
    const m=new THREE.Mesh(geo,M.galv); m.position.set(px,py,pz); m.castShadow=true; _scene.add(m)
  })

  // ── Drift eliminator (slotted panels at top of fill) ─────────────────────
  const deY=TH-1.0
  const deGeo=new THREE.BoxGeometry(TW-0.12,0.06,TD-0.12)
  const de=new THREE.Mesh(deGeo,M.louver); de.position.set(0,deY,TZ); _scene.add(de)

  // ── Water distribution header inside tower ────────────────────────────────
  const distY=TH-0.5
  for (let xi=-1.5; xi<=1.5; xi+=1.0) {
    const hdr=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,TD-0.2,10),M.stainless)
    hdr.rotation.x=Math.PI/2; hdr.position.set(xi,distY,TZ); _scene.add(hdr)
    // spray nozzles
    for (let zi=TZ-1.2; zi<=TZ+1.2; zi+=0.6) {
      const nz=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.018,0.06,8),M.stainless)
      nz.position.set(xi,distY-0.04,zi); _scene.add(nz)
    }
  }

  // ── Fan shroud (top cylinder) ─────────────────────────────────────────────
  const shroudR=Math.min(HW,HD)*0.90, shroudH=1.0
  const shroud=new THREE.Mesh(
    new THREE.CylinderGeometry(shroudR+0.06,shroudR,shroudH,32,1,true),M.galv)
  shroud.position.set(0,TH+shroudH/2,TZ); shroud.castShadow=true; _scene.add(shroud)
  // shroud top ring
  const ring=new THREE.Mesh(new THREE.TorusGeometry(shroudR+0.06,0.05,8,32),M.galv)
  ring.rotation.x=Math.PI/2; ring.position.set(0,TH+shroudH,TZ); _scene.add(ring)

  // ── Fan assembly (stored for animation) ───────────────────────────────────
  fanGroup=new THREE.Group(); fanGroup.position.set(0,TH+shroudH*0.55,TZ)
  _scene.add(fanGroup)

  // Hub
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.12,20),M.steel)
  hub.rotation.x=Math.PI/2; fanGroup.add(hub)  // horizontal axis

  // 6 blades
  for (let b=0; b<6; b++) {
    const a=b/6*Math.PI*2
    const blade=new THREE.Mesh(new THREE.BoxGeometry(shroudR*0.85,0.018,0.32),M.fan)
    blade.position.set(Math.cos(a)*shroudR*0.45, Math.sin(a)*shroudR*0.45, 0)
    blade.rotation.z=a+Math.PI/2  // angle around hub
    blade.rotation.x=0.32         // pitch angle (attack angle)
    blade.castShadow=true; fanGroup.add(blade)
  }

  // ── Structural columns on tower corners ───────────────────────────────────
  for (const [cx,cz] of [[-HW+0.06,TZ+HD-0.06],[-HW+0.06,TZ-HD+0.06],[HW-0.06,TZ+HD-0.06],[HW-0.06,TZ-HD+0.06]]) {
    const col=new THREE.Mesh(new THREE.BoxGeometry(0.14,TH,0.14),M.steel)
    col.position.set(cx,TH/2,cz); col.castShadow=true; _scene.add(col)
  }

  // ── Tower access ladder (side) ────────────────────────────────────────────
  const ladX=HW+0.12
  for (let y=0.5; y<TH; y+=0.35) {
    const rung=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.55,8),M.steel)
    rung.rotation.z=Math.PI/2; rung.position.set(ladX,y,TZ+HD-0.3); _scene.add(rung)
  }
  for (const dz of [-0.275, 0.275]) {
    const rail=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,TH,8),M.steel)
    rail.position.set(ladX,TH/2,TZ+HD-0.3+dz); _scene.add(rail)
  }
}

function buildPipework(M, discData) {
  const { d1, d2 } = discData
  const AX = new THREE.Vector3(1,0,0)
  const AY = new THREE.Vector3(0,1,0)
  const AZ = new THREE.Vector3(0,0,1)

  // ── Suction header (cold water from tower to pump inlet) ─────────────────
  // Tower basin outlet pipe
  const towerOutletZ = TZ+TD/2+0.11
  pipe(V3(0,SUC_Y,towerOutletZ),  V3(0,SUC_Y,2.5),    PM, M.steel)
  pipe(V3(-6.0,SUC_Y,2.5),        V3(6.0,SUC_Y,2.5),  PM, M.steel)
  flange(V3(0,SUC_Y,towerOutletZ+0.15), AZ, PM, M.steel, M.bolt)
  flange(V3(0,SUC_Y,2.5),  AX, PM, M.steel, M.bolt)  // tee manifold visual

  // Expansion joint (bellows) on suction header
  const expGeo=new THREE.CylinderGeometry(PM*1.25,PM*1.25,0.32,20)
  const exp=new THREE.Mesh(expGeo,M.insul); exp.position.set(0,SUC_Y,0.2); exp.rotation.x=Math.PI/2
  // add bellows ribs
  for (let i=0; i<7; i++) {
    const rib=new THREE.Mesh(new THREE.CylinderGeometry(PM*1.45,PM*1.45,0.025,20),M.stainless)
    rib.rotation.x=Math.PI/2; rib.position.set(0,SUC_Y,-0.14+i*0.048); _scene.add(rib)
  }

  // Branch legs from suction header to pump 1 & 2
  for (const [px,side] of [[P1X,-1],[P2X,1]]) {
    pipe(V3(px,SUC_Y,2.5), V3(px,SUC_Y,d1.discZ+0.30), PB, M.steel)
    flange(V3(px,SUC_Y,2.5), AX, PB, M.steel, M.bolt)
    // rise to pump nozzle
    pipe(V3(px,SUC_Y,d1.discZ+0.30), V3(px,d1.discY-0.22+0.40,d1.discZ+0.30), PB, M.steel)
  }

  // Pipe supports on suction header
  for (const px of [-4,0,4]) pipeSupport(px, 2.5, SUC_Y, M)

  // Isolation valves (pump suction side)
  gateValve(V3(P1X,SUC_Y+0.6, 2.1), AZ, PB, M.steel, M.railing)
  gateValve(V3(P2X,SUC_Y+0.6, 2.1), AZ, PB, M.steel, M.railing)

  // ── Discharge risers (pump to elevated header) ────────────────────────────
  for (const [px,disc] of [[P1X,d1],[P2X,d2]]) {
    pipe(V3(px,disc.discY,disc.discZ), V3(px,HDR_Y,disc.discZ), PS, M.steel)
    flange(V3(px,disc.discY+0.05,disc.discZ),AY,PS,M.steel,M.bolt)
    // check valve body (inline)
    const cvY=(disc.discY+HDR_Y)*0.45+disc.discY
    const cv=new THREE.Mesh(new THREE.BoxGeometry(PS*3.8,PS*2.8,PS*3.8),M.pumpcas)
    cv.position.set(px,cvY,disc.discZ); _scene.add(cv)
    flange(V3(px,cvY-PS*1.5,disc.discZ),AY,PS,M.steel,M.bolt)
    flange(V3(px,cvY+PS*1.5,disc.discZ),AY,PS,M.steel,M.bolt)
  }

  // ── Hot-return header (elevated, pump outlet → tower top) ─────────────────
  pipe(V3(P1X,HDR_Y,d1.discZ), V3(P2X,HDR_Y,d1.discZ),  PM, M.steel)
  pipe(V3(0,  HDR_Y,d1.discZ), V3(0,  HDR_Y,TZ+TD/2+0.1), PM, M.steel)
  // Flanges along header
  flange(V3(P1X,HDR_Y,d1.discZ), AX, PM, M.steel, M.bolt)
  flange(V3(P2X,HDR_Y,d1.discZ), AX, PM, M.steel, M.bolt)
  flange(V3(0,  HDR_Y,TZ+0.5),   AZ, PM, M.steel, M.bolt)

  // Pipe stanchions from platform to header
  for (const px of [P1X*0.5,0,P2X*0.5]) {
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.06,HDR_Y-PLAT_Y+0.05,0.06),M.steel)
    post.position.set(px,(HDR_Y+PLAT_Y)/2,d1.discZ-0.15); _scene.add(post)
    const bracket=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.055,0.10),M.steel)
    bracket.position.set(px,HDR_Y+0.035,d1.discZ-0.12); _scene.add(bracket)
  }

  // Expansion joint on hot-return header
  for (let i=0; i<7; i++) {
    const rib=new THREE.Mesh(new THREE.CylinderGeometry(PM*1.40,PM*1.40,0.03,20),M.stainless)
    rib.rotation.x=Math.PI/2; rib.position.set(-1.8+i*0.055,HDR_Y,d1.discZ); _scene.add(rib)
  }

  // Descending pipe into tower top
  pipe(V3(0,HDR_Y,TZ+TD/2+0.1), V3(0,TH-0.4,TZ+TD/2+0.1), PM, M.steel)
  pipe(V3(0,TH-0.4,TZ+TD/2+0.1),V3(0,TH-0.4,TZ-0.2),       PM, M.steel)
  flange(V3(0,TH-0.4,TZ+TD/2+0.1),AY,PM,M.steel,M.bolt)

  // ── Pressure gauges ───────────────────────────────────────────────────────
  pressureGauge(V3(P1X+0.22,SUC_Y+0.55,PZ-0.1), new THREE.Vector3(0,1,0), M)
  pressureGauge(V3(P2X-0.22,SUC_Y+0.55,PZ-0.1), new THREE.Vector3(0,1,0), M)
  pressureGauge(V3(P1X,HDR_Y+0.14,d1.discZ+0.20), new THREE.Vector3(0,1,0), M)
  pressureGauge(V3(P2X,HDR_Y+0.14,d1.discZ+0.20), new THREE.Vector3(0,1,0), M)
  // Temperature gauge on return header
  pressureGauge(V3(0,HDR_Y+0.14,TZ+1.5), new THREE.Vector3(0,1,0), M)

  // ── Flow water animation (translucent flow inside pipes) ──────────────────
  // Visible flow window on suction header (short transparent section)
  const sightGlass=new THREE.Mesh(new THREE.CylinderGeometry(PM*0.95,PM*0.95,0.35,16),M.water)
  sightGlass.rotation.x=Math.PI/2; sightGlass.position.set(0,SUC_Y,1.6); _scene.add(sightGlass)
  const sightGlass2=new THREE.Mesh(new THREE.CylinderGeometry(PM*0.95,PM*0.95,0.35,16),M.water)
  sightGlass2.rotation.z=Math.PI/2; sightGlass2.position.set(-2.5,HDR_Y,d1.discZ); _scene.add(sightGlass2)
}

function buildPlatform(M) {
  const PX1=-5.8, PX2=5.8, PZ1=-6.0, PZ2=-2.0
  const PW=PX2-PX1, PD=PZ2-PZ1

  // ── Support frame (H-beams) ───────────────────────────────────────────────
  for (const [px,pz] of [[PX1,PZ1],[PX1,PZ2],[PX2,PZ1],[PX2,PZ2]]) {
    // column
    const col=new THREE.Mesh(new THREE.BoxGeometry(0.14,PLAT_Y,0.14),M.steel)
    col.position.set(px,PLAT_Y/2,pz); col.castShadow=true; _scene.add(col)
    // base plate
    const bp=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.04,0.28),M.steel)
    bp.position.set(px,0.02,pz); _scene.add(bp)
    // anchor bolts
    for (const [dx,dz] of [[0.08,0.08],[0.08,-0.08],[-0.08,0.08],[-0.08,-0.08]]) {
      const ab=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.08,8),M.bolt)
      ab.position.set(px+dx,0.04,pz+dz); _scene.add(ab)
    }
  }
  // main beams (longitudinal)
  for (const pz of [PZ1,PZ2]) {
    const beam=new THREE.Mesh(new THREE.BoxGeometry(PW,0.20,0.12),M.steel)
    beam.position.set((PX1+PX2)/2,PLAT_Y-0.10,pz); _scene.add(beam)
  }
  // cross-beams
  for (const px of [PX1,(PX1+PX2)/2,PX2]) {
    const cb=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.16,PD),M.steel)
    cb.position.set(px,PLAT_Y-0.08,(PZ1+PZ2)/2); _scene.add(cb)
  }

  // ── Grating panels ────────────────────────────────────────────────────────
  const grating=new THREE.Mesh(new THREE.BoxGeometry(PW-0.04,0.05,PD-0.04),M.grating)
  grating.position.set((PX1+PX2)/2,PLAT_Y+0.025,(PZ1+PZ2)/2); grating.receiveShadow=true; _scene.add(grating)

  // ── Handrails ─────────────────────────────────────────────────────────────
  const railH=1.05, topR=0.028, midR=0.018
  const railSegs = [
    [[PX1,PLAT_Y+railH,PZ1],[PX2,PLAT_Y+railH,PZ1]],  // front
    [[PX1,PLAT_Y+railH,PZ2],[PX2,PLAT_Y+railH,PZ2]],  // back
    [[PX2,PLAT_Y+railH,PZ1],[PX2,PLAT_Y+railH,PZ2]],  // right
  ]
  railSegs.forEach(([a,b])=>{
    pipe(V3(...a),V3(...b),topR,M.railing)
    const mid=[...a]; mid[1]-=railH*0.44
    pipe(V3(...mid),V3(b[0],b[1]-railH*0.44,b[2]),midR,M.railing)
  })
  // Posts
  for (const [px,pz] of [[PX1,PZ1],[PX1,PZ2],[PX2,PZ1],[PX2,PZ2],
                          [(PX1+PX2)/2,PZ1],[(PX1+PX2)/2,PZ2],[PX2,(PZ1+PZ2)/2]]) {
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,railH,8),M.railing)
    post.position.set(px,PLAT_Y+railH/2,pz); _scene.add(post)
  }
  // Kick-plates
  const kp1=new THREE.Mesh(new THREE.BoxGeometry(PW,0.12,0.012),M.yellow)
  kp1.position.set((PX1+PX2)/2,PLAT_Y+0.06,PZ1); _scene.add(kp1)
  const kp2=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.12,PD),M.yellow)
  kp2.position.set(PX2,PLAT_Y+0.06,(PZ1+PZ2)/2); _scene.add(kp2)

  // ── Anti-slip stairs (left side, 9 steps) ────────────────────────────────
  const stepCount=9, stepH=PLAT_Y/stepCount, stepD=0.30, stairW=1.2
  const stairX=PX1-stairW/2-0.04
  for (let i=0; i<stepCount; i++) {
    // Tread (steel grating)
    const tread=new THREE.Mesh(new THREE.BoxGeometry(stairW,0.04,stepD+0.04),M.grating)
    tread.position.set(stairX,(i+1)*stepH-0.02,PZ2+stepD*(stepCount-i-0.5))
    tread.castShadow=true; tread.receiveShadow=true; _scene.add(tread)
    // Yellow nosing strip
    const nose=new THREE.Mesh(new THREE.BoxGeometry(stairW,0.04,0.05),M.yellow)
    nose.position.set(stairX,(i+1)*stepH+0.02,PZ2+stepD*(stepCount-i))
    _scene.add(nose)
    // Riser plate
    const riser=new THREE.Mesh(new THREE.BoxGeometry(stairW,stepH,0.012),M.steel)
    riser.position.set(stairX,(i+0.5)*stepH,PZ2+stepD*(stepCount-i))
    _scene.add(riser)
    // Side stringer (triangular fillet approximation)
    if (i===0 || i===stepCount-1) {
      for (const dx of [-stairW/2,stairW/2]) {
        const st=new THREE.Mesh(new THREE.BoxGeometry(0.012,stepH,stepD),M.steel)
        st.position.set(stairX+dx,(i+0.5)*stepH,PZ2+stepD*(stepCount-i-0.5)); _scene.add(st)
      }
    }
  }
  // Stair stringers (continuous)
  for (const dx of [-stairW/2-0.01,stairW/2+0.01]) {
    const sLen=Math.sqrt((PLAT_Y*PLAT_Y)+(stepD*stepCount*stepD*stepCount))*1.02
    const sg=new THREE.Mesh(new THREE.BoxGeometry(0.010,0.18,sLen),M.steel)
    sg.position.set(stairX+dx,PLAT_Y/2,PZ2+stepD*stepCount*0.5)
    sg.rotation.x=-Math.atan2(PLAT_Y,stepD*stepCount); _scene.add(sg)
  }
  // Stair handrails
  const sRailH=1.0
  for (const dx of [-stairW/2-0.06, stairW/2+0.06]) {
    const botP=V3(stairX+dx,0.02+sRailH,PZ2+stepD*stepCount+0.1)
    const topP=V3(stairX+dx,PLAT_Y+sRailH,PZ2+0.1)
    pipe(botP,topP,topR,M.railing)
    // bottom post
    const bp=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,sRailH,8),M.railing)
    bp.position.set(stairX+dx,sRailH/2,PZ2+stepD*stepCount+0.1); _scene.add(bp)
  }
}

// ── Steam / mist particles ────────────────────────────────────────────────────
function buildSteamParticles() {
  const N=500
  steamGeo=new THREE.BufferGeometry()
  steamPos=new Float32Array(N*3)
  steamVel=new Float32Array(N*3)
  for (let i=0; i<N; i++) {
    steamPos[i*3]  =rn(TW*0.45)
    steamPos[i*3+1]=TH+1.0+rnd()*3.0
    steamPos[i*3+2]=TZ+rn(TD*0.45)
    steamVel[i*3]  =rn(0.022)
    steamVel[i*3+1]=0.018+rnd()*0.035
    steamVel[i*3+2]=rn(0.022)
  }
  steamGeo.setAttribute('position',new THREE.BufferAttribute(steamPos,3))
  const mat=new THREE.PointsMaterial({
    color:0xe8f4ff, size:0.22, transparent:true, opacity:0.28,
    sizeAttenuation:true, depthWrite:false,
  })
  _scene.add(new THREE.Points(steamGeo,mat))
}

// ── Animation ─────────────────────────────────────────────────────────────────
function animate() {
  rafId=requestAnimationFrame(animate)
  const dt=0.016

  // Fan rotation
  if (fanGroup) fanGroup.rotation.z += dt*2.8

  // Steam particles
  if (steamPos) {
    for (let i=0; i<500; i++) {
      steamPos[i*3]  +=steamVel[i*3]
      steamPos[i*3+1]+=steamVel[i*3+1]
      steamPos[i*3+2]+=steamVel[i*3+2]
      steamVel[i*3]  +=rn(0.004)
      steamVel[i*3+2]+=rn(0.004)
      if (steamPos[i*3+1]>TH+6.5) {
        steamPos[i*3]  =rn(TW*0.40)
        steamPos[i*3+1]=TH+0.8+rnd()*0.5
        steamPos[i*3+2]=TZ+rn(TD*0.40)
        steamVel[i*3]  =rn(0.018)
        steamVel[i*3+1]=0.018+rnd()*0.030
        steamVel[i*3+2]=rn(0.018)
      }
    }
    steamGeo.attributes.position.needsUpdate=true
  }

  // Water flow UV offset
  if (flowMat) {
    flowMat.map.offset.y += dt * 0.45
    if (flowMat.map.offset.y > 1) flowMat.map.offset.y -= 1
  }

  controls.update()
  composer.render()
}

// ── Public init ────────────────────────────────────────────────────────────────
export function initCoolingTowerScene(container) {
  // Reset
  fanGroup=null; steamGeo=null; steamPos=null; steamVel=null; flowMat=null

  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
  renderer.setPixelRatio(Math.min(devicePixelRatio,2))
  renderer.setSize(container.clientWidth,container.clientHeight)
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.85
  container.appendChild(renderer.domElement)

  scene=new THREE.Scene(); _scene=scene
  scene.background=new THREE.Color(0x6a8898)
  scene.fog=new THREE.Fog(0x7a9aaa, 30, 65)

  // HDR environment (room env for reflections)
  const pmrem=new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const envTex=pmrem.fromScene(new RoomEnvironment(),0.04).texture
  scene.environment=envTex; pmrem.dispose()

  // Camera — realistic factory survey angle
  camera=new THREE.PerspectiveCamera(55,container.clientWidth/container.clientHeight,0.1,200)
  camera.position.set(14,7,14)

  controls=new OrbitControls(camera,renderer.domElement)
  controls.target.set(0,3.0,TZ/2)
  controls.enableDamping=true; controls.dampingFactor=0.07
  controls.minDistance=3; controls.maxDistance=60
  controls.maxPolarAngle=Math.PI*0.50
  controls.update()

  // ── Lighting ───────────────────────────────────────────────────────────────
  // Sky dome
  const hemi=new THREE.HemisphereLight(0x7090b0,0x4a4030,0.5)
  scene.add(hemi)

  // Sun — behind camera (NE), soft industrial overcast
  const sun=new THREE.DirectionalLight(0xffe0b8,1.6)
  sun.position.set(10,16,-8); sun.castShadow=true
  sun.shadow.mapSize.width=sun.shadow.mapSize.height=2048
  sun.shadow.camera.left=-22; sun.shadow.camera.right=22
  sun.shadow.camera.top=22;  sun.shadow.camera.bottom=-22
  sun.shadow.camera.far=65;  sun.shadow.bias=-0.0012
  scene.add(sun)

  // Sky bounce
  scene.add(new THREE.AmbientLight(0x90b0c8,0.35))

  // Rim light (from front-left, warm)
  const fill=new THREE.DirectionalLight(0xffeedd,0.45)
  fill.position.set(-6,4,14); scene.add(fill)

  // Under-platform work lights (warm, localised)
  for (const [px,pz] of [[-3.5,-4],[3.5,-4]]) {
    const wl=new THREE.PointLight(0xffeedd,1.8,14)
    wl.position.set(px,0.8,pz); scene.add(wl)
  }

  // ── Post-processing ────────────────────────────────────────────────────────
  composer=new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene,camera))
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth,container.clientHeight),
    0.22, 0.45, 0.88
  ))

  // ── Build scene ────────────────────────────────────────────────────────────
  const M=buildMaterials()
  buildFloor(M)
  buildCoolingTower(M)

  // Pumps
  const d1=buildPump(P1X,0,PZ,1,M)
  const d2=buildPump(P2X,0,PZ,-1,M)
  buildPipework(M,{d1,d2})
  buildPlatform(M)
  buildSteamParticles()

  // ResizeObserver
  const ro=new ResizeObserver(()=>{
    const w=container.clientWidth,h=container.clientHeight
    renderer.setSize(w,h); composer.setSize(w,h)
    camera.aspect=w/h; camera.updateProjectionMatrix()
  })
  ro.observe(container)

  requestAnimationFrame(animate)

  return ()=>{
    cancelAnimationFrame(rafId); ro.disconnect()
    try { composer.dispose() } catch(_){}
    renderer.dispose()
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    _scene=null
  }
}
