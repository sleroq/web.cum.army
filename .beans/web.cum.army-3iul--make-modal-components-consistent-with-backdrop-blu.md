---
# web.cum.army-3iul
title: Make modal components consistent with backdrop blur and click handling
status: todo
type: task
created_at: 2026-01-22T13:33:47Z
updated_at: 2026-01-22T13:33:47Z
---

Update ModalTextInput component to match SettingsModal's backdrop blur and background click handling behavior

## Checklist

- [ ] Update background overlay classes in ModalTextInput to add `backdrop-blur-sm` and `bg-black/50`
- [ ] Fix z-index to use consistent `z-50` instead of `z-100`
- [ ] Ensure background click handling works (currently conditional via `canCloseOnBackgroundClick`)
- [ ] Add proper ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`)
- [ ] Test modal closes properly on background click
- [ ] Test modal content stops event propagation correctly

## Context

**SettingsModal reference** (`src/components/shared/SettingsModal.tsx`):

- Line 39: `className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"`
- Line 40: `onClick={() => setSettingsOpen(false)}` - closes on background click
- Line 47: `onClick={(e) => e.stopPropagation()}` - stops propagation on modal content
- Proper ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="settings-title"`

**ModalTextInput current state** (`src/components/shared/ModalTextInput.tsx`):

- Line 36: Missing backdrop blur and background color
- Line 38: `bg-transparent` instead of `bg-black/50`
- Line 39: Conditional background click via `canCloseOnBackgroundClick` prop
- Missing ARIA attributes
- Uses `z-100` instead of `z-50`
