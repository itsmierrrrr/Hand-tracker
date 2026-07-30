/**
 * @fileoverview SwipeRight gesture — rapid rightward hand motion.
 * Action: Next Track
 */

const VELOCITY_THRESHOLD = 0.018;
const WINDOW_FRAMES = 8;

/**
 * Stateful SwipeRight detector — must be instantiated once per hand.
 */
export class SwipeRightDetector {
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

    // Swipe right (real world) = wrist X DECREASES in raw coords
    const velocity = (this._history[0] - this._history[WINDOW_FRAMES - 1]) / WINDOW_FRAMES;

    if (velocity > VELOCITY_THRESHOLD && !this._triggered) {
      this._triggered = true;
      return { gesture: "SwipeRight", confidence: Math.min(1, velocity / (VELOCITY_THRESHOLD * 2)) };
    }

    if (velocity <= 0) this._triggered = false;
    return null;
  }

  reset() {
    this._history = [];
    this._triggered = false;
  }
}
