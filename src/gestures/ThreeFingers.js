/**
 * @fileoverview ThreeFingers gesture — index, middle, ring extended; pinky + thumb curled.
 * Action: Windows Key
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  if (s.index && s.middle && s.ring && !s.pinky && !s.thumb) {
    return { gesture: "ThreeFingers", confidence: 0.9 };
  }
  return null;
}
