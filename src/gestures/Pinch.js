/**
 * @fileoverview Pinch gesture — detects Thumb-Index (left click / drag),
 * Thumb-Middle (right click), and double-click timing.
 */
import { getNormalizedDistance } from "../utils/cursorMath.js";

const DOUBLE_CLICK_MS = 320;

/**
 * Stateful Pinch detector — must be instantiated once per hand.
 */
export class PinchDetector {
  constructor(threshold = 0.055) {
    this.threshold = threshold;
    this._wasPinching = false;
    this._wasRightPinching = false;
    this._lastReleaseTime = 0;
  }

  /**
   * @param {Array<{x:number,y:number,z:number}>} landmarks
   * @returns {{ gesture:string, confidence:number, meta:object } | null}
   */
  detect(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      this._wasPinching = false;
      this._wasRightPinching = false;
      return null;
    }

    const thumbTip  = landmarks[4];
    const indexTip  = landmarks[8];
    const middleTip = landmarks[12];

    const leftDist  = getNormalizedDistance(thumbTip, indexTip);
    const rightDist = getNormalizedDistance(thumbTip, middleTip);

    const isPinching      = leftDist  < this.threshold;
    const isRightPinching = rightDist < this.threshold;

    // --- Right click ---
    if (isRightPinching && !this._wasRightPinching) {
      this._wasRightPinching = true;
      return { gesture: "RightClick", confidence: 1 - rightDist / this.threshold, meta: { type: "rightClick" } };
    }
    if (!isRightPinching) this._wasRightPinching = false;

    // --- Left pinch lifecycle ---
    if (isPinching && !this._wasPinching) {
      this._wasPinching = true;
      const now = Date.now();
      const isDouble = (now - this._lastReleaseTime) < DOUBLE_CLICK_MS;
      return {
        gesture: isDouble ? "DoubleClick" : "PinchStart",
        confidence: 1 - leftDist / this.threshold,
        meta: { type: isDouble ? "doubleClick" : "mouseDown" },
      };
    }

    if (isPinching && this._wasPinching) {
      return { gesture: "Drag", confidence: 1 - leftDist / this.threshold, meta: { type: "drag" } };
    }

    if (!isPinching && this._wasPinching) {
      this._wasPinching = false;
      this._lastReleaseTime = Date.now();
      return { gesture: "PinchEnd", confidence: 1.0, meta: { type: "mouseUp" } };
    }

    return null;
  }

  reset() {
    this._wasPinching = false;
    this._wasRightPinching = false;
  }
}
