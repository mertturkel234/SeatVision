# SeatMatch™ — Recommendation Model & Scoring Specification

## 1. Concept

SeatMatch is a deterministic, explainable seat recommendation assistant. It measures how well eligible seats fit user preferences based on spatial geometry, availability, and pricing.

A recommendation score (0–100%) indicates **preference fit among eligible candidates**, not an objective statement of absolute quality.

## 2. Hard Eligibility Constraints

Before scoring, candidate seats must pass all hard eligibility checks:
1. **Explicit Availability:** The seat status in the snapshot must be `"available"`. Unknown, sold, or blocked seats are excluded immediately.
2. **Physical Adjacency:** For parties of $N \ge 2$, all $N$ seats must form a contiguous physical run linked by `rightNeighborId`.
3. **Geometry Completeness:** Physical screen width and seat coordinates $(x, y)$ must exist. If screen geometry is unknown, recommendations are withheld with an explanatory note.
4. **Standard Kind:** Accessible spaces (`wheelchair-space`, `companion`) are reserved for direct selection and not auto-assigned by default algorithms.

## 3. Configurable Scoring Weights

For the initial MVP default model:
- **Viewing Angle & Centre Alignment:** 40%
- **Preferred Rear Zone:** 25%
- **Verified Premium Category:** 20%
- **Preferred Viewing Distance:** 15%

When user preferences omit a category (e.g. `preferredZone = 'any'`), the corresponding weight is set to 0 and active weights are re-normalised so $\sum w_i = 1.0$.

### Component Calculations

1. **Viewing Angle Score ($S_\text{angle}$):**
   $$\theta = \arctan\left(\frac{|x - x_\text{screen}|}{y}\right) \times \frac{180}{\pi}$$
   $$S_\text{angle} = \max\left(0, 1 - \frac{\theta}{30^\circ}\right)$$

2. **Distance Score ($S_\text{distance}$):**
   Seats are measured in screen widths $D = y / W_\text{screen}$.
   - Balanced preference band: $[1.0, 1.6]$ screen widths.
   - Closer (immersive) band: $[0.6, 1.0]$.
   - Rear band: $[1.5, 2.3]$.
   Full credit ($1.0$) is awarded within the preferred band, tapering linearly outside it.

3. **Zone Score ($S_\text{zone}$):**
   Depth ratio $r \in [0, 1]$ from front-most row to rear-most row.
   - Rear preference: full credit for $r \ge 0.75$, ramps up from $r = 0.35$.
   - Front preference: full credit for $r \le 0.25$.
   - Middle preference: peaked at $r = 0.5$.

4. **Category Score ($S_\text{category}$):**
   - Operator-verified premium or recliner: $1.0$.
   - Unverified premium: $0.5$ (penalised for uncertainty).
   - Standard category: $0.0$.
   *(A high price never infers a premium category).*

## 4. Explainability & Limitations

Every recommendation card returns:
- Top human-readable reasons (e.g. "Close to centreline — about 2.4° off-axis on average").
- Limitations & data confidence (High, Moderate, Low).
- Detailed breakdown of each factor and its weight.
- Fallback handling: When no contiguous block of size $N$ is available, SeatMatch explains why (e.g. "The longest connected run is 2") and presents clearly labeled split alternatives in neighbouring rows.
