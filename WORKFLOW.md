# Movement Coach - Complete Workflow

> This document is the core reference for the project, covering:
> - PRD Core Principles (immutable)
> - Movement Safety Constraints
> - Complete User Flow (aligned with UX_SPEC.md v1.1)
> - Technical Implementation Guide
> - Key Decision Records
>
> Last Updated: 2026-02-09

---

## Part 1: Core Principles (PRD v1 Immutable)

### Product Definition
- **Type:** Browser-based, camera-driven, music-synchronized guided movement experience
- **Users:** Sedentary computer users
- **Duration:** 3-5 minutes per song
- **Goal:** Meaningful movement of neck, shoulders, upper back, and arms
- **Principles:** No scoring, no failure, no judgment

### 7 Tracked Points (Immutable)

| # | Name | Description |
|---|------|-------------|
| 1 | Head | Forehead center |
| 2 | Left Shoulder | Left shoulder |
| 3 | Right Shoulder | Right shoulder |
| 4 | Left Elbow | Left elbow |
| 5 | Right Elbow | Right elbow |
| 6 | Left Hand | Left wrist (estimates palm position) |
| 7 | Right Hand | Right wrist (estimates palm position) |

**Immutable:** No Phase, Flow, or feature may reduce or replace these points.

### Action Semantics (Immutable)

| Type | Applies To | Validation Rule |
|------|-----------|-----------------|
| **Pose Hold** | Head, Shoulders, Elbows | Reach target position + hold time (1.5-3s) |
| **Hand Motion** | Both Hands | Start/end position alignment + correct direction + rhythm match |

**Key:** Elbows must participate; wrist-only movement is not allowed.

### Phase Model (Immutable Structure)

The system consists of explicit Phases:
- Neutral / Calibration phases
- Pose Hold phases
- Hand Motion phases

Phase order is fixed within each Flow. Personalization does not change Phase semantics.

### Safety Constraints (Not Personalizable)

| Constraint | Description |
|------------|-------------|
| Minimum hold time | Pose Hold cannot go below safety threshold |
| Minimum elbow participation | Hand motion must include elbow engagement |
| Shoulder opening | At least one effective shoulder opening per session |

### Personalization Scope

**Adjustable (gradual, bounded):**
- Pose hold duration
- Positional tolerance
- Elbow participation threshold
- Hand motion tempo

**Not adjustable:**
- Total session duration
- Phase order
- Action semantic types
- Number of tracked points

### Smart Logic (Authorized Only)

| Logic | Status | Description |
|-------|--------|-------------|
| 1. Intent Detection | ✅ Authorized | Detects if user is moving toward target; affects feedback tone only |
| 2. Time Fine-Tuning | ✅ Authorized | Phase duration adjustable ±0.5s; no skipping/reordering Phases |
| Other | ❌ Prohibited | No other smart logic exists in V1 |

---

## Part 2: Movement Safety Constraints

### Core Philosophy

1. **Movements are constrained, not invented**
   - All movements come from a predefined movement library
   - Randomness is compositional, not generative

2. **Control > Amplitude**
   - Priority: controlled engagement, joint participation, structural integrity
   - Not pursued: large amplitude, exaggerated angles, visual dramatization

### Global Safety Constraints

| Constraint | Description |
|------------|-------------|
| No ballistic movement | No sudden acceleration/deceleration, no flinging/jerking |
| Neck protection | Head movement is slow and intentional, no rapid rotation |
| Shoulder-elbow must participate | Hand movement must include shoulder-elbow engagement |

### Time Principles

| Principle | Description |
|-----------|-------------|
| Hold time required | Static positions must be intentionally reached and held |
| Dynamic-static alternation | Effective sequences alternate between Pose Hold and Hand Motion |
| Rhythm not enforced | Music rhythm guides but does not force; safety takes priority |

### Assessment Philosophy

| Assessment | Description |
|------------|-------------|
| Engagement > Precision | Evaluate whether joints meaningfully participate, not precise angles |
| Effort independent of success | Trying but not reaching ≠ no movement |

### System Explicitly Avoids

- ML-based action classification for real-time validation
- Competitive scoring or rankings
- Binary pass/fail judgments
- Forced symmetry
- High-speed or large-amplitude choreography

---

## Part 3: User Flow (Aligned with UX_SPEC v1.1)

> This section stays consistent with UX_SPEC.md v1.1. UX_SPEC.md is the authoritative document
> for the UX layer; this section is the developer-facing workflow perspective.

### Page Architecture

| Page | Name | Route | Purpose |
|------|------|-------|---------|
| P1 | Welcome | `/` | Onboarding, trust, remote pairing |
| P2 | Avatar Setup | `/avatar` | Generate avatar, select song, launch game |
| P3 | Game | `/game?songId=xxx` | Main movement experience (music + Flow) |
| P4 | Result | Modal on `/game` | Session summary and next actions |

### Page Flow Overview

```
Page 1 (Welcome)
    ↓ Click START / Keyboard Enter / Remote confirm
Page 2 (Avatar Setup)
    ├── idle → generating → previewing → Confirm Avatar
    └── selecting-song → Pick song → Go Bubble → locked
    ↓ Navigate to /game?songId=xxx
Page 3 (Game) — Starts Playing immediately (no Idle state)
    ├── Avatar demonstrates Flow actions (pending Rive)
    ├── User follows; system tracks 7 body points
    ├── Playing ↔ Paused (Enter/Space)
    ├── Playing/Paused → Switching → Playing (song change)
    └── Playing/Paused → Finished (song ends / early end)
    ↓
Page 4 (Result Modal)
    ├── Repeat → P3 Playing (same song)
    ├── New Song → P2
    └── Exit → P1
```

---

## Page 1 - Welcome

### Layout (Left-Center-Right)

| Area | Content |
|------|---------|
| Left Panel | Product info, usage summary, trust framing |
| Center Panel | Cartoon animation demo (placeholder) + START button |
| Right Panel | QR code pairing + remote status + legal/privacy (collapsed) |

### User Actions

| Input | Action |
|-------|--------|
| Mouse | Click START button |
| Keyboard | Enter / Space |
| Remote | Confirm button |

### Entry Condition
- Navigates directly to Page 2 on action

---

## Page 2 - Avatar Setup

### State Machine (5 States)

```
idle → generating → previewing → selecting-song → locked → navigate to P3
                ↑                        |
                └── (on failure) ────────┘
```

| State | Left Button | Right Button | Extra UI |
|-------|-------------|--------------|----------|
| idle | Generate | Confirm (disabled) | Tip Box visible; StatusBadge hidden |
| generating | Generate (disabled) | Confirm (disabled) | StatusBadge: "Generating..." |
| previewing | Regenerate | Confirm Avatar | StatusBadge: "Previewing" |
| selecting-song | Prev Song (◀) | Next Song (▶) | SongCarousel + GoBubble |
| locked | ◀ (disabled) | ▶ (disabled) | StatusBadge: "Locked" |

**On generation failure:** Red StatusBadge "Generation failed. Retry." appears, state returns to idle, Generate button remains available.

### Phase 1: Generate Avatar

#### Trigger Generation
| Input | Action |
|-------|--------|
| Mouse | Click Generate button |
| Keyboard | ArrowLeft / Enter / Space |
| Gesture | Hand hovers on left button area for 400ms |

#### Generation Flow
1. System captures user photo
2. Sends to backend for cartoon avatar generation
3. Returns avatar and displays on screen

#### Avatar Properties
| Property | Value |
|----------|-------|
| Opacity | 90% (`--opacity-avatar-setup`) |
| Head proportion | Visual mesh 1.15-1.25x (not skeletal) |
| Neck joint | Fixed; no dynamic head scaling during Flow |

#### Avatar Content Policy
- No revealing or inappropriate clothing
- Neutral, friendly appearance only

#### Data Storage
- Backend does **not** save user photos
- Backend does **not** save avatar images
- Avatar is lost when user exits the system

#### Confirm Avatar
| Input | Action |
|-------|--------|
| Mouse | Click Confirm Avatar button |
| Keyboard | ArrowRight / Enter / Space |
| Gesture | Hand hovers on right button area for 400ms |

---

### Phase 2: Select Song

#### UI Changes
- Avatar locked (no further modification)
- SongCarousel appears (5 preset tracks, circular navigation)
- Go Bubble appears on right side (150px diameter)
- Bubble burst animation on trigger

#### Song Navigation
| Input | Previous | Next |
|-------|----------|------|
| Mouse | Click ◀ button | Click ▶ button |
| Keyboard | ArrowLeft | ArrowRight |
| Gesture | Hand hovers on ◀ area for 400ms | Hand hovers on ▶ area for 400ms |

#### Confirm Song (Go Bubble)
| Input | Action |
|-------|--------|
| Mouse | Click Go Bubble |
| Keyboard | Enter / Space |
| Gesture | Hand hovers on bubble area for 200ms |

#### Flow Generation (Background)
1. System analyzes song characteristics (tempo, duration, beats)
2. Pulls Phase templates from Firestore `phase_templates` collection
3. Arranges into a complete Flow based on tempo and duration
4. Navigates to Page 3 on completion

### Tip Box
- Top-left floating
- Auto-dismisses after first successful generation

### Gesture Trigger (P2)
- Trigger point: fingertip estimation (`wrist + (wrist - elbow) * 0.4`)
- GestureButton dwell time: 400ms
- GoBubble dwell time: 200ms
- Debounce: 2s per element
- Sticky hover: 200ms grace period
- Padding: 15% enlarged hit area
- Visual feedback: glow ring + scale up (110%) on hover, scale down pulse (95%) on trigger

### Keyboard Mapping (P2)

| State | ArrowLeft | ArrowRight | Enter / Space |
|-------|-----------|------------|---------------|
| idle | Generate | — | Generate |
| generating | — | — | — |
| previewing | Regenerate | Confirm Avatar | Confirm Avatar |
| selecting-song | Prev Song (◀) | Next Song (▶) | Lock & Start |
| locked | — | — | — |

**Design principle:** ArrowLeft/Right follow spatial position (left/right button on screen). Enter/Space always triggers the primary forward action of the current state.

---

## Page 3 - Game

### State Machine (4 States, No Idle)

Page 3 has **no Idle state**. The game starts Playing immediately on entry.
Song selection and Go Bubble interaction happen on Page 2.

| State | Description |
|-------|-------------|
| Playing | Flow active, avatar demonstrates current Phase, progress bar advances |
| Paused | Music paused, Flow paused, awaiting resume |
| Switching | Transitional state, displays "Switching...", all inputs disabled |
| Finished | Session complete, Result Modal shown |

### Avatar Guidance

#### Avatar Properties
| Property | Value |
|----------|-------|
| Opacity | 80% (`--opacity-avatar-game`) |
| Size | Same scale as user body |
| Position | Centered and aligned with user |
| Dynamic | No opacity or scale changes during active Flow |

#### Movement Guidance
- Avatar performs actions based on Flow Phase information (pending Rive implementation)
- User follows the avatar's movements
- System detects whether user completes the movements

### UI Elements

| Element | Position | Description |
|---------|----------|-------------|
| Song Display | Top-left | Always visible, read-only; shows locked song name + artist; progress bar shows overall Flow completion %; no dropdown, no song switching UI |
| Game HUD | Top-right | Current state + elapsed time / total duration |
| Pause Overlay | Fullscreen center | Semi-transparent black (40%) + pause icon (two vertical bars) + "Paused" text + "Press Enter or remote confirm to resume" hint |
| Switching Overlay | Fullscreen center | "Switching..." + all inputs disabled |

**Camera feed dimming:** Camera feed is dimmed during Pause, Dialog, and Result states.

### Motion Detection

#### Palm Position Estimation
```
palm position = wrist + (wrist - elbow) × 0.4
```

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Pause/Resume | Enter / Space | Toggle pause |
| Change Song | S key (+ confirm dialog) | End Flow → Switching → Playing |
| Return to P2 | ArrowLeft (+ confirm dialog) | Navigate to Avatar Setup |
| End Early | ArrowRight (+ confirm dialog) | Navigate to Result |

### Keyboard Mapping (P3)

| State | ArrowLeft | ArrowRight | Enter / Space | S |
|-------|-----------|------------|---------------|---|
| Playing | Return to P2 (c) | End early (c) | Pause | Change song (c) |
| Paused | Return to P2 (c) | End early (c) | Resume | Change song (c) |
| Switching | — | — | — | — |
| Dialog | Cancel | — | Confirm | — |
| Result | Repeat | Exit | New Song | — |

*(c) = requires confirmation dialog*

### Confirmation Dialogs (3 Types)

| Type | Title | Message | Confirm | Cancel |
|------|-------|---------|---------|--------|
| return-to-avatar | "Return to avatar setup?" | "Your current progress will be lost." | "Return" | "Cancel" |
| end-session | "End session now?" | "Your progress will be saved." | "End" | "Cancel" |
| change-song | "Switch song?" | "The current session will end." | "Switch" | "Cancel" |

**Dialog keyboard:** Enter/Space = Confirm, ArrowLeft/Escape = Cancel

#### Dialog General Behavior Rules
- Dialogs are modal and centered on screen
- Underlying interaction is paused
- Camera feed remains visible but dimmed (overlay opacity 60%, `--opacity-overlay-dim`)
- Gesture input is disabled
- Mouse click and keyboard/remote input accepted
- Dialogs require an explicit confirm or cancel action
- Dialog copy is short, clear, and non-technical

#### Dialog Priority and Input Handling
- Confirmation dialogs override all other UI layers (z-index: `--z-dialog`)
- No other UI updates occur while dialog is visible
- All state transitions initiated by dialogs are atomic
- Game page keyboard handler defers to ConfirmDialog's own handler (`if (activeDialog) return`)

#### Copy Tone Guidelines (V1)
- Supportive, neutral, and respectful
- Avoid technical terms
- Avoid blame or error framing
- Always state the consequence clearly

### Game End Conditions
1. Song duration elapsed (automatic)
2. User presses ArrowRight to end early (manual, with confirmation)

---

## Page 4 - Result

Result is a modal overlay on the Game page (not a separate route).

### Display
- Semi-transparent overlay
- Slides down automatically (dialog-enter animation)
- Does not fully obscure camera

### Content
- Circular progress visualization + completion percentage
- Encouragement message
- Three action buttons

### Encouragement Brackets

| Completion % | Tone | Message |
|-------------|------|---------|
| 90-100% | Celebration | "Amazing! You nailed it!" |
| 70-89% | Encouragement | "Great job! Keep it up!" |
| 50-69% | Motivation | "Good effort! You're improving!" |
| < 50% | Supportive | "Every step counts. Try again!" |

### Button Functions
| Position | Button | Function |
|----------|--------|----------|
| Left | Repeat | Repeat current song → stay on P3 |
| Center | New Song | Re-select song → return to P2 |
| Right | Exit | Exit → return to P1 |

### Keyboard Mapping (P4 Result)

| Key | Action |
|-----|--------|
| ArrowLeft | Repeat |
| Enter / Space | New Song |
| ArrowRight | Exit |

---

## Full Keyboard Mapping Summary

| Page / State | ArrowLeft | ArrowRight | Enter / Space | S |
|-------------|-----------|------------|---------------|---|
| **P1** Welcome | — | — | START | — |
| **P2** idle | Generate | — | Generate | — |
| **P2** generating | — | — | — | — |
| **P2** previewing | Regenerate | Confirm Avatar | Confirm Avatar | — |
| **P2** selecting-song | Prev Song (◀) | Next Song (▶) | Lock & Start | — |
| **P2** locked | — | — | — | — |
| **P3** Playing | Return to P2 (c) | End early (c) | Pause | Change song (c) |
| **P3** Paused | Return to P2 (c) | End early (c) | Resume | Change song (c) |
| **P3** Switching | — | — | — | — |
| **P3** Dialog | Cancel | — | Confirm | — |
| **P4** Result | Repeat | Exit | New Song | — |

*(c) = requires confirmation dialog*

**Design principles:**
- **ArrowLeft / ArrowRight** = spatial mapping (corresponds to on-screen left/right button positions)
- **Enter / Space** = primary forward action of the current context
- **S** = song switch shortcut (P3 only, simulates remote Switch button)
- **Escape** = cancel (in dialogs, equivalent to ArrowLeft)

---

## Mobile Remote Controller Summary

> Remote is not implemented in V1. Keyboard mapping simulates remote for development and demo.

| Page | < Left | Confirm | > Right | Switch |
|------|--------|---------|---------|--------|
| P1 | — | Enter P2 | — | — |
| P2 idle | Generate | Generate | — | — |
| P2 previewing | Regenerate | Confirm Avatar | Confirm Avatar | — |
| P2 selecting-song | Prev Song | Lock & Start | Next Song | — |
| P3 Playing | Return to P2 (c) | Pause | End to P4 (c) | Change song (c) |
| P3 Paused | Return to P2 (c) | Resume | End to P4 (c) | Change song (c) |
| P4 | Repeat | New Song | Exit | — |

---

## Technical Architecture

### Gesture Interaction System

| Parameter | Value |
|-----------|-------|
| Detection | MediaPipe Pose (7 upper-body tracking points) |
| Trigger point | Fingertip estimation: `wrist + (wrist - elbow) * 0.4` |
| GestureButton Dwell | 400ms |
| GoBubble Dwell | 200ms |
| Debounce | 2s per element |
| Sticky hover | 200ms grace period |
| Hit area padding | 15% enlarged |

**Gesture visual feedback:**

| State | Feedback |
|-------|----------|
| Hovering | Glow ring + scale up (110%) |
| Triggered | Scale down pulse (95%) / burst animation (GoBubble) |
| GoBubble hovering | Scale up (125%) + glow shadow + ping animation |

**Gesture disabled during:** Switching state, confirmation dialogs, Result Modal

### Control Priority Rules

1. State transitions are atomic
2. Inputs are ignored during transitions (Switching state)
3. Remote input overrides gesture input (when remote is implemented)
4. Gesture input is disabled during dialogs, switching, and Result Modal
5. Keyboard input is disabled during dialogs (ConfirmDialog handles its own) and during Result (ResultModal handles its own)

### Failure UX

**Guiding principles:**
- Fail fast
- Fail visibly
- Always provide one clear recovery action

| Failure | Handling | Component |
|---------|----------|-----------|
| Camera permission denied | Error message + "Try Again" button | `CameraError` |
| Avatar generation failed | Red StatusBadge "Generation failed. Retry." + Generate button available | `StatusBadge` (failed) |
| Avatar generation timeout | Not implemented | — |
| Remote disconnected | Remote not implemented | — |
| Tracking lost mid-session | No specific handling | — |

### Flow Generation System

#### Input
- Song audio characteristics (tempo, duration, beats)

#### Processing
1. Analyze song characteristics
2. Match Phase templates from Firestore `phase_templates` collection
3. Arrange sequence based on tempo and duration
4. Generate complete Flow

#### Output
- Flow JSON (containing multiple Phase instances)
- Each Phase includes: position, time, trajectory

### Phase Types

| Type | Tracked Points | Validation Rule |
|------|---------------|-----------------|
| Neutral | Head, Shoulders, Elbows | No validation, record baseline |
| Pose Hold | Head, Shoulders, Elbows | Reach position + hold time |
| Hand Motion | Hands, Elbows | Start/end position + direction + rhythm |

### Avatar System

#### Page 2 Behavior
| Stage | Pose | Expression |
|-------|------|-----------|
| Generation preview | Points to left/right buttons (alternating) | Emotion cycle |
| Song selection | Points to left/right buttons/bubble (3-position cycle) | Emotion cycle |

#### Page 3 Behavior
| Property | Value |
|----------|-------|
| Pose | Performs actions based on Flow Phase information |
| Expression | Reacts to user performance (TBD) |

---

## Design Principles

### Safety Constraints (Not Personalizable)
- Minimum pose hold time
- Minimum elbow participation threshold
- At least one effective shoulder opening per session

### Personalizable (Gradual Adjustment)
- Pose hold duration
- Positional tolerance
- Elbow participation threshold
- Hand motion tempo

### Not Personalizable
- Total session duration
- Phase order
- Movement semantic types
- Tracked points (always 7)

---

## Smart Logic (Authorized Only)

### Smart Logic 1 - Intent Detection
- Detects if user is moving toward target
- Affects feedback tone only
- Does not affect success determination, timing, or validation

### Smart Logic 2 - Time Fine-Tuning
- Phase duration adjustable ±0.5s
- Within Phase only
- No skipping or reordering Phases
- Does not violate safety constraints

### Other Smart Logic
- No other smart logic exists in V1

---

## Rive Animation System Guide

> This section documents the implementation plan for avatar movement guidance.
> Added: 2026-02-06

### Why Rive

| Advantage | Description |
|-----------|-------------|
| Free | Basic tier is free, sufficient for needs |
| Web editor | No software installation needed; use https://rive.app in browser |
| State machine | Can switch animations based on Phase |
| Lightweight | Small file size, fast loading |
| React support | Official `@rive-app/react-canvas` library |

---

### Learning Rive Basics (Day 1-2)

#### Step 1: Register Rive Account
1. Go to https://rive.app
2. Click "Get Started" to register (Google account supported)
3. Enter Rive Editor (web-based)

#### Step 2: Official Tutorials
| Tutorial | Link | Duration | Content |
|----------|------|----------|---------|
| 1. Interface Tour | https://rive.app/learn-rive | 10 min | Editor basics |
| 2. Drawing Shapes | Same | 15 min | Circles, rectangles, paths |
| 3. Bones & Rigging | Same | 20 min | Make characters movable |
| 4. Animation Basics | Same | 20 min | Keyframe animation |
| 5. State Machines | Same | 30 min | Switch animations by input |

#### Step 3: Community Resources
- URL: https://rive.app/community
- Download free character templates to learn and modify

---

### Character Design Requirements

#### Character Parts
| Part | Requirement |
|------|-------------|
| Head | 10% larger than real, with expression changes |
| Body | Simplified upper body |
| Arms | Can raise, lower, point |
| Hands | Can wave |

#### Required Animation List

**Page 2 (Preset Loops):**
| Animation | Description | Loop |
|-----------|-------------|------|
| `idle` | Idle breathing | Loop |
| `point_left` | Point to left button | Loop |
| `point_right` | Point to right button | Loop |
| `point_go` | Point to Go Bubble | Loop |
| `emotion_happy` | Happy expression | |
| `emotion_neutral` | Calm expression | |

**Page 3 (Follow Flow):**
| Animation | Description | Phase Type |
|-----------|-------------|-----------|
| `neutral_pose` | Neutral pose | Neutral |
| `arms_up` | Arms raised | Pose Hold |
| `arms_out` | Arms spread | Pose Hold |
| `neck_tilt_left` | Head tilt left | Pose Hold |
| `neck_tilt_right` | Head tilt right | Pose Hold |
| `wave_motion` | Hand waving | Hand Motion |

---

### State Machine Design

```
+-----------------------------------------------------+
|                    State Machine                     |
|-----------------------------------------------------|
|                                                      |
|  Inputs:                                             |
|  +-- phase_type: Number (0=neutral, 1=pose, 2=motion)|
|  +-- pose_index: Number (specific action index)      |
|  +-- emotion: Number (0=neutral, 1=happy, 2=sad...)  |
|                                                      |
|  States:                                             |
|  +-- Idle Layer (always playing)                     |
|  |   +-- idle (breathing animation)                  |
|  |                                                   |
|  +-- Pose Layer                                      |
|  |   +-- neutral_pose                                |
|  |   +-- arms_up                                     |
|  |   +-- arms_out                                    |
|  |   +-- neck_tilt                                   |
|  |                                                   |
|  +-- Emotion Layer                                   |
|      +-- emotion_happy                               |
|      +-- emotion_neutral                             |
|      +-- emotion_sad                                 |
|                                                      |
+-----------------------------------------------------+
```

---

### Frontend Integration Code

#### File Locations
```
frontend/modules/visual-feedback/rive-character.tsx  (placeholder component exists)
frontend/public/avatar.riv                           (to be created)
```

#### Integration Code Example
```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

interface RiveCharacterProps {
  phaseType: number;   // 0=neutral, 1=pose_hold, 2=hand_motion
  poseIndex: number;   // Specific action index
  emotion: number;     // Expression index
}

export function RiveCharacter({ phaseType, poseIndex, emotion }: RiveCharacterProps) {
  const { rive, RiveComponent } = useRive({
    src: '/avatar.riv',
    stateMachines: 'MainStateMachine',
    autoplay: true,
  });

  const phaseInput = useStateMachineInput(rive, 'MainStateMachine', 'phase_type');
  const poseInput = useStateMachineInput(rive, 'MainStateMachine', 'pose_index');
  const emotionInput = useStateMachineInput(rive, 'MainStateMachine', 'emotion');

  useEffect(() => {
    if (phaseInput) phaseInput.value = phaseType;
    if (poseInput) poseInput.value = poseIndex;
    if (emotionInput) emotionInput.value = emotion;
  }, [phaseType, poseIndex, emotion, phaseInput, poseInput, emotionInput]);

  return <RiveComponent className="w-full h-full" />;
}
```

---

### Implementation Plan

#### Stage 1: Learn Rive (Day 1-2)
| Task | Time |
|------|------|
| Register account, explore interface | 30 min |
| Complete official tutorials 1-5 | 2 hours |
| Download community templates to practice | 1 hour |
| Try creating a simple character | 2 hours |

#### Stage 2: Create Character (Day 3-4)
| Task | Time |
|------|------|
| Design character appearance | 2 hours |
| Set up bone rigging | 2 hours |
| Create basic animations (idle, point) | 3 hours |
| Create action animations (arms_up, wave) | 3 hours |

#### Stage 3: State Machine (Day 5)
| Task | Time |
|------|------|
| Set up state machine inputs | 1 hour |
| Connect animations to states | 2 hours |
| Test state switching | 1 hour |

#### Stage 4: Frontend Integration (Day 6)
| Task | Time |
|------|------|
| Export .riv file | 10 min |
| Update RiveCharacter component | 1 hour |
| Connect to Phase Engine | 2 hours |
| Test complete flow | 1 hour |

---

### Alternative Plans

#### Plan C1: Use Rive Community Resources
- Download a close character template
- Modify animations to fit requirements
- Much faster than building from scratch

Recommended search keywords:
- "character"
- "person"
- "avatar"

#### Plan C2: Commission Design
Platforms:
- Fiverr (search "Rive animation")
- Upwork
- Typical cost: $50-200

---

## Part 6: Architecture Implementation Status

> Comparing designed architecture vs actual implementation

### Designed Architecture (Hard Boundary)

```
Frontend (Next.js):
- Webcam getUserMedia
- MediaPipe Pose to extract the 7 points
- Real-time Phase Engine + validators
- Rive animation playback (reference guide)
- Visual feedback overlays
- Full keyboard mapping (all pages/states)

Backend (Python FastAPI on Cloud Run):
- Firebase Anonymous Auth integration
- Firestore storage: users, sessions, flows, phase_templates, personalization params
- Post-session Gemini summarization only (no real-time)
- Stores only symbolic session outcomes, not raw frames
```

### Frontend Implementation Status

| Requirement | Status | Location |
|-------------|--------|----------|
| Webcam getUserMedia | ✅ Done | `lib/use-webcam.ts` |
| MediaPipe Pose (7 points) | ✅ Done | `modules/pose-validation/mediapipe-tracker.ts` |
| Real-time Phase Engine | ✅ Done | `modules/flow-engine/phase-engine.ts` |
| Validators | ✅ Done | `modules/pose-validation/pose-hold-validator.ts`, `hand-motion-validator.ts` |
| Rive animation playback | ⚠️ Placeholder | `modules/visual-feedback/rive-character.tsx` (no actual animation) |
| Visual feedback overlays | ✅ Done | `modules/visual-feedback/phase-hud.tsx`, `skeleton-canvas.tsx` |
| Keyboard mapping (all pages) | ✅ Done | `page.tsx`, `avatar/page.tsx`, `game/page.tsx`, `result-modal.tsx` |
| Avatar generation failure UI | ✅ Done | `StatusBadge` (failed) |

### Backend Implementation Status

| Requirement | Status | Location |
|-------------|--------|----------|
| Firebase Anonymous Auth | ✅ Done | `backend/app/services/auth.py` |
| Firestore - sessions | ✅ Done | `backend/app/routes/session.py` |
| Firestore - flows | ✅ Done | `backend/app/services/flow.py` (hardcoded) + `backend/app/services/flow_generator.py` (dynamic generation) |
| Firestore - phase_templates | ✅ Done | `backend/app/services/phase_template.py`, `backend/app/routes/phase_template.py` |
| Firestore - personalization params | ✅ Done | `backend/app/routes/user_params.py` |
| Post-session Gemini summarization | ✅ Done | `backend/app/services/gemini.py` |
| Symbolic outcomes only | ✅ Compliant | No image storage logic |

### Remaining Items

| Feature | Status | Description |
|---------|--------|-------------|
| Dynamic Flow generation | ✅ Done | `POST /api/flows/generate` — composes Flows from Phase templates (60-600s, any tempo) |
| Rive animation | ❌ Not done | Component exists but no actual .riv file or animations |
| Avatar generation API | ❌ Not integrated | Frontend uses 2s placeholder; backend has `avatar.py` but not connected |
| Mobile remote | ❌ Not done | WebSocket not implemented, QR pairing not implemented |

---

## Part 7: Key Technical Decision Records

> Records of important design decisions made during development

### 2026-02-06 Decisions

#### 1. Smart Framing
**Problem:** User could only see head close-up, not upper body
**Decision:** Use MediaPipe head/shoulder Y coordinates to dynamically calculate `object-position`
**Implementation:**
- Request 1280x720 video
- `object-cover` to maintain no black bars
- `object-position: center ${offset}%` dynamic adjustment
- EMA smoothing (coefficient 0.1)
- Bounds: 10-40%, default 25%

#### 2. Gesture Trigger Optimization
**Problem:** Gesture trigger was not responsive enough
**Decision:**
- GoBubble size increased to 150px
- Dwell time: GestureButton 400ms, GoBubble 200ms
- Added sticky hover (200ms grace period)
- Increased padding to 15%

#### 3. Palm Position Estimation
**Problem:** MediaPipe only provides wrist position; need to estimate palm/fingertip
**Decision:** `palm = wrist + (wrist - elbow) × 0.4`
**Note:** Palm length is approximately 40% of forearm length

#### 4. Song Selection Location
**Problem:** Song selection was initially on Page 3
**Decision:** Moved to Page 2, making Page 3 a pure execution space
**Implementation:**
- Page 2 added SongCarousel + GoBubble
- Page 3 receives songId via URL parameter
- Page 3 Song Display is read-only

#### 5. Pause Visual Feedback
**Problem:** Paused state had no clear visual distinction
**Decision:** Added PauseOverlay component
**Implementation:**
- Semi-transparent black background (40%)
- Pause icon (two vertical bars)
- "Paused" text
- "Press Enter or remote confirm to resume" hint

#### 6. Camera Error Recovery
**Problem:** No way to retry after camera failure
**Decision:** Added CameraError component + retry function
**Implementation:**
- Error icon + error message
- "Try Again" button
- `use-webcam.ts` added `retry()` method

#### 7. Avatar Animation Approach
**Problem:** Avatar couldn't move, couldn't guide users
**Decision:** Use Rive animation system
**Rationale:**
- Free, web-based editor
- Supports state machines (switch animations based on Phase)
- Lightweight, good React support
**Status:** In progress — user creating .riv skeleton (see Rive Animation System Guide)

### 2026-02-09 Decisions

#### 8. Full Keyboard Mapping
**Problem:** P1/P2/P4(Result) had no keyboard support, mouse-only
**Decision:** Add keyboard mapping to all pages and all states
**Principles:**
- ArrowLeft/Right = spatial mapping (corresponds to on-screen left/right buttons)
- Enter/Space = primary forward action of current context
- P2 idle state: both ArrowLeft and Enter trigger Generate (only available action)

#### 9. Avatar Generation Failure UI
**Problem:** Avatar generation failure silently returned to idle; user had no indication
**Decision:** Show red StatusBadge "Generation failed. Retry."
**Implementation:** Added `generationFailed` state variable; failed badge shown on failure

#### 10. GestureButton Dwell Time Adjustment
**Problem:** Spec 500ms was too slow; code 300ms was too fast
**Decision:** Adjusted to 400ms (balance between responsiveness and accidental triggers)
**GoBubble stays at 200ms** (fast trigger to enter game)

#### 11. Phase Template Data Model
**Problem:** Phases were hardcoded in code; could not dynamically generate Flows
**Decision:** Phase templates stored in Firestore `phase_templates` collection
**Key field design:**
- `intent` + `verification_notes[]` replaces single `description` (structured, downstream-usable)
- `primary_anchors` uses group shorthand (`shoulder`, `elbow`, `hand`); expanded to specific tracked points at Flow generation time

---

## Design Token Reference

> Key CSS custom properties defined in `frontend/app/globals.css`.
> For full details see UX_SPEC.md Section 15.

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-avatar-setup` | 0.9 | P2 avatar overlay |
| `--opacity-avatar-game` | 0.8 | P3 avatar overlay |
| `--opacity-overlay-dim` | 0.6 | Dialog backgrounds |
| `--color-primary` | #3b82f6 | Primary actions, Go Bubble |
| `--color-success` | #22c55e | Locked state, high completion |
| `--color-warning` | #f59e0b | Previewing, paused states |
| `--color-error` | #ef4444 | Generation failure |
| `--z-dialog` | (defined) | Confirmation dialog layer |
| `--z-overlay` | (defined) | Result modal layer |
| `--z-floating` | (defined) | Buttons, Go Bubble |
| `--z-hud` | (defined) | Top bar elements |

---

*This document is aligned with UX_SPEC.md v1.1 (2026-02-09)*
*PRD Core Principles (Part 1-2) are immutable*
*User Flow (Part 3) aligned with UX_SPEC.md v1.1*
*Key Decision Records are continuously updated*
