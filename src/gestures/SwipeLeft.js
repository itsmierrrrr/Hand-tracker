/**
 * @fileoverview SwipeLeft gesture — rapid leftward hand motion.
 * Action: Previous Track
 */

const VELOCITY_THRESHOLD = 0.018; // normalized units per frame
const WINDOW_FRAMES = 8;

/**
 * Stateful SwipeLeft detector — must be instantiated once per hand.
 */
export class SwipeLeftDetector {
  constructor() {
    this._history = [];
    this._triggered = false;
  }

  /**
   * @param {Array<{x:number,y:number,z:number}>} landmarks
   * @returns {{ gesture:string, confidence:number } | null}
   */
  detect(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      this._history = [];
      this._triggered = false;
      return null;
    }

    const wristX = landmarks[0].x;
    this._history.push(wristX);
    if (this._history.length > WINDOW_FRAMES) this._history.shift();
    if (this._history.length < WINDOW_FRAMES) return null;

    // In mirrored space leftward motion = X increases (since mirrored)
    // Raw MediaPipe X: 0=left edge, 1=right edge (camera view, not mirrored)
    // Swipe left (in real world) = wrist X INCREASES in raw coords
    const velocity = (this._history[WINDOW_FRAMES - 1] - this._history[0]) / WINDOW_FRAMES;

    if (velocity > VELOCITY_THRESHOLD && !this._triggered) {
      this._triggered = true;
      return { gesture: "SwipeLeft", confidence: Math.min(1, velocity / (VELOCITY_THRESHOLD * 2)) };
    }

    if (velocity <= 0) this._triggered = false;
    return null;
  }

  reset() {
    this._history = [];
    this._triggered = false;
  }
}
