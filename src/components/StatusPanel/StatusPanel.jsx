import "./StatusPanel.css";

function Row({ label, value, className = "" }) {
  return (
    <div className="status-row">
      <span className="status-key">{label}</span>
      <span className={`status-val ${className}`}>{value}</span>
    </div>
  );
}

/**
 * @param {{
 *   cameraReady: boolean,
 *   handCount: number,
 *   gesture: string,
 *   confidence: number,
 *   fps: number,
 *   cursorPos: {x:number, y:number},
 *   clickStatus: string,
 *   cursorPaused: boolean,
 * }} props
 */
function StatusPanel({ cameraReady, handCount, gesture, confidence, fps, cursorPos, clickStatus, cursorPaused }) {
  const connected = handCount > 0;
  return (
    <aside className="status-panel">
      <div className="status-panel-header">Telemetry</div>

      <div className="status-group">
        <Row
          label="Camera"
          value={cameraReady ? "Active" : "Initializing"}
          className={cameraReady ? "success" : "warning"}
        />
        <Row
          label="Hand"
          value={connected ? `${handCount} detected` : "Not found"}
          className={connected ? "active" : "idle"}
        />
        <Row
          label="Cursor"
          value={cursorPaused ? "Paused" : "Tracking"}
          className={cursorPaused ? "warning" : "active"}
        />
      </div>

      <div className="status-group">
        <Row label="Gesture" value={gesture || "–"} className={gesture && gesture !== "–" ? "active" : "idle"} />
        <div>
          <Row label="Confidence" value={`${Math.round(confidence * 100)}%`} />
          <div className="confidence-bar-wrapper">
            <div className="confidence-bar" style={{ width: `${Math.round(confidence * 100)}%` }} />
          </div>
        </div>
        <Row label="Click" value={clickStatus || "Idle"} className={clickStatus && clickStatus !== "Idle" ? "active" : "idle"} />
      </div>

      <div className="status-group">
        <Row label="Cursor X" value={cursorPos?.x ?? "–"} />
        <Row label="Cursor Y" value={cursorPos?.y ?? "–"} />
        <div>
          <Row label="FPS" value={`${fps ?? 0}`} className={fps >= 50 ? "success" : fps >= 25 ? "warning" : "idle"} />
          <div className="fps-bar-wrapper">
            <div className="fps-bar" style={{ width: `${Math.min(100, ((fps ?? 0) / 60) * 100)}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default StatusPanel;
