/**
 * Exponential Moving Average (EMA) position smoother to eliminate hand movement jitter.
 */
export class PointSmoother {
  /**
   * @param {number} [alpha=0.35] - Smoothing factor between 0 (smoothest/laggy) and 1 (instant/jittery).
   */
  constructor(alpha = 0.35) {
    this.alpha = alpha;
    this.prevX = null;
    this.prevY = null;
  }

  /**
   * Update and return smoothed coordinates.
   * @param {number} x - Raw target X
   * @param {number} y - Raw target Y
   * @returns {{x: number, y: number}} Smoothed coordinates
   */
  smooth(x, y) {
    if (this.prevX === null || this.prevY === null) {
      this.prevX = x;
      this.prevY = y;
      return { x, y };
    }

    const smoothedX = x * this.alpha + this.prevX * (1 - this.alpha);
    const smoothedY = y * this.alpha + this.prevY * (1 - this.alpha);

    this.prevX = smoothedX;
    this.prevY = smoothedY;

    return { x: smoothedX, y: smoothedY };
  }

  /**
   * Reset smoother state when hand tracking is lost to prevent cursor snapping.
   */
  reset() {
    this.prevX = null;
    this.prevY = null;
  }
}
