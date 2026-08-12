import "./Settings.css";
import { resetSettings } from "../../config/appConfig.js";

/** Reusable slider row */
function SliderRow({ label, settingKey, min, max, step, value, onChange, format }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <input
        type="range"
        className="settings-slider"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(settingKey, parseFloat(e.target.value))}
      />
      <span className="settings-value">{format ? format(value) : value}</span>
    </div>
  );
}

/** Reusable toggle row */
function ToggleRow({ label, settingKey, value, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(settingKey, e.target.checked)}
        />
        <span className="toggle-track" />
      </label>
    </div>
  );
}

/**
 * @param {{ settings: object, onChange: (key: string, val: any) => void }} props
 */
function Settings({ settings, onChange }) {
  const handleReset = () => {
    const defaults = resetSettings();
    Object.entries(defaults).forEach(([k, v]) => onChange(k, v));
  };

  return (
    <div className="settings-panel">
      <div>
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Adjust tracking and feature configuration.</p>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Mouse Control</div>
        <SliderRow label="Cursor Speed"     settingKey="cursorSpeed"     min={0.5} max={4}   step={0.1} value={settings.cursorSpeed}     onChange={onChange} format={v => `${v}×`} />
        <SliderRow label="Smoothing"        settingKey="smoothing"       min={0.1} max={1}   step={0.05} value={settings.smoothing}      onChange={onChange} format={v => `${Math.round(v * 100)}%`} />
        <SliderRow label="Pinch Threshold"  settingKey="pinchThreshold"  min={0.02} max={0.15} step={0.005} value={settings.pinchThreshold} onChange={onChange} format={v => v.toFixed(3)} />
        <SliderRow label="Scroll Speed"     settingKey="scrollSpeed"     min={10} max={200}  step={5}   value={settings.scrollSpeed}     onChange={onChange} />
        <SliderRow label="Click Delay (ms)" settingKey="clickDelay"      min={100} max={600} step={20}  value={settings.clickDelay}      onChange={onChange} format={v => `${v}ms`} />
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Features</div>
        <ToggleRow label="Enable Cursor"          settingKey="enableCursor"          value={settings.enableCursor}          onChange={onChange} />
        <ToggleRow label="Enable Keyboard Gestures" settingKey="enableKeyboard"      value={settings.enableKeyboard}        onChange={onChange} />
        <ToggleRow label="Enable Media Controls"  settingKey="enableMedia"           value={settings.enableMedia}           onChange={onChange} />
        <ToggleRow label="Enable Window Controls" settingKey="enableWindowControls"  value={settings.enableWindowControls}  onChange={onChange} />
        <ToggleRow label="Mirror Camera"          settingKey="mirrorCamera"          value={settings.mirrorCamera}          onChange={onChange} />
        <ToggleRow label="Show Cursor Overlay"    settingKey="showCursorOverlay"     value={settings.showCursorOverlay}     onChange={onChange} />
      </div>

      <button className="settings-reset-btn" onClick={handleReset}>
        Reset to Defaults
      </button>
    </div>
  );
}

export default Settings;
