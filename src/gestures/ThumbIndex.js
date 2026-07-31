/**
 * @fileoverview ThumbIndex gesture — thumb and index finger extended, middle/ring/pinky curled.
 * Action: Dedicated Scroll Gesture.
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  // Thumb and index extended, middle, ring, pinky curled
  if (s.thumb && s.index && !s.middle && !s.ring && !s.pinky) {
    return { gesture: "ThumbIndex", confidence: 0.9 };
  }
  return null;
}
