import { useEffect, useRef } from "react";
import "./LogPanel.css";

const ACTION_MAP = {
  OpenPalm:     "Escape",
  Fist:         "Toggle Cursor Pause",
  ThumbUp:      "Enter / Volume Up",
  ThumbDown:    "Volume Down",
  Peace:        "Alt+Tab",
  ThreeFingers: "Windows Key",
  OKGesture:    "Copy",
  CallGesture:  "Paste",
  RockGesture:  "Screenshot",
  PinchStart:   "Mouse Down",
  Drag:         "Dragging",
  PinchEnd:     "Mouse Up",
  DoubleClick:  "Double Click",
  RightClick:   "Right Click",
  SwipeLeft:    "Previous Track",
  SwipeRight:   "Next Track",
};

/**
 * @param {{ logs: Array<{time:string, gesture:string, action:string}> }} props
 */
function LogPanel({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="log-panel">
      <div className="log-panel-header">
        Event Log — Recent Gestures
      </div>
      <div className="log-list">
        {logs.map((entry, i) => (
          <div key={i} className="log-item">
            <span className="log-time">{entry.time}</span>
            <span className="log-gesture">{entry.gesture}</span>
            <span className="log-action">{entry.action ?? ACTION_MAP[entry.gesture] ?? "–"}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export { ACTION_MAP };
export default LogPanel;
