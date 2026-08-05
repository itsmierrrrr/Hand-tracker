import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

let handLandmarkerInstance = null;

/**
 * Initializes and returns the MediaPipe HandLandmarker instance.
 * Reuses existing instance if already created.
 *
 * IMPORTANT: MediaPipe Tasks Vision WASM uses WebGL internally even on CPU
 * delegate. We create a hidden canvas to ensure the GL context is available
 * before MediaPipe initializes.
 *
 * @returns {Promise<HandLandmarker>}
 */
export async function createHandDetector() {
  if (handLandmarkerInstance) {
    return handLandmarkerInstance;
  }

  // Ensure a WebGL context exists so MediaPipe WASM can bind GL functions
  let glCanvas = document.getElementById("__mediapipe_gl_canvas__");
  if (!glCanvas) {
    glCanvas = document.createElement("canvas");
    glCanvas.id = "__mediapipe_gl_canvas__";
    glCanvas.width = 1;
    glCanvas.height = 1;
    glCanvas.style.cssText = "position:fixed;opacity:0;pointer-events:none;top:0;left:0;";
    document.body.appendChild(glCanvas);
  }

  // Force WebGL context creation before WASM loads
  const gl = glCanvas.getContext("webgl2") || glCanvas.getContext("webgl");
  if (!gl) {
    console.warn("[handDetector] WebGL not available — MediaPipe may fail.");
  } else {
    console.log("[handDetector] WebGL context ready:", gl.constructor.name);
  }

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    console.log("[handDetector] HandLandmarker initialized successfully.");
    return handLandmarkerInstance;
  } catch (error) {
    console.error("[handDetector] Failed to initialize:", error);
    throw error;
  }
}