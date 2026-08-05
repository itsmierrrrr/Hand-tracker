/**
 * Cursor mapping utilities.
 * Maps MediaPipe normalized index finger tip coordinates (0–1)
 * directly into full desktop screen coordinates.
 */

export function mapLandmarkToScreen(landmark, screenWidth, screenHeight, margin = 0.12) {
  if (!landmark) {
    return { x: 0, y: 0 };
  }

  // Normalize X and Y into [0, 1] within the active camera zone [margin, 1 - margin]
  // This allows the index finger to easily reach all edges/corners of the monitor.
  const normX = clamp((landmark.x - margin) / (1 - 2 * margin), 0, 1);
  const normY = clamp((landmark.y - margin) / (1 - 2 * margin), 0, 1);

  // Mirror X because the webcam feed is mirrored horizontally
  return {
    x: Math.round((1 - normX) * (screenWidth - 1)),
    y: Math.round(normY * (screenHeight - 1)),
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getNormalizedDistance(p1, p2) {
  if (!p1 || !p2) return Infinity;

  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;

  return Math.sqrt(dx * dx + dy * dy);
}