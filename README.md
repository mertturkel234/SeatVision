# SeatVision — Intelligent Cinema Seat Discovery & Recommendation Platform

SeatVision is an intelligent cinema seat discovery, view preview, and recommendation platform built for moviegoers and cinema operators. It replaces abstract seating grids with verified metric geometry, explainable seat recommendations (SeatMatch™), view-from-seat previews, and side-by-side comparisons.

## 🌟 Implemented Features

1. **Interactive 3D Cinema Auditorium:**
   - Real-time Three.js WebGL visualization of the auditorium featuring stepped stadium platforms, acoustic walls, glowing curved cinema screen, and aisle step lighting.
   - Individual 3D seats with ergonomic cushions, armrests, and cup holders.
   - Camera view presets: Overview (isometric), Top-Down (architectural plan), and Screen-Facing.
   - "Bu Koltuktan Gör" (View From This Seat) smooth eye-level camera animation for inspecting real screen sightlines and FOV.
   - Accessible 2D seating chart toggle with automatic WebGL failure fallback.

2. **SeatMatch™ — Smart Seat Assistant:**
   - Deterministic, explainable recommendation algorithm scoring viewing angle, distance from screen, auditorium zone, and verified premium category.
   - Transparent explanations breaking down the score into factor weights rather than an arbitrary blackbox number.
   - Explains data limitations and adjusts confidence (High / Moderate / Low).

2. **View From Seat Preview:**
   - Dedicated interactive preview panel showing simulated 3D perspective based on seat coordinates $(x, y)$.
   - Real-time drag-to-pan viewport with calculated horizontal field of view (FOV).
   - Known obstruction warnings (e.g. cross-aisle railings) with operator verification status.
   - Quick navigation between adjacent seats in the row.

3. **Compare Two Seats Side-by-Side:**
   - Compare any two seats: visual sightlines, viewing angle, distance in screen widths, pricing, and obstruction status.

4. **Group Seat Finder:**
   - Contiguous block finder for parties of 1 to 8 people.
   - Respects physical auditorium geometry: aisles, gaps, and recliner pairs break adjacency even when seat labels are sequential.
   - Transparent fallback: If no contiguous block exists, explains why and suggests split alternatives in adjacent rows.

5. **Cinema Experience Comparison:**
   - Multi-hall comparison across Standard, Premium Recliner, Large Format, and 3D formats with verified amenities and price ranges.

6. **Ticket + Snacks & Drinks Demo Cart:**
   - Concessions add-on flow with combos, popcorn, and drinks.
   - Distinct ticket vs. concession subtotal calculations in integer minor currency units.

7. **Cinematic Digital Ticket Pass:**
   - Polished mobile-ready digital ticket with key art, showtime details, and a demo QR code clearly marked "DEMO CODE — NOT VALID FOR ENTRY".

8. **Personalized Movie Discovery:**
   - Transparent, rule-based movie matching by genres, mood/atmosphere, and auditorium formats.

9. **B2B Cinema Operator Control Centre:**
   - Prototype dashboard showcasing hall blueprint auditing, geometry survey status, and panorama verification tracking.

---

## 🛠️ Technical Stack

- **Framework:** [Next.js](https://nextjs.org/) 16.4.3 (App Router, Turbopack, Cache Components, React 19)
- **Language:** TypeScript 5.x (Strict type checking)
- **Styling:** Tailwind CSS v4 (Cinematic charcoal & warm champagne-gold palette)
- **Icons:** Lucide React
- **Testing:** Vitest 5.x (46 automated unit tests covering geometry, adjacency, scoring, pricing, and checkout)
- **Data Architecture:** Repository Pattern (`SeatVisionRepository`) abstracting deterministic demo data from future live APIs.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20.x or 24.x
- npm 10.x or 11.x

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/mertturkel234/SeatVision.git
cd SeatVision

# Install dependencies
npm install

# Run automated tests
npm run test

# Run TypeScript check
npm run typecheck

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Domain & Data Models](docs/DOMAIN_MODEL.md)
- [SeatMatch Scoring Specification](docs/SEATMATCH.md)
- [Development Roadmap](docs/ROADMAP.md)

---

## ⚠️ Demo Mode Notice & Limitations

SeatVision is currently configured in demo mode with a deterministic in-memory mock dataset (`src/lib/data/demo/dataset.ts`).
- Showtimes, auditoriums, and pricing are fictional.
- Seat selection and checkout are simulated; no payment processing or live cinema ticketing reservations occur.
- Panoramic views are simulated using coordinate transforms against an empty auditorium environment photograph until real $360^\circ$ captured spherical assets are uploaded by theatre operators.
