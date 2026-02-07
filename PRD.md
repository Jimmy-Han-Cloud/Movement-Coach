# Movement Coach - Product Requirements Document (PRD v1)

> Canonical reference for product definition and constraints.
> This document defines WHAT the product is. See WORKFLOW.md for HOW it works.

---

## Part I: Product Definition

### 1. Product Type

A browser-based, camera-driven, music-synchronized guided movement experience for seated computer users.

| Attribute | Value |
|-----------|-------|
| Session Length | 3-5 minutes (global, fixed) |
| Target User | Sedentary computer users |
| Primary Goal | Meaningful neck, shoulder, upper-back, and arm movement |
| Philosophy | No scoring, no failure, no judgment |

### 2. Tracked Body Points (Immutable Core)

Always exactly **7 tracked points**:

| # | Point | Description |
|---|-------|-------------|
| 1 | Head | Forehead center |
| 2 | Left Shoulder | Left shoulder joint |
| 3 | Right Shoulder | Right shoulder joint |
| 4 | Left Elbow | Left elbow joint |
| 5 | Right Elbow | Right elbow joint |
| 6 | Left Hand | Left wrist (extended to palm) |
| 7 | Right Hand | Right wrist (extended to palm) |

**Immutable**: No phase, flow, or feature ever reduces or substitutes these points.

### 3. Movement Semantics (Immutable)

#### Position + Hold (Pose Hold)

Applied to: Head, Shoulders, Elbows

| Requirement | Description |
|-------------|-------------|
| Reach | User reaches target position |
| Maintain | Hold for duration (1.5-3s, personalized) |
| Stability | Graded tolerance (stable / minor sway / off) |

#### Position + Trajectory (Hand Motion)

Applied to: Both Hands

| Requirement | Description |
|-------------|-------------|
| Alignment | Start and end positions must align |
| Direction | Mid-trajectory judged by direction + rhythm |
| Elbow | Elbow participation required for motion authenticity |

### 4. Phase Model (Immutable Structure)

The system is composed of explicit phases:

| Phase Type | Description |
|------------|-------------|
| Neutral | Calibration, baseline recording |
| Pose Hold | Static position with hold duration |
| Hand Motion | Dynamic hand movement with trajectory |

**Phase order is fixed per Flow. Phase semantics are never changed by personalization.**

### 5. Safety & Health Anchors (Global)

These constraints **cannot** be personalized away:

| Constraint | Description |
|------------|-------------|
| Minimum pose-hold duration | Cannot go below safety threshold |
| Minimum elbow participation | Hand motion requires elbow involvement |
| Shoulder opening | At least one meaningful shoulder-opening pose per session |

### 6. Personalization (Confirmed Scope)

#### Per-user adjustable (gradual, bounded):
- Pose hold duration
- Positional tolerance
- Elbow participation threshold
- Hand motion tempo

#### Global (never personalized):
- Session duration
- Phase order
- Movement semantic types
- Tracked points

**Adaptation is gradual, trend-based, reversible.**

### 7. Smart Logic (Explicitly Authorized Only)

| Logic | Status | Description |
|-------|--------|-------------|
| ① Intent Detection | ✅ Authorized | Detects if user is moving toward target. Affects feedback tone only. Never affects success, timing, or validation. |
| ② Micro Timing Adaptation | ✅ Authorized | Phase duration may adjust by ±0.5s max. Only within a phase. Never skips or reorders phases. Never violates safety anchors. |
| Other | ❌ Forbidden | No other smart logic exists in v1. |

### 8. What This Product Is NOT

- ❌ Not posture scoring
- ❌ Not fitness training
- ❌ Not dance instruction
- ❌ Not ML action classification
- ❌ Not competitive or gamified

---

## Part II: Flow Definition

### Flow Example: 3-Minute Session (180 seconds)

All phases use the same 7 points and identical validation rules.

| Time | Phase | Type | Purpose |
|------|-------|------|---------|
| 0-15s | Calibration | Neutral | Establish personal baseline |
| 15-45s | Neck Release | Pose Hold | Neck mobility & release |
| 45-65s | Light Rhythm | Hand Motion | Arm wake-up |
| 65-95s | Shoulder + Elbow Open | Pose Hold | Core shoulder engagement |
| 95-115s | Flowing Arms | Hand Motion | Coordinated arm movement |
| 115-145s | Integrated Reset | Pose Hold | Upper-body integration |
| 145-170s | Gentle Rhythm Close | Hand Motion | Rhythmic cooldown |
| 170-180s | Neutral End | Neutral | Return to rest |

### Phase Details

#### Phase 0 — Calibration (0-15s)
- **Type**: Neutral
- **Tracked points**: Head, Shoulders, Elbows
- **Validation**: None (record baseline only)
- **Purpose**: Establish relative position reference

#### Phase 1 — Neck Release (15-45s)
- **Type**: Pose Hold
- **Primary focus**: Head position
- **Tracked points**: Head + Shoulders + Elbows
- **Validation**: Head reaches target, shoulders stable, hold 1.5-3s
- **Smart Logic**: Intent Detection + Micro Timing applied

#### Phase 2 — Light Rhythm (45-65s)
- **Type**: Hand Motion
- **Tracked points**: Hands + Elbows
- **Validation**: Start/end alignment, direction match, elbow participation
- **Judgment**: Direction + rhythm, not precision

#### Phase 3 — Shoulder + Elbow Open (65-95s)
- **Type**: Pose Hold
- **Primary focus**: Shoulders + Elbows
- **Tracked points**: Shoulders + Elbows + Head
- **Validation**: Elbows reach height, shoulders open, head neutral
- **Note**: Core "health-effective" phase. Safety anchors strictly enforced.

#### Phase 4 — Flowing Arms (95-115s)
- **Type**: Hand Motion
- **Tracked points**: Hands + Elbows
- **Validation**: Continuous motion, rhythm aligned, elbows move with hands

#### Phase 5 — Integrated Reset (115-145s)
- **Type**: Pose Hold
- **Tracked points**: Head + Shoulders + Elbows
- **Purpose**: Integrate prior movement, stabilize posture

#### Phase 6 — Gentle Rhythm Close (145-170s)
- **Type**: Hand Motion
- **Tracked points**: Hands + Elbows
- **Purpose**: Light rhythmic movement, gradual intensity downshift

#### Phase 7 — Neutral End (170-180s)
- **Type**: Neutral
- **Tracked points**: None validated
- **Purpose**: End session calmly

---

## Part III: Motion Constraints & Design Principles

### 1. Core Design Philosophy

#### Movement Is Constrained, Not Invented
- All motion selected from predefined motion primitives
- Sequenced according to validated constraints
- Bounded by human joint range, speed, and coordination limits
- Randomness is compositional, not generative

#### Control > Amplitude
Prioritize:
- Controlled engagement
- Joint participation
- Structural integrity

Over:
- Large range of motion
- Exaggerated angles
- Visual dramatization

### 2. Global Safety Constraints (Always Enforced)

| Constraint | Description |
|------------|-------------|
| No Ballistic Motion | No sudden acceleration/deceleration, no snapping/jerking |
| Neck Protection | Head movements slow and deliberate, no fast rotations |
| Shoulder/Elbow Required | Upper-body movement requires shoulder and elbow involvement |

### 3. Temporal Principles

| Principle | Description |
|-----------|-------------|
| Hold Time Required | Static positions must be reached intentionally and held |
| Motion Alternates | Effective sequences alternate between Pose Hold and Hand Motion |
| Rhythm Guides, Not Forces | Music rhythm guides but never forces unsafe speed |

### 4. Evaluation Philosophy

| Principle | Description |
|-----------|-------------|
| Participation > Precision | Evaluate joint involvement, not exact angles |
| Effort ≠ Success | Moving correctly but not reaching target ≠ no movement |

### 5. What The System Explicitly Avoids

- ❌ ML-based action classification for real-time validation
- ❌ Competitive scoring or ranking
- ❌ Binary pass/fail judgments
- ❌ Forced symmetry
- ❌ High-speed or high-amplitude choreography

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-06 | v1.0 | Initial canonical PRD |

---

*This document is the source of truth for product requirements.*
*Implementation details are in WORKFLOW.md.*
*Development progress is tracked in PROGRESS.md.*
