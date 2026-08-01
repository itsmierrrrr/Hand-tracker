/**
 * @fileoverview Central gesture detection engine.
 * Evaluates all registered gesture modules and returns the best match.
 * Stateful detectors (Pinch, Swipe) are maintained as class instances.
 */

import * as OpenPalm      from "../gestures/OpenPalm.js";
import * as Fist          from "../gestures/Fist.js";
import * as ThumbUp       from "../gestures/ThumbUp.js";
import * as ThumbDown     from "../gestures/ThumbDown.js";
import * as Peace         from "../gestures/Peace.js";
import * as ThreeFingers  from "../gestures/ThreeFingers.js";
import * as FourFingers   from "../gestures/FourFingers.js";
import * as ThumbIndex    from "../gestures/ThumbIndex.js";
import * as OKGesture     from "../gestures/OKGesture.js";
import * as CallGesture   from "../gestures/CallGesture.js";
import * as RockGesture   from "../gestures/RockGesture.js";
import { PinchDetector }     from "../gestures/Pinch.js";
import { SwipeLeftDetector }  from "../gestures/SwipeLeft.js";
import { SwipeRightDetector } from "../gestures/SwipeRight.js";

/**
 * @typedef {{ gesture: string, confidence: number, meta?: object }} GestureResult
 */

/**
 * Gesture engine — one instance per tracked hand.
 */
export class GestureEngine {
  constructor() {
    this.pinch      = new PinchDetector();
    this.swipeLeft  = new SwipeLeftDetector();
    this.swipeRight = new SwipeRightDetector();

    /** Ordered priority list of stateless gesture detectors */
    this._stateless = [
      FourFingers,
      ThumbIndex,
      OpenPalm,
      Fist,
      ThumbUp,
      ThumbDown,
      Peace,
      ThreeFingers,
      OKGesture,
      CallGesture,
      RockGesture,
    ];

    /** Simple debounce — same gesture cannot re-fire within this period */
    this._debounceMsMap = {
      FourFingers: 800,
      ThumbIndex: 150,
      OpenPalm: 800,
      Fist: 800,
      ThumbUp: 600,
      ThumbDown: 600,
      Peace: 600,
      ThreeFingers: 600,
      OKGesture: 600,
      CallGesture: 600,
      RockGesture: 1200,
      SwipeLeft: 800,
      SwipeRight: 800,
    };
    this._lastFired = {};
  }

  /**
   * Run all detectors against current landmark frame.
   * Returns the highest-priority gesture result, or null.
   *
   * @param {Array<{x:number,y:number,z:number}>} landmarks
   * @param {number} [confidenceMin=0.75]
   * @returns {GestureResult | null}
   */
  detect(landmarks, confidenceMin = 0.75) {
    if (!landmarks || landmarks.length < 21) {
      this.pinch.reset();
      this.swipeLeft.reset();
      this.swipeRight.reset();
      return null;
    }

    // --- Pinch (highest priority — drives cursor interactions) ---
    const pinchResult = this.pinch.detect(landmarks);
    if (pinchResult) return pinchResult;

    // --- Swipe gestures ---
    const swipeL = this.swipeLeft.detect(landmarks);
    if (swipeL && this._canFire("SwipeLeft")) {
      this._markFired("SwipeLeft");
      return swipeL;
    }
    const swipeR = this.swipeRight.detect(landmarks);
    if (swipeR && this._canFire("SwipeRight")) {
      this._markFired("SwipeRight");
      return swipeR;
    }

    // --- Stateless gesture priority scan ---
    for (const mod of this._stateless) {
      const result = mod.detect(landmarks);
      if (result && result.confidence >= confidenceMin) {
        const name = result.gesture;
        if (this._canFire(name)) {
          this._markFired(name);
          return result;
        }
      }
    }

    return null;
  }

  /** @param {string} name */
  _canFire(name) {
    const debounce = this._debounceMsMap[name] ?? 500;
    return (Date.now() - (this._lastFired[name] || 0)) >= debounce;
  }

  /** @param {string} name */
  _markFired(name) {
    this._lastFired[name] = Date.now();
  }

  reset() {
    this.pinch.reset();
    this.swipeLeft.reset();
    this.swipeRight.reset();
    this._lastFired = {};
  }
}
