/**
 * @fileoverview OpenPalm gesture — all 5 fingers extended.
 * Actions: Escape / Play-Pause
 */
import { getFingerState, countExtended } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const state = getFingerState(landmarks);
  const extended = countExtended(state, true); // thumb included
  if (extended >= 5) {
    return { gesture: "OpenPalm", confidence: extended / 5 };
  }
  return null;
}
