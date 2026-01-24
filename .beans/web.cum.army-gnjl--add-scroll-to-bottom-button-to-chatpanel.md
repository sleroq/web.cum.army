---
# web.cum.army-gnjl
title: Add scroll to bottom button to ChatPanel
status: todo
type: feature
tags:
  - frontend
created_at: 2026-01-22T12:33:41Z
updated_at: 2026-01-22T12:33:41Z
---

Add a button to the ChatPanel that appears when the user has scrolled up and there are new messages, or just to allow manual scrolling to the bottom.

## Proposed Solution

1.  **Scroll Detection**: Monitor the scroll position of the message container.
2.  **State Management**: Track whether the user is "at the bottom" or "scrolled up".
3.  **UI Button**: Add a floating "Scroll to Bottom" button that appears when the user is scrolled up.
4.  **New Message Indicator**: Optionally show a badge or change button text if new messages arrive while scrolled up.

## Checklist

- [ ] Add `isAtBottom` state to `ChatPanel.tsx`
- [ ] Implement scroll listener on the message container
- [ ] Create `ScrollToBottom` button component/element
- [ ] Add logic to show button only when scrolled up
- [ ] Add "New Messages" indicator to the button
- [ ] Verify auto-scroll still works correctly
- [ ] Test in both sidebar and below-video layouts

## Execution Plan

### Phase 1: Logic & State

| Step | Files           | Action                                                                          | Verification                 |
| ---- | --------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| 1.1  | `ChatPanel.tsx` | Add `isAtBottom` state and scroll listener                                      | Console log scroll state     |
| 1.2  | `ChatPanel.tsx` | Update `useEffect` for messages to set "has new messages" flag if not at bottom | State updates on new message |

### Phase 2: UI Implementation

| Step | Files           | Action                                                   | Verification                    |
| ---- | --------------- | -------------------------------------------------------- | ------------------------------- |
| 2.1  | `ChatPanel.tsx` | Add floating button with `ArrowDownIcon`                 | Button appears when scrolled up |
| 2.2  | `ChatPanel.tsx` | Style button with Tailwind (absolute, bottom-4, right-4) | Visual check                    |

### Phase 3: Interaction

| Step | Files           | Action                                              | Verification                                |
| ---- | --------------- | --------------------------------------------------- | ------------------------------------------- |
| 3.1  | `ChatPanel.tsx` | Implement `scrollToBottom` function on button click | Clicking scrolls to bottom and hides button |
