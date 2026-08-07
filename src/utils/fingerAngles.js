/**
 * @fileoverview Finger angle computation from MediaPipe hand landmarks.
 * Used by gesture detectors to evaluate joint flexion.
 */

/**
 * Compute the angle (in degrees) at joint `b` formed by points a–b–c.
 * @param {{x:number,y:number,z:number}} a
 * @param {{x:number,y:number,z:number}} b
 * @param {{x:number,y:number,z:number}} c
 * @returns {number} Angle in degrees [0, 180]
 */
export function angleBetween(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.hypot(ab.x, ab.y, ab.z);
  const magCB = Math.hypot(cb.x, cb.y, cb.z);

  if (magAB === 0 || magCB === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Compute the average flexion angle across all knuckle joints of a finger.
 * @param {Array<{x:number,y:number,z:number}>} landmarks - All 21 landmarks
 * @param {number[]} indices - Three joint indices [MCP, PIP, DIP/TIP]
 * @returns {number} Average angle in degrees
 */
export function fingerFlexionAngle(landmarks, indices) {
  if (indices.length < 3) return 180;
  const angles = [];
  for (let i = 0; i < indices.length - 2; i++) {
    angles.push(angleBetween(
      landmarks[indices[i]],
      landmarks[indices[i + 1]],
      landmarks[indices[i + 2]],
    ));
  }
  return angles.reduce((s, a) => s + a, 0) / angles.length;
}
