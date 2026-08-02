import { useEffect, useRef } from "react";
import { drawHand } from "../utils/drawHand.js";
import { PointSmoother } from "../utils/smoothing.js";
import { mapLandmarkToScreen } from "../utils/cursorMath.js";
import { GestureEngine } from "../gesture/detectGesture.js";
import { desktopController } from "../services/desktopController.js";

/**
 * 60 FPS detection loop.
 * - Runs MediaPipe inference on each new video frame
 * - Smooths cursor position (EMA)
 * - Evaluates gestures via GestureEngine
 * - Dispatches desktop actions via desktopController
 * - Draws hand skeleton + pinch feedback on canvas
 * - Reports telemetry via onTelemetry callback (never setState per frame)
 *
 * Scroll UX:
 *   Pinch thumb + index together → hold pinch → move hand UP/DOWN → scroll.
 *   Scroll mode is active as long as pinch is held.
 *   Quick pinch-release (no vertical motion > threshold) = left click.
 *
 * @param {{
 *   detector: object | null,
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   canvasRef: React.RefObject<HTMLCanvasElement>,
 *   enabled: boolean,
 *   settings: object,
 *   onTelemetry: (t: object) => void,
 * }} params
 */
export default function useDetectionLoop({
  detector,
  videoRef,
  canvasRef,
  enabled = true,
  settings,
  onTelemetry,
}) {
  const rafRef           = useRef(null);
  const lastTimeRef      = useRef(-1);
  const fpsRef           = useRef({ frames: 0, last: 0, fps: 0 });
  const enginesRef       = useRef([new GestureEngine(), new GestureEngine()]);
  const smootherRef      = useRef(new PointSmoother(0.35));
  const cursorPausedRef  = useRef(false);
  const errorUntilRef    = useRef(0);

  // Offscreen canvas — avoids WebGL GPU path in Electron
  const offscreenRef     = useRef(null);
  const offscreenCtxRef  = useRef(null);

  // ── Pinch-scroll state ───────────────────────────────────────────────────
  const scrollModeRef    = useRef(false);
  const pinchStartYRef   = useRef(null);
  const lastScrollYRef   = useRef(null);
  const mouseDownRef     = useRef(false);

  // ── FourFingers 3-second hold state ─────────────────────────────────────
  // playPause only fires after the pose is held for 3 continuous seconds.
  const fourFingersStartRef     = useRef(null); // performance.now() when pose first seen
  const fourFingersTriggeredRef = useRef(false); // prevent re-fire until pose released

  // Threshold: how much vertical travel (normalised 0-1) to enter scroll mode
  const SCROLL_ACTIVATE_DIST = 0.04;
  // Pinch distance threshold (normalised) to be considered "pinching"
  const PINCH_THRESHOLD = 0.07;

  // Settings ref keeps closure fresh without restarting the loop
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    if (!detector || !enabled) return;

    const loop = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === 4 && video.videoWidth > 0) {
        if (video.currentTime !== lastTimeRef.current) {
          lastTimeRef.current = video.currentTime;

          // Sync canvas resolution to native video dimensions
          if (canvas.width  !== video.videoWidth)  canvas.width  = video.videoWidth;
          if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const cfg = settingsRef.current;

          // ── MediaPipe inference (CPU path via ImageData) ──────────────────
          if (performance.now() < errorUntilRef.current) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          let results;
          try {
            const w = video.videoWidth;
            const h = video.videoHeight;

            if (!offscreenRef.current) {
              const c = document.createElement("canvas");
              c.width  = w;
              c.height = h;
              offscreenRef.current    = c;
              offscreenCtxRef.current = c.getContext("2d", { willReadFrequently: true });
            } else if (offscreenRef.current.width !== w || offscreenRef.current.height !== h) {
              offscreenRef.current.width  = w;
              offscreenRef.current.height = h;
            }

            offscreenCtxRef.current.drawImage(video, 0, 0, w, h);
            const imageData = offscreenCtxRef.current.getImageData(0, 0, w, h);
            results = detector.detectForVideo(imageData, performance.now());
          } catch (e) {
            errorUntilRef.current = performance.now() + 2000;
            console.error("[loop] detectForVideo:", e.message);
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          // ── FPS counter ───────────────────────────────────────────────────
          const fc = fpsRef.current;
          fc.frames++;
          const now = performance.now();
          if (fc.last === 0) {
            fc.last = now;
          } else if (now - fc.last >= 1000) {
            fc.fps    = fc.frames;
            fc.frames = 0;
            fc.last   = now;
          }

          const hands = results?.landmarks ?? [];
          let gesture = "–", confidence = 0, cursorPos = null, clickStatus = "Idle";

          if (hands.length > 0) {
            const primary = hands[0];

            // ── Raw pinch distance (thumb tip ↔ index tip) ────────────────
            const thumbTip = primary[4];
            const indexTip = primary[8];
            const pinchDist = (thumbTip && indexTip)
              ? Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
              : 1.0;
            const isPinched = pinchDist < PINCH_THRESHOLD;

            // ── Pinch-scroll logic ─────────────────────────────────────────
            // When pinch starts, record the Y anchor.
            // If vertical movement exceeds SCROLL_ACTIVATE_DIST → scroll mode.
            // Scroll mode persists until pinch is released.
            // While in scroll mode: mouse button is NOT pressed.
            if (isPinched && cfg?.enableCursor !== false) {
              const pinchMidY = (thumbTip.y + indexTip.y) / 2;

              // First frame of pinch: record starting Y
              if (pinchStartYRef.current === null) {
                pinchStartYRef.current = pinchMidY;
                lastScrollYRef.current = pinchMidY;
              }

              const totalVertical = Math.abs(pinchMidY - pinchStartYRef.current);

              // Activate scroll mode once vertical travel crosses threshold
              if (totalVertical > SCROLL_ACTIVATE_DIST) {
                if (!scrollModeRef.current) {
                  // Just entered scroll mode — release mouse if it was pressed
                  if (mouseDownRef.current) {
                    desktopController.mouseUp();
                    mouseDownRef.current = false;
                  }
                  scrollModeRef.current = true;
                }
              }

              if (scrollModeRef.current && lastScrollYRef.current !== null) {
                const diff = pinchMidY - lastScrollYRef.current;
                if (Math.abs(diff) > 0.006) {
                  desktopController.scroll(diff * (cfg?.scrollSpeed ?? 90));
                  clickStatus = diff > 0 ? "Scroll ↓" : "Scroll ↑";
                }
              }

              lastScrollYRef.current = pinchMidY;
            } else {
              // Pinch released — exit scroll mode, reset anchors
              pinchStartYRef.current = null;
              lastScrollYRef.current = null;
              scrollModeRef.current  = false;
            }

            // ── Gesture engine ─────────────────────────────────────────────
            const gesResult = enginesRef.current[0].detect(
              primary,
              cfg?.gestureConfidenceMin ?? 0.75
            );

            if (gesResult) {
              gesture    = gesResult.gesture;
              confidence = gesResult.confidence;

              // ── Mouse click actions (suppressed when in scroll mode) ────
              if (cfg?.enableCursor !== false && !scrollModeRef.current) {
                switch (gesture) {
                  case "PinchStart":
                    clickStatus = "Left ↓";
                    desktopController.mouseDown();
                    mouseDownRef.current = true;
                    break;
                  case "Drag":
                    clickStatus = "Dragging";
                    break;
                  case "PinchEnd":
                    clickStatus = "Released";
                    desktopController.mouseUp();
                    mouseDownRef.current = false;
                    break;
                  case "DoubleClick":
                    clickStatus = "Dbl Click";
                    desktopController.doubleClick();
                    break;
                  case "RightClick":
                    clickStatus = "Right ↓";
                    desktopController.rightClick();
                    break;
                }
              }

              // ── Keyboard shortcuts ────────────────────────────────────────
              if (cfg?.enableKeyboard !== false) {
                switch (gesture) {
                  case "Fist":         cursorPausedRef.current = !cursorPausedRef.current; break;
                  case "OpenPalm":     desktopController.escape(); break;
                  case "Peace":        desktopController.altTab(); break;
                  case "ThreeFingers": desktopController.windowsKey(); break;
                  case "OKGesture":    desktopController.copy(); break;
                  case "CallGesture":  desktopController.paste(); break;
                  case "RockGesture":  desktopController.screenshot(); break;
                }
              }

              // ── Media controls (FourFingers handled separately below) ───────
              if (cfg?.enableMedia !== false) {
                switch (gesture) {
                  case "ThumbUp":     desktopController.volumeUp();   break;
                  case "ThumbDown":   desktopController.volumeDown(); break;
                  case "SwipeLeft":   desktopController.prevTrack();  break;
                  case "SwipeRight":  desktopController.nextTrack();  break;
                }
              }
            }

            // ── FourFingers 3-second hold → Play/Pause ───────────────────────
            // Detect the pose raw every frame so hold time accumulates
            // continuously (the gesture engine's debounce would reset it).
            if (cfg?.enableMedia !== false) {
              const lm = primary;
              const isFourPose = lm[8] && lm[12] && lm[16] && lm[20]
                && lm[8].y  < lm[5].y   // index extended
                && lm[12].y < lm[9].y   // middle extended
                && lm[16].y < lm[13].y  // ring extended
                && lm[20].y < lm[17].y  // pinky extended
                && (() => {             // thumb curled
                    const tip  = lm[4], base = lm[2], palm = lm[9];
                    return Math.hypot(tip.x-palm.x, tip.y-palm.y) <= Math.hypot(base.x-palm.x, base.y-palm.y) * 1.1;
                  })();

              if (isFourPose) {
                if (fourFingersStartRef.current === null) {
                  fourFingersStartRef.current     = performance.now();
                  fourFingersTriggeredRef.current = false;
                }
                const held = performance.now() - fourFingersStartRef.current;

                if (!fourFingersTriggeredRef.current) {
                  if (held >= 1000) {
                    desktopController.playPause();
                    fourFingersTriggeredRef.current = true;
                    clickStatus = "Play / Pause ▶";
                    gesture    = "FourFingers 1s";
                  } else {
                    // show progress while holding
                    clickStatus = `Hold ${Math.ceil((1000 - held) / 1000)}s…`;
                    gesture    = "FourFingers";
                  }
                }
              } else {
                fourFingersStartRef.current     = null;
                fourFingersTriggeredRef.current = false;
              }
            }

            // ── Cursor movement (index finger tip: Landmark 8) ──────────────
            if (indexTip && !cursorPausedRef.current && cfg?.enableCursor !== false) {
              const screenSize = desktopController.getScreenSize();

              const raw = mapLandmarkToScreen(
                indexTip,
                screenSize.width,
                screenSize.height
              );

              smootherRef.current.alpha = cfg?.smoothing ?? 0.35;
              const smoothed = smootherRef.current.smooth(raw.x, raw.y);

              desktopController.moveCursor(
                Math.round(smoothed.x),
                Math.round(smoothed.y)
              );

              cursorPos = {
                x: Math.round(smoothed.x),
                y: Math.round(smoothed.y),
              };
            }

            // ── Draw all hands ─────────────────────────────────────────────
            hands.forEach((lm, i) => {
              drawHand(ctx, lm, canvas.width, canvas.height, {
                gestureState: i === 0
                  ? {
                      isPinching:      scrollModeRef.current ? false : (gesture === "Drag" || gesture === "PinchStart"),
                      isScrolling:     scrollModeRef.current,
                      isRightClicking: gesture === "RightClick",
                    }
                  : null,
              });
            });

            // ── Telemetry ─────────────────────────────────────────────────
            onTelemetry?.({
              handCount:    hands.length,
              gesture:      scrollModeRef.current ? (clickStatus.startsWith("Scroll") ? clickStatus : "Scroll") : gesture,
              confidence,
              fps:          fc.fps,
              cursorPos:    cursorPos ?? { x: 0, y: 0 },
              clickStatus:  scrollModeRef.current && clickStatus === "Idle" ? "Pinch held" : clickStatus,
              cursorPaused: cursorPausedRef.current,
            });
          } else {
            // No hands — reset all stateful trackers
            enginesRef.current[0].reset();
            enginesRef.current[1].reset();
            smootherRef.current.reset();
            lastScrollYRef.current = null;
            pinchStartYRef.current = null;
            scrollModeRef.current  = false;
            if (mouseDownRef.current) {
              desktopController.mouseUp();
              mouseDownRef.current = false;
            }
            cursorPausedRef.current = false;

            onTelemetry?.({
              handCount:   0,
              gesture:     "–",
              confidence:  0,
              fps:         fc.fps,
              cursorPos:   { x: 0, y: 0 },
              clickStatus: "Idle",
              cursorPaused: false,
            });
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [detector, videoRef, canvasRef, enabled, onTelemetry]);
}
