import { drawConnections } from "./drawConnections";
import { drawLandmarks } from "./drawLandmarks";
import { toPixelCoords } from "./handMath";

/**
 * Renders hand skeleton, index cursor overlay circle, and pinch feedback.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<{x: number, y: number, z: number}>} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {Object} [meta] - { handIndex, gestureState }
 */
export function drawHand(ctx, landmarks, width, height, meta = {}) {
  if (!landmarks || landmarks.length === 0) return;

  const { gestureState = null } = meta;

  // 1. Draw Skeleton Connections
  drawConnections(ctx, landmarks, width, height, {
    color: "rgba(255, 255, 255, 0.4)",
    lineWidth: 3,
  });

  // 2. Draw Landmark Keypoints
  drawLandmarks(ctx, landmarks, width, height, {
    jointColor: "#888888",
    tipColor: "#ffffff",
    borderColor: "#000000",
    jointRadius: 3,
    tipRadius: 5,
  });

  // 3. Draw Clean Circular Cursor Overlay on Index Finger Tip (Landmark 8)
  if (landmarks[8]) {
    const indexPixel = toPixelCoords(landmarks[8], width, height);

    ctx.save();

    // Outer smooth circular cursor ring
    ctx.beginPath();
    ctx.arc(indexPixel.x, indexPixel.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner cursor dot
    ctx.beginPath();
    ctx.arc(indexPixel.x, indexPixel.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
  }

  // 4. Draw Pinch Line Feedback
  if (gestureState && landmarks[4]) {
    const thumbPixel = toPixelCoords(landmarks[4], width, height);

    if (gestureState.isPinching && landmarks[8]) {
      const indexPixel = toPixelCoords(landmarks[8], width, height);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(thumbPixel.x, thumbPixel.y);
      ctx.lineTo(indexPixel.x, indexPixel.y);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    if (gestureState.isRightClicking && landmarks[12]) {
      const middlePixel = toPixelCoords(landmarks[12], width, height);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(thumbPixel.x, thumbPixel.y);
      ctx.lineTo(middlePixel.x, middlePixel.y);
      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }
}
