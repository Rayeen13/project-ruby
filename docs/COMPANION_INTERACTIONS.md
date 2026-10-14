# Companion interactions — 13 October 2026

## References reviewed

Hakko's official quick-start documents a large full-body preview beside selectable companion cards, outfit and voice previews, and personality details. Its PC widget guide documents compact mode and tray hide/restore controls. ASUS describes Tianxuan Ji as an interactive virtual desktop pet and documents its official installation route. These references informed Ruby's collection and floating interaction design. The reviewed official pages do not establish a specific shake-to-stars gesture; that feature is Riyan's requested Ruby behaviour. No competitor assets, models, voices or personality text were copied.

- https://www.hakko.ai/blog/article/quick-start/
- https://www.hakko.ai/blog/article/common-problem/
- https://www.hakko.ai/blog/article/desktop-ai-companion/
- https://rog.asus.com.cn/support/faq/1056833/

## Implemented controls

- Choose any of the five existing bodies from category-filtered companion cards; the large live 3D preview updates. Gem colour remains independent.
- Each body has its own saved personality: Classic calm, Cyber curious, Chibi playful, Office focused, Gamer playful. Change the preset per body. Reactions and idle rhythm use these presets. The prompt strings are a future chat-provider seam; there is no connected AI conversation or voice here yet.
- Tap the model for head/body/hand reactions. Right-click the visible mesh, or touch long-press without moving, for its action bubble.
- Hold the left mouse button on the mesh for 420 ms, or drag it, to carry it. Touch-drag carries it too. Background drag or Alt-drag still rotates the camera; scroll/pinch zooms.
- Deliberate fast back-and-forth swings make the companion dizzy, with spiral digital eyes and five 3D stars above its head. Detection accumulates whole swings, so small high-frequency mouse events work; ordinary straight/slow dragging does not trigger it. The effect recovers after 3.8 seconds and stops immediately with Stop. Reduced-motion settings keep the feedback without spinning stars or wobble.
- Return to centre resets the browser preview position. Dizzy preview in the action bubble offers an accessible way to try the reaction.

## Native Windows behaviour

Floating mode is transparent and undecorated with no permanent toolbar. Right-click the companion for Open lab, Click-through, Hide and Stop; tray and Ctrl+Alt+Shift+R recovery remain available. Carrying the mesh moves the actual native window through a bounded own-window IPC operation. It does not also translate the mesh inside that window. The host rejects movement outside interactive floating mode and clips the window to its current monitor. Cross-monitor carry is not implemented in this slice.

Browser carrying is confined to the preview stage; a website cannot create an always-on-top desktop window. Existing model geometry and print exports are unchanged; stars are runtime scene effects, not part of a figurine export.

## Validation

Local checks cover shake hysteresis, fast/slow/straight movement, high-frequency input, expiry/reset, mesh-versus-native movement separation and per-body preferences, alongside existing hand-clearance/interaction checks. Windows CI exercises the real packaged WebView, gallery and saved personalities, then uses the Windows mouse to hold, carry and shake the native companion, verifies actual window movement, captures dizzy/floating screenshots, and checks global shortcut recovery. Record the successful run and any limits before merging.

## Tap and motion correction — 14 October

Quick clicks leave the robot grounded and only trigger a small, eased head response. Hold-to-grab now requires 420 ms or deliberate movement beyond 12 pixels, is tied to the current pointer, and is cancelled on release/capture loss. Carry lift/lean ease in and out; gaze is smoothed; the old full-body tap bounce and abrupt limb dance are replaced by gentle head gestures/sway.

The executable starts in floating mode. Both floating and lab windows remove native decorations and shadow; lab has Move/Float/Hide controls. Windows polls the global cursor at 20 Hz while the window is visible, emitting only transient normalised coordinates to the local viewer. Follow/Stop still control visible gaze. Browser tracking is confined to its page; whole-screen tracking is native Windows only in this slice.

Windows regression checks include an actual 300 ms mouse click with continuous no-grab/no-lift observations, outside-window cursor tracking, native client-frame geometry checks, then deliberate carry/shake and emergency recovery.

## Edge companion slice — 14 October

Floating zoom resizes the transparent native canvas rather than clipping the character inside a fixed rectangle. A shared camera-fit module bounds the current geometry across all five accepted bodies. Right-click desktop controls expose size, left/right peek, undock and pin-above-windows actions. Pinning keeps Ruby above other windows and remains compatible with carrying; it is not a position lock. Edge hover reveals the body and an inward head tilt gives the peek pose. Native placement, size, edge and pin are saved separately from character preferences. Conversation and voice remain on their existing roadmap.
