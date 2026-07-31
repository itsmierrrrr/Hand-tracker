/**
 * @fileoverview ThumbUp gesture — thumb up, all other fingers curled.
 * Action: Enter / Volume Up
 */
import { getFingerState, countExtended } from "../utils/fingerState.js";

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ gesture: string, confidence: number } | null}
 */
export function detect(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const state = getFingerState(landmarks);
  const fingersExtended = countExtended(state, false);

  // Thumb up: thumb extended, tip above wrist Y, fingers curled
  const thumbTip  = landmarks[4];
  const wrist     = landmarks[0];
  const thumbUp   = state.thumb && thumbTip.y < wrist.y;

  if (thumbUp && fingersExtended === 0) {
    return { gesture: "ThumbUp", confidence: 0.9 };
  }
  return null;
}
