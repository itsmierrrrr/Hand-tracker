/**
 * Mathematical utilities for hand tracking calculations.
 */

/**
 * Converts normalized landmark coordinates (0 to 1) to canvas pixel coordinates.
 * @param {Object} landmark - Normalized point { x, y, z }
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {{x: number, y: number}} Pixel coordinates
 */
export function toPixelCoords(landmark, width, height) {
  return {
    x: landmark.x * width,
    y: landmark.y * height,
  };
}

/**
 * Calculates Euclidean distance between two points in 2D space.
 * @param {{x: number, y: number}} p1 
 * @param {{x: number, y: number}} p2 
 * @returns {number} Distance in pixels
 */
export function distance2D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculates the midpoint between two points.
 * @param {{x: number, y: number}} p1 
 * @param {{x: number, y: number}} p2 
 * @returns {{x: number, y: number}} Midpoint
 */
export function getMidpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
