import { toPixelCoords } from "./handMath";

// Fingertip landmark indices: Thumb (4), Index (8), Middle (12), Ring (16), Pinky (20)
const FINGERTIP_INDICES = new Set([4, 8, 12, 16, 20]);

/**
 * Draws keypoint landmark dots for a single hand.
 * @param {CanvasRenderingContext2D} ctx - 2D Canvas Context
 * @param {Array<{x: number, y: number, z: number}>} landmarks - Array of 21 landmark objects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} [options] - Custom styling options
 */
export function drawLandmarks(ctx, landmarks, width, height, options = {}) {
  const {
    jointColor = "#ffffff",
    tipColor = "#ff007f",
    borderColor = "#000000",
    jointRadius = 4,
    tipRadius = 6,
  } = options;

  ctx.save();

  landmarks.forEach((point, index) => {
    const pixel = toPixelCoords(point, width, height);
    const isFingertip = FINGERTIP_INDICES.has(index);
    const radius = isFingertip ? tipRadius : jointRadius;
    const color = isFingertip ? tipColor : jointColor;

    // Draw outer subtle border/shadow for high visibility
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, radius + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Draw landmark circle
    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.restore();
}