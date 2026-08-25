import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import StatusPanel from "./components/StatusPanel/StatusPanel.jsx";
import Settings from "./components/Settings/Settings.jsx";
import LogPanel, { ACTION_MAP } from "./components/LogPanel/LogPanel.jsx";
import useCamera from "./hooks/useCamera.js";
import useHandTracker from "./hooks/useHandTracker.js";
import useDetectionLoop from "./hooks/useDetectionLoop.js";
import { loadSettings, saveSettings } from "./config/appConfig.js";
import "./App.css";

// ── Tab content panels (for non-camera tabs) ────────────────────────────────
function GestureCheatSheet({ title, rows }) {
  return (
    <div className="cheat-sheet">
      <h2 className="cheat-title">{title}</h2>
      <div className="cheat-table">
        {rows.map(([gesture, action]) => (
          <div key={gesture} className="cheat-row">
            <span className="cheat-gesture">{gesture}</span>
            <span className="cheat-arrow">→</span>
            <span className="cheat-action">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOUSE_ROWS = [
  ["Index Tip", "Move Cursor"],
  ["Pinch Tap (Thumb + Index)", "Left Click"],
  ["Pinch + Drag Laterally", "Click & Drag"],
  ["Quick Double Pinch", "Double Click"],
  ["Pinch + Move Up / Down", "Scroll Up / Down"],
  ["Thumb + Middle Pinch", "Right Click"],
  ["Fist", "Pause / Resume Cursor"],
];
const KB_ROWS = [
  ["Open Palm", "Escape"],
  ["Thumb Up", "Enter"],
  ["Peace", "Alt + Tab"],
  ["Three Fingers", "Windows Key"],
  ["OK Gesture", "Copy (Ctrl+C)"],
  ["Call Gesture", "Paste (Ctrl+V)"],
  ["Rock Gesture", "Screenshot (Win+Shift+S)"],
];
const MEDIA_ROWS = [
  ["Four Fingers", "Play / Pause"],
  ["Thumb Up", "Volume Up"],
  ["Thumb Down", "Volume Down"],
  ["Swipe Left", "Previous Track"],
  ["Swipe Right", "Next Track"],
];

// ── Main App ────────────────────────────────────────────────────────────────
const MAX_LOGS = 60;

function formatTime() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settings, setSettings] = useState(loadSettings);

  const { detector, isLoading: isModelLoading, error: modelError } = useHandTracker();
  const { videoRef, isCameraReady, cameraError } = useCamera();
  const canvasRef = useRef(null);

  // Telemetry state — updated by rAF callback, but with throttling inside hook
  const [telemetry, setTelemetry] = useState({
    handCount: 0, gesture: "–", confidence: 0,
    fps: 0, cursorPos: { x: 0, y: 0 }, clickStatus: "Idle", cursorPaused: false,
  });

  // Log state
  const [logs, setLogs] = useState([]);
  const lastGestureRef = useRef(null);

  const handleTelemetry = useCallback((t) => {
    setTelemetry(t);
    // Only log when gesture changes
    if (t.gesture && t.gesture !== "–" && t.gesture !== lastGestureRef.current) {
      lastGestureRef.current = t.gesture;
      setLogs((prev) => {
        const next = [...prev, { time: formatTime(), gesture: t.gesture, action: ACTION_MAP[t.gesture] ?? "–" }];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    }
    if (!t.gesture || t.gesture === "–") lastGestureRef.current = null;
  }, []);

  const handleSettingChange = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      if (key === "trackingEnabled" && window.electronAPI?.syncTrackingState) {
        window.electronAPI.syncTrackingState(value);
      }
      return next;
    });
  }, []);

  // Sync background global shortcuts & system tray actions
  useEffect(() => {
    if (!window.electronAPI) return;

    const unbindTracking = window.electronAPI.onToggleTracking((forcedState) => {
      setSettings((prev) => {
        const currentTracking = prev.trackingEnabled !== false;
        const nextState = forcedState !== undefined ? forcedState : !currentTracking;
        const next = { ...prev, trackingEnabled: nextState };
        saveSettings(next);
        return next;
      });
    });

    const unbindCursor = window.electronAPI.onToggleCursorPause(() => {
      setSettings((prev) => {
        const next = { ...prev, enableCursor: !prev.enableCursor };
        saveSettings(next);
        return next;
      });
    });

    return () => {
      unbindTracking?.();
      unbindCursor?.();
    };
  }, []);

  useEffect(() => {
    if (window.electronAPI?.syncTrackingState) {
      window.electronAPI.syncTrackingState(settings.trackingEnabled !== false);
    }
  }, [settings.trackingEnabled]);

  const loopEnabled = Boolean(detector && isCameraReady && settings.trackingEnabled !== false);

  useDetectionLoop({
    detector,
    videoRef,
    canvasRef,
    enabled: loopEnabled,
    settings,
    onTelemetry: handleTelemetry,
  });

  const cameraReady = !cameraError && !modelError && isCameraReady && !isModelLoading;

  // Mirror style based on settings
  const mirrorStyle = useMemo(() => ({
    transform: settings.mirrorCamera ? "scaleX(-1)" : "none",
  }), [settings.mirrorCamera]);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main area */}
      <div className="app-main">
        {/* Center viewport */}
        <div className="app-center">
          <div className="viewport-wrapper">
            <video ref={videoRef} className="viewport-video" style={mirrorStyle} autoPlay playsInline muted />
            <canvas ref={canvasRef} className="viewport-canvas" style={mirrorStyle} />

            {/* Loading overlay */}
            {!cameraReady && (
              <div className="viewport-overlay">
                <div className="overlay-spinner" />
                <p className="overlay-text">
                  {modelError || cameraError
                    ? "Camera / model error. Check permissions."
                    : isModelLoading
                    ? "Loading AI model…"
                    : "Initializing camera…"}
                </p>
              </div>
            )}

            {/* Gesture badge */}
            {telemetry.gesture && telemetry.gesture !== "–" && (
              <div className="gesture-badge">{telemetry.gesture}</div>
            )}

            {/* Cursor paused badge */}
            {telemetry.cursorPaused && (
              <div className="paused-badge">⏸ Cursor Paused</div>
            )}
          </div>

          {/* Tab panel below viewport */}
          <div className="tab-panel">
            {activeTab === "dashboard"  && <GestureCheatSheet title="Mouse Gestures"    rows={MOUSE_ROWS} />}
            {activeTab === "mouse"      && <GestureCheatSheet title="Mouse Control"      rows={MOUSE_ROWS} />}
            {activeTab === "keyboard"   && <GestureCheatSheet title="Keyboard Shortcuts" rows={KB_ROWS} />}
            {activeTab === "media"      && <GestureCheatSheet title="Media Controls"     rows={MEDIA_ROWS} />}
            {activeTab === "settings"   && <Settings settings={settings} onChange={handleSettingChange} />}
          </div>

          {/* Log panel */}
          <LogPanel logs={logs} />
        </div>

        {/* Right telemetry panel */}
        <StatusPanel
          cameraReady={cameraReady}
          handCount={telemetry.handCount}
          gesture={telemetry.gesture}
          confidence={telemetry.confidence}
          fps={telemetry.fps}
          cursorPos={telemetry.cursorPos}
          clickStatus={telemetry.clickStatus}
          cursorPaused={telemetry.cursorPaused}
        />
      </div>
    </div>
  );
}