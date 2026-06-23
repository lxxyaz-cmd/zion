# Zion — Industrial Digital Twin Visualization Library

> A lightweight **Three.js** component library for building real-time 3D digital twin interfaces for industrial systems — pumps, cooling towers, tanks, pipe networks, platforms, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-%3E%3D0.150-black)](https://threejs.org)

---

## Features

- **Pre-built industrial components** — centrifugal pumps, cooling towers, storage tanks with physically correct geometry
- **PBR material presets** — stainless steel, painted metal, water (transmission), brick wall — all `MeshStandardMaterial` / `MeshPhysicalMaterial`
- **Animated equipment** — impeller rotation, fan blades, dynamic water level, status indicator lights
- **Scene factory** — one-call setup for renderer (ACESFilmic tone mapping), orbit controls, PBR environment, shadow maps
- **Geometry helpers** — `addPipe()`, `addSlab()`, `addBox()` for building pipe runs, structural members, and platforms
- **Framework-agnostic** — plain ES modules, works with Vite / Vanilla HTML / Vue / React

---

## Quick Start

```html
<!-- index.html (no build step needed) -->
<script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.177/build/three.module.js",
                 "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.177/examples/jsm/" } }
</script>
<script type="module">
  import { createIndustrialScene, CentrifugalPump, CoolingTower, StorageTank } from './src/index.js'

  const { scene, animate } = createIndustrialScene(document.getElementById('viewport'))

  const pump  = new CentrifugalPump(scene, { position: [-2.5, 0, 0] })
  const tower = new CoolingTower(scene,    { position: [0, 3.6, -3] })
  const tank  = new StorageTank(scene,     { position: [7.5, 0, 0] })

  pump.setSpeed(1450)
  tower.setFanSpeed(960)
  tank.setLevel(75)

  animate(() => {
    pump.update(0.016)
    tower.update(0.016)
  })
</script>
<div id="viewport" style="width:100vw;height:100vh"></div>
```

---

## Installation

```bash
npm install zion-digital-twin three
```

```js
import { createIndustrialScene, CentrifugalPump } from 'zion-digital-twin'
```

---

## API

### `createIndustrialScene(container, opts?)`

Sets up a complete Three.js scene.

| Option | Default | Description |
|---|---|---|
| `cameraPos` | `[-1, 4.2, 11.5]` | Initial camera world position |
| `cameraTarget` | `[2.5, 1.8, -1.5]` | OrbitControls target |
| `fov` | `52` | Camera vertical FOV |

Returns `{ scene, camera, renderer, controls, animate, dispose }`.

---

### `CentrifugalPump(scene, opts?)`

| Option | Type | Description |
|---|---|---|
| `position` | `[x, y, z]` | World position (default `[0,0,0]`) |
| `materials` | `object` | Override any of `body / motor / stainless / valve / pipe` |

| Method | Description |
|---|---|
| `setSpeed(rpm)` | Set pump speed (0–1450 RPM typical) |
| `update(dt)` | Advance impeller rotation; call in animation loop |

---

### `CoolingTower(scene, opts?)`

| Method | Description |
|---|---|
| `setFanSpeed(rpm)` | Set fan RPM (0–960). Updates blade glow and point light. |
| `update(dt)` | Advance fan rotation |

---

### `StorageTank(scene, opts?)`

| Option | Default |
|---|---|
| `width / depth / height` | `2.8 / 2.0 / 2.8` (meters) |

| Method | Description |
|---|---|
| `setLevel(percent)` | Fill level 0–100%. Updates water geometry height and color. |

---

### Material helpers

```js
import { stainlessMat, waterMat, brickWallMat } from 'zion-digital-twin/materials'
```

All helpers return a fresh `MeshStandardMaterial` or `MeshPhysicalMaterial` instance.

---

### Geometry helpers

```js
import { addPipe, addSlab, addBox } from 'zion-digital-twin/utils'

// Pipe between two world points
addPipe(scene,
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(3, 0, 0),
  0.08, pipeMat()
)

// Inclined structural slab (local Z → direction vector)
addSlab(scene,
  new THREE.Vector3(0, 0, 2.2),   // bottom foot
  new THREE.Vector3(0, 3.6, 0.2), // top at platform
  0.30, 0.08, pumpBodyMat()
)
```

---

## Running the Demo

```bash
git clone https://github.com/lxxyaz-cmd/zion.git
cd zion
npm install
npm run dev
# Open http://localhost:5173
```

The cooling-system demo shows two centrifugal pumps, a counter-flow cooling tower, and a storage tank with live water-level animation, all connected by a pipe network.

---

## Project Structure

```
src/
├── index.js              # Main entry — re-exports everything
├── scene/
│   └── setup.js          # createIndustrialScene()
├── components/
│   ├── Pump.js           # CentrifugalPump
│   ├── CoolingTower.js   # CoolingTower
│   └── Tank.js           # StorageTank
├── materials/
│   └── industrial.js     # PBR material presets
└── utils/
    └── geometry.js       # addBox / addPipe / addSlab / addCylinder / addTorus
examples/
└── cooling-system/       # Full interactive demo
```

---

## Roadmap

- [ ] `Valve` component (ball valve, butterfly valve) with open/close animation
- [ ] `PipeNetwork` builder — auto-routing between equipment connection points
- [ ] `ParticleFlow` — water-flow particles along pipe paths
- [ ] `HMIOverlay` — Vue/React-compatible 2D data overlay panel
- [ ] Modbus-over-WebSocket data adapter for live SCADA integration
- [ ] UE5 / Unity export utilities

---

## License

MIT © 2026 [lxxyaz-cmd](https://github.com/lxxyaz-cmd)
