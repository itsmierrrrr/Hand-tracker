const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let mouse, Button, Point;

try {
  const nut = require("@nut-tree-fork/nut-js");
  mouse = nut.mouse;
  Button = nut.Button;
  Point = nut.Point;
  
  // Disable artificial delay for maximum 60 FPS responsiveness
  if (mouse && mouse.config) {
    mouse.config.autoDelayMs = 0;
  }
} catch (err) {
  console.warn("nut.js desktop automation library not loaded, using fallback:", err.message);
}

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(850, height),
    title: "Virtual Mouse",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Desktop Automation Handlers
ipcMain.handle("screen:get-size", () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.bounds;
});

ipcMain.on("mouse:move", async (event, { x, y }) => {
  try {
    if (!mouse || !Point) return;

    const targetX = Math.round(x);
    const targetY = Math.round(y);

    await mouse.setPosition(new Point(targetX, targetY));

    const actual = await mouse.getPosition();

    console.log(
      `Requested: (${targetX}, ${targetY}) | Actual: (${actual.x}, ${actual.y})`
    );
  } catch (err) {
    console.error("Mouse Move Error:", err);
  }
});

ipcMain.on("mouse:click", async (event, button) => {
  try {
    if (mouse) {
      if (button === "right") {
        await mouse.rightClick();
      } else {
        await mouse.leftClick();
      }
    }
  } catch (err) {
    console.error("IPC Mouse Click Error:", err);
  }
});

ipcMain.on("mouse:down", async (event, button) => {
  try {
    if (mouse && Button) {
      const btn = button === "right" ? Button.RIGHT : Button.LEFT;
      await mouse.pressButton(btn);
    }
  } catch (err) {
    console.error("IPC Mouse Down Error:", err);
  }
});

ipcMain.on("mouse:up", async (event, button) => {
  try {
    if (mouse && Button) {
      const btn = button === "right" ? Button.RIGHT : Button.LEFT;
      await mouse.releaseButton(btn);
    }
  } catch (err) {
    console.error("IPC Mouse Up Error:", err);
  }
});

ipcMain.on("mouse:scroll", async (event, deltaY) => {
  try {
    if (mouse) {
      const amount = Math.max(1, Math.abs(Math.round(deltaY)));
      if (deltaY > 0) {
        await mouse.scrollDown(amount);
      } else {
        await mouse.scrollUp(amount);
      }
    }
  } catch (err) {
    console.error("IPC Mouse Scroll Error:", err);
  }
});
