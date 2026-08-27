const { app, BrowserWindow, ipcMain, screen, session, Tray, Menu, globalShortcut, nativeImage } = require("electron");
const path = require("path");

// ─── Background Execution & Performance Switches ─────────────────────────────
// DPI Awareness (important on Windows with scaling like 125%)
app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

// GPU / WebGL flags for MediaPipe WASM
app.commandLine.appendSwitch("use-angle", "swiftshader-webgl");
app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

// Disable Chromium throttling when window is unfocused or minimized
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-renderer-backgrounding");

// ─── nut.js bootstrap ────────────────────────────────────────────────────────
let mouse, keyboard, Button, Key, Point;

try {
  const nut = require("@nut-tree-fork/nut-js");

  mouse = nut.mouse;
  keyboard = nut.keyboard;
  Button = nut.Button;
  Key = nut.Key;
  Point = nut.Point;

  if (mouse?.config) mouse.config.autoDelayMs = 0;
  if (keyboard?.config) keyboard.config.autoDelayMs = 0;

  console.log("[main] nut-js loaded successfully.");
} catch (e) {
  console.warn("[main] nut-js not available:", e.message);
}

let mainWindow;
let tray = null;
let isQuitting = false;
let isTrackingPaused = false;

// ─── Tray & Menu Management ──────────────────────────────────────────────────
function createTrayIcon() {
  // 16x16 cyan dot PNG Data URI for system tray
  const iconDataUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADpJREFUOE9jZKAQMFKon2HUAIZRA0jRjA8zM/9nRPNn/P8PAwb9N2IQkGYGhoxRAxg1gGzQAAYeBgYGABT+EwzDypcAAAAAAElFTkSuQmCC";
  const icon = nativeImage.createFromDataURL(iconDataUri);
  tray = new Tray(icon);
  tray.setToolTip("Hand Controller Pro - Global Virtual Mouse");

  updateTrayMenu();

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Hand Controller Pro",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Show App",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: isTrackingPaused ? "Resume Tracking" : "Pause Tracking",
      click: () => {
        toggleTracking();
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function toggleTracking() {
  isTrackingPaused = !isTrackingPaused;
  updateTrayMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("tracking:toggle", !isTrackingPaused);
  }
}

function toggleCursorPause() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("cursor:toggle-pause");
  }
}

// ─── Window Creation ─────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Hand Controller Pro",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      experimentalFeatures: true,
      // CRITICAL: Keeps requestAnimationFrame & MediaPipe running while window is minimized/unfocused
      backgroundThrottling: false,
    },
    autoHideMenuBar: true,
    backgroundColor: "#0a0a0a",
  });

  mainWindow.maximize();

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  const devUrl =
    process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

  if (!app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Intercept window close → hide to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler(
      (webContents, permission, callback) => callback(true)
    );

    session.defaultSession.setPermissionCheckHandler(() => true);
  }

  createWindow();
  createTrayIcon();

  // Register Global Shortcuts
  // Ctrl+Shift+H -> Toggle tracking
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    toggleTracking();
  });

  // Ctrl+Shift+P -> Toggle cursor pause
  globalShortcut.register("CommandOrControl+Shift+P", () => {
    toggleCursorPause();
  });

  // Ctrl+Shift+Q -> Quit application
  globalShortcut.register("CommandOrControl+Shift+Q", () => {
    isQuitting = true;
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Safe IPC wrapper
function safeHandler(fn) {
  return async (event, ...args) => {
    try {
      await fn(event, ...args);
    } catch (e) {
      console.error("[IPC Error]", e);
    }
  };
}

// ─── Tracking State Sync IPC ────────────────────────────────────────────────
ipcMain.on("tracking:state-sync", (event, isTracking) => {
  isTrackingPaused = !isTracking;
  updateTrayMenu();
});

// ─── Screen ──────────────────────────────────────────────────────────────────
ipcMain.handle("screen:get-size", () => {
  const display = screen.getPrimaryDisplay();
  return {
    width: Math.round(display.bounds.width * display.scaleFactor),
    height: Math.round(display.bounds.height * display.scaleFactor),
  };
});

// ─── Mouse ───────────────────────────────────────────────────────────────────
ipcMain.on(
  "mouse:move",
  safeHandler(async (event, { x, y }) => {
    if (!mouse || !Point) return;
    const target = new Point(Math.round(x), Math.round(y));
    await mouse.setPosition(target);
  })
);

ipcMain.on(
  "mouse:click",
  safeHandler(async (event, btn) => {
    if (!mouse) return;
    if (btn === "right") {
      await mouse.rightClick();
    } else {
      await mouse.leftClick();
    }
  })
);

ipcMain.on(
  "mouse:doubleClick",
  safeHandler(async () => {
    if (!mouse) return;
    await mouse.doubleClick(Button.LEFT);
  })
);

ipcMain.on(
  "mouse:down",
  safeHandler(async (event, btn) => {
    if (!mouse || !Button) return;
    const b = btn === "right" ? Button.RIGHT : Button.LEFT;
    await mouse.pressButton(b);
  })
);

ipcMain.on(
  "mouse:up",
  safeHandler(async (event, btn) => {
    if (!mouse || !Button) return;
    const b = btn === "right" ? Button.RIGHT : Button.LEFT;
    await mouse.releaseButton(b);
  })
);

ipcMain.on(
  "mouse:scroll",
  safeHandler(async (event, delta) => {
    if (!mouse) return;
    const amount = Math.max(1, Math.abs(Math.round(delta)));
    if (delta > 0) {
      await mouse.scrollDown(amount);
    } else {
      await mouse.scrollUp(amount);
    }
  })
);

// ─── Keyboard ────────────────────────────────────────────────────────────────
const KEY_MAP = {
  control: "LeftControl",
  ctrl: "LeftControl",
  alt: "LeftAlt",
  shift: "LeftShift",
  super: "LeftWin",
  win: "LeftWin",
  meta: "LeftMeta",

  escape: "Escape",
  enter: "Return",
  return: "Return",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",

  a: "A", b: "B", c: "C", d: "D", e: "E", f: "F", g: "G", h: "H",
  i: "I", j: "J", k: "K", l: "L", m: "M", n: "N", o: "O", p: "P",
  q: "Q", r: "R", s: "S", t: "T", u: "U", v: "V", w: "W", x: "X",
  y: "Y", z: "Z",
};

function toNutKey(keyStr) {
  if (!Key) return null;
  const name = KEY_MAP[keyStr.toLowerCase()];
  if (!name) return null;
  return Key[name] ?? null;
}

ipcMain.on(
  "key:press",
  safeHandler(async (event, key) => {
    if (!keyboard) return;
    const k = toNutKey(key);
    if (k !== null) {
      await keyboard.pressKey(k);
      await keyboard.releaseKey(k);
    }
  })
);

ipcMain.on(
  "key:shortcut",
  safeHandler(async (event, keys) => {
    if (!keyboard) return;
    const nutKeys = keys.map(toNutKey).filter(Boolean);
    if (!nutKeys.length) return;
    await keyboard.pressKey(...nutKeys);
    await keyboard.releaseKey(...nutKeys);
  })
);

// ─── Media controls ──────────────────────────────────────────────────────────
const MEDIA_KEY_MAP = {
  playPause: "AudioPlay",
  volumeUp: "AudioVolUp",
  volumeDown: "AudioVolDown",
  nextTrack: "AudioNext",
  prevTrack: "AudioPrev",
  mute: "AudioMute",
};

ipcMain.on(
  "media:control",
  safeHandler(async (event, cmd) => {
    if (!keyboard || !Key) return;
    const keyName = MEDIA_KEY_MAP[cmd];
    if (!keyName) return;
    const k = Key[keyName];
    if (k === undefined) {
      console.warn("[media] Key not found:", keyName);
      return;
    }
    await keyboard.pressKey(k);
    await keyboard.releaseKey(k);
  })
);

// ─── Window management ───────────────────────────────────────────────────────
ipcMain.on("window:action", (event, action) => {
  const wins = BrowserWindow.getAllWindows();
  if (!wins.length) return;
  const win = wins[0];

  switch (action) {
    case "minimize":
      win.minimize();
      break;
    case "maximize":
      win.maximize();
      break;
    case "restore":
      win.restore();
      break;
    case "close":
      win.close();
      break;
    case "switchNext":
      if (keyboard && Key) {
        (async () => {
          try {
            await keyboard.pressKey(Key.LeftAlt, Key.Tab);
            await new Promise((r) => setTimeout(r, 150));
            await keyboard.releaseKey(Key.LeftAlt, Key.Tab);
          } catch (e) {
            console.error("[window:switchNext]", e);
          }
        })();
      }
      break;
  }
});