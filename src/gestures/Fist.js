/**
 * @fileoverview Fist gesture — all fingers curled.
 * Action: Pause cursor tracking
 */
import { getFingerState, countExtended } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const state = getFingerState(landmarks);
  const extended = countExtended(state, false); // thumb not counted
  if (extended === 0 && !state.thumb) {
    return { gesture: "Fist", confidence: 1.0 };
  }
  return null;
}
