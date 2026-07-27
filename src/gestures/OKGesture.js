/**
 * @fileoverview OKGesture — thumb + index tips close together, other fingers open.
 * Action: Copy (Ctrl+C)
 */
import { getNormalizedDistance } from "../utils/cursorMath.js";
import { getFingerState } from "../utils/fingerState.js";

const TIP_THRESHOLD = 0.07;

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  const dist = getNormalizedDistance(landmarks[4], landmarks[8]);
  const circleFormed = dist < TIP_THRESHOLD;

  // Other fingers open
  if (circleFormed && s.middle && s.ring && s.pinky) {
    const confidence = Math.max(0, 1 - dist / TIP_THRESHOLD);
    return { gesture: "OKGesture", confidence };
  }
  return null;
}
