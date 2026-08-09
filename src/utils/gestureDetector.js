import { getNormalizedDistance } from "./cursorMath";

const LEFT_PINCH_THRESHOLD = 0.055;
const RIGHT_PINCH_THRESHOLD = 0.055;

export class GestureDetector {
  constructor() {
    this.wasPinching = false;
    this.wasRightClicking = false;
    this.lastScrollY = null;
  }

  /**
   * Analyzes landmarks to detect pinch clicks, drag mode, and scroll gestures.
   * @param {Array<{x: number, y: number, z: number}>} landmarks 
   * @returns {Object} Detected gesture state
   */
  detect(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      this.reset();
      return {
        isHandPresent: false,
        cursorLandmark: null,
        isPinching: false,
        leftClickTriggered: false,
        rightClickTriggered: false,
        isDragging: false,
        dragReleased: false,
        isScrolling: false,
        scrollDelta: 0,
        clickState: "Idle",
      };
    }

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // 1. Measure pinch distances
    const thumbIndexDist = getNormalizedDistance(thumbTip, indexTip);
    const thumbMiddleDist = getNormalizedDistance(thumbTip, middleTip);

    const isPinching = thumbIndexDist < LEFT_PINCH_THRESHOLD;
    const isRightClicking = thumbMiddleDist < RIGHT_PINCH_THRESHOLD;

    let leftClickTriggered = false;
    let dragReleased = false;
    let isDragging = false;

    // Drag mode: Hold thumb-index pinch
    if (isPinching) {
      if (!this.wasPinching) {
        leftClickTriggered = true; // Initial Left Click / Down
      }
      isDragging = true;
    } else {
      if (this.wasPinching) {
        dragReleased = true; // Pinch released
      }
    }

    this.wasPinching = isPinching;

    // Right Click trigger
    let rightClickTriggered = false;
    if (isRightClicking && !this.wasRightClicking) {
      rightClickTriggered = true;
    }
    this.wasRightClicking = isRightClicking;

    // 2. Detect Two-Finger Scroll Gesture (Index + Middle extended, Ring + Pinky folded)
    const indexExtended = indexTip.y < landmarks[6].y;
    const middleExtended = middleTip.y < landmarks[10].y;
    const ringFolded = ringTip.y > landmarks[14].y;
    const pinkyFolded = pinkyTip.y > landmarks[18].y;

    let isScrolling = false;
    let scrollDelta = 0;

    if (
      indexExtended &&
      middleExtended &&
      ringFolded &&
      pinkyFolded &&
      !isPinching &&
      !isRightClicking
    ) {
      const avgY = (indexTip.y + middleTip.y) / 2;
      if (this.lastScrollY !== null) {
        const diff = avgY - this.lastScrollY;
        if (Math.abs(diff) > 0.012) {
          scrollDelta = diff * 80; // Positive = Scroll Down, Negative = Scroll Up
          isScrolling = true;
        }
      }
      this.lastScrollY = avgY;
    } else {
      this.lastScrollY = null;
    }

    // Determine UI display status string
    let clickState = "Idle";
    if (isDragging) clickState = "Drag";
    else if (leftClickTriggered) clickState = "Left Click";
    else if (rightClickTriggered || isRightClicking) clickState = "Right Click";
    else if (isScrolling) clickState = scrollDelta > 0 ? "Scroll Down" : "Scroll Up";

    return {
      isHandPresent: true,
      cursorLandmark: indexTip,
      isPinching,
      leftClickTriggered,
      rightClickTriggered,
      isDragging,
      dragReleased,
      isScrolling,
      scrollDelta,
      clickState,
    };
  }

  /**
   * Reset gesture tracking states when hand is lost.
   */
  reset() {
    this.wasPinching = false;
    this.wasRightClicking = false;
    this.lastScrollY = null;
  }
}
