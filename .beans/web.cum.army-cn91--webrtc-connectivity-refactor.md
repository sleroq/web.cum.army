---
# web.cum.army-cn91
title: WebRTC Connectivity & Refactor
status: todo
type: bug
priority: high
tags:
  - webrtc
  - refactor
created_at: 2026-01-22T12:42:06Z
updated_at: 2026-01-22T12:42:06Z
---

Investigate and resolve ICE failures on mobile (Vivaldi/Chrome) and Firefox. Refactor `src/config/webrtc.ts` to simplify and remove defensive code.

## Context

Some browsers (Mobile Vivaldi, Firefox on Mac) fail to connect with "WebRTC: ICE failed". Previous attempts to fix this added complexity (ICE gathering wait, configurable STUN) but didn't solve the root cause for all users.

## Potential Root Causes

- **Symmetric NAT / CGNAT**: Requires TURN servers (relays) as STUN cannot bypass these.
- **Codec Mismatch**: Mobile browsers may require specific H.264 profiles (Baseline vs High).
- **WHEP Implementation**: Potential mismatch in handshake (bundle-policy, rtcp-mux).
- **Autoplay Restrictions**: Browser might block stream without sufficient user activation.

## Checklist

- [ ] Research and implement TURN server support (beyond just STUN).
- [ ] Investigate H.264 profile compatibility for mobile hardware decoders.
- [ ] Audit `src/config/webrtc.ts` and remove unnecessary "defensive" code.
- [ ] Simplify ICE gathering logic if possible.
- [ ] Verify fix on Mobile Vivaldi and Firefox.

## Summary of Changes

(To be filled upon completion)
