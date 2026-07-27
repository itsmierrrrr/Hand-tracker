/**
 * @fileoverview Peace gesture — index + middle extended, ring + pinky curled.
 * Action: Alt+Tab / Scroll mode
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  if (s.index && s.middle && !s.ring && !s.pinky) {
    return { gesture: "Peace", confidence: 0.9 };
  }
  return null;
}
