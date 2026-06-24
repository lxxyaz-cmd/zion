/**
 * useThreeScene.js — Photorealistic Industrial Cooling Tower
 * Same API: initScene(container, physTickCb)
 * Keeps all sim-driven animation; replaces visuals with PBR + canvas textures
 */
import * as THREE from 'three'
import { OrbitControls }   from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { sim } from './useSimulation.js'

// ── Layout constants (unchanged from original) ────────────────────────────────
const RATED  = 1450
const PLAT_Y = 3.6
const _up    = new THREE.Vector3(0, 1, 0)

// Runtime handles
let renderer, scene, camera, controls, composer
let pump1, pump2, towerFan, tankWater
let pl1, pl2, alarmLight, towerLight
let pGeo, pPos, pMat, pOffsets, pCurve
let sGeo, sPos, sMat, sLife
let mGeo, mPos, mMat, mLife, mAngOff
let mmGeo, mmPos, mmMat, mmLife
let rafId, lastPhys = 0, onPhysTick = null
let p1Angle = 0, p2Angle = 0, fanAngle = 0, fanSpeed = 0

const rnd = () => Math.random()
const rn  = a  => (rnd() - .5) * a

// ── Canvas texture generators ─────────────────────────────────────────────────

function makeGalvanizedTex() {
  const S = 1024
  const c = document.createElement('canvas'); c.width=S; c.height=S
  const ctx = c.getContext('2d')
  ctx.fillStyle='#8a9298'; ctx.fillRect(0,0,S,S)
  // zinc spangle
  for (let i=0; i<130; i++) {
    const x=rnd()*S, y=rnd()*S, r=16+rnd()*52, s=4+Math.floor(rnd()*4), a0=rnd()*Math.PI
    ctx.save(); ctx.translate(x,y)
    ctx.beginPath()
    for (let j=0; j<s; j++) {
      const a=a0+j/s*Math.PI*2+rn(0.22), rr=r*(0.5+rnd()*0.5)
      j===0 ? ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr) : ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)
    }
    ctx.closePath()
    const v=112+Math.floor(rnd()*35)
    ctx.fillStyle=`rgba(${v+4},${v+7},${v},0.20)`; ctx.fill()
    ctx.strokeStyle=`rgba(${v-22},${v-18},${v-28},0.24)`; ctx.lineWidth=0.6; ctx.stroke()
    ctx.restore()
  }
  // corrugation bands
  for (let y=0; y<S; y+=20) {
    const g=ctx.createLinearGradient(0,y,0,y+20)
    g.addColorStop(0,'rgba(255,255,255,0.07)'); g.addColorStop(0.45,'rgba(0,0,0,0.05)'); g.addColorStop(1,'rgba(255,255,255,0.04)')
    ctx.fillStyle=g; ctx.fillRect(0,y,S,20)
  }
  // water stain streaks
  for (let i=0; i<22; i++) {
    const x=rnd()*S, w=2+rnd()*9, h=45+rnd()*180, y0=rnd()*(S-h)
    const g=ctx.createLinearGradient(x,y0,x,y0+h)
    g.addColorStop(0,'rgba(44,54,64,0.0)'); g.addColorStop(0.25,`rgba(44,54,64,${0.13+rnd()*0.12})`); g.addColorStop(1,'rgba(44,54,64,0.0)')
    ctx.fillStyle=g; ctx.fillRect(x,y0,w,h)
  }
  // zinc oxide patches
  for (let i=0; i<8; i++) {
    const x=rnd()*S, y=rnd()*S, r=22+rnd()*65
    const g=ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,'rgba(216,222,212,0.26)'); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  }
  // rust bleed from fasteners
  for (let i=0; i<38; i++) {
    const x=rnd()*S, y=rnd()*S
    ctx.fillStyle='#141c20'; ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill()
    const rg=ctx.createLinearGradient(x,y,x+rn(5),y+10+rnd()*32)
    rg.addColorStop(0,`rgba(132,74,16,${0.45+rnd()*0.3})`); rg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=rg; ctx.fillRect(x-2.5,y,5,35+rnd()*35)
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,2); return t
}

function makeCarbonSteelTex() {
  const S=512; const c=document.createElement('canvas'); c.width=S; c.height=S
  const ctx=c.getContext('2d')
  ctx.fillStyle='#2c3238'; ctx.fillRect(0,0,S,S)
  for (let i=0; i<2000; i++) {
    const v=rn(18); ctx.fillStyle=`rgba(${44+v},${50+v},${58+v},0.28)`
    ctx.fillRect(rnd()*S,rnd()*S,2+rnd()*5,1+rnd()*4)
  }
  for (let i=0; i<18; i++) {
    const x=rnd()*S, y=rnd()*S, r=4+rnd()*28
    const rR=95+Math.floor(rnd()*50), rG=36+Math.floor(rnd()*20)
    const g=ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(${rR},${rG},8,${0.65+rnd()*0.30})`); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  }
  for (let i=0; i<8; i++) {
    ctx.fillStyle=`rgba(155,50,26,${0.30+rnd()*0.35})`
    ctx.beginPath(); ctx.arc(rnd()*S,rnd()*S,4+rnd()*12,0,Math.PI*2); ctx.fill()
  }
  for (let i=0; i<32; i++) {
    const x=rnd()*S, y=rnd()*S, len=16+rnd()*80, a=rnd()*Math.PI
    ctx.strokeStyle=`rgba(172,165,148,${0.12+rnd()*0.20})`; ctx.lineWidth=0.5+rnd()*1.5
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len); ctx.stroke()
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,4); return t
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
    ctx.fillStyle=`rgba(102,46,8,${0.28+rnd()*0.30})`
    ctx.fillRect(Math.floor(rnd()*W/8)*8,Math.floor(rnd()*H/8)*8,4+rnd()*4,rnd()*7)
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,7); return t
}

function makeTankPanelTex() {
  const S=512; const c=document.createElement('canvas'); c.width=S; c.height=S
  const ctx=c.getContext('2d')
  const grd=ctx.createLinearGradient(0,0,S,S)
  grd.addColorStop(0,'#b8c8d8'); grd.addColorStop(0.4,'#ccd8e8'); grd.addColorStop(1,'#a8b8c8')
  ctx.fillStyle=grd; ctx.fillRect(0,0,S,S)
  // embossed panels (3×2)
  const cols=3, rows=2, PW=S/cols, PH=S/rows
  ctx.fillStyle='#6888a8'
  for (let r=0; r<=rows; r++) ctx.fillRect(0,r*PH,S,3)
  for (let col=0; col<=cols; col++) ctx.fillRect(col*PW,0,3,S)
  ctx.fillStyle='#e8f4ff'
  for (let r=0; r<=rows; r++) ctx.fillRect(0,r*PH+3,S,1)
  for (let col=0; col<=cols; col++) ctx.fillRect(col*PW+3,0,1,S)
  for (let r=0; r<rows; r++) for (let col=0; col<cols; col++) {
    const px=col*PW+10, py=r*PH+10, pw=PW-20, ph=PH-20
    ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(px,py,pw,2); ctx.fillRect(px,py,2,ph)
    ctx.fillStyle='rgba(0,28,55,0.14)'; ctx.fillRect(px,py+ph-2,pw,2); ctx.fillRect(px+pw-2,py,2,ph)
  }
  // weathering streaks on tank
  for (let i=0; i<6; i++) {
    const x=rnd()*S, w=1+rnd()*5, h=30+rnd()*100, y0=rnd()*(S-h)
    const g=ctx.createLinearGradient(x,y0,x,y0+h)
    g.addColorStop(0,'rgba(60,80,100,0.0)'); g.addColorStop(0.3,`rgba(60,80,100,${0.08+rnd()*0.08})`); g.addColorStop(1,'rgba(60,80,100,0.0)')
    ctx.fillStyle=g; ctx.fillRect(x,y0,w,h)
  }
  return new THREE.CanvasTexture(c)
}

function makeBrickTex() {
  const W=512, H=512; const c=document.createElement('canvas'); c.width=W; c.height=H
  const ctx=c.getContext('2d')
  // mortar base
  ctx.fillStyle='#8a7868'; ctx.fillRect(0,0,W,H)
  const BH=32, BW=64, MG=4
  const rows=Math.ceil(H/BH)+1
  for (let r=0; r<rows; r++) {
    const offset=(r%2)*BW/2
    const y=r*BH
    const cols=Math.ceil(W/BW)+1
    for (let col=0; col<cols; col++) {
      const x=col*BW-offset
      // brick body
      const hue=rnd()*14-7, sat=rnd()*14
      const R=Math.round(Math.min(255,Math.max(0,158+hue)))
      const G=Math.round(Math.min(255,Math.max(0,82+sat/2)))
      const B=Math.round(Math.min(255,Math.max(0,52-hue)))
      ctx.fillStyle=`rgb(${R},${G},${B})`
      ctx.fillRect(x+MG/2,y+MG/2,BW-MG,BH-MG)
      // surface noise
      for (let k=0; k<8; k++) {
        const nx=x+MG/2+rnd()*(BW-MG), ny=y+MG/2+rnd()*(BH-MG), nr=1+rnd()*3
        const nv=rnd()>0.5?18:-14
        ctx.fillStyle=`rgba(${R+nv},${G+nv/2},${B+nv},0.30)`
        ctx.beginPath(); ctx.arc(nx,ny,nr,0,Math.PI*2); ctx.fill()
      }
      // firing marks (dark patches)
      if (rnd()<0.15) {
        const fx=x+MG/2+rnd()*(BW-MG-8), fy=y+MG/2+rnd()*(BH-MG-6)
        ctx.fillStyle=`rgba(40,24,18,${0.25+rnd()*0.30})`
        ctx.fillRect(fx,fy,4+rnd()*12,3+rnd()*7)
      }
    }
  }
  // efflorescence (white mineral streaks)
  for (let i=0; i<18; i++) {
    const x=rnd()*W, y=rnd()*H, ww=1+rnd()*4, hh=10+rnd()*55
    ctx.fillStyle=`rgba(220,215,205,${0.12+rnd()*0.18})`
    ctx.fillRect(x,y,ww,hh)
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,3); return t
}

function makeTileTex() {
  const S=512; const c=document.createElement('canvas'); c.width=S; c.height=S
  const ctx=c.getContext('2d')
  const BASE='#5a6475'
  ctx.fillStyle=BASE; ctx.fillRect(0,0,S,S)
  // aggregate noise
  for (let i=0; i<8000; i++) {
    const v=rnd()*22-11
    const bc=parseInt(BASE.slice(1,3),16)
    ctx.fillStyle=`rgba(${bc+v+8},${bc+v},${bc+v+14},0.18)`
    ctx.beginPath(); ctx.arc(rnd()*S,rnd()*S,rnd()*2.5,0,Math.PI*2); ctx.fill()
  }
  // grid lines (tile joints)
  const TILE=64
  ctx.strokeStyle='#404855'; ctx.lineWidth=2.5
  for (let i=0; i<=S/TILE; i++) {
    ctx.beginPath(); ctx.moveTo(i*TILE,0); ctx.lineTo(i*TILE,S); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0,i*TILE); ctx.lineTo(S,i*TILE); ctx.stroke()
  }
  // highlight bevel
  ctx.strokeStyle='rgba(120,135,160,0.30)'; ctx.lineWidth=1
  for (let r=0; r<S/TILE; r++) for (let col=0; col<S/TILE; col++) {
    const tx=col*TILE+3, ty=r*TILE+3, tw=TILE-6, th=TILE-6
    ctx.beginPath(); ctx.moveTo(tx,ty+th); ctx.lineTo(tx,ty); ctx.lineTo(tx+tw,ty); ctx.stroke()
  }
  // oil stains
  for (let i=0; i<6; i++) {
    const x=rnd()*S, y=rnd()*S, r=20+rnd()*50
    const g=ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(20,20,16,${0.40+rnd()*0.25})`); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,5); return t
}

function makeGaugeFaceTex() {
  const S=256; const c=document.createElement('canvas'); c.width=S; c.height=S
  const ctx=c.getContext('2d')
  ctx.fillStyle='#ede7d2'; ctx.beginPath(); ctx.arc(S/2,S/2,S/2-1,0,Math.PI*2); ctx.fill()
  ctx.strokeStyle='#b0a890'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(S/2,S/2,S/2-3,0,Math.PI*2); ctx.stroke()
  ctx.strokeStyle='#1a1a18'; ctx.lineWidth=2.5
  for (let i=0; i<=10; i++) {
    const a=-Math.PI*0.75+i*(Math.PI*1.5/10)
    ctx.beginPath(); ctx.moveTo(S/2+Math.cos(a)*(S/2-11),S/2+Math.sin(a)*(S/2-11))
    ctx.lineTo(S/2+Math.cos(a)*(S/2-21),S/2+Math.sin(a)*(S/2-21)); ctx.stroke()
  }
  ctx.lineWidth=1
  for (let i=0; i<=50; i++) {
    if (i%5===0) continue
    const a=-Math.PI*0.75+i*(Math.PI*1.5/50)
    ctx.beginPath(); ctx.moveTo(S/2+Math.cos(a)*(S/2-11),S/2+Math.sin(a)*(S/2-11))
    ctx.lineTo(S/2+Math.cos(a)*(S/2-17),S/2+Math.sin(a)*(S/2-17)); ctx.stroke()
  }
  ctx.strokeStyle='#c42010'; ctx.lineWidth=7
  ctx.beginPath(); ctx.arc(S/2,S/2,S/2-15,Math.PI*0.48,Math.PI*0.75); ctx.stroke()
  const na=-Math.PI*0.75+0.42*Math.PI*1.5
  ctx.strokeStyle='#c42010'; ctx.lineWidth=2.8
  ctx.beginPath()
  ctx.moveTo(S/2+Math.cos(na+Math.PI)*10,S/2+Math.sin(na+Math.PI)*10)
  ctx.lineTo(S/2+Math.cos(na)*74,S/2+Math.sin(na)*74); ctx.stroke()
  ctx.fillStyle='#808080'; ctx.beginPath(); ctx.arc(S/2,S/2,5,0,Math.PI*2); ctx.fill()
  ctx.font='bold 16px sans-serif'; ctx.fillStyle='#1a1a18'; ctx.textAlign='center'
  ctx.fillText('MPa',S/2,S*0.72)
  return new THREE.CanvasTexture(c)
}

// ── Material library ──────────────────────────────────────────────────────────
const M = {}
function buildMaterials() {
  const galvTex   = makeGalvanizedTex()
  const steelTex  = makeCarbonSteelTex()
  const gratingT  = makeGratingTex()
  const tankTex   = makeTankPanelTex()
  const gaugeTex  = makeGaugeFaceTex()
  const brickTex  = makeBrickTex()
  const tileTex   = makeTileTex()

  Object.assign(M, {
    galv:     new THREE.MeshStandardMaterial({ map:galvTex,  roughness:0.68, metalness:0.55, envMapIntensity:1.1 }),
    steel:    new THREE.MeshStandardMaterial({ map:steelTex, roughness:0.72, metalness:0.62 }),
    stainless:new THREE.MeshStandardMaterial({ color:0xb8c8d8, roughness:0.22, metalness:0.88, envMapIntensity:1.8 }),
    pipe:     new THREE.MeshStandardMaterial({ map:steelTex, roughness:0.75, metalness:0.60 }),
    pumpBody: new THREE.MeshStandardMaterial({ color:0x3c5468, roughness:0.60, metalness:0.65 }),
    motor:    new THREE.MeshStandardMaterial({ color:0x2a3540, roughness:0.62, metalness:0.58 }),
    motorFin: new THREE.MeshStandardMaterial({ color:0x3a4a58, roughness:0.58, metalness:0.65 }),
    motorRed: new THREE.MeshStandardMaterial({ color:0x8a1818, roughness:0.50, metalness:0.45 }),
    coupling: new THREE.MeshStandardMaterial({ color:0x181e24, roughness:0.80, metalness:0.50 }),
    valve:    new THREE.MeshStandardMaterial({ color:0x283448, roughness:0.60, metalness:0.75 }),
    valveWhl: new THREE.MeshStandardMaterial({ color:0xc8a818, roughness:0.50, metalness:0.30 }),
    platform: new THREE.MeshStandardMaterial({ map:gratingT, roughness:0.82, metalness:0.38, side:THREE.DoubleSide }),
    frame:    new THREE.MeshStandardMaterial({ map:steelTex, roughness:0.70, metalness:0.62 }),
    railing:  new THREE.MeshStandardMaterial({ color:0xd8e0e8, roughness:0.45, metalness:0.35 }), // white
    stairOr:  new THREE.MeshStandardMaterial({ color:0xd06020, roughness:0.62, metalness:0.15 }), // orange
    stairStep:new THREE.MeshStandardMaterial({ map:gratingT, roughness:0.85, metalness:0.35 }),
    tower:    new THREE.MeshStandardMaterial({ map:galvTex,  roughness:0.70, metalness:0.50 }),
    towerFan: new THREE.MeshStandardMaterial({ color:0x6a7c8a, roughness:0.68, metalness:0.55, emissive:0x000000 }),
    louver:   new THREE.MeshStandardMaterial({ color:0x3a4858, roughness:0.72, metalness:0.50, side:THREE.DoubleSide }),
    bolt:     new THREE.MeshStandardMaterial({ color:0x222830, roughness:0.45, metalness:0.78 }),
    tankShell:new THREE.MeshStandardMaterial({ map:tankTex,  roughness:0.28, metalness:0.82, envMapIntensity:1.6 }),
    tankInner:new THREE.MeshPhysicalMaterial({ map:tankTex,  roughness:0.25, metalness:0.82, transparent:true, opacity:0.25, envMapIntensity:1.6 }),
    floor:    new THREE.MeshStandardMaterial({ map:tileTex,  roughness:0.88, metalness:0.04 }),
    wall:     new THREE.MeshStandardMaterial({ map:brickTex, roughness:0.92, metalness:0.02 }),
    ceiling:  new THREE.MeshStandardMaterial({ color:0x1a1e22, roughness:1.0,  metalness:0.0  }),
    water:    new THREE.MeshPhysicalMaterial({ color:0x2288cc, transparent:true, opacity:0.62, roughness:0.06, metalness:0.0 }),
    gauge:    new THREE.MeshStandardMaterial({ map:gaugeTex, roughness:0.30, metalness:0.60 }),
    gaugeHsg: new THREE.MeshStandardMaterial({ color:0x303840, roughness:0.42, metalness:0.72 }),
    concrete: new THREE.MeshStandardMaterial({ color:0x888a8c, roughness:0.94, metalness:0.0 }),
  })
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function addMesh(geo, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0) {
  const m=new THREE.Mesh(geo,mat); m.position.set(px,py,pz); m.rotation.set(rx,ry,rz)
  m.castShadow=true; m.receiveShadow=true; scene.add(m); return m
}
function box(w,h,d,mat,px=0,py=0,pz=0,rx=0,ry=0,rz=0) {
  return addMesh(new THREE.BoxGeometry(w,h,d),mat,px,py,pz,rx,ry,rz)
}
function cyl(rt,rb,h,seg,mat,px=0,py=0,pz=0,rx=0,ry=0,rz=0) {
  return addMesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat,px,py,pz,rx,ry,rz)
}
function pipe(a,b,r,mat) {
  const dir=new THREE.Vector3().subVectors(b,a); const len=dir.length(); if(len<0.01) return
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,16),mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(_up,dir.normalize())
  m.castShadow=true; m.receiveShadow=true; scene.add(m); return m
}

// Flat disc flange + 8 bolt studs
function flange(pos, axis, r, mat) {
  const fr=r*1.85
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(fr,fr,0.055,28),mat)
  disc.position.copy(pos); disc.quaternion.setFromUnitVectors(_up,axis.clone().normalize())
  disc.castShadow=true; scene.add(disc)
  const ax=axis.clone().normalize()
  const perp=Math.abs(ax.y)<0.9 ? new THREE.Vector3(0,1,0).cross(ax).normalize()
                                 : new THREE.Vector3(1,0,0).cross(ax).normalize()
  const perp2=ax.clone().cross(perp)
  for (let i=0; i<8; i++) {
    const a=i/8*Math.PI*2, bc=fr*0.80
    const bpos=pos.clone().addScaledVector(perp,Math.cos(a)*bc).addScaledVector(perp2,Math.sin(a)*bc)
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,0.10,6),M.bolt)
    b.position.copy(bpos); b.quaternion.setFromUnitVectors(_up,ax); scene.add(b)
  }
}

// Solid triangular prism for stair side panels
function buildStairPanel(x1,x2,zBot,zTop,yTop,mat) {
  const verts=new Float32Array([x1,0,zBot,x1,yTop,zTop,x1,0,zTop,x2,0,zBot,x2,yTop,zTop,x2,0,zTop])
  const idx=[0,2,1,3,4,5,0,5,2,0,3,5,0,1,4,0,4,3,1,2,5,1,5,4]
  const geo=new THREE.BufferGeometry()
  geo.setAttribute('position',new THREE.BufferAttribute(verts,3))
  geo.setIndex(idx); geo.computeVertexNormals()
  const cloned=mat.clone(); cloned.side=THREE.DoubleSide
  const m=new THREE.Mesh(geo,cloned); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m
}

// ── Room (indoor brick walls + tile floor, original aesthetic) ────────────────
function buildFloor() {
  // Floor
  const f=new THREE.Mesh(new THREE.PlaneGeometry(38,28),M.floor)
  f.rotation.x=-Math.PI/2; f.receiveShadow=true; scene.add(f)

  // Back wall (z = -11)
  const bw=new THREE.Mesh(new THREE.PlaneGeometry(38,8),M.wall)
  bw.position.set(0,4,-11); bw.receiveShadow=true; scene.add(bw)

  // Left wall (x = -16)
  const lw=new THREE.Mesh(new THREE.PlaneGeometry(28,8),M.wall)
  lw.position.set(-16,4,3); lw.rotation.y=Math.PI/2; lw.receiveShadow=true; scene.add(lw)

  // Ceiling (dark)
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(38,28),M.ceiling)
  ceil.rotation.x=Math.PI/2; ceil.position.y=8; scene.add(ceil)

  // Floor drain grates
  for (const [x,z] of [[0,0],[4,-5],[-4,-5],[7,0]]) {
    box(0.22,0.008,0.22,M.platform,x,0.001,z)
  }
}

// ── Platform ──────────────────────────────────────────────────────────────────
function buildPlatform() {
  // Deck surface (grating)
  box(8.5,0.12,5.5,M.platform,0,PLAT_Y,-2.5)

  // H-beam columns (4 corners)
  ;[[-4.25,-0.5],[4.25,-0.5],[-4.25,-5.2],[4.25,-5.2]].forEach(([x,z])=>{
    box(0.16,PLAT_Y,0.16,M.frame,x,PLAT_Y/2,z)
    // base plate + anchor bolts
    box(0.30,0.04,0.30,M.frame,x,0.02,z)
    for (const [dx,dz] of [[0.09,0.09],[0.09,-0.09],[-0.09,0.09],[-0.09,-0.09]]) {
      cyl(0.010,0.010,0.10,6,M.bolt,x+dx,0.05,z+dz)
    }
  })

  // Cross beams
  for (const pz of [-0.5,-5.2]) box(8.5,0.18,0.12,M.frame,0,PLAT_Y-0.09,pz)
  for (const px of [-4.25,0,4.25]) box(0.12,0.14,5.5,M.frame,px,PLAT_Y-0.07,-2.5)

  const GATE_CX=-3.80, GATE_W=0.9
  const GL=GATE_CX-GATE_W/2, GR=GATE_CX+GATE_W/2
  box(GATE_W,0.12,0.42,M.platform,GATE_CX,PLAT_Y,0.46)
  buildRailing(GL,GR)
  buildStairs(GATE_CX,GATE_W)
}

function buildRailing(GL,GR) {
  const RT=PLAT_Y+1.05, RM=PLAT_Y+0.62
  const post=(x,z)=>cyl(0.025,0.025,1.1,8,M.railing,x,PLAT_Y+0.55,z)
  // Front rail (with gate gap)
  const barRW=4.25-GR
  box(barRW,0.042,0.042,M.railing,GR+barRW/2,RT,0.25)
  box(barRW,0.038,0.038,M.railing,GR+barRW/2,RM,0.25)
  ;[GR,-1.45,0.45,2.35,4.25].forEach(x=>post(x,0.25))
  // Back & sides
  box(8.5,0.042,0.042,M.railing,0,RT,-5.25); box(8.5,0.038,0.038,M.railing,0,RM,-5.25)
  ;[-4.25,-2.125,0,2.125,4.25].forEach(x=>post(x,-5.25))
  box(0.042,0.042,5.5,M.railing,4.25,RT,-2.5); box(0.038,0.038,5.5,M.railing,4.25,RM,-2.5)
  ;[0.25,-1.583,-3.417,-5.25].forEach(z=>post(4.25,z))
  box(0.042,0.042,5.5,M.railing,-4.25,RT,-2.5); box(0.038,0.038,5.5,M.railing,-4.25,RM,-2.5)
  ;[-1.583,-3.417,-5.25].forEach(z=>post(-4.25,z))
  // Gate posts
  box(0.042,0.042,0.42,M.railing,GL,RT,0.46); box(0.042,0.042,0.42,M.railing,GL,RM,0.46)
  box(0.042,0.042,0.42,M.railing,GR,RT,0.46); box(0.042,0.042,0.42,M.railing,GR,RM,0.46)
  post(GL,0.67); post(GR,0.67)
  // Kick plates
  box(8.5,0.12,0.012,M.stairOr,0,PLAT_Y+0.06,-5.245)
  box(0.012,0.12,5.5,M.stairOr,4.25,PLAT_Y+0.06,-2.5)
}

function buildStairs(STAIR_X,STAIR_W) {
  const TOP=PLAT_Y+0.09, S_N=12, S_H=TOP/S_N, S_D=0.16
  const ZTOP=0.25, ZSTP_T=ZTOP+0.21, ZSTP_B=ZSTP_T+(S_N-1)*S_D, ZBOT=ZSTP_B+0.21, PT=0.06
  buildStairPanel(STAIR_X-STAIR_W/2-PT,STAIR_X-STAIR_W/2,ZBOT,ZTOP,TOP,M.stairOr)
  buildStairPanel(STAIR_X+STAIR_W/2,STAIR_X+STAIR_W/2+PT,ZBOT,ZTOP,TOP,M.stairOr)
  for (let i=0; i<S_N; i++) {
    const z=ZSTP_T+(S_N-1-i)*S_D, y=(i+1)*S_H
    box(STAIR_W,0.04,0.36,M.stairStep,STAIR_X,y-0.02,z)      // tread (grating)
    box(STAIR_W,0.03,0.06,M.stairOr,STAIR_X,y+0.015,z+0.18)  // yellow nosing
    if (i<S_N-1) box(STAIR_W,S_H-0.04,0.04,M.frame,STAIR_X,y-S_H/2+0.02,z+0.18) // riser
  }
  // Stringers & handrails
  ;[STAIR_X-STAIR_W/2,STAIR_X+STAIR_W/2].forEach(x=>{
    pipe(new THREE.Vector3(x,0.0,ZBOT),new THREE.Vector3(x,TOP,ZTOP),0.028,M.frame)
    pipe(new THREE.Vector3(x,0.9,ZBOT),new THREE.Vector3(x,TOP+0.9,ZTOP),0.022,M.railing)
    cyl(0.022,0.022,0.9,8,M.railing,x,0.45,ZBOT); cyl(0.022,0.022,0.9,8,M.railing,x,TOP+0.45,ZTOP)
  })
  for (let i=2; i<S_N; i+=3) {
    const z=ZSTP_T+(S_N-1-i)*S_D, y=(i+1)*S_H
    ;[STAIR_X-STAIR_W/2,STAIR_X+STAIR_W/2].forEach(x=>cyl(0.015,0.015,0.9,6,M.railing,x,y+0.45,z))
  }
}

// ── Pump assembly ─────────────────────────────────────────────────────────────
function buildPump(px,pz) {
  const g=new THREE.Group(); scene.add(g); g.position.set(px,0,pz)
  // Concrete inertia block
  const ib=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.22,0.95),M.concrete)
  ib.position.set(0,-0.11,0); ib.receiveShadow=true; g.add(ib)
  // Baseplate
  const bp=new THREE.Mesh(new THREE.BoxGeometry(1.42,0.055,0.88),M.frame)
  bp.position.set(0,0.028,0); g.add(bp)
  // Motor body
  const mot=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.80,24),M.motor)
  mot.rotation.z=Math.PI/2; mot.position.set(-0.52,0.52,0); mot.castShadow=true; g.add(mot)
  // Motor cooling fins
  for (let i=0; i<13; i++) {
    const fin=new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.225,0.018,24),M.motorFin)
    fin.rotation.z=Math.PI/2; fin.position.set(-0.52+(-0.35+i*0.06),0.52,0); g.add(fin)
  }
  // Terminal box
  const tb=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.13,0.20),M.frame)
  tb.position.set(-0.52,0.75,0); g.add(tb)
  // End cap
  const ec=new THREE.Mesh(new THREE.CylinderGeometry(0.21,0.21,0.05,20),M.motorRed)
  ec.rotation.z=Math.PI/2; ec.position.set(-0.15,0.52,0); g.add(ec)
  // Coupling guard
  const cg=new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,0.22,16),M.coupling)
  cg.rotation.z=Math.PI/2; cg.position.set(-0.02,0.52,0); g.add(cg)
  // Shaft stubs
  for (const sx of [-0.15,-0.02]) {
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.038,0.08,10),M.stainless)
    sh.rotation.z=Math.PI/2; sh.position.set(-0.09+sx*0.5,0.52,0); g.add(sh)
  }

  // Volute casing
  const cas=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.28,0.42,24),M.pumpBody)
  cas.rotation.z=Math.PI/2; cas.position.set(0.24,0.52,0); cas.castShadow=true; g.add(cas)
  const scroll=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.36,0.20),M.pumpBody)
  scroll.position.set(0.40,0.52,0); g.add(scroll)
  const face=new THREE.Mesh(new THREE.CircleGeometry(0.28,24),M.pumpBody)
  face.rotation.y=-Math.PI/2; face.position.set(0.46,0.52,0); g.add(face)

  // Impeller (visible through face)
  const imp=new THREE.Group(); imp.position.set(0.46,0.52,0); g.add(imp)
  for (let i=0; i<7; i++) {
    const a=(i/7)*Math.PI*2
    const vane=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.14,0.026),M.stainless)
    vane.position.set(Math.sin(a)*0.13,Math.cos(a)*0.13,0); vane.rotation.z=-a; imp.add(vane)
  }
  const hub=new THREE.Mesh(new THREE.CircleGeometry(0.055,12),M.stainless); hub.position.z=0.002; imp.add(hub)

  // Suction inlet (horizontal, facing +Z)
  const sn=new THREE.Mesh(new THREE.CylinderGeometry(0.088,0.088,0.52,16),M.pipe)
  sn.rotation.z=Math.PI/2; sn.position.set(0.24,0.30,0); g.add(sn)
  const sflan=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.050,24),M.stainless)
  sflan.rotation.z=Math.PI/2; sflan.position.set(0.50,0.30,0); g.add(sflan)
  // Suction flange bolts
  for (let i=0; i<8; i++) {
    const a=i/8*Math.PI*2
    const blt=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.09,6),M.bolt)
    blt.rotation.z=Math.PI/2; blt.position.set(0.51,0.30+Math.cos(a)*0.13,Math.sin(a)*0.13); g.add(blt)
  }

  // Discharge riser (vertical)
  pipe(new THREE.Vector3(px,0.82,pz),new THREE.Vector3(px,PLAT_Y+0.10,pz),0.088,M.pipe)
  // Flanges on riser
  flange(new THREE.Vector3(px,0.88,pz),new THREE.Vector3(0,1,0),0.088,M.stainless)
  flange(new THREE.Vector3(px,PLAT_Y+0.05,pz),new THREE.Vector3(0,1,0),0.088,M.stainless)

  // Gate valve on discharge
  const vx=px, vy=1.85, vz=pz
  const vbody=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.22,16),M.valve)
  vbody.position.set(vx,vy,vz); vbody.castShadow=true; scene.add(vbody)
  // valve flanges
  for (const dy of [-0.12,0.12]) {
    const vf=new THREE.Mesh(new THREE.CylinderGeometry(0.170,0.170,0.040,20),M.stainless)
    vf.position.set(vx,vy+dy,vz); scene.add(vf)
    // bolts
    for (let i=0; i<8; i++) {
      const a=i/8*Math.PI*2
      const blt=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.08,6),M.bolt)
      blt.position.set(vx+Math.cos(a)*0.138,vy+dy,vz+Math.sin(a)*0.138); scene.add(blt)
    }
  }
  const bonnet=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.11,0.16,12),M.valve)
  bonnet.position.set(vx,vy+0.19,vz); scene.add(bonnet)
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.66,8),M.stainless)
  stem.position.set(vx,vy+0.54,vz); scene.add(stem)
  const wheel=new THREE.Mesh(new THREE.TorusGeometry(0.20,0.024,8,24),M.valveWhl)
  wheel.position.set(vx,vy+0.88,vz); scene.add(wheel)
  for (let i=0; i<4; i++) {
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.011,0.011,0.38,6),M.valveWhl)
    sp.position.set(vx,vy+0.88,vz)
    sp.rotation.z=i/4*Math.PI
    scene.add(sp)
  }

  // Pressure gauge
  const gpos=new THREE.Vector3(vx+0.22,vy+0.06,vz)
  const gnozzle=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.16,8),M.gaugeHsg)
  gnozzle.rotation.z=Math.PI/2; gnozzle.position.copy(gpos); scene.add(gnozzle)
  const gface=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.058,0.055,18),M.gauge)
  gface.rotation.z=Math.PI/2; gface.position.set(vx+0.32,vy+0.06,vz); scene.add(gface)

  return { group:g, impeller:imp }
}

// ── Cooling Tower ─────────────────────────────────────────────────────────────
function buildCoolingTower(cx,cy,cz) {
  const BW=3.8, BH=3.2, BD=2.4, HW=BW/2, HD=BD/2

  // Four galvanized shell panels
  ;[
    [new THREE.BoxGeometry(BW,BH,0.065),[cx,cy+BH/2,cz+HD],0],
    [new THREE.BoxGeometry(BW,BH,0.065),[cx,cy+BH/2,cz-HD],Math.PI],
    [new THREE.BoxGeometry(0.065,BH,BD),[cx-HW,cy+BH/2,cz],0],
    [new THREE.BoxGeometry(0.065,BH,BD),[cx+HW,cy+BH/2,cz],0],
  ].forEach(([geo,[px,py,pz]])=>{
    const m=new THREE.Mesh(geo,M.tower); m.position.set(px,py,pz); m.castShadow=true; scene.add(m)
  })

  // Basin (concrete at bottom)
  ;[
    [BW+0.24,0.18,0.22, cx,cy+0.09,cz+HD+0.11],
    [BW+0.24,0.18,0.22, cx,cy+0.09,cz-HD-0.11],
    [0.22,0.18,BD+0.24, cx-HW-0.11,cy+0.09,cz],
    [0.22,0.18,BD+0.24, cx+HW+0.11,cy+0.09,cz],
    [BW+0.25,0.16,BD+0.25,cx,cy-0.08,cz],       // basin floor
  ].forEach(([w,h,d,px,py,pz])=>box(w,h,d,M.concrete,px,py,pz))

  // Air intake louvres (front + back, angled slats)
  for (const zSide of [cz+HD+0.02, cz-HD-0.02]) {
    for (let i=0; i<12; i++) {
      const slat=new THREE.Mesh(new THREE.BoxGeometry(BW-0.06,0.022,0.09),M.louver)
      slat.position.set(cx,cy+0.12+i*0.25,zSide)
      slat.rotation.x=(zSide>cz?1:-1)*0.38; scene.add(slat)
    }
  }
  // Side louvres
  for (const xSide of [cx-HW-0.02, cx+HW+0.02]) {
    for (let i=0; i<10; i++) {
      const slat=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.022,BD-0.06),M.louver)
      slat.position.set(xSide,cy+0.15+i*0.28,cz)
      slat.rotation.z=(xSide>cx?1:-1)*0.38; scene.add(slat)
    }
  }

  // Corner columns
  for (const [cx2,cz2] of [[cx-HW+0.06,cz+HD-0.06],[cx-HW+0.06,cz-HD+0.06],[cx+HW-0.06,cz+HD-0.06],[cx+HW-0.06,cz-HD+0.06]]) {
    box(0.12,BH,0.12,M.frame,cx2,cy+BH/2,cz2)
  }
  // Frame strips top/bottom
  for (const y of [cy+0.04,cy+BH-0.04]) {
    box(BW+0.08,0.055,BD+0.08,M.stainless,cx,y,cz)
  }

  // Drift eliminator (horizontal slotted panel)
  box(BW-0.10,0.055,BD-0.10,M.louver,cx,cy+BH-0.85,cz)

  // Water distribution header
  for (let xi=-1.3; xi<=1.3; xi+=0.65) {
    const hdr=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,BD-0.18,10),M.stainless)
    hdr.rotation.x=Math.PI/2; hdr.position.set(cx+xi,cy+BH-0.55,cz); scene.add(hdr)
    for (let zi=cz-0.9; zi<=cz+0.9; zi+=0.55) {
      const nz=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.016,0.05,8),M.stainless)
      nz.position.set(cx+xi,cy+BH-0.58,zi); scene.add(nz)
    }
  }

  // Fan housing (cylinder shroud)
  const shroudR=Math.min(HW,HD)*0.90
  const shroud=new THREE.Mesh(new THREE.CylinderGeometry(shroudR+0.05,shroudR,0.55,32,1,true),M.galv)
  shroud.position.set(cx,cy+BH+0.28,cz); scene.add(shroud)
  const ring=new THREE.Mesh(new THREE.TorusGeometry(shroudR+0.05,0.048,8,32),M.stainless)
  ring.rotation.x=Math.PI/2; ring.position.set(cx,cy+BH+0.55,cz); scene.add(ring)

  // Fan group (rotate around Y)
  const fanGrp=new THREE.Group(); fanGrp.position.set(cx,cy+BH+0.05,cz); scene.add(fanGrp)
  const fanHub=new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,0.12,16),M.stainless)
  fanGrp.add(fanHub)
  for (let i=0; i<6; i++) {
    const a=(i/6)*Math.PI*2
    const blade=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.065,0.82),M.towerFan)
    blade.position.set(Math.sin(a)*0.44,0,Math.cos(a)*0.44)
    blade.rotation.y=-a+0.35; blade.rotation.x=0.30; blade.castShadow=true; fanGrp.add(blade)
  }

  // Tower label nameplate
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.55),
    new THREE.MeshStandardMaterial({color:0xd8e8f0,roughness:0.9}))
  label.position.set(cx,cy+BH*0.70,cz+HD+0.04); scene.add(label)

  return fanGrp
}

// ── Water Tank ────────────────────────────────────────────────────────────────
function buildTank(tx,ty,tz) {
  const TW=2.4, TH=1.5, TD=2.4
  // Corner legs
  for (const [dx,dz] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    cyl(0.04,0.04,0.20,8,M.stainless,tx+dx*(TW/2-0.06),ty+0.10,tz+dz*(TD/2-0.06))
  }
  // Four shell faces
  const mkFace=(w,h,px,py,pz,ry=0)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M.tankShell)
    m.position.set(px,py,pz); m.rotation.y=ry; m.castShadow=true; scene.add(m)
  }
  const FY=ty+TH/2+0.18
  mkFace(TW,TH,tx,       FY,tz+TD/2, 0)
  mkFace(TW,TH,tx,       FY,tz-TD/2, Math.PI)
  mkFace(TD,TH,tx+TW/2,  FY,tz,      Math.PI/2)
  mkFace(TD,TH,tx-TW/2,  FY,tz,     -Math.PI/2)
  const inner=new THREE.Mesh(new THREE.BoxGeometry(TW-0.04,TH-0.04,TD-0.04),M.tankInner)
  inner.position.set(tx,FY,tz); scene.add(inner)
  // Top lid + ribs
  box(TW+0.06,0.05,TD+0.06,M.stainless,tx,ty+TH+0.19,tz)
  for (let i=0; i<4; i++) box(TW+0.08,0.038,TD+0.08,M.stainless,tx,ty+0.21+i*0.36,tz)
  cyl(0.20,0.20,0.07,20,M.stainless,tx,ty+TH+0.23,tz)
  // Tank outlet flange (suction header connects here from buildPipes)
  flange(new THREE.Vector3(tx-TW/2,0.40,tz),new THREE.Vector3(-1,0,0),0.10,M.stainless)
  // Water level
  const MAXH=TH-0.06
  const wGeo=new THREE.BoxGeometry(TW-0.14,MAXH,TD-0.14)
  wGeo.translate(0,MAXH/2,0)
  const wm=new THREE.Mesh(wGeo,M.water); wm.position.set(tx,ty+0.21,tz); scene.add(wm)
  return wm
}

// ── Pipe system ───────────────────────────────────────────────────────────────
function buildPipes() {
  const PY=PLAT_Y+0.10, GY=0.40
  // Discharge header
  pipe(new THREE.Vector3(-2.5,PY,0),new THREE.Vector3(2.5,PY,0),0.10,M.pipe)
  ;[-2.5,0,2.5].forEach(x=>flange(new THREE.Vector3(x,PY,0),new THREE.Vector3(1,0,0),0.10,M.stainless))
  pipe(new THREE.Vector3(0,PY,0),new THREE.Vector3(0,PY,-2.9),0.10,M.pipe)
  flange(new THREE.Vector3(0,PY,-1.4),new THREE.Vector3(0,0,1),0.10,M.stainless)
  pipe(new THREE.Vector3(0,PY,-2.9),new THREE.Vector3(0,PLAT_Y-0.18,-2.9),0.10,M.pipe)
  // Return to tank
  pipe(new THREE.Vector3(0.55,PLAT_Y+0.06,-2.9),new THREE.Vector3(0.55,0.38,-2.9),0.10,M.pipe)
  pipe(new THREE.Vector3(0.55,0.38,-2.9),new THREE.Vector3(7.5,0.38,-2.9),0.10,M.pipe)
  pipe(new THREE.Vector3(7.5,0.38,-2.9),new THREE.Vector3(7.5,0.38,-1.2),0.10,M.pipe)
  pipe(new THREE.Vector3(7.5,0.38,-1.2),new THREE.Vector3(7.5,0.88,-1.2),0.10,M.pipe)
  flange(new THREE.Vector3(3.0,0.38,-2.9),new THREE.Vector3(1,0,0),0.10,M.stainless)
  flange(new THREE.Vector3(6.0,0.38,-2.9),new THREE.Vector3(1,0,0),0.10,M.stainless)
  // Suction header
  pipe(new THREE.Vector3(6.3,GY,0),new THREE.Vector3(-2.5,GY,0),0.11,M.pipe)
  pipe(new THREE.Vector3(-2.5,GY,0),new THREE.Vector3(-2.5,0.24,0),0.10,M.pipe)
  pipe(new THREE.Vector3(2.5,GY,0),new THREE.Vector3(2.5,0.24,0),0.10,M.pipe)
  ;[-2.5,0,2.5,6.3].forEach(x=>flange(new THREE.Vector3(x,GY,0),new THREE.Vector3(1,0,0),0.11,M.stainless))

  // Pipe supports
  for (const [px,pz,py] of [[-2.5,0,0.40],[2.5,0,0.40],[0,0,PY],[0,-1.5,PY],[0,-2.9,PY-0.1]]) {
    box(0.055,py+0.05,0.055,M.frame,px,py*0.5,pz)
    box(0.25,0.050,0.055,M.frame,px,py+0.03,pz)
    const ubolt=new THREE.Mesh(new THREE.TorusGeometry(0.065,0.010,8,12,Math.PI),M.bolt)
    ubolt.position.set(px,py+0.10,pz); ubolt.rotation.x=Math.PI; scene.add(ubolt)
  }

  // Expansion joint (bellows) on suction header
  for (let i=0; i<6; i++) {
    const rib=new THREE.Mesh(new THREE.CylinderGeometry(0.135,0.135,0.025,18),M.stainless)
    rib.rotation.x=Math.PI/2; rib.position.set(-1.2+i*0.048,GY,0); scene.add(rib)
  }
}

// ── Particles (unchanged logic from original) ─────────────────────────────────
function buildParticles() {
  const PC=100
  pGeo=new THREE.BufferGeometry(); pPos=new Float32Array(PC*3)
  pMat=new THREE.PointsMaterial({color:0x4fc3f7,size:0.10,transparent:true,opacity:0.85,sizeAttenuation:true})
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3)); scene.add(new THREE.Points(pGeo,pMat))
  pCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.5,0.40,0),new THREE.Vector3(-2.5,0.84,0),
    new THREE.Vector3(-2.5,PLAT_Y+0.1,0),new THREE.Vector3(0,PLAT_Y+0.1,0),
    new THREE.Vector3(0,PLAT_Y+0.1,-2.9),new THREE.Vector3(0.55,0.3,-2.9),
    new THREE.Vector3(6.3,0.3,-2.9),new THREE.Vector3(6.3,0.40,0),
    new THREE.Vector3(2.5,0.40,0),
  ],true)
  pOffsets=new Float32Array(PC).map(()=>rnd())

  sGeo=new THREE.BufferGeometry(); sPos=new Float32Array(40*3); sLife=new Float32Array(40).map(()=>rnd())
  sMat=new THREE.PointsMaterial({color:0xc8d8ee,size:0.28,transparent:true,opacity:0.0,sizeAttenuation:true})
  sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3)); scene.add(new THREE.Points(sGeo,sMat))

  mGeo=new THREE.BufferGeometry(); mPos=new Float32Array(70*3); mLife=new Float32Array(70).map(()=>rnd())
  mAngOff=new Float32Array(70).map(()=>rnd()*Math.PI*2)
  mMat=new THREE.PointsMaterial({color:0xaaddff,size:0.26,transparent:true,opacity:0.0,sizeAttenuation:true,depthWrite:false})
  mGeo.setAttribute('position',new THREE.BufferAttribute(mPos,3)); scene.add(new THREE.Points(mGeo,mMat))

  mmGeo=new THREE.BufferGeometry(); mmPos=new Float32Array(25*3); mmLife=new Float32Array(25).map(()=>rnd())
  mmMat=new THREE.PointsMaterial({color:0xeef6ff,size:0.65,transparent:true,opacity:0.0,sizeAttenuation:true,depthWrite:false})
  mmGeo.setAttribute('position',new THREE.BufferAttribute(mmPos,3)); scene.add(new THREE.Points(mmGeo,mmMat))
}

// ── Lights ────────────────────────────────────────────────────────────────────
function buildLights() {
  // Indoor ambient — warm factory ceiling light tone
  scene.add(new THREE.HemisphereLight(0xfff0e0,0x1a1408,0.25))
  scene.add(new THREE.AmbientLight(0xffe8cc,0.15))

  // Main overhead flood (simulates ceiling high-bay fixtures)
  const main=new THREE.DirectionalLight(0xfff4e0,0.90)
  main.position.set(2,12,-2); main.castShadow=true
  main.shadow.mapSize.width=main.shadow.mapSize.height=2048
  main.shadow.camera.left=-18; main.shadow.camera.right=18
  main.shadow.camera.top=18;   main.shadow.camera.bottom=-18
  main.shadow.camera.far=50;   main.shadow.bias=-0.0014; scene.add(main)

  // Fill from front-left
  const fill=new THREE.DirectionalLight(0xffeedd,0.20)
  fill.position.set(-8,6,12); scene.add(fill)

  // Rim from behind (separates equipment from back wall)
  const rim=new THREE.DirectionalLight(0xd0e8ff,0.18)
  rim.position.set(0,8,-14); scene.add(rim)

  // Equipment-specific point lights (start off, driven by sim)
  pl1=new THREE.PointLight(0x4488ff,0,7); pl1.position.set(-2.5,1.6,0.5); scene.add(pl1)
  pl2=new THREE.PointLight(0x4488ff,0,7); pl2.position.set(2.5,1.6,0.5); scene.add(pl2)
  alarmLight=new THREE.PointLight(0xff2200,0,14); alarmLight.position.set(0,5,0); scene.add(alarmLight)
  towerLight=new THREE.PointLight(0x55bbff,0,14); towerLight.position.set(0,PLAT_Y+5.5,-3.2); scene.add(towerLight)

  // Overhead work lights on platform underside
  for (const [px,pz] of [[-2,0],[2,0],[0,-3]]) {
    const wl=new THREE.PointLight(0xfff0d8,0.55,9); wl.position.set(px,3.2,pz); scene.add(wl)
  }
}

// ── Animation (unchanged logic) ────────────────────────────────────────────────
function animate(ts) {
  rafId=requestAnimationFrame(animate)
  if (ts-lastPhys>200) { if (onPhysTick) onPhysTick(); lastPhys=ts }

  const dt=0.016, r1=sim.s1/RATED, r2=sim.s2/RATED
  p1Angle+=r1*720*dt*Math.PI/180; pump1.impeller.rotation.z=p1Angle
  p2Angle+=r2*720*dt*Math.PI/180; pump2.impeller.rotation.z=p2Angle

  const fanTarget=sim.fan?960:0
  fanSpeed+=Math.sign(fanTarget-fanSpeed)*Math.min(60,Math.abs(fanTarget-fanSpeed))
  fanAngle+=fanSpeed*dt*Math.PI/180; towerFan.rotation.y=fanAngle

  const fanRatio=fanSpeed/960
  M.towerFan.emissive.setRGB(fanRatio*0.04,fanRatio*0.10,fanRatio*0.22)
  towerLight.intensity=fanRatio*3.5
  pl1.intensity=r1*1.6; pl2.intensity=r2*1.6
  alarmLight.intensity=sim.temp>42?(Math.sin(ts*0.008)*0.5+0.5)*2.5:0

  const speed=(r1+r2)*0.5
  pMat.opacity=sim.s1>50||sim.s2>50?0.85:0
  for (let i=0; i<pOffsets.length; i++) {
    pOffsets[i]=(pOffsets[i]+speed*0.006)%1
    const pt=pCurve.getPoint(pOffsets[i])
    pPos[i*3]=pt.x+rn(0.04); pPos[i*3+1]=pt.y+rn(0.04); pPos[i*3+2]=pt.z+rn(0.04)
  }
  pGeo.attributes.position.needsUpdate=true

  sMat.opacity=sim.s1>0||sim.s2>0?0.35:0
  for (let i=0; i<sLife.length; i++) {
    sLife[i]=(sLife[i]+0.007)%1; const t=sLife[i]
    sPos[i*3]=[-2.52,2.48][i%2]+rn(0.12); sPos[i*3+1]=0.74+t*1.0+rn(0.06); sPos[i*3+2]=rn(0.12)
  }
  sGeo.attributes.position.needsUpdate=true

  const TFX=0,TFY=PLAT_Y+3.3,TFZ=-3.2
  mMat.opacity=fanRatio*0.65; mmMat.opacity=fanRatio*0.45
  for (let i=0; i<mLife.length; i++) {
    mLife[i]=(mLife[i]+0.013*(0.4+fanRatio))%1; const t=mLife[i], ang=mAngOff[i]+t*Math.PI*3.5, r=1.0*t
    mPos[i*3]=TFX+Math.cos(ang)*r+rn(0.12); mPos[i*3+1]=TFY+t*2.5+rn(0.10); mPos[i*3+2]=TFZ+Math.sin(ang)*r+rn(0.12)
  }
  mGeo.attributes.position.needsUpdate=true
  for (let i=0; i<mmLife.length; i++) {
    mmLife[i]=(mmLife[i]+0.007)%1; const t=mmLife[i]
    mmPos[i*3]=TFX+rn(0.9); mmPos[i*3+1]=TFY+0.5+t*3.5+rn(0.25); mmPos[i*3+2]=TFZ+rn(0.9)
  }
  mmGeo.attributes.position.needsUpdate=true

  const lvl=Math.max(0.02,sim.tank/100)
  tankWater.scale.y=lvl
  M.water.color.setHSL(0.58,0.82,0.22+lvl*0.20); M.water.opacity=0.40+lvl*0.26

  controls.update(); composer.render()
}

// ── Public init ────────────────────────────────────────────────────────────────
export function initScene(container, physTickCb) {
  onPhysTick=physTickCb
  p1Angle=0; p2Angle=0; fanAngle=0; fanSpeed=0

  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
  renderer.setPixelRatio(Math.min(devicePixelRatio,2))
  renderer.setSize(container.clientWidth,container.clientHeight)
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.85
  container.appendChild(renderer.domElement)

  scene=new THREE.Scene()
  scene.background=new THREE.Color(0x1a1c20)
  scene.fog=new THREE.Fog(0x1a1c20,24,55)

  camera=new THREE.PerspectiveCamera(48,container.clientWidth/container.clientHeight,0.1,200)
  camera.position.set(13,8,13)
  controls=new OrbitControls(camera,renderer.domElement)
  controls.target.set(0,2.5,0); controls.enableDamping=true; controls.dampingFactor=0.07
  controls.minDistance=3; controls.maxDistance=45; controls.maxPolarAngle=Math.PI*0.48
  controls.update()

  const pmrem=new THREE.PMREMGenerator(renderer)
  scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture; pmrem.dispose()

  // Post-processing
  composer=new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene,camera))
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth,container.clientHeight),
    0.10, 0.40, 0.92
  ))

  buildMaterials(); buildFloor(); buildPlatform(); buildLights()
  pump1=buildPump(-2.5,0); pump2=buildPump(2.5,0)
  towerFan=buildCoolingTower(0,PLAT_Y,-3.2)
  tankWater=buildTank(7.5,0,0)
  buildPipes(); buildParticles()

  const ro=new ResizeObserver(()=>{
    const w=container.clientWidth, h=container.clientHeight
    renderer.setSize(w,h); composer.setSize(w,h)
    camera.aspect=w/h; camera.updateProjectionMatrix()
  })
  ro.observe(container)
  requestAnimationFrame(animate)

  return ()=>{
    cancelAnimationFrame(rafId); ro.disconnect()
    try{composer.dispose()}catch(_){}
    renderer.dispose()
    if(container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
  }
}
