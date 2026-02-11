# Coding Rules — Generic (Cross-Project) v1.1

> Purpose:
> Provide stable, reusable rules that govern how an AI assistant collaborates on software projects.
> These rules are **architecture-level**, not domain-specific.

---

## 0) Document Priority

Order of authority (highest to lowest):

1. Project README / PRD / Design Docs
2. Project-specific AI rules (e.g. CLAUDE.md)
3. This document (CODING_RULES.md)

If conflicts exist:
- Follow this priority order.
- If still ambiguous (e.g., same-level docs conflict or requirements are unclear), STOP and ask which document to follow.

# WHY: Prevents rule compliance from overriding product intent.

---

## 1) Core Principles

### 1.1 Separation of Concerns
- UI layers must not contain business or domain logic
- Core logic must not depend on UI state
- Side effects must be explicit and localized

# WHY: Mixing concerns creates hidden coupling and non-deterministic behavior.

### 1.2 Explicit Control Flow
- State transitions must be explicit
- Implicit timing or ordering assumptions are forbidden
- Derived decisions must be traceable to inputs

# WHY: Explicit flow is easier to reason about, test, and audit.

### 1.3 Minimal Intervention
- Only change what is requested or clearly necessary
- Do not add features, refactor, or "improve" beyond scope
- Do not add documentation, types, or comments unless necessary to satisfy the requested change or to prevent regressions

# WHY: Over-reaching is the most common AI coding failure mode.

### 1.4 Explicit Assumptions (No Silent Guessing)
- When uncertain, state assumptions explicitly and tag them for confirmation
- Do not silently invent requirements, data fields, APIs, or behaviors

# WHY: Prevents hallucination and hidden requirements from becoming “facts” in the codebase.

---

## 2) Allowed Patterns

- Explicit state machines
- Pure functions where feasible
- Dependency injection (explicit ownership of dependencies)
- Clear module boundaries with documented responsibilities

---

## 3) Discouraged / Forbidden Patterns

- Hidden global or module-level mutable state
  (Allowed only if lifecycle, ownership, and mutation surface are documented)
- Logic embedded in UI rendering lifecycle
- Side effects during object construction or rendering
- "Clever" abstractions without clear necessity

# WHY: These patterns make systems fragile and hard to debug.

---

## 4) Invariants Framework (Template)

Each project MUST define its own invariants, using this structure:

- Core logic invariants
- API / interface invariants
- Data invariants
- Security invariants

When proposing changes, always identify which invariants may be affected.

# WHY: Invariants define what must never silently break.

---

## 5) Change Classification Protocol

All code changes fall into one of the following levels:

| Level   | Examples                         | Required Process |
|---------|----------------------------------|------------------|
| Trivial | Typos, comments, logs            | Direct change |
| Small   | Single function, small refactor  | Explain intent, then implement |
| Medium  | Cross-file change, new component | Full change protocol (Section 6) |
| Large   | Architecture or data migration   | Full protocol + design doc |

If uncertain about level, default to the higher level.

# WHY: Prevents process overhead for low-risk changes, while ensuring risky changes get proper review.

---

## 6) Full Change Protocol (Medium / Large)

### Before implementation

AI must present:

A) Intent (what and why)  
B) Affected invariants  
C) Diff plan (files and scope)  
D) Risk assessment + rollback plan  
E) Explicit approval request  
E2) Acceptance criteria + minimal test plan

# WHY: Forces a definition of done and prevents changes that cannot be verified.

Implementation may proceed ONLY after approval.

### After implementation

AI must provide:

F) Commands to verify locally  
G) Expected outputs  
H) Review checklist

---

## 7) Diff-First Rule

Prefer:
- Minimal diffs
- One concern per change
- Explicit before/after explanation

Avoid:
- Large rewrites
- Opportunistic refactors
- Silent behavior changes

---

## 8) Scope Guard

- No new files without explanation (must appear in the Diff plan)
- No new abstractions without necessity
- No framework or dependency changes without approval

---

## 9) Security and Safety (Generic)

- No secrets in source code
- Configuration via environment variables
- Sensitive data must never appear in logs
- Principle of least privilege for tools/APIs
- Collect/store the minimum necessary data

# WHY: Reduces blast radius and compliance risk.

---

## 10) Output Expectations (Adaptive)

- Q&A / research: direct answer
- Code changes: follow appropriate change protocol
- Architecture discussion: principles and trade-offs

# WHY: Interaction style must match task intent.

---

## 11) Reversibility Preference (Generic)

- Prefer changes that are reversible; avoid one-way migrations or irreversible behavior without explicit approval.

# WHY: Reduces risk and supports fast rollback when assumptions are wrong.
