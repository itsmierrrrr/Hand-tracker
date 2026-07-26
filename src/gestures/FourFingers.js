/**
 * @fileoverview FourFingers gesture — index, middle, ring, pinky extended; thumb curled.
 * Action: Play / Pause media.
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  // All four fingers extended, thumb curled
  if (s.index && s.middle && s.ring && s.pinky && !s.thumb) {
    return { gesture: "FourFingers", confidence: 0.9 };
  }
  return null;
}
