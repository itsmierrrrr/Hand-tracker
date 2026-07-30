/**
 * @fileoverview ThumbDown gesture — thumb down, all other fingers curled.
 * Action: Volume Down
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

  const thumbTip = landmarks[4];
  const wrist    = landmarks[0];
  // Thumb down: tip is BELOW wrist
  const thumbDown = state.thumb && thumbTip.y > wrist.y;

  if (thumbDown && fingersExtended === 0) {
    return { gesture: "ThumbDown", confidence: 0.9 };
  }
  return null;
}
