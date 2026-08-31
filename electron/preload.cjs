const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Mouse
  mouseMove:        (x, y)  => ipcRenderer.send("mouse:move", { x, y }),
  mouseLeftClick:   ()      => ipcRenderer.send("mouse:click", "left"),
  mouseRightClick:  ()      => ipcRenderer.send("mouse:click", "right"),
  mouseDoubleClick: ()      => ipcRenderer.send("mouse:doubleClick"),
  mouseDown:        ()      => ipcRenderer.send("mouse:down", "left"),
  mouseUp:          ()      => ipcRenderer.send("mouse:up",   "left"),
  mouseScroll:      (delta) => ipcRenderer.send("mouse:scroll", delta),

  // Keyboard
  pressKey:         (key)   => ipcRenderer.send("key:press", key),
  pressShortcut:    (keys)  => ipcRenderer.send("key:shortcut", keys),

  // Media
  mediaControl:     (cmd)   => ipcRenderer.send("media:control", cmd),

  // Window management
  windowAction:     (action) => ipcRenderer.send("window:action", action),

  // Screen
  getScreenSize:    ()      => ipcRenderer.invoke("screen:get-size"),

  // Background Utility & Tray IPC Events
  onToggleTracking: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on("tracking:toggle", handler);
    return () => ipcRenderer.removeListener("tracking:toggle", handler);
  },
  onToggleCursorPause: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("cursor:toggle-pause", handler);
    return () => ipcRenderer.removeListener("cursor:toggle-pause", handler);
  },
  syncTrackingState: (isTracking) => {
    ipcRenderer.send("tracking:state-sync", isTracking);
  },
});
