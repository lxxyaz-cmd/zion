# Zion API Reference

This document covers every public export in Zion. For a guided introduction see the main [README](../README.md).

---

## Table of Contents

- [Scene Factory](#scene-factory)
- [Components](#components)
  - [CentrifugalPump](#centrifugalpump)
  - [CoolingTower](#coolingtower)
  - [StorageTank](#storagetank)
- [Materials](#materials)
- [Geometry Helpers](#geometry-helpers)
- [Disposal](#disposal)

---

## Scene Factory

### `createIndustrialScene(container, opts?)`

Sets up a complete, production-ready Three.js rendering environment in a single call.

```js
import { createIndustrialScene } from 'zion-digital-twin'

const { scene, camera, renderer, controls, animate, dispose } =
  createIndustrialScene(document.getElementById('viewport'), {
    cameraPos:    [-1, 4.2, 11.5],
    cameraTarget: [2.5, 1.8, -1.5],
    fov: 52,
  })
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cameraPos` | `[x, y, z]` | `[-1, 4.2, 11.5]` | Initial camera world position |
| `cameraTarget` | `[x, y, z]` | `[2.5, 1.8, -1.5]` | `OrbitControls` target |
| `fov` | `number` | `52` | Vertical field of view in degrees |
| `shadowMapSize` | `number` | `2048` | Shadow map resolution (power of 2) |
| `toneMapping` | `THREE.ToneMapping` | `THREE.ACESFilmicToneMapping` | Renderer tone mapping |
| `background` | `THREE.Color \| string` | `'#1e2327'` | Scene background color |

**Returns**

| Property | Type | Description |
|----------|------|-------------|
| `scene` | `THREE.Scene` | The Three.js scene — add your objects here |
| `camera` | `THREE.PerspectiveCamera` | Active perspective camera |
| `renderer` | `THREE.WebGLRenderer` | WebGL renderer attached to `container` |
| `controls` | `OrbitControls` | Orbit controls — `controls.enabled = false` to disable |
| `animate(callback?)` | `function` | Starts the render loop; optional `callback(dt)` receives delta time in seconds |
| `dispose()` | `function` | Tears down renderer, controls, resize observer, and event listeners |

**What it configures**

- `ACESFilmicToneMapping` at exposure 1.0
- PCF soft shadows (`THREE.PCFSoftShadowMap`)
- PMREM environment map from a neutral studio HDR
- A directional sun light + ambient fill + a ground hemisphere light
- `OrbitControls` with damping enabled
- `ResizeObserver` to keep the camera aspect ratio correct

---

## Components

All components follow the same lifecycle:

```
constructor(scene, opts?) → update(dt) [each frame] → dispose()
```

Calling `dispose()` removes the component's `THREE.Group` from the scene and frees all GPU memory.

---

### `CentrifugalPump`

A physically proportioned centrifugal pump: volute casing, motor housing, impeller (animated), inlet and outlet flanges, valve handles, and a status LED.

```js
import { CentrifugalPump } from 'zion-digital-twin'

const pump = new CentrifugalPump(scene, {
  position: [-2.5, 0, 0],
  materials: { body: myCustomMat },
})

pump.setSpeed(1450)   // RPM
pump.setStatus('fault')

animate((dt) => {
  pump.update(dt)
})
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position of the pump base |
| `materials` | `object` | PBR presets | Override any named sub-material (see below) |

**Material slots**

| Slot | Default |
|------|---------|
| `body` | `pumpBodyMat()` — blue-grey painted metal |
| `motor` | `paintedMetalMat('#2a2a2a')` — dark motor housing |
| `stainless` | `stainlessMat()` — impeller and flanges |
| `valve` | `paintedMetalMat('#e8600a')` — orange valve handles |
| `pipe` | `pipeMat()` — mid-grey piping |

**Methods**

| Method | Description |
|--------|-------------|
| `setSpeed(rpm)` | Set pump speed. Range: 0–1450 RPM. Affects animation speed and LED brightness. |
| `setStatus(status)` | `'running'` (green LED) \| `'stopped'` (amber) \| `'fault'` (red flashing) |
| `update(dt)` | Advance impeller rotation. Call every frame inside `animate()`. |
| `dispose()` | Remove from scene and free GPU resources. |

---

### `CoolingTower`

A counter-flow induced-draft cooling tower with animated fan blades, fill media, basin, and an intake hood.

```js
import { CoolingTower } from 'zion-digital-twin'

const tower = new CoolingTower(scene, {
  position: [0, 3.6, -3],
  scale: 1.0,
})

tower.setFanSpeed(960)  // RPM

animate((dt) => {
  tower.update(dt)
})
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position of the tower base |
| `scale` | `number` | `1.0` | Uniform scale multiplier |

**Methods**

| Method | Description |
|--------|-------------|
| `setFanSpeed(rpm)` | Fan speed 0–960 RPM. Also updates blade emissive glow and a point light intensity. |
| `update(dt)` | Advance fan rotation. |
| `dispose()` | Remove from scene and free GPU resources. |

---

### `StorageTank`

A rectangular stainless-steel storage tank with a dynamic water fill that updates geometry height and color based on fill percentage.

```js
import { StorageTank } from 'zion-digital-twin'

const tank = new StorageTank(scene, {
  position: [7.5, 0, 0],
  width: 2.8,
  depth: 2.0,
  height: 2.8,
})

tank.setLevel(75)  // 75% full
```

**Options**

| Option | Type | Default |
|--------|------|---------|
| `position` | `[x, y, z]` | `[0, 0, 0]` |
| `width` | `number` (m) | `2.8` |
| `depth` | `number` (m) | `2.0` |
| `height` | `number` (m) | `2.8` |

**Methods**

| Method | Description |
|--------|-------------|
| `setLevel(percent)` | Fill level 0–100. Updates water mesh height and tints color from blue-clear (low) to blue-opaque (full). |
| `dispose()` | Remove from scene and free GPU resources. |

---

## Materials

All material helpers return a **fresh instance** each call. Do not cache and share across multiple meshes if you intend to modify properties independently.

```js
import {
  stainlessMat,
  paintedMetalMat,
  pumpBodyMat,
  pipeMat,
  waterMat,
  brickWallMat,
} from 'zion-digital-twin/materials'
```

| Helper | Base class | Key parameters |
|--------|-----------|----------------|
| `stainlessMat(opts?)` | `MeshStandardMaterial` | `roughness: 0.15`, `metalness: 0.95`, `color: #c8ccd0` |
| `paintedMetalMat(color?, opts?)` | `MeshStandardMaterial` | `roughness: 0.45`, `metalness: 0.2` |
| `pumpBodyMat(opts?)` | `MeshStandardMaterial` | Blue-grey `#4a5c6e`, `roughness: 0.55`, `metalness: 0.3` |
| `pipeMat(opts?)` | `MeshStandardMaterial` | Mid-grey `#8a8e92`, `roughness: 0.5`, `metalness: 0.4` |
| `waterMat(opts?)` | `MeshPhysicalMaterial` | `transmission: 0.92`, `roughness: 0.05`, `ior: 1.33` |
| `brickWallMat(opts?)` | `MeshStandardMaterial` | Terracotta `#b5651d`, `roughness: 0.9`, `metalness: 0` |

Each helper accepts an `opts` object that is spread over the material constructor, allowing any `MeshStandardMaterial` / `MeshPhysicalMaterial` property to be overridden:

```js
const redPipe = pipeMat({ color: '#c0392b', roughness: 0.3 })
```

---

## Geometry Helpers

```js
import { addPipe, addSlab, addBox, addCylinder, addTorus } from 'zion-digital-twin/utils'
```

### `addPipe(scene, start, end, radius, material)`

Places a capped cylinder aligned between two world-space points.

| Param | Type | Description |
|-------|------|-------------|
| `scene` | `THREE.Scene` | Target scene |
| `start` | `THREE.Vector3` | Start point |
| `end` | `THREE.Vector3` | End point |
| `radius` | `number` | Pipe outer radius in metres |
| `material` | `THREE.Material` | Applied to the cylinder mesh |

Returns the `THREE.Mesh` so you can attach it to a group or further modify it.

---

### `addSlab(scene, foot, top, width, thickness, material)`

A rectangular slab (structural member, ramp, ladder rail) aligned from `foot` to `top`.

| Param | Type | Description |
|-------|------|-------------|
| `foot` | `THREE.Vector3` | Bottom attachment point |
| `top` | `THREE.Vector3` | Top attachment point |
| `width` | `number` | Slab width perpendicular to the direction vector |
| `thickness` | `number` | Slab thickness |
| `material` | `THREE.Material` | — |

---

### `addBox(scene, position, size, material)`

A `BoxGeometry` mesh placed at `position`.

| Param | Type | Description |
|-------|------|-------------|
| `position` | `THREE.Vector3` | World position |
| `size` | `[w, h, d]` | Width, height, depth in metres |
| `material` | `THREE.Material` | — |

---

### `addCylinder(scene, position, radiusTop, radiusBottom, height, material)`

Thin wrapper around `CylinderGeometry` with convenient defaults (`radialSegments: 32`, closed end-caps).

---

### `addTorus(scene, position, radius, tube, material)`

`TorusGeometry` placed at `position`. Useful for flanges, pipe elbows, and valve hand-wheels.

---

## Disposal

**Always call `dispose()`** when removing a component or tearing down a scene. Failing to do so leaks GPU memory (geometries and textures remain on the GPU even after JS objects are garbage-collected).

```js
// Cleaning up a single component
pump.dispose()

// Tearing down the entire scene
pump.dispose()
tower.dispose()
tank.dispose()
dispose()   // from createIndustrialScene — removes renderer and event listeners
```

For manual geometry and material cleanup, Three.js provides:

```js
mesh.geometry.dispose()
mesh.material.dispose()
```

Zion's own helpers all implement `dispose()` that traverse their internal `THREE.Group` and call both on every child mesh.
