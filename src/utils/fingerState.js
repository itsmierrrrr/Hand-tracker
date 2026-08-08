/**
 * @fileoverview Determine extension/curl state for each of the five fingers.
 * All gesture detectors import from here — single source of truth.
 */

// MediaPipe landmark index sets for each finger
const FINGER_JOINTS = {
  thumb:  [1, 2, 3, 4],
  index:  [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring:   [13, 14, 15, 16],
  pinky:  [17, 18, 19, 20],
};

/**
 * Returns true when the fingertip Y coord is above (smaller Y) the base joint.
 * For thumb we compare X spread vs. the wrist to handle side-facing hands.
 *
 * @param {Array<{x:number,y:number,z:number}>} lm - 21 MediaPipe landmarks
 * @param {string} finger - "thumb"|"index"|"middle"|"ring"|"pinky"
 * @returns {boolean}
 */
export function isFingerExtended(lm, finger) {
  const joints = FINGER_JOINTS[finger];
  if (!joints) return false;

  const tip  = lm[joints[joints.length - 1]];
  const base = lm[joints[0]];

  if (finger === "thumb") {
    // Thumb is extended when tip is further from palm centre than MCP
    const palmCenter = lm[9]; // Middle MCP as palm reference
    const tipDist  = Math.hypot(tip.x  - palmCenter.x, tip.y  - palmCenter.y);
    const baseDist = Math.hypot(base.x - palmCenter.x, base.y - palmCenter.y);
    return tipDist > baseDist * 1.1;
  }

  // For all other fingers: tip Y < base joint Y means extended (hand upright)
  return tip.y < base.y;
}

/**
 * Snapshot of extension state for all five fingers.
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 * @returns {{ thumb:boolean, index:boolean, middle:boolean, ring:boolean, pinky:boolean }}
 */
export function getFingerState(landmarks) {
  return {
    thumb:  isFingerExtended(landmarks, "thumb"),
    index:  isFingerExtended(landmarks, "index"),
    middle: isFingerExtended(landmarks, "middle"),
    ring:   isFingerExtended(landmarks, "ring"),
    pinky:  isFingerExtended(landmarks, "pinky"),
  };
}

/**
 * Count how many fingers are extended (thumb excluded by default).
 * @param {ReturnType<typeof getFingerState>} state
 * @param {boolean} [includeThumb=false]
 * @returns {number}
 */
export function countExtended(state, includeThumb = false) {
  const keys = includeThumb
    ? ["thumb", "index", "middle", "ring", "pinky"]
    : ["index", "middle", "ring", "pinky"];
  return keys.filter((k) => state[k]).length;
}
