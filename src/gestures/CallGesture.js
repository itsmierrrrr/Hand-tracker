/**
 * @fileoverview CallGesture — thumb + pinky extended, others curled.
 * Action: Paste (Ctrl+V)
 */
import { getFingerState } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const s = getFingerState(landmarks);

  if (s.thumb && s.pinky && !s.index && !s.middle && !s.ring) {
    return { gesture: "CallGesture", confidence: 0.9 };
  }
  return null;
}
