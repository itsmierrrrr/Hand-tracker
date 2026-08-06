import { toPixelCoords } from "./handMath";

/**
 * Official MediaPipe Hand Connections (21 pairs connecting wrist, palm, and fingers)
 */
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  // Index Finger
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  // Middle Finger
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  // Ring Finger
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  // Pinky Finger
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  // Palm Base Closure
  [0, 17],
];

/**
 * Draws skeleton connections for a hand.
 * @param {CanvasRenderingContext2D} ctx - 2D Canvas Context
 * @param {Array<{x: number, y: number, z: number}>} landmarks - Array of 21 landmark objects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} [options] - Styling options (color, lineWidth)
 */
export function drawConnections(ctx, landmarks, width, height, options = {}) {
  const { color = "rgba(0, 229, 255, 0.8)", lineWidth = 4 } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    if (p1 && p2) {
      const startPixel = toPixelCoords(p1, width, height);
      const endPixel = toPixelCoords(p2, width, height);

      ctx.beginPath();
      ctx.moveTo(startPixel.x, startPixel.y);
      ctx.lineTo(endPixel.x, endPixel.y);
      ctx.stroke();
    }
  });

  ctx.restore();
}
