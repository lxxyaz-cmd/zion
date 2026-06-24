# Changelog

All notable changes to **Zion** are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Zion uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- `Valve` component — ball valve and butterfly valve with open/close animation
- `PipeNetwork` builder — auto-routing between equipment connection points
- `ParticleFlow` — water-flow particles along pipe paths
- `HMIOverlay` — Vue/React-compatible 2D data overlay panel
- Modbus-over-WebSocket adapter for live SCADA integration
- TypeScript type definitions (`.d.ts`)
- UE5 / Unity export utilities

---

## [0.2.0] — 2026-06-01

### Added
- `StorageTank` component: configurable `width / depth / height`, dynamic water level via `setLevel(percent)`
- `waterMat()` material helper: `MeshPhysicalMaterial` with transmission, roughness, and IOR tuned for industrial water
- `brickWallMat()` material helper for structural wall surfaces
- `addSlab()` geometry helper for inclined structural members (ladders, ramps, bracing)
- Cooling-system demo: two centrifugal pumps + counter-flow cooling tower + storage tank with live water-level animation, all connected by a pipe network

### Changed
- `createIndustrialScene()` now accepts `cameraPos`, `cameraTarget`, and `fov` options (breaking change from 0.1.x defaults)
- `CoolingTower.setFanSpeed()` now also updates blade emissive glow and a point light intensity proportional to RPM

### Fixed
- `CentrifugalPump`: impeller rotation direction was reversed (clockwise instead of counter-clockwise when viewed from motor end)
- `addPipe()`: cylinder end-caps were not being disposed when the scene was torn down

---

## [0.1.0] — 2026-05-10

### Added
- `createIndustrialScene(container, opts?)` — one-call Three.js scene factory with ACESFilmic tone mapping, PMREM environment, PCF shadow maps, and `OrbitControls`
- `CentrifugalPump` component: volute casing, motor housing, impeller (animated), inlet/outlet flanges, status indicator light
- `CoolingTower` component: counter-flow shell, fan assembly (animated), fill media representation, basin
- PBR material presets: `stainlessMat()`, `paintedMetalMat()`, `pumpBodyMat()`, `pipeMat()`
- `addPipe(scene, start, end, radius, material)` geometry helper
- `addBox(scene, position, size, material)` geometry helper
- MIT License
- Initial README with Quick Start, API reference, and project structure

[Unreleased]: https://github.com/lxxyaz-cmd/zion/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/lxxyaz-cmd/zion/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lxxyaz-cmd/zion/releases/tag/v0.1.0
