---
# web.cum.army-zrli
title: Refactor Player.tsx and large components
status: todo
type: task
tags:
    - performance
    - frontend
created_at: 2026-01-22T12:42:52Z
updated_at: 2026-01-22T12:42:52Z
---

## Summary
Refactor `Player.tsx` and other large components by extracting logic into custom hooks and specialized sub-components to improve maintainability and readability.

## Current State
- `Player.tsx` (630 lines) manages WebRTC (WHEP) connections, statistics gathering, UI overlay timers, and complex click interactions.
- High state density: 12+ `useState` hooks and 10+ `useRef` hooks in a single component.
- Mixing of concerns: Network logic (WebRTC/SSE) is tightly coupled with UI rendering.

## Execution Plan

### Phase 1: Player.tsx Refactoring
- [ ] Extract `useWhepClient`: WebRTC/WHEP connection logic, SSE handling, and layer management.
- [ ] Extract `usePlayerStats`: 2-second interval logic for gathering WebRTC inbound-rtp stats.
- [ ] Extract `usePlayerOverlay`: Mouse/touch event listeners and the auto-hide timer for the UI overlay.
- [ ] Extract `usePlayerActions`: Click/double-click logic and play/pause animation state.

### Phase 2: Broadcaster Refactoring
- [ ] Audit `src/components/broadcast/Broadcast.tsx` for similar patterns.
- [ ] Standardize hook patterns across the codebase.

## Success Criteria
- [ ] `Player.tsx` reduced to < 250 lines.
- [ ] WebRTC logic isolated from React component lifecycle.
- [ ] Reusable hooks created for stats and overlay management.
