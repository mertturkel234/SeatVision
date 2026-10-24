# SeatVision Development Roadmap

## Phase 1: MVP Core & Extended Features (Completed)
- [x] Initialized Next.js 16.4 App Router, TypeScript strict, Tailwind CSS.
- [x] Established strict domain model (`types.ts`) with data provenance (`demo`, `verified-static`, `live`).
- [x] Developed pure domain libraries:
  - Metric auditorium geometry & field-of-view calculation (`geometry.ts`).
  - Graph-based physical adjacency and contiguous block finder (`adjacency.ts`).
  - SeatMatch explainable scoring algorithm (`seatmatch.ts`).
  - Concessions cart & demo order generation (`cart.ts`).
  - Transparent rule-based movie discovery (`discovery.ts`).
  - Format comparison builder (`experiences.ts`).
- [x] Implemented responsive interactive auditorium seating map with curved rows, aisles, and wheelchair spaces.
- [x] Built interactive "View From Seat" with dynamic 3D perspective transforms, FOV reticle, and drag-to-pan simulation.
- [x] Built side-by-side seat comparison drawer.
- [x] Built demo concessions add-on flow with popcorn/drink combos.
- [x] Built cinematic digital ticket with demo QR code matrix.
- [x] Created B2B Cinema Operator Dashboard (audit coordinates, surveyed geometry, panorama status).
- [x] Authored 46 automated unit tests with 100% pass rate. Verified production build.

## Phase 2: Cinema Integration & Live Ingest (Next Planned Milestone)
- [ ] Implement `LiveRepository` connector to integrate with POS/ticketing APIs (Vista, RTS, Veezi).
- [ ] Webhook receiver for live seat lock/release inventory updates.
- [ ] Multi-tenant cinema operator authentication (SSO / role-based permissions).
- [ ] Laser-scan geometry importer (import CAD / DXF / JSON floorplans).

## Phase 3: Spatial Media Assets & Device Orientation
- [ ] Spherical $360^\circ$ equirectangular WebGL panorama renderer for surveyed halls.
- [ ] Mobile gyroscope / device-orientation support for panoramic view exploration.
- [ ] Apple Wallet / Google Wallet pass generation for digital tickets.
- [ ] Embeddable web widget (`<seat-vision-widget />`) for partner theatre checkout funnels.
