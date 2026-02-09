# Movement Coach — UX Specification v1.1

(Controlled Interaction Edition · Aligned with Implementation)

**Version:** 1.1
**Last Updated:** 2026-02-09
**Status:** Final · Aligned with V1 codebase

**Change Log:**

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-02-06 | Initial UX Spec |
| v1.1 | 2026-02-09 | Aligned with implementation: P2 state machine expanded (selecting-song), P3 Idle state removed (direct Playing), Go Bubble moved to P2, Song Display always visible on P3, gesture dwell times updated, full keyboard mapping added across all pages, avatar generation failure UI added |

---

## 1. Product Overview

Movement Coach is a browser-based, camera-driven, music-synchronized guided movement experience designed for sedentary computer users.

The product prioritizes embodied interaction, minimizing cognitive load while users are physically active, and emphasizing trust, predictability, and emotional acceptance.

### Core Parameters

| Parameter | Value |
|-----------|-------|
| Session duration | 3-5 minutes per song |
| Body tracking points | 7 (Head, L/R Shoulder, L/R Elbow, L/R Hand) |
| Core mechanic | User movement is compared against a semi-transparent cartoon avatar overlay |
| Platform | Web (WebRTC + MediaPipe compatible browsers) |

---

## 2. Page Architecture

| Page | Name | Route | Purpose |
|------|------|-------|---------|
| P1 | Welcome | `/` | Onboarding, trust, legal, remote pairing |
| P2 | Avatar Setup | `/avatar` | Generate avatar, select song, launch game |
| P3 | Game | `/game?songId=xxx` | Main movement experience (music + flow) |
| P4 | Result | Modal on `/game` | Session summary and next actions |

---

## 3. Page 1 — Welcome

### 3.1 Layout (Left-Center-Right)

```
+-----------------------------------------------------------+
| [Left Panel]     [Center Panel]        [Right Panel]      |
|-----------------------------------------------------------|
| Product Info     Cartoon Animation     QR Code            |
| Key benefits     (Demo poses,          Remote Status      |
| Usage summary    looping, low contrast) Legal (collapsed) |
|                                                           |
|                    [ START ]                               |
|                  Primary CTA                               |
+-----------------------------------------------------------+
```

### 3.2 Elements

**Left Panel — Product Info**
- Brief product description
- Usage summary
- Trust framing (camera-based, local processing)

**Center Panel — Cartoon Animation**
- Demonstrative only (placeholder, future Rive animation)
- Preset poses + expressions
- Loops continuously
- Low visual contrast
- No interaction
- No personalization

**Right Panel — Remote & Legal**
- QR code for mobile remote pairing
- Connection status displayed below QR code
- Legal / Privacy disclosure (collapsed by default)

**START Button**
- Primary visual anchor
- Only strong CTA on page
- Accessible via mouse click, keyboard (Enter/Space), or remote confirm

### 3.3 Keyboard Mapping (P1)

| Key | Action |
|-----|--------|
| Enter / Space | START (navigate to P2) |

### 3.4 Implementation Reference

| Element | File |
|---------|------|
| Page | `frontend/app/page.tsx` |
| Layout | `frontend/components/layouts/welcome-layout.tsx` |
| Left Panel | `frontend/components/welcome/product-info.tsx` |
| Center Panel | `frontend/components/welcome/demo-animation.tsx` |
| Right Panel | `frontend/components/welcome/remote-panel.tsx` |

---

## 4. Page 2 — Avatar Setup

### 4.1 Layout

```
+-------------------------------------------+
| [Tip Box]  "Stand in frame..."            |
|                                           |
|     User Camera + Avatar Overlay          |
|     (Avatar 90% opacity)                  |
|                                           |
| [Left Button]              [Right Button] |
|                                           |
| Status: idle -> generating -> previewing  |
|         -> selecting-song -> locked       |
+-------------------------------------------+
```

### 4.2 State Machine

Page 2 has 5 states:

```
idle → generating → previewing → selecting-song → locked → navigate to P3
                ↑                        |
                └── (on failure) ────────┘
```

| State | Left Button | Right Button | Extra UI |
|-------|-------------|--------------|----------|
| idle | Generate | Confirm (disabled) | Tip Box visible |
| generating | Generate (disabled) | Confirm (disabled) | StatusBadge: "Generating..." |
| previewing | Regenerate | Confirm Avatar | StatusBadge: "Previewing" |
| selecting-song | Prev Song (◀) | Next Song (▶) | SongCarousel + GoBubble |
| locked | ◀ (disabled) | ▶ (disabled) | StatusBadge: "Locked" |

**On generation failure:** StatusBadge shows "Generation failed. Retry." (red), state returns to idle, Generate button remains available.

### 4.3 Elements

**Camera Feed**
- Fullscreen
- Mirrored
- Required to proceed

**Avatar Overlay**
- Opacity: 90% (`--opacity-avatar-setup: 0.9`)
- Centered
- No dynamic re-scaling after lock

**Avatar Proportion Rules**
- Motion skeleton proportions match real user anatomy
- Avatar head visual mesh scaled independently (recommended 1.15-1.25x)
- Neck joint remains fixed
- No dynamic head scaling during Flow

**Floating Buttons**
- Left: Generate / Regenerate / Prev Song (state-dependent)
- Right: Confirm / Confirm Avatar / Next Song (state-dependent)

**Go Bubble (selecting-song state only)**
- Right-side floating, 150px diameter
- Gesture or keyboard/remote confirm
- Bubble burst animation on trigger
- Triggers Lock & Start → navigate to P3

**Song Carousel (selecting-song state only)**
- 5 preset tracks
- Circular navigation (wraps around)

**Gesture Trigger**
- Trigger point: fingertip estimation (`wrist + (wrist - elbow) * 0.4`)
- GestureButton dwell time: 400ms
- GoBubble dwell time: 200ms
- Debounce: 2s per element
- Sticky hover: 200ms grace period
- Padding: 15% enlarged hit area
- Visual feedback: glow / scale on hover, pulse on trigger

**Status Indicator**
- idle: (hidden)
- Generating...
- Previewing
- Locked
- Generation failed. Retry. (red, on failure)

**Tip Box**
- Top-left floating
- Auto-dismiss after first successful generation

**Avatar Content Policy**
- No revealing or inappropriate clothing
- Neutral, friendly appearance only

### 4.4 Keyboard Mapping (P2)

| State | ArrowLeft | ArrowRight | Enter / Space |
|-------|-----------|------------|---------------|
| idle | Generate | — | Generate |
| generating | — | — | — |
| previewing | Regenerate | Confirm Avatar | Confirm Avatar |
| selecting-song | Prev Song (◀) | Next Song (▶) | Lock & Start |
| locked | — | — | — |

**Design principle:** ArrowLeft/Right follow spatial position (left/right button on screen). Enter/Space always triggers the primary forward action of the current state.

### 4.5 Remote Control Mapping (P2)

| Key | Action |
|-----|--------|
| < (Left) | Left button action (state-dependent) |
| > (Right) | Right button action (state-dependent) |
| Confirm | Primary forward action (state-dependent) |

### 4.6 Implementation Reference

| Element | File |
|---------|------|
| Page | `frontend/app/avatar/page.tsx` |
| Avatar Overlay | `frontend/components/avatar/avatar-overlay.tsx` |
| Song Carousel | `frontend/components/avatar/song-carousel.tsx` |
| Tip Box | `frontend/components/avatar/tip-box.tsx` |
| Gesture Button | `frontend/components/ui/gesture-button.tsx` |
| Go Bubble | `frontend/components/ui/go-bubble.tsx` |
| Status Badge | `frontend/components/ui/status-badge.tsx` |

---

## 5. Page 3 — Game

### 5.1 Layout

```
+-------------------------------------------+
| Song: Track Name        [Game HUD]        |
| [Progress Bar]          State / Timer     |
|                                           |
|   User Camera + Avatar Overlay            |
|   (Avatar 80% opacity, aligned)           |
|                                           |
+-------------------------------------------+
```

### 5.2 States

Page 3 has 4 states. There is no Idle state — the game starts Playing immediately on entry. Song selection and Go Bubble interaction happen on Page 2.

| State | Description |
|-------|-------------|
| Playing | Flow active, avatar demonstrates current phase, progress bar advances |
| Paused | Music paused, Flow paused, await resume |
| Switching | Transitional state, displays "Switching...", all inputs disabled |
| Finished | Session complete, Result Modal shown |

### 5.3 Elements

**Camera Feed**
- Fullscreen
- Mirrored
- Continuous
- Dimmed during: Pause, Dialog, Result

**Avatar Overlay**
- Opacity: 80% (`--opacity-avatar-game: 0.8`)
- Same scale as user body
- Centered and aligned
- No opacity or scale changes during active Flow

**Song Display**
- Always visible (top-left)
- Read-only label showing locked song name + artist
- Progress bar shows overall Flow completion percentage
- No dropdown, no song switching UI on screen

**Game HUD**
- Top-right
- Shows current state and elapsed time / total duration

**Pause Overlay**
- Semi-transparent black background (40%)
- Pause icon (two vertical bars)
- "Paused" text
- "Press Enter or remote confirm to resume" hint

**Switching Overlay**
- Displays "Switching..." during song change transition
- All inputs temporarily disabled

### 5.4 User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Pause/Resume | Enter/Space or remote confirm | Toggle pause |
| Change Song | S key or remote switch (+ confirm dialog) | End Flow → Switching → Playing (next song) |
| Return to P2 | ArrowLeft or remote left (+ confirm dialog) | Navigate to Avatar Setup |
| End Early | ArrowRight or remote right (+ confirm dialog) | Navigate to Result |

### 5.5 Keyboard Mapping (P3)

| State | ArrowLeft | ArrowRight | Enter / Space | S |
|-------|-----------|------------|---------------|---|
| Playing | Return to P2 (c) | End early (c) | Pause | Change song (c) |
| Paused | Return to P2 (c) | End early (c) | Resume | Change song (c) |
| Switching | — | — | — | — |
| Dialog | Cancel | — | Confirm | — |
| Result | Repeat | Exit | New Song | — |

*(c) = requires confirmation dialog*

### 5.6 Remote Control Mapping (P3)

| State | < (Left) | Confirm | > (Right) | Switch |
|-------|----------|---------|-----------|--------|
| Playing | Return to P2 (c) | Pause | End early (c) | Change song (c) |
| Paused | Return to P2 (c) | Resume | End early (c) | Change song (c) |

### 5.7 Game End Conditions

1. Song duration elapsed (automatic)
2. User ends early via ArrowRight / remote right (manual, with confirmation)

### 5.8 Implementation Reference

| Element | File |
|---------|------|
| Page | `frontend/app/game/page.tsx` |
| Song Display | `frontend/components/game/song-display.tsx` |
| Game HUD | `frontend/components/game/game-hud.tsx` |
| Pause Overlay | `frontend/components/game/pause-overlay.tsx` |
| Switching Overlay | `frontend/components/game/switching-overlay.tsx` |
| Confirm Dialog | `frontend/components/ui/confirm-dialog.tsx` |

---

## 6. Page 4 — Result

### 6.1 Layout

Result is a modal overlay on the Game page (not a separate route).

```
(Camera feed dimmed)

+-------------------------------+
| SESSION COMPLETE              |
|                               |
|        [ 85% ]                |
|    (circular progress)        |
|                               |
| "You completed 85%            |
|  of the flow. Great job!"    |
|                               |
| [Repeat] [New Song] [Exit]   |
|                               |
| Remote: < Repeat . >|| New   |
|         Song . > Exit         |
+-------------------------------+
```

### 6.2 Elements

**Result Modal**
- Semi-transparent overlay
- Slides down automatically (dialog-enter animation)
- Does not fully obscure camera

**Summary**
- Circular progress visualization
- Completion percentage
- One-line encouragement feedback

**Buttons**
- Repeat: Restart same song immediately (stays on P3)
- New Song: Return to P2 (Avatar Setup)
- Exit: Return to P1 (Welcome)

### 6.3 Encouragement Brackets

| Completion % | Message Tone | Message |
|-------------|-------------|---------|
| 90-100% | Celebration | "Amazing! You nailed it!" |
| 70-89% | Encouragement | "Great job! Keep it up!" |
| 50-69% | Motivation | "Good effort! You're improving!" |
| < 50% | Supportive | "Every step counts. Try again!" |

### 6.4 Keyboard Mapping (P4 Result)

| Key | Action |
|-----|--------|
| ArrowLeft | Repeat |
| Enter / Space | New Song |
| ArrowRight | Exit |

### 6.5 Remote Control Mapping (P4)

| Key | Action |
|-----|--------|
| < (Left) | Repeat |
| Confirm | New Song |
| > (Right) | Exit |

### 6.6 Implementation Reference

| Element | File |
|---------|------|
| Result Modal | `frontend/components/layouts/result-modal.tsx` |

---

## 7. Mobile Remote Controller

### 7.1 Layout (Landscape)

```
+---------------------------+
| [ Switch Song ]           |
|                           |
| [ < ]   [ >|| ]   [ > ]  |
+---------------------------+
```

### 7.2 Implementation Status

Not implemented in V1. Keyboard mapping simulates remote control for development and demo purposes.

---

## 8. Gesture Interaction System

### 8.1 Trigger Rules (V1)

| Parameter | Value |
|-----------|-------|
| Detection | MediaPipe pose tracking (7 upper-body points) |
| Trigger point | Fingertip estimation: `wrist + (wrist - elbow) * 0.4` |
| GestureButton dwell time | 400ms |
| GoBubble dwell time | 200ms |
| Debounce | 2s per element |
| Sticky hover grace period | 200ms |
| Hit area padding | 15% enlarged |

**Gesture input is disabled during:**
- Switching state
- Confirmation dialogs
- Result modal

### 8.2 Visual Feedback

| State | Feedback |
|-------|----------|
| Hovering | Glow ring + scale up (110%) |
| Triggered | Scale down pulse (95%) / burst animation (GoBubble) |
| GoBubble hovering | Scale up (125%) + glow shadow + ping animation |

### 8.3 Implementation Reference

| Element | File |
|---------|------|
| Gesture Button | `frontend/components/ui/gesture-button.tsx` |
| Go Bubble | `frontend/components/ui/go-bubble.tsx` |

---

## 9. Control Priority Rules (V1)

1. State transitions are atomic
2. Inputs are ignored during transitions (Switching state)
3. Remote input overrides gesture input (when remote is implemented)
4. Gesture input is disabled during dialogs, switching, and result modal
5. Keyboard input is disabled during dialogs (ConfirmDialog handles its own) and during result (ResultModal handles its own)

---

## 10. Failure UX Principles (V1)

- Fail fast
- Fail visibly
- Always provide one clear recovery action

### Handled Failure Cases

| Failure | Handling | Component |
|---------|----------|-----------|
| Camera permission denied | Error message + "Try Again" button | `CameraError` |
| Avatar generation failed | StatusBadge: "Generation failed. Retry." (red) + Generate button available | `StatusBadge` (failed) |

### Not Yet Handled (V1.1)

| Failure | Status |
|---------|--------|
| Avatar generation timeout | Not implemented |
| Remote disconnected | Remote not implemented |
| Tracking lost mid-session | No specific handling |

---

## 11. State Transitions (Authoritative)

```
P1 (Welcome)
  |  START (click / Enter / Space)
  v
P2 (Avatar Setup)
  |  idle -> generating -> previewing -> selecting-song -> locked
  |  Go Bubble / Enter (in selecting-song)
  v
P3 (Game) — starts Playing immediately
  |  Playing <-> Paused (Enter/Space)
  |  Playing/Paused -> Switching -> Playing (song change)
  |  Playing/Paused -> Finished (song end / manual end)
  v
P4 (Result Modal on P3)
  |  Repeat -> P3 Playing (same song)
  |  New Song -> P2
  |  Exit -> P1
```

**Navigation paths back:**
- P3 -> P2: ArrowLeft (with confirmation if Playing/Paused)
- P4 -> P2: New Song button
- P4 -> P1: Exit button

---

## 12. Keyboard Mapping Summary (All Pages)

| Page / State | ArrowLeft | ArrowRight | Enter / Space | S |
|-------------|-----------|------------|---------------|---|
| **P1** Welcome | — | — | START | — |
| **P2** idle | Generate | — | Generate | — |
| **P2** generating | — | — | — | — |
| **P2** previewing | Regenerate | Confirm Avatar | Confirm Avatar | — |
| **P2** selecting-song | Prev Song | Next Song | Lock & Start | — |
| **P2** locked | — | — | — | — |
| **P3** Playing | Return P2 (c) | End early (c) | Pause | Change song (c) |
| **P3** Paused | Return P2 (c) | End early (c) | Resume | Change song (c) |
| **P3** Switching | — | — | — | — |
| **P3** Dialog | Cancel | — | Confirm | — |
| **P4** Result | Repeat | Exit | New Song | — |

*(c) = requires confirmation dialog before action*

**Design principles:**
- **ArrowLeft / ArrowRight** = spatial mapping (corresponds to on-screen left/right button positions)
- **Enter / Space** = primary forward action of the current context
- **S** = song switch shortcut (P3 only, simulates remote Switch button)
- **Escape** = cancel (in dialogs, equivalent to ArrowLeft)

---

## 13. Confirmation Dialogs (Authoritative)

Confirmation dialogs are required before any user action that may result in:
- Loss of session progress
- Interruption of an active Flow
- Navigation away from the current experience context

### 13.1 General Behavior Rules

- Dialogs are modal and centered on screen
- Underlying interaction is paused
- Camera feed remains visible but dimmed
- Gesture input is disabled
- Mouse click and keyboard/remote input accepted
- Dialogs require an explicit confirm or cancel action
- Dialog copy is short, clear, and non-technical

### 13.2 Dialog: Return to Avatar Setup

**Trigger:** User attempts to return to P2 from P3 (Playing or Paused)

| Element | Content |
|---------|---------|
| Title | "Return to avatar setup?" |
| Message | "Your current progress will be lost." |
| Confirm | "Return" |
| Cancel | "Cancel" |

### 13.3 Dialog: End Session Early

**Trigger:** User presses ArrowRight during Playing or Paused on P3

| Element | Content |
|---------|---------|
| Title | "End session now?" |
| Message | "Your progress will be saved." |
| Confirm | "End" |
| Cancel | "Cancel" |

### 13.4 Dialog: Change Song During Session

**Trigger:** User presses S during Playing or Paused on P3

| Element | Content |
|---------|---------|
| Title | "Switch song?" |
| Message | "The current session will end." |
| Confirm | "Switch" |
| Cancel | "Cancel" |

### 13.5 Dialog Keyboard Mapping

| Key | Action |
|-----|--------|
| Enter / Space | Confirm |
| ArrowLeft / Escape | Cancel |

### 13.6 Dialog Priority and Input Handling

- Confirmation dialogs override all other UI layers (z-index: `--z-dialog`)
- No other UI updates occur while dialog is visible
- All state transitions initiated by dialogs are atomic
- Game page keyboard handler defers to ConfirmDialog's own handler (`if (activeDialog) return`)

### 13.7 Copy Tone Guidelines (V1)

- Supportive, neutral, and respectful
- Avoid technical terms
- Avoid blame or error framing
- Always state the consequence clearly

### 13.8 Implementation Reference

| Element | File |
|---------|------|
| Confirm Dialog | `frontend/components/ui/confirm-dialog.tsx` |

---

## 14. Technical Constraints

| Constraint | Specification |
|------------|---------------|
| Avatar opacity | P2: 90% (`--opacity-avatar-setup`) · P3: 80% (`--opacity-avatar-game`) |
| Avatar persistence | Not saved (V1) |
| Supported songs | 5 preset tracks |
| Flow generation | Dynamic, song-based (timer-based in current implementation) |
| Camera | Required, mirrored (`-scale-x-100`) |
| Smart Framing | MediaPipe head/shoulder Y → dynamic `object-position`, EMA smoothing (0.1), bounds 10-40% |
| Fingertip estimation | `wrist + (wrist - elbow) * 0.4` |

---

## 15. Design Token Reference

Key CSS custom properties defined in `frontend/app/globals.css`:

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

**Final Status:**

- V1.1 UX Spec aligned with codebase
- All keyboard mappings implemented and documented
- Avatar generation failure UI implemented
- Confirmation dialog system complete

---

*This document is the authoritative UX reference for the Movement Coach V1 implementation.*
*Product requirements are defined in PRD.md.*
*Development progress is tracked in PROGRESS.md.*
*Technical workflow details are in WORKFLOW.md.*
