/**
 * @fileoverview RockGesture — index + pinky extended, others curled (devil horns).
 * Action: Screenshot (Win+Shift+S)
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  if (s.index && s.pinky && !s.middle && !s.ring) {
    return { gesture: "RockGesture", confidence: 0.9 };
  }
  return null;
}
